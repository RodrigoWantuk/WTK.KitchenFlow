using System.Reflection;
using KitchenFlow.Api.Inventory;
using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Inventory.Domain;

namespace KitchenFlow.ArchitectureTests;

public sealed class DependencyBoundaryTests
{
    [Fact]
    public void InventoryDomainDoesNotReferenceApiOrEntityFramework()
    {
        var references = typeof(InventoryLot).Assembly.GetReferencedAssemblies().Select(reference => reference.Name).ToHashSet(StringComparer.Ordinal);

        Assert.DoesNotContain("KitchenFlow.Api", references);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", references);
        Assert.DoesNotContain("Microsoft.AspNetCore.Http", references);
    }

    [Fact]
    public void ApiDoesNotLeakPersistenceRecordsThroughPublicContracts()
    {
        var contractsAssembly = typeof(KitchenFlow.Api.Inventory.CreateLotRequest).Assembly;
        var publicApiTypes = contractsAssembly.GetTypes().Where(type => type.IsPublic && type.Namespace == "KitchenFlow.Api.Inventory");

        Assert.DoesNotContain(publicApiTypes, type => type.Name.EndsWith("Record", StringComparison.Ordinal));
    }

    [Fact]
    public void InventoryEndpointsDoNotReceivePersistenceOrDomainObjects()
    {
        var endpointParameters = typeof(InventoryEndpoints)
            .GetMethods(BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)
            .SelectMany(method => method.GetParameters())
            .Select(parameter => parameter.ParameterType);

        Assert.DoesNotContain(typeof(ApplicationDbContext), endpointParameters);
        Assert.DoesNotContain(typeof(InventoryLot), endpointParameters);
        Assert.DoesNotContain(typeof(Product), endpointParameters);
        Assert.DoesNotContain(typeof(InventoryTransaction), endpointParameters);
    }
}
