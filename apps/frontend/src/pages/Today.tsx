import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Clock,
  Sparkles,
  ChefHat,
  Info,
  Play,
  Pause,
  ShoppingBag,
  ArrowRight,
  HelpCircle,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  PREP_AHEAD_BY_RECIPE,
  MOCK_PANTRY_UNCERTAINTY_QUESTION,
} from "@/lib/mockData";
import { toast } from "sonner";
import { RealityChangedDialog } from "@/components/plan/PlanExtras";
import { HomeRouteCarousel } from "@/features/preparation-route/HomeRouteCarousel";

function whyLabel(r: any) {
  if (r.missing.length === 0) return "Você já tem todos os ingredientes";
  if (r.missing.length === 1)
    return `Falta apenas ${r.missing[0].name.toLowerCase()}`;
  if (r.tags?.includes("usa atenção"))
    return "Usa alimentos que precisam de atenção";
  if (r.tags?.includes("rápido") || r.totalTime <= 15)
    return "Fica pronto rapidamente";
  if (r.cleanup === 1) return "Exige pouca limpeza";
  return "Combina com suas preferências";
}

function SuggestionCard({ r, tr }: { r: any; tr: (k: string) => string }) {
  return (
    <Card
      data-testid={`suggestion-${r.id}`}
      className="overflow-hidden card-hover"
    >
      <div className="grid grid-cols-[110px_1fr] gap-0 sm:grid-cols-[160px_1fr]">
        <img
          src={r.image}
          alt={r.title}
          className="h-full w-full object-cover"
        />
        <div className="p-4">
          <span className="pill bg-secondary/70 text-foreground/80">
            <Sparkles className="h-3 w-3 text-accent" />
            {whyLabel(r)}
          </span>
          <h3 className="mt-2 font-display text-lg leading-tight">{r.title}</h3>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {r.totalTime} min
            </span>
            <span>
              {r.have}/{r.total} ingredientes
            </span>
            <span>{["", "Fácil", "Média", "Difícil"][r.difficulty]}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to={`/app/receitas/${r.id}`}>
              <Button size="sm" data-testid={`sugg-open-${r.id}`}>
                {tr("today.startCook")}{" "}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Today() {
  const store = useStore();
  const {
    tr,
    profile,
    recipes,
    plan,
    activity,
    pantry,
    smartAvailable,
    scenario,
  } = store;
  const nav = useNavigate();
  const [askOpen, setAsk] = useState(false);
  const [pref, setPref] = useState<{
    time: string | null;
    mood: string | null;
  }>({ time: null, mood: null });
  const [realityOpen, setRealityOpen] = useState(false);
  const [uncertaintyAnswer, setUncertaintyAnswer] = useState<string | null>(
    null,
  );
  const showUncertaintyQ = scenario === "uncertainQty";

  const dow = new Date().getDay();
  const now = new Date().getHours();
  const currentMeal =
    now < 10 ? "breakfast" : now < 15 ? "lunch" : now < 18 ? "snack" : "dinner";
  const todayIdx = dow === 0 ? 6 : dow - 1;
  const exactMatch = plan.find(
    (p) => p.day === todayIdx && p.meal === currentMeal,
  );
  const fallbackToday = !exactMatch
    ? plan.find((p) => p.day === todayIdx)
    : null;
  const plannedNow = exactMatch || fallbackToday;
  const plannedRecipe = plannedNow
    ? recipes.find((r) => r.id === plannedNow.recipeId)
    : null;
  const todayEntries = plan.filter((p) => p.day === todayIdx);
  const hasAnyToday = todayEntries.length > 0;
  const prepPendingToday = todayEntries.some((p) => p.state === "needsPrep");
  const replacedRecipe = plannedNow?._replacedFrom
    ? recipes.find((r) => r.id === plannedNow._replacedFrom)
    : null;

  // Today's prep tasks for the route block
  const todayTasks = useMemo(() => {
    const out: any[] = [];
    todayEntries.forEach((p) => {
      const list =
        (PREP_AHEAD_BY_RECIPE as Record<string, any[]>)[p.recipeId ?? ""] || [];
      list.forEach((pa: any) =>
        out.push({
          ...pa,
          planId: p.id,
          recipeTitle: recipes.find((r) => r.id === p.recipeId)?.title,
          meal: p.meal,
        }),
      );
    });
    // sort by time ascending
    return out.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [todayEntries, recipes]);

  let suggestions = recipes;
  if (pref.time === "fast")
    suggestions = suggestions.filter((r) => r.totalTime <= 20);
  if (pref.mood === "light")
    suggestions = suggestions.filter((r) => r.effort <= 1);
  suggestions = [...suggestions]
    .sort((a, b) => b.have / b.total - a.have / a.total)
    .slice(0, 4);

  const attentionCount = pantry.filter((p) => p.attention).length;

  const isDone = plannedNow?.state === "done";
  const isSkipped = plannedNow?.state === "skipped";
  const reconcilePending = !!plannedNow?._reconciliationPending;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          {tr("today.hello")}, {profile.name}.
        </p>
        <h1 className="font-display text-4xl md:text-5xl">
          {tr("today.question")}
        </h1>
      </div>

      {activity && (
        <Card
          data-testid="activity-card"
          className="border-accent/40 bg-accent/10 p-5"
        >
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/25 text-accent">
              {activity.paused ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </span>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-accent">
                {tr("today.resume")}
              </p>
              <h3 className="font-display text-xl">
                {recipes.find((r) => r.id === activity.recipeId)?.title ||
                  "Preparo"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Você parou no passo {(activity.step ?? 0) + 1}. Próximo:
                continuar o preparo com calma.
              </p>
            </div>
            <Link to={`/app/cozinhar/${activity.recipeId}`}>
              <Button data-testid="activity-resume">Continuar</Button>
            </Link>
          </div>
        </Card>
      )}

      {plannedRecipe && (
        <section>
          <h2 className="mb-3 font-display text-2xl">
            {isDone
              ? tr("today.doneTitle")
              : isSkipped
                ? tr("today.skippedTitle")
                : tr("today.planned")}
          </h2>
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-[220px_1fr]">
              <img
                src={plannedRecipe.image}
                alt={plannedRecipe.title}
                className={`h-40 w-full object-cover md:h-full ${isSkipped ? "opacity-60 grayscale" : ""}`}
              />
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`pill ${isDone ? "bg-primary/20 text-foreground" : isSkipped ? "bg-muted/60 text-muted-foreground" : plannedNow!.state === "accepted" ? "bg-primary/15 text-foreground" : plannedNow!.state === "suggested" ? "bg-accent/15 text-foreground" : "bg-warning/15 text-foreground/80"}`}
                    data-testid="planned-state"
                  >
                    {isDone && <Check className="h-3 w-3" />}
                    {isSkipped && <X className="h-3 w-3" />}
                    {tr(`plan.states.${plannedNow!.state}`)}
                  </span>
                  {reconcilePending && (
                    <span
                      data-testid="planned-reconcile-pending"
                      className="pill bg-warning/20 text-foreground/80"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {tr("plan.states.reconcilePending")}
                    </span>
                  )}
                  {replacedRecipe && (
                    <span
                      className="pill bg-secondary text-foreground/80"
                      data-testid="planned-replaced"
                    >
                      {tr("plan.replacedFrom")} "{replacedRecipe.title}"
                    </span>
                  )}
                  {!isDone &&
                    !isSkipped &&
                    plannedRecipe.missing.length > 0 && (
                      <span
                        className="pill bg-warning/15 text-foreground/80"
                        data-testid="planned-missing"
                      >
                        {plannedRecipe.missing.length} faltantes
                      </span>
                    )}
                </div>
                <h3
                  className={`mt-2 font-display text-2xl ${isSkipped ? "line-through text-muted-foreground" : ""}`}
                >
                  {plannedRecipe.title}
                </h3>
                {!isSkipped && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plannedRecipe.description}
                  </p>
                )}
                {isDone && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {reconcilePending
                      ? tr("plan.stateHints.reconcilePending")
                      : tr("plan.stateHints.done")}
                  </p>
                )}
                {isSkipped && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tr("plan.stateHints.skipped")}
                  </p>
                )}
                {!isDone && !isSkipped && (
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {plannedRecipe.totalTime} min
                    </span>
                    <span>
                      {plannedRecipe.have}/{plannedRecipe.total} ingredientes
                      disponíveis
                    </span>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {isDone ? (
                    <>
                      {reconcilePending && (
                        <Button
                          data-testid="planned-reconcile"
                          onClick={() =>
                            nav(
                              `/app/cozinhar/${plannedRecipe.id}?phase=finish&planId=${plannedNow!.id}`,
                            )
                          }
                        >
                          {tr("today.reconcile")}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        data-testid="planned-review"
                        onClick={() =>
                          nav(
                            `/app/cozinhar/${plannedRecipe.id}?phase=finish&planId=${plannedNow.id}`,
                          )
                        }
                      >
                        {tr("today.reviewRecord")}
                      </Button>
                      <Link to={`/app/receitas/${plannedRecipe.id}`}>
                        <Button variant="ghost" data-testid="planned-view">
                          {tr("today.viewRecipe")}
                        </Button>
                      </Link>
                    </>
                  ) : isSkipped ? (
                    <>
                      <Link to={`/app/receitas/${plannedRecipe.id}`}>
                        <Button variant="outline" data-testid="planned-view">
                          {tr("today.viewRecipe")}
                        </Button>
                      </Link>
                      <Link to="/app/planejamento">
                        <Button
                          variant="ghost"
                          data-testid="planned-replace-skipped"
                        >
                          {tr("today.replace")}
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to={`/app/receitas/${plannedRecipe.id}`}>
                        <Button data-testid="planned-open">
                          {tr("today.startCook")}
                        </Button>
                      </Link>
                      <Button variant="outline" data-testid="planned-adapt">
                        {tr("today.adapt")}
                      </Button>
                      <Link to="/app/planejamento">
                        <Button variant="outline" data-testid="planned-replace">
                          {tr("today.replace")}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      <HomeRouteCarousel
        tr={tr}
        enabled={
          scenario === "routeWithDeps" ||
          scenario === "routePartial" ||
          scenario === "routeOverdue" ||
          !!todayTasks.length
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          data-testid="today-open-reality"
          onClick={() => setRealityOpen(true)}
        >
          A realidade mudou
        </Button>
        <Link to="/app/planejamento">
          <Button variant="outline" size="sm" data-testid="today-open-plan">
            Abrir planejamento
          </Button>
        </Link>
      </div>

      {showUncertaintyQ && !uncertaintyAnswer && (
        <Card
          data-testid="uncertainty-question"
          className="border-accent/40 bg-accent/10 p-4"
        >
          <p className="text-xs uppercase tracking-wider text-accent">
            Confirmação contextual
          </p>
          <p className="mt-1 text-sm">
            {MOCK_PANTRY_UNCERTAINTY_QUESTION.question}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MOCK_PANTRY_UNCERTAINTY_QUESTION.options.map((o, i) => (
              <Button
                key={i}
                size="sm"
                variant={i === 0 ? "default" : "outline"}
                data-testid={`uncertainty-opt-${i}`}
                onClick={() => {
                  setUncertaintyAnswer(o);
                  toast.success("Confirmado");
                }}
              >
                {o}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <RealityChangedDialog
        open={realityOpen}
        onOpenChange={setRealityOpen}
        onApply={() => toast.success("Recuperação localizada aplicada")}
      />

      {prepPendingToday && !todayTasks.length && (
        <div
          data-testid="today-prep-pending"
          className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4"
        >
          <Sparkles className="mt-0.5 h-4 w-4 text-accent" />
          <div className="flex-1 text-sm">
            <p className="font-medium">Preparação antecipada pendente</p>
            <p className="text-muted-foreground">
              Algumas refeições de hoje pedem uma ajuda antes da hora.
            </p>
          </div>
          <Link
            to="/app/planejamento"
            className="text-sm underline underline-offset-4"
          >
            Abrir
          </Link>
        </div>
      )}

      {!plannedRecipe && !hasAnyToday && (
        <div
          data-testid="today-no-plan"
          className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground"
        >
          Sem refeição decidida para hoje.{" "}
          <Link
            to="/app/planejamento"
            className="ml-1 underline underline-offset-4"
          >
            Abrir o planejamento
          </Link>
          .
        </div>
      )}

      {attentionCount > 0 && (
        <div
          data-testid="attention-strip"
          className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4"
        >
          <Info className="mt-0.5 h-4 w-4 text-warning" />
          <div className="flex-1 text-sm">
            <p className="font-medium">
              {attentionCount}{" "}
              {attentionCount === 1 ? "item precisa" : "itens precisam"} de
              atenção
            </p>
            <p className="text-muted-foreground">
              Sugestões priorizam esses alimentos quando possível.
            </p>
          </div>
          <Link
            to="/app/despensa"
            className="text-sm underline underline-offset-4"
          >
            Ver
          </Link>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-2xl">{tr("today.suggestions")}</h2>
          <button
            data-testid="today-help"
            onClick={() => setAsk((v) => !v)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" /> {tr("today.helpChoose")}
          </button>
        </div>
        {askOpen && (
          <Card className="mb-4 p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Uma pergunta por vez.
            </p>
            {pref.time === null ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  data-testid="ask-time-fast"
                  size="sm"
                  onClick={() => setPref({ ...pref, time: "fast" })}
                >
                  Tenho pouco tempo
                </Button>
                <Button
                  data-testid="ask-time-any"
                  size="sm"
                  variant="outline"
                  onClick={() => setPref({ ...pref, time: "any" })}
                >
                  Tenho tempo
                </Button>
              </div>
            ) : pref.mood === null ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  data-testid="ask-mood-light"
                  size="sm"
                  onClick={() => setPref({ ...pref, mood: "light" })}
                >
                  Algo leve
                </Button>
                <Button
                  data-testid="ask-mood-full"
                  size="sm"
                  variant="outline"
                  onClick={() => setPref({ ...pref, mood: "full" })}
                >
                  Completo
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Atualizamos as sugestões abaixo.
              </p>
            )}
          </Card>
        )}
        {smartAvailable ? (
          <div className="grid gap-3 md:grid-cols-2">
            {suggestions.length ? (
              suggestions.map((r) => (
                <SuggestionCard key={r.id} r={r} tr={tr} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {tr("today.empty")}
              </p>
            )}
          </div>
        ) : (
          <Card className="p-6">
            <p className="font-display text-lg">{tr("states.offline")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Você ainda pode acessar despensa, planejamento, receitas salvas e
              compras.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/app/despensa">
                <Button size="sm" variant="outline">
                  <ChefHat className="mr-1 h-3.5 w-3.5" />
                  Despensa
                </Button>
              </Link>
              <Link to="/app/receitas">
                <Button size="sm" variant="outline">
                  Receitas salvas
                </Button>
              </Link>
              <Link to="/app/compras">
                <Button size="sm" variant="outline">
                  <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                  Compras
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
