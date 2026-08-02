/**
 * Accepts only same-origin relative return paths for BFF login challenges.
 */
export function normalizeSafeReturnUrl(returnUrl?: string | null): string {
  if (!returnUrl || typeof returnUrl !== "string") {
    return "/app/despensa";
  }
  const trimmed = returnUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/app/despensa";
  }
  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return "/app/despensa";
  }
  return trimmed;
}
