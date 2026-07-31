import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Pause, Play, HelpCircle, X, Timer, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ReconciliationTable, TroubleContent, TroubleSaveDialog } from "@/components/plan/PlanExtras";

export default function CookFlow() {
  const { id } = useParams();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPhase = searchParams.get("phase") === "finish" ? "finish" : "prep";
  const { tr, recipes, cooking, startCooking, updateCookStep, pauseCooking, resumeCooking, finishCooking, scenario } = useStore();
  const r = recipes.find(x => x.id === id);

  const [phase, setPhase] = useState(initialPhase); // prep | cook | finish
  const [prep, setPrep] = useState({});
  const [helpOpen, setHelp] = useState(false);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [rec, setRec] = useState({ served: "", leftovers: "", refrigerated: "", frozen: "", discarded: "", notes: "" });
  const [troubleSaveOpen, setTroubleSaveOpen] = useState(false);
  const showTrouble = scenario === "troubleSuccess" || scenario === "derivedRecipe";
  const showFullReconcile = scenario === "fullReconcile" || scenario === "withLeftovers" || scenario === "frozenPortions";

  useEffect(() => { if (!cooking && phase === "cook") startCooking(id); }, [phase]); // eslint-disable-line
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTimer(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (!r) return <div className="p-8">Receita não encontrada.</div>;

  const step = cooking?.step ?? 0;
  const paused = cooking?.paused;
  const total = r.steps.length;

  const fmt = (n) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

  const submitFinish = () => {
    finishCooking({ ...rec, recipeId: id });
    toast.success("Registrado. Sua despensa foi atualizada.");
    nav("/app/hoje");
  };

  // PREP
  if (phase === "prep") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <button onClick={() => nav(-1)} className="text-sm text-muted-foreground hover:text-foreground">{tr("common.back")}</button>
        <h1 className="font-display text-4xl">{tr("cook.prep")}</h1>
        <p className="text-sm text-muted-foreground">{r.title}</p>
        <Card className="p-5">
          <ul className="space-y-3">
            {["Separar ingredientes","Conferir equipamentos","Medir quantidades","Pré-aquecer se necessário","Descongelar (se aplicável)"].map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                <Checkbox data-testid={`prep-check-${i}`} checked={!!prep[i]} onCheckedChange={(v) => setPrep({ ...prep, [i]: v })} />
                <span className={prep[i] ? "line-through text-muted-foreground" : ""}>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Button data-testid="prep-start-cook" className="w-full rounded-full" onClick={() => setPhase("cook")}>{tr("cook.cook")} <ArrowRight className="ml-1 h-4 w-4" /></Button>
      </div>
    );
  }

  // COOK
  if (phase === "cook") {
    const currentStep = r.steps[step];
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <button data-testid="cook-exit" onClick={() => nav("/app/hoje")} className="flex items-center gap-1 text-sm text-muted-foreground"><X className="h-4 w-4" /> {tr("cook.exit")}</button>
            <p className="font-display text-sm">{tr("cook.step")} {step + 1} {tr("cook.of")} {total}</p>
            <button data-testid="cook-help" onClick={() => setHelp(true)} className="text-sm text-muted-foreground"><HelpCircle className="h-4 w-4" /></button>
          </div>
          <Progress value={((step + 1) / total) * 100} className="h-1 rounded-none" />
        </header>

        <main className="mx-auto max-w-3xl px-6 py-10 md:py-14">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">{r.title}</p>
          <p data-testid="cook-step-text" className="mt-3 font-display text-3xl leading-tight sm:text-4xl md:text-5xl">{currentStep}</p>

          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Timer className="h-4 w-4" /><span className="font-display text-2xl">{fmt(timer)}</span></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" data-testid="timer-reset" onClick={() => { setTimer(0); setRunning(false); }}>Zerar</Button>
                <Button size="sm" data-testid="timer-toggle" onClick={() => setRunning(v => !v)}>{running ? tr("cook.stop") : tr("cook.start")}</Button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-2">
            <Button variant="outline" data-testid="cook-prev" disabled={step === 0} onClick={() => updateCookStep(step - 1)}><ChevronLeft className="h-4 w-4" /> {tr("cook.prev")}</Button>
            <Button variant="ghost" data-testid="cook-pause" onClick={() => paused ? resumeCooking() : pauseCooking()}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} {paused ? "Retomar" : tr("cook.pause")}</Button>
            {step < total - 1
              ? <Button data-testid="cook-next" onClick={() => updateCookStep(step + 1)}>{tr("cook.next")} <ChevronRight className="h-4 w-4" /></Button>
              : <Button data-testid="cook-finish" onClick={() => setPhase("finish")}>{tr("cook.finish")}</Button>}
          </div>
        </main>

        <Dialog open={helpOpen} onOpenChange={setHelp}>
          <DialogContent>
            <DialogHeader><DialogTitle>{tr("cook.helpTitle")}</DialogTitle></DialogHeader>
            {showTrouble ? (
              <TroubleContent onFinishOffer={() => { setHelp(false); setTroubleSaveOpen(true); }} />
            ) : (
              <ul className="space-y-3 text-sm">
                {r.troubleshooting.map((h, i) => (
                  <li key={i} className="rounded-xl bg-secondary/60 p-3"><p className="font-medium">{h.q}</p><p className="mt-1 text-muted-foreground">{h.a}</p></li>
                ))}
                {r.troubleshooting.length === 0 && <li className="text-muted-foreground">Sem sugestões específicas para essa receita.</li>}
              </ul>
            )}
          </DialogContent>
        </Dialog>
        <TroubleSaveDialog open={troubleSaveOpen} onOpenChange={setTroubleSaveOpen} onConfirm={(k) => toast.success(k === "derived" ? "Receita derivada criada" : "Aprendizado registrado")} />
      </div>
    );
  }

  // FINISH
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl">{tr("cook.finishTitle")}</h1>
      <p className="text-sm text-muted-foreground">Vamos atualizar sua despensa sinteticamente.</p>
      {showFullReconcile && <ReconciliationTable />}
      <Card className="grid gap-4 p-6 sm:grid-cols-2">
        {[["served","cook.served"],["leftovers","cook.leftovers"],["refrigerated","cook.refrigerated"],["frozen","cook.frozen"],["discarded","cook.discarded"]].map(([k, label]) => (
          <div key={k}>
            <label className="text-sm">{tr(label)}</label>
            <Input data-testid={`fin-${k}`} value={rec[k]} onChange={(e) => setRec({ ...rec, [k]: e.target.value })} placeholder="ex.: 2 porções" />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="text-sm">{tr("cook.notes")}</label>
          <Input data-testid="fin-notes" value={rec.notes} onChange={(e) => setRec({ ...rec, notes: e.target.value })} />
        </div>
      </Card>
      <Button data-testid="fin-save" className="w-full rounded-full" onClick={submitFinish}>{tr("cook.saveConclusion")}</Button>
    </div>
  );
}
