using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Identity;
using KitchenFlow.Modules.Inventory.Application;
using KitchenFlow.Modules.Inventory.Domain;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Testcontainers.PostgreSql;

namespace KitchenFlow.IntegrationTests;

public sealed class PostgreSqlMigrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18.4")
        .WithDatabase("kitchenflow_test")
        .WithUsername("kitchenflow_test")
        .WithPassword("development-only-test-password")
        .Build();

    [Fact]
    public async Task MigrationsCreateRequiredSchemasAndTables()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new ApplicationDbContext(options);

        await context.Database.MigrateAsync();
        Assert.True(await context.Database.CanConnectAsync());
    }

    [Fact]
    public async Task MigrationsEnforceInventoryHistoryAndIdempotencyIntegrity()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new ApplicationDbContext(options);
        await context.Database.MigrateAsync();

        var ownerId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var lotId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        context.Users.Add(new InternalUser(ownerId, $"https://issuer.test/{ownerId}", $"subject-{ownerId}", now));
        context.Products.Add(new ProductRecord
        {
            Id = productId,
            OwnerUserId = ownerId,
            DisplayName = "Migration test product",
            NormalizedSearchName = "MIGRATION TEST PRODUCT",
            CreatedAt = now,
            UpdatedAt = now
        });
        context.Lots.Add(new LotRecord
        {
            Id = lotId,
            OwnerUserId = ownerId,
            ProductId = productId,
            MeasuredValue = 10m,
            MeasuredUnit = "Gram",
            StorageLocation = "Pantry",
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now
        });
        await context.SaveChangesAsync();

        context.Transactions.Add(new TransactionRecord
        {
            Id = Guid.NewGuid(),
            OwnerUserId = ownerId,
            LotId = lotId,
            Type = "Unsupported",
            ResultingMeasuredValue = 10m,
            ResultingMeasuredUnit = "Gram",
            OccurredAt = now
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
        context.ChangeTracker.Clear();

        context.IdempotencyRecords.Add(new IdempotencyRecord
        {
            Id = Guid.NewGuid(),
            OwnerUserId = ownerId,
            Scope = "inventory.lots.create",
            Key = Guid.NewGuid(),
            RequestHash = new string('A', 64),
            StatusCode = 201,
            ResponseBody = null,
            ETag = "\"opaque\"",
            CreatedAt = now,
            CompletedAt = now
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
    }

    [Fact]
    public async Task InventoryWriteStoreRethrowsUnrelatedForeignKeyFailureAndRollsBackWholeCreate()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new ApplicationDbContext(options);
        await context.Database.MigrateAsync();
        var missingOwnerId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        Assert.True(ProductName.TryCreate("Atomic test product", out var productName));
        Assert.True(LotStorage.TryCreate(StorageLocation.Pantry, null, out var storage));
        var product = Product.Create(missingOwnerId, productName!, now);
        var lot = InventoryLot.Create(missingOwnerId, product.Id, new LotQuantity.Measured(10m, CanonicalUnit.Gram), storage!, null, null, null, now);
        var transaction = InventoryTransaction.Create(lot.Id, missingOwnerId, InventoryTransactionType.Initial, null, lot.Quantity, null, null, Guid.NewGuid(), now);
        var idempotency = new InventoryIdempotencyWrite(Guid.NewGuid(), "inventory.lots.create", new string('A', 64), 201, "{}", lot.Version, now);
        var store = new PostgreSqlInventoryLotWriteStore(context);

        var exception = await Assert.ThrowsAsync<DbUpdateException>(() =>
            store.SaveCreatedAsync(new InventoryLotCreationWrite(missingOwnerId, product, lot, transaction, "atomicity-test", idempotency), CancellationToken.None));

        Assert.IsType<PostgresException>(exception.InnerException);
        Assert.Equal(PostgresErrorCodes.ForeignKeyViolation, ((PostgresException)exception.InnerException!).SqlState);
        Assert.Empty(context.ChangeTracker.Entries());

        await using var verification = new ApplicationDbContext(options);
        Assert.Equal(0, await verification.Products.CountAsync());
        Assert.Equal(0, await verification.Lots.CountAsync());
        Assert.Equal(0, await verification.Transactions.CountAsync());
        Assert.Equal(0, await verification.AuditEvents.CountAsync());
        Assert.Equal(0, await verification.IdempotencyRecords.CountAsync());
    }

    [Fact]
    public async Task InventoryWriteStoreRethrowsUnrelatedMutationFailureAndRollsBackEverySideEffect()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new ApplicationDbContext(options);
        await context.Database.MigrateAsync();
        var ownerId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var lotId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        context.Users.Add(new InternalUser(ownerId, $"https://issuer.test/{ownerId}", $"subject-{ownerId}", now));
        context.Products.Add(new ProductRecord { Id = productId, OwnerUserId = ownerId, DisplayName = "Atomic mutation product", NormalizedSearchName = "ATOMIC MUTATION PRODUCT", CreatedAt = now, UpdatedAt = now });
        context.Lots.Add(new LotRecord { Id = lotId, OwnerUserId = ownerId, ProductId = productId, MeasuredValue = 10m, MeasuredUnit = "Gram", StorageLocation = "Pantry", Version = 1, CreatedAt = now, UpdatedAt = now });
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        Assert.True(ProductName.TryCreate("Atomic mutation product", out var productName));
        Assert.True(LotStorage.TryCreate(StorageLocation.Pantry, null, out var storage));
        var product = Product.Restore(productId, ownerId, productName!, now, now, false);
        var lot = InventoryLot.Restore(lotId, ownerId, productId, new LotQuantity.Measured(10m, CanonicalUnit.Gram), storage!, null, null, null, 1, now, now, null);
        var transaction = lot.AdjustMeasured(InventoryTransactionType.Consume, 1m, "test", null, Guid.NewGuid(), now.AddMinutes(1));
        var invalidTransaction = InventoryTransaction.Create(lotId, Guid.NewGuid(), transaction.Type, transaction.PreviousQuantity, transaction.ResultingQuantity, transaction.ReasonCode, transaction.Note, transaction.IdempotencyKey, transaction.OccurredAt);
        var idempotency = new InventoryIdempotencyWrite(transaction.IdempotencyKey!.Value, "inventory.lots.adjust", new string('B', 64), 200, "{}", lot.Version, now.AddMinutes(1));
        var store = new PostgreSqlInventoryLotWriteStore(context);

        var exception = await Assert.ThrowsAsync<DbUpdateException>(() =>
            store.SaveMutationAsync(new InventoryLotMutationWrite(ownerId, lot, product, 1, invalidTransaction, "inventory.lot.adjusted", "{}", "atomicity-test", idempotency), CancellationToken.None));

        Assert.IsType<PostgresException>(exception.InnerException);
        Assert.Equal(PostgresErrorCodes.ForeignKeyViolation, ((PostgresException)exception.InnerException!).SqlState);
        Assert.Empty(context.ChangeTracker.Entries());

        await using var verification = new ApplicationDbContext(options);
        var persistedLot = await verification.Lots.AsNoTracking().SingleAsync();
        Assert.Equal(10m, persistedLot.MeasuredValue);
        Assert.Equal(1, persistedLot.Version);
        Assert.Equal(0, await verification.Transactions.CountAsync());
        Assert.Equal(0, await verification.AuditEvents.CountAsync());
        Assert.Equal(0, await verification.IdempotencyRecords.CountAsync());
    }

    [Fact]
    public async Task DatabaseRejectsMutationAndDeletionOfImmutableHistory()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new ApplicationDbContext(options);
        await context.Database.MigrateAsync();
        var ownerId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var lotId = Guid.NewGuid();
        var transactionId = Guid.NewGuid();
        var auditId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        context.Users.Add(new InternalUser(ownerId, $"https://issuer.test/{ownerId}", $"subject-{ownerId}", now));
        context.Products.Add(new ProductRecord { Id = productId, OwnerUserId = ownerId, DisplayName = "Immutable product", NormalizedSearchName = "IMMUTABLE PRODUCT", CreatedAt = now, UpdatedAt = now });
        context.Lots.Add(new LotRecord { Id = lotId, OwnerUserId = ownerId, ProductId = productId, MeasuredValue = 10m, MeasuredUnit = "Gram", StorageLocation = "Pantry", Version = 1, CreatedAt = now, UpdatedAt = now });
        context.Transactions.Add(new TransactionRecord { Id = transactionId, OwnerUserId = ownerId, LotId = lotId, Type = "Initial", ResultingMeasuredValue = 10m, ResultingMeasuredUnit = "Gram", OccurredAt = now });
        context.AuditEvents.Add(new AuditEventRecord { Id = auditId, ActorUserId = ownerId, EventName = "inventory.lot.created", TargetType = "inventory_lot", TargetId = lotId, CorrelationId = "immutability-test", MetadataJson = "{}", OccurredAt = now });
        await context.SaveChangesAsync();

        var transactionUpdate = await Assert.ThrowsAsync<PostgresException>(() =>
            context.Database.ExecuteSqlInterpolatedAsync($"UPDATE inventory.transactions SET \"ReasonCode\" = 'changed' WHERE \"Id\" = {transactionId}"));
        var auditDelete = await Assert.ThrowsAsync<PostgresException>(() =>
            context.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM platform.audit_events WHERE \"Id\" = {auditId}"));

        Assert.Equal("55000", transactionUpdate.SqlState);
        Assert.Equal("55000", auditDelete.SqlState);
        Assert.Equal("Initial", await context.Transactions.AsNoTracking().Where(item => item.Id == transactionId).Select(item => item.Type).SingleAsync());
        Assert.True(await context.AuditEvents.AsNoTracking().AnyAsync(item => item.Id == auditId));
    }

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();
}
