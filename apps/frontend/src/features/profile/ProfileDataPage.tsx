import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileWorkspace } from "./ProfileProvider";
import {
  ProgressiveFieldControl,
  UNCHANGED_FIELD_MODE,
  NUMERIC_FIELD_LIMITS,
  toStringFieldMutation,
  validateNumberFieldMutation,
  type FieldMode,
} from "./ProgressiveFieldControl";
import { ControlledFieldControl } from "./ControlledFieldControl";
import {
  FieldErrorSummary,
  numericErrorMessage,
  splitKnownFieldErrors,
  useFocusFirstFieldError,
  type FieldErrorItem,
} from "./fieldErrors";
import {
  useUnsavedChangesGuard,
  UnsavedChangesDialog,
  GuardedLink,
} from "./useUnsavedChangesGuard";
import { CodeListEditor } from "./CodeListEditor";
import {
  GOAL_CODES,
  TECHNIQUE_CODES,
  ABANDONMENT_REASON_CODES,
} from "./catalog/profileCatalogCodes";
import {
  useProductionI18n,
  type ProductionLocale,
} from "@/app/i18n/ProductionI18nProvider";
import { isProductionLocale } from "@/app/i18n/productionCatalog";
import type { ProfilePatch } from "@/contracts/profile";
import { ProfileApiError } from "@/contracts/profile";
import { Button, buttonVariants } from "@/components/ui/button";

const HOUSEHOLD_TEXT_FIELDS = ["displayName", "timeZone"] as const;
const HOUSEHOLD_CONTROLLED_FIELDS = [
  "language",
  "region",
  "currency",
  "measurementSystem",
  "planningCadence",
  "shoppingCadence",
] as const;
const HOUSEHOLD_NUMBER_FIELDS = [
  "defaultAdultCount",
  "defaultChildCount",
  "defaultServingCount",
] as const;
const HOUSEHOLD_FIELD_IDS: readonly string[] = [
  ...HOUSEHOLD_TEXT_FIELDS,
  ...HOUSEHOLD_CONTROLLED_FIELDS,
  ...HOUSEHOLD_NUMBER_FIELDS,
];
const COOKING_CONTROLLED_FIELDS = [
  "overallSkill",
  "confidence",
  "preferredInstructionDetail",
  "effortTolerance",
  "cleanupTolerance",
  "repeatMealPreference",
  "reheatingPreference",
  "leftoverPreference",
  "freezingPreference",
] as const;
const COOKING_NUMBER_FIELDS = [
  "ordinaryPrepMinutes",
  "exceptionalPrepMinutes",
] as const;
const COOKING_FIELD_IDS: readonly string[] = [
  ...COOKING_CONTROLLED_FIELDS,
  ...COOKING_NUMBER_FIELDS,
];
const LISTS_FIELD_IDS = [
  "knownTechniques",
  "techniquesToLearn",
  "goals",
  "abandonmentReasons",
] as const;

type FieldModeMap = Record<string, FieldMode>;

function getMode(modes: FieldModeMap, key: string): FieldMode {
  return modes[key] ?? UNCHANGED_FIELD_MODE;
}

function isSectionDirty(modes: FieldModeMap): boolean {
  return Object.values(modes).some((mode) => mode.kind !== "unchanged");
}

function detectBrowserTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * Section-scoped PATCH forms for household, locale/cooking, and ordered lists.
 * Each field is edited through {@link ProgressiveFieldControl} (free text/numeric)
 * or {@link ControlledFieldControl} (closed-set enums): leave unchanged (default),
 * confirm a new value, or remove. "Cancel" restores the section to the last-loaded
 * snapshot without submitting anything. Numeric fields are validated locally
 * against the backend's authoritative range before submit — an empty or
 * out-of-range value never reaches the network as a coerced `0`, it blocks submit
 * with an inline field error instead (see {@link validateNumberFieldMutation}).
 */
