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
        var references = typeof(InventoryLotApplicationWorkflow).Assembly.GetReferencedAssemblies().Select(reference => reference.Name).ToHashSet(StringComparer.Ordinal);

        Assert.DoesNotContain("Microsoft.AspNetCore.Http", references);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", references);
        Assert.DoesNotContain("KitchenFlow.Api", references);
        Assert.DoesNotContain("KitchenFlow.Infrastructure", references);
    }

    [Fact]
    public void InventoryApplicationResultsDoNotExposeHttpStatusOrEtagTokens()
    {
        var properties = typeof(InventoryApplicationResult<>).GetProperties(BindingFlags.Instance | BindingFlags.Public);

        Assert.DoesNotContain(properties, property => property.Name.Contains("Status", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(properties, property => property.Name.Contains("Etag", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(properties, property => property.PropertyType == typeof(string));
    }

    [Fact]
    public void InventoryApplicationCommandsUseDecodedConcurrencyAndCursorValues()
    {
        var listCursor = typeof(ListInventoryLotsQuery).GetProperty(nameof(ListInventoryLotsQuery.Cursor));
        var updatePrecondition = typeof(UpdateInventoryLotCommand).GetProperty(nameof(UpdateInventoryLotCommand.Precondition));
        var adjustmentPrecondition = typeof(AdjustInventoryLotCommand).GetProperty(nameof(AdjustInventoryLotCommand.Precondition));

        Assert.Equal(typeof(InventoryLotReadCursor), Nullable.GetUnderlyingType(listCursor!.PropertyType) ?? listCursor.PropertyType);
        Assert.Equal(typeof(InventoryVersionPrecondition), updatePrecondition!.PropertyType);
        Assert.Equal(typeof(InventoryVersionPrecondition), adjustmentPrecondition!.PropertyType);
    }

    [Fact]
    public void InventoryModuleDoesNotDeclareATransportTokenAbstraction()
    {
        var types = typeof(InventoryLotApplicationWorkflow).Assembly.GetTypes();

        Assert.DoesNotContain(types, type => type.Name.Contains("TransportToken", StringComparison.Ordinal));
        Assert.DoesNotContain(types, type => type.Name.Contains("DataProtection", StringComparison.Ordinal));
    }

    [Fact]
    public void InventoryApplicationServiceExposesAllTypedSliceUseCases()
    {
        var methods = typeof(InventoryLotApplicationWorkflow).GetMethods(BindingFlags.Instance | BindingFlags.Public).Select(method => method.Name).ToHashSet(StringComparer.Ordinal);

        Assert.Contains("ListAsync", methods);
        Assert.Contains("GetAsync", methods);
        Assert.Contains("CreateAsync", methods);
        Assert.Contains("UpdateAsync", methods);
        Assert.Contains("AdjustAsync", methods);
        Assert.Contains("DeleteAsync", methods);
        Assert.Contains("HistoryAsync", methods);
    }

    [Fact]
    public void InventoryUseCaseContractsHaveDistinctConcreteHandlers()
    {
        Type[] handlers = [typeof(CreateInventoryLotHandler), typeof(ListInventoryLotsHandler), typeof(GetInventoryLotHandler), typeof(UpdateInventoryLotHandler), typeof(AdjustInventoryLotHandler), typeof(DeleteInventoryLotHandler), typeof(GetInventoryLotHistoryHandler)];

        Assert.Equal(7, handlers.Distinct().Count());
        Assert.All(handlers, handler => Assert.Single(handler.GetInterfaces(), contract => contract.Name.EndsWith("UseCase", StringComparison.Ordinal)));
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
