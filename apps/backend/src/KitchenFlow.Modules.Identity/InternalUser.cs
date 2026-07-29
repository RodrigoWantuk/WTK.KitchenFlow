namespace KitchenFlow.Modules.Identity;

public sealed class InternalUser
{
    public InternalUser(Guid id, string issuer, string subject, DateTimeOffset createdAt)
    {
        Id = id;
        Issuer = issuer;
        Subject = subject;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }

    public string Issuer { get; private set; }

    public string Subject { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
}
