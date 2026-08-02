import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";
import { useSession } from "@/app/session/SessionProvider";
import { useRuntime } from "@/app/runtime/RuntimeProvider";
import {
  HOME_SOURCE_TIERS,
  type HomeQuickChooserDefinition,
  type HomeSourceResult,
  type HomeSourceTier,
  type HomeSuggestionCandidate,
} from "@/contracts/contextualHome";
import { Button } from "@/components/ui/button";
import { buildHomeGreeting, readBrowserTimeZone } from "./dayPart";
import { useContextualHome } from "./ContextualHomeProvider";
import { QuickChooser } from "./QuickChooser";

function CandidateCard({
  item,
  t,
}: {
  item: HomeSuggestionCandidate;
  t: (key: string, vars?: Readonly<Record<string, string | number>>) => string;
}) {
  const reasonKey = `home.reason.${item.reasonCode}`;
  return (
    <article
      data-testid={`home-candidate-${item.id}`}
      data-source-tier={item.sourceLabelKey}
      data-freshness={item.freshness ?? "current"}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-secondary px-2 py-1">
          {t(item.sourceLabelKey)}
        </span>
        {item.freshness === "stale" ? (
          <span className="rounded-full border border-warning px-2 py-1">
            {t("home.source.staleBadge")}
          </span>
        ) : null}
        {item.attentionInfluenced ? (
          <span className="rounded-full border border-border px-2 py-1">
            {t("home.attention.advisory")}
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 font-display text-xl">{t(item.titleKey)}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t(reasonKey)}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {item.estimatedTotalMinutes != null ? (
          <span>
            {t("home.minutes", { count: item.estimatedTotalMinutes })}
          </span>
        ) : null}
        {item.effortCode ? (
          <span>{t(`home.effort.${item.effortCode}`)}</span>
        ) : null}
      </div>
    </article>
  );
}

