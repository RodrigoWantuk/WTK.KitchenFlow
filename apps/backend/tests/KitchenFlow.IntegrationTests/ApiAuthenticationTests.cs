using System.Security.Claims;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Encodings.Web;
using KitchenFlow.Api.Services;
using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Testcontainers.PostgreSql;

namespace KitchenFlow.IntegrationTests;

public sealed class ApiAuthenticationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18.4")
        .WithDatabase("kitchenflow_api_test")
        .WithUsername("kitchenflow_test")
        .WithPassword("development-only-test-password")
        .Build();

    [Fact]
    public async Task ProtectedSessionReturnsUnauthorizedWithoutAuthentication()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: false);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        var response = await client.GetAsync("/api/v1/session");
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("authentication_required", problem.GetProperty("errorCode").GetString());
    }

    [Fact]
    public async Task AuthenticatedSessionProvisionsInternalUserAndReturnsCsrfToken()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        var response = await client.GetAsync("/api/v1/session");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("csrfToken", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task AuthenticatedUserCannotReadAnotherUsersLot()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        var lotId = await factory.SeedOtherUsersLotAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        var response = await client.GetAsync($"/api/v1/inventory/lots/{lotId}");

        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PostgreSqlRejectsOrphanedLotsAndNegativeMeasuredQuantities()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var now = DateTimeOffset.UtcNow;
        var ownerId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        database.Lots.Add(new LotRecord { Id = Guid.NewGuid(), OwnerUserId = ownerId, ProductId = productId, MeasuredValue = 1m, MeasuredUnit = "Gram", StorageLocation = "Pantry", Version = 1, CreatedAt = now, UpdatedAt = now });
        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync());
        database.ChangeTracker.Clear();

        database.Users.Add(new InternalUser(ownerId, "https://integration.test", $"constraint-{ownerId:N}", now));
        database.Products.Add(new ProductRecord { Id = productId, OwnerUserId = ownerId, DisplayName = "Constraint tomato", NormalizedSearchName = "CONSTRAINT TOMATO", CreatedAt = now, UpdatedAt = now });
        await database.SaveChangesAsync();
        database.Lots.Add(new LotRecord { Id = Guid.NewGuid(), OwnerUserId = ownerId, ProductId = productId, MeasuredValue = -1m, MeasuredUnit = "Gram", StorageLocation = "Pantry", Version = 1, CreatedAt = now, UpdatedAt = now });

        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync());
    }

    [Fact]
    public async Task MutationRequiresCsrfToken()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/inventory/lots") { Content = JsonContent.Create(CreateLot()) };
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());

        var response = await client.SendAsync(request);

        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateReplayIsIdempotentAndProducesOneLot()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var key = Guid.NewGuid().ToString();

        var first = await CreateAsync(client, csrf, key);
        var second = await CreateAsync(client, csrf, key);
        var list = await client.GetFromJsonAsync<JsonElement>("/api/v1/inventory/lots");

        Assert.Equal(System.Net.HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.Created, second.StatusCode);
        Assert.Equal(1, list.GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task CreateReplayCanonicalizesEquivalentWhitespaceAndDecimalScale()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var key = Guid.NewGuid().ToString();

        var first = await CreateAsync(client, csrf, key, "Canonical tomato", 100m);
        var second = await CreateAsync(client, csrf, key, "  Canonical tomato  ", 100.0m);
        var list = await client.GetFromJsonAsync<JsonElement>("/api/v1/inventory/lots?search=Canonical%20tomato");

        Assert.Equal(System.Net.HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.Created, second.StatusCode);
        Assert.Equal(1, list.GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task LotRepresentationUsesAnOpaqueVersionTokenThatMatchesItsEtag()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);

        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var body = await created.Content.ReadFromJsonAsync<JsonElement>();
        var version = body.GetProperty("version").GetString();

        Assert.Equal(System.Net.HttpStatusCode.Created, created.StatusCode);
        Assert.False(long.TryParse(version, out _));
        Assert.Equal($"\"{version}\"", created.Headers.ETag!.Tag);
    }

    [Fact]
    public async Task ConcurrentCreateWithSameIdempotencyKeyReplaysTheWinningResponse()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var key = Guid.NewGuid().ToString();

        var responses = await Task.WhenAll(CreateAsync(client, csrf, key, "Concurrent tomato"), CreateAsync(client, csrf, key, "Concurrent tomato"));
        var list = await client.GetFromJsonAsync<JsonElement>("/api/v1/inventory/lots?search=Concurrent%20tomato");

        Assert.All(responses, response => Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode));
        Assert.Equal(1, list.GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task ConcurrentCreateWithSameKeyAndDifferentPayloadReturnsKeyReuseConflict()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var key = Guid.NewGuid().ToString();

        var responses = await Task.WhenAll(CreateAsync(client, csrf, key, "Concurrent tomato A"), CreateAsync(client, csrf, key, "Concurrent tomato B"));

        Assert.Contains(responses, response => response.StatusCode == System.Net.HttpStatusCode.Created);
        Assert.Contains(responses, response => response.StatusCode == System.Net.HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task UpdateRequiresCurrentEtagAndRejectsStaleVersion()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var createdLot = await created.Content.ReadFromJsonAsync<JsonElement>();
        var lotId = createdLot.GetProperty("lotId").GetGuid();

        var missing = await UpdateAsync(client, csrf, lotId, null);
        var stale = await UpdateAsync(client, csrf, lotId, "\"0\"");

        Assert.Equal((System.Net.HttpStatusCode)428, missing.StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.PreconditionFailed, stale.StatusCode);
    }

    [Fact]
    public async Task AdjustmentReplayDoesNotDuplicateHistory()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();
        var etag = created.Headers.ETag!.Tag;
        var key = Guid.NewGuid().ToString();

        var first = await AdjustAsync(client, csrf, lotId, etag, key, 25m);
        var second = await AdjustAsync(client, csrf, lotId, etag, key, 25m);
        var history = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{lotId}/history");

        Assert.Equal(System.Net.HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.OK, second.StatusCode);
        Assert.Equal(2, history.GetArrayLength());
    }

    [Fact]
    public async Task ConcurrentAdjustmentWithSameKeyReplaysTheWinningResponse()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();
        var key = Guid.NewGuid().ToString();

        var responses = await Task.WhenAll(AdjustAsync(client, csrf, lotId, created.Headers.ETag!.Tag, key, 25m), AdjustAsync(client, csrf, lotId, created.Headers.ETag!.Tag, key, 25m));
        var history = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{lotId}/history");

        Assert.All(responses, response => Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode));
        Assert.Equal(2, history.GetArrayLength());
    }

    [Fact]
    public async Task ConcurrentAdjustmentWithSameKeyAndDifferentPayloadReturnsReuseConflictWithoutDuplicateHistory()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();
        var key = Guid.NewGuid().ToString();

        var responses = await Task.WhenAll(
            AdjustAsync(client, csrf, lotId, created.Headers.ETag!.Tag, key, 25m),
            AdjustAsync(client, csrf, lotId, created.Headers.ETag!.Tag, key, 20m));
        var history = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{lotId}/history");

        Assert.Contains(responses, response => response.StatusCode == System.Net.HttpStatusCode.OK);
        var conflict = Assert.Single(responses, response => response.StatusCode == System.Net.HttpStatusCode.Conflict);
        Assert.Equal("idempotency_key_reused", (await conflict.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errorCode").GetString());
        Assert.Equal(2, history.GetArrayLength());
    }

    [Fact]
    public async Task AdjustmentKeyReuseWithDifferentPayloadReturnsConflict()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();
        var etag = created.Headers.ETag!.Tag;
        var key = Guid.NewGuid().ToString();

        await AdjustAsync(client, csrf, lotId, etag, key, 25m);
        var reused = await AdjustAsync(client, csrf, lotId, etag, key, 20m);

        Assert.Equal(System.Net.HttpStatusCode.Conflict, reused.StatusCode);
    }

    [Fact]
    public async Task DeleteSoftDeletesLotAndRetainsHistory()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();
        var deleted = await DeleteAsync(client, csrf, lotId, created.Headers.ETag!.Tag);
        var get = await client.GetAsync($"/api/v1/inventory/lots/{lotId}");
        var history = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{lotId}/history");

        Assert.Equal(System.Net.HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.NotFound, get.StatusCode);
        Assert.Equal(2, history.GetArrayLength());
        Assert.Equal(100m, history[0].GetProperty("previousQuantity").GetProperty("measuredValue").GetDecimal());
        Assert.Equal(100m, history[0].GetProperty("resultingQuantity").GetProperty("measuredValue").GetDecimal());
    }

    [Fact]
    public async Task ListUsesTamperEvidentCursorAndPreservesFilters()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var search = $"cursor-probe-{Guid.NewGuid():N}";

        await CreateAsync(client, csrf, Guid.NewGuid().ToString(), $"{search}-one");
        await CreateAsync(client, csrf, Guid.NewGuid().ToString(), $"{search}-two");
        var first = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots?pageSize=1&storageLocation=Pantry&search={search}");
        var cursor = first.GetProperty("nextCursor").GetString();
        var second = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots?pageSize=1&storageLocation=Pantry&search={search}&cursor={Uri.EscapeDataString(cursor!)}");
        var tampered = await client.GetAsync($"/api/v1/inventory/lots?cursor={Uri.EscapeDataString(cursor!)}x");
        var problem = await tampered.Content.ReadFromJsonAsync<JsonElement>();

        Assert.NotNull(cursor);
        Assert.Equal(1, first.GetProperty("items").GetArrayLength());
        Assert.Equal(1, second.GetProperty("items").GetArrayLength());
        Assert.NotEqual(first.GetProperty("items")[0].GetProperty("lotId").GetGuid(), second.GetProperty("items")[0].GetProperty("lotId").GetGuid());
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, tampered.StatusCode);
        Assert.Equal("invalid_cursor", problem.GetProperty("errorCode").GetString());
    }

    [Fact]
    public async Task CreateRejectsNoncanonicalMeasuredQuantity()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/inventory/lots") { Content = JsonContent.Create(new { productName = "Invalid unit", quantity = new { measuredValue = 1.2345m, unit = "Pound", availabilityState = (string?)null }, storageLocation = "Pantry", customLocation = (string?)null, packageState = (string?)null, printedExpirationDate = (DateOnly?)null, notes = (string?)null }) };
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        request.Headers.Add("X-CSRF-TOKEN", csrf);

        var response = await client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal((System.Net.HttpStatusCode)422, response.StatusCode);
        Assert.Equal("domain_rule_violated", problem.GetProperty("errorCode").GetString());
        Assert.True(problem.TryGetProperty("traceId", out _));
        Assert.True(problem.GetProperty("errors").TryGetProperty("quantity", out _));
    }

    [Fact]
    public async Task UpdateCanCorrectProductDisplayName()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/v1/inventory/lots/{lotId}") { Content = JsonContent.Create(new { productName = "Corrected tomato", storageLocation = "Other", customLocation = "Cellar shelf", packageState = "Unknown", printedExpirationDate = (DateOnly?)null, notes = " trimmed note " }) };
        request.Headers.Add("X-CSRF-TOKEN", csrf);
        request.Headers.TryAddWithoutValidation("If-Match", created.Headers.ETag!.Tag);

        var updated = await client.SendAsync(request);
        var body = await updated.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(System.Net.HttpStatusCode.OK, updated.StatusCode);
        Assert.Equal("Corrected tomato", body.GetProperty("productName").GetString());
        Assert.Equal("Other", body.GetProperty("storageLocation").GetString());
        Assert.Equal("Cellar shelf", body.GetProperty("customLocation").GetString());
        Assert.Equal("trimmed note", body.GetProperty("notes").GetString());
    }

    [Fact]
    public async Task MetadataCorrectionAppearsAsSafeHistoryAuditProjection()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();
        using var correction = new HttpRequestMessage(HttpMethod.Patch, $"/api/v1/inventory/lots/{lotId}") { Content = JsonContent.Create(new { storageLocation = "Refrigerator", customLocation = (string?)null, packageState = "Opened", printedExpirationDate = (DateOnly?)null, notes = "private correction note" }) };
        correction.Headers.Add("X-CSRF-TOKEN", csrf);
        correction.Headers.TryAddWithoutValidation("If-Match", created.Headers.ETag!.Tag);

        var updated = await client.SendAsync(correction);
        var history = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{lotId}/history");
        var projection = history.EnumerateArray().Single(item => item.GetProperty("kind").GetString() == "MetadataCorrection");

        Assert.Equal(System.Net.HttpStatusCode.OK, updated.StatusCode);
        Assert.Equal(JsonValueKind.Null, projection.GetProperty("type").ValueKind);
        var changedFields = projection.GetProperty("changedFields").EnumerateArray().Select(item => item.GetString()!).ToArray();
        Assert.Equal(["notes", "packageState", "storageLocation"], changedFields.OrderBy(item => item, StringComparer.Ordinal).ToArray());
        Assert.DoesNotContain("private correction note", projection.GetRawText(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task IdenticalMetadataCorrectionDoesNotAdvanceVersionOrCreateHistory()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();
        var update = await UpdateAsync(client, csrf, lotId, created.Headers.ETag!.Tag);
        var history = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{lotId}/history");

        Assert.Equal(System.Net.HttpStatusCode.OK, update.StatusCode);
        Assert.NotNull(update.Headers.ETag);
        Assert.Single(history.EnumerateArray());
    }

    [Fact]
    public async Task AuthenticatedUserCannotMutateAnotherUsersLot()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var owner = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        using var other = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        other.DefaultRequestHeaders.Add("X-Test-Subject", "integration-user-b");
        var ownerCsrf = await GetCsrfAsync(owner);
        var otherCsrf = await GetCsrfAsync(other);
        var created = await CreateAsync(owner, ownerCsrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();

        var update = await UpdateAsync(other, otherCsrf, lotId, created.Headers.ETag!.Tag);
        var delete = await DeleteAsync(other, otherCsrf, lotId, created.Headers.ETag!.Tag);

        Assert.Equal(System.Net.HttpStatusCode.NotFound, update.StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.NotFound, delete.StatusCode);
    }

    [Fact]
    public async Task ConsumeCannotReduceMeasuredLotBelowZero()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();

        var rejected = await AdjustAsync(client, csrf, lotId, created.Headers.ETag!.Tag, Guid.NewGuid().ToString(), 101m);
        var history = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{lotId}/history");

        Assert.Equal((System.Net.HttpStatusCode)422, rejected.StatusCode);
        Assert.Equal(1, history.GetArrayLength());
    }

    [Fact]
    public async Task AdjustmentValidationReturnsFieldErrorsAndTraceIdentifier()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();

        var rejected = await AdjustmentAsync(client, csrf, lotId, created.Headers.ETag!.Tag, Guid.NewGuid().ToString(), new { type = "Consume", value = 0m, availabilityState = "Low", reasonCode = "", note = (string?)null });
        var problem = await rejected.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal((System.Net.HttpStatusCode)422, rejected.StatusCode);
        Assert.Equal("domain_rule_violated", problem.GetProperty("errorCode").GetString());
        Assert.False(string.IsNullOrWhiteSpace(problem.GetProperty("traceId").GetString()));
        Assert.True(problem.GetProperty("errors").TryGetProperty("value", out _));
        Assert.True(problem.GetProperty("errors").TryGetProperty("availabilityState", out _));
        Assert.True(problem.GetProperty("errors").TryGetProperty("reasonCode", out _));
    }

    [Fact]
    public async Task CorrectRecordsPreviousAndResultingMeasuredQuantity()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAsync(client, csrf, Guid.NewGuid().ToString());
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();

        var corrected = await AdjustmentAsync(client, csrf, lotId, created.Headers.ETag!.Tag, Guid.NewGuid().ToString(), new { type = "Correct", value = 75m, availabilityState = (string?)null, reasonCode = "counted", note = (string?)null });
        var history = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{lotId}/history");

        Assert.Equal(System.Net.HttpStatusCode.OK, corrected.StatusCode);
        Assert.Equal(75m, (await corrected.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("quantity").GetProperty("measuredValue").GetDecimal());
        Assert.Equal("Correct", history[0].GetProperty("type").GetString());
        Assert.Equal(100m, history[0].GetProperty("previousQuantity").GetProperty("measuredValue").GetDecimal());
        Assert.Equal(75m, history[0].GetProperty("resultingQuantity").GetProperty("measuredValue").GetDecimal());
    }

    [Fact]
    public async Task AvailabilityChangeRequiresAndRecordsReason()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true });
        var csrf = await GetCsrfAsync(client);
        var created = await CreateAvailabilityAsync(client, csrf, Guid.NewGuid().ToString(), "Low");
        var lotId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("lotId").GetGuid();

        var changed = await AdjustmentAsync(client, csrf, lotId, created.Headers.ETag!.Tag, Guid.NewGuid().ToString(), new { type = "AvailabilityChanged", value = (decimal?)null, availabilityState = "Available", reasonCode = "checked", note = (string?)null });
        var history = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{lotId}/history");

        Assert.Equal(System.Net.HttpStatusCode.OK, changed.StatusCode);
        Assert.Equal("Available", (await changed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("quantity").GetProperty("availabilityState").GetString());
        Assert.Equal("AvailabilityChanged", history[0].GetProperty("type").GetString());
        Assert.Equal("checked", history[0].GetProperty("reasonCode").GetString());
    }

    private static object CreateLot(string productName = "Test tomato", decimal measuredValue = 100m) => new { productName, quantity = new { measuredValue, unit = "Gram", availabilityState = (string?)null }, storageLocation = "Pantry", customLocation = (string?)null, packageState = (string?)null, printedExpirationDate = (DateOnly?)null, notes = (string?)null };

    private static async Task<string> GetCsrfAsync(HttpClient client)
    {
        var session = await client.GetFromJsonAsync<JsonElement>("/api/v1/session");
        return session.GetProperty("csrfToken").GetString()!;
    }

    private static async Task<HttpResponseMessage> CreateAsync(HttpClient client, string csrf, string key, string productName = "Test tomato", decimal measuredValue = 100m)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/inventory/lots") { Content = JsonContent.Create(CreateLot(productName, measuredValue)) };
        request.Headers.Add("Idempotency-Key", key);
        request.Headers.Add("X-CSRF-TOKEN", csrf);
        return await client.SendAsync(request);
    }

    private static async Task<HttpResponseMessage> CreateAvailabilityAsync(HttpClient client, string csrf, string key, string availabilityState)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/inventory/lots") { Content = JsonContent.Create(new { productName = "Availability tomato", quantity = new { measuredValue = (decimal?)null, unit = (string?)null, availabilityState }, storageLocation = "Pantry", customLocation = (string?)null, packageState = (string?)null, printedExpirationDate = (DateOnly?)null, notes = (string?)null }) };
        request.Headers.Add("Idempotency-Key", key);
        request.Headers.Add("X-CSRF-TOKEN", csrf);
        return await client.SendAsync(request);
    }

    private static async Task<HttpResponseMessage> UpdateAsync(HttpClient client, string csrf, Guid lotId, string? etag)
    {
        var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/v1/inventory/lots/{lotId}") { Content = JsonContent.Create(new { storageLocation = "Refrigerator", customLocation = (string?)null, packageState = (string?)null, printedExpirationDate = (DateOnly?)null, notes = (string?)null }) };
        request.Headers.Add("X-CSRF-TOKEN", csrf);
        if (etag is not null)
        {
            request.Headers.TryAddWithoutValidation("If-Match", etag);
        }

        return await client.SendAsync(request);
    }

    private static async Task<HttpResponseMessage> AdjustAsync(HttpClient client, string csrf, Guid lotId, string etag, string key, decimal value)
    {
        return await AdjustmentAsync(client, csrf, lotId, etag, key, new { type = "Consume", value, availabilityState = (string?)null, reasonCode = "meal", note = (string?)null });
    }

    private static async Task<HttpResponseMessage> AdjustmentAsync(HttpClient client, string csrf, Guid lotId, string etag, string key, object payload)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/inventory/lots/{lotId}/adjustments") { Content = JsonContent.Create(payload) };
        request.Headers.Add("X-CSRF-TOKEN", csrf);
        request.Headers.TryAddWithoutValidation("If-Match", etag);
        request.Headers.Add("Idempotency-Key", key);
        return await client.SendAsync(request);
    }

    private static async Task<HttpResponseMessage> DeleteAsync(HttpClient client, string csrf, Guid lotId, string etag)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/inventory/lots/{lotId}");
        request.Headers.Add("X-CSRF-TOKEN", csrf);
        request.Headers.TryAddWithoutValidation("If-Match", etag);
        return await client.SendAsync(request);
    }

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    private sealed class KitchenFlowFactory(string connectionString, bool authenticate) : WebApplicationFactory<Program>
    {
        public async Task EnsureDatabaseAsync()
        {
            using var scope = Services.CreateScope();
            await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Database.MigrateAsync();
        }

        public async Task<Guid> SeedOtherUsersLotAsync()
        {
            using var scope = Services.CreateScope();
            var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var ownerId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var lotId = Guid.NewGuid();
            var now = DateTimeOffset.UtcNow;
            database.Users.Add(new InternalUser(ownerId, "https://integration.test", $"seeded-{ownerId:N}", now));
            database.Products.Add(new ProductRecord { Id = productId, OwnerUserId = ownerId, DisplayName = "Private tomato", NormalizedSearchName = "PRIVATE TOMATO", CreatedAt = now, UpdatedAt = now });
            database.Lots.Add(new LotRecord { Id = lotId, OwnerUserId = ownerId, ProductId = productId, MeasuredValue = 100m, MeasuredUnit = "Gram", StorageLocation = "Pantry", Version = 1, CreatedAt = now, UpdatedAt = now });
            await database.SaveChangesAsync();
            return lotId;
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:KitchenFlow", connectionString);
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
                if (authenticate)
                {
                    services.AddAuthentication(TestAuthenticationHandler.TestScheme)
                        .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(TestAuthenticationHandler.TestScheme, _ => { });
                }
            });
        }
    }

    private sealed class TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
        : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        public const string TestScheme = "Test";

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var subject = Request.Headers["X-Test-Subject"].FirstOrDefault() ?? "integration-user";
            var identity = new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, subject), new Claim("iss", "https://integration.test")], TestScheme);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), TestScheme)));
        }
    }
}
