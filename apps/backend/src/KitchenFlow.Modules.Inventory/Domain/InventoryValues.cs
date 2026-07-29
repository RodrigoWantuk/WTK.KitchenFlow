namespace KitchenFlow.Modules.Inventory.Domain;

public enum CanonicalUnit
{
    Gram,
    Milliliter,
    Unit
}

public enum AvailabilityState
{
    Available,
    Low,
    Unavailable
}

public enum StorageLocation
{
    Pantry,
    Refrigerator,
    Freezer,
    Counter,
    Custom
}

public enum PackageState
{
    Sealed,
    Opened
}

public enum ExpirationProvenance
{
    UserEntered
}

public enum InventoryTransactionType
{
    Initial,
    Consume,
    Discard,
    Correct,
    AvailabilityChanged,
    Deleted
}

public sealed record ProductName
{
    private ProductName(string value, string normalizedSearchValue)
    {
        Value = value;
        NormalizedSearchValue = normalizedSearchValue;
    }

    public string Value { get; }

    public string NormalizedSearchValue { get; }

    public static bool TryCreate(string? value, out ProductName? productName)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed) || trimmed.Length > 160)
        {
            productName = null;
            return false;
        }

        productName = new ProductName(trimmed, trimmed.ToUpperInvariant());
        return true;
    }
}

public abstract record LotQuantity
{
    private LotQuantity()
    {
    }

    public sealed record Measured(decimal Value, CanonicalUnit Unit) : LotQuantity;

    public sealed record Availability(AvailabilityState State) : LotQuantity;

    public static bool TryCreateMeasured(decimal value, CanonicalUnit unit, out LotQuantity? quantity)
    {
        if (value <= 0m || decimal.Round(value, 3) != value)
        {
            quantity = null;
            return false;
        }

        quantity = new Measured(value, unit);
        return true;
    }

    public static LotQuantity FromAvailability(AvailabilityState state) => new Availability(state);
}

public sealed record LotStorage
{
    private LotStorage(StorageLocation location, string? customLocation)
    {
        Location = location;
        CustomLocation = customLocation;
    }

    public StorageLocation Location { get; }

    public string? CustomLocation { get; }

    public static bool TryCreate(StorageLocation location, string? customLocation, out LotStorage? storage)
    {
        var trimmed = customLocation?.Trim();
        if (location == StorageLocation.Custom && string.IsNullOrWhiteSpace(trimmed))
        {
            storage = null;
            return false;
        }

        if (location != StorageLocation.Custom && !string.IsNullOrWhiteSpace(trimmed))
        {
            storage = null;
            return false;
        }

        if (trimmed?.Length > 80)
        {
            storage = null;
            return false;
        }

        storage = new LotStorage(location, trimmed);
        return true;
    }
}

public sealed record PrivateNotes
{
    private PrivateNotes(string value) => Value = value;

    public string Value { get; }

    public static bool TryCreate(string? value, out PrivateNotes? notes)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            notes = null;
            return true;
        }

        if (trimmed.Length > 1000)
        {
            notes = null;
            return false;
        }

        notes = new PrivateNotes(trimmed);
        return true;
    }
}

public sealed record PrintedExpiration(DateOnly Date, ExpirationProvenance Provenance);
