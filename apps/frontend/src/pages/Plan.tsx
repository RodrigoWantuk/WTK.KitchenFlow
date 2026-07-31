import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MealPickerDialog, MealReplaceDialog, MealMoveDialog, MissingReviewDialog, PrepAheadDialog, MarkDoneDialog, DAYS_PT, MEALS } from "@/components/plan/PlanDialogs";
import { RealityChangedDialog, ScheduleComponentDialog, SimulationDialog, RouteChainView } from "@/components/plan/PlanExtras";
import { PREP_AHEAD_BY_RECIPE } from "@/lib/mockData";
import { Plus, MoreHorizontal, ArrowRight, Check, PenLine, Flame, ShoppingBag, ChefHat, AlertTriangle, CalendarClock, Sparkles, ListChecks, Clock, X } from "lucide-react";
import { toast } from "sonner";

const DAY_SHORT = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

const STATE_STYLE: Record<string, { icon: typeof Check; cls: string; dot: string }> = {
  accepted:      { icon: Check,          cls: "border-primary/50 bg-primary/5",             dot: "bg-primary" },
  suggested:     { icon: Sparkles,       cls: "border-dashed border-accent/40 bg-accent/5", dot: "bg-accent" },
  draft:         { icon: PenLine,        cls: "border-dashed border-border bg-card",        dot: "bg-muted-foreground" },
  incomplete:    { icon: AlertTriangle,  cls: "border-warning/60 bg-warning/10",            dot: "bg-warning" },
  needsShopping: { icon: ShoppingBag,    cls: "border-warning/50 bg-warning/5",             dot: "bg-warning" },
  needsPrep:     { icon: Flame,          cls: "border-accent/60 bg-accent/10",              dot: "bg-accent" },
  done:          { icon: Check,          cls: "border-primary bg-primary/15",               dot: "bg-primary" },
  skipped:       { icon: X,              cls: "border-border bg-muted/40 opacity-80",       dot: "bg-muted-foreground" },
};

function StatePill({ entry, tr }: { entry: any; tr: (k: string) => string }) {
  const state = entry.state;
  const s = STATE_STYLE[state] || STATE_STYLE.draft;
  const Icon = s.icon;
  return (
    <div className="flex flex-wrap gap-1">
      <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] font-medium">
        <Icon className="h-3 w-3" /> {tr(`plan.states.${state}`)}
      </span>
      {entry._reconciliationPending && (
        <span data-testid={`reconcile-pending-${entry.id}`} className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-1.5 py-0.5 text-[10px] font-medium">
          <AlertTriangle className="h-3 w-3" /> {tr("plan.states.reconcilePending")}
        </span>
      )}
    </div>
  );
}

