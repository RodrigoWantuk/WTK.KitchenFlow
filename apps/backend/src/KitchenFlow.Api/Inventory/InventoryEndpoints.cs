using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using KitchenFlow.Api.Services;
using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Inventory.Domain;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace KitchenFlow.Api.Inventory;

public static class InventoryEndpoints
{
    public static RouteGroupBuilder MapInventoryEndpoints(this RouteGroupBuilder group)
    {
        group.AddEndpointFilter(async (context, next) =>
        {
            if (HttpMethods.IsPost(context.HttpContext.Request.Method) || HttpMethods.IsPatch(context.HttpContext.Request.Method) || HttpMethods.IsDelete(context.HttpContext.Request.Method))
            {
                try
                {
                    await context.HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Antiforgery.IAntiforgery>().ValidateRequestAsync(context.HttpContext);
                }
                catch (Microsoft.AspNetCore.Antiforgery.AntiforgeryValidationException)
                {
                    return Problem(400, "validation_failed", "A valid CSRF token is required.");
                }
            }

            return await next(context);
        });
        group.MapGet("/lots", ListAsync).Produces<ListLotsResponse>().ProducesProblem(400);
        group.MapPost("/lots", CreateAsync).RequireRateLimiting("mutation").Produces<LotResponse>(StatusCodes.Status201Created).ProducesProblem(400).ProducesProblem(409).ProducesProblem(422);
        group.MapGet("/lots/{lotId:guid}", GetAsync).Produces<LotResponse>().ProducesProblem(404);
        group.MapPatch("/lots/{lotId:guid}", UpdateAsync).RequireRateLimiting("mutation").Produces<LotResponse>().ProducesProblem(404).ProducesProblem(412).ProducesProblem(422).ProducesProblem(428);
        group.MapPost("/lots/{lotId:guid}/adjustments", AdjustAsync).RequireRateLimiting("mutation").Produces<LotResponse>().ProducesProblem(400).ProducesProblem(404).ProducesProblem(409).ProducesProblem(412).ProducesProblem(422).ProducesProblem(428);
        group.MapDelete("/lots/{lotId:guid}", DeleteAsync).RequireRateLimiting("mutation").Produces(StatusCodes.Status204NoContent).ProducesProblem(404).ProducesProblem(412).ProducesProblem(428);
        group.MapGet("/lots/{lotId:guid}/history", HistoryAsync).Produces<IReadOnlyList<LotHistoryResponse>>().ProducesProblem(404);
        return group;
    }

    private static async Task<IResult> ListAsync(int? pageSize, string? status, string? storageLocation, string? search, string? cursor, CurrentUserService currentUser, ApplicationDbContext database, IDataProtectionProvider dataProtection, CancellationToken cancellationToken)
    {
        if (pageSize is < 1 or > 100)
        {
            return Problem(400, "validation_failed", "pageSize must be between 1 and 100.");
        }

        if (status is not null && status is not ("active" or "depleted" or "deleted"))
        {
            return Problem(400, "validation_failed", "status must be active, depleted, or deleted.");
        }

        if (storageLocation is not null && storageLocation is not ("Pantry" or "Refrigerator" or "Freezer" or "Other"))
        {
            return Problem(400, "validation_failed", "storageLocation is invalid.");
        }

        CursorPosition? position = null;
        if (!string.IsNullOrWhiteSpace(cursor) && !TryReadCursor(cursor, dataProtection, out position))
        {
            return Problem(400, "invalid_cursor", "The cursor is invalid.");
        }

        var user = await currentUser.GetOrCreateAsync(cancellationToken);
        var lots = database.Lots.Where(lot => lot.OwnerUserId == user.Id);
        lots = status switch
        {
            "deleted" => lots.Where(lot => lot.DeletedAt != null),
            "depleted" => lots.Where(lot => lot.DeletedAt == null && ((lot.MeasuredValue != null && lot.MeasuredValue == 0m) || lot.AvailabilityState == "Unavailable")),
            null or "active" => lots.Where(lot => lot.DeletedAt == null && ((lot.MeasuredValue != null && lot.MeasuredValue > 0m) || (lot.MeasuredValue == null && lot.AvailabilityState != "Unavailable"))),
            _ => lots
        };

        if (storageLocation is not null)
        {
            lots = lots.Where(lot => lot.StorageLocation == storageLocation);
        }

        var records = from lot in lots
                      join product in database.Products on lot.ProductId equals product.Id
                      where product.OwnerUserId == user.Id
                      select new { Lot = lot, Product = product };
        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToUpperInvariant();
            records = records.Where(item => item.Product.NormalizedSearchName.Contains(normalized));
        }

