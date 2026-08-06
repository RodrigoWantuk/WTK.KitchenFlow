namespace KitchenFlow.Modules.Ai.Usage;

/// <summary>
/// Enforces global daily, per-owner daily, and per-owner concurrency usage ceilings and owns the
/// reserve/settle/release lifecycle of the authoritative usage ledger. Deterministic code, not AI
/// output, decides whether an operation may proceed and what it ultimately costs.
/// </summary>
public sealed class AiUsageGovernor(IAiUsageLedgerStore store, AiUsageOptions options, TimeProvider timeProvider)
{
    /// <summary>Attempts to reserve usage units for one operation, evaluating all configured ceilings.</summary>
    public async Task<AiUsageReservationResult> ReserveAsync(Guid ownerUserId, string operation, int estimatedUnits, string correlationId, CancellationToken cancellationToken)
    {
        var configured = options;
        if (configured.Disabled)
        {
            return AiUsageReservationResult.Rejected(AiUsageReservationOutcome.Disabled);
        }

        var now = timeProvider.GetUtcNow();
        var openReservations = await store.CountOpenReservationsAsync(ownerUserId, cancellationToken);
        if (openReservations >= configured.UserConcurrencyCeiling)
        {
            return AiUsageReservationResult.Rejected(AiUsageReservationOutcome.ConcurrencyExhausted);
        }

        var globalUnitsToday = await store.SumGlobalUnitsForDayAsync(now, cancellationToken);
        if (globalUnitsToday + estimatedUnits > configured.GlobalDailyUnitCeiling)
        {
            return AiUsageReservationResult.Rejected(AiUsageReservationOutcome.GlobalBudgetExhausted);
        }

        var ownerUnitsToday = await store.SumOwnerUnitsForDayAsync(ownerUserId, now, cancellationToken);
        if (ownerUnitsToday + estimatedUnits > configured.UserDailyUnitCeiling)
        {
            return AiUsageReservationResult.Rejected(AiUsageReservationOutcome.UserBudgetExhausted);
        }

        var reservationId = await store.InsertReservationAsync(ownerUserId, operation, estimatedUnits, correlationId, now, cancellationToken);
        return AiUsageReservationResult.Success(reservationId);
    }

    /// <summary>Settles a reservation with the actual provider usage once an operation completes.</summary>
    public Task SettleAsync(Guid reservationId, int settledUnits, string provider, string model, CancellationToken cancellationToken) =>
        store.SettleAsync(reservationId, settledUnits, provider, model, timeProvider.GetUtcNow(), cancellationToken);

    /// <summary>Releases a reservation without cost when an operation fails safely before producing usable output.</summary>
    public Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken) =>
        store.ReleaseAsync(reservationId, timeProvider.GetUtcNow(), cancellationToken);
}
