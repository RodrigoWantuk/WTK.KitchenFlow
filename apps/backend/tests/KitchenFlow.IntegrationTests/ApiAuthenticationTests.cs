using System.Security.Claims;
using System.Text.Encodings.Web;
using KitchenFlow.Api.Services;
using KitchenFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Testcontainers.PostgreSql;

namespace KitchenFlow.IntegrationTests;

public sealed class ApiAuthenticationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18.4")
        .WithDatabase("kitchenflow_api_test")
        .WithUsername("kitchenflow_test")
        .WithPassword("development-only-test-password")
        .Build();

    [Fact]
    public async Task ProtectedSessionReturnsUnauthorizedWithoutAuthentication()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: false);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        var response = await client.GetAsync("/api/v1/session");

        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AuthenticatedSessionProvisionsInternalUserAndReturnsCsrfToken()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        var response = await client.GetAsync("/api/v1/session");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("csrfToken", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task AuthenticatedUserCannotReadAnotherUsersLot()
    {
        await using var factory = new KitchenFlowFactory(_postgres.GetConnectionString(), authenticate: true);
        await factory.EnsureDatabaseAsync();
        var lotId = await factory.SeedOtherUsersLotAsync();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        var response = await client.GetAsync($"/api/v1/inventory/lots/{lotId}");

        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    private sealed class KitchenFlowFactory(string connectionString, bool authenticate) : WebApplicationFactory<Program>
    {
        public async Task EnsureDatabaseAsync()
        {
            using var scope = Services.CreateScope();
            await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Database.MigrateAsync();
        }

        public async Task<Guid> SeedOtherUsersLotAsync()
        {
            using var scope = Services.CreateScope();
            var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var ownerId = Guid.NewGuid();
            var productId = Guid.NewGuid();
            var lotId = Guid.NewGuid();
            var now = DateTimeOffset.UtcNow;
            database.Products.Add(new ProductRecord { Id = productId, OwnerUserId = ownerId, DisplayName = "Private tomato", NormalizedSearchName = "PRIVATE TOMATO", CreatedAt = now, UpdatedAt = now });
            database.Lots.Add(new LotRecord { Id = lotId, OwnerUserId = ownerId, ProductId = productId, MeasuredValue = 100m, MeasuredUnit = "Gram", StorageLocation = "Pantry", Version = 1, CreatedAt = now, UpdatedAt = now });
            await database.SaveChangesAsync();
            return lotId;
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:KitchenFlow", connectionString);
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
                if (authenticate)
                {
                    services.AddAuthentication(TestAuthenticationHandler.TestScheme)
                        .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(TestAuthenticationHandler.TestScheme, _ => { });
                }
            });
        }
    }

    private sealed class TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
        : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        public const string TestScheme = "Test";

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var identity = new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "integration-user"), new Claim("iss", "https://integration.test")], TestScheme);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), TestScheme)));
        }
    }
}
