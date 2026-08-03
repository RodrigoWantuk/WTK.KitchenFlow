import { Link } from "react-router-dom";
import { useProfileWorkspace } from "./ProfileProvider";
import { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";
import { Button } from "@/components/ui/button";

/**
 * Read-only landing surface for the profile area: completeness, existence, adult
 * declaration status, and links into the three editable sections. Never writes.
 */
export function ProfileOverviewPage() {
  const { status, workspace, error, reload } = useProfileWorkspace();
  const { t } = useProductionI18n();

  if (status === "session") {
    return (
      <div
        role="alert"
        data-testid="profile-overview-session"
        className="mx-auto max-w-xl space-y-3"
      >
        <h1 className="font-display text-3xl">{t("profile.overview.title")}</h1>
        <p>{t("profile.error.session")}</p>
      </div>
    );
  }

  if ((status === "loading" || status === "idle") && !workspace) {
    return (
      <p role="status" data-testid="profile-overview-loading">
        {t("profile.loading")}
      </p>
    );
  }

  if (status === "error" && !workspace) {
    return (
      <div
        role="alert"
        data-testid="profile-overview-error"
        className="mx-auto max-w-xl space-y-3"
      >
        <h1 className="font-display text-3xl">{t("profile.overview.title")}</h1>
        <p>{error || t("profile.error.load")}</p>
        <Button
          type="button"
          data-testid="profile-overview-retry"
          onClick={() => void reload()}
        >
          {t("profile.actions.retry")}
        </Button>
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  const { profile, completeness } = workspace;

  const adultLabelKey =
    profile.adultDeclaration.state === "Declared"
      ? "profile.overview.adultDeclaration.declared"
      : profile.adultDeclaration.state === "Declined"
        ? "profile.overview.adultDeclaration.declined"
        : "profile.overview.adultDeclaration.notDeclared";

  return (
    <div data-testid="profile-overview" className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">{t("profile.overview.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("profile.overview.subtitle")}
        </p>
      </div>

      {status === "version_conflict" && (
        <div
          role="alert"
          data-testid="profile-overview-version-conflict"
          className="space-y-2 rounded-lg border border-warning p-4"
        >
          <p>{t("profile.error.versionConflict")}</p>
          <p className="text-sm text-muted-foreground">
            {t("profile.error.versionConflictDetail")}
          </p>
          <Button
            type="button"
            data-testid="profile-overview-reload"
            onClick={() => void reload()}
          >
            {t("profile.actions.reload")}
          </Button>
        </div>
      )}

      {!profile.profileExists && (
        <div
          data-testid="profile-overview-not-started"
          className="rounded-xl border border-border p-4"
        >
          <p className="font-medium">{t("profile.overview.notStarted")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profile.overview.notStartedDetail")}
          </p>
        </div>
      )}

      <div
        data-testid="profile-overview-completeness"
        className="rounded-xl border border-border p-4"
      >
        <p className="text-2xl font-display">
          {t("profile.overview.completeness").replace(
            "{percent}",
            String(completeness.percentComplete),
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("profile.overview.completenessSummary")
            .replace("{completed}", String(completeness.completedSections))
            .replace("{total}", String(completeness.totalSections))}
        </p>
      </div>

      <div
        data-testid="profile-overview-adult-declaration"
        className="rounded-xl border border-border p-4"
      >
        <h2 className="font-medium">
          {t("profile.overview.adultDeclaration.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t(adultLabelKey)}</p>
      </div>

      <nav
        aria-label={t("profile.overview.title")}
        className="grid gap-3 sm:grid-cols-3"
      >
        <Link
          to="/app/perfil/dados"
          data-testid="profile-overview-link-data"
          className="block rounded-xl border border-border p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="font-medium">
            {t("profile.overview.section.household")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profile.overview.linkData")}
          </p>
        </Link>
        <Link
          to="/app/perfil/preferencias"
          data-testid="profile-overview-link-preferences"
          className="block rounded-xl border border-border p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="font-medium">
            {t("profile.overview.section.preferences")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profile.overview.linkPreferences")}
          </p>
        </Link>
        <Link
          to="/app/perfil/equipamentos"
          data-testid="profile-overview-link-equipment"
          className="block rounded-xl border border-border p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="font-medium">
            {t("profile.overview.section.equipment")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profile.overview.linkEquipment")}
          </p>
        </Link>
      </nav>
    </div>
  );
}
