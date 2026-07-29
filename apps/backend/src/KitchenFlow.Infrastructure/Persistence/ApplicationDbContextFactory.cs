using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace KitchenFlow.Infrastructure.Persistence;

public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
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
