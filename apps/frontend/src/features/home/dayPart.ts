import type {
  HomeDayPart,
  HomeGreetingModel,
  HomeTimeZoneSource,
} from "@/contracts/contextualHome";

/**
 * Resolves the IANA timezone for meal context.
 * Priority: request-scoped override → saved profile → browser → neutral/invalid.
 * Never uses the server timezone as the user's meal context.
 */
export function resolveHomeTimeZone(options: {
  overrideTimeZone?: string | null;
  profileTimeZone?: string | null;
  browserTimeZone?: string | null;
}): {
  timeZone: string | null;
  source: HomeTimeZoneSource;
} {
  const override = normalizeIanaTimeZone(options.overrideTimeZone);
  if (override.ok) {
    return { timeZone: override.timeZone, source: "override" };
  }

  const profile = normalizeIanaTimeZone(options.profileTimeZone);
  if (profile.ok) {
    return { timeZone: profile.timeZone, source: "profile" };
  }
  if (profile.invalid) {
    // Invalid saved timezone falls through to browser before neutral fallback.
  }
  const browser = normalizeIanaTimeZone(options.browserTimeZone);
  if (browser.ok) {
    return { timeZone: browser.timeZone, source: "browser" };
  }
  if (override.invalid || profile.invalid || browser.invalid) {
    return { timeZone: null, source: "invalid" };
  }
  return { timeZone: null, source: "unavailable" };
}

function normalizeIanaTimeZone(value?: string | null): {
  ok: boolean;
  invalid: boolean;
  timeZone: string | null;
} {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return { ok: false, invalid: false, timeZone: null };
  }
  try {
    // Throws RangeError for unknown zone identifiers.
    Intl.DateTimeFormat(undefined, { timeZone: trimmed }).format(new Date());
    return { ok: true, invalid: false, timeZone: trimmed };
  } catch {
    return { ok: false, invalid: true, timeZone: null };
  }
}

/**
 * Daypart boundaries (local clock). Intentionally simple defaults for Phase 2;
 * locale-specific schedules may refine later without mutating inventory.
 *
 * Boundaries (inclusive start, exclusive end):
 * - morning: 05:00–12:00
 * - afternoon: 12:00–17:00
 * - evening: 17:00–21:00
 * - night: otherwise (including near midnight)
 */
export function resolveDayPart(localMinutes: number | null): HomeDayPart {
  if (localMinutes == null || Number.isNaN(localMinutes)) {
    return "neutral";
  }
  if (localMinutes >= 5 * 60 && localMinutes < 12 * 60) return "morning";
  if (localMinutes >= 12 * 60 && localMinutes < 17 * 60) return "afternoon";
  if (localMinutes >= 17 * 60 && localMinutes < 21 * 60) return "evening";
  return "night";
}

/**
 * Computes local minutes since midnight in the given IANA timezone.
 */
export function localMinutesSinceMidnight(
  now: Date,
  timeZone: string | null,
): number | null {
  if (!timeZone) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === "hour")?.value);
    const minute = Number(parts.find((p) => p.type === "minute")?.value);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return hour * 60 + minute;
  } catch {
    return null;
  }
}

/**
 * Builds the greeting presentation model from session + clock inputs.
 * `overrideTimeZone` is request-scoped review only and must not persist.
 */
export function buildHomeGreeting(options: {
  displayName?: string | null;
  overrideTimeZone?: string | null;
  profileTimeZone?: string | null;
  browserTimeZone?: string | null;
  now?: Date;
}): HomeGreetingModel {
  const now = options.now ?? new Date();
  const resolved = resolveHomeTimeZone({
    overrideTimeZone: options.overrideTimeZone,
    profileTimeZone: options.profileTimeZone,
    browserTimeZone: options.browserTimeZone,
  });
  const minutes = localMinutesSinceMidnight(now, resolved.timeZone);
  const name = String(options.displayName ?? "").trim();
  return {
    displayName: name.length > 0 ? name : null,
    dayPart: resolveDayPart(minutes),
    timeZone: resolved.timeZone,
    timeZoneSource: resolved.source,
    localMinutesSinceMidnight: minutes,
  };
}

/** Best-effort browser IANA timezone; may be unavailable in some environments. */
export function readBrowserTimeZone(
  intl: Pick<typeof Intl, "DateTimeFormat"> = Intl,
): string | null {
  try {
    const tz = intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && tz.trim() ? tz : null;
  } catch {
    return null;
  }
}
