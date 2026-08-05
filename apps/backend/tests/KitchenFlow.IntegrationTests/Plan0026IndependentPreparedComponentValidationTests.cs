using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Identity;
using KitchenFlow.Modules.Inventory.Application;
using KitchenFlow.Modules.Inventory.Domain;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Npgsql;
using Testcontainers.PostgreSql;

namespace KitchenFlow.IntegrationTests;

/// <summary>
/// PLAN-0026 independent adversarial coverage for prepared components against PostgreSQL and HTTP.
/// These tests do not mutate production code; they only assert candidate behavior.
/// </summary>
[Collection("Plan0026SharedPostgres")]
public sealed class Plan0026IndependentPreparedComponentValidationTests
{
    private readonly Plan0026SharedPostgresFixture _fixture;

    /// <summary>Creates PLAN-0026 independent tests bound to one shared PostgreSQL fixture.</summary>
    public Plan0026IndependentPreparedComponentValidationTests(Plan0026SharedPostgresFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task MeasuredDeclaredYieldRemainsImmutableAfterOutputConsumeCorrectAndSoftDelete()
    {
        await using var factory = new KitchenFlowFactory(_fixture.ConnectionString, authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(ClientOptions());
        var csrf = await GetCsrfAsync(client);
        var parent = await CreateLotAsync(client, csrf, "Parent beans", 100m);
        var key = Guid.NewGuid().ToString();
        var preparedAt = DateTimeOffset.UtcNow.AddMinutes(-2);
        var body = MeasuredPreparationBody(parent.LotId, parent.Version, 60m, 60m, preparedAt);

        using var create = await SendPreparationAsync(client, csrf, key, body);
        var created = await create.Content.ReadFromJsonAsync<JsonElement>();
        var batchId = created.GetProperty("batchId").GetGuid();
        var output = created.GetProperty("outputs")[0].GetProperty("lot");
        var outputLotId = output.GetProperty("lotId").GetGuid();
        var outputVersion = output.GetProperty("version").GetString()!;

        using var consume = await AdjustAsync(client, csrf, outputLotId, Quote(outputVersion), Guid.NewGuid().ToString(), 20m);
        Assert.Equal(System.Net.HttpStatusCode.OK, consume.StatusCode);
        var afterConsume = await consume.Content.ReadFromJsonAsync<JsonElement>();
        var correctedVersion = afterConsume.GetProperty("version").GetString()!;
        using var correct = await AdjustmentAsync(client, csrf, outputLotId, Quote(correctedVersion), Guid.NewGuid().ToString(), new { type = "Correct", value = 35m, availabilityState = (string?)null, reasonCode = "count", note = (string?)null });
        Assert.Equal(System.Net.HttpStatusCode.OK, correct.StatusCode);
        var afterCorrect = await correct.Content.ReadFromJsonAsync<JsonElement>();
        using var softDelete = await DeleteAsync(client, csrf, outputLotId, Quote(afterCorrect.GetProperty("version").GetString()!));
        Assert.Equal(System.Net.HttpStatusCode.NoContent, softDelete.StatusCode);

        using var replay = await SendPreparationAsync(client, csrf, key, body);
        var replayBody = await replay.Content.ReadFromJsonAsync<JsonElement>();
        var batch = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/preparations/{batchId}");
        var parentProvenance = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{parent.LotId}/provenance");

        Assert.Equal(System.Net.HttpStatusCode.Created, create.StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.Created, replay.StatusCode);
        Assert.Equal(60m, created.GetProperty("declaredYield").GetProperty("measuredValue").GetDecimal());
        Assert.Equal(60m, replayBody.GetProperty("declaredYield").GetProperty("measuredValue").GetDecimal());
        Assert.Equal(60m, batch.GetProperty("declaredYield").GetProperty("measuredValue").GetDecimal());
        Assert.Equal(60m, parentProvenance.GetProperty("consumedBy")[0].GetProperty("declaredYield").GetProperty("measuredValue").GetDecimal());
    }

    [Fact]
    public async Task QualitativePreparationPersistsReplaysAndRejectsInvalidConstraintRows()
    {
        await using var factory = new KitchenFlowFactory(_fixture.ConnectionString, authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(ClientOptions());
        var csrf = await GetCsrfAsync(client);
        var parent = await CreateLotAsync(client, csrf, "Qualitative parent", 10m);
        var key = Guid.NewGuid().ToString();
        var body = new
        {
            outputProduct = new { productId = (Guid?)null, productName = "Qualitative component" },
            declaredYield = new { measuredValue = (decimal?)null, unit = (string?)null, availabilityState = "Low" },
            inputs = new[] { new { lotId = parent.LotId, quantity = new { measuredValue = 2m, unit = "Gram", availabilityState = (string?)null }, version = parent.Version } },
            outputs = new[] { new { quantity = new { measuredValue = (decimal?)null, unit = (string?)null, availabilityState = "Low" }, storageLocation = "Refrigerator", customLocation = (string?)null, packageState = "Opened", shelfLifeEvidence = new { date = (DateOnly?)null, source = "Unknown", confidence = "Unknown", conditions = (string?)null } } },
            preparedAt = DateTimeOffset.UtcNow.AddMinutes(-1)
        };

        using var first = await SendPreparationAsync(client, csrf, key, body);
        using var replay = await SendPreparationAsync(client, csrf, key, body);
        var firstBody = await first.Content.ReadFromJsonAsync<JsonElement>();
        var batchId = firstBody.GetProperty("batchId").GetGuid();
        var batch = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/preparations/{batchId}");

        Assert.Equal(System.Net.HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.Created, replay.StatusCode);
        Assert.Equal("Low", firstBody.GetProperty("declaredYield").GetProperty("availabilityState").GetString());
        Assert.Equal("Low", batch.GetProperty("declaredYield").GetProperty("availabilityState").GetString());

        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var constraints = await database.Database.SqlQueryRaw<string>("""SELECT conname AS "Value" FROM pg_constraint WHERE conname = 'ck_preparation_batches_declared_yield'""").ToListAsync();
        Assert.Contains("ck_preparation_batches_declared_yield", constraints);

        var ownerId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        database.Users.Add(new InternalUser(ownerId, $"https://issuer.test/{ownerId}", $"subject-{ownerId}", now));
        database.Products.Add(new ProductRecord { Id = productId, OwnerUserId = ownerId, DisplayName = "Constraint product", NormalizedSearchName = "CONSTRAINT PRODUCT", CreatedAt = now, UpdatedAt = now });
        await database.SaveChangesAsync();

        await using var connection = new NpgsqlConnection(_fixture.ConnectionString);
        await connection.OpenAsync();
        // These invalid rows must be rejected by ck_preparation_batches_declared_yield. SQL NULL
        // three-valued logic must not let incomplete measured/qualitative combinations pass.
        await AssertConstraintRejectedAsync(connection, $"""
            INSERT INTO inventory.preparation_batches ("Id", "OwnerUserId", "OutputProductId", "DeclaredYieldMeasuredValue", "DeclaredYieldMeasuredUnit", "DeclaredYieldAvailabilityState", "SourceType", "PreparedAt", "CreatedAt")
            VALUES ('{Guid.NewGuid()}', '{ownerId}', '{productId}', NULL, NULL, NULL, 'ManualPreparation', NOW(), NOW())
            """);
        await AssertConstraintRejectedAsync(connection, $"""
            INSERT INTO inventory.preparation_batches ("Id", "OwnerUserId", "OutputProductId", "DeclaredYieldMeasuredValue", "DeclaredYieldMeasuredUnit", "DeclaredYieldAvailabilityState", "SourceType", "PreparedAt", "CreatedAt")
            VALUES ('{Guid.NewGuid()}', '{ownerId}', '{productId}', 1, NULL, NULL, 'ManualPreparation', NOW(), NOW())
            """);
        await AssertConstraintRejectedAsync(connection, $"""
            INSERT INTO inventory.preparation_batches ("Id", "OwnerUserId", "OutputProductId", "DeclaredYieldMeasuredValue", "DeclaredYieldMeasuredUnit", "DeclaredYieldAvailabilityState", "SourceType", "PreparedAt", "CreatedAt")
            VALUES ('{Guid.NewGuid()}', '{ownerId}', '{productId}', NULL, 'Gram', NULL, 'ManualPreparation', NOW(), NOW())
            """);
        await AssertConstraintRejectedAsync(connection, $"""
            INSERT INTO inventory.preparation_batches ("Id", "OwnerUserId", "OutputProductId", "DeclaredYieldMeasuredValue", "DeclaredYieldMeasuredUnit", "DeclaredYieldAvailabilityState", "SourceType", "PreparedAt", "CreatedAt")
            VALUES ('{Guid.NewGuid()}', '{ownerId}', '{productId}', 1, 'Gram', 'Available', 'ManualPreparation', NOW(), NOW())
            """);
        await AssertConstraintRejectedAsync(connection, $"""
            INSERT INTO inventory.preparation_batches ("Id", "OwnerUserId", "OutputProductId", "DeclaredYieldMeasuredValue", "DeclaredYieldMeasuredUnit", "DeclaredYieldAvailabilityState", "SourceType", "PreparedAt", "CreatedAt")
            VALUES ('{Guid.NewGuid()}', '{ownerId}', '{productId}', 0, 'Gram', NULL, 'ManualPreparation', NOW(), NOW())
            """);
        await AssertConstraintRejectedAsync(connection, $"""
            INSERT INTO inventory.preparation_batches ("Id", "OwnerUserId", "OutputProductId", "DeclaredYieldMeasuredValue", "DeclaredYieldMeasuredUnit", "DeclaredYieldAvailabilityState", "SourceType", "PreparedAt", "CreatedAt")
            VALUES ('{Guid.NewGuid()}', '{ownerId}', '{productId}', 1, 'Cup', NULL, 'ManualPreparation', NOW(), NOW())
            """);
        await AssertConstraintRejectedAsync(connection, $"""
            INSERT INTO inventory.preparation_batches ("Id", "OwnerUserId", "OutputProductId", "DeclaredYieldMeasuredValue", "DeclaredYieldMeasuredUnit", "DeclaredYieldAvailabilityState", "SourceType", "PreparedAt", "CreatedAt")
            VALUES ('{Guid.NewGuid()}', '{ownerId}', '{productId}', NULL, NULL, 'Maybe', 'ManualPreparation', NOW(), NOW())
            """);
    }

    [Fact]
    public async Task MultiParentConcurrencyAndPartialRemainderAreExact()
    {
        await using var factory = new KitchenFlowFactory(_fixture.ConnectionString, authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(ClientOptions());
        var csrf = await GetCsrfAsync(client);
        var first = await CreateLotAsync(client, csrf, "Parent A", 10m);
        var second = await CreateLotAsync(client, csrf, "Parent B", 10m);
        var third = await CreateLotAsync(client, csrf, "Parent C", 10m);
        var preparedAt = DateTimeOffset.UtcNow.AddMinutes(-1);
        var body = new
        {
            outputProduct = new { productId = (Guid?)null, productName = "Multi parent stock" },
            declaredYield = new { measuredValue = 9m, unit = "Gram", availabilityState = (string?)null },
            inputs = new[]
            {
                new { lotId = first.LotId, quantity = new { measuredValue = 3m, unit = "Gram", availabilityState = (string?)null }, version = first.Version },
                new { lotId = second.LotId, quantity = new { measuredValue = 3m, unit = "Gram", availabilityState = (string?)null }, version = second.Version },
                new { lotId = third.LotId, quantity = new { measuredValue = 3m, unit = "Gram", availabilityState = (string?)null }, version = third.Version }
            },
            outputs = new[]
            {
                new { quantity = new { measuredValue = 4m, unit = "Gram", availabilityState = (string?)null }, storageLocation = "Refrigerator", customLocation = (string?)null, packageState = "Opened", shelfLifeEvidence = UnknownShelfLife() },
                new { quantity = new { measuredValue = 5m, unit = "Gram", availabilityState = (string?)null }, storageLocation = "Freezer", customLocation = (string?)null, packageState = "Opened", shelfLifeEvidence = UnknownShelfLife() }
            },
            preparedAt
        };

        using var success = await SendPreparationAsync(client, csrf, Guid.NewGuid().ToString(), body);
        Assert.Equal(System.Net.HttpStatusCode.Created, success.StatusCode);
        Assert.Equal(7m, (await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{first.LotId}")).GetProperty("quantity").GetProperty("measuredValue").GetDecimal());
        Assert.Equal(7m, (await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{second.LotId}")).GetProperty("quantity").GetProperty("measuredValue").GetDecimal());
        Assert.Equal(7m, (await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{third.LotId}")).GetProperty("quantity").GetProperty("measuredValue").GetDecimal());

        var firstCurrent = (await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{first.LotId}")).GetProperty("version").GetString()!;
        var thirdCurrent = (await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{third.LotId}")).GetProperty("version").GetString()!;
        var staleMiddleBody = new
        {
            outputProduct = new { productId = (Guid?)null, productName = "Stale middle stock" },
            declaredYield = new { measuredValue = 3m, unit = "Gram", availabilityState = (string?)null },
            inputs = new[]
            {
                new { lotId = first.LotId, quantity = new { measuredValue = 1m, unit = "Gram", availabilityState = (string?)null }, version = firstCurrent },
                new { lotId = second.LotId, quantity = new { measuredValue = 1m, unit = "Gram", availabilityState = (string?)null }, version = second.Version },
                new { lotId = third.LotId, quantity = new { measuredValue = 1m, unit = "Gram", availabilityState = (string?)null }, version = thirdCurrent }
            },
            outputs = new[] { new { quantity = new { measuredValue = 3m, unit = "Gram", availabilityState = (string?)null }, storageLocation = "Refrigerator", customLocation = (string?)null, packageState = "Opened", shelfLifeEvidence = UnknownShelfLife() } },
            preparedAt
        };
        using var staleMiddle = await SendPreparationAsync(client, csrf, Guid.NewGuid().ToString(), staleMiddleBody);
        Assert.Equal(System.Net.HttpStatusCode.PreconditionFailed, staleMiddle.StatusCode);
        Assert.Equal(7m, (await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{first.LotId}")).GetProperty("quantity").GetProperty("measuredValue").GetDecimal());
        Assert.Equal(7m, (await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{second.LotId}")).GetProperty("quantity").GetProperty("measuredValue").GetDecimal());
        Assert.Equal(7m, (await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{third.LotId}")).GetProperty("quantity").GetProperty("measuredValue").GetDecimal());
    }

    [Fact]
    public async Task ConcurrentSameKeyPreparationAndKeyReuseBehaveDeterministically()
    {
        await using var factory = new KitchenFlowFactory(_fixture.ConnectionString, authenticate: true);
        await factory.EnsureDatabaseAsync();

        for (var iteration = 0; iteration < 10; iteration++)
        {
            using var client = factory.CreateClient(ClientOptions());
            client.DefaultRequestHeaders.Add("X-Test-Subject", $"plan0026-concurrent-{iteration}-{Guid.NewGuid():N}");
            var csrf = await GetCsrfAsync(client);
            var parent = await CreateLotAsync(client, csrf, $"Concurrent parent {iteration}", 20m);
            var key = Guid.NewGuid().ToString();
            var body = MeasuredPreparationBody(parent.LotId, parent.Version, 5m, 5m, DateTimeOffset.UtcNow.AddMinutes(-1));
            var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            async Task<HttpResponseMessage> SendAsync()
            {
                await gate.Task;
                return await SendPreparationAsync(client, csrf, key, body);
            }

            var firstTask = SendAsync();
            var secondTask = SendAsync();
            gate.SetResult();
            var responses = await Task.WhenAll(firstTask, secondTask);
            // Correct behavior: both deliveries succeed with one authoritative batch (replay, not 412).
            Assert.All(responses, response => Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode));
            var batchIds = await Task.WhenAll(responses.Select(async response => (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("batchId").GetGuid()));
            Assert.Single(batchIds.Distinct());
            Assert.Equal(15m, (await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{parent.LotId}")).GetProperty("quantity").GetProperty("measuredValue").GetDecimal());
        }

        using var reuseClient = factory.CreateClient(ClientOptions());
        reuseClient.DefaultRequestHeaders.Add("X-Test-Subject", $"plan0026-reuse-{Guid.NewGuid():N}");
        var reuseCsrf = await GetCsrfAsync(reuseClient);
        var reuseParent = await CreateLotAsync(reuseClient, reuseCsrf, "Reuse parent", 20m);
        var reuseKey = Guid.NewGuid().ToString();
        var firstBody = MeasuredPreparationBody(reuseParent.LotId, reuseParent.Version, 4m, 4m, DateTimeOffset.UtcNow.AddMinutes(-1));
        using var first = await SendPreparationAsync(reuseClient, reuseCsrf, reuseKey, firstBody);
        Assert.Equal(System.Net.HttpStatusCode.Created, first.StatusCode);
        var mismatched = MeasuredPreparationBody(reuseParent.LotId, reuseParent.Version, 5m, 5m, DateTimeOffset.UtcNow.AddMinutes(-1));
        using var conflict = await SendPreparationAsync(reuseClient, reuseCsrf, reuseKey, mismatched);
        Assert.Equal(System.Net.HttpStatusCode.Conflict, conflict.StatusCode);
        var problem = await conflict.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("idempotency_key_reused", problem.GetProperty("errorCode").GetString());
        Assert.Equal(16m, (await reuseClient.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{reuseParent.LotId}")).GetProperty("quantity").GetProperty("measuredValue").GetDecimal());
    }

    [Fact]
    public async Task AdjustmentSameKeyReplayRegressionRunsFiftyIterationsWithoutDuplicateMutation()
    {
        await using var factory = new KitchenFlowFactory(_fixture.ConnectionString, authenticate: true);
        await factory.EnsureDatabaseAsync();

        for (var iteration = 0; iteration < 50; iteration++)
        {
            using var client = factory.CreateClient(ClientOptions());
            client.DefaultRequestHeaders.Add("X-Test-Subject", $"plan0026-adjust-{iteration}-{Guid.NewGuid():N}");
            var csrf = await GetCsrfAsync(client);
            var created = await CreateLotAsync(client, csrf, $"Adjust parent {iteration}", 100m);
            var key = Guid.NewGuid().ToString();
            var payload = new { type = "Consume", value = 3m, availabilityState = (string?)null, reasonCode = "meal", note = (string?)null };
            var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            async Task<HttpResponseMessage> SendAsync()
            {
                await gate.Task;
                return await AdjustmentAsync(client, csrf, created.LotId, Quote(created.Version), key, payload);
            }

            var firstTask = SendAsync();
            var secondTask = SendAsync();
            gate.SetResult();
            var responses = await Task.WhenAll(firstTask, secondTask);
            Assert.All(responses, response => Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode));
            Assert.Equal(97m, (await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{created.LotId}")).GetProperty("quantity").GetProperty("measuredValue").GetDecimal());
            var history = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{created.LotId}/history");
            Assert.Equal(1, history.EnumerateArray().Count(entry => entry.GetProperty("type").GetString() == "Consume"));
        }
    }

    [Fact]
    public async Task NullAndMalformedPreparationBoundariesReturnControlledProblems()
    {
        await using var factory = new KitchenFlowFactory(_fixture.ConnectionString, authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(ClientOptions());
        var csrf = await GetCsrfAsync(client);
        var parent = await CreateLotAsync(client, csrf, "Boundary parent", 10m);

        string[] bodies =
        [
            "null",
            """{"outputProduct":null,"declaredYield":{"measuredValue":1,"unit":"Gram"},"inputs":[],"outputs":[]}""",
            """{"outputProduct":{"productName":"Prepared"},"declaredYield":null,"inputs":[],"outputs":[]}""",
            """{"outputProduct":{"productName":"Prepared"},"declaredYield":{"measuredValue":1,"unit":"Gram"},"inputs":null,"outputs":[]}""",
            """{"outputProduct":{"productName":"Prepared"},"declaredYield":{"measuredValue":1,"unit":"Gram"},"inputs":[],"outputs":null}""",
            """{"outputProduct":{"productName":"Prepared"},"declaredYield":{"measuredValue":1,"unit":"Gram"},"inputs":[],"outputs":[]}""",
            $$"""{"outputProduct":{"productName":"Prepared"},"declaredYield":{"measuredValue":1,"unit":"Gram"},"inputs":[{"lotId":"{{parent.LotId}}","quantity":null,"version":"{{parent.Version}}"}],"outputs":[{"quantity":{"measuredValue":1,"unit":"Gram"},"storageLocation":"Refrigerator"}]}""",
            $$"""{"outputProduct":{"productName":"Prepared"},"declaredYield":{"measuredValue":1,"unit":"Gram"},"inputs":[{"lotId":"{{parent.LotId}}","quantity":{"measuredValue":1,"unit":"Gram"},"version":null}],"outputs":[{"quantity":{"measuredValue":1,"unit":"Gram"},"storageLocation":"Refrigerator"}]}""",
            $$"""{"outputProduct":{"productName":"Prepared"},"declaredYield":{"measuredValue":1,"unit":"Gram"},"inputs":[{"lotId":"not-a-uuid","quantity":{"measuredValue":1,"unit":"Gram"},"version":"{{parent.Version}}"}],"outputs":[{"quantity":{"measuredValue":1,"unit":"Gram"},"storageLocation":"Refrigerator"}]}""",
            $$"""{"outputProduct":{"productName":"Prepared"},"declaredYield":{"measuredValue":1,"unit":"Gram"},"inputs":[{"lotId":"{{parent.LotId}}","quantity":{"measuredValue":1,"unit":"Gram"},"version":"{{parent.Version}}"}],"outputs":[{"quantity":{"measuredValue":1,"unit":"Gram"},"storageLocation":"Refrigerator"}],"preparedAt":"not-a-timestamp"}"""
        ];

        foreach (var body in bodies)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/inventory/preparations")
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };
            request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
            request.Headers.Add("X-CSRF-TOKEN", csrf);
            using var response = await client.SendAsync(request);
            Assert.True((int)response.StatusCode is >= 400 and < 500, $"Unexpected status {(int)response.StatusCode} for body {body}");
            Assert.NotEqual(System.Net.HttpStatusCode.InternalServerError, response.StatusCode);
            var text = await response.Content.ReadAsStringAsync();
            Assert.DoesNotContain("Npgsql", text, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("StackTrace", text, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("Exception", text, StringComparison.OrdinalIgnoreCase);
        }

        using var malformedKey = new HttpRequestMessage(HttpMethod.Post, "/api/v1/inventory/preparations")
        {
            Content = JsonContent.Create(MeasuredPreparationBody(parent.LotId, parent.Version, 1m, 1m, DateTimeOffset.UtcNow.AddMinutes(-1)))
        };
        malformedKey.Headers.Add("Idempotency-Key", "not-a-uuid");
        malformedKey.Headers.Add("X-CSRF-TOKEN", csrf);
        using var malformedResponse = await client.SendAsync(malformedKey);
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, malformedResponse.StatusCode);
    }

    [Fact]
    public async Task ProvenanceIsBoundedToFiftyDeterministicBatchesAndDoesNotDiscloseTruncationFlag()
    {
        await using var factory = new KitchenFlowFactory(_fixture.ConnectionString, authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(ClientOptions());
        var csrf = await GetCsrfAsync(client);
        var parent = await CreateLotAsync(client, csrf, "Bound parent", 200m);
        var currentVersion = parent.Version;
        var preparedAt = DateTimeOffset.UtcNow.AddMinutes(-30);
        for (var index = 0; index < 55; index++)
        {
            var body = MeasuredPreparationBody(parent.LotId, currentVersion, 1m, 1m, preparedAt.AddSeconds(index));
            using var response = await SendPreparationAsync(client, csrf, Guid.NewGuid().ToString(), body);
            Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);
            currentVersion = (await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{parent.LotId}")).GetProperty("version").GetString()!;
        }

        var provenance = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{parent.LotId}/provenance");
        Assert.Equal(50, provenance.GetProperty("consumedBy").GetArrayLength());
        Assert.False(provenance.TryGetProperty("hasMore", out _));
        Assert.False(provenance.TryGetProperty("truncated", out _));
        Assert.False(provenance.TryGetProperty("continuationToken", out _));
        var ids = provenance.GetProperty("consumedBy").EnumerateArray().Select(item => item.GetProperty("batchId").GetGuid()).ToList();
        Assert.Equal(ids.Distinct().Count(), ids.Count);
        var repeated = await client.GetFromJsonAsync<JsonElement>($"/api/v1/inventory/lots/{parent.LotId}/provenance");
        Assert.Equal(ids, repeated.GetProperty("consumedBy").EnumerateArray().Select(item => item.GetProperty("batchId").GetGuid()).ToList());
    }

    [Fact]
    public async Task ForeignPreparationAndProvenanceRemainNondisclosing()
    {
        await using var factory = new KitchenFlowFactory(_fixture.ConnectionString, authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var owner = factory.CreateClient(ClientOptions());
        using var stranger = factory.CreateClient(ClientOptions());
        stranger.DefaultRequestHeaders.Add("X-Test-Subject", "plan0026-user-b");
        var ownerCsrf = await GetCsrfAsync(owner);
        var strangerCsrf = await GetCsrfAsync(stranger);
        var parent = await CreateLotAsync(owner, ownerCsrf, "Private parent", 20m);
        using var created = await SendPreparationAsync(owner, ownerCsrf, Guid.NewGuid().ToString(), MeasuredPreparationBody(parent.LotId, parent.Version, 5m, 5m, DateTimeOffset.UtcNow.AddMinutes(-1)));
        var body = await created.Content.ReadFromJsonAsync<JsonElement>();
        var batchId = body.GetProperty("batchId").GetGuid();
        var outputLotId = body.GetProperty("outputs")[0].GetProperty("lot").GetProperty("lotId").GetGuid();
        var outputVersion = body.GetProperty("outputs")[0].GetProperty("lot").GetProperty("version").GetString()!;

        using var foreignBatch = await stranger.GetAsync($"/api/v1/inventory/preparations/{batchId}");
        using var foreignProvenance = await stranger.GetAsync($"/api/v1/inventory/lots/{parent.LotId}/provenance");
        using var foreignAdjust = await AdjustAsync(stranger, strangerCsrf, outputLotId, Quote(outputVersion), Guid.NewGuid().ToString(), 1m);
        using var foreignPrepare = await SendPreparationAsync(stranger, strangerCsrf, Guid.NewGuid().ToString(), MeasuredPreparationBody(parent.LotId, parent.Version, 1m, 1m, DateTimeOffset.UtcNow.AddMinutes(-1)));

        await AssertProblemAsync(foreignBatch, System.Net.HttpStatusCode.NotFound, "resource_not_found");
        await AssertProblemAsync(foreignProvenance, System.Net.HttpStatusCode.NotFound, "resource_not_found");
        await AssertProblemAsync(foreignAdjust, System.Net.HttpStatusCode.NotFound, "resource_not_found");
        await AssertProblemAsync(foreignPrepare, System.Net.HttpStatusCode.NotFound, "resource_not_found");
    }

    [Fact]
    public async Task PreparationAuditOmitsPrivatePayloadFields()
    {
        await using var factory = new KitchenFlowFactory(_fixture.ConnectionString, authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(ClientOptions());
        var csrf = await GetCsrfAsync(client);
        var parent = await CreateLotAsync(client, csrf, "Audit parent", 20m);
        var privateName = "Secret sauce name";
        using var created = await SendPreparationAsync(client, csrf, Guid.NewGuid().ToString(), new
        {
            outputProduct = new { productId = (Guid?)null, productName = privateName },
            declaredYield = new { measuredValue = 3m, unit = "Gram", availabilityState = (string?)null },
            inputs = new[] { new { lotId = parent.LotId, quantity = new { measuredValue = 3m, unit = "Gram", availabilityState = (string?)null }, version = parent.Version } },
            outputs = new[] { new { quantity = new { measuredValue = 3m, unit = "Gram", availabilityState = (string?)null }, storageLocation = "Refrigerator", customLocation = (string?)null, packageState = "Opened", shelfLifeEvidence = new { date = new DateOnly(2026, 8, 10), source = "UserEntered", confidence = "High", conditions = "keep chilled privately" } } },
            preparedAt = DateTimeOffset.UtcNow.AddMinutes(-1)
        });
        Assert.Equal(System.Net.HttpStatusCode.Created, created.StatusCode);

        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var audit = await database.AuditEvents.AsNoTracking().Where(item => item.EventName == "inventory.preparation.created").OrderByDescending(item => item.OccurredAt).FirstAsync();
        Assert.Contains("inputCount", audit.MetadataJson, StringComparison.Ordinal);
        Assert.Contains("outputCount", audit.MetadataJson, StringComparison.Ordinal);
        Assert.DoesNotContain(privateName, audit.MetadataJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("keep chilled privately", audit.MetadataJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("measuredValue", audit.MetadataJson, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task DeclaredYieldConstraintIsPresentAndAppendOnlyHistoryRejectsMutation()
    {
        await using var factory = new KitchenFlowFactory(_fixture.ConnectionString, authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(ClientOptions());
        var csrf = await GetCsrfAsync(client);
        var parent = await CreateLotAsync(client, csrf, "Append only parent", 20m);
        using var created = await SendPreparationAsync(client, csrf, Guid.NewGuid().ToString(), MeasuredPreparationBody(parent.LotId, parent.Version, 4m, 4m, DateTimeOffset.UtcNow.AddMinutes(-1)));
        var batchId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("batchId").GetGuid();

        await using var connection = new NpgsqlConnection(_fixture.ConnectionString);
        await connection.OpenAsync();
        await using var update = connection.CreateCommand();
        update.CommandText = """UPDATE inventory.preparation_batches SET "DeclaredYieldMeasuredValue" = 1 WHERE "Id" = @id""";
        update.Parameters.AddWithValue("id", batchId);
        var exception = await Assert.ThrowsAsync<PostgresException>(() => update.ExecuteNonQueryAsync());
        Assert.Equal("55000", exception.SqlState);
    }

    private static WebApplicationFactoryClientOptions ClientOptions() => new() { BaseAddress = new Uri("https://localhost"), HandleCookies = true };

    private static object UnknownShelfLife() => new { date = (DateOnly?)null, source = "Unknown", confidence = "Unknown", conditions = (string?)null };

    private static object MeasuredPreparationBody(Guid lotId, string version, decimal yield, decimal output, DateTimeOffset preparedAt) => new
    {
        outputProduct = new { productId = (Guid?)null, productName = "Prepared component" },
        declaredYield = new { measuredValue = yield, unit = "Gram", availabilityState = (string?)null },
        inputs = new[] { new { lotId, quantity = new { measuredValue = yield, unit = "Gram", availabilityState = (string?)null }, version } },
        outputs = new[] { new { quantity = new { measuredValue = output, unit = "Gram", availabilityState = (string?)null }, storageLocation = "Refrigerator", customLocation = (string?)null, packageState = "Opened", shelfLifeEvidence = UnknownShelfLife() } },
        preparedAt
    };

    private static string Quote(string version) => version.StartsWith('"') ? version : $"\"{version}\"";

    private static async Task<string> GetCsrfAsync(HttpClient client)
    {
        var session = await client.GetFromJsonAsync<JsonElement>("/api/v1/session");
        return session.GetProperty("csrfToken").GetString()!;
    }

    private static async Task<(Guid LotId, string Version)> CreateLotAsync(HttpClient client, string csrf, string productName, decimal measuredValue)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/inventory/lots")
        {
            Content = JsonContent.Create(new { productName, quantity = new { measuredValue, unit = "Gram", availabilityState = (string?)null }, storageLocation = "Pantry", customLocation = (string?)null, packageState = (string?)null, printedExpirationDate = (DateOnly?)null, notes = (string?)null })
        };
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        request.Headers.Add("X-CSRF-TOKEN", csrf);
        using var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return (body.GetProperty("lotId").GetGuid(), body.GetProperty("version").GetString()!);
    }

    private static async Task<HttpResponseMessage> SendPreparationAsync(HttpClient client, string csrf, string key, object body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/inventory/preparations") { Content = JsonContent.Create(body) };
        request.Headers.Add("Idempotency-Key", key);
        request.Headers.Add("X-CSRF-TOKEN", csrf);
        return await client.SendAsync(request);
    }

    private static async Task<HttpResponseMessage> AdjustAsync(HttpClient client, string csrf, Guid lotId, string etag, string key, decimal value) =>
        await AdjustmentAsync(client, csrf, lotId, etag, key, new { type = "Consume", value, availabilityState = (string?)null, reasonCode = "meal", note = (string?)null });

    private static async Task<HttpResponseMessage> AdjustmentAsync(HttpClient client, string csrf, Guid lotId, string? etag, string key, object payload)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/inventory/lots/{lotId}/adjustments") { Content = JsonContent.Create(payload) };
        request.Headers.Add("X-CSRF-TOKEN", csrf);
        if (etag is not null)
        {
            request.Headers.TryAddWithoutValidation("If-Match", etag);
        }

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

    private static async Task AssertProblemAsync(HttpResponseMessage response, System.Net.HttpStatusCode expectedStatus, string expectedCode)
    {
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(expectedStatus, response.StatusCode);
        Assert.Equal(expectedCode, problem.GetProperty("errorCode").GetString());
    }

    private static async Task AssertConstraintRejectedAsync(NpgsqlConnection connection, string sql)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        var exception = await Assert.ThrowsAsync<PostgresException>(() => command.ExecuteNonQueryAsync());
        Assert.Equal(PostgresErrorCodes.CheckViolation, exception.SqlState);
    }

    private sealed class KitchenFlowFactory(string connectionString, bool authenticate) : WebApplicationFactory<Program>
    {
        private readonly string keyRingPath = Path.Combine(Path.GetTempPath(), $"kitchenflow-plan0026-keys-{Guid.NewGuid():N}");

        public async Task EnsureDatabaseAsync()
        {
            using var scope = Services.CreateScope();
            await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Database.MigrateAsync();
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:KitchenFlow", connectionString);
            builder.UseSetting("KITCHENFLOW_SESSION_KEYRING_PATH", keyRingPath);
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
                services.PostConfigure<OpenIdConnectOptions>("oidc", options =>
                {
                    options.Configuration = new OpenIdConnectConfiguration
                    {
                        AuthorizationEndpoint = "https://identity.integration.test/authorize",
                        Issuer = "https://identity.integration.test"
                    };
                    options.PushedAuthorizationBehavior = PushedAuthorizationBehavior.Disable;
                });
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
            var subject = Request.Headers["X-Test-Subject"].FirstOrDefault() ?? "plan0026-user-a";
            var identity = new ClaimsIdentity(
                [new Claim(ClaimTypes.NameIdentifier, subject), new Claim("sub", subject), new Claim("iss", "https://integration.test")],
                TestScheme);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), TestScheme)));
        }
    }
}

/// <summary>xUnit collection definition for one shared PostgreSQL container per PLAN-0026 suite.</summary>
[CollectionDefinition("Plan0026SharedPostgres")]
public sealed class Plan0026SharedPostgresCollection : ICollectionFixture<Plan0026SharedPostgresFixture>
{
}

/// <summary>Starts exactly one PostgreSQL container for all PLAN-0026 independent tests in a run.</summary>
public sealed class Plan0026SharedPostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18.4")
        .WithDatabase("kitchenflow_plan0026")
        .WithUsername("kitchenflow_test")
        .WithPassword("development-only-test-password")
        .Build();

    /// <summary>Gets the shared connection string.</summary>
    public string ConnectionString => _postgres.GetConnectionString();

    /// <inheritdoc />
    public Task InitializeAsync() => _postgres.StartAsync();

    /// <inheritdoc />
    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();
}
