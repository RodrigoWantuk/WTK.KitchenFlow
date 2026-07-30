namespace KitchenFlow.Api.Services;

/// <summary>
/// Validates the non-secret runtime configuration required by the authenticated inventory slice.
/// Readiness intentionally validates local configuration only; it does not make an unbounded OIDC
/// metadata network call that could turn an identity-provider outage into a misleading probe.
/// </summary>
public sealed class RuntimeConfigurationReadiness
{
    private static readonly string[] PlaceholderValues = ["development-only-change-me", "change-me", "placeholder"];

    /// <summary>Creates readiness validation for the active host environment.</summary>
    public RuntimeConfigurationReadiness(bool isDevelopment, string databaseConnection, string? oidcAuthority, string? oidcClientId, string? oidcClientSecret, string? keyRingPath)
    {
        IsDevelopment = isDevelopment;
        IsReady = HasValue(databaseConnection) && HasValue(oidcAuthority) && HasValue(oidcClientId) && (isDevelopment || (HasValue(oidcClientSecret) && HasValue(keyRingPath) && !IsPlaceholder(oidcClientSecret)));
        FailureReason = IsReady ? null : "Required database, OIDC, or data-protection configuration is absent or unsafe for this environment.";
    }

    /// <summary>Gets whether this host is running with the explicitly relaxed development policy.</summary>
    public bool IsDevelopment { get; }

    /// <summary>Gets whether all configuration required for this environment is valid.</summary>
    public bool IsReady { get; }

    /// <summary>Gets a safe configuration failure category without exposing values or secrets.</summary>
    public string? FailureReason { get; }

    /// <summary>Throws a safe startup exception when non-development configuration is incomplete.</summary>
    /// <exception cref="InvalidOperationException">Thrown when production-like configuration is invalid.</exception>
    public void ThrowIfInvalidForNonDevelopment()
    {
        if (!IsDevelopment && !IsReady)
        {
            throw new InvalidOperationException(FailureReason);
        }
    }

    private static bool HasValue(string? value) => !string.IsNullOrWhiteSpace(value);
    private static bool IsPlaceholder(string? value) => PlaceholderValues.Contains(value?.Trim(), StringComparer.OrdinalIgnoreCase);
}
