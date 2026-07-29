using KitchenFlow.Api.Inventory;
using KitchenFlow.Api.Services;
using KitchenFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("KitchenFlow");
if (string.IsNullOrWhiteSpace(connectionString))
{
    connectionString = builder.Configuration["KITCHENFLOW_DB_CONNECTION"];
}

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("KitchenFlow database configuration is required.");
}
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<CurrentUserService>();
builder.Services.AddAntiforgery(options => { options.HeaderName = "X-CSRF-TOKEN"; options.Cookie.Name = "__Host-kitchenflow-antiforgery"; options.Cookie.SecurePolicy = CookieSecurePolicy.Always; });
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options => { options.Cookie.Name = "__Host-kitchenflow-session"; options.Cookie.SecurePolicy = CookieSecurePolicy.Always; options.Cookie.HttpOnly = true; options.Cookie.SameSite = SameSiteMode.Lax; options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; }; }).AddOpenIdConnect("oidc", options => { options.Authority = builder.Configuration["Oidc:Authority"] ?? "http://127.0.0.1:8080/realms/kitchenflow"; options.ClientId = builder.Configuration["Oidc:ClientId"] ?? "kitchenflow-backend"; options.ClientSecret = builder.Configuration["Oidc:ClientSecret"] ?? "development-only-change-me"; options.ResponseType = "code"; options.UsePkce = true; options.SaveTokens = false; options.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); });
builder.Services.AddAuthorization();
builder.Services.AddOpenApi();
builder.Services.AddOpenTelemetry().WithTracing(tracing => tracing.AddAspNetCoreInstrumentation().AddEntityFrameworkCoreInstrumentation()).WithMetrics(metrics => metrics.AddAspNetCoreInstrumentation());

var app = builder.Build();
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(error => error.Run(async context => { context.Response.StatusCode = 500; await Results.Problem(statusCode: 500, extensions: new Dictionary<string, object?> { ["errorCode"] = "unexpected_error", ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context); }));
}
app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();
app.MapOpenApi("/openapi/{documentName}.json").AllowAnonymous();
app.MapGet("/health/live", () => Results.Ok()).AllowAnonymous();
app.MapGet("/health/ready", async (ApplicationDbContext db, CancellationToken ct) => await db.Database.CanConnectAsync(ct) ? Results.Ok() : Results.StatusCode(503)).AllowAnonymous();
var api = app.MapGroup("/api/v1");
api.MapPost("/auth/login", (string? returnUrl) => Results.Challenge(new AuthenticationProperties { RedirectUri = returnUrl is not null && returnUrl.StartsWith('/') && !returnUrl.StartsWith("//", StringComparison.Ordinal) ? returnUrl : "/" }, ["oidc"])).AllowAnonymous();
api.MapPost("/auth/logout", async (HttpContext context) => { await context.SignOutAsync(); return Results.NoContent(); }).RequireAuthorization();
api.MapGet("/session", (HttpContext context, IAntiforgery antiforgery) => { var tokens = antiforgery.GetAndStoreTokens(context); return Results.Ok(new { userId = context.User.Identity?.Name, csrfToken = tokens.RequestToken, supportedLocales = new[] { "en", "pt-BR", "es" } }); }).RequireAuthorization();
api.MapGroup("/inventory").RequireAuthorization().MapInventoryEndpoints();
app.Run();

public partial class Program;
