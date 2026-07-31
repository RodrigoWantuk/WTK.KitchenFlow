using System.Diagnostics.Metrics;
using KitchenFlow.Modules.Identity;
using KitchenFlow.Modules.Profiles.Domain;

namespace KitchenFlow.Modules.Profiles.Application;

/// <summary>Bounded profile metrics with stable low-cardinality tags.</summary>
public sealed class ProfileMetrics
{
    private static readonly Meter Meter = new("KitchenFlow.Profiles", "1.0.0");
    private readonly Counter<long> _mutations = Meter.CreateCounter<long>("profile_mutations_total");

    /// <summary>Records one profile mutation attempt.</summary>
    public void RecordMutation(string operation, string? errorCode = null)
    {
        var outcome = errorCode ?? "succeeded";
        _mutations.Add(1, new KeyValuePair<string, object?>("operation", operation), new KeyValuePair<string, object?>("outcome", outcome));
    }
}
