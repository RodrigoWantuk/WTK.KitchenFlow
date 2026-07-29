namespace KitchenFlow.Modules.Inventory.Domain;

public sealed class Product
{
    private Product(Guid id, Guid ownerUserId, ProductName name, DateTimeOffset now)
    {
        Id = id;
        OwnerUserId = ownerUserId;
        DisplayName = name.Value;
        NormalizedSearchName = name.NormalizedSearchValue;
        CreatedAt = now;
        UpdatedAt = now;
    }

    public Guid Id { get; private set; }

    public Guid OwnerUserId { get; private set; }

    public string DisplayName { get; private set; }

    public string NormalizedSearchName { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public bool IsDeleted { get; private set; }

    public static Product Create(Guid ownerUserId, ProductName name, DateTimeOffset now) =>
        new(Guid.NewGuid(), ownerUserId, name, now);

    /// <summary>Restores a product loaded by an infrastructure adapter without exposing persistence types to the domain.</summary>
    public static Product Restore(Guid id, Guid ownerUserId, ProductName name, DateTimeOffset createdAt, DateTimeOffset updatedAt, bool isDeleted)
    {
        var product = new Product(id, ownerUserId, name, createdAt) { UpdatedAt = updatedAt, IsDeleted = isDeleted };
        return product;
    }

    /// <summary>Corrects the user-owned display name while retaining its normalized search representation.</summary>
    public void Rename(ProductName name, DateTimeOffset now)
    {
        DisplayName = name.Value;
        NormalizedSearchName = name.NormalizedSearchValue;
        UpdatedAt = now;
    }
}

public sealed class InventoryLot
{
    private InventoryLot(
        Guid id,
        Guid ownerUserId,
        Guid productId,
        LotQuantity quantity,
        LotStorage storage,
        PackageState? packageState,
        PrintedExpiration? printedExpiration,
        PrivateNotes? notes,
        DateTimeOffset now)
    {
        Id = id;
        OwnerUserId = ownerUserId;
        ProductId = productId;
        Quantity = quantity;
        Storage = storage;
        PackageState = packageState;
        PrintedExpiration = printedExpiration;
        Notes = notes;
        Version = 1;
        CreatedAt = now;
        UpdatedAt = now;
    }

    public Guid Id { get; private set; }

    public Guid OwnerUserId { get; private set; }

    public Guid ProductId { get; private set; }

    public LotQuantity Quantity { get; private set; }

    public LotStorage Storage { get; private set; }

    public PackageState? PackageState { get; private set; }

    public PrintedExpiration? PrintedExpiration { get; private set; }

    public PrivateNotes? Notes { get; private set; }

    public long Version { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }

    public bool IsDeleted => DeletedAt is not null;

    public static InventoryLot Create(
        Guid ownerUserId,
        Guid productId,
        LotQuantity quantity,
        LotStorage storage,
        PackageState? packageState,
        PrintedExpiration? printedExpiration,
        PrivateNotes? notes,
        DateTimeOffset now) =>
        new(Guid.NewGuid(), ownerUserId, productId, quantity, storage, packageState, printedExpiration, notes, now);

    /// <summary>Restores a lot for an application command while preserving its concurrency and deletion state.</summary>
    public static InventoryLot Restore(
        Guid id,
        Guid ownerUserId,
        Guid productId,
        LotQuantity quantity,
        LotStorage storage,
        PackageState? packageState,
        PrintedExpiration? printedExpiration,
        PrivateNotes? notes,
        long version,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt,
        DateTimeOffset? deletedAt)
    {
        var lot = new InventoryLot(id, ownerUserId, productId, quantity, storage, packageState, printedExpiration, notes, createdAt)
        {
            Version = version,
            UpdatedAt = updatedAt,
            DeletedAt = deletedAt
        };
        return lot;
    }

    public void UpdateMetadata(
        LotStorage storage,
        PackageState? packageState,
        PrintedExpiration? printedExpiration,
        PrivateNotes? notes,
        DateTimeOffset now)
    {
        EnsureActive();
        Storage = storage;
        PackageState = packageState;
        PrintedExpiration = printedExpiration;
        Notes = notes;
        Touch(now);
    }

