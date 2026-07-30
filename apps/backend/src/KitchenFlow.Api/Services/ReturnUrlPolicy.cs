namespace KitchenFlow.Api.Services;

/// <summary>
/// Normalizes post-authentication redirects to local application paths. It rejects absolute,
/// scheme-relative, backslash-prefixed, encoded-host, and malformed values so OIDC challenge and
/// sign-out endpoints cannot become open redirects.
/// </summary>
public static class ReturnUrlPolicy
{
    /// <summary>Gets a safe local redirect target, falling back to the application root.</summary>
    /// <param name="candidate">Untrusted return target supplied by a client.</param>
    /// <returns>A local absolute-path reference suitable for authentication properties.</returns>
    public static string Normalize(string? candidate)
    {
        if (string.IsNullOrWhiteSpace(candidate) || candidate[0] != '/' || candidate.StartsWith("//", StringComparison.Ordinal) || candidate.StartsWith("/\\", StringComparison.Ordinal) || !Uri.IsWellFormedUriString(candidate, UriKind.Relative))
        {
            return "/";
        }

        return candidate;
    }
}
