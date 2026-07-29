using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.Json;
using KitchenFlow.Api.Observability;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace KitchenFlow.IntegrationTests;

public sealed class TelemetryRedactionTests
{
    [Fact]
    public void SensitiveTelemetryTagsAreRemovedBeforeExport()
    {
        using var activity = new Activity("inventory.mutation");
        activity.Start();
        activity.SetTag("http.request.header.authorization", "Bearer private-token");
        activity.SetTag("http.request.header.cookie", "session=private-cookie");
        activity.SetTag("inventory.product.name", "private product");
        activity.SetTag("inventory.note", "private note");
        activity.SetTag("http.request.body", "private request body");
        activity.SetTag("http.response.status_code", 200);

        SensitiveTelemetryRedactionProcessor.Redact(activity);

        Assert.DoesNotContain(activity.TagObjects, tag => tag.Key.Contains("authorization", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(activity.TagObjects, tag => tag.Key.Contains("cookie", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(activity.TagObjects, tag => tag.Key.Contains("product", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(activity.TagObjects, tag => tag.Key.Contains("note", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(activity.TagObjects, tag => tag.Key.Contains("body", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(activity.TagObjects, tag => tag.Key == "http.response.status_code" && (int)tag.Value! == 200);
    }

    [Fact]
    public async Task GeneratedOpenApiDeclaresInventorySuccessAndProblemResponses()
    {
        await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:KitchenFlow", "Host=127.0.0.1;Database=kitchenflow_contract_test;Username=test;Password=test"));
        using var client = factory.CreateClient();

        var document = await client.GetFromJsonAsync<JsonElement>("/openapi/v1.json");
        var createResponses = document.GetProperty("paths").GetProperty("/api/v1/inventory/lots").GetProperty("post").GetProperty("responses");
        var updateResponses = document.GetProperty("paths").GetProperty("/api/v1/inventory/lots/{lotId}").GetProperty("patch").GetProperty("responses");

        Assert.True(createResponses.TryGetProperty("201", out _));
        Assert.True(createResponses.TryGetProperty("422", out _));
        Assert.True(updateResponses.TryGetProperty("428", out _));
        Assert.True(updateResponses.TryGetProperty("412", out _));

        var securityScheme = document.GetProperty("components").GetProperty("securitySchemes").GetProperty("kitchenflowSession");
        var createParameters = document.GetProperty("paths").GetProperty("/api/v1/inventory/lots").GetProperty("post").GetProperty("parameters");
        var sessionResponses = document.GetProperty("paths").GetProperty("/api/v1/session").GetProperty("get").GetProperty("responses");

        Assert.Equal("cookie", securityScheme.GetProperty("in").GetString());
        Assert.Contains(createParameters.EnumerateArray(), parameter => parameter.GetProperty("name").GetString() == "X-CSRF-TOKEN");
        Assert.Contains(createParameters.EnumerateArray(), parameter => parameter.GetProperty("name").GetString() == "Idempotency-Key");
        Assert.True(sessionResponses.GetProperty("200").GetProperty("content").GetProperty("application/json").TryGetProperty("schema", out _));
    }
}
