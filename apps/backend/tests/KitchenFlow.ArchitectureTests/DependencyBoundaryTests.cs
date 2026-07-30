using System.Reflection;
using KitchenFlow.Api.Inventory;
using KitchenFlow.Api.Services;
using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Inventory.Application;
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

    [Fact]
    public void InventoryApplicationModuleDoesNotReferenceAspNetCoreOrEntityFramework()
    {
        var references = typeof(InventoryLotApplicationService).Assembly.GetReferencedAssemblies().Select(reference => reference.Name).ToHashSet(StringComparer.Ordinal);

        Assert.DoesNotContain("Microsoft.AspNetCore.Http", references);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", references);
        Assert.DoesNotContain("KitchenFlow.Api", references);
        Assert.DoesNotContain("KitchenFlow.Infrastructure", references);
    }

    [Fact]
    public void InventoryApplicationServiceExposesAllTypedSliceUseCases()
    {
        var methods = typeof(InventoryLotApplicationService).GetMethods(BindingFlags.Instance | BindingFlags.Public).Select(method => method.Name).ToHashSet(StringComparer.Ordinal);

        Assert.Contains("ListAsync", methods);
        Assert.Contains("GetAsync", methods);
        Assert.Contains("CreateAsync", methods);
        Assert.Contains("UpdateAsync", methods);
        Assert.Contains("AdjustAsync", methods);
        Assert.Contains("DeleteAsync", methods);
        Assert.Contains("HistoryAsync", methods);
    }

    [Fact]
    public void ApiAdaptersDoNotInjectPersistenceOrDomainServices()
    {
        var inventoryConstructorParameters = typeof(InventoryApplicationService).GetConstructors().Single().GetParameters().Select(parameter => parameter.ParameterType);
        var identityConstructorParameters = typeof(CurrentUserService).GetConstructors().Single().GetParameters().Select(parameter => parameter.ParameterType);

        Assert.DoesNotContain(typeof(ApplicationDbContext), inventoryConstructorParameters);
        Assert.DoesNotContain(typeof(InventoryLot), inventoryConstructorParameters);
        Assert.DoesNotContain(typeof(Product), inventoryConstructorParameters);
        Assert.DoesNotContain(typeof(InventoryTransaction), inventoryConstructorParameters);
        Assert.DoesNotContain(typeof(ApplicationDbContext), identityConstructorParameters);
    }
}
