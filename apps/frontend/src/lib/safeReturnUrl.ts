/** Default post-login destination: authenticated contextual home. */
export const DEFAULT_SAFE_RETURN_URL = "/app/hoje";

/**
 * Accepts only same-origin relative return paths for BFF login challenges.
 */
export function normalizeSafeReturnUrl(returnUrl?: string | null): string {
  if (!returnUrl || typeof returnUrl !== "string") {
    return DEFAULT_SAFE_RETURN_URL;
  }
  const trimmed = returnUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_SAFE_RETURN_URL;
  }
  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return DEFAULT_SAFE_RETURN_URL;
  }
  return trimmed;
}
