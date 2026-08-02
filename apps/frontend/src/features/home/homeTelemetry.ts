import type {
  HomeTelemetry,
  HomeTelemetryEvent,
} from "@/contracts/contextualHome";

/**
 * Default no-op telemetry. Payloads must never include pantry contents,
 * preferences, allergies, recipe text, chooser answers, cookies, or tokens.
 */
export function createNoOpHomeTelemetry(): HomeTelemetry {
  return {
    track(_event: HomeTelemetryEvent): void {
      // Intentionally empty — privacy-safe boundary until an accepted sink exists.
    },
  };
}
