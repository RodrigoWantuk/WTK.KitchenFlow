namespace KitchenFlow.Api.Inventory;

/// <summary>Represents exactly one inventory quantity mode supplied by an API client.</summary>
public sealed record QuantityRequest(decimal? MeasuredValue, string? Unit, string? AvailabilityState);

/// <summary>Creates one manually entered, user-owned inventory lot.</summary>
public sealed record CreateLotRequest(string ProductName, QuantityRequest Quantity, string StorageLocation, string? CustomLocation, string? PackageState, DateOnly? PrintedExpirationDate, string? Notes);

/// <summary>Corrects mutable lot metadata without accepting any authoritative owner identifier.</summary>
public sealed record UpdateLotRequest(string? ProductName, string StorageLocation, string? CustomLocation, string? PackageState, DateOnly? PrintedExpirationDate, string? Notes);

/// <summary>Records an explicit immutable inventory adjustment.</summary>
public sealed record AdjustmentRequest(string Type, decimal? Value, string? AvailabilityState, string? ReasonCode, string? Note);

/// <summary>Returns the current representation of an inventory lot.</summary>
public sealed record LotResponse(Guid LotId, Guid ProductId, string ProductName, QuantityResponse Quantity, string StorageLocation, string? CustomLocation, string? PackageState, DateOnly? PrintedExpirationDate, string? Notes, string Version, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

/// <summary>Returns a measured or qualitative quantity without mixing the two modes.</summary>
public sealed record QuantityResponse(decimal? MeasuredValue, string? Unit, string? AvailabilityState);

/// <summary>
/// Returns one immutable lifecycle transaction or a safe metadata-correction audit projection.
/// Metadata projections expose only changed field names and never values, notes, tokens, or other
/// private request content.
/// </summary>
public sealed record LotHistoryResponse(Guid EntryId, string Kind, string? Type, QuantityResponse? PreviousQuantity, QuantityResponse? ResultingQuantity, string? ReasonCode, IReadOnlyList<string>? ChangedFields, DateTimeOffset OccurredAt);

/// <summary>Returns a cursor-paginated owner-scoped inventory list.</summary>
public sealed record ListLotsResponse(IReadOnlyList<LotResponse> Items, string? NextCursor);
