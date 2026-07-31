using KitchenFlow.Modules.Inventory.Domain;

namespace KitchenFlow.UnitTests;

public sealed class FoundationTests
{
    [Fact]
    public void ProductNameNormalizesSearchValueWithoutChangingDisplayValue()
    {
        Assert.True(ProductName.TryCreate("  Red Lentils  ", out var productName));

        Assert.Equal("Red Lentils", productName!.Value);
        Assert.Equal("RED LENTILS", productName.NormalizedSearchValue);
    }
}
