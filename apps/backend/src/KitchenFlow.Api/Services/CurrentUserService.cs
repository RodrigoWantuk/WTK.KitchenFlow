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
        var subjectClaim = principal.FindFirst("sub") ?? principal.FindFirst(ClaimTypes.NameIdentifier);
        var subject = subjectClaim?.Value;
        var issuer = principal.FindFirstValue("iss") ?? principal.Claims.Select(claim => claim.Issuer).FirstOrDefault(claimIssuer => !string.IsNullOrWhiteSpace(claimIssuer) && claimIssuer != ClaimsIdentity.DefaultIssuer);
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
