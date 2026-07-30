using KitchenFlow.Modules.Inventory.Application;
using KitchenFlow.Modules.Inventory.Domain;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace KitchenFlow.Infrastructure.Persistence;

/// <summary>PostgreSQL implementation of the atomic inventory mutation persistence boundary.</summary>
public sealed class PostgreSqlInventoryLotWriteStore(ApplicationDbContext database) : IInventoryLotWriteStore
{
    /// <inheritdoc />
    public async Task<InventoryIdempotencyRead?> FindIdempotencyAsync(Guid ownerUserId, string scope, Guid key, CancellationToken cancellationToken)
    {
        return await database.IdempotencyRecords.AsNoTracking()
            .Where(item => item.OwnerUserId == ownerUserId && item.Scope == scope && item.Key == key)
            .Select(item => new InventoryIdempotencyRead(item.RequestHash, item.StatusCode, item.ResponseBody, item.ETag, item.CompletedAt))
            .SingleOrDefaultAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<InventoryWriteOutcome> SaveCreatedAsync(InventoryLotCreationWrite write, CancellationToken cancellationToken)
    {
        var idempotency = write.Idempotency;
        database.AddRange(
            ToRecord(write.Product),
            ToRecord(write.Lot),
            ToRecord(write.InitialTransaction),
            new AuditEventRecord { Id = Guid.NewGuid(), ActorUserId = write.OwnerUserId, EventName = "inventory.lot.created", TargetType = "inventory_lot", TargetId = write.Lot.Id, CorrelationId = write.CorrelationId, MetadataJson = "{}", OccurredAt = write.Lot.CreatedAt },
            new IdempotencyRecord { Id = Guid.NewGuid(), OwnerUserId = write.OwnerUserId, Scope = idempotency.Scope, Key = idempotency.Key, RequestHash = idempotency.RequestHash, StatusCode = idempotency.StatusCode, ResponseBody = idempotency.ResponseBody, ETag = idempotency.ETag, CreatedAt = idempotency.CreatedAt, CompletedAt = idempotency.CreatedAt });
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return InventoryWriteOutcome.Saved;
        }
        catch (DbUpdateException exception) when (IsIdempotencyKeyConflict(exception))
        {
            return InventoryWriteOutcome.IdempotencyConflict;
        }
    }

    /// <inheritdoc />
    public async Task<InventoryLotMutationState?> LoadActiveAsync(Guid ownerUserId, Guid lotId, CancellationToken cancellationToken)
    {
        var lot = await database.Lots.AsNoTracking().SingleOrDefaultAsync(item => item.Id == lotId && item.OwnerUserId == ownerUserId && item.DeletedAt == null, cancellationToken);
        if (lot is null)
        {
            return null;
        }

        var product = await database.Products.AsNoTracking().SingleOrDefaultAsync(item => item.Id == lot.ProductId && item.OwnerUserId == ownerUserId, cancellationToken);
        return product is null ? null : new InventoryLotMutationState(ToDomain(lot), ToDomain(product));
    }

