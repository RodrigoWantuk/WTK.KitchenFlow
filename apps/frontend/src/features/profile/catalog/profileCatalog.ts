/**
 * Localized label resolution for profile catalog codes.
 *
 * Stable codes (see `./profileCatalogCodes`) are never translated in API payloads;
 * this module only resolves a human-readable label at presentation boundaries for the
 * three supported locales (`en`, `pt-BR`, `es`).
 */
import type { PreferenceCategory } from "@/contracts/profile";
import { en } from "./profileCatalog.en";
import { es } from "./profileCatalog.es";
import { ptBR } from "./profileCatalog.pt-BR";

/** Catalog kinds: fixed presentation groupings plus one per preference category. */
export type ProfileCatalogKind =
  | "equipment"
  | "technique"
  | "goal"
  | "abandonmentReason"
  | PreferenceCategory;

/** Supported profile catalog locales, matching the backend `LanguageTag` contract. */
export type ProfileCatalogLocale = "en" | "pt-BR" | "es";

/** One locale's label table, keyed by catalog kind and then stable code. */
export type ProfileCatalogTable = Partial<
  Record<ProfileCatalogKind, Record<string, string>>
>;

const CATALOGS: Record<ProfileCatalogLocale, ProfileCatalogTable> = {
  en,
  "pt-BR": ptBR,
  es,
};

const FALLBACK_LOCALE: ProfileCatalogLocale = "en";

/**
 * Turns an unrecognized or custom stable code into a readable fallback label, for
 * example `custom_...` -> stripped, and `low_fodmap_diet` -> "Low Fodmap Diet".
 * This is a last-resort presentation fallback, not a localization substitute.
 */
function humanizeCode(code: string): string {
  const withoutCustomPrefix = code.replace(
    /^custom_[0-9a-f-]+$/i,
    "custom entry",
  );
  const words = withoutCustomPrefix
    .replace(/^custom_/, "")
    .split(/[_-]+/)
    .filter(Boolean);
  if (words.length === 0) {
    return code;
  }
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Resolves the display label for a stable catalog code. Falls back from the
 * requested locale to `en`, and finally to a humanized rendering of the raw code so
 * unrecognized or user-defined custom codes still present something readable rather
 * than throwing. Unlike the API mappers in `src/adapters/live/profile`, this
 * resolver intentionally never fails closed: it is a presentation convenience, not a
 * contract boundary.
 */
export function resolveLabel(
  locale: ProfileCatalogLocale,
  kind: ProfileCatalogKind,
  code: string,
): string {
  const localized = CATALOGS[locale]?.[kind]?.[code];
  if (localized) {
    return localized;
  }
  const fallback = CATALOGS[FALLBACK_LOCALE]?.[kind]?.[code];
  if (fallback) {
    return fallback;
  }
  return humanizeCode(code);
}