/* ---------- Weekly Summary Bar ---------- */
function SummaryBar({ plan, tr, onReviewMissing, onOpenPrep, prepPendingCount }: { plan: any[]; tr: (k: string) => string; onReviewMissing: () => void; onOpenPrep: () => void; prepPendingCount: number }) {
  const decided = plan.filter((p: any) => p.state === "accepted").length;
  const suggested = plan.filter((p: any) => p.state === "suggested").length;
  const drafts = plan.filter((p: any) => p.state === "draft").length;
  const done = plan.filter((p: any) => p.state === "done").length;
  const needsShopping = plan.filter((p: any) => p.state === "needsShopping").length;
  const needsPrep = plan.filter((p: any) => p.state === "needsPrep").length;
  const totalSlots = 7 * 2; // lunch + dinner as core slots
  const emptyCore = Math.max(0, totalSlots - plan.filter((p: any) => p.meal === "lunch" || p.meal === "dinner").length);

  const chip = (label: string, n: number, tone = "default") => (
    <div className={`rounded-xl border px-3 py-2 ${tone === "warn" ? "border-warning/40 bg-warning/10" : tone === "primary" ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <p className="font-display text-lg leading-none">{n}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );

  return (
    <div className="rounded-3xl border border-border bg-secondary/30 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg">Resumo da semana</p>
          <p className="text-xs text-muted-foreground">Planejar é intenção, não obrigação.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" data-testid="summary-open-prep" onClick={onOpenPrep} className="rounded-full">
            <Flame className="mr-1 h-4 w-4" /> Preparo antecipado {prepPendingCount > 0 && <span className="ml-1 rounded-full bg-accent/30 px-1.5 text-[10px]">{prepPendingCount}</span>}
          </Button>
          <Button size="sm" data-testid="summary-review-missing" onClick={onReviewMissing} className="rounded-full">
            <ListChecks className="mr-1 h-4 w-4" /> {tr("plan.sendMissing")}
          </Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {chip(tr("plan.summary.decided"), decided, "primary")}
        {chip(tr("plan.summary.suggested"), suggested)}
        {chip(tr("plan.summary.drafts"), drafts)}
        {chip(tr("plan.summary.empty"), emptyCore)}
        {chip(tr("plan.summary.needsShopping"), needsShopping, "warn")}
        {chip(tr("plan.summary.needsPrep"), needsPrep)}
      </div>
    </div>
  );
}

/* ---------- Cell (desktop grid) ---------- */
function MealCell({ entries, recipes, day, meal, onOpenPicker, onAction, tr }: { entries: any[]; recipes: any[]; day: number; meal: string; onOpenPicker: (slot: { day: number; meal: string }) => void; onAction: (action: string, entry: any) => void; tr: (k: string) => string }) {
  if (!entries || entries.length === 0) {
    return (
      <button
        data-testid={`plan-cell-${day}-${meal}`}
        onClick={() => onOpenPicker({ day, meal })}
        className="group flex min-h-[80px] w-full flex-col items-start justify-start rounded-xl border border-dashed border-border p-2 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
      >
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{tr(`plan.${meal}`)}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
          <Plus className="h-3 w-3" /> {tr("plan.addMeal")}
        </span>
      </button>
    );
  }
  return (
    <div data-testid={`plan-cell-${day}-${meal}`} className="space-y-1.5">
      {entries.map((entry: any) => {
        const r = recipes.find((x: any) => x.id === entry.recipeId);
        const s = STATE_STYLE[entry.state] || STATE_STYLE.draft;
        const canMarkDone = entry.state !== "done" && entry.state !== "skipped";
        const replacedTitle = entry._replacedFrom ? (recipes.find((x: any) => x.id === entry._replacedFrom)?.title) : null;
        return (
          <div key={entry.id} data-testid={`plan-entry-${entry.id}`} className={`min-h-[80px] rounded-xl border p-2 ${s.cls}`}>
            <div className="flex items-start justify-between gap-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{tr(`plan.${meal}`)}</p>
              <div className="flex items-center gap-0.5">
                {canMarkDone && (
                  <button
                    data-testid={`plan-quickdone-${entry.id}`}
                    onClick={(e) => { e.stopPropagation(); onAction("markDone", entry); }}
                    aria-label={tr("plan.actions.markDone")}
                    title={tr("plan.actions.markDone")}
                    className="rounded-md p-1 text-muted-foreground hover:bg-primary/15 hover:text-primary"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
                <MealMenu entry={entry} onAction={onAction} tr={tr} />
              </div>
            </div>
            {r ? (
              <Link to={`/app/receitas/${r.id}`} data-testid={`plan-open-${entry.id}`} className={`mt-0.5 block truncate font-medium leading-tight hover:underline ${entry.state === "skipped" ? "line-through text-muted-foreground" : ""}`}>{r.title}</Link>
            ) : (
              <p className="mt-0.5 text-sm text-muted-foreground">Sem receita</p>
            )}
            {replacedTitle && (
              <p data-testid={`plan-replaced-${entry.id}`} className="mt-0.5 text-[10px] text-muted-foreground italic">{tr("plan.replacedFrom")} "{replacedTitle}"</p>
            )}
            <div className="mt-1"><StatePill entry={entry} tr={tr} /></div>
            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{tr(`plan.stateHints.${entry.state}`)}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Action Menu ---------- */
function MealMenu({ entry, onAction, tr }: { entry: any; onAction: (action: string, entry: any) => void; tr: (k: string) => string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button data-testid={`plan-menu-${entry.id}`} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {entry.state === "suggested" && <DropdownMenuItem data-testid={`plan-action-accept-${entry.id}`} onClick={() => onAction("accept", entry)}><Check className="mr-2 h-4 w-4" />{tr("plan.actions.accept")}</DropdownMenuItem>}
        <DropdownMenuItem data-testid={`plan-action-open-${entry.id}`} onClick={() => onAction("open", entry)}><ArrowRight className="mr-2 h-4 w-4" />{tr("plan.actions.open")}</DropdownMenuItem>
        <DropdownMenuItem data-testid={`plan-action-replace-${entry.id}`} onClick={() => onAction("replace", entry)}><Sparkles className="mr-2 h-4 w-4" />{tr("plan.actions.replace")}</DropdownMenuItem>
        <DropdownMenuItem data-testid={`plan-action-move-${entry.id}`} onClick={() => onAction("move", entry)}><CalendarClock className="mr-2 h-4 w-4" />{tr("plan.actions.move")}</DropdownMenuItem>
        <DropdownMenuItem data-testid={`plan-action-todraft-${entry.id}`} onClick={() => onAction("toDraft", entry)}><PenLine className="mr-2 h-4 w-4" />{tr("plan.actions.toDraft")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem data-testid={`plan-action-addmissing-${entry.id}`} onClick={() => onAction("addMissing", entry)}><ShoppingBag className="mr-2 h-4 w-4" />{tr("plan.actions.addMissing")}</DropdownMenuItem>
        <DropdownMenuItem data-testid={`plan-action-startprep-${entry.id}`} onClick={() => onAction("startPrep", entry)}><ChefHat className="mr-2 h-4 w-4" />{tr("plan.actions.startPrep")}</DropdownMenuItem>
        {entry.state !== "done" && <DropdownMenuItem data-testid={`plan-action-markdone-${entry.id}`} onClick={() => onAction("markDone", entry)}><Check className="mr-2 h-4 w-4" />{tr("plan.actions.markDone")}</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem data-testid={`plan-action-remove-${entry.id}`} onClick={() => onAction("remove", entry)} className="text-destructive"><X className="mr-2 h-4 w-4" />{tr("plan.actions.remove")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- Mobile Row ---------- */
function MealRow({ entry, recipes, tr, onAction }: { entry: any; recipes: any[]; tr: (k: string) => string; onAction: (action: string, entry: any) => void }) {
  const r = recipes.find((x: any) => x.id === entry.recipeId);
  const s = STATE_STYLE[entry.state] || STATE_STYLE.draft;
  const replacedTitle = entry._replacedFrom ? (recipes.find((x: any) => x.id === entry._replacedFrom)?.title) : null;
  const primary = entry.state === "suggested" ? { key: "accept", label: tr("plan.actions.accept") }
    : entry.state === "needsShopping" ? { key: "addMissing", label: tr("plan.actions.addMissing") }
    : entry.state === "needsPrep" ? { key: "startPrep", label: tr("plan.actions.startPrep") }
    : entry.state === "draft" || entry.state === "incomplete" ? { key: "replace", label: tr("plan.actions.replace") }
    : entry.state === "done" ? { key: "open", label: tr("plan.actions.open") }
    : entry.state === "skipped" ? { key: "replace", label: tr("plan.actions.replace") }
    : { key: "markDone", label: tr("plan.actions.markDone") };

  return (
    <div data-testid={`plan-row-${entry.id}`} className={`rounded-2xl border p-3 ${s.cls}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{tr(`plan.${entry.meal}`)}</p>
          <p className={`truncate text-sm font-medium ${entry.state === "skipped" ? "line-through text-muted-foreground" : ""}`}>{r?.title || "Sem receita"}</p>
          {replacedTitle && <p data-testid={`plan-row-replaced-${entry.id}`} className="text-[10px] italic text-muted-foreground">{tr("plan.replacedFrom")} "{replacedTitle}"</p>}
          <div className="mt-1"><StatePill entry={entry} tr={tr} /></div>
          <p className="mt-1 text-[11px] text-muted-foreground">{tr(`plan.stateHints.${entry.state}`)}</p>
        </div>
        <MealMenu entry={entry} onAction={onAction} tr={tr} />
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" data-testid={`plan-primary-${entry.id}`} onClick={() => onAction(primary.key, entry)}>{primary.label}</Button>
        <Button size="sm" variant="outline" data-testid={`plan-secondary-${entry.id}`} onClick={() => onAction("open", entry)}>{tr("plan.actions.open")}</Button>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Plan() {
  const store = useStore();
  const { tr, plan, recipes, addPlan, removePlan, acceptSuggestion, replaceMeal, moveMeal, updatePlan, setMealState, addMissingToShopping, markMealDone, scenario } = store;
  const navigate = useNavigate();

  const [picker, setPicker] = useState<{ open: boolean; slot: { day: number; meal: string } | null }>({ open: false, slot: null });
  const [replace, setReplace] = useState<{ open: boolean; entry: any | null }>({ open: false, entry: null });
  const [move, setMove] = useState<{ open: boolean; entry: any | null }>({ open: false, entry: null });
  const [missing, setMissing] = useState(false);
  const [prep, setPrep] = useState(false);
  const [prepDone, setPrepDone] = useState(new Set<string>());
  const [activeDay, setActiveDay] = useState(0);
  const [markDone, setMarkDone] = useState<{ open: boolean; entry: any | null }>({ open: false, entry: null });
  const [realityOpen, setRealityOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const showRouteChain = scenario === "routeWithDeps";

  const _dow = new Date().getDay();
  const todayIdx = _dow === 0 ? 6 : _dow - 1;

  // Derived: prep-ahead items for all planned meals
  const prepItems = useMemo(() => {
    const out: any[] = [];
    plan.forEach(p => {
      const list = (PREP_AHEAD_BY_RECIPE as Record<string, any[]>)[p.recipeId ?? ""] || [];
      list.forEach((pa: any) => out.push({ ...pa, planId: p.id, recipeId: p.recipeId, recipeTitle: recipes.find(r => r.id === p.recipeId)?.title, day: p.day, meal: p.meal }));
    });
    return out;
  }, [plan, recipes]);
  const prepPendingCount = prepItems.length - prepDone.size;

  const handleAction = (action: string, entry: any) => {
    switch (action) {
      case "open": navigate(`/app/receitas/${entry.recipeId}`); break;
      case "accept": acceptSuggestion(entry.id); toast.success("Sugestão aceita"); break;
      case "replace": setReplace({ open: true, entry }); break;
      case "move": setMove({ open: true, entry }); break;
      case "toDraft": setMealState(entry.id, "draft"); toast("Movido para rascunho"); break;
      case "remove": removePlan(entry.id); toast("Removido do planejamento"); break;
      case "addMissing":
        addMissingToShopping(entry.recipeId);
        updatePlan(entry.id, { state: "accepted" });
        toast.success("Faltantes enviados às compras");
        break;
      case "startPrep":
        toast("Marcado como preparo iniciado");
        updatePlan(entry.id, { state: "accepted" });
        break;
      case "markDone": setMarkDone({ open: true, entry }); break;
      default: break;
    }
  };

  const handleMarkDoneConfirm = (mode: string) => {
    const entry = markDone.entry;
    if (!entry) return;
    if (mode === "review") {
      setMarkDone({ open: false, entry: null });
      navigate(`/app/cozinhar/${entry.recipeId}?phase=finish&planId=${entry.id}`);
      return;
    }
    markMealDone(entry.id, mode);
    setMarkDone({ open: false, entry: null });
    toast.success(mode === "skipped" ? tr("plan.markedSkipped") : tr("plan.markedDone"));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">{tr("plan.title")}</h1>
        <p className="text-sm text-muted-foreground">{tr("plan.week")}</p>
      </div>

      <SummaryBar
        plan={plan}
        tr={tr}
        onReviewMissing={() => setMissing(true)}
        onOpenPrep={() => setPrep(true)}
        prepPendingCount={prepPendingCount}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" data-testid="open-reality-changed" onClick={() => setRealityOpen(true)}>A realidade mudou</Button>
        <Button variant="outline" data-testid="open-week-simulation" onClick={() => setSimOpen(true)}>Simular semana (A vs B)</Button>
        <Button variant="outline" data-testid="open-schedule-component" onClick={() => setScheduleOpen(true)}>Agendar preparo de componente</Button>
      </div>

      {showRouteChain && (
        <section data-testid="plan-route-chain-section" className="rounded-3xl border border-border bg-secondary/30 p-4 md:p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <p className="font-display text-lg">Rota com dependências</p>
              <p className="text-xs text-muted-foreground">Uma preparação libera as próximas quando concluída.</p>
            </div>
          </div>
          <RouteChainView />
        </section>
      )}

      {/* Desktop grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2">
          <div />
          {DAY_SHORT.map((d, i) => (
            <div key={i} className="px-1 pb-1 text-center">
              <p className="font-display text-sm">{d}</p>
              <p className="text-[10px] text-muted-foreground">{DAYS_PT[i]}</p>
            </div>
          ))}
          {["lunch","dinner"].map(meal => (
            <div key={meal} className="contents">
              <div className="flex items-center justify-end pr-2 text-xs uppercase tracking-wider text-muted-foreground">{tr(`plan.${meal}`)}</div>
              {[0,1,2,3,4,5,6].map(day => {
                const entries = plan.filter(p => p.day === day && p.meal === meal);
                return (
                  <MealCell
                    key={`${day}-${meal}`}
                    entries={entries}
                    recipes={recipes}
                    day={day}
                    meal={meal}
                    onOpenPicker={(slot: { day: number; meal: string }) => setPicker({ open: true, slot })}
                    onAction={handleAction}
                    tr={tr}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Show extra meals (breakfast/snack) inline as a lighter row if any exist */}
        {plan.some(p => p.meal === "breakfast" || p.meal === "snack") && (
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Outras refeições</p>
            <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2">
              <div />
              {DAY_SHORT.map((_, i) => <div key={i} />)}
              {["breakfast","snack"].map(meal => (
                <div key={meal} className="contents">
                  <div className="flex items-center justify-end pr-2 text-xs uppercase tracking-wider text-muted-foreground">{tr(`plan.${meal}`)}</div>
                  {[0,1,2,3,4,5,6].map(day => {
                    const entries = plan.filter(p => p.day === day && p.meal === meal);
                    if (!entries.length) return <div key={`${day}-${meal}`} />;
                    return <MealCell key={`${day}-${meal}`} entries={entries} recipes={recipes} day={day} meal={meal} onOpenPicker={(slot: { day: number; meal: string }) => setPicker({ open: true, slot })} onAction={handleAction} tr={tr} />;
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-4">
        {/* Sticky day nav */}
        <div className="sticky top-16 z-30 -mx-4 flex gap-1.5 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
          {DAY_SHORT.map((d, i) => {
            const dayPlan = plan.filter(p => p.day === i);
            const active = activeDay === i;
            return (
              <button key={i} data-testid={`plan-day-tab-${i}`} onClick={() => setActiveDay(i)} className={`flex flex-col items-center rounded-xl px-3 py-1.5 text-xs ${active ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}>
                <span className="font-display">{d}</span>
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full" style={{ background: dayPlan.length ? "currentColor" : "transparent", opacity: 0.6 }} />
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">{DAYS_PT[activeDay]}</h2>
            <span className="text-xs text-muted-foreground">{plan.filter(p => p.day === activeDay).length} refeições</span>
          </div>
          {MEALS.map(meal => {
            const entries = plan.filter(p => p.day === activeDay && p.meal === meal);
            if (!entries.length) {
              return (
                <button
                  key={meal}
                  data-testid={`plan-mobile-add-${activeDay}-${meal}`}
                  onClick={() => setPicker({ open: true, slot: { day: activeDay, meal } })}
                  className="flex w-full items-center justify-between rounded-2xl border border-dashed border-border bg-card p-4 text-left"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{tr(`plan.${meal}`)}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{tr("plan.empty")} — {tr("plan.emptyHint")}</p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            }
            return entries.map(entry => <MealRow key={entry.id} entry={entry} recipes={recipes} tr={tr} onAction={handleAction} />);
          })}
        </div>
      </div>

      {/* Dialogs */}
      <MealPickerDialog
        open={picker.open}
        onOpenChange={(o: boolean) => setPicker(p => ({ ...p, open: o }))}
        slot={picker.slot}
        recipes={recipes}
        plan={plan}
        addPlan={addPlan}
        tr={tr}
      />
      <MealReplaceDialog
        open={replace.open}
        onOpenChange={(o: boolean) => setReplace(r => ({ ...r, open: o }))}
        entry={replace.entry}
        recipes={recipes}
        replaceMeal={replaceMeal}
        tr={tr}
      />
      <MealMoveDialog
        open={move.open}
        onOpenChange={(o: boolean) => setMove(m => ({ ...m, open: o }))}
        entry={move.entry}
        plan={plan}
        recipes={recipes}
        moveMeal={moveMeal}
        tr={tr}
      />
      <MissingReviewDialog
        open={missing}
        onOpenChange={setMissing}
        plan={plan}
        recipes={recipes}
        shopping={store.shopping}
        sendItemsToShopping={store.sendItemsToShopping}
        tr={tr}
      />
      <PrepAheadDialog
        open={prep}
        onOpenChange={setPrep}
        prepItems={prepItems}
        doneKeys={prepDone}
        onMarkDone={(k: string) => setPrepDone(s => new Set(s).add(k))}
        onStart={() => toast("Preparo iniciado")}
        tr={tr}
        scenario={scenario}
        todayIdx={todayIdx}
      />
      <MarkDoneDialog
        open={markDone.open}
        onOpenChange={(o: boolean) => setMarkDone(m => ({ ...m, open: o }))}
        entry={markDone.entry}
        recipes={recipes}
        onConfirm={handleMarkDoneConfirm}
        tr={tr}
      />
      <RealityChangedDialog open={realityOpen} onOpenChange={setRealityOpen} onApply={() => toast.success("Recuperação localizada aplicada")} />
      <ScheduleComponentDialog open={scheduleOpen} onOpenChange={setScheduleOpen} onConfirm={() => toast.success("Preparo agendado — componente aparecerá na despensa")} />
      <SimulationDialog open={simOpen} onOpenChange={setSimOpen} onAccept={(k: string) => toast.success(`Plano ${k} aceito`)} />
    </div>
  );
}