    public InventoryTransaction AdjustMeasured(
        InventoryTransactionType type,
        decimal value,
        string? reasonCode,
        string? note,
        Guid? idempotencyKey,
        DateTimeOffset now)
    {
        EnsureActive();
        if (Quantity is not LotQuantity.Measured previous)
        {
            throw new InvalidOperationException("Measured adjustments require a measured quantity.");
        }

        if ((type is InventoryTransactionType.Consume or InventoryTransactionType.Discard && value <= 0m) || (type == InventoryTransactionType.Correct && value < 0m) || decimal.Round(value, 3) != value)
        {
            throw new InvalidOperationException("Adjustment value must be nonnegative for corrections and positive for consumption or discard, with at most three decimal places.");
        }

        var result = type switch
        {
            InventoryTransactionType.Consume or InventoryTransactionType.Discard when value <= previous.Value =>
                previous.Value - value,
            InventoryTransactionType.Correct => value,
            _ => throw new InvalidOperationException("The adjustment type is not valid for a measured quantity.")
        };

        var resulting = new LotQuantity.Measured(result, previous.Unit);
        Quantity = resulting;
        Touch(now);
        return InventoryTransaction.Create(Id, OwnerUserId, type, previous, resulting, reasonCode, note, idempotencyKey, now);
    }

    public InventoryTransaction ChangeAvailability(
        AvailabilityState state,
        string? reasonCode,
        string? note,
        Guid? idempotencyKey,
        DateTimeOffset now)
    {
        EnsureActive();
        if (Quantity is not LotQuantity.Availability previous)
        {
            throw new InvalidOperationException("Availability changes require an availability quantity.");
        }

        var resulting = new LotQuantity.Availability(state);
        Quantity = resulting;
        Touch(now);
        return InventoryTransaction.Create(Id, OwnerUserId, InventoryTransactionType.AvailabilityChanged, previous, resulting, reasonCode, note, idempotencyKey, now);
    }

    public InventoryTransaction Delete(string? reasonCode, string? note, DateTimeOffset now)
    {
        EnsureActive();
        DeletedAt = now;
        Touch(now);
        return InventoryTransaction.Create(Id, OwnerUserId, InventoryTransactionType.Deleted, Quantity, Quantity, reasonCode, note, null, now);
    }

    private void Touch(DateTimeOffset now)
    {
        UpdatedAt = now;
        Version++;
    }

    private void EnsureActive()
    {
        if (IsDeleted)
        {
            throw new InvalidOperationException("The inventory lot is deleted.");
        }
    }
}

public sealed class InventoryTransaction
{
    private InventoryTransaction(
        Guid id,
        Guid lotId,
        Guid ownerUserId,
        InventoryTransactionType type,
        LotQuantity? previousQuantity,
        LotQuantity? resultingQuantity,
        string? reasonCode,
        string? note,
        Guid? idempotencyKey,
        DateTimeOffset occurredAt)
    {
        Id = id;
        LotId = lotId;
        OwnerUserId = ownerUserId;
        Type = type;
        PreviousQuantity = previousQuantity;
        ResultingQuantity = resultingQuantity;
        ReasonCode = reasonCode;
        Note = note;
        IdempotencyKey = idempotencyKey;
        OccurredAt = occurredAt;
    }

    public Guid Id { get; private set; }

    public Guid LotId { get; private set; }

    public Guid OwnerUserId { get; private set; }

    public InventoryTransactionType Type { get; private set; }

    public LotQuantity? PreviousQuantity { get; private set; }

    public LotQuantity? ResultingQuantity { get; private set; }

    public string? ReasonCode { get; private set; }

    public string? Note { get; private set; }

    public Guid? IdempotencyKey { get; private set; }

    public DateTimeOffset OccurredAt { get; private set; }

    public static InventoryTransaction Create(
        Guid lotId,
        Guid ownerUserId,
        InventoryTransactionType type,
        LotQuantity? previousQuantity,
        LotQuantity? resultingQuantity,
        string? reasonCode,
        string? note,
        Guid? idempotencyKey,
        DateTimeOffset occurredAt) =>
        new(Guid.NewGuid(), lotId, ownerUserId, type, previousQuantity, resultingQuantity, reasonCode, note, idempotencyKey, occurredAt);
}
