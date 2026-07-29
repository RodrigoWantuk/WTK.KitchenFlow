using System.Diagnostics;
using OpenTelemetry;

namespace KitchenFlow.Api.Observability;

public sealed class SensitiveTelemetryRedactionProcessor : BaseProcessor<Activity>
{
    private static readonly string[] SensitiveFragments = ["authorization", "cookie", "token", "body", "product", "note"];

    public override void OnEnd(Activity data) => Redact(data);

    public static void Redact(Activity activity)
    {
        foreach (var tag in activity.TagObjects.ToArray())
        {
            if (SensitiveFragments.Any(fragment => tag.Key.Contains(fragment, StringComparison.OrdinalIgnoreCase)))
            {
                activity.SetTag(tag.Key, null);
            }
        }
    }
}
