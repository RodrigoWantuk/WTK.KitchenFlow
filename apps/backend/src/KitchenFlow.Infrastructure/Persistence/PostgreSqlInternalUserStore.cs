using KitchenFlow.Modules.Identity;
using Microsoft.EntityFrameworkCore;

namespace KitchenFlow.Infrastructure.Persistence;

/// <summary>
/// PostgreSQL implementation of internal identity resolution. The unique issuer-and-subject index
/// is the final authority when concurrent authenticated requests create a mapping simultaneously.
/// </summary>
public sealed class PostgreSqlInternalUserStore(ApplicationDbContext database) : IInternalUserStore
{
    /// <inheritdoc />
    public async Task<InternalUser> FindOrCreateAsync(OidcSubject subject, DateTimeOffset occurredAt, CancellationToken cancellationToken)
    {
        var existing = await database.Users.SingleOrDefaultAsync(
            user => user.Issuer == subject.Issuer && user.Subject == subject.Subject,
            cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = new InternalUser(Guid.NewGuid(), subject.Issuer, subject.Subject, occurredAt);
        database.Users.Add(created);
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return created;
        }
        catch (DbUpdateException)
        {
            database.Entry(created).State = EntityState.Detached;
            return await database.Users.SingleAsync(
                user => user.Issuer == subject.Issuer && user.Subject == subject.Subject,
                cancellationToken);
        }
    }
}
