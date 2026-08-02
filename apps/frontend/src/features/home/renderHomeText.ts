import type { HomeDisplayText } from "@/contracts/contextualHome";

/** Localization function compatible with production i18n. */
export type HomeTranslationFunction = (
  key: string,
  vars?: Readonly<Record<string, string | number>>,
) => string;

/**
 * Resolves a {@link HomeDisplayText} union for UI rendering.
 *
 * - `catalog` → localization lookup (missing keys remain fail-visible per i18n policy);
 * - `literal` → plain text as-is (never HTML, never passed through key lookup).
 *
 * A literal whose value equals an existing catalog key remains literal.
 */
export function renderHomeText(
  text: HomeDisplayText,
  t: HomeTranslationFunction,
): string {
  if (text.kind === "literal") {
    return text.value;
  }
  return t(text.key);
}