function SourceSection({
  result,
  t,
  onRetry,
}: {
  result: HomeSourceResult;
  t: (key: string, vars?: Readonly<Record<string, string | number>>) => string;
  onRetry?: () => void;
}) {
  const retryable =
    result.status === "failed" || result.status === "unavailable";
  return (
    <section
      data-testid={`home-source-${result.tier}`}
      data-status={result.status}
      aria-labelledby={`home-source-heading-${result.tier}`}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id={`home-source-heading-${result.tier}`}
          className="font-display text-2xl"
        >
          {t(`home.source.heading.${result.tier}`)}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t(`home.source.label.${result.tier}`)}
        </span>
      </div>
      {result.status === "ready" || result.status === "stale" ? (
        <div className="grid gap-3">
          {result.status === "stale" && result.statusReasonKey ? (
            <p role="status" className="text-sm text-muted-foreground">
              {t(result.statusReasonKey)}
            </p>
          ) : null}
          {result.items.map((item) => (
            <CandidateCard key={item.id} item={item} t={t} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <p role="status" className="text-sm text-muted-foreground">
            {result.statusReasonKey
              ? t(result.statusReasonKey)
              : t("home.source.unavailable")}
          </p>
          {retryable && onRetry ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              data-testid={`home-source-retry-${result.tier}`}
              onClick={onRetry}
            >
              {t("home.source.retry")}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}

/**
 * Empty menu must be omitted (skip Tier 1 without error) while other empty
 * tiers may still explain themselves.
 */
function shouldRenderSource(result: HomeSourceResult): boolean {
  if (result.tier === "menu" && result.status === "empty") {
    return false;
  }
  return true;
}

function failedResult(
  tier: HomeSourceTier,
  reasonKey: string,
): HomeSourceResult {
  return {
    tier,
    status: "failed",
    statusReasonKey: reasonKey,
    items: [],
  };
}

/**
 * Authenticated contextual home.
 * Sources load independently so a slow or failed tier cannot blank siblings.
 * Mock fixtures stay out of production composition.
 */
export function ContextualHomePage({
  now,
  browserTimeZone,
  scenarioOptions,
}: {
  now?: Date;
  browserTimeZone?: string | null;
  /** Prototype-only scenario ids; omit in production. */
  scenarioOptions?: readonly string[];
} = {}) {
  const { t, locale } = useProductionI18n();
  const { session } = useSession();
  const { enablePrototypeFixtures } = useRuntime();
  const { adapter, telemetry, scenarioId, setScenarioId } = useContextualHome();

  const [menu, setMenu] = useState<HomeSourceResult | null>(null);
  const [inventory, setInventory] = useState<HomeSourceResult | null>(null);
  const [profile, setProfile] = useState<HomeSourceResult | null>(null);
  const [chooserDef, setChooserDef] =
    useState<HomeQuickChooserDefinition | null>(null);
  const [chooserLoading, setChooserLoading] = useState(true);
  const [chooserResult, setChooserResult] = useState<HomeSourceResult | null>(
    null,
  );
  const [chooserOpen, setChooserOpen] = useState(false);
  // Request-scoped timezone review — never written to profile or localStorage.
  const [timeZoneOverride, setTimeZoneOverride] = useState<string | null>(null);

  const clock = useMemo(() => now ?? new Date(), [now]);
  const resolvedBrowserTimeZone =
    browserTimeZone === undefined ? readBrowserTimeZone() : browserTimeZone;

  const greeting = useMemo(
    () =>
      buildHomeGreeting({
        displayName: session.displayName,
        overrideTimeZone: timeZoneOverride,
        profileTimeZone: session.timeZone,
        browserTimeZone: resolvedBrowserTimeZone,
        now: clock,
      }),
    [
      session.displayName,
      session.timeZone,
      resolvedBrowserTimeZone,
      clock,
      timeZoneOverride,
    ],
  );

  const greetingText = greeting.displayName
    ? t(`home.greeting.named.${greeting.dayPart}`, {
        name: greeting.displayName,
      })
    : t(`home.greeting.anonymous.${greeting.dayPart}`);

  const query = useMemo(
    () => ({
      locale,
      timeZone: greeting.timeZone,
      now: clock,
    }),
    [locale, greeting.timeZone, clock],
  );

  const loadMenu = useCallback(async () => {
    setMenu(null);
    try {
      const result = await adapter.loadMenuSource(query);
      setMenu(result);
      telemetry.track({
        name:
          result.status === "unavailable"
            ? "source_unavailable"
            : "source_rendered",
        codes: { tier: "menu", status: result.status },
      });
    } catch {
      const result = failedResult("menu", "home.source.failed.menu");
      setMenu(result);
      telemetry.track({
        name: "source_rendered",
        codes: { tier: "menu", status: "failed" },
      });
    }
  }, [adapter, query, telemetry]);

  const loadInventory = useCallback(async () => {
    setInventory(null);
    try {
      const result = await adapter.loadInventorySource(query);
      setInventory(result);
      telemetry.track({
        name:
          result.status === "unavailable"
            ? "source_unavailable"
            : "source_rendered",
        codes: { tier: "inventory", status: result.status },
      });
    } catch {
      const result = failedResult("inventory", "home.source.failed.inventory");
      setInventory(result);
      telemetry.track({
        name: "source_rendered",
        codes: { tier: "inventory", status: "failed" },
      });
    }
  }, [adapter, query, telemetry]);

  const loadProfile = useCallback(async () => {
    setProfile(null);
    try {
      const result = await adapter.loadProfileSource(query);
      setProfile(result);
      telemetry.track({
        name:
          result.status === "unavailable"
            ? "source_unavailable"
            : "source_rendered",
        codes: { tier: "profile", status: result.status },
      });
    } catch {
      const result = failedResult("profile", "home.source.failed.profile");
      setProfile(result);
      telemetry.track({
        name: "source_rendered",
        codes: { tier: "profile", status: "failed" },
      });
    }
  }, [adapter, query, telemetry]);

  const loadChooserDefinition = useCallback(async () => {
    setChooserLoading(true);
    try {
      const chooser = await adapter.getQuickChooserDefinition(query);
      setChooserDef(chooser);
    } catch {
      setChooserDef({
        recommendationCapability: "unavailable",
        questions: [],
      });
    } finally {
      setChooserLoading(false);
    }
  }, [adapter, query]);

  useEffect(() => {
    void loadMenu();
    void loadInventory();
    void loadProfile();
    void loadChooserDefinition();
  }, [loadMenu, loadInventory, loadProfile, loadChooserDefinition, scenarioId]);

  const orderedSources = useMemo(() => {
    const map: Record<string, HomeSourceResult | null> = {
      menu,
      inventory,
      profile,
    };
    return HOME_SOURCE_TIERS.filter((tier) => tier !== "quickChooser").map(
      (tier) => map[tier],
    );
  }, [menu, inventory, profile]);

  const hasAnyCandidate = orderedSources.some(
    (s) =>
      s && (s.status === "ready" || s.status === "stale") && s.items.length,
  );

  const canUseBrowserOverride =
    Boolean(resolvedBrowserTimeZone) &&
    greeting.timeZoneSource !== "browser" &&
    greeting.timeZoneSource !== "override";

  return (
    <div data-testid="contextual-home" className="space-y-8">
      <header className="space-y-3">
        <p
          data-testid="home-greeting"
          className="text-sm text-muted-foreground"
        >
          {greetingText}
        </p>
        <h1
          data-testid="home-primary-question"
          className="font-display text-3xl md:text-4xl"
        >
          {t("home.primaryQuestion")}
        </h1>
        {greeting.timeZoneSource === "unavailable" ? (
          <p role="status" data-testid="home-timezone-fallback">
            {t("home.timezone.missing")}
          </p>
        ) : null}
        {greeting.timeZoneSource === "invalid" ? (
          <p role="status" data-testid="home-timezone-invalid">
            {t("home.timezone.invalid")}
          </p>
        ) : null}
        {greeting.timeZone ? (
          <p
            className="text-xs text-muted-foreground"
            data-testid="home-timezone"
          >
            {t(`home.timezone.source.${greeting.timeZoneSource}`)}:{" "}
            {greeting.timeZone}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {canUseBrowserOverride ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              data-testid="home-timezone-use-browser"
              onClick={() =>
                setTimeZoneOverride(resolvedBrowserTimeZone ?? null)
              }
            >
              {t("home.timezone.useBrowser")}
            </Button>
          ) : null}
          {timeZoneOverride ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              data-testid="home-timezone-clear-override"
              onClick={() => setTimeZoneOverride(null)}
            >
              {t("home.timezone.clearOverride")}
            </Button>
          ) : null}
          <Button asChild variant="secondary" size="sm">
            <Link to="/app/despensa" data-testid="home-nav-pantry">
              {t("home.nav.pantry")}
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            data-testid="home-open-chooser"
            disabled={chooserLoading || !chooserDef}
            onClick={() => {
              telemetry.track({ name: "quick_chooser_started" });
              setChooserOpen(true);
            }}
          >
            {t("home.chooser.open")}
          </Button>
        </div>
      </header>

      {enablePrototypeFixtures && setScenarioId && scenarioOptions ? (
        <label className="block text-sm">
          <span className="text-muted-foreground">
            {t("home.scenario.label")}
          </span>
          <select
            className="mt-1 block w-full max-w-sm rounded-md border border-border bg-background px-3 py-2"
            data-testid="home-scenario-select"
            value={scenarioId ?? "default"}
            onChange={(event) => setScenarioId(event.target.value)}
          >
            {scenarioOptions.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div data-testid="home-sources" className="flex flex-col gap-10">
        {orderedSources.map((result, index) => {
          const tier = HOME_SOURCE_TIERS[index];
          if (!result) {
            return (
              <p
                key={tier}
                role="status"
                data-testid={`home-source-loading-${tier}`}
                className="text-sm text-muted-foreground"
              >
                {t("home.loading")}
              </p>
            );
          }
          if (!shouldRenderSource(result)) {
            return null;
          }
          const retry =
            result.tier === "menu"
              ? loadMenu
              : result.tier === "inventory"
                ? loadInventory
                : loadProfile;
          return (
            <SourceSection
              key={result.tier}
              result={result}
              t={t}
              onRetry={() => void retry()}
            />
          );
        })}

        <section
          data-testid="home-source-quickChooser"
          aria-labelledby="home-source-heading-quickChooser"
          className="space-y-3"
        >
          <h2
            id="home-source-heading-quickChooser"
            className="font-display text-2xl"
          >
            {t("home.source.heading.quickChooser")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("home.source.label.quickChooser")}
          </p>
          {chooserResult ? (
            chooserResult.status === "ready" &&
            chooserResult.items.length > 0 ? (
              <div className="grid gap-3" data-testid="chooser-results">
                <p className="text-sm font-medium">
                  {t("home.chooser.results")}
                </p>
                {chooserResult.items.map((item) => (
                  <CandidateCard key={item.id} item={item} t={t} />
                ))}
              </div>
            ) : (
              <p role="status">
                {chooserResult.statusReasonKey
                  ? t(chooserResult.statusReasonKey)
                  : t("home.chooser.empty")}
              </p>
            )
          ) : null}
        </section>

        {!hasAnyCandidate && !chooserResult && menu && inventory && profile ? (
          <p role="status" data-testid="home-no-suggestions">
            {t("home.noSuggestions")}
          </p>
        ) : null}

        {menu?.status === "unavailable" &&
        inventory?.status === "unavailable" &&
        profile?.status === "unavailable" ? (
          <p
            role="status"
            data-testid="home-live-unavailable"
            className="text-sm text-muted-foreground"
          >
            {t("home.unavailable.detail")}
          </p>
        ) : null}
      </div>

      {chooserOpen && chooserDef ? (
        <QuickChooser
          definition={chooserDef}
          telemetry={telemetry}
          onCancel={() => setChooserOpen(false)}
          onRetry={() => {
            setChooserOpen(false);
            void loadChooserDefinition().then(() => setChooserOpen(true));
          }}
          onLoadSuggestions={async (answers) =>
            adapter.loadQuickChooserSuggestions({
              locale,
              timeZone: greeting.timeZone,
              now: clock,
              quickChooserAnswers: answers,
            })
          }
          onComplete={(result) => {
            setChooserResult(result);
            setChooserOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
