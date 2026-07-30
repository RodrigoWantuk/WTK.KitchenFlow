using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;
using KitchenFlow.Modules.Inventory.Application;
using Microsoft.AspNetCore.DataProtection;

namespace KitchenFlow.Api.Inventory;

/// <summary>
/// HTTP-only adapter for the module-owned <see cref="InventoryLotApplicationService"/>. It maps
/// request headers and JSON DTOs to typed commands and maps typed outcomes to HTTP results; it
/// contains no domain rules, Entity Framework access, or persistence orchestration.
/// </summary>
public sealed class InventoryApplicationService(InventoryLotApplicationService applicationService)
{
    /// <summary>Maps the lot-list query to a transport result.</summary>
    public async Task<IResult> ListAsync(int? pageSize, string? status, string? storageLocation, string? search, string? cursor, HttpContext context, CancellationToken cancellationToken) =>
        ToResult(await applicationService.ListAsync(pageSize, status, storageLocation, search, cursor, cancellationToken), ToResponse, context.TraceIdentifier);

    /// <summary>Maps the lot-read query to a transport result.</summary>
    public async Task<IResult> GetAsync(Guid lotId, HttpContext context, CancellationToken cancellationToken) =>
        ToResult(await applicationService.GetAsync(lotId, cancellationToken), ToResponse, context.TraceIdentifier);

    /// <summary>Maps a create-lot HTTP DTO and idempotency header to the module command.</summary>
    public async Task<IResult> CreateAsync(CreateLotRequest request, HttpRequest requestContext, CancellationToken cancellationToken)
    {
        var key = Guid.TryParse(requestContext.Headers["Idempotency-Key"], out var parsed) ? parsed : (Guid?)null;
        var command = new CreateInventoryLotCommand(request.ProductName, request.Quantity?.MeasuredValue, request.Quantity?.Unit, request.Quantity?.AvailabilityState, request.StorageLocation, request.CustomLocation, request.PackageState, request.PrintedExpirationDate, request.Notes, key, requestContext.HttpContext.TraceIdentifier);
        return ToResult(await applicationService.CreateAsync(command, cancellationToken), ToResponse, requestContext.HttpContext.TraceIdentifier);
    }

    /// <summary>Maps a metadata-correction DTO and ETag header to the module command.</summary>
    public async Task<IResult> UpdateAsync(Guid lotId, UpdateLotRequest request, HttpRequest requestContext, CancellationToken cancellationToken)
    {
        var command = new UpdateInventoryLotCommand(lotId, request.ProductName, request.StorageLocation, request.CustomLocation, request.PackageState, request.PrintedExpirationDate, request.Notes, ReadPrecondition(requestContext), requestContext.HttpContext.TraceIdentifier);
        return ToResult(await applicationService.UpdateAsync(command, cancellationToken), ToResponse, requestContext.HttpContext.TraceIdentifier);
    }

    /// <summary>Maps an adjustment DTO, idempotency header, and ETag header to the module command.</summary>
    public async Task<IResult> AdjustAsync(Guid lotId, AdjustmentRequest request, HttpRequest requestContext, CancellationToken cancellationToken)
    {
        var key = Guid.TryParse(requestContext.Headers["Idempotency-Key"], out var parsed) ? parsed : (Guid?)null;
        var command = new AdjustInventoryLotCommand(lotId, request.Type, request.Value, request.AvailabilityState, request.ReasonCode, request.Note, key, ReadPrecondition(requestContext), requestContext.HttpContext.TraceIdentifier);
        return ToResult(await applicationService.AdjustAsync(command, cancellationToken), ToResponse, requestContext.HttpContext.TraceIdentifier);
    }

    /// <summary>Maps a delete request and ETag header to the module command.</summary>
    public async Task<IResult> DeleteAsync(Guid lotId, HttpRequest requestContext, CancellationToken cancellationToken)
    {
        var command = new DeleteInventoryLotCommand(lotId, ReadPrecondition(requestContext), requestContext.HttpContext.TraceIdentifier);
        return ToResult(await applicationService.DeleteAsync(command, cancellationToken), ToResponse, requestContext.HttpContext.TraceIdentifier);
    }

    /// <summary>Maps immutable lot history to its API DTO.</summary>
    public async Task<IResult> HistoryAsync(Guid lotId, HttpContext context, CancellationToken cancellationToken) =>
        ToResult(await applicationService.HistoryAsync(lotId, cancellationToken), items => (IReadOnlyList<LotHistoryResponse>)items.Select(item => new LotHistoryResponse(item.EntryId, item.Kind, item.TransactionType, ToQuantity(item.PreviousQuantity), ToQuantity(item.ResultingQuantity), item.ReasonCode, item.ChangedFields, item.OccurredAt)).ToList(), context.TraceIdentifier);

