using KitchenFlow.Modules.Identity;
using KitchenFlow.Modules.Inventory.Application;
using KitchenFlow.Modules.Inventory.Domain;

namespace KitchenFlow.UnitTests;

/// <summary>Tests every Inventory application contract without web, database, or token services.</summary>
public sealed class InventoryApplicationUseCaseTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 30, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task SevenUseCasesReturnStableTransportNeutralFailures()
    {
        var useCases = CreateUseCases();

        var list = await ((IListInventoryLotsUseCase)useCases).ListAsync(new ListInventoryLotsQuery(101, null, null, null, null), CancellationToken.None);
        var get = await ((IGetInventoryLotUseCase)useCases).GetAsync(Guid.NewGuid(), CancellationToken.None);
        var create = await ((ICreateInventoryLotUseCase)useCases).CreateAsync(new CreateInventoryLotCommand("Tomato", 1m, "Gram", null, "Pantry", null, null, null, null, null, "test"), CancellationToken.None);
        var update = await ((IUpdateInventoryLotUseCase)useCases).UpdateAsync(new UpdateInventoryLotCommand(Guid.NewGuid(), null, "Other", null, null, null, null, InventoryVersionPrecondition.Valid(1), "test"), CancellationToken.None);
        var adjust = await ((IAdjustInventoryLotUseCase)useCases).AdjustAsync(new AdjustInventoryLotCommand(Guid.NewGuid(), "Consume", 1m, null, "meal", null, null, InventoryVersionPrecondition.Valid(1), "test"), CancellationToken.None);
        var delete = await ((IDeleteInventoryLotUseCase)useCases).DeleteAsync(new DeleteInventoryLotCommand(Guid.NewGuid(), InventoryVersionPrecondition.Missing, "test"), CancellationToken.None);
        var history = await ((IGetInventoryLotHistoryUseCase)useCases).HistoryAsync(Guid.NewGuid(), CancellationToken.None);

        Assert.Equal("validation_failed", list.Problem!.ErrorCode);
        Assert.Equal("resource_not_found", get.Problem!.ErrorCode);
        Assert.Equal("validation_failed", create.Problem!.ErrorCode);
        Assert.Equal("domain_rule_violated", update.Problem!.ErrorCode);
        Assert.Equal("validation_failed", adjust.Problem!.ErrorCode);
        Assert.Equal("precondition_required", delete.Problem!.ErrorCode);
        Assert.Equal("resource_not_found", history.Problem!.ErrorCode);
    }

    private static InventoryLotApplicationService CreateUseCases() => new(new TestCurrentUser(), new TestReadStore(), new TestWriteStore(), TimeProvider.System, new InventoryLotLifecycleUseCase());

    private sealed class TestCurrentUser : ICurrentUserAccessor
    {
        public Task<InternalUser> GetCurrentAsync(CancellationToken cancellationToken) => Task.FromResult(new InternalUser(Guid.NewGuid(), "https://test", "user", Now));
    }

    private sealed class TestReadStore : IInventoryLotReadStore
    {
        public Task<InventoryLotReadModel?> FindActiveAsync(Guid ownerUserId, Guid lotId, CancellationToken cancellationToken) => Task.FromResult<InventoryLotReadModel?>(null);
        public Task<IReadOnlyList<InventoryHistoryReadModel>?> GetHistoryAsync(Guid ownerUserId, Guid lotId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<InventoryHistoryReadModel>?>(null);
        public Task<InventoryLotReadPage> ListAsync(InventoryLotReadQuery query, CancellationToken cancellationToken) => Task.FromResult(new InventoryLotReadPage([], null));
    }

    private sealed class TestWriteStore : IInventoryLotWriteStore
    {
        public Task<InventoryIdempotencyRead?> FindIdempotencyAsync(Guid ownerUserId, string scope, Guid key, CancellationToken cancellationToken) => Task.FromResult<InventoryIdempotencyRead?>(null);
        public Task<InventoryLotMutationState?> LoadActiveAsync(Guid ownerUserId, Guid lotId, CancellationToken cancellationToken) => Task.FromResult<InventoryLotMutationState?>(null);
        public Task<InventoryWriteOutcome> SaveCreatedAsync(InventoryLotCreationWrite write, CancellationToken cancellationToken) => Task.FromResult(InventoryWriteOutcome.Saved);
        public Task<InventoryWriteOutcome> SaveMutationAsync(InventoryLotMutationWrite write, CancellationToken cancellationToken) => Task.FromResult(InventoryWriteOutcome.Saved);
    }
}
