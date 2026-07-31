using KitchenFlow.Api.Inventory;
using KitchenFlow.Api.Observability;
using KitchenFlow.Api.Services;
using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Inventory.Application;
using KitchenFlow.Modules.Identity;
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
builder.Services.AddOptions<IdempotencyOptions>()
    .Bind(builder.Configuration.GetSection("Idempotency"))
    .Validate(options => options.IsValid(), "Idempotency:Retention must be between 1 and 90 days.")
    .ValidateOnStart();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<CurrentUserService>();
builder.Services.AddScoped<IOidcSubjectAccessor>(provider => provider.GetRequiredService<CurrentUserService>());
builder.Services.AddScoped<IInternalUserStore, PostgreSqlInternalUserStore>();
builder.Services.AddScoped<ICurrentUserAccessor, CurrentUserResolver>();
builder.Services.AddScoped<IInventoryLotReadStore, PostgreSqlInventoryLotReadStore>();
builder.Services.AddScoped<IInventoryLotWriteStore, PostgreSqlInventoryLotWriteStore>();
builder.Services.AddSingleton<IInventoryHttpTokenService, DataProtectionInventoryHttpTokenService>();
builder.Services.AddSingleton<InventoryMetrics>();
builder.Services.AddScoped<InventoryLotApplicationService>();
builder.Services.AddScoped<ICreateInventoryLotUseCase>(provider => provider.GetRequiredService<InventoryLotApplicationService>());
builder.Services.AddScoped<IListInventoryLotsUseCase>(provider => provider.GetRequiredService<InventoryLotApplicationService>());
builder.Services.AddScoped<IGetInventoryLotUseCase>(provider => provider.GetRequiredService<InventoryLotApplicationService>());
builder.Services.AddScoped<IUpdateInventoryLotUseCase>(provider => provider.GetRequiredService<InventoryLotApplicationService>());
builder.Services.AddScoped<IAdjustInventoryLotUseCase>(provider => provider.GetRequiredService<InventoryLotApplicationService>());
builder.Services.AddScoped<IDeleteInventoryLotUseCase>(provider => provider.GetRequiredService<InventoryLotApplicationService>());
builder.Services.AddScoped<IGetInventoryLotHistoryUseCase>(provider => provider.GetRequiredService<InventoryLotApplicationService>());
builder.Services.AddScoped<InventoryApplicationService>();
builder.Services.AddSingleton<InventoryLotLifecycleUseCase>();
builder.Services.AddAntiforgery(options => { options.HeaderName = "X-CSRF-TOKEN"; options.Cookie.Name = "__Host-kitchenflow-antiforgery"; options.Cookie.Path = "/"; options.Cookie.SecurePolicy = CookieSecurePolicy.Always; });
var keyRingPath = Environment.GetEnvironmentVariable("KITCHENFLOW_SESSION_KEYRING_PATH");
var dataProtection = builder.Services.AddDataProtection().SetApplicationName("KitchenFlow");
if (!string.IsNullOrWhiteSpace(keyRingPath))
{
    dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keyRingPath));
}

