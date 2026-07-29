using KitchenFlow.Modules.Inventory.Domain;

namespace KitchenFlow.UnitTests;

public sealed class InventoryDomainTests
{
    [Fact]
    public void MeasuredQuantityRejectsNonPositiveAndOverPreciseValues()
    {
        Assert.False(LotQuantity.TryCreateMeasured(0m, CanonicalUnit.Gram, out _));
        Assert.False(LotQuantity.TryCreateMeasured(1.0001m, CanonicalUnit.Gram, out _));
        Assert.True(LotQuantity.TryCreateMeasured(1.125m, CanonicalUnit.Gram, out var quantity));
        Assert.IsType<LotQuantity.Measured>(quantity);
    }

    [Fact]
    public void OtherStorageRequiresCustomLocation()
    {
        Assert.False(LotStorage.TryCreate(StorageLocation.Other, null, out _));
        Assert.False(LotStorage.TryCreate(StorageLocation.Pantry, "Shelf", out _));
        Assert.True(LotStorage.TryCreate(StorageLocation.Other, "Top shelf", out var storage));
        Assert.Equal("Top shelf", storage!.CustomLocation);
    }

    [Fact]
    public void ConsumePreservesHistoryAndCannotExceedCurrentQuantity()
    {
        var now = new DateTimeOffset(2026, 7, 28, 0, 0, 0, TimeSpan.Zero);
        Assert.True(LotQuantity.TryCreateMeasured(100m, CanonicalUnit.Gram, out var quantity));
        Assert.True(LotStorage.TryCreate(StorageLocation.Pantry, null, out var storage));
        var lot = InventoryLot.Create(Guid.NewGuid(), Guid.NewGuid(), quantity!, storage!, null, null, null, now);

        var transaction = lot.AdjustMeasured(InventoryTransactionType.Consume, 25m, "meal", null, Guid.NewGuid(), now.AddMinutes(1));

        var resulting = Assert.IsType<LotQuantity.Measured>(transaction.ResultingQuantity);
        Assert.Equal(75m, resulting.Value);
        Assert.Equal(2, lot.Version);
        Assert.Throws<InvalidOperationException>(() =>
            lot.AdjustMeasured(InventoryTransactionType.Discard, 76m, "waste", null, Guid.NewGuid(), now.AddMinutes(2)));
    }

    [Fact]
    public void CorrectionCanSetMeasuredQuantityToZeroWithoutChangingItsUnit()
    {
        var now = new DateTimeOffset(2026, 7, 28, 0, 0, 0, TimeSpan.Zero);
        Assert.True(LotQuantity.TryCreateMeasured(100m, CanonicalUnit.Gram, out var quantity));
        Assert.True(LotStorage.TryCreate(StorageLocation.Pantry, null, out var storage));
        var lot = InventoryLot.Create(Guid.NewGuid(), Guid.NewGuid(), quantity!, storage!, null, null, null, now);

        var transaction = lot.AdjustMeasured(InventoryTransactionType.Correct, 0m, "counted", null, Guid.NewGuid(), now.AddMinutes(1));

        Assert.Equal(0m, Assert.IsType<LotQuantity.Measured>(transaction.ResultingQuantity).Value);
        Assert.Equal(CanonicalUnit.Gram, Assert.IsType<LotQuantity.Measured>(transaction.ResultingQuantity).Unit);
    }

    [Fact]
    public void AvailabilityLotsCannotReceiveMeasuredAdjustments()
    {
        var now = new DateTimeOffset(2026, 7, 28, 0, 0, 0, TimeSpan.Zero);
        Assert.True(LotStorage.TryCreate(StorageLocation.Pantry, null, out var storage));
        var lot = InventoryLot.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            LotQuantity.FromAvailability(AvailabilityState.Available),
            storage!,
            null,
            null,
            null,
            now);

        Assert.Throws<InvalidOperationException>(() =>
            lot.AdjustMeasured(InventoryTransactionType.Consume, 1m, "meal", null, Guid.NewGuid(), now));
    }
}