    /// <inheritdoc />
    public async Task<InventoryWriteOutcome> SaveMutationAsync(InventoryLotMutationWrite write, CancellationToken cancellationToken)
    {
        var lot = ToRecord(write.Lot);
        database.Lots.Attach(lot);
        database.Entry(lot).State = EntityState.Modified;
        database.Entry(lot).Property(item => item.Version).OriginalValue = write.ExpectedVersion;
        var product = ToRecord(write.Product);
        database.Products.Attach(product);
        database.Entry(product).State = EntityState.Modified;
        if (write.Transaction is not null)
        {
            database.Transactions.Add(ToRecord(write.Transaction));
        }

        database.AuditEvents.Add(new AuditEventRecord { Id = Guid.NewGuid(), ActorUserId = write.OwnerUserId, EventName = write.AuditEventName, TargetType = "inventory_lot", TargetId = write.Lot.Id, CorrelationId = write.CorrelationId, MetadataJson = "{}", OccurredAt = write.Lot.UpdatedAt });
        if (write.Idempotency is not null)
        {
            var item = write.Idempotency;
            database.IdempotencyRecords.Add(new IdempotencyRecord { Id = Guid.NewGuid(), OwnerUserId = write.OwnerUserId, Scope = item.Scope, Key = item.Key, RequestHash = item.RequestHash, StatusCode = item.StatusCode, ResponseBody = item.ResponseBody, ETag = item.ETag, CreatedAt = item.CreatedAt, CompletedAt = item.CreatedAt });
        }
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return InventoryWriteOutcome.Saved;
        }
        catch (DbUpdateConcurrencyException) { return InventoryWriteOutcome.ConcurrencyConflict; }
        catch (DbUpdateException exception) when (write.Idempotency is not null && IsIdempotencyKeyConflict(exception))
        {
            return InventoryWriteOutcome.IdempotencyConflict;
        }
    }

    private static Product ToDomain(ProductRecord item)
    {
        ProductName.TryCreate(item.DisplayName, out var name);
        return Product.Restore(item.Id, item.OwnerUserId, name!, item.CreatedAt, item.UpdatedAt, item.IsDeleted);
    }

    private static InventoryLot ToDomain(LotRecord item)
    {
        var quantity = item.MeasuredValue is { } value ? new LotQuantity.Measured(value, Enum.Parse<CanonicalUnit>(item.MeasuredUnit!)) : LotQuantity.FromAvailability(Enum.Parse<AvailabilityState>(item.AvailabilityState!));
        LotStorage.TryCreate(Enum.Parse<StorageLocation>(item.StorageLocation), item.CustomLocation, out var storage);
        PrivateNotes.TryCreate(item.Notes, out var notes);
        return InventoryLot.Restore(item.Id, item.OwnerUserId, item.ProductId, quantity, storage!, item.PackageState is null ? null : Enum.Parse<PackageState>(item.PackageState), item.PrintedExpirationDate is null ? null : new PrintedExpiration(item.PrintedExpirationDate.Value, ExpirationProvenance.UserEntered), notes, item.Version, item.CreatedAt, item.UpdatedAt, item.DeletedAt);
    }

    private static ProductRecord ToRecord(Product item) => new() { Id = item.Id, OwnerUserId = item.OwnerUserId, DisplayName = item.DisplayName, NormalizedSearchName = item.NormalizedSearchName, CreatedAt = item.CreatedAt, UpdatedAt = item.UpdatedAt, IsDeleted = item.IsDeleted };
    private static LotRecord ToRecord(InventoryLot item) => new() { Id = item.Id, OwnerUserId = item.OwnerUserId, ProductId = item.ProductId, MeasuredValue = item.Quantity is LotQuantity.Measured measured ? measured.Value : null, MeasuredUnit = item.Quantity is LotQuantity.Measured unit ? unit.Unit.ToString() : null, AvailabilityState = item.Quantity is LotQuantity.Availability availability ? availability.State.ToString() : null, StorageLocation = item.Storage.Location.ToString(), CustomLocation = item.Storage.CustomLocation, PackageState = item.PackageState?.ToString(), PrintedExpirationDate = item.PrintedExpiration?.Date, ExpirationProvenance = item.PrintedExpiration?.Provenance.ToString(), Notes = item.Notes?.Value, Version = item.Version, CreatedAt = item.CreatedAt, UpdatedAt = item.UpdatedAt, DeletedAt = item.DeletedAt };
    private static TransactionRecord ToRecord(InventoryTransaction item) => new() { Id = item.Id, OwnerUserId = item.OwnerUserId, LotId = item.LotId, Type = item.Type.ToString(), PreviousMeasuredValue = item.PreviousQuantity is LotQuantity.Measured previous ? previous.Value : null, PreviousMeasuredUnit = item.PreviousQuantity is LotQuantity.Measured previousUnit ? previousUnit.Unit.ToString() : null, PreviousAvailabilityState = item.PreviousQuantity is LotQuantity.Availability previousAvailability ? previousAvailability.State.ToString() : null, ResultingMeasuredValue = item.ResultingQuantity is LotQuantity.Measured resulting ? resulting.Value : null, ResultingMeasuredUnit = item.ResultingQuantity is LotQuantity.Measured resultingUnit ? resultingUnit.Unit.ToString() : null, ResultingAvailabilityState = item.ResultingQuantity is LotQuantity.Availability resultingAvailability ? resultingAvailability.State.ToString() : null, ReasonCode = item.ReasonCode, Note = item.Note, IdempotencyKey = item.IdempotencyKey, OccurredAt = item.OccurredAt };

    private static bool IsIdempotencyKeyConflict(DbUpdateException exception) =>
        exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: "IX_idempotency_records_OwnerUserId_Scope_Key"
        };
}