    private static LotResponse ToResponse(InventoryLotView item) => new(item.LotId, item.ProductId, item.ProductName, ToQuantity(item.Quantity)!, item.StorageLocation, item.CustomLocation, item.PackageState, item.PrintedExpirationDate, item.Notes, item.Version, item.CreatedAt, item.UpdatedAt);
    private static ListLotsResponse ToResponse(InventoryLotList page) => new(page.Items.Select(ToResponse).ToList(), page.NextCursor);
    private static QuantityResponse? ToQuantity(InventoryQuantity? quantity) => quantity is null ? null : new QuantityResponse(quantity.MeasuredValue, quantity.Unit, quantity.AvailabilityState);

    private static IResult ToResult<TSource, TResponse>(InventoryApplicationResult<TSource> result, Func<TSource, TResponse> map, string traceId)
    {
        if (result.Problem is not null)
        {
            var extensions = new Dictionary<string, object?> { ["errorCode"] = result.Problem.ErrorCode, ["traceId"] = Activity.Current?.Id ?? traceId };
            if (result.Problem.Errors is not null) { extensions["errors"] = result.Problem.Errors; }
            return Results.Problem(detail: result.Problem.Detail, statusCode: result.StatusCode, extensions: extensions);
        }

        if (result.StatusCode == StatusCodes.Status204NoContent) { return Results.NoContent(); }
        return new EtagResult<TResponse>(map(result.Value!), result.ETag, result.StatusCode);
    }

    private static InventoryVersionPrecondition ReadPrecondition(HttpRequest request)
    {
        var raw = request.Headers.IfMatch.ToString();
        if (string.IsNullOrWhiteSpace(raw)) { return InventoryVersionPrecondition.Missing; }
        var tokens = request.HttpContext.RequestServices.GetRequiredService<IInventoryTransportTokenService>();
        return tokens.TryUnprotectVersion(raw.Trim('"'), out var version) ? InventoryVersionPrecondition.Valid(version) : InventoryVersionPrecondition.Invalid;
    }

    private sealed class EtagResult<T>(T body, string? etag, int statusCode) : IResult
    {
        public Task ExecuteAsync(HttpContext httpContext)
        {
            httpContext.Response.StatusCode = statusCode;
            if (!string.IsNullOrWhiteSpace(etag)) { httpContext.Response.Headers.ETag = etag; }
            return httpContext.Response.WriteAsJsonAsync(body);
        }
    }
}

/// <summary>
/// ASP.NET Core Data Protection implementation of the module token boundary. It deliberately
/// scopes version and cursor purposes separately so neither opaque value can be substituted for
/// the other.
/// </summary>
public sealed class DataProtectionInventoryTransportTokenService(IDataProtectionProvider dataProtection) : IInventoryTransportTokenService
{
    private const string VersionPurpose = "KitchenFlow.Inventory.LotVersion.v1";
    private const string CursorPurpose = "KitchenFlow.Inventory.LotCursor.v1";

    /// <inheritdoc />
    public string ProtectVersion(long version) => dataProtection.CreateProtector(VersionPurpose).Protect(version.ToString(System.Globalization.CultureInfo.InvariantCulture));

    /// <inheritdoc />
    public bool TryUnprotectVersion(string token, out long version)
    {
        try
        {
            return long.TryParse(dataProtection.CreateProtector(VersionPurpose).Unprotect(token), System.Globalization.NumberStyles.None, System.Globalization.CultureInfo.InvariantCulture, out version);
        }
        catch (CryptographicException)
        {
            version = 0;
            return false;
        }
    }

    /// <inheritdoc />
    public string ProtectCursor(InventoryLotReadCursor cursor) => dataProtection.CreateProtector(CursorPurpose).Protect(JsonSerializer.Serialize(cursor));

    /// <inheritdoc />
    public bool TryUnprotectCursor(string cursor, out InventoryLotReadCursor? position)
    {
        try
        {
            position = JsonSerializer.Deserialize<InventoryLotReadCursor>(dataProtection.CreateProtector(CursorPurpose).Unprotect(cursor));
            return position is not null;
        }
        catch (Exception exception) when (exception is CryptographicException or JsonException or FormatException)
        {
            position = null;
            return false;
        }
    }
}
