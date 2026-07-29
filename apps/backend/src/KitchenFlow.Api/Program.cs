using KitchenFlow.Api.Inventory;
using KitchenFlow.Api.Observability;
using KitchenFlow.Api.Services;
using KitchenFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Logging;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
IdentityModelEventSource.ShowPII = false;
builder.Logging.AddFilter("Microsoft.AspNetCore.Authentication", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Warning);
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
builder.Services.AddAntiforgery(options => { options.HeaderName = "X-CSRF-TOKEN"; options.Cookie.Name = "__Host-kitchenflow-antiforgery"; options.Cookie.Path = "/"; options.Cookie.SecurePolicy = CookieSecurePolicy.Always; });
var keyRingPath = Environment.GetEnvironmentVariable("KITCHENFLOW_SESSION_KEYRING_PATH");
var dataProtection = builder.Services.AddDataProtection().SetApplicationName("KitchenFlow");
if (!string.IsNullOrWhiteSpace(keyRingPath))
{
    dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keyRingPath));
}

var oidcAuthority = Environment.GetEnvironmentVariable("KITCHENFLOW_OIDC_AUTHORITY") ?? builder.Configuration["Oidc:Authority"] ?? "http://127.0.0.1:8080/realms/kitchenflow";
var oidcClientId = Environment.GetEnvironmentVariable("KITCHENFLOW_OIDC_CLIENT_ID") ?? builder.Configuration["Oidc:ClientId"] ?? "kitchenflow-backend";
var oidcClientSecret = Environment.GetEnvironmentVariable("KITCHENFLOW_OIDC_CLIENT_SECRET") ?? builder.Configuration["Oidc:ClientSecret"] ?? "development-only-change-me";
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options => { options.Cookie.Name = "__Host-kitchenflow-session"; options.Cookie.Path = "/"; options.Cookie.SecurePolicy = CookieSecurePolicy.Always; options.Cookie.HttpOnly = true; options.Cookie.SameSite = SameSiteMode.Lax; options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; }; }).AddOpenIdConnect("oidc", options => { options.Authority = oidcAuthority; options.ClientId = oidcClientId; options.ClientSecret = oidcClientSecret; options.ResponseType = "code"; options.UsePkce = true; options.SaveTokens = false; options.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); });
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) => await Results.Problem(statusCode: StatusCodes.Status429TooManyRequests, extensions: new Dictionary<string, object?> { ["errorCode"] = "rate_limit_exceeded" }).ExecuteAsync(context.HttpContext);
    options.AddPolicy("authentication", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    options.AddPolicy("mutation", context => RateLimitPartition.GetFixedWindowLimiter(context.User.FindFirst("sub")?.Value ?? context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 60, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
builder.Services.AddOpenApi(options => options.AddDocumentTransformer(InventoryOpenApiTransformer.ApplyAsync));
builder.Services.AddOpenTelemetry().WithTracing(tracing => tracing.AddAspNetCoreInstrumentation().AddEntityFrameworkCoreInstrumentation().AddProcessor(new SensitiveTelemetryRedactionProcessor())).WithMetrics(metrics => metrics.AddAspNetCoreInstrumentation());

var app = builder.Build();
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(error => error.Run(async context => { context.Response.StatusCode = 500; await Results.Problem(statusCode: 500, extensions: new Dictionary<string, object?> { ["errorCode"] = "unexpected_error", ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context); }));
}
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseAntiforgery();
app.MapOpenApi("/openapi/{documentName}.json").AllowAnonymous();
app.MapGet("/health/live", () => Results.Ok()).AllowAnonymous();
app.MapGet("/health/ready", async (ApplicationDbContext db, CancellationToken ct) => await db.Database.CanConnectAsync(ct) ? Results.Ok() : Results.StatusCode(503)).AllowAnonymous();
var api = app.MapGroup("/api/v1");
api.MapPost("/auth/login", (string? returnUrl) => Results.Challenge(new AuthenticationProperties { RedirectUri = returnUrl is not null && returnUrl.StartsWith('/') && !returnUrl.StartsWith("//", StringComparison.Ordinal) ? returnUrl : "/" }, ["oidc"])).AllowAnonymous().RequireRateLimiting("authentication");
api.MapPost("/auth/logout", async (HttpContext context, IAntiforgery antiforgery) =>
{
    try { await antiforgery.ValidateRequestAsync(context); }
    catch (AntiforgeryValidationException) { return Results.Problem(statusCode: 400, extensions: new Dictionary<string, object?> { ["errorCode"] = "validation_failed" }); }
    return Results.SignOut(new AuthenticationProperties { RedirectUri = "/" }, [CookieAuthenticationDefaults.AuthenticationScheme, "oidc"]);
}).RequireAuthorization();
api.MapGet("/session", async (HttpContext context, IAntiforgery antiforgery, CurrentUserService currentUser, CancellationToken cancellationToken) =>
{
    var user = await currentUser.GetOrCreateAsync(cancellationToken);
    var tokens = antiforgery.GetAndStoreTokens(context);
    return Results.Ok(new { userId = user.Id, csrfToken = tokens.RequestToken, supportedLocales = new[] { "en", "pt-BR", "es" } });
}).RequireAuthorization();
api.MapGroup("/inventory").RequireAuthorization().MapInventoryEndpoints();
app.Run();

public partial class Program;
