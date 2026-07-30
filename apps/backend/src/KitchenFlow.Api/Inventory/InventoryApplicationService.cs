using System.Security.Cryptography;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using KitchenFlow.Api.Services;
using KitchenFlow.Modules.Inventory.Application;
using KitchenFlow.Modules.Inventory.Domain;
using KitchenFlow.Modules.Identity;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.HttpResults;

namespace KitchenFlow.Api.Inventory;

/// <summary>
/// Orchestrates owner-scoped inventory commands and queries. This composition-root service is
/// intentionally the single HTTP-facing seam while the module application contracts are extracted.
/// </summary>
public sealed class InventoryApplicationService(
    ICurrentUserAccessor currentUser,
    IInventoryLotReadStore readStore,
    IInventoryLotWriteStore writeStore,
    TimeProvider timeProvider,
    IDataProtectionProvider dataProtection,
    InventoryLotLifecycleUseCase lifecycleUseCase)
{
    /// <summary>Lists lots visible to the current KitchenFlow user.</summary>
    public Task<IResult> ListAsync(int? pageSize, string? status, string? storageLocation, string? search, string? cursor, CancellationToken cancellationToken) =>
        ListCoreAsync(pageSize, status, storageLocation, search, cursor, currentUser, readStore, dataProtection, cancellationToken);

    /// <summary>Gets one active lot visible to the current KitchenFlow user.</summary>
    public Task<IResult> GetAsync(Guid lotId, CancellationToken cancellationToken) =>
        GetCoreAsync(lotId, currentUser, readStore, cancellationToken);

    /// <summary>Creates a user-owned lot and its immutable initial history.</summary>
    public Task<IResult> CreateAsync(CreateLotRequest request, HttpRequest requestContext, CancellationToken cancellationToken) =>
        CreateCoreAsync(request, requestContext, currentUser, writeStore, timeProvider, cancellationToken);

    /// <summary>Updates mutable metadata for one owner-scoped lot.</summary>
    public Task<IResult> UpdateAsync(Guid lotId, UpdateLotRequest request, HttpRequest requestContext, CancellationToken cancellationToken) =>
        UpdateCoreAsync(lotId, request, requestContext, currentUser, timeProvider, cancellationToken);

    /// <summary>Applies one idempotent inventory adjustment to an owner-scoped lot.</summary>
    public Task<IResult> AdjustAsync(Guid lotId, AdjustmentRequest request, HttpRequest requestContext, CancellationToken cancellationToken) =>
        AdjustCoreAsync(lotId, request, requestContext, currentUser, timeProvider, cancellationToken);

    /// <summary>Soft-deletes one owner-scoped lot and writes immutable lifecycle history.</summary>
    public Task<IResult> DeleteAsync(Guid lotId, HttpRequest requestContext, CancellationToken cancellationToken) =>
        DeleteCoreAsync(lotId, requestContext, currentUser, timeProvider, cancellationToken);

    /// <summary>Lists immutable history for one owner-scoped lot.</summary>
    public Task<IResult> HistoryAsync(Guid lotId, CancellationToken cancellationToken) =>
        HistoryCoreAsync(lotId, currentUser, readStore, cancellationToken);

    private async Task<IResult> ListCoreAsync(int? pageSize, string? status, string? storageLocation, string? search, string? cursor, ICurrentUserAccessor currentUser, IInventoryLotReadStore readStore, IDataProtectionProvider dataProtection, CancellationToken cancellationToken)
    {
        if (pageSize is < 1 or > 100)
        {
            return Problem(400, "validation_failed", "pageSize must be between 1 and 100.", FieldErrors("pageSize", "pageSize must be between 1 and 100."));
        }

        if (status is not null && status is not ("active" or "depleted" or "deleted"))
        {
            return Problem(400, "validation_failed", "status must be active, depleted, or deleted.", FieldErrors("status", "status must be active, depleted, or deleted."));
        }

        if (storageLocation is not null && storageLocation is not ("Pantry" or "Refrigerator" or "Freezer" or "Other"))
        {
            return Problem(400, "validation_failed", "storageLocation is invalid.", FieldErrors("storageLocation", "storageLocation is invalid."));
        }

        CursorPosition? position = null;
        if (!string.IsNullOrWhiteSpace(cursor) && !TryReadCursor(cursor, dataProtection, out position))
        {
            return Problem(400, "invalid_cursor", "The cursor is invalid.");
        }

        var limit = pageSize ?? 25;
        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var page = await readStore.ListAsync(new InventoryLotReadQuery(user.Id, limit, status, storageLocation, search, position is null ? null : new InventoryLotReadCursor(position.UpdatedAt, position.LotId)), cancellationToken);
        var nextCursor = page.NextCursor is null ? null : WriteCursor(new CursorPosition(page.NextCursor.UpdatedAt, page.NextCursor.LotId), dataProtection);
        return Results.Ok(new ListLotsResponse(page.Items.Select(ToResponse).ToList(), nextCursor));
    }

    private async Task<IResult> GetCoreAsync(Guid lotId, ICurrentUserAccessor currentUser, IInventoryLotReadStore readStore, CancellationToken cancellationToken)
    {
        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var record = await readStore.FindActiveAsync(user.Id, lotId, cancellationToken);
        return record is null
            ? Problem(404, "resource_not_found", "The inventory lot was not found.")
            : WithEtag(ToResponse(record));
    }

    private async Task<IResult> CreateCoreAsync(CreateLotRequest request, HttpRequest httpRequest, ICurrentUserAccessor currentUser, IInventoryLotWriteStore writeStore, TimeProvider timeProvider, CancellationToken cancellationToken)
    {
        if (!TryIdempotencyKey(httpRequest, out var key))
        {
            return Problem(400, "validation_failed", "A UUID Idempotency-Key header is required.", FieldErrors("Idempotency-Key", "A UUID Idempotency-Key header is required."));
        }

        var validProductName = ValidateProductName(request.ProductName, out var productName, out var normalizedProductName);
        var validQuantity = ValidateQuantity(request.Quantity, out var quantityError);
        var validMetadata = ValidateMetadata(request.StorageLocation, request.CustomLocation, request.PackageState, request.Notes, out var metadataError);
        if (!validProductName || !validQuantity || !validMetadata)
        {
            var errors = new Dictionary<string, string[]>(StringComparer.Ordinal);
            if (!validProductName) { errors["productName"] = ["The product name is invalid."]; }
            if (!validQuantity) { errors["quantity"] = [quantityError!]; }
            if (!validMetadata) { errors[MetadataField(metadataError)] = [metadataError!]; }
            return Problem(422, "domain_rule_violated", quantityError ?? metadataError ?? "The product name is invalid.", errors);
        }

        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var hash = Hash(new
        {
            ProductName = productName,
            Quantity = new
            {
                MeasuredValue = request.Quantity.MeasuredValue?.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture),
                request.Quantity.Unit,
                request.Quantity.AvailabilityState
            },
            request.StorageLocation,
            CustomLocation = request.CustomLocation?.Trim(),
            request.PackageState,
            request.PrintedExpirationDate,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        });
        var prior = await writeStore.FindIdempotencyAsync(user.Id, "inventory.lots.create", key, cancellationToken);
        if (prior is not null)
        {
            if (prior.RequestHash != hash)
            {
                return Problem(409, "idempotency_key_reused", "The Idempotency-Key was used for a different request.");
            }

            if (prior.CompletedAt is null)
            {
                return Problem(409, "idempotency_in_progress", "The request is still being processed.");
            }

            var replay = JsonSerializer.Deserialize<LotResponse>(prior.ResponseBody!)!;
            return WithEtag(replay, StatusCodes.Status201Created);
        }

        var now = timeProvider.GetUtcNow();
        ProductName.TryCreate(productName, out var domainProductName);
        var domainProduct = Product.Create(user.Id, domainProductName!, now);
        var domainLot = CreateDomainLot(user.Id, domainProduct.Id, request, now);
        var response = ToResponse(domainLot, domainProduct);
        var initial = InventoryTransaction.Create(domainLot.Id, user.Id, InventoryTransactionType.Initial, null, domainLot.Quantity, null, null, key, now);
        var idempotency = new InventoryIdempotencyWrite(key, "inventory.lots.create", hash, StatusCodes.Status201Created, JsonSerializer.Serialize(response), ToEtag(response.Version), now);
        var outcome = await writeStore.SaveCreatedAsync(new InventoryLotCreationWrite(user.Id, domainProduct, domainLot, initial, httpRequest.HttpContext.TraceIdentifier, idempotency), cancellationToken);
        if (outcome != InventoryWriteOutcome.Saved)
        {
            return await ReplayFromStoreAsync(writeStore, user.Id, "inventory.lots.create", key, hash, StatusCodes.Status201Created, cancellationToken);
        }
        return WithEtag(response, StatusCodes.Status201Created);
    }

    private async Task<IResult> UpdateCoreAsync(Guid lotId, UpdateLotRequest request, HttpRequest requestContext, ICurrentUserAccessor currentUser, TimeProvider timeProvider, CancellationToken cancellationToken)
    {
        var validMetadata = ValidateMetadata(request.StorageLocation, request.CustomLocation, request.PackageState, request.Notes, out var metadataError);
        var validProductName = request.ProductName is null || ValidateProductName(request.ProductName, out _, out _);
        if (!validMetadata || !validProductName)
        {
            return Problem(422, "domain_rule_violated", metadataError ?? "The product name is invalid.", FieldErrors(!validMetadata ? MetadataField(metadataError) : "productName", metadataError ?? "The product name is invalid."));
        }

        return await MutateThroughStoreAsync(lotId, requestContext, currentUser, writeStore, timeProvider, cancellationToken, (domainLot, domainProduct, now) =>
        {
            domainLot.UpdateMetadata(ToStorage(request.StorageLocation, request.CustomLocation), ToPackageState(request.PackageState), ToExpiration(request.PrintedExpirationDate), ToNotes(request.Notes), now);
            if (request.ProductName is not null)
            {
                ProductName.TryCreate(request.ProductName, out var domainProductName);
                domainProduct.Rename(domainProductName!, now);
            }
            return null;
        });
    }

    private async Task<IResult> AdjustCoreAsync(Guid lotId, AdjustmentRequest request, HttpRequest requestContext, ICurrentUserAccessor currentUser, TimeProvider timeProvider, CancellationToken cancellationToken)
    {
        if (!TryIdempotencyKey(requestContext, out var key))
        {
            return Problem(400, "validation_failed", "A UUID Idempotency-Key header is required.", FieldErrors("Idempotency-Key", "A UUID Idempotency-Key header is required."));
        }

        if (!InventoryAdjustmentCommand.TryCreate(request.Type, request.Value, request.AvailabilityState, request.ReasonCode, request.Note, out var command, out var adjustmentErrors))
        {
            return Problem(422, "domain_rule_violated", adjustmentErrors.First().Value[0], adjustmentErrors);
        }
        var adjustment = command!;

        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var hash = Hash(new
        {
            LotId = lotId,
            adjustment.Type,
            Value = adjustment.Value?.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture),
            adjustment.AvailabilityState,
            adjustment.ReasonCode,
            adjustment.Note
        });
        var prior = await writeStore.FindIdempotencyAsync(user.Id, "inventory.lots.adjust", key, cancellationToken);
        if (prior is not null)
        {
            if (prior.RequestHash != hash)
            {
                return Problem(409, "idempotency_key_reused", "The Idempotency-Key was used for a different request.");
            }

            if (prior.CompletedAt is null)
            {
                return Problem(409, "idempotency_in_progress", "The request is still being processed.");
            }

            var replay = JsonSerializer.Deserialize<LotResponse>(prior.ResponseBody!)!;
            return WithEtag(replay);
        }

        return await MutateThroughStoreAsync(lotId, requestContext, currentUser, writeStore, timeProvider, cancellationToken, (domainLot, _, now) =>
        {
            var transaction = lifecycleUseCase.ApplyAdjustment(domainLot, adjustment, key, now);
            return transaction;
        }, idempotencyKey: key, idempotencyScope: "inventory.lots.adjust", idempotencyHash: hash);
    }

    private async Task<IResult> DeleteCoreAsync(Guid lotId, HttpRequest requestContext, ICurrentUserAccessor currentUser, TimeProvider timeProvider, CancellationToken cancellationToken) =>
        await MutateThroughStoreAsync(lotId, requestContext, currentUser, writeStore, timeProvider, cancellationToken, (domainLot, _, now) =>
        {
            var transaction = lifecycleUseCase.Delete(domainLot, now);
            return transaction;
        }, StatusCodes.Status204NoContent);

    private async Task<IResult> HistoryCoreAsync(Guid lotId, ICurrentUserAccessor currentUser, IInventoryLotReadStore readStore, CancellationToken cancellationToken)
    {
        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var transactions = await readStore.GetHistoryAsync(user.Id, lotId, cancellationToken);
        if (transactions is null)
        {
            return Problem(404, "resource_not_found", "The inventory lot was not found.");
        }
        return Results.Ok(transactions.Select(item => new LotHistoryResponse(item.TransactionId, item.Type, ToQuantity(item.PreviousMeasuredValue, item.PreviousMeasuredUnit, item.PreviousAvailabilityState), ToQuantity(item.ResultingMeasuredValue, item.ResultingMeasuredUnit, item.ResultingAvailabilityState), item.ReasonCode, item.OccurredAt)));
    }

    private async Task<IResult> MutateThroughStoreAsync(Guid lotId, HttpRequest request, ICurrentUserAccessor currentUser, IInventoryLotWriteStore writeStore, TimeProvider clock, CancellationToken cancellationToken, Func<InventoryLot, Product, DateTimeOffset, InventoryTransaction?> operation, int successStatus = StatusCodes.Status200OK, Guid? idempotencyKey = null, string? idempotencyScope = null, string? idempotencyHash = null)
    {
        var precondition = ReadVersion(request, out var version);
        if (precondition == VersionPrecondition.Missing)
        {
            return Problem(428, "precondition_required", "If-Match is required.");
        }

        if (precondition == VersionPrecondition.Invalid)
        {
            return Problem(412, "precondition_failed", "The inventory lot was modified.");
        }

        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var state = await writeStore.LoadActiveAsync(user.Id, lotId, cancellationToken);
        if (state is null)
        {
            return Problem(404, "resource_not_found", "The inventory lot was not found.");
        }

        if (state.Lot.Version != version)
        {
            return Problem(412, "precondition_failed", "The inventory lot was modified.");
        }

        try
        {
            var now = clock.GetUtcNow();
            var transaction = operation(state.Lot, state.Product, now);
            var response = ToResponse(state.Lot, state.Product);
            var idempotency = idempotencyKey is null ? null : new InventoryIdempotencyWrite(idempotencyKey.Value, idempotencyScope!, idempotencyHash!, StatusCodes.Status200OK, JsonSerializer.Serialize(response), ToEtag(response.Version), now);
            var result = await writeStore.SaveMutationAsync(new InventoryLotMutationWrite(user.Id, state.Lot, state.Product, version, transaction, "inventory.lot.updated", request.HttpContext.TraceIdentifier, idempotency), cancellationToken);
            if (result == InventoryWriteOutcome.IdempotencyConflict)
            {
                return await ReplayFromStoreAsync(writeStore, user.Id, idempotencyScope!, idempotencyKey!.Value, idempotencyHash!, successStatus, cancellationToken);
            }
            return result switch
            {
                InventoryWriteOutcome.Saved when successStatus == StatusCodes.Status204NoContent => Results.NoContent(),
                InventoryWriteOutcome.Saved => WithEtag(response),
                InventoryWriteOutcome.ConcurrencyConflict => Problem(412, "precondition_failed", "The inventory lot was modified."),
                _ => Problem(409, "idempotency_in_progress", "The request is still being processed.")
            };
        }
        catch (InvalidOperationException exception) { return Problem(422, "domain_rule_violated", exception.Message); }
    }

    private static InventoryLot CreateDomainLot(Guid ownerUserId, Guid productId, CreateLotRequest request, DateTimeOffset now)
    {
        var quantity = request.Quantity.MeasuredValue is { } measured
            ? new LotQuantity.Measured(measured, Enum.Parse<CanonicalUnit>(request.Quantity.Unit!))
            : LotQuantity.FromAvailability(Enum.Parse<AvailabilityState>(request.Quantity.AvailabilityState!));
        return InventoryLot.Create(ownerUserId, productId, quantity, ToStorage(request.StorageLocation, request.CustomLocation), ToPackageState(request.PackageState), ToExpiration(request.PrintedExpirationDate), ToNotes(request.Notes), now);
    }


    private static LotStorage ToStorage(string location, string? customLocation)
    {
        LotStorage.TryCreate(Enum.Parse<StorageLocation>(location), customLocation, out var storage);
        return storage!;
    }

    private static PackageState? ToPackageState(string? packageState) => packageState is null ? null : Enum.Parse<PackageState>(packageState);

    private static PrintedExpiration? ToExpiration(DateOnly? expiration) => expiration is null ? null : new PrintedExpiration(expiration.Value, ExpirationProvenance.UserEntered);

    private static PrivateNotes? ToNotes(string? notes)
    {
        PrivateNotes.TryCreate(notes, out var privateNotes);
        return privateNotes;
    }

    private LotResponse ToResponse(InventoryLot lot, Product product) => new(lot.Id, lot.ProductId, product.DisplayName, new QuantityResponse(lot.Quantity is LotQuantity.Measured measured ? measured.Value : null, lot.Quantity is LotQuantity.Measured unit ? unit.Unit.ToString() : null, lot.Quantity is LotQuantity.Availability availability ? availability.State.ToString() : null), lot.Storage.Location.ToString(), lot.Storage.CustomLocation, lot.PackageState?.ToString(), lot.PrintedExpiration?.Date, lot.Notes?.Value, CreateVersionToken(lot.Version), lot.CreatedAt, lot.UpdatedAt);
    private LotResponse ToResponse(InventoryLotReadModel lot) => new(lot.LotId, lot.ProductId, lot.ProductName, new QuantityResponse(lot.MeasuredValue, lot.MeasuredUnit, lot.AvailabilityState), lot.StorageLocation, lot.CustomLocation, lot.PackageState, lot.PrintedExpirationDate, lot.Notes, CreateVersionToken(lot.Version), lot.CreatedAt, lot.UpdatedAt);
    private static QuantityResponse? ToQuantity(decimal? measuredValue, string? unit, string? availabilityState) => measuredValue is null && unit is null && availabilityState is null ? null : new QuantityResponse(measuredValue, unit, availabilityState);
    private static IResult WithEtag(LotResponse response, int status = 200) => new EtagResult<LotResponse>(response, ToEtag(response.Version), status);
    private static string ToEtag(string version) => $"\"{version}\"";
    private string CreateVersionToken(long version) => dataProtection.CreateProtector("KitchenFlow.Inventory.LotVersion.v1").Protect(version.ToString(System.Globalization.CultureInfo.InvariantCulture));
    private VersionPrecondition ReadVersion(HttpRequest request, out long version)
    {
        version = 0;
        if (string.IsNullOrWhiteSpace(request.Headers.IfMatch))
        {
            return VersionPrecondition.Missing;
        }

        try
        {
            return long.TryParse(dataProtection.CreateProtector("KitchenFlow.Inventory.LotVersion.v1").Unprotect(request.Headers.IfMatch.ToString().Trim('"')), System.Globalization.NumberStyles.None, System.Globalization.CultureInfo.InvariantCulture, out version)
                ? VersionPrecondition.Valid
                : VersionPrecondition.Invalid;
        }
        catch (CryptographicException)
        {
            return VersionPrecondition.Invalid;
        }
    }
    private static bool TryIdempotencyKey(HttpRequest request, out Guid key) => Guid.TryParse(request.Headers["Idempotency-Key"], out key);
    private static bool ValidateProductName(string? value, out string? productName, out string? normalizedProductName)
    {
        productName = value?.Trim();
        normalizedProductName = productName?.ToUpperInvariant();
        return !string.IsNullOrWhiteSpace(productName) && productName.Length <= 160;
    }
    private static bool ValidateMetadata(string? location, string? custom, string? packageState, string? notes, out string? error)
    {
        var validStorage = location is "Pantry" or "Refrigerator" or "Freezer" && string.IsNullOrWhiteSpace(custom) || location == "Other" && !string.IsNullOrWhiteSpace(custom) && custom.Trim().Length <= 80;
        var validPackage = packageState is null or "Sealed" or "Opened" or "Unknown";
        var validNotes = notes is null || notes.Trim().Length <= 1000;
        error = !validStorage ? "The storage location is invalid." : !validPackage ? "The package state is invalid." : !validNotes ? "Notes must be at most 1000 characters." : null;
        return error is null;
    }
    private static bool ValidateQuantity(QuantityRequest? quantity, out string? error)
    {
        var measured = quantity?.MeasuredValue is > 0m and { } value && decimal.Round(value, 3) == value && quantity.Unit is "Gram" or "Milliliter" or "Unit" && quantity.AvailabilityState is null;
        var available = quantity?.MeasuredValue is null && quantity?.Unit is null && quantity?.AvailabilityState is "Available" or "Low" or "Unavailable";
        error = measured || available ? null : "Quantity must be either a positive canonical measured value with a maximum of three decimal places or an availability state.";
        return error is null;
    }
    private static string Hash<T>(T value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value))));

    private async Task<IResult> ReplayFromStoreAsync(IInventoryLotWriteStore writeStore, Guid ownerUserId, string scope, Guid key, string hash, int successStatus, CancellationToken cancellationToken)
    {
        var record = await writeStore.FindIdempotencyAsync(ownerUserId, scope, key, cancellationToken);
        if (record is null || record.CompletedAt is null)
        {
            return Problem(409, "idempotency_in_progress", "The request is still being processed.");
        }

        if (!string.Equals(record.RequestHash, hash, StringComparison.Ordinal))
        {
            return Problem(409, "idempotency_key_reused", "The Idempotency-Key was used for a different request.");
        }

        var response = JsonSerializer.Deserialize<LotResponse>(record.ResponseBody!);
        return response is null ? Problem(409, "idempotency_in_progress", "The request is still being processed.") : WithEtag(response, successStatus);
    }
    private static string WriteCursor(CursorPosition position, IDataProtectionProvider provider) => provider.CreateProtector("KitchenFlow.Inventory.LotCursor.v1").Protect(JsonSerializer.Serialize(position));
    private static bool TryReadCursor(string cursor, IDataProtectionProvider provider, out CursorPosition? position)
    {
        try
        {
            position = JsonSerializer.Deserialize<CursorPosition>(provider.CreateProtector("KitchenFlow.Inventory.LotCursor.v1").Unprotect(cursor));
            return position is not null;
        }
        catch (Exception exception) when (exception is CryptographicException or JsonException or FormatException)
        {
            position = null;
            return false;
        }
    }
    private static IResult Problem(int status, string code, string detail, IReadOnlyDictionary<string, string[]>? errors = null)
    {
        var extensions = new Dictionary<string, object?>
        {
            ["errorCode"] = code,
            ["traceId"] = Activity.Current?.Id ?? ActivityTraceId.CreateRandom().ToString()
        };
        if (errors is not null)
        {
            extensions["errors"] = errors;
        }

        return Results.Problem(detail: detail, statusCode: status, extensions: extensions);
    }

    private static IReadOnlyDictionary<string, string[]> FieldErrors(string field, string error) => new Dictionary<string, string[]>(StringComparer.Ordinal) { [field] = [error] };

    private static string MetadataField(string? error) => error?.StartsWith("Notes", StringComparison.Ordinal) == true ? "notes" : error?.StartsWith("The package", StringComparison.Ordinal) == true ? "packageState" : "storageLocation";

    private sealed record CursorPosition(DateTimeOffset UpdatedAt, Guid LotId);

    private enum VersionPrecondition
    {
        Missing,
        Valid,
        Invalid
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
