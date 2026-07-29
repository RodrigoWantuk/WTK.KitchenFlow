using System.Security.Claims;
using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Identity;
using Microsoft.EntityFrameworkCore;

namespace KitchenFlow.Api.Services;

public sealed class CurrentUserService(ApplicationDbContext database, TimeProvider timeProvider, IHttpContextAccessor httpContextAccessor)
{
    public async Task<InternalUser> GetOrCreateAsync(CancellationToken cancellationToken)
    {
        var principal = httpContextAccessor.HttpContext?.User ?? new ClaimsPrincipal();
        var subject = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
        var issuer = principal.FindFirstValue("iss") ?? principal.Identity?.AuthenticationType;
        if (string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(issuer))
        {
            throw new UnauthorizedAccessException("The authenticated identity is incomplete.");
        }

        var existing = await database.Users.SingleOrDefaultAsync(
            user => user.Issuer == issuer && user.Subject == subject,
            cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = new InternalUser(Guid.NewGuid(), issuer, subject, timeProvider.GetUtcNow());
        database.Users.Add(created);
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return created;
        }
        catch (DbUpdateException)
        {
            return await database.Users.SingleAsync(
                user => user.Issuer == issuer && user.Subject == subject,
                cancellationToken);
        }
    }
}
