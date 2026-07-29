using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace KitchenFlow.Infrastructure.Persistence;

/// <summary>
/// Creates the design-time PostgreSQL context used exclusively by Entity Framework migration
/// tooling. The development fallback is intentionally non-production and documented in the local
/// environment guide.
/// </summary>
public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    /// <inheritdoc />
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("KITCHENFLOW_DB_CONNECTION")
            ?? "Host=127.0.0.1;Port=5432;Database=kitchenflow;Username=kitchenflow_dev;Password=development-only-change-me";
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(connectionString)
            .Options;
        return new ApplicationDbContext(options);
    }
}
