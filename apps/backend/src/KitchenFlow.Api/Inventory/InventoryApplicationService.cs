using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;
using KitchenFlow.Modules.Inventory.Application;
using Microsoft.AspNetCore.DataProtection;

namespace KitchenFlow.Api.Inventory;

/// <summary>
/// HTTP-only adapter for Inventory use cases. It owns all opaque HTTP token parsing and formatting;
/// the Inventory module accepts only decoded versions and cursor positions.
/// </summary>
public sealed class InventoryApplicationService(InventoryLotApplicationService applicationService, IInventoryHttpTokenService tokens, InventoryMetrics metrics)
{
    /// <summary>Maps the lot-list query and its optional opaque cursor to a transport result.</summary>
    public async Task<IResult> ListAsync(int? pageSize, string? status, string? storageLocation, string? search, string? cursor, HttpContext context, CancellationToken cancellationToken)
    {
        if (!tokens.TryReadCursor(cursor, out var position))
        {
            return Problem("invalid_cursor", "The cursor is invalid.", StatusCodes.Status400BadRequest, context.TraceIdentifier);
        }

        return ToResult(await applicationService.ListAsync(new ListInventoryLotsQuery(pageSize, status, storageLocation, search, position), cancellationToken), page => new ListLotsResponse(page.Items.Select(ToResponse).ToList(), page.NextCursor is null ? null : tokens.WriteCursor(page.NextCursor)), context.TraceIdentifier);
    }

    /// <summary>Maps the lot-read query to a transport result.</summary>
    public async Task<IResult> GetAsync(Guid lotId, HttpContext context, CancellationToken cancellationToken) =>
        ToLotResult("get", await applicationService.GetAsync(lotId, cancellationToken), context.TraceIdentifier);

    /// <summary>Maps a create-lot HTTP DTO and idempotency header to the application command.</summary>
    public async Task<IResult> CreateAsync(CreateLotRequest request, HttpRequest requestContext, CancellationToken cancellationToken)
    {
        var key = Guid.TryParse(requestContext.Headers["Idempotency-Key"], out var parsed) ? parsed : (Guid?)null;
        var command = new CreateInventoryLotCommand(request.ProductName, request.Quantity?.MeasuredValue, request.Quantity?.Unit, request.Quantity?.AvailabilityState, request.StorageLocation, request.CustomLocation, request.PackageState, request.PrintedExpirationDate, request.Notes, key, requestContext.HttpContext.TraceIdentifier);
        return ToLotResult("create", await applicationService.CreateAsync(command, cancellationToken), requestContext.HttpContext.TraceIdentifier);
    }

    /// <summary>Maps a metadata-correction DTO and decoded ETag precondition to the application command.</summary>
    public async Task<IResult> UpdateAsync(Guid lotId, UpdateLotRequest request, HttpRequest requestContext, CancellationToken cancellationToken)
    {
        var command = new UpdateInventoryLotCommand(lotId, request.ProductName, request.StorageLocation, request.CustomLocation, request.PackageState, request.PrintedExpirationDate, request.Notes, ReadPrecondition(requestContext), requestContext.HttpContext.TraceIdentifier);
        return ToLotResult("metadata_update", await applicationService.UpdateAsync(command, cancellationToken), requestContext.HttpContext.TraceIdentifier);
    }

    /// <summary>Maps an adjustment DTO, idempotency header, and decoded ETag precondition to the application command.</summary>
    public async Task<IResult> AdjustAsync(Guid lotId, AdjustmentRequest request, HttpRequest requestContext, CancellationToken cancellationToken)
    {
        var key = Guid.TryParse(requestContext.Headers["Idempotency-Key"], out var parsed) ? parsed : (Guid?)null;
        var command = new AdjustInventoryLotCommand(lotId, request.Type, request.Value, request.AvailabilityState, request.ReasonCode, request.Note, key, ReadPrecondition(requestContext), requestContext.HttpContext.TraceIdentifier);
        return ToLotResult("adjust", await applicationService.AdjustAsync(command, cancellationToken), requestContext.HttpContext.TraceIdentifier);
    }

    /// <summary>Maps a delete request and decoded ETag precondition to the application command.</summary>
    public async Task<IResult> DeleteAsync(Guid lotId, HttpRequest requestContext, CancellationToken cancellationToken)
    {
        var command = new DeleteInventoryLotCommand(lotId, ReadPrecondition(requestContext), requestContext.HttpContext.TraceIdentifier);
        return ToLotResult("delete", await applicationService.DeleteAsync(command, cancellationToken), requestContext.HttpContext.TraceIdentifier);
    }

    /// <summary>Maps immutable lot history to its API DTO.</summary>
    public async Task<IResult> HistoryAsync(Guid lotId, HttpContext context, CancellationToken cancellationToken) =>
        ToResult(await applicationService.HistoryAsync(lotId, cancellationToken), items => (IReadOnlyList<LotHistoryResponse>)items.Select(item => new LotHistoryResponse(item.EntryId, item.Kind, item.TransactionType, ToQuantity(item.PreviousQuantity), ToQuantity(item.ResultingQuantity), item.ReasonCode, item.ChangedFields, item.OccurredAt)).ToList(), context.TraceIdentifier);

