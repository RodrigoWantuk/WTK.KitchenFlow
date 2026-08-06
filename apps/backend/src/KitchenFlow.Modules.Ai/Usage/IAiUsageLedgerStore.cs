namespace KitchenFlow.Modules.Ai.Usage;

/// <summary>Persistence port for the authoritative AI usage ledger.</summary>
public interface IAiUsageLedgerStore
{
    /// <summary>Sums reserved and settled units across all owners for the UTC calendar day containing <paramref name="asOf"/>.</summary>
    Task<int> SumGlobalUnitsForDayAsync(DateTimeOffset asOf, CancellationToken cancellationToken);

    /// <summary>Sums reserved and settled units for one owner for the UTC calendar day containing <paramref name="asOf"/>.</summary>
    Task<int> SumOwnerUnitsForDayAsync(Guid ownerUserId, DateTimeOffset asOf, CancellationToken cancellationToken);

    /// <summary>Counts one owner's currently open (<see cref="AiUsageEntryStatus.Reserved"/>) reservations.</summary>
    Task<int> CountOpenReservationsAsync(Guid ownerUserId, CancellationToken cancellationToken);

    /// <summary>Inserts a new reservation row and returns its identifier.</summary>
    Task<Guid> InsertReservationAsync(Guid ownerUserId, string operation, int reservedUnits, string correlationId, DateTimeOffset now, CancellationToken cancellationToken);

    /// <summary>Marks an open reservation settled with actual provider usage.</summary>
    Task SettleAsync(Guid reservationId, int settledUnits, string provider, string model, DateTimeOffset now, CancellationToken cancellationToken);

    /// <summary>Marks an open reservation released without cost.</summary>
    Task ReleaseAsync(Guid reservationId, DateTimeOffset now, CancellationToken cancellationToken);
}
