import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";
import { useSession } from "@/app/session/SessionProvider";
import { useRuntime } from "@/app/runtime/RuntimeProvider";
import {
  HOME_SOURCE_TIERS,
  type HomeQuickChooserDefinition,
  type HomeSourceResult,
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
}: {
  result: HomeSourceResult;
  t: (key: string, vars?: Readonly<Record<string, string | number>>) => string;
}) {
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
        <p role="status" className="text-sm text-muted-foreground">
          {result.statusReasonKey
            ? t(result.statusReasonKey)
            : t("home.source.unavailable")}
        </p>
      )}
    </section>
  );
}

/**
 * Authenticated contextual home. Sources load independently; one failure does
 * not erase other tiers. Mock fixtures stay out of production composition.
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
  const [chooserResult, setChooserResult] = useState<HomeSourceResult | null>(
    null,
  );
  const [chooserOpen, setChooserOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const clock = useMemo(() => now ?? new Date(), [now]);
  const greeting = useMemo(
    () =>
      buildHomeGreeting({
        displayName: session.displayName,
        profileTimeZone: session.timeZone,
        browserTimeZone:
          browserTimeZone === undefined
            ? readBrowserTimeZone()
            : browserTimeZone,
        now: clock,
      }),
    [session.displayName, session.timeZone, browserTimeZone, clock],
  );

  const greetingText = greeting.displayName
    ? t(`home.greeting.named.${greeting.dayPart}`, {
        name: greeting.displayName,
      })
    : t(`home.greeting.anonymous.${greeting.dayPart}`);

  const loadSources = useCallback(async () => {
    setLoading(true);
    const query = {
      locale,
      timeZone: greeting.timeZone,
      now: clock,
    };
    const [menuResult, inventoryResult, profileResult, chooser] =
      await Promise.all([
        adapter.loadMenuSource(query).catch(
          (): HomeSourceResult => ({
            tier: "menu",
            status: "failed",
            statusReasonKey: "home.source.failed.menu",
            items: [],
          }),
        ),
        adapter.loadInventorySource(query).catch(
          (): HomeSourceResult => ({
            tier: "inventory",
            status: "failed",
            statusReasonKey: "home.source.failed.inventory",
            items: [],
          }),
        ),
        adapter.loadProfileSource(query).catch(
          (): HomeSourceResult => ({
            tier: "profile",
            status: "failed",
            statusReasonKey: "home.source.failed.profile",
            items: [],
          }),
        ),
        adapter.getQuickChooserDefinition(query).catch(
          (): HomeQuickChooserDefinition => ({
            recommendationCapability: "unavailable",
            questions: [],
          }),
        ),
      ]);
    setMenu(menuResult);
    setInventory(inventoryResult);
    setProfile(profileResult);
    setChooserDef(chooser);
    setLoading(false);

    for (const result of [menuResult, inventoryResult, profileResult]) {
      if (result.status === "unavailable") {
        telemetry.track({
          name: "source_unavailable",
          codes: { tier: result.tier },
        });
      } else {
        telemetry.track({
          name: "source_rendered",
          codes: { tier: result.tier, status: result.status },
        });
      }
    }
  }, [adapter, locale, greeting.timeZone, clock, telemetry]);

  useEffect(() => {
    void loadSources();
  }, [loadSources, scenarioId]);

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
          <Button asChild variant="secondary" size="sm">
            <Link to="/app/despensa" data-testid="home-nav-pantry">
              {t("home.nav.pantry")}
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            data-testid="home-open-chooser"
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

      {loading ? (
        <p role="status">{t("home.loading")}</p>
      ) : (
        <div data-testid="home-sources" className="flex flex-col gap-10">
          {orderedSources.map((result) =>
            result ? (
              <SourceSection key={result.tier} result={result} t={t} />
            ) : null,
          )}

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

          {!hasAnyCandidate && !chooserResult ? (
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
      )}

      {chooserOpen && chooserDef ? (
        <QuickChooser
          definition={chooserDef}
          telemetry={telemetry}
          onCancel={() => setChooserOpen(false)}
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
