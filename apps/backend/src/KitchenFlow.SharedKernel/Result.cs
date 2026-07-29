namespace KitchenFlow.SharedKernel;

public sealed record Error(string Code, string Message)
{
    public static Error Validation(string message) => new("validation_failed", message);

    public static Error Domain(string message) => new("domain_rule_violated", message);

    public static Error NotFound() => new("resource_not_found", "The requested resource was not found.");
}

public sealed class Result<T>
{
    private Result(T? value, Error? error)
    {
        Value = value;
        Error = error;
    }

    public T? Value { get; }

    public Error? Error { get; }

    public bool IsSuccess => Error is null;

    public static Result<T> Success(T value) => new(value, null);

    public static Result<T> Failure(Error error) => new(default, error);
}
