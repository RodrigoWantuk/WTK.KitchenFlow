import type { KeyboardEvent, ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Check, ChefHat, Clock, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreparationRoute } from "./PreparationRouteProvider";
import type {
  PreparationRouteTaskView,
  PreparationTaskState,
} from "@/contracts/preparation";
import { isCookTargetReady } from "./cookTargetReady";

const ROUTE_STATE: Record<
  PreparationTaskState,
  { icon: typeof Clock; cls: string }
> = {
  next: { icon: Clock, cls: "border-border bg-card" },
  canStart: { icon: Play, cls: "border-primary/40 bg-primary/5" },
  inProgress: { icon: Play, cls: "border-accent/50 bg-accent/10" },
  overdue: {
    icon: AlertTriangle,
    cls: "border-destructive/50 bg-destructive/10",
  },
  done: { icon: Check, cls: "border-primary bg-primary/15" },
  blocked: { icon: X, cls: "border-warning/40 bg-warning/10" },
};

export interface HomeRouteCarouselProps {
  /** Translator from the app store. */
  tr: (key: string) => string;
  /**
   * When false, hide the carousel entirely (no empty decorative section).
   * Defaults to showing when the shared route has tasks.
   */
  enabled?: boolean;
}

/**
 * Compact horizontal preparation-route carousel for Home.
 * Uses the shared preparation-route repository — never a local Set of completed ids.
 */
export function HomeRouteCarousel({
  tr,
  enabled = true,
}: HomeRouteCarouselProps): ReactElement | null {
  const nav = useNavigate();
  const {
    projection,
    markDone,
    startNow,
    getActiveCookTarget,
    buildCookPath,
    dismissCookCta,
  } = usePreparationRoute();

  if (!enabled || projection.tasks.length === 0) return null;

  const cookTarget = getActiveCookTarget();
  /** Persistent Home banner — only tasks for this targetRecipeId count. */
  const showBannerCook =
    !!cookTarget &&
    isCookTargetReady(projection.tasks, cookTarget.targetRecipeId);

  const lastRequiredId = cookTarget
    ? [...projection.tasks]
        .reverse()
        .find(
          (t) =>
            t.requiredForTarget &&
            t.targetRecipeId === cookTarget.targetRecipeId,
        )?.id
    : null;

  return (
    <section data-testid="home-route-block">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">{tr("plan.route.homeTitle")}</h2>
        <button
          data-testid="home-route-open"
          type="button"
          onClick={() => nav("/app/planejamento")}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {tr("plan.route.openFull")}
        </button>
      </div>
      {showBannerCook && cookTarget ? (
        <div
          data-testid={`home-route-cook-ready-${cookTarget.targetRecipeId}`}
          className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-3"
        >
          <p className="text-sm font-medium">
            {cookTarget.forTitle} — {tr("plan.route.readyToCook")}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid={`home-route-cook-later-${cookTarget.targetRecipeId}`}
              className="text-xs text-muted-foreground underline underline-offset-4"
              onClick={() => dismissCookCta(cookTarget.targetRecipeId)}
            >
              {tr("plan.route.later")}
            </button>
            <Button
              size="sm"
              data-testid={`home-route-cook-now-${cookTarget.targetRecipeId}`}
              onClick={() => nav(buildCookPath(cookTarget))}
            >
              <ChefHat className="mr-1 h-4 w-4" />
              {tr("plan.route.cookNow")}
            </Button>
          </div>
        </div>
      ) : null}
      <div
        className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        data-testid="home-route-carousel"
      >
        <ol
          data-testid="home-route-carousel-list"
          className="flex snap-x snap-mandatory gap-3 pb-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          tabIndex={0}
          onKeyDown={(event: KeyboardEvent<HTMLOListElement>) => {
            const scroller = event.currentTarget.parentElement;
            if (!scroller) return;
            const reduce =
              typeof window !== "undefined" &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const behavior = reduce ? "auto" : "smooth";
            if (event.key === "ArrowRight") {
              scroller.scrollBy({ left: 240, behavior });
              event.preventDefault();
            }
            if (event.key === "ArrowLeft") {
              scroller.scrollBy({ left: -240, behavior });
              event.preventDefault();
            }
          }}
        >
          {projection.tasks.map((task) => (
            <HomeRouteCard
              key={task.id}
              task={task}
              tr={tr}
              onDone={() => markDone(task.id)}
              onStart={() => startNow(task.id)}
              unlockHint={
                showBannerCook && cookTarget && task.id === lastRequiredId
                  ? cookTarget.forTitle
                  : null
              }
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function HomeRouteCard({
  task,
  tr,
  onDone,
  onStart,
  unlockHint,
}: {
  task: PreparationRouteTaskView;
  tr: (key: string) => string;
  onDone: () => void;
  onStart: () => void;
  unlockHint: string | null;
}) {
  const isFocus =
    task.isHighlighted && task.state !== "blocked" && task.state !== "done";
  const meta = ROUTE_STATE[task.state] || ROUTE_STATE.next;
  const Icon = meta.icon;
  const cardCls =
    task.state === "done"
      ? "border-primary/40 bg-primary/5 opacity-80"
      : isFocus
        ? "border-primary bg-primary/8 shadow-sm ring-1 ring-primary/25"
        : `${meta.cls} opacity-95`;

  return (
    <li
      data-testid={`home-route-card-${task.id}`}
      data-focus={isFocus ? "true" : "false"}
      data-state={task.state}
      className={`min-w-[220px] max-w-[260px] shrink-0 snap-start rounded-2xl border p-3 transition-shadow ${cardCls}`}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-background/70">
          <Icon className="h-3.5 w-3.5" />
        </span>
        {task.time ? (
          <span className="font-display text-sm tabular-nums">{task.time}</span>
        ) : null}
        {isFocus ? (
          <span className="pill bg-primary/25 text-[10px] font-medium">
            {tr("plan.route.nextTag")}
          </span>
        ) : null}
        {!isFocus && task.state !== "done" ? (
          <span className="pill bg-background/70 text-[10px]">
            {tr(`plan.route.states.${task.state}`)}
          </span>
        ) : null}
        {task.state === "done" ? (
          <span className="pill bg-primary/20 text-[10px]">
            {tr("plan.route.states.done")}
          </span>
        ) : null}
      </div>
      <p
        className={`mt-2 line-clamp-2 text-sm ${
          task.state === "done"
            ? "line-through text-muted-foreground"
            : "font-medium"
        }`}
      >
        {task.task}
      </p>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
        {tr("plan.route.for")}: {task.forTitle}
      </p>
      {isFocus ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Button
            size="sm"
            data-testid={`home-route-start-${task.id}`}
            onClick={onStart}
          >
            {tr("plan.route.startNow")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            data-testid={`home-route-done-${task.id}`}
            onClick={onDone}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            {tr("plan.route.markDone")}
          </Button>
        </div>
      ) : null}
      {unlockHint ? (
        <p
          data-testid={`home-route-card-unlocked-${task.targetRecipeId ?? "none"}`}
          className="mt-2 text-[11px] text-primary"
        >
          {unlockHint} — {tr("plan.route.readyToCook")}
        </p>
      ) : null}
    </li>
  );
}
