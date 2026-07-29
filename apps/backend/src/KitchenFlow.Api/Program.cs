using KitchenFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("KitchenFlow")
    ?? builder.Configuration["KITCHENFLOW_DB_CONNECTION"]
    ?? throw new InvalidOperationException("KitchenFlow database configuration is required.");
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
var app = builder.Build();

app.MapGet("/", () => "KitchenFlow API");

app.Run();
