import { useState } from "react";
import { Link } from "react-router-dom";
import { useProfileWorkspace } from "./ProfileProvider";
import { createCustomStableCode, isCustomStableCode } from "./customCodes";
import { PREFERENCE_ENTRY_CODES } from "./catalog/profileCatalogCodes";
import { resolveLabel } from "./catalog/profileCatalog";
import { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";
import {
  ProfileApiError,
  type PreferenceCategory,
  type PreferenceEntry,
} from "@/contracts/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORIES: PreferenceCategory[] = [
  "Preference",
  "Dislike",
  "DietaryPattern",
  "Intolerance",
  "Allergy",
  "ReligiousRestriction",
  "EthicalRestriction",
  "MedicalRestriction",
];

/** Allergy and medical restriction entries require heightened, explicit confirmation. */
const SENSITIVE_CATEGORIES: ReadonlySet<PreferenceCategory> = new Set([
  "Allergy",
  "MedicalRestriction",
]);

interface PendingAdd {
  category: PreferenceCategory;
  stableCode: string;
  note: string | null;
}

/**
 * Category-tabbed preference and restriction editor. Only `confirmed` entries are
 * ever returned by the backend, so every listed row is already active. Allergy and
 * medical restriction additions require an explicit, non-native confirmation step
 * that carries a "not medical advice" disclaimer before the mutation is sent.
 */
