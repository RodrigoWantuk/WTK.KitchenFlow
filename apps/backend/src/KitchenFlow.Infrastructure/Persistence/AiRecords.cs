namespace KitchenFlow.Infrastructure.Persistence;

/// <summary>
/// Persistence representation of one authoritative AI usage ledger entry. Deterministic code, not AI
/// output, decides <see cref="Status"/> transitions; <see cref="ReservedUnits"/> is charged unless the
/// operation later settles with a possibly different <see cref="SettledUnits"/> value or is released.
/// </summary>
public sealed class AiUsageLedgerRecord
{
    /// <summary>Gets or sets the ledger entry identifier, also used as the reservation identifier.</summary>
    public Guid Id { get; set; }
    /// <summary>Gets or sets the authoritative owner identifier.</summary>
    public Guid OwnerUserId { get; set; }
    /// <summary>Gets or sets the registered AI Gateway operation name.</summary>
    public required string Operation { get; set; }
    /// <summary>Gets or sets the controlled lifecycle status.</summary>
    public required string Status { get; set; }
    /// <summary>Gets or sets the usage units reserved before invocation.</summary>
    public int ReservedUnits { get; set; }
    /// <summary>Gets or sets the actual usage units charged once settled.</summary>
    public int? SettledUnits { get; set; }
    /// <summary>Gets or sets the provider name that produced the settled output.</summary>
    public string? Provider { get; set; }
    /// <summary>Gets or sets the concrete model identifier that produced the settled output.</summary>
    public string? Model { get; set; }
    /// <summary>Gets or sets the request correlation identifier.</summary>
    public required string CorrelationId { get; set; }
    /// <summary>Gets or sets the UTC reservation instant.</summary>
    public DateTimeOffset CreatedAt { get; set; }
    /// <summary>Gets or sets the UTC settlement or release instant.</summary>
    public DateTimeOffset? ClosedAt { get; set; }
}