    private LotResponse ToResponse(InventoryLotView item) => ToResponse(item, tokens.WriteVersion(item.Version));
    private static LotResponse ToResponse(InventoryLotView item, string version) => new(item.LotId, item.ProductId, item.ProductName, ToQuantity(item.Quantity)!, item.StorageLocation, item.CustomLocation, item.PackageState, item.PrintedExpirationDate, item.Notes, version, item.CreatedAt, item.UpdatedAt);
    private static QuantityResponse? ToQuantity(InventoryQuantity? quantity) => quantity is null ? null : new QuantityResponse(quantity.MeasuredValue, quantity.Unit, quantity.AvailabilityState);

    private IResult ToLotResult(string operation, InventoryApplicationResult<InventoryLotView> result, string traceId)
    {
        metrics.RecordMutation(operation, result);
        if (result.Problem is not null)
        {
            return Problem(result.Problem.ErrorCode, result.Problem.Detail, StatusFor(result.Problem.ErrorCode), traceId, result.Problem.Errors);
        }

        if (result.Success == InventoryApplicationSuccess.Deleted)
        {
            return Results.NoContent();
        }

        var version = tokens.WriteVersion(result.Value!.Version);
        return new EtagResult<LotResponse>(ToResponse(result.Value!, version), Quote(version), StatusFor(result.Success));
    }

    private static IResult ToResult<TSource, TResponse>(InventoryApplicationResult<TSource> result, Func<TSource, TResponse> map, string traceId) =>
        result.Problem is not null
            ? Problem(result.Problem.ErrorCode, result.Problem.Detail, StatusFor(result.Problem.ErrorCode), traceId, result.Problem.Errors)
            : Results.Json(map(result.Value!), statusCode: StatusFor(result.Success));

    private InventoryVersionPrecondition ReadPrecondition(HttpRequest request)
    {
        var raw = request.Headers.IfMatch.ToString();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return InventoryVersionPrecondition.Missing;
        }

        return tokens.TryReadVersion(raw.Trim('"'), out var version) ? InventoryVersionPrecondition.Valid(version) : InventoryVersionPrecondition.Invalid;
    }

    private static int StatusFor(InventoryApplicationSuccess success) => success switch
    {
        InventoryApplicationSuccess.Created => StatusCodes.Status201Created,
        InventoryApplicationSuccess.Deleted => StatusCodes.Status204NoContent,
        _ => StatusCodes.Status200OK
    };

    private static int StatusFor(string errorCode) => errorCode switch
    {
        "validation_failed" or "invalid_cursor" => StatusCodes.Status400BadRequest,
        "resource_not_found" => StatusCodes.Status404NotFound,
        "precondition_required" => StatusCodes.Status428PreconditionRequired,
        "precondition_failed" => StatusCodes.Status412PreconditionFailed,
        "domain_rule_violated" => StatusCodes.Status422UnprocessableEntity,
        _ => StatusCodes.Status409Conflict
    };

    private static string Quote(string version) => $"\"{version}\"";

    private static IResult Problem(string errorCode, string detail, int statusCode, string traceId, IReadOnlyDictionary<string, string[]>? errors = null)
    {
        var extensions = new Dictionary<string, object?> { ["errorCode"] = errorCode, ["traceId"] = Activity.Current?.Id ?? traceId };
        if (errors is not null)
        {
            extensions["errors"] = errors;
        }

        return Results.Problem(detail: detail, statusCode: statusCode, extensions: extensions);
    }

    private sealed class EtagResult<T>(T body, string etag, int statusCode) : IResult
    {
        public Task ExecuteAsync(HttpContext httpContext)
        {
            httpContext.Response.StatusCode = statusCode;
            httpContext.Response.Headers.ETag = etag;
            return httpContext.Response.WriteAsJsonAsync(body);
        }
    }
}

/// <summary>Protects and parses HTTP ETags and cursors at the API transport boundary.</summary>
public interface IInventoryHttpTokenService
{
    /// <summary>Formats an opaque HTTP ETag from a trusted raw concurrency version.</summary>
    string WriteVersion(long version);

    /// <summary>Parses an opaque HTTP ETag into a raw concurrency version.</summary>
    bool TryReadVersion(string token, out long version);

    /// <summary>Formats a tamper-evident HTTP cursor from a trusted persistence sort position.</summary>
    string WriteCursor(InventoryLotReadCursor cursor);

    /// <summary>Parses an optional HTTP cursor into a trusted persistence sort position.</summary>
    bool TryReadCursor(string? cursor, out InventoryLotReadCursor? position);
}

/// <summary>ASP.NET Core Data Protection implementation of the API-only inventory token boundary.</summary>
public sealed class DataProtectionInventoryHttpTokenService(IDataProtectionProvider dataProtection) : IInventoryHttpTokenService
{
    private const string VersionPurpose = "KitchenFlow.Inventory.LotVersion.v1";
    private const string CursorPurpose = "KitchenFlow.Inventory.LotCursor.v1";

    /// <inheritdoc />
    public string WriteVersion(long version) => dataProtection.CreateProtector(VersionPurpose).Protect(version.ToString(System.Globalization.CultureInfo.InvariantCulture));

    /// <inheritdoc />
    public bool TryReadVersion(string token, out long version)
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
    public string WriteCursor(InventoryLotReadCursor cursor) => dataProtection.CreateProtector(CursorPurpose).Protect(JsonSerializer.Serialize(cursor));

    /// <inheritdoc />
    public bool TryReadCursor(string? cursor, out InventoryLotReadCursor? position)
    {
        if (string.IsNullOrWhiteSpace(cursor))
        {
            position = null;
            return true;
        }

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
