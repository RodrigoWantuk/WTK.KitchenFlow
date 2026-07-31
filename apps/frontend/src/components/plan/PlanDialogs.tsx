import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Search, Sparkles, Clock, Check, X, ChefHat, AlertTriangle, ArrowRight, PenLine, Flame, Moon, Sun, Timer } from "lucide-react";

const MEALS = ["breakfast","lunch","snack","dinner"];
const DAYS_PT = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];

// Utility — synthetic explanation of why a recipe is suggested for a given day/meal
function whyForDay(recipe: any, plan: any, day: any) {
  if (recipe.missing.length === 0) return { key: "haveAll", tone: "primary" };
  if (recipe.missing.length === 1) return { key: "missingOne", tone: "warning" };
  if (recipe.tags?.includes("usa atenção")) return { key: "usesAttention", tone: "accent" };
  if (recipe.totalTime <= 15) return { key: "quickForDay", tone: "primary" };
  const usedRecent = plan.some((p: any) => p.recipeId === recipe.id && Math.abs(p.day - day) <= 2);
  if (!usedRecent) return { key: "variety", tone: "accent" };
  if (recipe.activeTime <= recipe.totalTime - 15) return { key: "canPrepAhead", tone: "accent" };
  return { key: "missingSome", tone: "warning" };
}

function WhyPill({ label, tone = "primary" }: { label: string; tone?: string }) {
  const cls = tone === "primary" ? "bg-primary/10 text-foreground"
    : tone === "warning" ? "bg-warning/15 text-foreground/80"
    : "bg-accent/15 text-foreground/80";
  return <span className={`pill ${cls}`}><Sparkles className="h-3 w-3" />{label}</span>;
}

