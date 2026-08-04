using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Identity;
using KitchenFlow.Modules.Inventory.Application;
using KitchenFlow.Modules.Inventory.Domain;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace KitchenFlow.IntegrationTests;

/// <summary>Exercises preparation persistence against PostgreSQL rather than an in-memory provider.</summary>
public sealed class PostgreSqlInventoryPreparationStoreTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18.4")
        .WithDatabase("kitchenflow_preparation_test")
        .WithUsername("kitchenflow_test")
        .WithPassword("development-only-test-password")
        .Build();

    [Fact]
    public async Task SaveRollsBackParentConsumptionWhenTheOutputGraphCannotBePersisted()
    {
        var seed = await SeedParentAsync();
        var now = DateTimeOffset.UtcNow;
        await using var context = CreateContext();
        var store = new PostgreSqlInventoryPreparationStore(context);
        var parent = RestoreLot(seed.LotId, seed.OwnerId, seed.ProductId, new LotQuantity.Measured(10m, CanonicalUnit.Gram), StorageLocation.Pantry, seed.ConcurrencyToken, now);
        var inputTransaction = parent.AdjustMeasured(InventoryTransactionType.PreparationInputConsumed, 4m, "preparation", null, Guid.NewGuid(), now);
        ProductName.TryCreate("Unpersisted output", out var outputName);
        var missingProduct = Product.Create(seed.OwnerId, outputName!, now);
        var outputLot = InventoryLot.Create(seed.OwnerId, missingProduct.Id, new LotQuantity.Measured(4m, CanonicalUnit.Gram), Storage(StorageLocation.Refrigerator), PackageState.Opened, null, null, now);
        var outputTransaction = InventoryTransaction.Create(outputLot.Id, seed.OwnerId, InventoryTransactionType.PreparationOutputCreated, null, outputLot.Quantity, "preparation", null, null, now);
        var batch = PreparationBatch.Create(seed.OwnerId, missingProduct.Id, now, now);
        var response = new PreparationBatchView(batch.Id, "ManualPreparation", missingProduct.Id, missingProduct.DisplayName, new InventoryQuantity(4m, "Gram", null), now, [], [], now);
        var write = new PreparationWrite(
            seed.OwnerId,
            batch,
            missingProduct,
            null,
            new InventoryQuantity(4m, "Gram", null),
            [new PreparationInputWrite(parent, seed.Product, seed.Version, 4m, inputTransaction)],
            [new PreparationOutputWrite(outputLot, outputTransaction, new PreparedShelfLifeEvidence(null, PreparedShelfLifeEvidenceSource.Unknown, ShelfLifeEvidenceConfidence.Unknown, null))],
            new PreparationIdempotencyWrite(Guid.NewGuid(), new string('A', 64), response, now),
            "preparation-rollback-test");

        await Assert.ThrowsAsync<DbUpdateException>(() => store.SaveAsync(write, CancellationToken.None));

        await using var verification = CreateContext();
        var parentRecord = await verification.Lots.AsNoTracking().SingleAsync(item => item.Id == seed.LotId);
        Assert.Equal(10m, parentRecord.MeasuredValue);
        Assert.Equal(seed.Version, parentRecord.Version);
        Assert.Empty(await verification.PreparationBatches.AsNoTracking().ToListAsync());
        Assert.Empty(await verification.PreparedLots.AsNoTracking().ToListAsync());
        Assert.Empty(await verification.IdempotencyRecords.AsNoTracking().ToListAsync());
    }

    [Fact]
    public async Task ConcurrentDifferentKeysApplyOnlyOneParentConsumption()
    {
        var seed = await SeedParentAsync();
        var preparedAt = DateTimeOffset.UtcNow.AddMinutes(-1);
        await using var firstContext = CreateContext();
        await using var secondContext = CreateContext();
        var first = CreateWorkflow(firstContext, seed.OwnerId);
        var second = CreateWorkflow(secondContext, seed.OwnerId);

        var results = await Task.WhenAll(
            first.PrepareAsync(CreateCommand(seed, Guid.NewGuid(), preparedAt), CancellationToken.None),
            second.PrepareAsync(CreateCommand(seed, Guid.NewGuid(), preparedAt), CancellationToken.None));

        Assert.Single(results, result => result.Problem is null);
        Assert.Single(results, result => result.Problem?.ErrorCode == "precondition_failed");
        await using var verification = CreateContext();
        var parent = await verification.Lots.AsNoTracking().SingleAsync(item => item.Id == seed.LotId);
        Assert.Equal(7m, parent.MeasuredValue);
        Assert.Equal(seed.Version + 1, parent.Version);
        Assert.Equal(1, await verification.PreparationBatches.CountAsync());
        Assert.Equal(1, await verification.PreparedLots.CountAsync());
    }

    [Fact]
    public async Task ConcurrentSameKeyReplaysTheOneAuthoritativePreparation()
    {
        var seed = await SeedParentAsync();
        var key = Guid.NewGuid();
        var preparedAt = DateTimeOffset.UtcNow.AddMinutes(-1);
        await using var firstContext = CreateContext();
        await using var secondContext = CreateContext();
        var first = CreateWorkflow(firstContext, seed.OwnerId);
        var second = CreateWorkflow(secondContext, seed.OwnerId);

        var results = await Task.WhenAll(
            first.PrepareAsync(CreateCommand(seed, key, preparedAt), CancellationToken.None),
            second.PrepareAsync(CreateCommand(seed, key, preparedAt), CancellationToken.None));

        Assert.All(results, result => Assert.Null(result.Problem));
        Assert.Single(results.Select(result => result.Value!.BatchId).Distinct());
        Assert.Contains(results, result => result.Idempotency == InventoryIdempotencyDisposition.Replayed);
        await using var verification = CreateContext();
        Assert.Equal(7m, await verification.Lots.AsNoTracking().Where(item => item.Id == seed.LotId).Select(item => item.MeasuredValue).SingleAsync());
        Assert.Equal(1, await verification.PreparationBatches.CountAsync());
        Assert.Equal(1, await verification.IdempotencyRecords.CountAsync(item => item.Key == key));
    }

    private ApplicationDbContext CreateContext() => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(_postgres.GetConnectionString()).Options);

    private async Task<ParentSeed> SeedParentAsync()
    {
        await using var context = CreateContext();
        await context.Database.EnsureDeletedAsync();
        await context.Database.MigrateAsync();
        var ownerId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var lotId = Guid.NewGuid();
        var token = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var product = new ProductRecord { Id = productId, OwnerUserId = ownerId, DisplayName = "Preparation parent", NormalizedSearchName = "PREPARATION PARENT", CreatedAt = now, UpdatedAt = now };
        context.Users.Add(new InternalUser(ownerId, $"https://issuer.test/{ownerId}", $"subject-{ownerId}", now));
        context.Products.Add(product);
        context.Lots.Add(new LotRecord { Id = lotId, OwnerUserId = ownerId, ProductId = productId, MeasuredValue = 10m, MeasuredUnit = "Gram", StorageLocation = "Pantry", Version = 1, ConcurrencyToken = token, CreatedAt = now, UpdatedAt = now });
        await context.SaveChangesAsync();
        ProductName.TryCreate(product.DisplayName, out var name);
        return new ParentSeed(ownerId, productId, lotId, token, 1, Product.Restore(productId, ownerId, name!, now, now, false));
    }

    private static PreparedComponentApplicationWorkflow CreateWorkflow(ApplicationDbContext context, Guid ownerId) => new(new TestCurrentUser(ownerId), new PostgreSqlInventoryPreparationStore(context), TimeProvider.System);

    private static PrepareComponentsCommand CreateCommand(ParentSeed parent, Guid key, DateTimeOffset preparedAt) => new(
        null,
        "Prepared component",
        3m,
        "Gram",
        null,
        [new PreparationInputCommand(parent.LotId, 3m, "Gram", InventoryVersionPrecondition.Valid(parent.ConcurrencyToken))],
        [new PreparationOutputCommand(3m, "Gram", null, "Refrigerator", null, "Opened", null, "Unknown", "Unknown", null)],
        preparedAt,
        key,
        "preparation-concurrency-test");

    private static InventoryLot RestoreLot(Guid lotId, Guid ownerId, Guid productId, LotQuantity quantity, StorageLocation storageLocation, Guid token, DateTimeOffset now)
    {
        return InventoryLot.Restore(lotId, ownerId, productId, quantity, Storage(storageLocation), PackageState.Sealed, null, null, 1, token, now, now, null);
    }

    private static LotStorage Storage(StorageLocation location)
    {
        LotStorage.TryCreate(location, null, out var storage);
        return storage!;
    }

    private sealed record ParentSeed(Guid OwnerId, Guid ProductId, Guid LotId, Guid ConcurrencyToken, long Version, Product Product);

    private sealed class TestCurrentUser(Guid ownerId) : ICurrentUserAccessor
    {
        public Task<InternalUser> GetCurrentAsync(CancellationToken cancellationToken) => Task.FromResult(new InternalUser(ownerId, "https://issuer.test", "preparation-store-test", DateTimeOffset.UtcNow));
    }

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();
}
