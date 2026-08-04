import { useEffect, useRef } from "react";
import type { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";
import type { NumericFieldLimits } from "./ProgressiveFieldControl";

type Translate = ReturnType<typeof useProductionI18n>["t"];

/** One resolved field-level error ready to render in a form and in its section's error summary. */
export interface FieldErrorItem {
  /** Matches the `id` passed to `ProgressiveFieldControl`/`ControlledFieldControl` (used to focus the control from the summary). */
  id: string;
  label: string;
  message: string;
}

/** Renders the message for a failed {@link validateNumberFieldMutation} result. */
export function numericErrorMessage(
  errorKey: "empty" | "invalid" | "outOfRange",
  limits: NumericFieldLimits | undefined,
  t: Translate,
): string {
  if (errorKey === "outOfRange" && limits) {
    return t("profile.error.numeric.outOfRange")
      .replace("{min}", String(limits.min))
      .replace("{max}", String(limits.max));
  }
  return t(`profile.error.numeric.${errorKey}`);
}

/**
 * Splits a backend `ProfileApiError.fieldErrors` map into entries this section
 * recognizes (a field currently rendered on this page, keyed by the exact backend
 * field path) and a count of entries that could not be matched to a rendered
 * field — those are never silently dropped, only summarized as "additional
 * problems" so the user is not left wondering why a save still failed with no
 * visible reason.
 */
export function splitKnownFieldErrors(
  fieldErrors: Record<string, string[]> | undefined,
  knownFieldIds: readonly string[],
): { known: Record<string, string>; unknownCount: number } {
  const known: Record<string, string> = {};
  let unknownCount = 0;
  if (!fieldErrors) return { known, unknownCount };
  const knownSet = new Set(knownFieldIds);
  for (const [path, messages] of Object.entries(fieldErrors)) {
    const message = messages[0];
    if (!message) continue;
    if (knownSet.has(path)) {
      known[path] = message;
    } else {
      unknownCount += 1;
    }
  }
  return { known, unknownCount };
}

/**
 * Section-scoped error summary: lists every currently invalid field (local
 * validation failures and/or mapped backend `fieldErrors`) with a control that
 * moves focus to it, plus a generic notice when the backend reported errors this
 * page could not match to a rendered field. Rendered above the fields it
 * summarizes so it is announced before them in reading and tab order.
 */
export function FieldErrorSummary({
  items,
  unknownCount,
  t,
  testId,
}: {
  items: FieldErrorItem[];
  unknownCount: number;
  t: Translate;
  testId: string;
}) {
  if (items.length === 0 && unknownCount === 0) return null;
  return (
    <div
      role="alert"
      data-testid={testId}
      className="space-y-2 rounded-lg border border-destructive p-3 text-sm"
    >
      <p className="font-medium">{t("profile.error.fieldSummaryTitle")}</p>
      {items.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                data-testid={`${testId}-jump-${item.id}`}
                className="underline underline-offset-2"
                onClick={() => {
                  const el = document.getElementById(item.id);
                  if (el instanceof HTMLElement) el.focus();
                }}
              >
                {t("profile.error.fieldJumpTo")}: {item.label}
              </button>
              {": "}
              {item.message}
            </li>
          ))}
        </ul>
      )}
      {unknownCount > 0 && (
        <p data-testid={`${testId}-unknown`}>
          {t("profile.error.fieldSummaryUnknown")}
        </p>
      )}
    </div>
  );
}

/** Focuses the first field listed in `items`, once, whenever the set of invalid field ids changes to a non-empty set. */
export function useFocusFirstFieldError(items: FieldErrorItem[]) {
  const key = items.map((item) => item.id).join(",");
  const focusedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (items.length === 0 || focusedForRef.current === key) return;
    focusedForRef.current = key;
    const first = items[0];
    const el = document.getElementById(first.id);
    if (el instanceof HTMLElement) el.focus();
    // Only the id set matters for re-triggering focus; `items` itself is a new
    // array reference every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
