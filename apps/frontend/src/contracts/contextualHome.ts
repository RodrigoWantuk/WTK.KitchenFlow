/**
 * Stable presentation models for the public entry and contextual home.
 * Independent of future live OpenAPI DTOs (PLAN-0021).
 *
 * These models are presentation-only projections. React must not calculate
 * inventory sufficiency, reservations, food safety, or mutate authoritative state.
 */

/** Ordered suggestion-source tiers. Higher tiers must render before lower ones. */
export const HOME_SOURCE_TIERS = [
  "menu",
  "inventory",
  "profile",
  "quickChooser",
] as const;

export type HomeSourceTier = (typeof HOME_SOURCE_TIERS)[number];

/**
 * Per-source load status. Failures are independent — one failed tier must not
 * erase successful results from other tiers.
 */
export type HomeSourceStatus =
  | "ready"
  | "empty"
  | "unavailable"
  | "failed"
  | "stale"
  | "incomplete";

/** Daypart used only for greeting/relevance wording — never mutates inventory. */
export type HomeDayPart =
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | "neutral";

/**
 * Timezone resolution outcome for meal context.
 * `override` is request-scoped UI review only — it must not mutate the profile.
 */
export type HomeTimeZoneSource =
  | "profile"
  | "browser"
  | "override"
  | "unavailable"
  | "invalid";

/** Shopping requirement projection (presentation codes only). */
export type HomeShoppingState =
  | "not_required"
  | "optional"
  | "required"
  | "unknown";

/**
 * Display text for presentation fields that may be catalog-backed (prototype
 * fixtures) or literal (future live recipe/product names from PLAN-0021).
 *
 * Literal values must be rendered as plain text (never HTML) and must never be
 * passed through localization-key lookup. Telemetry must never receive literal
 * recipe or product text.
 */
export type HomeDisplayText =
  | {
      kind: "catalog";
      /** Localization catalog key. */
      key: string;
    }
  | {
      kind: "literal";
      /** Plain text value — React-escaped by the renderer; never HTML. */
      value: string;
    };

/** Convenience constructor for catalog-backed display text. */
export function homeCatalogText(key: string): HomeDisplayText {
  return { kind: "catalog", key };
}

/** Convenience constructor for literal display text. */
export function homeLiteralText(value: string): HomeDisplayText {
  return { kind: "literal", value };
}

/**
 * Product/requirement projection for display.
 * Labels may be catalog keys (fixtures) or literal product names (live adapters).
 */
export interface HomeRequirementProjection {
  /** Stable synthetic code (not a live inventory lot id). */
  code: string;
  kind: "required" | "optional";
  /** Privacy-safe presentation label (catalog or literal). */
  label: HomeDisplayText;
}

/**
 * Advance-preparation projection (thaw, prep ahead). Presentation only —
 * React must not schedule inventory mutations.
 */
export interface HomePreparationProjection {
  code: string;
  kind: "thaw" | "advance" | "other";
  /** Privacy-safe preparation label (catalog or literal). */
  label: HomeDisplayText;
  /** Advisory lead time in hours when known; never authoritative. */
  leadTimeHours?: number | null;
}

/**
 * Optional non-authoritative subject identity for future live adapters.
 * Formats are presentation-level only — do not invent backend identifier contracts.
 */
export interface HomeSuggestionSubject {
  kind: "recipe" | "preparation";
  id: string;
  revision?: string | null;
}

/**
 * Suggestion candidate shown in the home.
 * Stable reason/effort/cleanup/readiness/uncertainty/conflict/source codes remain
 * catalog-driven. Titles and dynamic labels use {@link HomeDisplayText}.
 */
export interface HomeSuggestionCandidate {
  /** Stable synthetic identifier (not a live recipe UUID contract). */
  id: string;
  /** Candidate title — catalog for fixtures; literal for live recipe names. */
  title: HomeDisplayText;
  /** Source tier for deterministic ordering and labels. */
  sourceTier: HomeSourceTier;
  /** Localization key for the human-readable source label. */
  sourceLabelKey: string;
  /** Stable reason codes mapped to localized explanation copy. */
  reasonCodes: readonly string[];
  /** Presentation timing estimates — never authoritative cooking timers. */
  timing?: {
    activeMinutes?: number | null;
    totalMinutes?: number | null;
  };
  /** Effort code (`low` | `medium` | `high`) for localized labels. */
  effortCode?: string | null;
  /** Cleanup expectation code (`low` | `medium` | `high`). */
  cleanupCode?: string | null;
  /** Readiness code (`ready_now` | `needs_prep` | `needs_thaw` | `blocked`). */
  readinessCode?: string | null;
  availableRequirements?: readonly HomeRequirementProjection[];
  missingRequirements?: readonly HomeRequirementProjection[];
  preparationRequirements?: readonly HomePreparationProjection[];
  shoppingState?: HomeShoppingState;
  uncertaintyCodes?: readonly string[];
  conflictCodes?: readonly string[];
  /** Whether inventory attention influenced this candidate (advisory). */
  attentionInfluenced?: boolean;
  /** Freshness marker; stale items must not appear as current. */
  freshness?: "current" | "stale";
  /** Optional non-authoritative subject identity for PLAN-0021 consumers. */
  subject?: HomeSuggestionSubject;
}

/**
 * Independent source projection. One failed/empty tier must not blank siblings.
 *
 * `retryable` distinguishes transient failures (Retry allowed) from permanent
 * capability gaps such as production unavailable-until-PLAN-0021.
 */