var oidcAuthority = Environment.GetEnvironmentVariable("KITCHENFLOW_OIDC_AUTHORITY") ?? builder.Configuration["Oidc:Authority"];
var oidcClientId = Environment.GetEnvironmentVariable("KITCHENFLOW_OIDC_CLIENT_ID") ?? builder.Configuration["Oidc:ClientId"];
var oidcClientSecret = Environment.GetEnvironmentVariable("KITCHENFLOW_OIDC_CLIENT_SECRET") ?? builder.Configuration["Oidc:ClientSecret"];
var configurationReadiness = new RuntimeConfigurationReadiness(builder.Environment.IsDevelopment(), connectionString, oidcAuthority, oidcClientId, oidcClientSecret, keyRingPath);
configurationReadiness.ThrowIfInvalidForNonDevelopment();
builder.Services.AddSingleton(configurationReadiness);
if (string.IsNullOrWhiteSpace(oidcAuthority) || string.IsNullOrWhiteSpace(oidcClientId))
{
    throw new InvalidOperationException("KitchenFlow OIDC authority and client identifier configuration are required.");
}
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options => { options.Cookie.Name = "__Host-kitchenflow-session"; options.Cookie.Path = "/"; options.Cookie.SecurePolicy = CookieSecurePolicy.Always; options.Cookie.HttpOnly = true; options.Cookie.SameSite = SameSiteMode.Lax; options.Events.OnRedirectToLogin = context => Results.Problem(statusCode: StatusCodes.Status401Unauthorized, extensions: new Dictionary<string, object?> { ["errorCode"] = "authentication_required", ["traceId"] = context.HttpContext.TraceIdentifier }).ExecuteAsync(context.HttpContext); }).AddOpenIdConnect("oidc", options => { options.Authority = oidcAuthority; options.ClientId = oidcClientId; options.ClientSecret = oidcClientSecret; options.ResponseType = "code"; options.UsePkce = true; options.SaveTokens = false; options.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); });
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) => await Results.Problem(statusCode: StatusCodes.Status429TooManyRequests, extensions: new Dictionary<string, object?> { ["errorCode"] = "rate_limit_exceeded" }).ExecuteAsync(context.HttpContext);
    options.AddPolicy("authentication", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    options.AddPolicy("mutation", context => RateLimitPartition.GetFixedWindowLimiter(context.User.FindFirst("sub")?.Value ?? context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 60, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
builder.Services.AddOpenApi(options => options.AddDocumentTransformer(InventoryOpenApiTransformer.ApplyAsync));
builder.Services.AddOpenTelemetry().WithTracing(tracing => tracing.AddAspNetCoreInstrumentation().AddEntityFrameworkCoreInstrumentation().AddProcessor(new SensitiveTelemetryRedactionProcessor())).WithMetrics(metrics => metrics.AddAspNetCoreInstrumentation().AddMeter("KitchenFlow.Inventory"));

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
app.MapGet("/health/ready", async (ApplicationDbContext db, RuntimeConfigurationReadiness readiness, CancellationToken ct) => !readiness.IsReady || !await db.Database.CanConnectAsync(ct) ? Results.StatusCode(503) : Results.Ok()).AllowAnonymous();
var api = app.MapGroup("/api/v1");
api.MapPost("/auth/login", (string? returnUrl) => Results.Challenge(new AuthenticationProperties { RedirectUri = ReturnUrlPolicy.Normalize(returnUrl) }, ["oidc"])).AllowAnonymous().RequireRateLimiting("authentication").Produces(StatusCodes.Status302Found);
api.MapPost("/auth/logout", async (HttpContext context, IAntiforgery antiforgery) =>
{
    try { await antiforgery.ValidateRequestAsync(context); }
    catch (AntiforgeryValidationException) { return Results.Problem(statusCode: 400, extensions: new Dictionary<string, object?> { ["errorCode"] = "validation_failed" }); }
    return Results.SignOut(new AuthenticationProperties { RedirectUri = "/" }, [CookieAuthenticationDefaults.AuthenticationScheme, "oidc"]);
}).RequireAuthorization().Produces(StatusCodes.Status302Found).ProducesProblem(400).ProducesProblem(401);
api.MapGet("/session", async (HttpContext context, IAntiforgery antiforgery, ICurrentUserAccessor currentUser, CancellationToken cancellationToken) =>
{
    var user = await currentUser.GetCurrentAsync(cancellationToken);
    var tokens = antiforgery.GetAndStoreTokens(context);
    return Results.Ok(new SessionResponse(user.Id, tokens.RequestToken!, ["en", "pt-BR", "es"]));
}).RequireAuthorization().Produces<SessionResponse>().ProducesProblem(401);
api.MapGroup("/inventory").RequireAuthorization().MapInventoryEndpoints();
app.Run();

/// <summary>Exposes the application entry point to the integration-test host.</summary>
public partial class Program;