        if (position is not null)
        {
            records = records.Where(item => item.Lot.UpdatedAt < position.UpdatedAt || (item.Lot.UpdatedAt == position.UpdatedAt && item.Lot.Id.CompareTo(position.LotId) < 0));
        }

        var limit = pageSize ?? 25;
        var page = await records
            .OrderByDescending(item => item.Lot.UpdatedAt).ThenByDescending(item => item.Lot.Id)
            .Take(limit + 1)
            .ToListAsync(cancellationToken);
        var hasMore = page.Count > limit;
        var items = page.Take(limit).ToList();
        var nextCursor = hasMore
            ? WriteCursor(new CursorPosition(items[^1].Lot.UpdatedAt, items[^1].Lot.Id), dataProtection)
            : null;
        return Results.Ok(new ListLotsResponse(items.Select(item => ToResponse(item.Lot, item.Product.DisplayName)).ToList(), nextCursor));
    }

    private static async Task<IResult> GetAsync(Guid lotId, CurrentUserService currentUser, ApplicationDbContext database, CancellationToken cancellationToken)
    {
        var user = await currentUser.GetOrCreateAsync(cancellationToken);
        var record = await FindLotAsync(lotId, user.Id, database, cancellationToken);
        return record is null || record.Value.Lot.DeletedAt is not null
            ? Problem(404, "resource_not_found", "The inventory lot was not found.")
            : WithEtag(ToResponse(record.Value.Lot, record.Value.Product.DisplayName), record.Value.Lot.Version);
    }

    private static async Task<IResult> CreateAsync(CreateLotRequest request, HttpRequest httpRequest, CurrentUserService currentUser, ApplicationDbContext database, TimeProvider timeProvider, CancellationToken cancellationToken)
    {
        if (!TryIdempotencyKey(httpRequest, out var key))
        {
            return Problem(400, "validation_failed", "A UUID Idempotency-Key header is required.");
        }

        var validProductName = ValidateProductName(request.ProductName, out var productName, out var normalizedProductName);
        var validQuantity = ValidateQuantity(request.Quantity, out var quantityError);
        var validMetadata = ValidateMetadata(request.StorageLocation, request.CustomLocation, request.PackageState, request.Notes, out var metadataError);
        if (!validProductName || !validQuantity || !validMetadata)
        {
            return Problem(422, "domain_rule_violated", quantityError ?? metadataError ?? "The product name is invalid.");
        }

        var user = await currentUser.GetOrCreateAsync(cancellationToken);
        var hash = Hash(new
        {
            ProductName = productName,
            Quantity = new { request.Quantity.MeasuredValue, request.Quantity.Unit, request.Quantity.AvailabilityState },
            request.StorageLocation,
            CustomLocation = request.CustomLocation?.Trim(),
            request.PackageState,
            request.PrintedExpirationDate,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        });
        var prior = await database.IdempotencyRecords.SingleOrDefaultAsync(record => record.OwnerUserId == user.Id && record.Scope == "inventory.lots.create" && record.Key == key, cancellationToken);
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
            return WithEtag(replay, replay.Version, StatusCodes.Status201Created);
        }

        var now = timeProvider.GetUtcNow();
        ProductName.TryCreate(productName, out var domainProductName);
        var domainProduct = Product.Create(user.Id, domainProductName!, now);
        var domainLot = CreateDomainLot(user.Id, domainProduct.Id, request, now);
        var product = new ProductRecord { Id = domainProduct.Id, OwnerUserId = domainProduct.OwnerUserId, DisplayName = domainProduct.DisplayName, NormalizedSearchName = domainProduct.NormalizedSearchName, CreatedAt = domainProduct.CreatedAt, UpdatedAt = domainProduct.UpdatedAt };
        var lot = ToRecord(domainLot);
        var response = ToResponse(lot, product.DisplayName);
        database.AddRange(product, lot, new TransactionRecord { Id = Guid.NewGuid(), OwnerUserId = user.Id, LotId = lot.Id, Type = "Initial", ResultingMeasuredValue = lot.MeasuredValue, ResultingMeasuredUnit = lot.MeasuredUnit, ResultingAvailabilityState = lot.AvailabilityState, OccurredAt = now }, new AuditEventRecord { Id = Guid.NewGuid(), ActorUserId = user.Id, EventName = "inventory.lot.created", TargetType = "inventory_lot", TargetId = lot.Id, CorrelationId = httpRequest.HttpContext.TraceIdentifier, MetadataJson = "{}", OccurredAt = now }, new IdempotencyRecord { Id = Guid.NewGuid(), OwnerUserId = user.Id, Scope = "inventory.lots.create", Key = key, RequestHash = hash, StatusCode = 201, ResponseBody = JsonSerializer.Serialize(response), ETag = Etag(lot.Version), CreatedAt = now, CompletedAt = now });
        try
        {
            await database.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return await ReplayAfterIdempotencyRaceAsync(database, user.Id, "inventory.lots.create", key, hash, StatusCodes.Status201Created, cancellationToken);
        }
        return WithEtag(response, lot.Version, StatusCodes.Status201Created);
    }

    private static async Task<IResult> UpdateAsync(Guid lotId, UpdateLotRequest request, HttpRequest requestContext, CurrentUserService currentUser, ApplicationDbContext database, TimeProvider timeProvider, CancellationToken cancellationToken)
    {
        var validMetadata = ValidateMetadata(request.StorageLocation, request.CustomLocation, request.PackageState, request.Notes, out var metadataError);
        var validProductName = request.ProductName is null || ValidateProductName(request.ProductName, out _, out _);
        if (!validMetadata || !validProductName)
        {
            return Problem(422, "domain_rule_violated", metadataError ?? "The product name is invalid.");
        }

        return await MutateAsync(lotId, requestContext, currentUser, database, timeProvider, cancellationToken, (lot, product, now) =>
        {
            var domainLot = ToDomain(lot);
            domainLot.UpdateMetadata(ToStorage(request.StorageLocation, request.CustomLocation), ToPackageState(request.PackageState), ToExpiration(request.PrintedExpirationDate), ToNotes(request.Notes), now);
            CopyToRecord(domainLot, lot);
            if (request.ProductName is not null)
            {
                ProductName.TryCreate(request.ProductName, out var domainProductName);
                var domainProduct = Product.Restore(product.Id, product.OwnerUserId, domainProductName!, product.CreatedAt, product.UpdatedAt, product.IsDeleted);
                domainProduct.Rename(domainProductName!, now);
                product.DisplayName = domainProduct.DisplayName;
                product.NormalizedSearchName = domainProduct.NormalizedSearchName;
                product.UpdatedAt = domainProduct.UpdatedAt;
            }
            return null;
        });
    }

    private static async Task<IResult> AdjustAsync(Guid lotId, AdjustmentRequest request, HttpRequest requestContext, CurrentUserService currentUser, ApplicationDbContext database, TimeProvider timeProvider, CancellationToken cancellationToken)
    {
        if (!TryIdempotencyKey(requestContext, out var key))
        {
            return Problem(400, "validation_failed", "A UUID Idempotency-Key header is required.");
        }

        var user = await currentUser.GetOrCreateAsync(cancellationToken);
        var hash = Hash(new
        {
            LotId = lotId,
            request.Type,
            request.Value,
            request.AvailabilityState,
            ReasonCode = string.IsNullOrWhiteSpace(request.ReasonCode) ? null : request.ReasonCode.Trim(),
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        });
        var prior = await database.IdempotencyRecords.SingleOrDefaultAsync(record => record.OwnerUserId == user.Id && record.Scope == "inventory.lots.adjust" && record.Key == key, cancellationToken);
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
            return WithEtag(replay, replay.Version);
        }

        return await MutateAsync(lotId, requestContext, currentUser, database, timeProvider, cancellationToken, (lot, _, now) =>
        {
            var domainLot = ToDomain(lot);
            InventoryTransaction transaction = request.Type switch
            {
                "Consume" => domainLot.AdjustMeasured(InventoryTransactionType.Consume, request.Value ?? throw new InvalidOperationException("A measured adjustment value is required."), request.ReasonCode?.Trim(), request.Note?.Trim(), key, now),
                "Discard" => domainLot.AdjustMeasured(InventoryTransactionType.Discard, request.Value ?? throw new InvalidOperationException("A measured adjustment value is required."), request.ReasonCode?.Trim(), request.Note?.Trim(), key, now),
                "Correct" => domainLot.AdjustMeasured(InventoryTransactionType.Correct, request.Value ?? throw new InvalidOperationException("A measured adjustment value is required."), request.ReasonCode?.Trim(), request.Note?.Trim(), key, now),
                "AvailabilityChanged" when request.Value is null && request.AvailabilityState is not null && !string.IsNullOrWhiteSpace(request.ReasonCode) => domainLot.ChangeAvailability(Enum.Parse<AvailabilityState>(request.AvailabilityState), request.ReasonCode.Trim(), request.Note?.Trim(), key, now),
                _ => throw new InvalidOperationException("The adjustment is invalid for this lot.")
            };
            CopyToRecord(domainLot, lot);
            return ToRecord(transaction);
        }, idempotencyKey: key, idempotencyScope: "inventory.lots.adjust", idempotencyHash: hash);
    }

    private static async Task<IResult> DeleteAsync(Guid lotId, HttpRequest requestContext, CurrentUserService currentUser, ApplicationDbContext database, TimeProvider timeProvider, CancellationToken cancellationToken) =>
        await MutateAsync(lotId, requestContext, currentUser, database, timeProvider, cancellationToken, (lot, _, now) =>
        {
            var domainLot = ToDomain(lot);
            var transaction = domainLot.Delete(null, null, now);
            CopyToRecord(domainLot, lot);
            return ToRecord(transaction);
        }, StatusCodes.Status204NoContent);

    private static async Task<IResult> HistoryAsync(Guid lotId, CurrentUserService currentUser, ApplicationDbContext database, CancellationToken cancellationToken)
    {
        var user = await currentUser.GetOrCreateAsync(cancellationToken);
        if (await FindLotAsync(lotId, user.Id, database, cancellationToken) is null)
        {
            return Problem(404, "resource_not_found", "The inventory lot was not found.");
        }

        var transactions = await database.Transactions.Where(item => item.OwnerUserId == user.Id && item.LotId == lotId).OrderByDescending(item => item.OccurredAt).ToListAsync(cancellationToken);
        return Results.Ok(transactions.Select(item => new LotHistoryResponse(item.Id, item.Type, ToQuantity(item.PreviousMeasuredValue, item.PreviousMeasuredUnit, item.PreviousAvailabilityState), ToQuantity(item.ResultingMeasuredValue, item.ResultingMeasuredUnit, item.ResultingAvailabilityState), item.ReasonCode, item.OccurredAt)));
    }

    private static async Task<IResult> MutateAsync(Guid lotId, HttpRequest request, CurrentUserService currentUser, ApplicationDbContext database, TimeProvider clock, CancellationToken cancellationToken, Func<LotRecord, ProductRecord, DateTimeOffset, TransactionRecord?> operation, int successStatus = StatusCodes.Status200OK, Guid? idempotencyKey = null, string? idempotencyScope = null, string? idempotencyHash = null)
    {
        if (!TryVersion(request, out var version))
        {
            return Problem(428, "precondition_required", "If-Match is required.");
        }

        var user = await currentUser.GetOrCreateAsync(cancellationToken);
        var item = await FindLotAsync(lotId, user.Id, database, cancellationToken);
        if (item is null || item.Value.Lot.DeletedAt is not null)
        {
            return Problem(404, "resource_not_found", "The inventory lot was not found.");
        }

        if (item.Value.Lot.Version != version)
        {
            return Problem(412, "precondition_failed", "The inventory lot was modified.");
        }

        try
        {
            var now = clock.GetUtcNow();
            var transaction = operation(item.Value.Lot, item.Value.Product, now);
            if (transaction is not null)
            {
                database.Transactions.Add(transaction);
            }

            database.AuditEvents.Add(new AuditEventRecord { Id = Guid.NewGuid(), ActorUserId = user.Id, EventName = "inventory.lot.updated", TargetType = "inventory_lot", TargetId = lotId, CorrelationId = request.HttpContext.TraceIdentifier, MetadataJson = "{}", OccurredAt = now });
            var response = ToResponse(item.Value.Lot, item.Value.Product.DisplayName);
            if (idempotencyKey is not null)
            {
                database.IdempotencyRecords.Add(new IdempotencyRecord { Id = Guid.NewGuid(), OwnerUserId = user.Id, Scope = idempotencyScope!, Key = idempotencyKey.Value, RequestHash = idempotencyHash!, StatusCode = StatusCodes.Status200OK, ResponseBody = JsonSerializer.Serialize(response), ETag = Etag(item.Value.Lot.Version), CreatedAt = now, CompletedAt = now });
            }
            await database.SaveChangesAsync(cancellationToken);
            return successStatus == 204 ? Results.NoContent() : WithEtag(response, item.Value.Lot.Version);
        }
        catch (DbUpdateConcurrencyException) when (idempotencyKey is not null)
        {
            return await ReplayAfterIdempotencyRaceAsync(database, user.Id, idempotencyScope!, idempotencyKey.Value, idempotencyHash!, successStatus, cancellationToken);
        }
        catch (DbUpdateConcurrencyException) { return Problem(412, "precondition_failed", "The inventory lot was modified."); }
        catch (DbUpdateException) when (idempotencyKey is not null)
        {
            return await ReplayAfterIdempotencyRaceAsync(database, user.Id, idempotencyScope!, idempotencyKey.Value, idempotencyHash!, successStatus, cancellationToken);
        }
        catch (InvalidOperationException exception) { return Problem(422, "domain_rule_violated", exception.Message); }
    }

    private static async Task<(LotRecord Lot, ProductRecord Product)?> FindLotAsync(Guid id, Guid ownerId, ApplicationDbContext db, CancellationToken ct)
    {
        var lot = await db.Lots.SingleOrDefaultAsync(candidate => candidate.Id == id && candidate.OwnerUserId == ownerId, ct);
        if (lot is null)
        {
            return null;
        }

        var product = await db.Products.SingleOrDefaultAsync(candidate => candidate.Id == lot.ProductId && candidate.OwnerUserId == ownerId, ct);
        return product is null ? null : (lot, product);
    }

    private static InventoryLot CreateDomainLot(Guid ownerUserId, Guid productId, CreateLotRequest request, DateTimeOffset now)
    {
        var quantity = request.Quantity.MeasuredValue is { } measured
            ? new LotQuantity.Measured(measured, Enum.Parse<CanonicalUnit>(request.Quantity.Unit!))
            : LotQuantity.FromAvailability(Enum.Parse<AvailabilityState>(request.Quantity.AvailabilityState!));
        return InventoryLot.Create(ownerUserId, productId, quantity, ToStorage(request.StorageLocation, request.CustomLocation), ToPackageState(request.PackageState), ToExpiration(request.PrintedExpirationDate), ToNotes(request.Notes), now);
    }

    private static InventoryLot ToDomain(LotRecord lot)
    {
        var quantity = lot.MeasuredValue is { } measured
            ? new LotQuantity.Measured(measured, Enum.Parse<CanonicalUnit>(lot.MeasuredUnit!))
            : LotQuantity.FromAvailability(Enum.Parse<AvailabilityState>(lot.AvailabilityState!));
        return InventoryLot.Restore(lot.Id, lot.OwnerUserId, lot.ProductId, quantity, ToStorage(lot.StorageLocation, lot.CustomLocation), ToPackageState(lot.PackageState), ToExpiration(lot.PrintedExpirationDate), ToNotes(lot.Notes), lot.Version, lot.CreatedAt, lot.UpdatedAt, lot.DeletedAt);
    }

    private static LotRecord ToRecord(InventoryLot lot)
    {
        var record = new LotRecord { Id = lot.Id, OwnerUserId = lot.OwnerUserId, ProductId = lot.ProductId, StorageLocation = lot.Storage.Location.ToString() };
        CopyToRecord(lot, record);
        return record;
    }

    private static void CopyToRecord(InventoryLot source, LotRecord target)
    {
        target.MeasuredValue = source.Quantity is LotQuantity.Measured measured ? measured.Value : null;
        target.MeasuredUnit = source.Quantity is LotQuantity.Measured unit ? unit.Unit.ToString() : null;
        target.AvailabilityState = source.Quantity is LotQuantity.Availability availability ? availability.State.ToString() : null;
        target.StorageLocation = source.Storage.Location.ToString();
        target.CustomLocation = source.Storage.CustomLocation;
        target.PackageState = source.PackageState?.ToString();
        target.PrintedExpirationDate = source.PrintedExpiration?.Date;
        target.ExpirationProvenance = source.PrintedExpiration?.Provenance.ToString();
        target.Notes = source.Notes?.Value;
        target.Version = source.Version;
        target.CreatedAt = source.CreatedAt;
        target.UpdatedAt = source.UpdatedAt;
        target.DeletedAt = source.DeletedAt;
    }

    private static TransactionRecord ToRecord(InventoryTransaction transaction) => new()
    {
        Id = transaction.Id,
        OwnerUserId = transaction.OwnerUserId,
        LotId = transaction.LotId,
        Type = transaction.Type.ToString(),
        PreviousMeasuredValue = transaction.PreviousQuantity is LotQuantity.Measured previous ? previous.Value : null,
        PreviousMeasuredUnit = transaction.PreviousQuantity is LotQuantity.Measured previousUnit ? previousUnit.Unit.ToString() : null,
        PreviousAvailabilityState = transaction.PreviousQuantity is LotQuantity.Availability previousAvailability ? previousAvailability.State.ToString() : null,
        ResultingMeasuredValue = transaction.ResultingQuantity is LotQuantity.Measured result ? result.Value : null,
        ResultingMeasuredUnit = transaction.ResultingQuantity is LotQuantity.Measured resultUnit ? resultUnit.Unit.ToString() : null,
        ResultingAvailabilityState = transaction.ResultingQuantity is LotQuantity.Availability resultAvailability ? resultAvailability.State.ToString() : null,
        ReasonCode = transaction.ReasonCode,
        Note = transaction.Note,
        IdempotencyKey = transaction.IdempotencyKey,
        OccurredAt = transaction.OccurredAt
    };

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

    private static LotResponse ToResponse(LotRecord lot, string productName) => new(lot.Id, lot.ProductId, productName, ToQuantity(lot), lot.StorageLocation, lot.CustomLocation, lot.PackageState, lot.PrintedExpirationDate, lot.Notes, lot.Version, lot.CreatedAt, lot.UpdatedAt);
    private static QuantityResponse ToQuantity(LotRecord lot) => new(lot.MeasuredValue, lot.MeasuredUnit, lot.AvailabilityState);
    private static QuantityResponse? ToQuantity(decimal? measuredValue, string? unit, string? availabilityState) => measuredValue is null && unit is null && availabilityState is null ? null : new QuantityResponse(measuredValue, unit, availabilityState);
    private static IResult WithEtag(LotResponse response, long version, int status = 200) => new EtagResult<LotResponse>(response, Etag(version), status);
    private static string Etag(long version) => $"\"{version}\"";
    private static bool TryVersion(HttpRequest request, out long version) => long.TryParse(request.Headers.IfMatch.ToString().Trim('"'), out version);
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

    private static async Task<IResult> ReplayAfterIdempotencyRaceAsync(ApplicationDbContext database, Guid ownerUserId, string scope, Guid key, string hash, int successStatus, CancellationToken cancellationToken)
    {
        // A unique PostgreSQL index elects one concurrent request as the owner. Clearing tracked
        // failed inserts is essential before loading that owner's committed semantic response.
        database.ChangeTracker.Clear();
        var record = await database.IdempotencyRecords.SingleOrDefaultAsync(candidate => candidate.OwnerUserId == ownerUserId && candidate.Scope == scope && candidate.Key == key, cancellationToken);
        if (record is null || record.CompletedAt is null)
        {
            return Problem(409, "idempotency_in_progress", "The request is still being processed.");
        }

        if (!string.Equals(record.RequestHash, hash, StringComparison.Ordinal))
        {
            return Problem(409, "idempotency_key_reused", "The Idempotency-Key was used for a different request.");
        }

        var response = JsonSerializer.Deserialize<LotResponse>(record.ResponseBody!);
        return response is null
            ? Problem(409, "idempotency_in_progress", "The request is still being processed.")
            : WithEtag(response, response.Version, successStatus);
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
    private static IResult Problem(int status, string code, string detail) => Results.Problem(detail: detail, statusCode: status, extensions: new Dictionary<string, object?> { ["errorCode"] = code });

    private sealed record CursorPosition(DateTimeOffset UpdatedAt, Guid LotId);

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
