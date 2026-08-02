/**
 * Stable presentation models for the public entry and contextual home.
 * Independent of future live OpenAPI DTOs (PLAN-0021).
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

/** Timezone resolution outcome for meal context. */
export type HomeTimeZoneSource =
  | "profile"
  | "browser"
  | "unavailable"
  | "invalid";

/**
 * Suggestion candidate shown in the home. Titles and reasons are localization
 * keys or stable codes — never raw private inventory/profile payloads.
 */
export interface HomeSuggestionCandidate {
  /** Stable synthetic identifier (not a live recipe UUID contract). */
  id: string;
  /** Localization key for the candidate title. */
  titleKey: string;
  /** Localization key for the human-readable source label. */
  sourceLabelKey: string;
  /** Stable reason code mapped to localized explanation copy. */
  reasonCode: string;
  /** Optional estimated total minutes for presentation only. */
  estimatedTotalMinutes?: number | null;
  /** Optional effort code (`low` | `medium` | `high`) for localized labels. */
  effortCode?: string | null;
  /** Whether inventory attention influenced this candidate (advisory). */
  attentionInfluenced?: boolean;
  /** Freshness marker; stale items must not appear as current. */
  freshness?: "current" | "stale";
}

export interface HomeSourceResult {
  tier: HomeSourceTier;
  status: HomeSourceStatus;
  /** Localization key explaining empty/unavailable/failed/incomplete states. */
  statusReasonKey?: string;
  items: HomeSuggestionCandidate[];
}

export interface HomeQuickChooserOption {
  id: string;
  /** Localization key for the option label. */
  labelKey: string;
}

export interface HomeQuickChooserQuestion {
  id: string;
  /** Localization key for the question prompt. */
  promptKey: string;
  options: HomeQuickChooserOption[];
}

/**
 * Quick-chooser definition. Answers remain request-scoped in the UI and must
 * not mutate profile, menu, inventory, or shopping.
 */
export interface HomeQuickChooserDefinition {
  /** Capability for recommendation/AI-backed narrowing. */
  recommendationCapability: "available" | "unavailable";
  questions: HomeQuickChooserQuestion[];
}

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
 */
export interface ContextualHomeQuery {
  locale: string;
  timeZone: string | null;
  now: Date;
  /** Request-scoped quick-chooser answers keyed by question id. */
  quickChooserAnswers?: Readonly<Record<string, string>>;
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

export interface HomeTelemetryEvent {
  name: HomeTelemetryEventName;
  /** Stable non-private codes only (tier, reason, locale code, etc.). */
  codes?: Readonly<Record<string, string>>;
}

export interface HomeTelemetry {
  track(event: HomeTelemetryEvent): void;
}