/* ---------- Meal Picker ---------- */
export function MealPickerDialog({ open, onOpenChange, slot, recipes, plan, addPlan, tr }: { open: boolean; onOpenChange: (o: boolean) => void; slot: { day: number; meal: string } | null; recipes: any[]; plan: any[]; addPlan: (p: any) => void; tr: (k: string) => string }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]); // for compare mode

  const suggestions = useMemo(() => {
    const scored = [...recipes].map(r => ({ r, why: whyForDay(r, plan, slot?.day ?? 0) }));
    scored.sort((a, b) => (b.r.have / b.r.total) - (a.r.have / a.r.total));
    return scored.slice(0, 4);
  }, [recipes, plan, slot]);

  const filtered = q ? recipes.filter((r: any) => r.title.toLowerCase().includes(q.toLowerCase())) : recipes;

  const pick = (recipeId: string, state = "accepted") => {
    if (!slot) return;
    addPlan({ day: slot.day, meal: slot.meal, recipeId, state });
    onOpenChange(false);
    setSelected([]); setQ("");
  };

  const toggleSelect = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 3 ? [...s, id] : s);
  };

  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{tr("plan.picker.title")}</DialogTitle>
          <DialogDescription>
            {DAYS_PT[slot.day]} · {tr(`plan.${slot.meal}`)} — {tr("plan.picker.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sugg">
          <TabsList>
            <TabsTrigger value="sugg" data-testid="picker-tab-sugg">{tr("plan.picker.suggestions")}</TabsTrigger>
            <TabsTrigger value="all" data-testid="picker-tab-all">{tr("plan.picker.allRecipes")}</TabsTrigger>
            <TabsTrigger value="compare" data-testid="picker-tab-compare">{tr("plan.compare.title")}</TabsTrigger>
          </TabsList>

          <TabsContent value="sugg" className="mt-3">
            <ScrollArea className="max-h-[52vh]">
              <div className="grid gap-3 pr-3 md:grid-cols-2">
                {suggestions.map(({ r, why }) => (
                  <Card key={r.id} data-testid={`picker-sugg-${r.id}`} className="p-3">
                    <div className="flex gap-3">
                      <img src={r.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-base">{r.title}</h3>
                        <div className="mt-1"><WhyPill label={tr(`plan.picker.${why.key}`)} tone={why.tone} /></div>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{r.totalTime} min</span>
                          <span>{r.have}/{r.total}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" data-testid={`picker-pick-${r.id}`} onClick={() => pick(r.id, "accepted")}>{tr("plan.picker.selectRecipe")}</Button>
                      <Button size="sm" variant="outline" data-testid={`picker-draft-${r.id}`} onClick={() => pick(r.id, "draft")}>{tr("plan.picker.saveAsDraft")}</Button>
                      <button data-testid={`picker-compare-${r.id}`} onClick={() => toggleSelect(r.id)} className={`text-xs underline underline-offset-4 ${selected.includes(r.id) ? "text-primary" : "text-muted-foreground"}`}>
                        {selected.includes(r.id) ? "Remover da comparação" : tr("plan.picker.compareTwo")}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="mt-3">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input data-testid="picker-search" placeholder={tr("plan.picker.search")} value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <ScrollArea className="max-h-[46vh]">
              <ul className="space-y-2 pr-3">
                {filtered.map((r: any) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
                    <img src={r.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.totalTime} min · {r.have}/{r.total} · {r.missing.length === 0 ? tr("plan.picker.haveAll") : `${r.missing.length} faltantes`}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" data-testid={`picker-all-draft-${r.id}`} onClick={() => pick(r.id, "draft")}>{tr("plan.picker.saveAsDraft")}</Button>
                      <Button size="sm" data-testid={`picker-all-pick-${r.id}`} onClick={() => pick(r.id, "accepted")}>{tr("plan.picker.selectRecipe")}</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="compare" className="mt-3">
            {selected.length < 2 ? (
              <p className="rounded-xl bg-secondary/60 p-6 text-center text-sm text-muted-foreground">{tr("plan.compare.empty")}</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {selected.map(id => {
                  const r = recipes.find((x: any) => x.id === id);
                  if (!r) return null;
                  const why = whyForDay(r, plan, slot.day);
                  return (
                    <Card key={id} data-testid={`compare-card-${id}`} className="p-4">
                      <img src={r.image} alt="" className="h-24 w-full rounded-lg object-cover" />
                      <h4 className="mt-2 font-display text-base leading-tight">{r.title}</h4>
                      <div className="mt-2"><WhyPill label={tr(`plan.picker.${why.key}`)} tone={why.tone} /></div>
                      <dl className="mt-3 space-y-1 text-xs">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Tempo total</dt><dd>{r.totalTime} min</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Ativo</dt><dd>{r.activeTime} min</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Esforço</dt><dd>{["","Baixo","Médio","Alto"][r.effort]}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Limpeza</dt><dd>{["","Pouca","Média","Alta"][r.cleanup]}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Você tem</dt><dd>{r.have}/{r.total}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Faltantes</dt><dd>{r.missing.length}</dd></div>
                      </dl>
                      <Button size="sm" className="mt-3 w-full" data-testid={`compare-pick-${id}`} onClick={() => pick(id)}>{tr("plan.compare.pick")}</Button>
                    </Card>
                  );
                })}
              </div>
            )}
            {selected.length > 0 && (
              <button className="mt-3 text-xs text-muted-foreground underline underline-offset-4" onClick={() => setSelected([])}>{tr("plan.compare.clear")}</button>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2 border-t border-border pt-3">
          <Button variant="ghost" data-testid="picker-decide-later" onClick={() => onOpenChange(false)}>{tr("plan.picker.decideLater")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Replace Dialog ---------- */
const REPLACE_REASONS = [
  { key: "faster",   filter: (r: any, cur: any) => r.totalTime <= (cur?.totalTime || 60) - 5 },
  { key: "easier",   filter: (r: any, cur: any) => r.effort <= (cur?.effort || 3) - 1 || r.cleanup <= 1 },
  { key: "noMood",   filter: () => true },
  { key: "manyMiss", filter: (r: any) => r.missing.length <= 1 },
  { key: "haveAll",  filter: (r: any) => r.missing.length === 0 },
  { key: "different",filter: () => true },
];

export function MealReplaceDialog({ open, onOpenChange, entry, recipes, replaceMeal, tr }: { open: boolean; onOpenChange: (o: boolean) => void; entry: any; recipes: any[]; replaceMeal: (id: string, pick: string, opts: any) => void; tr: (k: string) => string }) {
  const [reasonKey, setReasonKey] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [shoppingChoice, setShoppingChoice] = useState("keep");
  const reasonLabels = tr("plan.replace.reasons") as any; // i18n array not reflected in tr(): string
  const current = entry ? recipes.find((r: any) => r.id === entry.recipeId) : null;

  const alternatives = useMemo(() => {
    if (!entry) return [];
    const list = recipes.filter((r: any) => r.id !== entry.recipeId);
    const reason = REPLACE_REASONS.find(r => r.key === reasonKey);
    const filtered = reason ? list.filter((r: any) => reason.filter(r, current)) : list;
    return filtered.slice(0, 3);
  }, [entry, reasonKey, recipes, current]);

  const confirm = () => {
    if (!entry || !pick) return;
    replaceMeal(entry.id, pick, { removePrevShopping: shoppingChoice === "remove" });
    onOpenChange(false);
    setReasonKey(null); setPick(null); setShoppingChoice("keep");
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{tr("plan.replace.title")}</DialogTitle>
        </DialogHeader>

        {current && (
          <div className="rounded-2xl border border-border bg-secondary/40 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{tr("plan.replace.current")}</p>
            <p className="mt-1 font-display text-lg">{current.title}</p>
            <p className="text-xs text-muted-foreground">{current.totalTime} min · {current.have}/{current.total} ingredientes</p>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">{tr("plan.replace.reasonQ")}</p>
          <div className="flex flex-wrap gap-2">
            {REPLACE_REASONS.map((r, i) => (
              <button key={r.key} data-testid={`replace-reason-${r.key}`} onClick={() => setReasonKey(r.key)} className={`rounded-full border px-3 py-1.5 text-xs ${reasonKey === r.key ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>{reasonLabels[i]}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">{tr("plan.replace.alternatives")}</p>
          {alternatives.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem alternativas com esse motivo — tente outro.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-3">
              {alternatives.map((r: any) => (
                <button key={r.id} data-testid={`replace-alt-${r.id}`} onClick={() => setPick(r.id)} className={`rounded-2xl border p-3 text-left transition-colors ${pick === r.id ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
                  <p className="font-display text-sm leading-tight">{r.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{r.totalTime} min · {r.have}/{r.total} · {r.missing.length ? `${r.missing.length} faltantes` : "tem tudo"}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {pick && (
          <div className="rounded-2xl border border-border p-3">
            <p className="mb-2 text-sm font-medium">{tr("plan.replace.shoppingQ")}</p>
            <RadioGroup value={shoppingChoice} onValueChange={setShoppingChoice} className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="keep" data-testid="replace-keep" />{tr("plan.replace.keepShopping")}</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="remove" data-testid="replace-remove" />{tr("plan.replace.removeShopping")}</label>
            </RadioGroup>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{tr("common.cancel")}</Button>
          <Button data-testid="replace-confirm" disabled={!pick} onClick={confirm}>{tr("plan.replace.confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Move Dialog ---------- */
export function MealMoveDialog({ open, onOpenChange, entry, plan, moveMeal, tr, recipes }: { open: boolean; onOpenChange: (o: boolean) => void; entry: any; plan: any[]; moveMeal: (id: string, dst: any, resolution: string) => void; tr: (k: string) => string; recipes: any[] }) {
  const [dstDay, setDstDay] = useState(entry?.day ?? 0);
  const [dstMeal, setDstMeal] = useState(entry?.meal ?? "lunch");
  const [resolution, setResolution] = useState("swap");

  if (!entry) return null;

  const occupying = plan.find((p: any) => p.id !== entry.id && p.day === dstDay && p.meal === dstMeal);
  const occRecipe = occupying ? recipes.find((r: any) => r.id === occupying.recipeId) : null;

  const confirm = () => {
    moveMeal(entry.id, { day: dstDay, meal: dstMeal }, occupying ? resolution : "swap");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-2xl">{tr("plan.move.title")}</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{tr("plan.move.origin")}</p>
            <p className="mt-1 text-sm">{DAYS_PT[entry.day]} · {tr(`plan.${entry.meal}`)}</p>
          </div>
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-primary">{tr("plan.move.destination")}</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Select value={String(dstDay)} onValueChange={(v) => setDstDay(Number(v))}>
                <SelectTrigger data-testid="move-day"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS_PT.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={dstMeal} onValueChange={setDstMeal}>
                <SelectTrigger data-testid="move-meal"><SelectValue /></SelectTrigger>
                <SelectContent>{MEALS.map(m => <SelectItem key={m} value={m}>{tr(`plan.${m}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {occupying && (
          <div data-testid="move-conflict" className="mt-2 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-warning" />{tr("plan.conflict.title")}</p>
            <p className="text-xs text-muted-foreground">Já existe: <b>{occRecipe?.title || "outra refeição"}</b>. {tr("plan.conflict.description")}</p>
            <RadioGroup value={resolution} onValueChange={setResolution} className="mt-3 grid grid-cols-1 gap-1.5">
              {[
                ["swap", "plan.conflict.swap", null],
                ["replace", "plan.conflict.replace", null],
                ["keepBoth", "plan.conflict.keepBoth", "plan.conflict.keepBothHint"],
                ["pickOther", "plan.conflict.pickOther", null],
              ].map(([k, tk, hintKey]) => (
                <label key={k as string} className="flex items-start gap-2 text-sm">
                  <RadioGroupItem value={k as string} data-testid={`move-res-${k}`} className="mt-0.5" />
                  <span className="flex-1">
                    {tr(tk as string)}
                    {hintKey && <span className="block text-[11px] text-muted-foreground">{tr(hintKey as string)}</span>}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" data-testid="move-cancel" onClick={() => onOpenChange(false)}>{tr("common.cancel")}</Button>
          <Button data-testid="move-confirm" onClick={confirm}>{tr("plan.move.confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Mark Done Dialog ---------- */
export function MarkDoneDialog({ open, onOpenChange, entry, recipes, onConfirm, tr }: { open: boolean; onOpenChange: (o: boolean) => void; entry: any; recipes: any[]; onConfirm: (mode: string) => void; tr: (k: string) => string }) {
  if (!entry) return null;
  const r = recipes.find((x: any) => x.id === entry.recipeId);
  const options = [
    { key: "onlyDone", tone: "primary", labelKey: "plan.markDone.onlyDone", hintKey: "plan.markDone.onlyDoneHint", testid: "markdone-only" },
    { key: "review",   tone: "accent",  labelKey: "plan.markDone.review",   hintKey: "plan.markDone.reviewHint",   testid: "markdone-review" },
    { key: "skipped",  tone: "muted",   labelKey: "plan.markDone.skipped",  hintKey: "plan.markDone.skippedHint",  testid: "markdone-skipped" },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{tr("plan.markDone.title")}</DialogTitle>
          <DialogDescription>{r?.title} — {tr("plan.markDone.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {options.map(o => (
            <button
              key={o.key}
              data-testid={o.testid}
              onClick={() => onConfirm(o.key)}
              className={`group flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${o.tone === "primary" ? "border-primary/40 bg-primary/5 hover:border-primary" : o.tone === "accent" ? "border-accent/40 bg-accent/5 hover:border-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}
            >
              <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${o.tone === "primary" ? "bg-primary/20 text-primary" : o.tone === "accent" ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>
                {o.key === "onlyDone" ? <Check className="h-4 w-4" /> : o.key === "review" ? <PenLine className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </span>
              <span className="flex-1">
                <span className="block font-medium">{tr(o.labelKey)}</span>
                <span className="block text-xs text-muted-foreground">{tr(o.hintKey)}</span>
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" data-testid="markdone-cancel" onClick={() => onOpenChange(false)}>{tr("common.cancel")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Missing Review Dialog ---------- */
export function MissingReviewDialog({ open, onOpenChange, plan, recipes, shopping, sendItemsToShopping, tr }: { open: boolean; onOpenChange: (o: boolean) => void; plan: any[]; recipes: any[]; shopping: any[]; sendItemsToShopping: (items: any[]) => void; tr: (k: string) => string }) {
  const [groupBy, setGroupBy] = useState("meal");
  const [selection, setSelection] = useState<Record<string, boolean>>({}); // key -> boolean
  const [qty, setQty] = useState<Record<string, string>>({}); // key -> number

  const items = useMemo(() => {
    const out: any[] = [];
    plan.forEach((p: any) => {
      const r = recipes.find((x: any) => x.id === p.recipeId);
      if (!r) return;
      (r.missing || []).forEach((m: any) => {
        out.push({
          key: `${p.id}::${r.id}::${m.name}::${m.unit || ""}`,
          planId: p.id,
          recipeId: r.id,
          recipeTitle: r.title,
          mealLabel: `${DAYS_PT[p.day]} · ${tr(`plan.${p.meal}`)}`,
          name: m.name,
          qty: m.qty,
          unit: m.unit,
          category: r.tags?.[0] || "geral",
        });
      });
    });
    return out;
  }, [plan, recipes, tr]);

  const inShopping = useMemo(() => new Set(shopping.map((s: any) => `${(s.name || "").toLowerCase()}|${(s.unit || "").toLowerCase()}`)), [shopping]);
  const dupCount = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach(it => { const k = `${it.name.toLowerCase()}|${(it.unit||"").toLowerCase()}`; c[k] = (c[k]||0)+1; });
    return c;
  }, [items]);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    items.forEach(it => {
      const key = groupBy === "meal" ? it.mealLabel : groupBy === "recipe" ? it.recipeTitle : it.category;
      (g[key] = g[key] || []).push(it);
    });
    return g;
  }, [items, groupBy]);

  const toggle = (k: string) => setSelection(s => ({ ...s, [k]: !s[k] }));
  const selectAll = () => setSelection(items.reduce((a: Record<string, boolean>, it: any) => { a[it.key] = true; return a; }, {}));
  const clearAll = () => setSelection({});

  const send = () => {
    const chosen = items.filter(it => selection[it.key]).map(it => ({
      name: it.name,
      qty: Number(qty[it.key] ?? it.qty) || it.qty,
      unit: it.unit,
      origin: "plan",
      recipeId: it.recipeId,
      aisle: "grocery",
    }));
    if (chosen.length) sendItemsToShopping(chosen);
    onOpenChange(false);
    setSelection({}); setQty({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{tr("plan.missing.title")}</DialogTitle>
          <DialogDescription>{tr("plan.missing.subtitle")}</DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <p className="rounded-xl bg-secondary/60 p-6 text-center text-sm text-muted-foreground">{tr("plan.missing.nothing")}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{tr("plan.missing.groupBy")}:</span>
                {[["meal","byMeal"],["recipe","byRecipe"],["category","byCategory"]].map(([k, tk]) => (
                  <button key={k} data-testid={`miss-group-${k}`} onClick={() => setGroupBy(k)} className={`rounded-full border px-3 py-1 text-xs ${groupBy === k ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>{tr(`plan.missing.${tk}`)}</button>
                ))}
              </div>
              <div className="flex gap-2 text-xs">
                <button data-testid="miss-selectall" onClick={selectAll} className="underline underline-offset-4 text-muted-foreground">{tr("plan.missing.selectAll")}</button>
                <button data-testid="miss-clearall" onClick={clearAll} className="underline underline-offset-4 text-muted-foreground">{tr("plan.missing.clearAll")}</button>
              </div>
            </div>

            <ScrollArea className="max-h-[52vh]">
              <div className="space-y-4 pr-3">
                {Object.entries(grouped).map(([label, list]) => (
                  <div key={label}>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                    <ul className="divide-y divide-border rounded-xl border border-border">
                      {list.map((it: any) => {
                        const key = `${it.name.toLowerCase()}|${(it.unit||"").toLowerCase()}`;
                        const already = inShopping.has(key);
                        const dup = dupCount[key] > 1;
                        return (
                          <li key={it.key} data-testid={`miss-row-${it.key}`} className="flex items-center gap-3 p-3">
                            <Checkbox checked={!!selection[it.key]} onCheckedChange={() => toggle(it.key)} data-testid={`miss-check-${it.key}`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm">{it.name}</p>
                              <p className="text-[11px] text-muted-foreground">{it.mealLabel} · {it.recipeTitle}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {already && <span className="pill bg-primary/10 text-[10px]">{tr("plan.missing.alreadyInList")}</span>}
                                {dup && <span className="pill bg-warning/15 text-[10px]">{tr("plan.missing.duplicate")}</span>}
                              </div>
                            </div>
                            <Input data-testid={`miss-qty-${it.key}`} className="w-20 text-right" defaultValue={String(it.qty)} onChange={(e) => setQty(q => ({ ...q, [it.key]: e.target.value }))} />
                            <span className="w-12 text-xs text-muted-foreground">{it.unit}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{tr("common.cancel")}</Button>
          <Button data-testid="miss-send" disabled={items.length === 0} onClick={send}>{tr("plan.missing.sendSelected")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Prep-Ahead Dialog ---------- */
const SLOT_ORDER: Record<string, number> = { "noite anterior": 0, "manhã": 1, "1h antes": 2 };
const SLOT_META = {
  "noite anterior": { icon: Moon, key: "slotNight" },
  "manhã":         { icon: Sun,  key: "slotMorning" },
  "1h antes":      { icon: Timer,key: "slotBefore" },
};

const TASK_STATE_STYLE: Record<string, { cls: string; dot: string; label: string }> = {
  next:     { cls: "border-border bg-card",                    dot: "bg-border",            label: "next" },
  canStart: { cls: "border-primary/50 bg-primary/5",           dot: "bg-primary",           label: "canStart" },
  overdue:  { cls: "border-destructive/50 bg-destructive/10",  dot: "bg-destructive",       label: "overdue" },
  done:     { cls: "border-primary bg-primary/15 opacity-90",  dot: "bg-primary",           label: "done" },
  blocked:  { cls: "border-warning/40 bg-warning/10 opacity-90", dot: "bg-warning",         label: "blocked" },
};

function taskStateFor(scenario: string, index: number, done: boolean) {
  if (done) return "done";
  if (scenario === "routeOverdue" && index === 0) return "overdue";
  if (scenario === "routePartial") {
    if (index === 0) return "done";
    if (index === 1) return "canStart";
    if (index === 2) return "blocked";
    return "next";
  }
  if (scenario === "routeToday") return index === 0 ? "canStart" : "next";
  return index === 0 ? "canStart" : "next";
}

function TaskCard({ task, taskState, onMarkDone, onStart, tr, k }: { task: any; taskState: string; onMarkDone: (k: string) => void; onStart: (task: any) => void; tr: (key: string) => string; k: string }) {
  const style = TASK_STATE_STYLE[taskState] || TASK_STATE_STYLE.next;
  const isDone = taskState === "done";
  const isBlocked = taskState === "blocked";
  return (
    <div data-testid={`trail-item-${k}`} data-state={taskState} className={`relative rounded-2xl border p-3 ${style.cls}`}>
      <span className={`absolute -left-[34px] top-4 grid h-4 w-4 place-items-center rounded-full ${style.dot}`}>
        {isDone && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
      </span>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            {task.time && <span className="font-display text-sm tabular-nums">{task.time}</span>}
            <span className="pill bg-background/60 text-[10px]" data-testid={`trail-state-${k}`}>{tr(`plan.route.states.${taskState}`)}</span>
          </div>
          <p className={`mt-1 text-sm ${isDone ? "line-through text-muted-foreground" : "font-medium"}`}>{task.task}</p>
          <p className="text-[11px] text-muted-foreground">{tr("plan.route.for")}: {task.recipeTitle} · {DAYS_PT[task.day]} · {tr(`plan.${task.meal}`)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground"><Flame className="mr-1 inline h-3 w-3" />{task.when} · {task.durationMin} min</p>
          {tr(`plan.route.stateHints.${taskState}`) && !isDone && <p className="mt-1 text-[11px] italic text-muted-foreground">{tr(`plan.route.stateHints.${taskState}`)}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <Button size="sm" variant={isDone ? "outline" : "default"} data-testid={`trail-done-${k}`} disabled={isBlocked} onClick={() => onMarkDone(k)}>
            {isDone ? "Concluída" : tr("plan.prepAhead.markDone")}
          </Button>
          {!isDone && !isBlocked && <Button size="sm" variant="ghost" data-testid={`trail-start-${k}`} onClick={() => onStart(task)}>{tr("plan.prepAhead.startNow")}</Button>}
        </div>
      </div>
    </div>
  );
}

function TrailView({ items, doneKeys, onMarkDone, onStart, tr, scenario, todayIdx }: { items: any[]; doneKeys: Set<string>; onMarkDone: (k: string) => void; onStart: (task: any) => void; tr: (key: string) => string; scenario: string; todayIdx: number }) {
  const groups = useMemo(() => {
    const g: { today: any[]; tomorrow: any[]; later: any[] } = { today: [], tomorrow: [], later: [] };
    items.forEach((it, i) => {
      const enriched = { ...it, _k: `${it.planId}_${i}`, _index: i };
      const rel = (it.day - todayIdx + 7) % 7;
      if (rel === 0) g.today.push(enriched);
      else if (rel === 1) g.tomorrow.push(enriched);
      else g.later.push(enriched);
    });
    // sort each group by slot order
    Object.keys(g).forEach(key => g[key as keyof typeof g].sort((a, b) => (SLOT_ORDER[a.when] ?? 9) - (SLOT_ORDER[b.when] ?? 9)));
    return g;
  }, [items, todayIdx]);

  const groupOrder = [
    ["today", "groupToday"],
    ["tomorrow", "groupTomorrow"],
    ["later", "groupLater"],
  ];

  return (
    <div className="space-y-6" data-testid="prep-trail">
      {groupOrder.map(([groupKey, labelKey]) => {
        const list = groups[groupKey as keyof typeof groups];
        if (!list.length) return null;
        return (
          <div key={groupKey} data-testid={`trail-group-${groupKey}`}>
            <p className="mb-2 font-display text-sm">{tr(`plan.route.${labelKey}`)}</p>
            <div className="ml-4 border-l-2 border-dashed border-border pl-6 space-y-2">
              {list.map((it: any) => {
                const isDone = doneKeys.has(it._k);
                const st = taskStateFor(scenario, it._index, isDone);
                return <TaskCard key={it._k} k={it._k} task={it} taskState={st} onMarkDone={onMarkDone} onStart={onStart} tr={tr} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PrepAheadDialog({ open, onOpenChange, prepItems, tr, onStart, onMarkDone, doneKeys, scenario, todayIdx }: { open: boolean; onOpenChange: (o: boolean) => void; prepItems: any[]; tr: (k: string) => string; onStart: (task: any) => void; onMarkDone: (k: string) => void; doneKeys: Set<string>; scenario: string; todayIdx: number }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{tr("plan.route.title")}</DialogTitle>
          <DialogDescription>{tr("plan.route.subtitle")}</DialogDescription>
        </DialogHeader>
        {prepItems.length === 0 ? (
          <p className="rounded-xl bg-secondary/60 p-6 text-center text-sm text-muted-foreground">{tr("plan.route.empty")}</p>
        ) : (
          <Tabs defaultValue="trail">
            <TabsList>
              <TabsTrigger data-testid="prep-tab-trail" value="trail">{tr("plan.route.openTrail")}</TabsTrigger>
              <TabsTrigger data-testid="prep-tab-list" value="list">{tr("plan.route.openList")}</TabsTrigger>
            </TabsList>
            <TabsContent value="trail" className="mt-4">
              <ScrollArea className="max-h-[56vh]">
                <TrailView items={prepItems} doneKeys={doneKeys} onMarkDone={onMarkDone} onStart={onStart} tr={tr} scenario={scenario} todayIdx={todayIdx} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="list" className="mt-4">
              <ScrollArea className="max-h-[56vh]">
                <ul className="space-y-2">
                  {prepItems.map((it: any, i: number) => {
                    const k = `${it.planId}_${i}`;
                    const done = doneKeys.has(k);
                    const st = taskStateFor(scenario, i, done);
                    return (
                      <li key={k} data-testid={`prep-item-${k}`}>
                        <TaskCard k={k} task={it} taskState={st} onMarkDone={onMarkDone} onStart={onStart} tr={tr} />
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { DAYS_PT, MEALS };
