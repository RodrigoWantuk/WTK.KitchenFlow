using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Identity;
using KitchenFlow.Modules.Inventory.Application;
using KitchenFlow.Modules.Inventory.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
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
        var constraints = await context.Database.SqlQueryRaw<string>(
            """SELECT conname AS "Value" FROM pg_constraint WHERE connamespace IN ('inventory'::regnamespace, 'platform'::regnamespace)""").ToListAsync();
        string[] requiredConstraints =
        [
            "ck_lots_quantity_mode",
            "ck_lots_measured_value",
            "ck_lots_measured_unit",
            "ck_lots_availability_state",
            "ck_lots_storage",
            "ck_lots_package_state",
            "ck_lots_expiration_provenance",
            "ck_transactions_type",
            "ck_transactions_previous_quantity",
            "ck_transactions_resulting_quantity",
            "ck_transactions_reason_code",
            "ck_idempotency_completion",
            "ck_idempotency_status_code",
            "FK_lots_products_ProductId_OwnerUserId",
            "FK_transactions_lots_LotId_OwnerUserId",
            "FK_audit_events_users_ActorUserId",
            "FK_idempotency_records_users_OwnerUserId"
        ];
        Assert.All(requiredConstraints, constraint => Assert.Contains(constraint, constraints));
        var triggers = await context.Database.SqlQueryRaw<string>(
            """SELECT tgname AS "Value" FROM pg_trigger WHERE NOT tgisinternal""").ToListAsync();
        Assert.Contains("transactions_are_append_only", triggers);
        Assert.Contains("audit_events_are_append_only", triggers);
    }

    [Fact]
    public async Task EveryPriorMigrationUpgradesRepresentativeInventoryDataToLatest()
    {
        string[] priorMigrations =
        [
            "20260729013459_InitialInventorySlice",
            "20260729123210_EnforceInventoryReferentialIntegrity",
            "20260729193936_EnforceInventoryHistoryIntegrity",
            "20260731021725_EnforceAppendOnlyHistory",
            "20260731024742_TightenExpirationProvenance"
        ];
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        foreach (var priorMigration in priorMigrations)
        {
            await using var context = new ApplicationDbContext(options);
            await context.Database.EnsureDeletedAsync();
            var migrator = context.GetService<IMigrator>();
            await migrator.MigrateAsync(priorMigration);
            var ownerId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var lotId = Guid.NewGuid();
            var now = DateTimeOffset.UtcNow;
            // Seed through the historical schema rather than the current EF model so this test
            // remains capable of detecting additive-column upgrade defects.
            await context.Database.ExecuteSqlInterpolatedAsync($"""INSERT INTO identity.users ("Id", "Issuer", "Subject", "CreatedAt") VALUES ({ownerId}, {$"https://issuer.test/{ownerId}"}, {$"subject-{ownerId}"}, {now})""");
            await context.Database.ExecuteSqlInterpolatedAsync($"""INSERT INTO inventory.products ("Id", "OwnerUserId", "DisplayName", "NormalizedSearchName", "CreatedAt", "UpdatedAt", "IsDeleted") VALUES ({productId}, {ownerId}, {"Upgrade product"}, {"UPGRADE PRODUCT"}, {now}, {now}, {false})""");
            await context.Database.ExecuteSqlInterpolatedAsync($"""INSERT INTO inventory.lots ("Id", "OwnerUserId", "ProductId", "MeasuredValue", "MeasuredUnit", "StorageLocation", "Version", "CreatedAt", "UpdatedAt") VALUES ({lotId}, {ownerId}, {productId}, {10.125m}, {"Gram"}, {"Pantry"}, {1L}, {now}, {now})""");
            await context.Database.ExecuteSqlInterpolatedAsync($"""INSERT INTO inventory.transactions ("Id", "OwnerUserId", "LotId", "Type", "ResultingMeasuredValue", "ResultingMeasuredUnit", "OccurredAt") VALUES ({Guid.NewGuid()}, {ownerId}, {lotId}, {"Initial"}, {10.125m}, {"Gram"}, {now})""");
            await context.Database.ExecuteSqlInterpolatedAsync($"""INSERT INTO platform.audit_events ("Id", "ActorUserId", "EventName", "TargetType", "TargetId", "CorrelationId", "MetadataJson", "OccurredAt") VALUES ({Guid.NewGuid()}, {ownerId}, {"inventory.lot.created"}, {"inventory_lot"}, {lotId}, {"upgrade-test"}, CAST({"{}"} AS jsonb), {now})""");
            await context.Database.ExecuteSqlInterpolatedAsync($"""INSERT INTO platform.idempotency_records ("Id", "OwnerUserId", "Scope", "Key", "RequestHash", "StatusCode", "ResponseBody", "ETag", "CreatedAt", "CompletedAt") VALUES ({Guid.NewGuid()}, {ownerId}, {"inventory.lots.create"}, {Guid.NewGuid()}, {new string('A', 64)}, {201}, CAST({"{}"} AS jsonb), {"1"}, {now}, {now})""");

            await migrator.MigrateAsync();

            Assert.Equal(10.125m, await context.Lots.AsNoTracking().Where(lot => lot.Id == lotId).Select(lot => lot.MeasuredValue).SingleAsync());
            Assert.NotEqual(Guid.Empty, await context.Lots.AsNoTracking().Where(lot => lot.Id == lotId).Select(lot => lot.ConcurrencyToken).SingleAsync());
            Assert.True(await context.Transactions.AsNoTracking().AnyAsync(transaction => transaction.LotId == lotId));
            Assert.True(await context.AuditEvents.AsNoTracking().AnyAsync(audit => audit.TargetId == lotId));
            Assert.True(await context.IdempotencyRecords.AsNoTracking().AnyAsync(record => record.OwnerUserId == ownerId));
        }
    }

    [Fact]
    public async Task ConcurrentIdentityProvisioningReturnsOneInternalUser()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using (var migration = new ApplicationDbContext(options))
        {
            await migration.Database.MigrateAsync();
        }

        var subject = new OidcSubject("https://identity.test/realms/kitchenflow", $"concurrent-{Guid.NewGuid():N}");
        await using var firstContext = new ApplicationDbContext(options);
        await using var secondContext = new ApplicationDbContext(options);
        var users = await Task.WhenAll(
            new PostgreSqlInternalUserStore(firstContext).FindOrCreateAsync(subject, DateTimeOffset.UtcNow, CancellationToken.None),
            new PostgreSqlInternalUserStore(secondContext).FindOrCreateAsync(subject, DateTimeOffset.UtcNow, CancellationToken.None));

        Assert.Equal(users[0].Id, users[1].Id);
        await using var verification = new ApplicationDbContext(options);
        Assert.Equal(1, await verification.Users.CountAsync(user => user.Issuer == subject.Issuer && user.Subject == subject.Subject));
    }

    [Fact]
    public async Task IdentityProvisioningDoesNotMisclassifyUnrelatedPersistenceFailure()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new ApplicationDbContext(options);
        await context.Database.MigrateAsync();
        var store = new PostgreSqlInternalUserStore(context);
        var subject = new OidcSubject($"https://identity.test/{new string('i', 501)}", Guid.NewGuid().ToString("N"));

        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => store.FindOrCreateAsync(subject, DateTimeOffset.UtcNow, CancellationToken.None));

        Assert.IsType<PostgresException>(exception.InnerException);
        Assert.Equal(PostgresErrorCodes.StringDataRightTruncation, ((PostgresException)exception.InnerException!).SqlState);
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
    public async Task PostgreSqlEnforcesEveryLotModeMetadataAndOwnerConstraint()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new ApplicationDbContext(options);
        await context.Database.MigrateAsync();
        var firstOwner = Guid.NewGuid();
        var secondOwner = Guid.NewGuid();
        var firstProduct = Guid.NewGuid();
        var secondProduct = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        context.Users.AddRange(
            new InternalUser(firstOwner, $"https://issuer.test/{firstOwner}", $"subject-{firstOwner}", now),
            new InternalUser(secondOwner, $"https://issuer.test/{secondOwner}", $"subject-{secondOwner}", now));
        context.Products.AddRange(
            new ProductRecord { Id = firstProduct, OwnerUserId = firstOwner, DisplayName = "First product", NormalizedSearchName = "FIRST PRODUCT", CreatedAt = now, UpdatedAt = now },
            new ProductRecord { Id = secondProduct, OwnerUserId = secondOwner, DisplayName = "Second product", NormalizedSearchName = "SECOND PRODUCT", CreatedAt = now, UpdatedAt = now });
        await context.SaveChangesAsync();

        await AssertRejectedAsync(new LotRecord { Id = Guid.NewGuid(), OwnerUserId = firstOwner, ProductId = firstProduct, MeasuredValue = 1m, MeasuredUnit = "Gram", AvailabilityState = "Low", StorageLocation = "Pantry", Version = 1, CreatedAt = now, UpdatedAt = now }, "ck_lots_quantity_mode");
        await AssertRejectedAsync(new LotRecord { Id = Guid.NewGuid(), OwnerUserId = firstOwner, ProductId = firstProduct, MeasuredValue = 1m, MeasuredUnit = "Pound", StorageLocation = "Pantry", Version = 1, CreatedAt = now, UpdatedAt = now }, "ck_lots_measured_unit");
        await AssertRejectedAsync(new LotRecord { Id = Guid.NewGuid(), OwnerUserId = firstOwner, ProductId = firstProduct, AvailabilityState = "Maybe", StorageLocation = "Pantry", Version = 1, CreatedAt = now, UpdatedAt = now }, "ck_lots_availability_state");
        await AssertRejectedAsync(new LotRecord { Id = Guid.NewGuid(), OwnerUserId = firstOwner, ProductId = firstProduct, AvailabilityState = "Low", StorageLocation = "Other", Version = 1, CreatedAt = now, UpdatedAt = now }, "ck_lots_storage");
        await AssertRejectedAsync(new LotRecord { Id = Guid.NewGuid(), OwnerUserId = firstOwner, ProductId = firstProduct, AvailabilityState = "Low", StorageLocation = "Pantry", CustomLocation = "Shelf", Version = 1, CreatedAt = now, UpdatedAt = now }, "ck_lots_storage");
        await AssertRejectedAsync(new LotRecord { Id = Guid.NewGuid(), OwnerUserId = firstOwner, ProductId = firstProduct, AvailabilityState = "Low", StorageLocation = "Pantry", PackageState = "Damaged", Version = 1, CreatedAt = now, UpdatedAt = now }, "ck_lots_package_state");
        await AssertRejectedAsync(new LotRecord { Id = Guid.NewGuid(), OwnerUserId = firstOwner, ProductId = firstProduct, AvailabilityState = "Low", StorageLocation = "Pantry", PrintedExpirationDate = new DateOnly(2026, 12, 31), Version = 1, CreatedAt = now, UpdatedAt = now }, "ck_lots_expiration_provenance");
        await AssertRejectedAsync(new LotRecord { Id = Guid.NewGuid(), OwnerUserId = secondOwner, ProductId = firstProduct, AvailabilityState = "Low", StorageLocation = "Pantry", Version = 1, CreatedAt = now, UpdatedAt = now }, null);

        var validLotId = Guid.NewGuid();
        context.Lots.Add(new LotRecord { Id = validLotId, OwnerUserId = firstOwner, ProductId = firstProduct, MeasuredValue = LotQuantity.MaximumMeasuredValue, MeasuredUnit = "Gram", StorageLocation = "Other", CustomLocation = "Top shelf", PackageState = "Opened", PrintedExpirationDate = new DateOnly(2026, 12, 31), ExpirationProvenance = "UserEntered", Version = 1, CreatedAt = now, UpdatedAt = now });
        await context.SaveChangesAsync();
        Assert.Equal(LotQuantity.MaximumMeasuredValue, await context.Lots.AsNoTracking().Where(lot => lot.Id == validLotId).Select(lot => lot.MeasuredValue).SingleAsync());

        async Task AssertRejectedAsync(LotRecord lot, string? expectedConstraint)
        {
            context.Lots.Add(lot);
            var exception = await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
            var postgres = Assert.IsType<PostgresException>(exception.InnerException);
            if (expectedConstraint is not null)
            {
                Assert.Equal(expectedConstraint, postgres.ConstraintName);
            }

            context.ChangeTracker.Clear();
        }
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
        var response = new InventoryLotView(lot.Id, product.Id, product.DisplayName, new InventoryQuantity(10m, "Gram", null), "Pantry", null, null, null, null, lot.ConcurrencyToken, now, now);
        var idempotency = new InventoryIdempotencyWrite(Guid.NewGuid(), "inventory.lots.create", new string('A', 64), InventoryApplicationSuccess.Created, response, now);
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
        var concurrencyToken = Guid.NewGuid();
        var lot = InventoryLot.Restore(lotId, ownerId, productId, new LotQuantity.Measured(10m, CanonicalUnit.Gram), storage!, null, null, null, 1, concurrencyToken, now, now, null);
        var transaction = lot.AdjustMeasured(InventoryTransactionType.Consume, 1m, "test", null, Guid.NewGuid(), now.AddMinutes(1));
        var invalidTransaction = InventoryTransaction.Create(lotId, Guid.NewGuid(), transaction.Type, transaction.PreviousQuantity, transaction.ResultingQuantity, transaction.ReasonCode, transaction.Note, transaction.IdempotencyKey, transaction.OccurredAt);
        var response = new InventoryLotView(lot.Id, product.Id, product.DisplayName, new InventoryQuantity(9m, "Gram", null), "Pantry", null, null, null, null, lot.ConcurrencyToken, lot.CreatedAt, lot.UpdatedAt);
        var idempotency = new InventoryIdempotencyWrite(transaction.IdempotencyKey!.Value, "inventory.lots.adjust", new string('B', 64), InventoryApplicationSuccess.Succeeded, response, now.AddMinutes(1));
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
