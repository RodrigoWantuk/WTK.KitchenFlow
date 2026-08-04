import { ProfileApiError } from "@/contracts/profile";
import type { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";

type Translate = ReturnType<typeof useProductionI18n>["t"];

/**
 * Maps a profile mutation failure to localized, actionable copy. Known
 * synchronization blocks (`workspace_not_ready`) must not fall through to the
 * generic “could not save” message.
 */
export function describeProfileMutationError(
  err: unknown,
  t: Translate,
): string {
  if (err instanceof ProfileApiError) {
    if (err.code === "workspace_not_ready") {
      return t("profile.error.workspaceNotReady");
    }
    if (err.code === "precondition_failed") {
      return t("profile.error.precondition412");
    }
    if (err.code === "precondition_required") {
      return t("profile.error.precondition428");
    }
    if (err.code === "profile_already_exists" || err.code === "conflict") {
      return t("profile.error.conflict409");
    }
    if (err.code === "validation_failed") {
      return err.message || t("profile.error.validation");
    }
  }
  return t("profile.error.save");
}
