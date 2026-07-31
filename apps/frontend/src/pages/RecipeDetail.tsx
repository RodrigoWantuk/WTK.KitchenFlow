import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, ChefHat, Sparkles, Check, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { RecipeComponentDependency, ScheduleComponentDialog } from "@/components/plan/PlanExtras";

export default function RecipeDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { tr, recipes, pantry, addMissingToShopping, addPlan, favorites, toggleFavorite, scenario } = useStore();
  const r = recipes.find(x => x.id === id);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  if (!r) return <div className="p-8">Receita não encontrada.</div>;
  const pantryIds = new Set(pantry.map(p => p.id));
  const showComponentDep = r.id === "r3" || scenario === "componentScheduled" || scenario === "componentShared" || scenario === "componentInPantry";

  return (
    <div className="space-y-6">
      <button onClick={() => nav(-1)} data-testid="rec-back" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{tr("common.back")}</button>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl">
          <img src={r.image} alt={r.title} className="h-64 w-full object-cover sm:h-80 md:h-96" />
        </div>
        <div>
          <h1 className="font-display text-4xl">{r.title}</h1>
          <p className="mt-2 text-muted-foreground">{r.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-3"><p className="text-xs text-muted-foreground">{tr("recipes.time")}</p><p className="font-display text-lg">{r.totalTime} min</p></Card>
            <Card className="p-3"><p className="text-xs text-muted-foreground">{tr("recipes.servings")}</p><p className="font-display text-lg">{r.servings}</p></Card>
            <Card className="p-3"><p className="text-xs text-muted-foreground">{tr("recipes.difficulty")}</p><p className="font-display text-lg">{["","Fácil","Média","Difícil"][r.difficulty]}</p></Card>
            <Card className="p-3"><p className="text-xs text-muted-foreground">{tr("recipes.cleanup")}</p><p className="font-display text-lg">{["","Pouca","Média","Alta"][r.cleanup]}</p></Card>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/app/cozinhar/${r.id}`}><Button data-testid="rec-prepare"><ChefHat className="mr-1 h-4 w-4" />{tr("recipes.startPrep")}</Button></Link>
            <Button data-testid="rec-add-missing" variant="outline" onClick={() => { addMissingToShopping(r.id); toast.success("Faltantes adicionados às compras"); }}>{tr("recipes.addMissingToShopping")}</Button>
            <Button data-testid="rec-add-plan" variant="outline" onClick={() => { addPlan({ day: 0, meal: "dinner", recipeId: r.id, state: "accepted" }); toast.success("Adicionada ao planejamento"); }}>{tr("recipes.addToPlan")}</Button>
            <Button data-testid="rec-toggle-fav" variant="ghost" onClick={() => toggleFavorite(r.id)}>{favorites.includes(r.id) ? "★ Favorito" : "☆ Favoritar"}</Button>
          </div>
        </div>
      </div>

      {showComponentDep && (
        <>
          <RecipeComponentDependency onSchedule={() => setScheduleOpen(true)} />
          <ScheduleComponentDialog open={scheduleOpen} onOpenChange={setScheduleOpen} onConfirm={() => toast.success("Preparo agendado")} />
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-2xl">{tr("recipes.ingredients")}</h2>
          <ul className="mt-3 space-y-2">
            {r.ingredients.map((i, k) => {
              const has = i.match && pantryIds.has(i.match);
              return (
                <li key={k} data-testid={`ing-${k}`} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {has ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-warning" />}
                    {i.qty} {i.unit} · {i.name}
                  </span>
                  <span className={`text-xs ${has ? "text-primary" : "text-warning"}`}>{has ? "Tem" : "Falta"}</span>
                </li>
              );
            })}
          </ul>
          {r.substitutes.length > 0 && (
            <div className="mt-4 rounded-xl bg-secondary/60 p-3">
              <p className="text-xs font-medium">{tr("recipes.substitutes")}</p>
              <ul className="mt-1 text-xs text-muted-foreground">
                {r.substitutes.map((s, k) => <li key={k}>{s.of} → {s.by}</li>)}
              </ul>
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-2xl">{tr("recipes.steps")}</h2>
          <ol className="mt-3 space-y-3">
            {r.steps.map((s, k) => (
              <li key={k} className="flex gap-3 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-xs text-primary">{k + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> {tr("recipes.equipment")}: {r.equipment.join(", ")}
          </div>
        </Card>
      </div>
    </div>
  );
}
