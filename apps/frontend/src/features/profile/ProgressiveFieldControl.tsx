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
 * Submission and PATCH-building are owned by the enclosing section form.
 */
export function ProgressiveFieldControl({
  id,
  label,
  field,
  mode,
  onModeChange,
  numeric = false,
  disabled = false,
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
  t: Translate;
  testIdPrefix: string;
}) {
  const inputValue = resolveInputValue(field, mode);
  const statusLabel = resolveStatusLabel(field, mode, t);
  const showUseDefault =
    field.presence === "default" &&
    mode.kind === "unchanged" &&
    field.defaultValue != null;

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
 * Converts a field mode into a `ProfileFieldMutation<number>`, or `undefined` when
 * unchanged. Non-numeric input is coerced to `0` rather than silently dropped —
 * the backend performs the authoritative range validation and surfaces
 * `validation_failed` with field errors when out of range.
 */
export function toNumberFieldMutation(
  mode: FieldMode,
): ProfileFieldMutation<number> | undefined {
  if (mode.kind === "unchanged") return undefined;
  if (mode.kind === "remove") return { action: "remove" };
  const parsed = Number(mode.value.trim());
  return { action: "confirm", value: Number.isFinite(parsed) ? parsed : 0 };
}
