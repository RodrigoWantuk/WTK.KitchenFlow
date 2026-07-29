using System.Security.Claims;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Encodings.Web;
using KitchenFlow.Api.Services;
using KitchenFlow.Infrastructure.Persistence;
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

        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
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

    private static object CreateLot(string productName = "Test tomato") => new { productName, quantity = new { measuredValue = 100m, unit = "Gram", availabilityState = (string?)null }, storageLocation = "Pantry", customLocation = (string?)null, packageState = (string?)null, printedExpirationDate = (DateOnly?)null, notes = (string?)null };

    private static async Task<string> GetCsrfAsync(HttpClient client)
    {
        var session = await client.GetFromJsonAsync<JsonElement>("/api/v1/session");
        return session.GetProperty("csrfToken").GetString()!;
    }

    private static async Task<HttpResponseMessage> CreateAsync(HttpClient client, string csrf, string key, string productName = "Test tomato")
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/inventory/lots") { Content = JsonContent.Create(CreateLot(productName)) };
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
        var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/inventory/lots/{lotId}/adjustments") { Content = JsonContent.Create(new { type = "Consume", value, availabilityState = (string?)null, reasonCode = "meal", note = (string?)null }) };
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
            var identity = new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "integration-user"), new Claim("iss", "https://integration.test")], TestScheme);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), TestScheme)));
        }
    }
}
