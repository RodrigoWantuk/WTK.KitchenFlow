namespace KitchenFlow.Api.Services;

/// <summary>
/// Returns the KitchenFlow internal user identifier and request-specific CSRF token for a backend-managed browser session.
/// OIDC access and refresh tokens are intentionally never present in this response.
/// </summary>
public sealed record SessionResponse(Guid UserId, string CsrfToken, IReadOnlyList<string> SupportedLocales);
