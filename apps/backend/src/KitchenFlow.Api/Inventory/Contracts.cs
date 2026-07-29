namespace KitchenFlow.Api.Inventory;

public sealed record QuantityRequest(decimal? MeasuredValue, string? Unit, string? AvailabilityState);
public sealed record CreateLotRequest(string ProductName, QuantityRequest Quantity, string StorageLocation, string? CustomLocation, string? PackageState, DateOnly? PrintedExpirationDate, string? Notes);
public sealed record UpdateLotRequest(string StorageLocation, string? CustomLocation, string? PackageState, DateOnly? PrintedExpirationDate, string? Notes);
public sealed record AdjustmentRequest(string Type, decimal? Value, string? AvailabilityState, string? ReasonCode, string? Note);
public sealed record LotResponse(Guid LotId, Guid ProductId, string ProductName, QuantityResponse Quantity, string StorageLocation, string? CustomLocation, string? PackageState, DateOnly? PrintedExpirationDate, string? Notes, long Version, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
public sealed record QuantityResponse(decimal? MeasuredValue, string? Unit, string? AvailabilityState);
public sealed record LotHistoryResponse(Guid TransactionId, string Type, QuantityResponse? PreviousQuantity, QuantityResponse? ResultingQuantity, string? ReasonCode, DateTimeOffset OccurredAt);
public sealed record ListLotsResponse(IReadOnlyList<LotResponse> Items, string? NextCursor);
