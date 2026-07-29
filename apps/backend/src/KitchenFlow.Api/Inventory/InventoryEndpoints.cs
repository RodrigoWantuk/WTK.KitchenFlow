using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using KitchenFlow.Api.Services;
using KitchenFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Antiforgery;
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
        group.MapGet("/lots", ListAsync);
        group.MapPost("/lots", CreateAsync);
        group.MapGet("/lots/{lotId:guid}", GetAsync);
        group.MapPatch("/lots/{lotId:guid}", UpdateAsync);
        group.MapPost("/lots/{lotId:guid}/adjustments", AdjustAsync);
        group.MapDelete("/lots/{lotId:guid}", DeleteAsync);
        group.MapGet("/lots/{lotId:guid}/history", HistoryAsync);
        return group;
    }

    private static async Task<IResult> ListAsync(int? pageSize, string? status, CurrentUserService currentUser, ApplicationDbContext database, CancellationToken cancellationToken)
    {
        if (pageSize is < 1 or > 100)
        {
            return Problem(400, "validation_failed", "pageSize must be between 1 and 100.");
        }

        var user = await currentUser.GetOrCreateAsync(cancellationToken);
        var lots = database.Lots.Where(lot => lot.OwnerUserId == user.Id);
        lots = status switch
        {
            "deleted" => lots.Where(lot => lot.DeletedAt != null),
            "depleted" => lots.Where(lot => lot.DeletedAt == null && ((lot.MeasuredValue != null && lot.MeasuredValue == 0m) || lot.AvailabilityState == "Unavailable")),
            null or "active" => lots.Where(lot => lot.DeletedAt == null && ((lot.MeasuredValue != null && lot.MeasuredValue > 0m) || (lot.MeasuredValue == null && lot.AvailabilityState != "Unavailable"))),
            _ => throw new ArgumentException("Invalid status.")
        };

        var records = await (from lot in lots
                             join product in database.Products on lot.ProductId equals product.Id
                             orderby lot.UpdatedAt descending, lot.Id descending
                             select new { Lot = lot, Product = product })
            .Take(pageSize ?? 25)
            .ToListAsync(cancellationToken);
        return Results.Ok(new ListLotsResponse(records.Select(item => ToResponse(item.Lot, item.Product.DisplayName)).ToList(), null));
    }

    private static async Task<IResult> GetAsync(Guid lotId, CurrentUserService currentUser, ApplicationDbContext database, CancellationToken cancellationToken)
    {
        var user = await currentUser.GetOrCreateAsync(cancellationToken);
        var record = await FindLotAsync(lotId, user.Id, database, cancellationToken);
        return record is null ? Problem(404, "resource_not_found", "The inventory lot was not found.") : WithEtag(ToResponse(record.Value.Lot, record.Value.Product.DisplayName), record.Value.Lot.Version);
    }

    private static async Task<IResult> CreateAsync(CreateLotRequest request, HttpRequest httpRequest, CurrentUserService currentUser, ApplicationDbContext database, TimeProvider timeProvider, CancellationToken cancellationToken)
    {
        if (!TryIdempotencyKey(httpRequest, out var key))
        {
            return Problem(400, "validation_failed", "A UUID Idempotency-Key header is required.");
        }

        if (!ValidateQuantity(request.Quantity, out var quantityError) || !ValidateStorage(request.StorageLocation, request.CustomLocation))
        {
            return Problem(422, "domain_rule_violated", quantityError ?? "Invalid storage location.");
        }

        var user = await currentUser.GetOrCreateAsync(cancellationToken);
        var hash = Hash(request);
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
        var product = new ProductRecord { Id = Guid.NewGuid(), OwnerUserId = user.Id, DisplayName = request.ProductName.Trim(), NormalizedSearchName = request.ProductName.Trim().ToUpperInvariant(), CreatedAt = now, UpdatedAt = now };
        var lot = new LotRecord { Id = Guid.NewGuid(), OwnerUserId = user.Id, ProductId = product.Id, MeasuredValue = request.Quantity.MeasuredValue, MeasuredUnit = request.Quantity.Unit, AvailabilityState = request.Quantity.AvailabilityState, StorageLocation = request.StorageLocation, CustomLocation = request.CustomLocation, PackageState = request.PackageState, PrintedExpirationDate = request.PrintedExpirationDate, ExpirationProvenance = request.PrintedExpirationDate is null ? null : "UserEntered", Notes = request.Notes, Version = 1, CreatedAt = now, UpdatedAt = now };
        var response = ToResponse(lot, product.DisplayName);
        database.AddRange(product, lot, new TransactionRecord { Id = Guid.NewGuid(), OwnerUserId = user.Id, LotId = lot.Id, Type = "Initial", ResultingMeasuredValue = lot.MeasuredValue, ResultingMeasuredUnit = lot.MeasuredUnit, ResultingAvailabilityState = lot.AvailabilityState, OccurredAt = now }, new AuditEventRecord { Id = Guid.NewGuid(), ActorUserId = user.Id, EventName = "inventory.lot.created", TargetType = "inventory_lot", TargetId = lot.Id, CorrelationId = httpRequest.HttpContext.TraceIdentifier, MetadataJson = "{}", OccurredAt = now }, new IdempotencyRecord { Id = Guid.NewGuid(), OwnerUserId = user.Id, Scope = "inventory.lots.create", Key = key, RequestHash = hash, StatusCode = 201, ResponseBody = JsonSerializer.Serialize(response), ETag = Etag(lot.Version), CreatedAt = now, CompletedAt = now });
        await database.SaveChangesAsync(cancellationToken);
        return WithEtag(response, lot.Version, StatusCodes.Status201Created);
    }

    private static async Task<IResult> UpdateAsync(Guid lotId, UpdateLotRequest request, HttpRequest requestContext, CurrentUserService currentUser, ApplicationDbContext database, TimeProvider timeProvider, CancellationToken cancellationToken) =>
        await MutateAsync(lotId, requestContext, currentUser, database, timeProvider, cancellationToken, (lot, _) => { lot.StorageLocation = request.StorageLocation; lot.CustomLocation = request.CustomLocation; lot.PackageState = request.PackageState; lot.PrintedExpirationDate = request.PrintedExpirationDate; lot.ExpirationProvenance = request.PrintedExpirationDate is null ? null : "UserEntered"; lot.Notes = request.Notes; return null; });

    private static async Task<IResult> AdjustAsync(Guid lotId, AdjustmentRequest request, HttpRequest requestContext, CurrentUserService currentUser, ApplicationDbContext database, TimeProvider timeProvider, CancellationToken cancellationToken)
    {
        if (!TryIdempotencyKey(requestContext, out var key))
        {
            return Problem(400, "validation_failed", "A UUID Idempotency-Key header is required.");
        }

        var user = await currentUser.GetOrCreateAsync(cancellationToken);
        var hash = Hash(new { LotId = lotId, Request = request });
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

        return await MutateAsync(lotId, requestContext, currentUser, database, timeProvider, cancellationToken, (lot, now) =>
        {
            var previous = ToQuantity(lot);
            if (request.Type is "Consume" or "Discard" && lot.MeasuredValue is { } current && request.Value is { } delta && delta > 0m && delta <= current)
            {
                lot.MeasuredValue = current - delta;
            }
            else if (request.Type == "Correct" && request.Value is >= 0m)
            {
                lot.MeasuredValue = request.Value;
            }
            else if (request.Type == "AvailabilityChanged" && lot.MeasuredValue is null && request.AvailabilityState is not null)
            {
                lot.AvailabilityState = request.AvailabilityState;
            }
            else
            {
                throw new InvalidOperationException("The adjustment is invalid for this lot.");
            }

            return new TransactionRecord { Id = Guid.NewGuid(), OwnerUserId = lot.OwnerUserId, LotId = lot.Id, Type = request.Type, PreviousMeasuredValue = previous.MeasuredValue, PreviousMeasuredUnit = previous.Unit, PreviousAvailabilityState = previous.AvailabilityState, ResultingMeasuredValue = lot.MeasuredValue, ResultingMeasuredUnit = lot.MeasuredUnit, ResultingAvailabilityState = lot.AvailabilityState, ReasonCode = request.ReasonCode, Note = request.Note, IdempotencyKey = key, OccurredAt = now };
        }, idempotencyKey: key, idempotencyScope: "inventory.lots.adjust", idempotencyHash: hash);
    }

    private static async Task<IResult> DeleteAsync(Guid lotId, HttpRequest requestContext, CurrentUserService currentUser, ApplicationDbContext database, TimeProvider timeProvider, CancellationToken cancellationToken) =>
        await MutateAsync(lotId, requestContext, currentUser, database, timeProvider, cancellationToken, (lot, now) => { lot.DeletedAt = now; return new TransactionRecord { Id = Guid.NewGuid(), OwnerUserId = lot.OwnerUserId, LotId = lot.Id, Type = "Deleted", OccurredAt = now }; }, StatusCodes.Status204NoContent);

    private static async Task<IResult> HistoryAsync(Guid lotId, CurrentUserService currentUser, ApplicationDbContext database, CancellationToken cancellationToken)
    {
        var user = await currentUser.GetOrCreateAsync(cancellationToken);
        if (await FindLotAsync(lotId, user.Id, database, cancellationToken) is null)
        {
            return Problem(404, "resource_not_found", "The inventory lot was not found.");
        }

        var history = await database.Transactions.Where(item => item.OwnerUserId == user.Id && item.LotId == lotId).OrderByDescending(item => item.OccurredAt).Select(item => new LotHistoryResponse(item.Id, item.Type, new QuantityResponse(item.PreviousMeasuredValue, item.PreviousMeasuredUnit, item.PreviousAvailabilityState), new QuantityResponse(item.ResultingMeasuredValue, item.ResultingMeasuredUnit, item.ResultingAvailabilityState), item.ReasonCode, item.OccurredAt)).ToListAsync(cancellationToken);
        return Results.Ok(history);
    }

    private static async Task<IResult> MutateAsync(Guid lotId, HttpRequest request, CurrentUserService currentUser, ApplicationDbContext database, TimeProvider clock, CancellationToken cancellationToken, Func<LotRecord, DateTimeOffset, TransactionRecord?> operation, int successStatus = StatusCodes.Status200OK, Guid? idempotencyKey = null, string? idempotencyScope = null, string? idempotencyHash = null)
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
            var transaction = operation(item.Value.Lot, now);
            item.Value.Lot.Version++;
            item.Value.Lot.UpdatedAt = now;
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
        catch (DbUpdateConcurrencyException) { return Problem(412, "precondition_failed", "The inventory lot was modified."); }
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
    private static LotResponse ToResponse(LotRecord lot, string productName) => new(lot.Id, lot.ProductId, productName, ToQuantity(lot), lot.StorageLocation, lot.CustomLocation, lot.PackageState, lot.PrintedExpirationDate, lot.Notes, lot.Version, lot.CreatedAt, lot.UpdatedAt);
    private static QuantityResponse ToQuantity(LotRecord lot) => new(lot.MeasuredValue, lot.MeasuredUnit, lot.AvailabilityState);
    private static IResult WithEtag(LotResponse response, long version, int status = 200) => new EtagResult<LotResponse>(response, Etag(version), status);
    private static string Etag(long version) => $"\"{version}\"";
    private static bool TryVersion(HttpRequest request, out long version) => long.TryParse(request.Headers.IfMatch.ToString().Trim('"'), out version);
    private static bool TryIdempotencyKey(HttpRequest request, out Guid key) => Guid.TryParse(request.Headers["Idempotency-Key"], out key);
    private static bool ValidateStorage(string location, string? custom) => !string.IsNullOrWhiteSpace(location) && (location == "Custom" ? !string.IsNullOrWhiteSpace(custom) && custom.Length <= 80 : string.IsNullOrWhiteSpace(custom));
    private static bool ValidateQuantity(QuantityRequest quantity, out string? error) { var measured = quantity.MeasuredValue is > 0m && quantity.Unit is not null && quantity.AvailabilityState is null; var available = quantity.MeasuredValue is null && quantity.Unit is null && quantity.AvailabilityState is "Available" or "Low" or "Unavailable"; error = measured || available ? null : "Quantity must be either a positive measured value with a canonical unit or an availability state."; return error is null; }
    private static string Hash<T>(T value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value))));
    private static IResult Problem(int status, string code, string detail) => Results.Problem(detail: detail, statusCode: status, extensions: new Dictionary<string, object?> { ["errorCode"] = code });

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
