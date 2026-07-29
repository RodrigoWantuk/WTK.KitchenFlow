using System.Diagnostics;
using KitchenFlow.Api.Observability;

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
}