export function ProfilePreferencesPage() {
  const {
    status,
    workspace,
    isMutating,
    lastMutationError,
    clearMutationError,
    mutatePreferences,
    reload,
  } = useProfileWorkspace();
  const { t, locale } = useProductionI18n();

  const [category, setCategory] = useState<PreferenceCategory>("Preference");
  const [catalogCode, setCatalogCode] = useState("");
  const [catalogNote, setCatalogNote] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (status === "session") {
    return (
      <div role="alert" data-testid="profile-preferences-session">
        <p>{t("profile.error.session")}</p>
      </div>
    );
  }

  if ((status === "loading" || status === "idle") && !workspace) {
    return (
      <p role="status" data-testid="profile-preferences-loading">
        {t("profile.loading")}
      </p>
    );
  }

  if (!workspace) {
    return (
      <div role="alert" data-testid="profile-preferences-error">
        <p>{t("profile.error.load")}</p>
        <Button type="button" onClick={() => void reload()}>
          {t("profile.actions.retry")}
        </Button>
      </div>
    );
  }

  const blocked = status === "version_conflict";
  const entries = workspace.preferences.entries
    .filter((entry) => entry.category === category)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const existingCodes = new Set(entries.map((entry) => entry.stableCode));
  const catalogOptions = PREFERENCE_ENTRY_CODES[category].filter(
    (code) => !existingCodes.has(code),
  );

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

  async function submitAdd(stableCode: string, note: string) {
    setActionError(null);
    clearMutationError();
    try {
      await mutatePreferences([
        {
          action: "add",
          category,
          stableCode,
          note: note.trim() || null,
        },
      ]);
    } catch (err) {
      setActionError(describeError(err));
    }
  }

  function requestAdd(stableCode: string, note: string) {
    if (SENSITIVE_CATEGORIES.has(category)) {
      setPendingAdd({ category, stableCode, note: note.trim() || null });
      return;
    }
    void submitAdd(stableCode, note);
  }

  async function confirmPendingAdd() {
    if (!pendingAdd) return;
    const { stableCode, note } = pendingAdd;
    setPendingAdd(null);
    await submitAdd(stableCode, note ?? "");
  }

  async function removeEntry(entry: PreferenceEntry) {
    setActionError(null);
    clearMutationError();
    try {
      await mutatePreferences([
        {
          action: "remove",
          category: entry.category,
          stableCode: entry.stableCode,
        },
      ]);
    } catch (err) {
      setActionError(describeError(err));
    }
  }

  async function updateNote(entry: PreferenceEntry) {
    const nextNote = noteDrafts[entry.entryId] ?? entry.note ?? "";
    setActionError(null);
    clearMutationError();
    try {
      await mutatePreferences([
        {
          action: "update",
          category: entry.category,
          stableCode: entry.stableCode,
          note: nextNote.trim() || null,
        },
      ]);
    } catch (err) {
      setActionError(describeError(err));
    }
  }

  return (
    <div
      data-testid="profile-preferences"
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl">
            {t("profile.preferences.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profile.preferences.subtitle")}
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/app/perfil">{t("profile.actions.back")}</Link>
        </Button>
      </div>

      {blocked && (
        <div role="alert" data-testid="profile-preferences-version-conflict">
          <p>{t("profile.error.versionConflict")}</p>
          <Button type="button" onClick={() => void reload()}>
            {t("profile.actions.reload")}
          </Button>
        </div>
      )}

      {(actionError || lastMutationError) && (
        <p role="alert" data-testid="profile-preferences-error-message">
          {actionError ??
            (lastMutationError ? describeError(lastMutationError) : "")}
        </p>
      )}

      <Tabs
        value={category}
        onValueChange={(value) => {
          setCategory(value as PreferenceCategory);
          setCatalogCode("");
          setCatalogNote("");
          setCustomLabel("");
          setCustomNote("");
          setPendingAdd(null);
        }}
      >
        <TabsList className="flex h-auto flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              data-testid={`profile-preferences-tab-${cat}`}
            >
              {t(`profile.preferences.category.${cat}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {pendingAdd && (
        <div
          role="alertdialog"
          aria-label={t("profile.preferences.sensitive.title")}
          data-testid="profile-preferences-sensitive-confirm"
          className="space-y-3 rounded-xl border border-warning p-4"
        >
          <h2 className="font-medium">
            {t("profile.preferences.sensitive.title")}
          </h2>
          <p className="text-sm">{t("profile.preferences.sensitive.detail")}</p>
          <p className="text-sm font-medium">
            {t("profile.preferences.sensitive.noMedicalAdvice")}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              data-testid="profile-preferences-sensitive-confirm-add"
              disabled={isMutating}
              onClick={() => void confirmPendingAdd()}
            >
              {t("profile.preferences.sensitive.confirmAdd")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              data-testid="profile-preferences-sensitive-cancel"
              disabled={isMutating}
              onClick={() => setPendingAdd(null)}
            >
              {t("profile.preferences.sensitive.cancel")}
            </Button>
          </div>
        </div>
      )}

      <ul className="space-y-2" data-testid="profile-preferences-entries">
        {entries.length === 0 && (
          <li className="text-sm text-muted-foreground">
            {t("profile.preferences.empty")}
          </li>
        )}
        {entries.map((entry) => {
          const isCustom = isCustomStableCode(entry.stableCode);
          const primaryLabel =
            isCustom && entry.note
              ? entry.note
              : resolveLabel(locale, category, entry.stableCode);
          return (
            <li
              key={entry.entryId}
              data-testid={`profile-preferences-entry-${entry.entryId}`}
              className="space-y-2 rounded-lg border border-border p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{primaryLabel}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={blocked || isMutating}
                  data-testid={`profile-preferences-remove-${entry.entryId}`}
                  onClick={() => void removeEntry(entry)}
                >
                  {t("profile.preferences.removeEntry")}
                </Button>
              </div>
              {isCustom && !entry.note && (
                <p className="text-xs text-muted-foreground">
                  {t("profile.preferences.unknownCode")}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  data-testid={`profile-preferences-note-${entry.entryId}`}
                  className="max-w-xs"
                  placeholder={t("profile.preferences.notePlaceholder")}
                  value={noteDrafts[entry.entryId] ?? entry.note ?? ""}
                  disabled={blocked || isMutating}
                  onChange={(event) =>
                    setNoteDrafts((prev) => ({
                      ...prev,
                      [entry.entryId]: event.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={blocked || isMutating}
                  data-testid={`profile-preferences-update-note-${entry.entryId}`}
                  onClick={() => void updateNote(entry)}
                >
                  {t("profile.preferences.updateNote")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div
        className="space-y-3 rounded-xl border border-border p-4"
        data-testid="profile-preferences-add-catalog"
      >
        <h2 className="font-medium">
          {t("profile.preferences.addFromCatalog")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            data-testid="profile-preferences-catalog-select"
            className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={catalogCode}
            disabled={blocked || isMutating}
            onChange={(event) => setCatalogCode(event.target.value)}
          >
            <option value="">{t("profile.actions.add")}</option>
            {catalogOptions.map((code) => (
              <option key={code} value={code}>
                {resolveLabel(locale, category, code)}
              </option>
            ))}
          </select>
          <Input
            data-testid="profile-preferences-catalog-note"
            className="max-w-xs"
            placeholder={t("profile.preferences.notePlaceholder")}
            value={catalogNote}
            disabled={blocked || isMutating}
            onChange={(event) => setCatalogNote(event.target.value)}
          />
          <Button
            type="button"
            disabled={blocked || isMutating || !catalogCode}
            data-testid="profile-preferences-catalog-submit"
            onClick={() => {
              requestAdd(catalogCode, catalogNote);
              setCatalogCode("");
              setCatalogNote("");
            }}
          >
            {t("profile.actions.add")}
          </Button>
        </div>
      </div>

      <div
        className="space-y-3 rounded-xl border border-border p-4"
        data-testid="profile-preferences-add-custom"
      >
        <h2 className="font-medium">{t("profile.preferences.addCustom")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            data-testid="profile-preferences-custom-label"
            className="max-w-xs"
            placeholder={t("profile.preferences.customPlaceholder")}
            value={customLabel}
            disabled={blocked || isMutating}
            onChange={(event) => setCustomLabel(event.target.value)}
          />
          <Input
            data-testid="profile-preferences-custom-note"
            className="max-w-xs"
            placeholder={t("profile.preferences.notePlaceholder")}
            value={customNote}
            disabled={blocked || isMutating}
            onChange={(event) => setCustomNote(event.target.value)}
          />
          <Button
            type="button"
            disabled={blocked || isMutating || !customLabel.trim()}
            data-testid="profile-preferences-custom-submit"
            onClick={() => {
              const code = createCustomStableCode();
              // The free-text label the user typed becomes the entry's note; the
              // stable code itself stays opaque and never embeds user text.
              requestAdd(code, customNote.trim() || customLabel.trim());
              setCustomLabel("");
              setCustomNote("");
            }}
          >
            {t("profile.actions.add")}
          </Button>
        </div>
      </div>
    </div>
  );
}
