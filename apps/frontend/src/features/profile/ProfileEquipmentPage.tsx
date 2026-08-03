import { useState } from "react";
import { Link } from "react-router-dom";
import { useProfileWorkspace } from "./ProfileProvider";
import { createCustomStableCode, isCustomStableCode } from "./customCodes";
import { EQUIPMENT_CODES } from "./catalog/profileCatalogCodes";
import { resolveLabel } from "./catalog/profileCatalog";
import { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";
import { ProfileApiError, type EquipmentInput } from "@/contracts/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DraftItem {
  /** Local-only React key; never sent to the backend. */
  key: string;
  stableCode: string;
  customName: string;
  capacity: string;
  capacityUnit: string;
  constraintNote: string;
}

function localKey(): string {
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  return cryptoObj?.randomUUID ? cryptoObj.randomUUID() : String(Math.random());
}

function toDraftItems(
  entries: readonly {
    entryId: string;
    stableCode: string;
    customName: string | null;
    capacity: number | null;
    capacityUnit: string | null;
    constraintNote: string | null;
    sortOrder: number;
  }[],
): DraftItem[] {
  return [...entries]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((entry) => ({
      key: entry.entryId,
      stableCode: entry.stableCode,
      customName: entry.customName ?? "",
      capacity: entry.capacity != null ? String(entry.capacity) : "",
      capacityUnit: entry.capacityUnit ?? "",
      constraintNote: entry.constraintNote ?? "",
    }));
}

function toEquipmentInputs(items: DraftItem[]): EquipmentInput[] {
  return items.map((item) => ({
    stableCode: item.stableCode,
    customName: item.customName.trim() || null,
    capacity: item.capacity.trim() === "" ? null : Number(item.capacity),
    capacityUnit: item.capacityUnit.trim() || null,
    constraintNote: item.constraintNote.trim() || null,
  }));
}

/**
 * Equipment editor: add from catalog or custom, edit fields, remove, and reorder via
 * explicit Move Up/Down controls. Array order is canonical, so the whole ordered
 * collection is submitted together with the shared workspace etag on save.
 */
