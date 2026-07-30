using KitchenFlow.Modules.Inventory.Application;
using Microsoft.EntityFrameworkCore;

namespace KitchenFlow.Infrastructure.Persistence;

/// <summary>PostgreSQL implementation of the explicit owner-scoped inventory read boundary.</summary>
public sealed class PostgreSqlInventoryLotReadStore(ApplicationDbContext database) : IInventoryLotReadStore
{
    /// <inheritdoc />
    public async Task<InventoryLotReadModel?> FindActiveAsync(Guid ownerUserId, Guid lotId, CancellationToken cancellationToken)
    {
        return await (from lot in database.Lots.AsNoTracking()
                      join product in database.Products.AsNoTracking() on lot.ProductId equals product.Id
                      where lot.Id == lotId && lot.OwnerUserId == ownerUserId && product.OwnerUserId == ownerUserId && lot.DeletedAt == null
                      select ToReadModel(lot, product.DisplayName)).SingleOrDefaultAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<InventoryLotReadPage> ListAsync(InventoryLotReadQuery query, CancellationToken cancellationToken)
    {
        var lots = database.Lots.AsNoTracking().Where(lot => lot.OwnerUserId == query.OwnerUserId);
        lots = query.Status switch
        {
            "deleted" => lots.Where(lot => lot.DeletedAt != null),
            "depleted" => lots.Where(lot => lot.DeletedAt == null && ((lot.MeasuredValue != null && lot.MeasuredValue == 0m) || lot.AvailabilityState == "Unavailable")),
            _ => lots.Where(lot => lot.DeletedAt == null && ((lot.MeasuredValue != null && lot.MeasuredValue > 0m) || (lot.MeasuredValue == null && lot.AvailabilityState != "Unavailable")))
        };
        if (query.StorageLocation is not null)
        {
            lots = lots.Where(lot => lot.StorageLocation == query.StorageLocation);
        }

        var records = from lot in lots
                      join product in database.Products.AsNoTracking() on lot.ProductId equals product.Id
                      where product.OwnerUserId == query.OwnerUserId
                      select new { Lot = lot, ProductName = product.DisplayName, product.NormalizedSearchName };
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            records = records.Where(item => item.NormalizedSearchName.Contains(query.Search.Trim().ToUpperInvariant()));
        }

        if (query.Cursor is not null)
        {
            records = records.Where(item => item.Lot.UpdatedAt < query.Cursor.UpdatedAt || (item.Lot.UpdatedAt == query.Cursor.UpdatedAt && item.Lot.Id.CompareTo(query.Cursor.LotId) < 0));
        }

        var page = await records.OrderByDescending(item => item.Lot.UpdatedAt).ThenByDescending(item => item.Lot.Id).Take(query.PageSize + 1).ToListAsync(cancellationToken);
        var items = page.Take(query.PageSize).Select(item => ToReadModel(item.Lot, item.ProductName)).ToList();
        var next = page.Count > query.PageSize ? new InventoryLotReadCursor(items[^1].UpdatedAt, items[^1].LotId) : null;
        return new InventoryLotReadPage(items, next);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<InventoryHistoryReadModel>?> GetHistoryAsync(Guid ownerUserId, Guid lotId, CancellationToken cancellationToken)
    {
        var exists = await database.Lots.AsNoTracking().AnyAsync(lot => lot.Id == lotId && lot.OwnerUserId == ownerUserId, cancellationToken);
        if (!exists)
        {
            return null;
        }

        return await database.Transactions.AsNoTracking().Where(item => item.OwnerUserId == ownerUserId && item.LotId == lotId).OrderByDescending(item => item.OccurredAt).Select(item => new InventoryHistoryReadModel(item.Id, item.Type, item.PreviousMeasuredValue, item.PreviousMeasuredUnit, item.PreviousAvailabilityState, item.ResultingMeasuredValue, item.ResultingMeasuredUnit, item.ResultingAvailabilityState, item.ReasonCode, item.OccurredAt)).ToListAsync(cancellationToken);
    }

    private static InventoryLotReadModel ToReadModel(LotRecord lot, string productName) => new(lot.Id, lot.ProductId, productName, lot.MeasuredValue, lot.MeasuredUnit, lot.AvailabilityState, lot.StorageLocation, lot.CustomLocation, lot.PackageState, lot.PrintedExpirationDate, lot.Notes, lot.Version, lot.CreatedAt, lot.UpdatedAt, lot.DeletedAt);
}
