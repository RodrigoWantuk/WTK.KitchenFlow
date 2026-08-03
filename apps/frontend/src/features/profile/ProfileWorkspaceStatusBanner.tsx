import { useProfileWorkspace } from "./ProfileProvider";
import { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";
import { Button } from "@/components/ui/button";

/**
 * Profile-wide post-save synchronization banners. Mounted on the profile layout so
 * they survive subsection navigation while `ProfileProvider` remains mounted.
 */
export function ProfileWorkspaceStatusBanner() {
  const {
    saveRefreshFailed,
    sessionRefreshWarning,
    reload,
    retrySessionRefresh,
    isMutating,
    status,
  } = useProfileWorkspace();
  const { t } = useProductionI18n();

  if (!saveRefreshFailed && !sessionRefreshWarning) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {saveRefreshFailed && (
        <div
          role="status"
          data-testid="profile-save-refresh-failed"
          className="space-y-2 rounded-lg border border-warning p-4"
        >
          <p className="font-medium">
            {t("profile.warning.saveRefreshFailed")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("profile.warning.saveRefreshFailedDetail")}
          </p>
          <Button
            type="button"
            data-testid="profile-save-refresh-reload"
            disabled={isMutating || status === "loading"}
            onClick={() => void reload()}
          >
            {t("profile.actions.reload")}
          </Button>
        </div>
      )}
      {sessionRefreshWarning && (
        <div
          role="status"
          data-testid="profile-session-refresh-warning"
          className="space-y-2 rounded-lg border border-border p-4"
        >
          <p className="font-medium">
            {t("profile.warning.sessionRefreshFailed")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("profile.warning.sessionRefreshFailedDetail")}
          </p>
          <Button
            type="button"
            data-testid="profile-session-refresh-retry"
            disabled={isMutating}
            onClick={() => void retrySessionRefresh()}
          >
            {t("profile.actions.retrySession")}
          </Button>
        </div>
      )}
    </div>
  );
}
