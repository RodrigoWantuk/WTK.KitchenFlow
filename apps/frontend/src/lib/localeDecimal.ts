/**
 * Locale-aware decimal parsing for inventory quantity entry.
 * Does not use `Number(localizedString)` / accidental browser parsing.
 */

export type SupportedDecimalLocale = "en" | "pt-BR" | "es";

export interface ParseDecimalResult {
  ok: true;
  value: number;
  /** Canonical JSON-safe decimal string using `.` as separator. */
  canonical: string;
}

export interface ParseDecimalFailure {
  ok: false;
  reason: "empty" | "invalid" | "unsupported_locale";
}

/**
 * Parses a user-entered decimal for the supported production locales.
 *
 * - `en`: `.` decimal separator; `,` thousands optional
 * - `pt-BR` / `es`: `,` decimal separator; `.` thousands optional
 */
export function parseLocaleDecimal(
  input: string,
  locale: SupportedDecimalLocale,
): ParseDecimalResult | ParseDecimalFailure {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }
  if (!["en", "pt-BR", "es"].includes(locale)) {
    return { ok: false, reason: "unsupported_locale" };
  }

  let normalized = trimmed.replace(/\s/g, "");
  if (locale === "en") {
    if (!/^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+(\.\d+)?$/.test(normalized)) {
      return { ok: false, reason: "invalid" };
    }
    normalized = normalized.replace(/,/g, "");
  } else {
    // pt-BR / es: allow 1.234,56 or 1234,56 or 1234
    if (!/^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+(,\d+)?$/.test(normalized)) {
      return { ok: false, reason: "invalid" };
    }
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return { ok: false, reason: "invalid" };
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, value, canonical: normalized };
}

/**
 * Formats a measured quantity for display in the given locale.
 */
export function formatLocaleDecimal(
  value: number,
  locale: SupportedDecimalLocale,
  maximumFractionDigits = 3,
): string {
  return new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits,
  }).format(value);
}
