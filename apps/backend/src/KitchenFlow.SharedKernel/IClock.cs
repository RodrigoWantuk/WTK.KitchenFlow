namespace KitchenFlow.SharedKernel;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

public sealed class SystemClock(TimeProvider timeProvider) : IClock
{
    public DateTimeOffset UtcNow => timeProvider.GetUtcNow();
}
