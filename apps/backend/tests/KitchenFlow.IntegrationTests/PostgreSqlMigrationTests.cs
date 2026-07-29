using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Identity;
using Microsoft.EntityFrameworkCore;
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

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();
}