export function ProfileDataPage() {
  const {
    status,
    workspace,
    isMutating,
    lastMutationError,
    clearMutationError,
    patchProfile,
    reload,
  } = useProfileWorkspace();
  const { t, locale, setLocale } = useProductionI18n();
  const navigate = useNavigate();

  const [householdModes, setHouseholdModes] = useState<FieldModeMap>({});
  const [cookingModes, setCookingModes] = useState<FieldModeMap>({});
  const [householdError, setHouseholdError] = useState<string | null>(null);
  const [cookingError, setCookingError] = useState<string | null>(null);
  const [listsError, setListsError] = useState<string | null>(null);
  const [householdFieldErrors, setHouseholdFieldErrors] = useState<
    Record<string, string>
  >({});
  const [cookingFieldErrors, setCookingFieldErrors] = useState<
    Record<string, string>
  >({});
  const [listsFieldErrors, setListsFieldErrors] = useState<
    Record<string, string>
  >({});
  const [householdUnknownErrors, setHouseholdUnknownErrors] = useState(0);
  const [cookingUnknownErrors, setCookingUnknownErrors] = useState(0);
  const [householdServerComparison, setHouseholdServerComparison] =
    useState(false);
  const [cookingServerComparison, setCookingServerComparison] = useState(false);

  const [knownTechniques, setKnownTechniques] = useState<string[] | null>(null);
  const [techniquesToLearn, setTechniquesToLearn] = useState<string[] | null>(
    null,
  );
  const [goals, setGoals] = useState<string[] | null>(null);
  const [abandonmentReasons, setAbandonmentReasons] = useState<string[] | null>(
    null,
  );

  const browserTimeZone = useMemo(detectBrowserTimeZone, []);

  const listsDirty =
    knownTechniques !== null ||
    techniquesToLearn !== null ||
    goals !== null ||
    abandonmentReasons !== null;
  const pageDirty =
    isSectionDirty(householdModes) ||
    isSectionDirty(cookingModes) ||
    listsDirty;
  const guard = useUnsavedChangesGuard(pageDirty);

  const householdErrorItems: FieldErrorItem[] = Object.entries(
    householdFieldErrors,
  ).map(([key, message]) => ({
    id: `profile-data-input-${key}`,
    label: t(`profile.data.field.${key}`),
    message,
  }));
  const cookingErrorItems: FieldErrorItem[] = Object.entries(
    cookingFieldErrors,
  ).map(([key, message]) => ({
    id: `profile-data-input-${key}`,
    label: t(`profile.data.field.${key}`),
    message,
  }));
  useFocusFirstFieldError(householdErrorItems);
  useFocusFirstFieldError(cookingErrorItems);

  if (status === "session") {
    return (
      <div role="alert" data-testid="profile-data-session">
        <p>{t("profile.error.session")}</p>
      </div>
    );
  }

  if ((status === "loading" || status === "idle") && !workspace) {
    return (
      <p role="status" data-testid="profile-data-loading">
        {t("profile.loading")}
      </p>
    );
  }

  if (!workspace) {
    return (
      <div role="alert" data-testid="profile-data-error">
        <p>{t("profile.error.load")}</p>
        <Button type="button" onClick={() => void reload()}>
          {t("profile.actions.retry")}
        </Button>
      </div>
    );
  }

  const blocked = status === "version_conflict";
  const { household, cookingContext } = workspace.profile;
  const knownTechniquesValue =
    knownTechniques ?? workspace.profile.knownTechniques;
  const techniquesToLearnValue =
    techniquesToLearn ?? workspace.profile.techniquesToLearn;
  const goalsValue = goals ?? workspace.profile.goals;
  const abandonmentReasonsValue =
    abandonmentReasons ?? workspace.profile.abandonmentReasons;

  function describeMutationError(err: unknown): string {
    if (err instanceof ProfileApiError) {
      if (err.code === "precondition_failed")
        return t("profile.error.precondition412");
      if (err.code === "precondition_required")
        return t("profile.error.precondition428");
      if (err.code === "profile_already_exists" || err.code === "conflict") {
        return t("profile.error.conflict409");
      }
      if (err.code === "validation_failed") {
        return err.message || t("profile.error.validation");
      }
    }
    return t("profile.error.save");
  }

  async function saveHousehold(event: React.FormEvent) {
    event.preventDefault();
    clearMutationError();
    setHouseholdError(null);
    setHouseholdFieldErrors({});
    setHouseholdUnknownErrors(0);
    setHouseholdServerComparison(false);

    const patch: ProfilePatch = {};
    const localErrors: Record<string, string> = {};

    const displayNameMutation = toStringFieldMutation(
      getMode(householdModes, "displayName"),
    );
    if (displayNameMutation) patch.displayName = displayNameMutation;

    for (const key of HOUSEHOLD_CONTROLLED_FIELDS) {
      const mutation = toStringFieldMutation(getMode(householdModes, key));
      if (mutation) patch[key] = mutation;
    }
    const timeZoneMutation = toStringFieldMutation(
      getMode(householdModes, "timeZone"),
    );
    if (timeZoneMutation) patch.timeZone = timeZoneMutation;

    for (const key of HOUSEHOLD_NUMBER_FIELDS) {
      const result = validateNumberFieldMutation(
        getMode(householdModes, key),
        NUMERIC_FIELD_LIMITS[key],
      );
      if (!result.ok) {
        localErrors[key] = numericErrorMessage(
          result.errorKey,
          NUMERIC_FIELD_LIMITS[key],
          t,
        );
        continue;
      }
      if (result.mutation) patch[key] = result.mutation;
    }

    if (Object.keys(localErrors).length > 0) {
      setHouseholdFieldErrors(localErrors);
      return;
    }
    if (Object.keys(patch).length === 0) return;

    const languageMode = getMode(householdModes, "language");
    try {
      await patchProfile(patch);
      setHouseholdModes({});
      if (languageMode.kind === "confirm") {
        const nextLanguage = languageMode.value.trim();
        if (isProductionLocale(nextLanguage) && nextLanguage !== locale) {
          setLocale(nextLanguage as ProductionLocale);
        }
      }
    } catch (err) {
      if (
        err instanceof ProfileApiError &&
        err.code === "validation_failed" &&
        err.fieldErrors
      ) {
        const { known, unknownCount } = splitKnownFieldErrors(
          err.fieldErrors,
          HOUSEHOLD_FIELD_IDS,
        );
        setHouseholdFieldErrors(known);
        setHouseholdUnknownErrors(unknownCount);
        if (Object.keys(known).length === 0 && unknownCount === 0) {
          setHouseholdError(describeMutationError(err));
        }
        return;
      }
      if (
        err instanceof ProfileApiError &&
        err.code === "precondition_failed"
      ) {
        setHouseholdServerComparison(true);
      }
      setHouseholdError(describeMutationError(err));
    }
  }

  async function saveCooking(event: React.FormEvent) {
    event.preventDefault();
    clearMutationError();
    setCookingError(null);
    setCookingFieldErrors({});
    setCookingUnknownErrors(0);
    setCookingServerComparison(false);

    const patch: ProfilePatch = {};
    const localErrors: Record<string, string> = {};

    for (const key of COOKING_CONTROLLED_FIELDS) {
      const mutation = toStringFieldMutation(getMode(cookingModes, key));
      if (mutation) patch[key] = mutation;
    }
    for (const key of COOKING_NUMBER_FIELDS) {
      const result = validateNumberFieldMutation(
        getMode(cookingModes, key),
        NUMERIC_FIELD_LIMITS[key],
      );
      if (!result.ok) {
        localErrors[key] = numericErrorMessage(
          result.errorKey,
          NUMERIC_FIELD_LIMITS[key],
          t,
        );
        continue;
      }
      if (result.mutation) patch[key] = result.mutation;
    }

    if (Object.keys(localErrors).length > 0) {
      setCookingFieldErrors(localErrors);
      return;
    }
    if (Object.keys(patch).length === 0) return;

    try {
      await patchProfile(patch);
      setCookingModes({});
    } catch (err) {
      if (
        err instanceof ProfileApiError &&
        err.code === "validation_failed" &&
        err.fieldErrors
      ) {
        const { known, unknownCount } = splitKnownFieldErrors(
          err.fieldErrors,
          COOKING_FIELD_IDS,
        );
        setCookingFieldErrors(known);
        setCookingUnknownErrors(unknownCount);
        if (Object.keys(known).length === 0 && unknownCount === 0) {
          setCookingError(describeMutationError(err));
        }
        return;
      }
      if (
        err instanceof ProfileApiError &&
        err.code === "precondition_failed"
      ) {
        setCookingServerComparison(true);
      }
      setCookingError(describeMutationError(err));
    }
  }

  async function saveLists(event: React.FormEvent) {
    event.preventDefault();
    clearMutationError();
    setListsError(null);
    setListsFieldErrors({});
    const patch: ProfilePatch = {};
    if (knownTechniques !== null) patch.knownTechniques = knownTechniques;
    if (techniquesToLearn !== null) {
      patch.techniquesToLearn = techniquesToLearn;
    }
    if (goals !== null) patch.goals = goals;
    if (abandonmentReasons !== null) {
      patch.abandonmentReasons = abandonmentReasons;
    }
    if (Object.keys(patch).length === 0) return;
    try {
      await patchProfile(patch);
      setKnownTechniques(null);
      setTechniquesToLearn(null);
      setGoals(null);
      setAbandonmentReasons(null);
    } catch (err) {
      if (
        err instanceof ProfileApiError &&
        err.code === "validation_failed" &&
        err.fieldErrors
      ) {
        const { known } = splitKnownFieldErrors(
          err.fieldErrors,
          LISTS_FIELD_IDS,
        );
        setListsFieldErrors(known);
      }
      setListsError(describeMutationError(err));
    }
  }

  return (
    <div data-testid="profile-data" className="mx-auto max-w-2xl space-y-8">
      <UnsavedChangesDialog
        open={guard.isPromptOpen}
        onConfirm={guard.confirmDiscard}
        onCancel={guard.cancelNavigation}
        t={t}
        testIdPrefix="profile-data"
      />
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl">{t("profile.data.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profile.data.subtitle")}
          </p>
        </div>
        <GuardedLink
          to="/app/perfil"
          requestNavigation={guard.requestNavigation}
          navigate={navigate}
          data-testid="profile-data-back"
          className={buttonVariants({ variant: "secondary" })}
        >
          {t("profile.actions.back")}
        </GuardedLink>
      </div>

      {blocked && (
        <div role="alert" data-testid="profile-data-version-conflict">
          <p>{t("profile.error.versionConflict")}</p>
          <Button type="button" onClick={() => void reload()}>
            {t("profile.actions.reload")}
          </Button>
        </div>
      )}

      {lastMutationError && (
        <p role="alert" data-testid="profile-data-mutation-error">
          {describeMutationError(lastMutationError)}
        </p>
      )}

      <form
        data-testid="profile-data-household-form"
        className="space-y-3"
        onSubmit={(event) => void saveHousehold(event)}
      >
        <h2 className="font-display text-xl">
          {t("profile.data.section.household")}
        </h2>
        <FieldErrorSummary
          items={householdErrorItems}
          unknownCount={householdUnknownErrors}
          t={t}
          testId="profile-data-household-error-summary"
        />
        {householdServerComparison && (
          <p
            className="text-xs text-muted-foreground"
            data-testid="profile-data-household-server-notice"
          >
            {t("profile.data.serverVersionNotice")}
          </p>
        )}
        <ProgressiveFieldControl
          id="displayName"
          label={t("profile.data.field.displayName")}
          field={workspace.profile.displayName}
          mode={getMode(householdModes, "displayName")}
          onModeChange={(mode) =>
            setHouseholdModes((prev) => ({ ...prev, displayName: mode }))
          }
          disabled={blocked || isMutating}
          errorMessage={householdFieldErrors.displayName}
          t={t}
          testIdPrefix="profile-data"
        />
        {HOUSEHOLD_NUMBER_FIELDS.map((key) => (
          <div key={key} className="space-y-1">
            <ProgressiveFieldControl
              id={key}
              label={t(`profile.data.field.${key}`)}
              field={household[key]}
              mode={getMode(householdModes, key)}
              numeric
              onModeChange={(mode) =>
                setHouseholdModes((prev) => ({ ...prev, [key]: mode }))
              }
              disabled={blocked || isMutating}
              errorMessage={householdFieldErrors[key]}
              t={t}
              testIdPrefix="profile-data"
            />
            {householdServerComparison &&
              getMode(householdModes, key).kind !== "unchanged" && (
                <p
                  className="pl-3 text-xs text-muted-foreground"
                  data-testid={`profile-data-server-value-${key}`}
                >
                  {household[key].value ?? t("profile.data.presence.absent")}
                </p>
              )}
          </div>
        ))}
        {HOUSEHOLD_CONTROLLED_FIELDS.map((key) => (
          <div key={key} className="space-y-1">
            <ControlledFieldControl
              id={key}
              fieldName={key}
              label={t(`profile.data.field.${key}`)}
              field={household[key]}
              mode={getMode(householdModes, key)}
              onModeChange={(mode) =>
                setHouseholdModes((prev) => ({ ...prev, [key]: mode }))
              }
              disabled={blocked || isMutating}
              errorMessage={householdFieldErrors[key]}
              t={t}
              testIdPrefix="profile-data"
            />
            {householdServerComparison &&
              getMode(householdModes, key).kind !== "unchanged" && (
                <p
                  className="pl-3 text-xs text-muted-foreground"
                  data-testid={`profile-data-server-value-${key}`}
                >
                  {household[key].value ?? t("profile.data.presence.absent")}
                </p>
              )}
          </div>
        ))}
        {getMode(householdModes, "language").kind !== "unchanged" && (
          <p
            className="text-xs text-muted-foreground"
            data-testid="profile-data-language-hint"
          >
            {t("profile.data.languageChangeHint")}
          </p>
        )}
        <div data-testid="profile-data-field-timeZone-wrapper">
          <ProgressiveFieldControl
            id="timeZone"
            label={t("profile.data.field.timeZone")}
            field={household.timeZone}
            mode={getMode(householdModes, "timeZone")}
            onModeChange={(mode) =>
              setHouseholdModes((prev) => ({ ...prev, timeZone: mode }))
            }
            disabled={blocked || isMutating}
            errorMessage={householdFieldErrors.timeZone}
            t={t}
            testIdPrefix="profile-data"
          />
          {browserTimeZone && (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                {t("profile.data.timeZoneSuggestion").replace(
                  "{timeZone}",
                  browserTimeZone,
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="profile-data-timezone-suggest"
                disabled={blocked || isMutating}
                onClick={() =>
                  setHouseholdModes((prev) => ({
                    ...prev,
                    timeZone: { kind: "confirm", value: browserTimeZone },
                  }))
                }
              >
                {t("profile.data.timeZoneApplySuggestion")}
              </Button>
            </p>
          )}
        </div>
        {householdError && (
          <p role="alert" data-testid="profile-data-household-error">
            {householdError}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            type="submit"
            data-testid="profile-data-household-save"
            disabled={blocked || isMutating || !isSectionDirty(householdModes)}
          >
            {t("profile.actions.save")}
          </Button>
          {isSectionDirty(householdModes) && (
            <Button
              type="button"
              variant="secondary"
              data-testid="profile-data-household-cancel"
              disabled={isMutating}
              onClick={() => {
                setHouseholdModes({});
                setHouseholdFieldErrors({});
                setHouseholdUnknownErrors(0);
                setHouseholdServerComparison(false);
              }}
            >
              {t("profile.actions.cancel")}
            </Button>
          )}
          {isSectionDirty(householdModes) && (
            <span
              className="self-center text-xs text-muted-foreground"
              data-testid="profile-data-household-dirty"
            >
              {t("profile.data.dirtyHint")}
            </span>
          )}
        </div>
      </form>

      <form
        data-testid="profile-data-cooking-form"
        className="space-y-3"
        onSubmit={(event) => void saveCooking(event)}
      >
        <h2 className="font-display text-xl">
          {t("profile.data.section.cooking")}
        </h2>
        <FieldErrorSummary
          items={cookingErrorItems}
          unknownCount={cookingUnknownErrors}
          t={t}
          testId="profile-data-cooking-error-summary"
        />
        {cookingServerComparison && (
          <p
            className="text-xs text-muted-foreground"
            data-testid="profile-data-cooking-server-notice"
          >
            {t("profile.data.serverVersionNotice")}
          </p>
        )}
        {COOKING_NUMBER_FIELDS.map((key) => (
          <div key={key} className="space-y-1">
            <ProgressiveFieldControl
              id={key}
              label={t(`profile.data.field.${key}`)}
              field={cookingContext[key]}
              mode={getMode(cookingModes, key)}
              numeric
              onModeChange={(mode) =>
                setCookingModes((prev) => ({ ...prev, [key]: mode }))
              }
              disabled={blocked || isMutating}
              errorMessage={cookingFieldErrors[key]}
              t={t}
              testIdPrefix="profile-data"
            />
            {cookingServerComparison &&
              getMode(cookingModes, key).kind !== "unchanged" && (
                <p
                  className="pl-3 text-xs text-muted-foreground"
                  data-testid={`profile-data-server-value-${key}`}
                >
                  {cookingContext[key].value ??
                    t("profile.data.presence.absent")}
                </p>
              )}
          </div>
        ))}
        {COOKING_CONTROLLED_FIELDS.map((key) => (
          <div key={key} className="space-y-1">
            <ControlledFieldControl
              id={key}
              fieldName={key}
              label={t(`profile.data.field.${key}`)}
              field={cookingContext[key]}
              mode={getMode(cookingModes, key)}
              onModeChange={(mode) =>
                setCookingModes((prev) => ({ ...prev, [key]: mode }))
              }
              disabled={blocked || isMutating}
              errorMessage={cookingFieldErrors[key]}
              t={t}
              testIdPrefix="profile-data"
            />
            {cookingServerComparison &&
              getMode(cookingModes, key).kind !== "unchanged" && (
                <p
                  className="pl-3 text-xs text-muted-foreground"
                  data-testid={`profile-data-server-value-${key}`}
                >
                  {cookingContext[key].value ??
                    t("profile.data.presence.absent")}
                </p>
              )}
          </div>
        ))}
        {cookingError && (
          <p role="alert" data-testid="profile-data-cooking-error">
            {cookingError}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            type="submit"
            data-testid="profile-data-cooking-save"
            disabled={blocked || isMutating || !isSectionDirty(cookingModes)}
          >
            {t("profile.actions.save")}
          </Button>
          {isSectionDirty(cookingModes) && (
            <Button
              type="button"
              variant="secondary"
              data-testid="profile-data-cooking-cancel"
              disabled={isMutating}
              onClick={() => {
                setCookingModes({});
                setCookingFieldErrors({});
                setCookingUnknownErrors(0);
                setCookingServerComparison(false);
              }}
            >
              {t("profile.actions.cancel")}
            </Button>
          )}
        </div>
      </form>

      <form
        data-testid="profile-data-lists-form"
        className="space-y-3"
        onSubmit={(event) => void saveLists(event)}
      >
        <h2 className="font-display text-xl">
          {t("profile.data.section.lists")}
        </h2>
        <CodeListEditor
          id="known-techniques"
          label={t("profile.data.field.knownTechniques")}
          catalogKind="technique"
          catalogCodes={TECHNIQUE_CODES}
          value={knownTechniquesValue}
          onChange={setKnownTechniques}
          locale={locale}
          disabled={blocked || isMutating}
          errorMessage={listsFieldErrors.knownTechniques}
          t={t}
        />
        <CodeListEditor
          id="techniques-to-learn"
          label={t("profile.data.field.techniquesToLearn")}
          catalogKind="technique"
          catalogCodes={TECHNIQUE_CODES}
          value={techniquesToLearnValue}
          onChange={setTechniquesToLearn}
          locale={locale}
          disabled={blocked || isMutating}
          errorMessage={listsFieldErrors.techniquesToLearn}
          t={t}
        />
        <CodeListEditor
          id="goals"
          label={t("profile.data.field.goals")}
          catalogKind="goal"
          catalogCodes={GOAL_CODES}
          value={goalsValue}
          onChange={setGoals}
          locale={locale}
          disabled={blocked || isMutating}
          errorMessage={listsFieldErrors.goals}
          t={t}
        />
        <CodeListEditor
          id="abandonment-reasons"
          label={t("profile.data.field.abandonmentReasons")}
          catalogKind="abandonmentReason"
          catalogCodes={ABANDONMENT_REASON_CODES}
          value={abandonmentReasonsValue}
          onChange={setAbandonmentReasons}
          locale={locale}
          disabled={blocked || isMutating}
          errorMessage={listsFieldErrors.abandonmentReasons}
          t={t}
        />
        {listsError && (
          <p role="alert" data-testid="profile-data-lists-error">
            {listsError}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            type="submit"
            data-testid="profile-data-lists-save"
            disabled={blocked || isMutating || !listsDirty}
          >
            {t("profile.actions.save")}
          </Button>
          {listsDirty && (
            <Button
              type="button"
              variant="secondary"
              data-testid="profile-data-lists-cancel"
              disabled={isMutating}
              onClick={() => {
                setKnownTechniques(null);
                setTechniquesToLearn(null);
                setGoals(null);
                setAbandonmentReasons(null);
              }}
            >
              {t("profile.actions.cancel")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