export interface HomeSourceResult {
  tier: HomeSourceTier;
  status: HomeSourceStatus;
  /**
   * When true, the UI may offer Retry for a recoverable transient failure.
   * Permanent unavailable / empty / incomplete must set false.
   */
  retryable: boolean;
  /** Localization key explaining empty/unavailable/failed/incomplete states. */
  statusReasonKey?: string;
  items: HomeSuggestionCandidate[];
}

/** Quick-chooser option with stable id and localized label key. */
export interface HomeQuickChooserOption {
  id: string;
  /** Localization key for the option label. */
  labelKey: string;
}

/**
 * Option set for a chooser question. Runtime validation requires at least two
 * options; the type permits additional options after the required pair.
 */
export type HomeQuickChooserOptions = readonly [
  HomeQuickChooserOption,
  HomeQuickChooserOption,
  ...HomeQuickChooserOption[],
];

/** Quick-chooser question with localized prompt and option set. */
export interface HomeQuickChooserQuestion {
  id: string;
  /** Localization key for the question prompt. */
  promptKey: string;
  options: HomeQuickChooserOptions;
}

/**
 * Exactly one or two questions — the accepted quick-chooser depth.
 * TypeScript construction cannot express zero or three+ questions here.
 */
export type HomeQuickChooserQuestions =
  | readonly [HomeQuickChooserQuestion]
  | readonly [HomeQuickChooserQuestion, HomeQuickChooserQuestion];

/**
 * Quick-chooser capability outcome.
 * Distinguishes permanent absence from a transient definition-load failure.
 */
export type HomeQuickChooserCapabilityStatus =
  | "available"
  | "temporarily_unavailable"
  | "not_implemented";

/**
 * Discriminated quick-chooser definition.
 * Answers remain request-scoped and must not mutate profile/menu/inventory.
 *
 * Impossible under ordinary TypeScript construction:
 * - available with zero or more than two questions;
 * - unavailable variants carrying questions;
 * - temporary unavailable with `retryable: false`;
 * - not implemented with `retryable: true`.
 */
export type HomeQuickChooserDefinition =
  | {
      capabilityStatus: "available";
      questions: HomeQuickChooserQuestions;
    }
  | {
      capabilityStatus: "temporarily_unavailable";
      retryable: true;
      statusReasonKey: string;
      questions: readonly [];
    }
  | {
      capabilityStatus: "not_implemented";
      retryable: false;
      statusReasonKey?: string;
      questions: readonly [];
    };

/**
 * Greeting presentation model derived from safe session fields + injected clock.
 * Never infers mood, health, family, or gender.
 */
export interface HomeGreetingModel {
  displayName: string | null;
  dayPart: HomeDayPart;
  timeZone: string | null;
  timeZoneSource: HomeTimeZoneSource;
  /** Local clock minutes since midnight when timezone is usable; otherwise null. */
  localMinutesSinceMidnight: number | null;
}

/**
 * Query inputs for source adapters. Adapters must not persist answers.
 * Optional AbortSignal lets callers cancel in-flight loads when context changes.
 */
export interface ContextualHomeQuery {
  locale: string;
  timeZone: string | null;
  now: Date;
  /** Request-scoped quick-chooser answers keyed by question id. */
  quickChooserAnswers?: Readonly<Record<string, string>>;
  /** Optional abort signal for stale-context cancellation. */
  signal?: AbortSignal;
}

/**
 * Adapter boundary for contextual-home sources.
 * Production wires an unavailable implementation until PLAN-0021.
 * Prototype/test may wire synthetic mocks — never silently in production.
 */
export interface ContextualHomeAdapter {
  loadMenuSource(query: ContextualHomeQuery): Promise<HomeSourceResult>;
  loadInventorySource(query: ContextualHomeQuery): Promise<HomeSourceResult>;
  loadProfileSource(query: ContextualHomeQuery): Promise<HomeSourceResult>;
  getQuickChooserDefinition(
    query: ContextualHomeQuery,
  ): Promise<HomeQuickChooserDefinition>;
  /**
   * Optional post-chooser suggestions. Must not mutate authoritative state.
   * When recommendation capability is unavailable, return an unavailable result.
   */
  loadQuickChooserSuggestions(
    query: ContextualHomeQuery,
  ): Promise<HomeSourceResult>;
}

/** Privacy-safe telemetry event names (codes only; no private payloads). */
export type HomeTelemetryEventName =
  | "public_entry_viewed"
  | "login_cta_selected"
  | "source_rendered"
  | "source_unavailable"
  | "quick_chooser_started"
  | "quick_chooser_cancelled"
  | "quick_chooser_completed";

/**
 * Privacy-safe telemetry event. Codes must never include pantry contents,
 * restrictions, recipe text, chooser answers, display name, cookies, or tokens.
 */
export interface HomeTelemetryEvent {
  name: HomeTelemetryEventName;
  /** Stable non-private codes only (tier, reason, locale code, etc.). */
  codes?: Readonly<Record<string, string>>;
}

/**
 * Injected telemetry boundary. A no-op implementation is acceptable for Phase 2.
 */
export interface HomeTelemetry {
  track(event: HomeTelemetryEvent): void;
}

/** Helper: map tier to the localization key for its source label. */
export function homeSourceLabelKey(tier: HomeSourceTier): string {
  return `home.source.label.${tier}`;
}
