using KitchenFlow.Modules.Ai.Usage;
using Microsoft.EntityFrameworkCore;

namespace KitchenFlow.Infrastructure.Persistence;

/// <summary>PostgreSQL-backed authoritative AI usage ledger store.</summary>
public sealed class PostgreSqlAiUsageLedgerStore(ApplicationDbContext database) : IAiUsageLedgerStore
{
    /// <inheritdoc />
    public async Task<int> SumGlobalUnitsForDayAsync(DateTimeOffset asOf, CancellationToken cancellationToken)
    {
        var (dayStart, dayEnd) = UtcDayBounds(asOf);
        return await SumUnitsAsync(null, dayStart, dayEnd, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<int> SumOwnerUnitsForDayAsync(Guid ownerUserId, DateTimeOffset asOf, CancellationToken cancellationToken)
    {
        var (dayStart, dayEnd) = UtcDayBounds(asOf);
        return await SumUnitsAsync(ownerUserId, dayStart, dayEnd, cancellationToken);
    }

    /// <inheritdoc />
    public Task<int> CountOpenReservationsAsync(Guid ownerUserId, CancellationToken cancellationToken) =>
        database.AiUsageLedgerEntries.AsNoTracking()
            .CountAsync(item => item.OwnerUserId == ownerUserId && item.Status == nameof(AiUsageEntryStatus.Reserved), cancellationToken);

    /// <inheritdoc />
    public async Task<Guid> InsertReservationAsync(Guid ownerUserId, string operation, int reservedUnits, string correlationId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var id = Guid.NewGuid();
        database.AiUsageLedgerEntries.Add(new AiUsageLedgerRecord
        {
            Id = id,
            OwnerUserId = ownerUserId,
            Operation = operation,
            Status = nameof(AiUsageEntryStatus.Reserved),
            ReservedUnits = reservedUnits,
            CorrelationId = correlationId,
            CreatedAt = now
        });
        await database.SaveChangesAsync(cancellationToken);
        return id;
    }

    /// <inheritdoc />
    public async Task SettleAsync(Guid reservationId, int settledUnits, string provider, string model, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var entry = await database.AiUsageLedgerEntries.SingleAsync(item => item.Id == reservationId, cancellationToken);
        if (entry.Status != nameof(AiUsageEntryStatus.Reserved))
        {
            throw new InvalidOperationException("Only a reserved AI usage entry can be settled.");
        }

        entry.Status = nameof(AiUsageEntryStatus.Settled);
        entry.SettledUnits = settledUnits;
        entry.Provider = provider;
        entry.Model = model;
        entry.ClosedAt = now;
        await database.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task ReleaseAsync(Guid reservationId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var entry = await database.AiUsageLedgerEntries.SingleAsync(item => item.Id == reservationId, cancellationToken);
        if (entry.Status != nameof(AiUsageEntryStatus.Reserved))
        {
            throw new InvalidOperationException("Only a reserved AI usage entry can be released.");
        }

        entry.Status = nameof(AiUsageEntryStatus.Released);
        entry.ClosedAt = now;
        await database.SaveChangesAsync(cancellationToken);
    }

    private async Task<int> SumUnitsAsync(Guid? ownerUserId, DateTimeOffset dayStart, DateTimeOffset dayEnd, CancellationToken cancellationToken)
    {
        var query = database.AiUsageLedgerEntries.AsNoTracking()
            .Where(item => item.CreatedAt >= dayStart && item.CreatedAt < dayEnd && item.Status != nameof(AiUsageEntryStatus.Released));
        if (ownerUserId is not null)
        {
            query = query.Where(item => item.OwnerUserId == ownerUserId.Value);
        }

        var rows = await query.Select(item => new { item.Status, item.ReservedUnits, item.SettledUnits }).ToListAsync(cancellationToken);
        return rows.Sum(item => item.Status == nameof(AiUsageEntryStatus.Settled) ? item.SettledUnits ?? item.ReservedUnits : item.ReservedUnits);
    }

    private static (DateTimeOffset DayStart, DateTimeOffset DayEnd) UtcDayBounds(DateTimeOffset asOf)
    {
        var dayStart = new DateTimeOffset(asOf.UtcDateTime.Date, TimeSpan.Zero);
        return (dayStart, dayStart.AddDays(1));
    }
}
