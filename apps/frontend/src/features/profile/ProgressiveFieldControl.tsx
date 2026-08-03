import type {
  ProfileFieldMutation,
  ProgressiveProfileField,
} from "@/contracts/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";

/**
 * Local editing intent for one progressive field, distinct from the server-confirmed
 * `presence`. `unchanged` means the field is omitted from the next PATCH (leave
 * untouched); `confirm`/`remove` become explicit `ProfileFieldMutation` actions only
 * when the enclosing section is saved.
 */
export type FieldMode =
  | { kind: "unchanged" }
  | { kind: "confirm"; value: string }
  | { kind: "remove" };

export const UNCHANGED_FIELD_MODE: FieldMode = { kind: "unchanged" };

type Translate = ReturnType<typeof useProductionI18n>["t"];

/** Inclusive backend range for one numeric field; see `ValidateCountField` in `ProfileApplicationWorkflow.cs`. */
export interface NumericFieldLimits {
  min: number;
  max: number;
}

/** Backend-authoritative inclusive bounds for every numeric household/cooking field. */
export const NUMERIC_FIELD_LIMITS: Record<string, NumericFieldLimits> = {
  defaultAdultCount: { min: 1, max: 20 },
  defaultChildCount: { min: 0, max: 20 },
  defaultServingCount: { min: 1, max: 30 },
  ordinaryPrepMinutes: { min: 5, max: 600 },
  exceptionalPrepMinutes: { min: 5, max: 1440 },
};

/** Resolves the text shown in the input for the current mode and server field. */
function resolveInputValue(
  field: ProgressiveProfileField<string | number>,
  mode: FieldMode,
): string {
  if (mode.kind === "confirm") return mode.value;
  if (mode.kind === "remove") return "";
  if (field.value != null) return String(field.value);
  if (field.presence === "default" && field.defaultValue != null) {
    return String(field.defaultValue);
  }
  return "";
}

function resolveStatusLabel(
  field: ProgressiveProfileField<string | number>,
  mode: FieldMode,
  t: Translate,
): string {
  if (mode.kind === "confirm") return t("profile.data.pendingConfirm");
  if (mode.kind === "remove") return t("profile.data.pendingRemoval");
  return t(`profile.data.presence.${field.presence}`);
}

/**
 * Editor for one progressive profile field (household or cooking context). Exposes
 * the three baseline actions — leave unchanged (default), confirm a new value, or
 * remove — plus a one-click "use this default" action while `presence` is `default`.
 * Submission and PATCH-building are owned by the enclosing section form, which is
 * also responsible for running {@link validateNumberFieldMutation} before submit and
 * passing the result back in as `errorMessage`.
 */
export function ProgressiveFieldControl({
  id,
  label,
  field,
  mode,
  onModeChange,
  numeric = false,
  disabled = false,
  errorMessage,
  t,
  testIdPrefix,
}: {
  id: string;
  label: string;
  field: ProgressiveProfileField<string | number>;
  mode: FieldMode;
  onModeChange: (mode: FieldMode) => void;
  numeric?: boolean;
  disabled?: boolean;
  /** Field-level validation message (local or mapped from a backend `fieldErrors` path); wired to `aria-invalid`/`aria-describedby`. */
  errorMessage?: string | null;
  t: Translate;
  testIdPrefix: string;
}) {
  const inputValue = resolveInputValue(field, mode);
  const statusLabel = resolveStatusLabel(field, mode, t);
  const showUseDefault =
    field.presence === "default" &&
    mode.kind === "unchanged" &&
    field.defaultValue != null;
  const errorId = `${testIdPrefix}-error-${id}`;

  return (
    <div
      className="space-y-2 rounded-lg border border-border p-3"
      data-testid={`${testIdPrefix}-field-${id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={`${testIdPrefix}-input-${id}`}
          className="text-sm font-medium"
        >
          {label}
        </label>
        <span
          className="text-xs text-muted-foreground"
          data-testid={`${testIdPrefix}-status-${id}`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={`${testIdPrefix}-input-${id}`}
          data-testid={`${testIdPrefix}-input-${id}`}
          type={numeric ? "number" : "text"}
          value={inputValue}
          disabled={disabled || mode.kind === "remove"}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? errorId : undefined}
          onChange={(event) =>
            onModeChange({ kind: "confirm", value: event.target.value })
          }
          className="max-w-xs"
        />
        {showUseDefault && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            data-testid={`${testIdPrefix}-use-default-${id}`}
            onClick={() =>
              onModeChange({
                kind: "confirm",
                value: String(field.defaultValue),
              })
            }
          >
            {t("profile.actions.useDefault")}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || mode.kind === "remove"}
          data-testid={`${testIdPrefix}-remove-${id}`}
          onClick={() => onModeChange({ kind: "remove" })}
        >
          {t("profile.actions.remove")}
        </Button>
        {mode.kind !== "unchanged" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            data-testid={`${testIdPrefix}-undo-${id}`}
            onClick={() => onModeChange(UNCHANGED_FIELD_MODE)}
          >
            {t("profile.actions.cancel")}
          </Button>
        )}
      </div>
      {errorMessage && (
        <p
          role="alert"
          id={errorId}
          data-testid={errorId}
          className="text-xs text-destructive"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/** Converts a field mode into a `ProfileFieldMutation<string>`, or `undefined` when unchanged. */
export function toStringFieldMutation(
  mode: FieldMode,
): ProfileFieldMutation<string> | undefined {
  if (mode.kind === "unchanged") return undefined;
  if (mode.kind === "remove") return { action: "remove" };
  return { action: "confirm", value: mode.value.trim() };
}

/**
 * Result of validating one numeric field mode against the backend's authoritative
 * range (see {@link NUMERIC_FIELD_LIMITS}). `ok: false` never reaches
 * `ProfileFieldMutation` — the caller must surface `errorKey` as a local field error
 * and refuse to submit the enclosing section, rather than silently coercing an
 * empty or invalid value to `0` and letting the backend reject it after the fact.
 */
export type NumberFieldValidation =
  | { ok: true; mutation: ProfileFieldMutation<number> | undefined }
  | { ok: false; errorKey: "empty" | "invalid" | "outOfRange" };

/**
 * Validates a field mode into a `ProfileFieldMutation<number>`. Unlike the previous
 * behavior, empty or non-numeric input is never silently coerced to `0`: it is
 * reported back as a local validation failure so the section save is blocked and
 * the field shows an inline error instead of sending a value the user never typed.
 */
export function validateNumberFieldMutation(
  mode: FieldMode,
  limits?: NumericFieldLimits,
): NumberFieldValidation {
  if (mode.kind === "unchanged") return { ok: true, mutation: undefined };
  if (mode.kind === "remove") {
    return { ok: true, mutation: { action: "remove" } };
  }
  const trimmed = mode.value.trim();
  if (trimmed === "") {
    return { ok: false, errorKey: "empty" };
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { ok: false, errorKey: "invalid" };
  }
  if (limits && (parsed < limits.min || parsed > limits.max)) {
    return { ok: false, errorKey: "outOfRange" };
  }
  return { ok: true, mutation: { action: "confirm", value: parsed } };
}