export function ProfileEquipmentPage() {
  const {
    status,
    workspace,
    isMutating,
    lastMutationError,
    clearMutationError,
    replaceEquipment,
    reload,
  } = useProfileWorkspace();
  const { t, locale } = useProductionI18n();

  const [draft, setDraft] = useState<DraftItem[] | null>(null);
  const [pendingCode, setPendingCode] = useState("");
  const [customName, setCustomName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (status === "session") {
    return (
      <div role="alert" data-testid="profile-equipment-session">
        <p>{t("profile.error.session")}</p>
      </div>
    );
  }

  if ((status === "loading" || status === "idle") && !workspace) {
    return (
      <p role="status" data-testid="profile-equipment-loading">
        {t("profile.loading")}
      </p>
    );
  }

  if (!workspace) {
    return (
      <div role="alert" data-testid="profile-equipment-error">
        <p>{t("profile.error.load")}</p>
        <Button type="button" onClick={() => void reload()}>
          {t("profile.actions.retry")}
        </Button>
      </div>
    );
  }

  const blocked = status === "version_conflict";
  const items = draft ?? toDraftItems(workspace.equipment.entries);
  const isDirty = draft !== null;
  const usedCodes = new Set(items.map((item) => item.stableCode));
  const catalogOptions = EQUIPMENT_CODES.filter((code) => !usedCodes.has(code));

  function describeError(err: unknown): string {
    if (err instanceof ProfileApiError) {
      if (err.code === "precondition_failed")
        return t("profile.error.precondition412");
      if (err.code === "precondition_required")
        return t("profile.error.precondition428");
      if (err.code === "validation_failed")
        return err.message || t("profile.error.validation");
    }
    return t("profile.error.save");
  }

  function ensureDraft(): DraftItem[] {
    return draft ?? toDraftItems(workspace!.equipment.entries);
  }

  function addFromCatalog() {
    if (!pendingCode) return;
    const next = [
      ...ensureDraft(),
      {
        key: localKey(),
        stableCode: pendingCode,
        customName: "",
        capacity: "",
        capacityUnit: "",
        constraintNote: "",
      },
    ];
    setDraft(next);
    setPendingCode("");
  }

  function addCustom() {
    const trimmed = customName.trim();
    if (!trimmed) return;
    const next = [
      ...ensureDraft(),
      {
        key: localKey(),
        stableCode: createCustomStableCode(),
        customName: trimmed,
        capacity: "",
        capacityUnit: "",
        constraintNote: "",
      },
    ];
    setDraft(next);
    setCustomName("");
  }

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setDraft(
      ensureDraft().map((item) =>
        item.key === key ? { ...item, ...patch } : item,
      ),
    );
  }

  function removeItem(key: string) {
    setDraft(ensureDraft().filter((item) => item.key !== key));
  }

  function moveItem(key: string, direction: -1 | 1) {
    const current = ensureDraft();
    const index = current.findIndex((item) => item.key === key);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return;
    const next = [...current];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setDraft(next);
  }

  async function save() {
    setActionError(null);
    clearMutationError();
    try {
      await replaceEquipment(toEquipmentInputs(ensureDraft()));
      setDraft(null);
    } catch (err) {
      setActionError(describeError(err));
    }
  }

  return (
    <div
      data-testid="profile-equipment"
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl">
            {t("profile.equipment.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profile.equipment.subtitle")}
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/app/perfil">{t("profile.actions.back")}</Link>
        </Button>
      </div>

      {blocked && (
        <div role="alert" data-testid="profile-equipment-version-conflict">
          <p>{t("profile.error.versionConflict")}</p>
          <Button type="button" onClick={() => void reload()}>
            {t("profile.actions.reload")}
          </Button>
        </div>
      )}

      {(actionError || lastMutationError) && (
        <p role="alert" data-testid="profile-equipment-error-message">
          {actionError ??
            (lastMutationError ? describeError(lastMutationError) : "")}
        </p>
      )}

      <ul className="space-y-2" data-testid="profile-equipment-entries">
        {items.length === 0 && (
          <li className="text-sm text-muted-foreground">
            {t("profile.equipment.empty")}
          </li>
        )}
        {items.map((item, index) => {
          const isCustom = isCustomStableCode(item.stableCode);
          const primaryLabel =
            isCustom && item.customName
              ? item.customName
              : resolveLabel(locale, "equipment", item.stableCode);
          return (
            <li
              key={item.key}
              data-testid={`profile-equipment-entry-${item.key}`}
              className="space-y-2 rounded-lg border border-border p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{primaryLabel}</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={blocked || isMutating || index === 0}
                    data-testid={`profile-equipment-move-up-${item.key}`}
                    onClick={() => moveItem(item.key, -1)}
                  >
                    {t("profile.actions.moveUp")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={
                      blocked || isMutating || index === items.length - 1
                    }
                    data-testid={`profile-equipment-move-down-${item.key}`}
                    onClick={() => moveItem(item.key, 1)}
                  >
                    {t("profile.actions.moveDown")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={blocked || isMutating}
                    data-testid={`profile-equipment-remove-${item.key}`}
                    onClick={() => removeItem(item.key)}
                  >
                    {t("profile.equipment.removeEntry")}
                  </Button>
                </div>
              </div>
              {isCustom && !item.customName && (
                <p className="text-xs text-muted-foreground">
                  {t("profile.equipment.unknownCode")}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {isCustom && (
                  <Input
                    data-testid={`profile-equipment-custom-name-${item.key}`}
                    className="max-w-xs"
                    placeholder={t("profile.equipment.customNamePlaceholder")}
                    value={item.customName}
                    disabled={blocked || isMutating}
                    onChange={(event) =>
                      updateItem(item.key, { customName: event.target.value })
                    }
                  />
                )}
                <label className="flex items-center gap-1 text-xs">
                  {t("profile.equipment.capacity")}
                  <Input
                    data-testid={`profile-equipment-capacity-${item.key}`}
                    type="number"
                    className="w-24"
                    value={item.capacity}
                    disabled={blocked || isMutating}
                    onChange={(event) =>
                      updateItem(item.key, { capacity: event.target.value })
                    }
                  />
                </label>
                <label className="flex items-center gap-1 text-xs">
                  {t("profile.equipment.capacityUnit")}
                  <Input
                    data-testid={`profile-equipment-capacity-unit-${item.key}`}
                    className="w-24"
                    value={item.capacityUnit}
                    disabled={blocked || isMutating}
                    onChange={(event) =>
                      updateItem(item.key, {
                        capacityUnit: event.target.value,
                      })
                    }
                  />
                </label>
                <Input
                  data-testid={`profile-equipment-constraint-${item.key}`}
                  className="max-w-xs"
                  placeholder={t("profile.equipment.constraintNote")}
                  value={item.constraintNote}
                  disabled={blocked || isMutating}
                  onChange={(event) =>
                    updateItem(item.key, {
                      constraintNote: event.target.value,
                    })
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div
        className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-4"
        data-testid="profile-equipment-add-catalog"
      >
        <select
          data-testid="profile-equipment-catalog-select"
          className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={pendingCode}
          disabled={blocked || isMutating}
          onChange={(event) => setPendingCode(event.target.value)}
        >
          <option value="">{t("profile.equipment.addFromCatalog")}</option>
          {catalogOptions.map((code) => (
            <option key={code} value={code}>
              {resolveLabel(locale, "equipment", code)}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          disabled={blocked || isMutating || !pendingCode}
          data-testid="profile-equipment-catalog-submit"
          onClick={addFromCatalog}
        >
          {t("profile.actions.add")}
        </Button>
        <Input
          data-testid="profile-equipment-custom-input"
          className="max-w-xs"
          placeholder={t("profile.equipment.customNamePlaceholder")}
          value={customName}
          disabled={blocked || isMutating}
          onChange={(event) => setCustomName(event.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={blocked || isMutating || !customName.trim()}
          data-testid="profile-equipment-custom-submit"
          onClick={addCustom}
        >
          {t("profile.equipment.addCustom")}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          disabled={blocked || isMutating || !isDirty}
          data-testid="profile-equipment-save"
          onClick={() => void save()}
        >
          {t("profile.equipment.saveOrder")}
        </Button>
        {isDirty && (
          <Button
            type="button"
            variant="secondary"
            disabled={isMutating}
            data-testid="profile-equipment-cancel"
            onClick={() => setDraft(null)}
          >
            {t("profile.actions.cancel")}
          </Button>
        )}
      </div>
    </div>
  );
}
