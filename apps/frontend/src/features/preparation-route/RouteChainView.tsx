import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChefHat,
  Package,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePreparationRoute } from "./PreparationRouteProvider";
import type { PreparationTaskState } from "@/contracts/preparation";
import { useStore } from "@/lib/store";

const MOCK_ROUTE_GROUPS = [
  { key: "monday", label: "Segunda à noite" },
  { key: "tuesdayAM", label: "Terça de manhã" },
  { key: "thursday", label: "Quinta à noite" },
];

const CHAIN_STATE: Record<
  PreparationTaskState,
  { icon: typeof Timer; cls: string }
> = {
  next: { icon: Timer, cls: "border-border bg-card" },
  canStart: { icon: ArrowRight, cls: "border-primary/50 bg-primary/5" },
  inProgress: { icon: ArrowRight, cls: "border-accent/50 bg-accent/10" },
  overdue: {
    icon: AlertTriangle,
    cls: "border-destructive/50 bg-destructive/10",
  },
  done: { icon: Check, cls: "border-primary bg-primary/15" },
  blocked: { icon: AlertTriangle, cls: "border-warning/40 bg-warning/10" },
};

export interface RouteChainViewProps {
  /** Optional cook handoff override (tests). */
  onCookRecipe?: (target: { targetRecipeId: string; forTitle: string }) => void;
}

/**
 * Full preparation-route chain for Plan.
 * Shares completion and cook-ready state with Home via PreparationRouteProvider.
 */
export function RouteChainView({
  onCookRecipe,
}: RouteChainViewProps = {}): ReactElement {
  const navigate = useNavigate();
  const { tr } = useStore();
  const {
    projection,
    markDone,
    getActiveCookTarget,
    buildCookPath,
    dismissCookCta,
  } = usePreparationRoute();

  const readyTargets = projection.readyTargets.filter((t) => !t.dismissed);
  const byGroup = MOCK_ROUTE_GROUPS.map((g) => ({
    ...g,
    items: projection.tasks.filter((c) => c.groupKey === g.key),
  }));

  const startCook = (target: { targetRecipeId: string; forTitle: string }) => {
    if (onCookRecipe) {
      onCookRecipe(target);
      return;
    }
    const full = projection.readyTargets.find(
      (t) => t.targetRecipeId === target.targetRecipeId,
    );
    if (full) navigate(buildCookPath(full));
    else navigate(`/app/cozinhar/${target.targetRecipeId}`);
  };

  const activeCook = getActiveCookTarget();
  const lastRequiredId = activeCook
    ? [...projection.tasks]
        .reverse()
        .find(
          (t) =>
            t.requiredForTarget &&
            t.targetRecipeId === activeCook.targetRecipeId,
        )?.id
    : null;

  return (
    <div data-testid="route-chain" className="space-y-4">
      {readyTargets.length > 0 ? (
        <div data-testid="route-chain-ready" className="space-y-2">
          {readyTargets.map((t) => (
            <Card
              key={t.targetRecipeId}
              data-testid={`chain-cook-ready-${t.targetRecipeId}`}
              className="flex flex-wrap items-center justify-between gap-3 border-primary/50 bg-primary/10 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/25 text-primary">
                  <ChefHat className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-primary">
                    {tr("plan.route.chainReady")}
                  </p>
                  <p className="truncate font-display text-base">
                    {t.forTitle} — {tr("plan.route.readyToCook")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {tr("plan.route.chainReadyHint")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid={`chain-cook-dismiss-${t.targetRecipeId}`}
                  onClick={() => dismissCookCta(t.targetRecipeId)}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  {tr("plan.route.later")}
                </button>
                <Button
                  size="sm"
                  data-testid={`chain-cook-start-${t.targetRecipeId}`}
                  onClick={() => startCook(t)}
                >
                  <ChefHat className="mr-1 h-4 w-4" />
                  {tr("plan.route.cookNow")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {byGroup.map(
        (g) =>
          g.items.length > 0 && (
            <div key={g.key} data-testid={`chain-group-${g.key}`}>
              <p className="mb-2 font-display text-sm">{g.label}</p>
              <ol className="ml-3 space-y-2 border-l-2 border-dashed border-border pl-5">
                {g.items.map((it) => {
                  const state = it.state;
                  const meta = CHAIN_STATE[state] || CHAIN_STATE.next;
                  const Icon = meta.icon;
                  const canToggle = state !== "blocked";
                  const marked = state === "done";
                  const isFocus =
                    it.isHighlighted && !marked && state !== "blocked";
                  return (
                    <li
                      key={it.id}
                      data-testid={`chain-item-${it.id}`}
                      data-state={state}
                      data-focus={isFocus ? "true" : "false"}
                      className="relative"
                    >
                      <span
                        className={`absolute -left-[26px] top-3 grid h-5 w-5 place-items-center rounded-full border ${meta.cls}`}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      <div
                        className={`rounded-2xl border p-3 ${
                          isFocus
                            ? "border-primary bg-primary/8 shadow-sm ring-1 ring-primary/25"
                            : meta.cls
                        }`}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="font-display text-sm tabular-nums">
                              {it.time}
                            </span>
                            <span className="pill bg-background/60 text-[10px]">
                              {tr(`plan.route.states.${state}`)}
                            </span>
                          </div>
                          <button
                            type="button"
                            data-testid={`chain-toggle-${it.id}`}
                            disabled={!canToggle && !marked}
                            onClick={() => {
                              if (!marked && canToggle) markDone(it.id);
                            }}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                              marked
                                ? "border-primary bg-primary text-primary-foreground"
                                : canToggle
                                  ? "border-primary/40 text-primary hover:bg-primary/10"
                                  : "border-border text-muted-foreground opacity-60"
                            }`}
                          >
                            <Check className="h-3 w-3" />{" "}
                            {marked
                              ? tr("plan.route.states.done")
                              : tr("plan.route.markDone")}
                          </button>
                        </div>
                        <p
                          className={`mt-1 text-sm ${
                            marked
                              ? "line-through text-muted-foreground"
                              : "font-medium"
                          }`}
                        >
                          {it.task}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {tr("plan.route.for")}: {it.forTitle}
                        </p>
                        {it.produces ? (
                          <p className="mt-1 text-[11px] text-primary">
                            <Package className="mr-1 inline h-3 w-3" />
                            Produz: {it.produces}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Ativo: {it.activeMin}m
                          {it.passiveMin ? ` · Passivo: ${it.passiveMin}m` : ""}
                        </p>
                        {activeCook &&
                        it.requiredForTarget &&
                        it.targetRecipeId === activeCook.targetRecipeId &&
                        it.id === lastRequiredId ? (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              data-testid={`chain-item-cook-${activeCook.targetRecipeId}`}
                              onClick={() => startCook(activeCook)}
                            >
                              <ChefHat className="mr-1 h-3.5 w-3.5" />
                              {tr("plan.route.cookNow")}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ),
      )}
    </div>
  );
}
