using System.Security.Claims;
using KitchenFlow.Infrastructure.Persistence;
using KitchenFlow.Modules.Identity;
using Microsoft.EntityFrameworkCore;

namespace KitchenFlow.Api.Services;

/// <summary>
/// Resolves an authenticated OIDC issuer and subject into the KitchenFlow-owned internal user
/// mapping. Client payloads never choose this identity.
/// </summary>
public sealed class CurrentUserService(ApplicationDbContext database, TimeProvider timeProvider, IHttpContextAccessor httpContextAccessor) : ICurrentUserAccessor
{
    /// <summary>Gets the current user's internal identity, creating its issuer-subject mapping atomically when needed.</summary>
    /// <param name="cancellationToken">Token that cancels the database operation.</param>
    /// <returns>The internal identity authorized for the current request.</returns>
    /// <exception cref="UnauthorizedAccessException">Thrown when the authenticated principal lacks a stable issuer or subject.</exception>
    public async Task<InternalUser> GetCurrentAsync(CancellationToken cancellationToken)
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

    /// <summary>Gets the current user through the legacy API-facing method while module callers use <see cref="GetCurrentAsync"/>.</summary>
    /// <param name="cancellationToken">Token that cancels identity resolution.</param>
    /// <returns>The internal identity derived from the current authenticated principal.</returns>
    [Obsolete("Use ICurrentUserAccessor.GetCurrentAsync from application use cases.")]
    public Task<InternalUser> GetOrCreateAsync(CancellationToken cancellationToken) => GetCurrentAsync(cancellationToken);
}
