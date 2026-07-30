using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using KitchenFlow.Modules.Identity;
using KitchenFlow.Modules.Inventory.Domain;

namespace KitchenFlow.Modules.Inventory.Application;

/// <summary>
/// Protects inventory concurrency versions and pagination positions for an outer transport. The
/// Inventory module requests opaque tokens without depending on ASP.NET Core data-protection APIs.
/// </summary>
public interface IInventoryTransportTokenService
{
    /// <summary>Creates an opaque representation of a persisted optimistic-concurrency version.</summary>
    string ProtectVersion(long version);

    /// <summary>Attempts to read an opaque concurrency token supplied by a client.</summary>
    bool TryUnprotectVersion(string token, out long version);

    /// <summary>Creates a tamper-evident cursor from a trusted persistence sort position.</summary>
    string ProtectCursor(InventoryLotReadCursor cursor);

    /// <summary>Attempts to read a client-supplied cursor into a trusted sort position.</summary>
    bool TryUnprotectCursor(string cursor, out InventoryLotReadCursor? position);
}

/// <summary>Represents a measured or qualitative inventory quantity without mixing quantity modes.</summary>
public sealed record InventoryQuantity(decimal? MeasuredValue, string? Unit, string? AvailabilityState);

/// <summary>Application representation of one owner-scoped inventory lot.</summary>
public sealed record InventoryLotView(Guid LotId, Guid ProductId, string ProductName, InventoryQuantity Quantity, string StorageLocation, string? CustomLocation, string? PackageState, DateOnly? PrintedExpirationDate, string? Notes, string Version, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

/// <summary>Application representation of an immutable inventory history entry.</summary>
public sealed record InventoryHistoryEntry(Guid TransactionId, string Type, InventoryQuantity? PreviousQuantity, InventoryQuantity? ResultingQuantity, string? ReasonCode, DateTimeOffset OccurredAt);

/// <summary>Cursor-paginated application inventory lot list.</summary>
public sealed record InventoryLotList(IReadOnlyList<InventoryLotView> Items, string? NextCursor);

/// <summary>Describes a stable application error that an outer transport maps to Problem Details.</summary>
public sealed record InventoryApplicationProblem(string ErrorCode, string Detail, IReadOnlyDictionary<string, string[]>? Errors = null);

/// <summary>Typed outcome of an inventory application command or query.</summary>
public sealed record InventoryApplicationResult<T>(int StatusCode, T? Value, string? ETag, InventoryApplicationProblem? Problem)
{
    /// <summary>Creates a successful typed application result.</summary>
    public static InventoryApplicationResult<T> Success(int statusCode, T? value, string? etag = null) => new(statusCode, value, etag, null);

    /// <summary>Creates an unsuccessful typed application result.</summary>
    public static InventoryApplicationResult<T> Failure(int statusCode, string errorCode, string detail, IReadOnlyDictionary<string, string[]>? errors = null) => new(statusCode, default, null, new InventoryApplicationProblem(errorCode, detail, errors));
}

/// <summary>Transport-neutral create input supplied by an authenticated adapter.</summary>
public sealed record CreateInventoryLotCommand(string? ProductName, decimal? MeasuredValue, string? Unit, string? AvailabilityState, string? StorageLocation, string? CustomLocation, string? PackageState, DateOnly? PrintedExpirationDate, string? Notes, Guid? IdempotencyKey, string CorrelationId);

/// <summary>Transport-neutral mutable lot metadata correction input.</summary>
public sealed record UpdateInventoryLotCommand(Guid LotId, string? ProductName, string? StorageLocation, string? CustomLocation, string? PackageState, DateOnly? PrintedExpirationDate, string? Notes, InventoryVersionPrecondition Precondition, string CorrelationId);

/// <summary>Transport-neutral immutable inventory adjustment input.</summary>
public sealed record AdjustInventoryLotCommand(Guid LotId, string? Type, decimal? Value, string? AvailabilityState, string? ReasonCode, string? Note, Guid? IdempotencyKey, InventoryVersionPrecondition Precondition, string CorrelationId);

/// <summary>Transport-neutral soft-deletion input.</summary>
public sealed record DeleteInventoryLotCommand(Guid LotId, InventoryVersionPrecondition Precondition, string CorrelationId);

/// <summary>Represents the client concurrency precondition after an outer transport decodes it.</summary>
public sealed record InventoryVersionPrecondition(bool IsPresent, bool IsValid, long Version)
{
    /// <summary>Creates the missing-header precondition state.</summary>
    public static InventoryVersionPrecondition Missing { get; } = new(false, false, 0);

    /// <summary>Creates the invalid-token precondition state.</summary>
    public static InventoryVersionPrecondition Invalid { get; } = new(true, false, 0);

    /// <summary>Creates a valid expected-version precondition.</summary>
    public static InventoryVersionPrecondition Valid(long version) => new(true, true, version);
}

/// <summary>
/// Module-owned application service for the complete authenticated inventory-lot slice. It owns
/// validation, owner-scoped orchestration, domain transitions, idempotency semantics, and typed
/// results while HTTP adapters retain only request/response and token parsing concerns.
/// </summary>
public sealed class InventoryLotApplicationService(
    ICurrentUserAccessor currentUser,
    IInventoryLotReadStore readStore,
    IInventoryLotWriteStore writeStore,
    TimeProvider timeProvider,
    IInventoryTransportTokenService tokens,
    InventoryLotLifecycleUseCase lifecycleUseCase)
{
    /// <summary>Lists active, depleted, or deleted lots owned by the current internal user.</summary>
    public async Task<InventoryApplicationResult<InventoryLotList>> ListAsync(int? pageSize, string? status, string? storageLocation, string? search, string? cursor, CancellationToken cancellationToken)
    {
        if (pageSize is < 1 or > 100)
        {
            return Failure<InventoryLotList>(400, "validation_failed", "pageSize must be between 1 and 100.", FieldErrors("pageSize", "pageSize must be between 1 and 100."));
        }

        if (status is not null && status is not ("active" or "depleted" or "deleted"))
        {
            return Failure<InventoryLotList>(400, "validation_failed", "status must be active, depleted, or deleted.", FieldErrors("status", "status must be active, depleted, or deleted."));
        }

        if (storageLocation is not null && storageLocation is not ("Pantry" or "Refrigerator" or "Freezer" or "Other"))
        {
            return Failure<InventoryLotList>(400, "validation_failed", "storageLocation is invalid.", FieldErrors("storageLocation", "storageLocation is invalid."));
        }

        InventoryLotReadCursor? position = null;
        if (!string.IsNullOrWhiteSpace(cursor) && !tokens.TryUnprotectCursor(cursor, out position))
        {
            return Failure<InventoryLotList>(400, "invalid_cursor", "The cursor is invalid.");
        }

        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var page = await readStore.ListAsync(new InventoryLotReadQuery(user.Id, pageSize ?? 25, status, storageLocation, search, position), cancellationToken);
        return InventoryApplicationResult<InventoryLotList>.Success(200, new InventoryLotList(page.Items.Select(ToView).ToList(), page.NextCursor is null ? null : tokens.ProtectCursor(page.NextCursor)));
    }

    /// <summary>Gets one active lot owned by the current internal user without cross-user disclosure.</summary>
    public async Task<InventoryApplicationResult<InventoryLotView>> GetAsync(Guid lotId, CancellationToken cancellationToken)
    {
        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var record = await readStore.FindActiveAsync(user.Id, lotId, cancellationToken);
        return record is null
            ? Failure<InventoryLotView>(404, "resource_not_found", "The inventory lot was not found.")
            : Success(ToView(record));
    }

    /// <summary>Creates a product, lot, initial transaction, audit record, and replay response atomically.</summary>
    public async Task<InventoryApplicationResult<InventoryLotView>> CreateAsync(CreateInventoryLotCommand command, CancellationToken cancellationToken)
    {
        if (command.IdempotencyKey is null)
        {
            return Failure<InventoryLotView>(400, "validation_failed", "A UUID Idempotency-Key header is required.", FieldErrors("Idempotency-Key", "A UUID Idempotency-Key header is required."));
        }

        var validProductName = ValidateProductName(command.ProductName, out var productName);
        var validQuantity = ValidateQuantity(command.MeasuredValue, command.Unit, command.AvailabilityState, out var quantityError);
        var validMetadata = ValidateMetadata(command.StorageLocation, command.CustomLocation, command.PackageState, command.Notes, out var metadataError);
        if (!validProductName || !validQuantity || !validMetadata)
        {
            var errors = new Dictionary<string, string[]>(StringComparer.Ordinal);
            if (!validProductName) { errors["productName"] = ["The product name is invalid."]; }
            if (!validQuantity) { errors["quantity"] = [quantityError!]; }
            if (!validMetadata) { errors[MetadataField(metadataError)] = [metadataError!]; }
            return Failure<InventoryLotView>(422, "domain_rule_violated", quantityError ?? metadataError ?? "The product name is invalid.", errors);
        }

        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var hash = Hash(new { ProductName = productName, Quantity = new { MeasuredValue = command.MeasuredValue?.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture), command.Unit, command.AvailabilityState }, StorageLocation = command.StorageLocation, CustomLocation = command.CustomLocation?.Trim(), command.PackageState, command.PrintedExpirationDate, Notes = string.IsNullOrWhiteSpace(command.Notes) ? null : command.Notes.Trim() });
        var prior = await writeStore.FindIdempotencyAsync(user.Id, "inventory.lots.create", command.IdempotencyKey.Value, cancellationToken);
        if (prior is not null)
        {
            return Replay(prior, hash, 201);
        }

        var now = timeProvider.GetUtcNow();
        ProductName.TryCreate(productName, out var domainProductName);
        var domainProduct = Product.Create(user.Id, domainProductName!, now);
        var domainLot = CreateDomainLot(user.Id, domainProduct.Id, command, now);
        var response = ToView(domainLot, domainProduct);
        var initial = InventoryTransaction.Create(domainLot.Id, user.Id, InventoryTransactionType.Initial, null, domainLot.Quantity, null, null, command.IdempotencyKey, now);
        var idempotency = new InventoryIdempotencyWrite(command.IdempotencyKey.Value, "inventory.lots.create", hash, 201, JsonSerializer.Serialize(response), Quote(response.Version), now);
        var outcome = await writeStore.SaveCreatedAsync(new InventoryLotCreationWrite(user.Id, domainProduct, domainLot, initial, command.CorrelationId, idempotency), cancellationToken);
        return outcome == InventoryWriteOutcome.Saved
            ? Success(response, 201)
            : Replay(await writeStore.FindIdempotencyAsync(user.Id, "inventory.lots.create", command.IdempotencyKey.Value, cancellationToken), hash, 201);
    }

    /// <summary>Corrects mutable metadata for an owner-scoped lot using optimistic concurrency.</summary>
    public Task<InventoryApplicationResult<InventoryLotView>> UpdateAsync(UpdateInventoryLotCommand command, CancellationToken cancellationToken)
    {
        var validMetadata = ValidateMetadata(command.StorageLocation, command.CustomLocation, command.PackageState, command.Notes, out var metadataError);
        var validProductName = command.ProductName is null || ValidateProductName(command.ProductName, out _);
        if (!validMetadata || !validProductName)
        {
            return Task.FromResult(Failure<InventoryLotView>(422, "domain_rule_violated", metadataError ?? "The product name is invalid.", FieldErrors(!validMetadata ? MetadataField(metadataError) : "productName", metadataError ?? "The product name is invalid.")));
        }

        return MutateAsync(command.LotId, command.Precondition, command.CorrelationId, null, null, null, cancellationToken, (lot, product, now) =>
        {
            lot.UpdateMetadata(ToStorage(command.StorageLocation!, command.CustomLocation), ToPackageState(command.PackageState), ToExpiration(command.PrintedExpirationDate), ToNotes(command.Notes), now);
            if (command.ProductName is not null)
            {
                ProductName.TryCreate(command.ProductName, out var name);
                product.Rename(name!, now);
            }
            return null;
        });
    }

    /// <summary>Applies one idempotent consume, discard, correction, or availability transition.</summary>
    public async Task<InventoryApplicationResult<InventoryLotView>> AdjustAsync(AdjustInventoryLotCommand command, CancellationToken cancellationToken)
    {
        if (command.IdempotencyKey is null)
        {
            return Failure<InventoryLotView>(400, "validation_failed", "A UUID Idempotency-Key header is required.", FieldErrors("Idempotency-Key", "A UUID Idempotency-Key header is required."));
        }

        if (!InventoryAdjustmentCommand.TryCreate(command.Type, command.Value, command.AvailabilityState, command.ReasonCode, command.Note, out var adjustment, out var errors))
        {
            return Failure<InventoryLotView>(422, "domain_rule_violated", errors.First().Value[0], errors);
        }

        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var hash = Hash(new { command.LotId, adjustment!.Type, Value = adjustment.Value?.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture), adjustment.AvailabilityState, adjustment.ReasonCode, adjustment.Note });
        var prior = await writeStore.FindIdempotencyAsync(user.Id, "inventory.lots.adjust", command.IdempotencyKey.Value, cancellationToken);
        if (prior is not null)
        {
            return Replay(prior, hash, 200);
        }

        return await MutateAsync(command.LotId, command.Precondition, command.CorrelationId, command.IdempotencyKey, "inventory.lots.adjust", hash, cancellationToken, (lot, _, now) => lifecycleUseCase.ApplyAdjustment(lot, adjustment, command.IdempotencyKey.Value, now));
    }

    /// <summary>Soft-deletes one active owner-scoped lot and records its immutable deletion transition.</summary>
    public Task<InventoryApplicationResult<InventoryLotView>> DeleteAsync(DeleteInventoryLotCommand command, CancellationToken cancellationToken) =>
        MutateAsync(command.LotId, command.Precondition, command.CorrelationId, null, null, null, cancellationToken, (lot, _, now) => lifecycleUseCase.Delete(lot, now), 204);

    /// <summary>Lists immutable transaction history for one owner-scoped lot.</summary>
    public async Task<InventoryApplicationResult<IReadOnlyList<InventoryHistoryEntry>>> HistoryAsync(Guid lotId, CancellationToken cancellationToken)
    {
        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var transactions = await readStore.GetHistoryAsync(user.Id, lotId, cancellationToken);
        return transactions is null
            ? Failure<IReadOnlyList<InventoryHistoryEntry>>(404, "resource_not_found", "The inventory lot was not found.")
            : InventoryApplicationResult<IReadOnlyList<InventoryHistoryEntry>>.Success(200, transactions.Select(item => new InventoryHistoryEntry(item.TransactionId, item.Type, ToQuantity(item.PreviousMeasuredValue, item.PreviousMeasuredUnit, item.PreviousAvailabilityState), ToQuantity(item.ResultingMeasuredValue, item.ResultingMeasuredUnit, item.ResultingAvailabilityState), item.ReasonCode, item.OccurredAt)).ToList());
    }

    private async Task<InventoryApplicationResult<InventoryLotView>> MutateAsync(Guid lotId, InventoryVersionPrecondition precondition, string correlationId, Guid? idempotencyKey, string? idempotencyScope, string? idempotencyHash, CancellationToken cancellationToken, Func<InventoryLot, Product, DateTimeOffset, InventoryTransaction?> operation, int successStatus = 200)
    {
        if (!precondition.IsPresent) { return Failure<InventoryLotView>(428, "precondition_required", "If-Match is required."); }
        if (!precondition.IsValid) { return Failure<InventoryLotView>(412, "precondition_failed", "The inventory lot was modified."); }

        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var state = await writeStore.LoadActiveAsync(user.Id, lotId, cancellationToken);
        if (state is null) { return Failure<InventoryLotView>(404, "resource_not_found", "The inventory lot was not found."); }
        if (state.Lot.Version != precondition.Version) { return Failure<InventoryLotView>(412, "precondition_failed", "The inventory lot was modified."); }

        try
        {
            var now = timeProvider.GetUtcNow();
            var transaction = operation(state.Lot, state.Product, now);
            var response = ToView(state.Lot, state.Product);
            var idempotency = idempotencyKey is null ? null : new InventoryIdempotencyWrite(idempotencyKey.Value, idempotencyScope!, idempotencyHash!, 200, JsonSerializer.Serialize(response), Quote(response.Version), now);
            var outcome = await writeStore.SaveMutationAsync(new InventoryLotMutationWrite(user.Id, state.Lot, state.Product, precondition.Version, transaction, "inventory.lot.updated", correlationId, idempotency), cancellationToken);
            if (outcome == InventoryWriteOutcome.Saved) { return successStatus == 204 ? InventoryApplicationResult<InventoryLotView>.Success(204, null) : Success(response); }
            if (outcome == InventoryWriteOutcome.ConcurrencyConflict) { return Failure<InventoryLotView>(412, "precondition_failed", "The inventory lot was modified."); }
            return idempotencyKey is null
                ? Failure<InventoryLotView>(409, "persistence_conflict", "The inventory lot could not be persisted.")
                : Replay(await writeStore.FindIdempotencyAsync(user.Id, idempotencyScope!, idempotencyKey.Value, cancellationToken), idempotencyHash!, successStatus);
        }
        catch (InvalidOperationException exception)
        {
            return Failure<InventoryLotView>(422, "domain_rule_violated", exception.Message);
        }
    }

    private InventoryApplicationResult<InventoryLotView> Replay(InventoryIdempotencyRead? record, string hash, int successStatus)
    {
        if (record is null || record.CompletedAt is null) { return Failure<InventoryLotView>(409, "idempotency_in_progress", "The request is still being processed."); }
        if (!string.Equals(record.RequestHash, hash, StringComparison.Ordinal)) { return Failure<InventoryLotView>(409, "idempotency_key_reused", "The Idempotency-Key was used for a different request."); }
        var response = JsonSerializer.Deserialize<InventoryLotView>(record.ResponseBody!);
        return response is null ? Failure<InventoryLotView>(409, "idempotency_in_progress", "The request is still being processed.") : InventoryApplicationResult<InventoryLotView>.Success(successStatus, response, record.ETag);
    }

    private InventoryApplicationResult<InventoryLotView> Success(InventoryLotView view, int statusCode = 200) => InventoryApplicationResult<InventoryLotView>.Success(statusCode, view, Quote(view.Version));
    private InventoryLotView ToView(InventoryLot lot, Product product) => new(lot.Id, lot.ProductId, product.DisplayName, new InventoryQuantity(lot.Quantity is LotQuantity.Measured measured ? measured.Value : null, lot.Quantity is LotQuantity.Measured unit ? unit.Unit.ToString() : null, lot.Quantity is LotQuantity.Availability availability ? availability.State.ToString() : null), lot.Storage.Location.ToString(), lot.Storage.CustomLocation, lot.PackageState?.ToString(), lot.PrintedExpiration?.Date, lot.Notes?.Value, tokens.ProtectVersion(lot.Version), lot.CreatedAt, lot.UpdatedAt);
    private InventoryLotView ToView(InventoryLotReadModel lot) => new(lot.LotId, lot.ProductId, lot.ProductName, new InventoryQuantity(lot.MeasuredValue, lot.MeasuredUnit, lot.AvailabilityState), lot.StorageLocation, lot.CustomLocation, lot.PackageState, lot.PrintedExpirationDate, lot.Notes, tokens.ProtectVersion(lot.Version), lot.CreatedAt, lot.UpdatedAt);
    private static InventoryQuantity? ToQuantity(decimal? measuredValue, string? unit, string? availabilityState) => measuredValue is null && unit is null && availabilityState is null ? null : new InventoryQuantity(measuredValue, unit, availabilityState);
    private static string Quote(string version) => $"\"{version}\"";
    private static InventoryApplicationResult<T> Failure<T>(int status, string code, string detail, IReadOnlyDictionary<string, string[]>? errors = null) => InventoryApplicationResult<T>.Failure(status, code, detail, errors);
    private static InventoryLot CreateDomainLot(Guid ownerUserId, Guid productId, CreateInventoryLotCommand command, DateTimeOffset now)
    {
        var quantity = command.MeasuredValue is { } measured ? new LotQuantity.Measured(measured, Enum.Parse<CanonicalUnit>(command.Unit!)) : LotQuantity.FromAvailability(Enum.Parse<AvailabilityState>(command.AvailabilityState!));
        return InventoryLot.Create(ownerUserId, productId, quantity, ToStorage(command.StorageLocation!, command.CustomLocation), ToPackageState(command.PackageState), ToExpiration(command.PrintedExpirationDate), ToNotes(command.Notes), now);
    }

    private static LotStorage ToStorage(string location, string? customLocation) { LotStorage.TryCreate(Enum.Parse<StorageLocation>(location), customLocation, out var storage); return storage!; }
    private static PackageState? ToPackageState(string? packageState) => packageState is null ? null : Enum.Parse<PackageState>(packageState);
    private static PrintedExpiration? ToExpiration(DateOnly? expiration) => expiration is null ? null : new PrintedExpiration(expiration.Value, ExpirationProvenance.UserEntered);
    private static PrivateNotes? ToNotes(string? notes) { PrivateNotes.TryCreate(notes, out var privateNotes); return privateNotes; }
    private static bool ValidateProductName(string? value, out string? productName) { productName = value?.Trim(); return !string.IsNullOrWhiteSpace(productName) && productName.Length <= 160; }
    private static bool ValidateMetadata(string? location, string? custom, string? packageState, string? notes, out string? error)
    {
        var validStorage = location is "Pantry" or "Refrigerator" or "Freezer" && string.IsNullOrWhiteSpace(custom) || location == "Other" && !string.IsNullOrWhiteSpace(custom) && custom.Trim().Length <= 80;
        var validPackage = packageState is null or "Sealed" or "Opened" or "Unknown";
        var validNotes = notes is null || notes.Trim().Length <= 1000;
        error = !validStorage ? "The storage location is invalid." : !validPackage ? "The package state is invalid." : !validNotes ? "Notes must be at most 1000 characters." : null;
        return error is null;
    }

    private static bool ValidateQuantity(decimal? value, string? unit, string? availabilityState, out string? error)
    {
        var measured = value is > 0m and { } measuredValue && decimal.Round(measuredValue, 3) == measuredValue && unit is "Gram" or "Milliliter" or "Unit" && availabilityState is null;
        var available = value is null && unit is null && availabilityState is "Available" or "Low" or "Unavailable";
        error = measured || available ? null : "Quantity must be either a positive canonical measured value with a maximum of three decimal places or an availability state.";
        return error is null;
    }

    private static string Hash<T>(T value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value))));
    private static IReadOnlyDictionary<string, string[]> FieldErrors(string field, string error) => new Dictionary<string, string[]>(StringComparer.Ordinal) { [field] = [error] };
    private static string MetadataField(string? error) => error?.StartsWith("Notes", StringComparison.Ordinal) == true ? "notes" : error?.StartsWith("The package", StringComparison.Ordinal) == true ? "packageState" : "storageLocation";
}
