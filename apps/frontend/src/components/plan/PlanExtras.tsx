import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertTriangle,
  ArrowRight,
  Snowflake,
  Sparkles,
  Package,
  Info,
} from "lucide-react";
import { useState } from "react";
import {
  MOCK_REALITY_OPTIONS,
  MOCK_REALITY_IMPACT,
  MOCK_SCHEDULE_PROPOSAL,
  MOCK_SIMULATION,
  MOCK_TROUBLE,
  MOCK_TROUBLE_SAVE,
  MOCK_COMPONENT_RECIPE_DEP,
  MOCK_RECONCILIATION,
} from "@/lib/mockData";

/** Shared preparation-route chain — single repository with Home. */
export { RouteChainView } from "@/features/preparation-route/RouteChainView";

/* ---------- Reality Changed Dialog ---------- */
export function RealityChangedDialog({
  open,
  onOpenChange,
  onApply,
  /** CSS selector for the control that opened this controlled dialog (focus restore). */
  returnFocusSelector,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onApply?: (v: any) => void;
  returnFocusSelector?: string;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [option, setOption] = useState<string | null>(null);
  const impact = MOCK_REALITY_IMPACT;
  const submit = () => {
    onApply?.({ reason, option });
    onOpenChange(false);
    setReason(null);
    setOption(null);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        onCloseAutoFocus={(event) => {
          // Controlled dialogs without DialogTrigger do not restore focus by default.
          if (!returnFocusSelector) return;
          event.preventDefault();
          document.querySelector<HTMLElement>(returnFocusSelector)?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            A realidade mudou
          </DialogTitle>
          <DialogDescription>
            Recupere apenas a parte afetada. O restante da semana permanece.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[62vh]">
          <div className="space-y-4 pr-2">
            <div>
              <p className="mb-2 text-sm font-medium">O que aconteceu?</p>
              <div className="flex flex-wrap gap-2">
                {MOCK_REALITY_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    data-testid={`reality-reason-${o.key}`}
                    onClick={() => setReason(o.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${reason === o.key ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <Card className="p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Impacto
              </p>
              <p className="mt-1 font-display text-base">{impact.reason}</p>
              <ul className="mt-2 space-y-1">
                {impact.affectedItems.map((it, i) => (
                  <li
                    key={i}
                    data-testid={`reality-item-${i}`}
                    className="rounded-xl bg-secondary/60 p-2 text-xs"
                  >
                    <span className="font-medium">{it.name}</span> ·{" "}
                    <span>{it.qty}</span>
                    <p className="text-muted-foreground">{it.note}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex items-start gap-1 text-[11px] italic text-muted-foreground">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                {impact.preservedNote}
              </p>
            </Card>

            <div>
              <p className="mb-2 text-sm font-medium">Como quer resolver?</p>
              <RadioGroup
                value={option || ""}
                onValueChange={setOption}
                className="grid gap-2"
              >
                {impact.options.map((o) => (
                  <label
                    key={o.key}
                    className={`flex items-start gap-2 rounded-2xl border p-3 ${option === o.key ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                  >
                    <RadioGroupItem
                      value={o.key}
                      data-testid={`reality-option-${o.key}`}
                      className="mt-0.5"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium">
                        {o.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {o.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            data-testid="reality-apply"
            disabled={!option}
            onClick={submit}
          >
            Aplicar recuperação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Schedule Component Dialog ---------- */
export function ScheduleComponentDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm?: () => void;
}) {
  const p = MOCK_SCHEDULE_PROPOSAL;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Agendar preparo · {p.componentName}
          </DialogTitle>
          <DialogDescription>{p.suggestedWhen}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-secondary/60 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">
                Ativo
              </p>
              <p className="font-display text-lg">{p.activeMin}m</p>
            </div>
            <div className="rounded-xl bg-secondary/60 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">
                Total
              </p>
              <p className="font-display text-lg">{p.totalMin}m</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">
                Rende
              </p>
              <p className="font-display text-lg">{p.producedMl} ml</p>
            </div>
          </div>
          <Card className="p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Reservas
            </p>
            <ul className="mt-1 space-y-1 text-sm">
              {p.reservations.map((r, i) => (
                <li
                  key={i}
                  data-testid={`schedule-reservation-${i}`}
                  className="flex justify-between border-b border-border/60 py-1 last:border-0"
                >
                  <span>
                    {r.forTitle} · {r.forDate}
                  </span>
                  <span className="text-muted-foreground">{r.qty}</span>
                </li>
              ))}
              {p.frozen.map((f, i) => (
                <li
                  key={"f" + i}
                  data-testid={`schedule-frozen-${i}`}
                  className="flex items-center justify-between border-b border-border/60 py-1 last:border-0"
                >
                  <span className="inline-flex items-center gap-1">
                    <Snowflake className="h-3 w-3 text-accent" />
                    {f.label}
                  </span>
                  <span className="text-muted-foreground">{f.qty}</span>
                </li>
              ))}
            </ul>
          </Card>
          {p.alsoUsedBy?.length > 0 && (
            <Card className="p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Também poderá ser usado por
              </p>
              <ul className="mt-1 text-sm">
                {p.alsoUsedBy.map((r, i) => (
                  <li key={i} className="text-muted-foreground">
                    · {r.title} — {r.note}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            data-testid="schedule-confirm"
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
          >
            Confirmar agenda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Recipe Component Dependency Block (used inside RecipeDetail) ---------- */
export function RecipeComponentDependency({
  onSchedule,
}: {
  onSchedule?: () => void;
}) {
  const d = MOCK_COMPONENT_RECIPE_DEP;
  return (
    <Card
      data-testid="recipe-component-dep"
      className="border-accent/40 bg-accent/5 p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/25 text-accent">
          <Package className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-accent">
            Depende de um preparo
          </p>
          <p className="font-display text-lg">
            Esta receita requer{" "}
            <b>
              {d.requiredMl} ml de {d.componentName.toLowerCase()}
            </b>
            .
          </p>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {d.alternatives.map((a) => (
              <li key={a.key} data-testid={`rec-comp-alt-${a.key}`}>
                <button
                  onClick={a.key === "schedule" ? onSchedule : undefined}
                  className={`w-full rounded-2xl border p-3 text-left transition-colors ${a.key === "schedule" ? "border-primary/40 bg-primary/5 hover:border-primary" : "border-border bg-card"}`}
                >
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.hint}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Simulation Dialog ---------- */
export function SimulationDialog({
  open,
  onOpenChange,
  onAccept,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAccept?: (choice: string) => void;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const sim = MOCK_SIMULATION;
  const plans: [string, any][] = [
    ["A", sim.A],
    ["B", sim.B],
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Simulação da semana
          </DialogTitle>
          <DialogDescription>
            Compare duas alternativas antes de aceitar. Nada muda na despensa
            até a confirmação.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[62vh]">
          <div className="grid gap-4 pr-2 md:grid-cols-2">
            {plans.map(([k, p]) => (
              <Card
                key={k}
                data-testid={`sim-plan-${k}`}
                className={`p-4 ${choice === k ? "border-primary" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-xl">{p.label}</p>
                  <button
                    data-testid={`sim-pick-${k}`}
                    onClick={() => setChoice(k)}
                    className={`rounded-full border px-3 py-1 text-xs ${choice === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
                  >
                    {choice === k ? "Escolhido" : "Escolher"}
                  </button>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {p.bullets.map((b: string, i: number) => (
                    <li key={i} className="flex gap-2">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                      {b}
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 divide-y divide-border rounded-xl border border-border">
                  {p.metrics.map(
                    ([label, value]: [string, string], i: number) => (
                      <div
                        key={i}
                        className="flex justify-between px-3 py-1.5 text-xs"
                      >
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ),
                  )}
                </dl>
                {p.assumptions?.length > 0 && (
                  <p className="mt-2 text-[11px] italic text-muted-foreground">
                    Suposições: {p.assumptions.join(" · ")}
                  </p>
                )}
              </Card>
            ))}
          </div>
          <Card className="mt-4 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Consumo sequencial · Frango disponível
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {sim.chickenTimeline.map((row, i) => (
                <li
                  key={i}
                  data-testid={`sim-chicken-${i}`}
                  className="flex items-center justify-between border-b border-border/60 py-1 last:border-0"
                >
                  <span className="flex items-center gap-2">
                    {row.change !== null && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                    {row.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.change !== null ? `${row.change} g · ` : ""}
                    <b className="text-foreground">{row.running} g</b>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            data-testid="sim-accept"
            disabled={!choice}
            onClick={() => {
              if (choice) onAccept?.(choice);
              onOpenChange(false);
            }}
          >
            Aceitar {choice ? `Plano ${choice}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Reconciliation Table (used inside CookFlow finish) ---------- */
export function ReconciliationTable() {
  const r = MOCK_RECONCILIATION;
  return (
    <Card data-testid="reconcile-table" className="p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Previsto × Ocorrido
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-secondary/60 p-2">
          <p className="text-muted-foreground">Previsto</p>
          <p className="font-display text-xl">{r.plannedPortions}</p>
          <p>porções</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2">
          <p className="text-muted-foreground">Produzido</p>
          <p className="font-display text-xl">{r.actualPortions}</p>
          <p>porções</p>
        </div>
        <div className="rounded-xl bg-accent/10 p-2">
          <p className="text-muted-foreground">Diferença</p>
          <p className="font-display text-xl">
            +{r.actualPortions - r.plannedPortions}
          </p>
        </div>
      </div>
      <table className="mt-4 w-full text-xs">
        <thead className="text-muted-foreground">
          <tr>
            <th className="text-left font-normal">Item</th>
            <th className="text-right font-normal">Previsto</th>
            <th className="text-right font-normal">Ocorrido</th>
            <th className="text-right font-normal">Δ</th>
          </tr>
        </thead>
        <tbody>
          {r.rows.map((row, i) => (
            <tr
              key={i}
              data-testid={`reconcile-row-${i}`}
              className="border-t border-border"
            >
              <td className="py-1.5">{row.label}</td>
              <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                {row.planned}
              </td>
              <td className="py-1.5 text-right tabular-nums">{row.actual}</td>
              <td
                className={`py-1.5 text-right tabular-nums ${row.diff.startsWith("+") ? "text-primary" : row.diff.startsWith("-") ? "text-warning" : "text-muted-foreground"}`}
              >
                {row.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
        {r.substitutions.length > 0 && (
          <div className="rounded-xl bg-secondary/60 p-2">
            <p className="text-muted-foreground">Substituições</p>
            {r.substitutions.map((s, i) => (
              <p key={i}>
                {s.of} → {s.by}
              </p>
            ))}
          </div>
        )}
        {r.notUsed.length > 0 && (
          <div className="rounded-xl bg-secondary/60 p-2">
            <p className="text-muted-foreground">Não utilizados</p>
            {r.notUsed.map((n, i) => (
              <p key={i}>
                {n.name} · {n.qty}
              </p>
            ))}
          </div>
        )}
        <div className="rounded-xl bg-secondary/60 p-2">
          <p className="text-muted-foreground">Consumo</p>
          <p>
            Servidas: {r.consumed} · Refrigeradas: {r.refrigerated} ·
            Congeladas: {r.frozen} · Descartadas: {r.discarded}
          </p>
        </div>
        {r.notes && (
          <div className="rounded-xl bg-secondary/60 p-2">
            <p className="text-muted-foreground">Notas</p>
            <p className="italic">{r.notes}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------- Trouble Save Dialog (post-trouble learning) ---------- */
export function TroubleSaveDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm?: (choice: string) => void;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Como quer guardar esse aprendizado?
          </DialogTitle>
          <DialogDescription>
            Sua receita original nunca muda sem sua confirmação.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={choice || ""}
          onValueChange={setChoice}
          className="grid gap-2"
        >
          {MOCK_TROUBLE_SAVE.map((o) => (
            <label
              key={o.key}
              className={`flex items-start gap-2 rounded-2xl border p-3 ${choice === o.key ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <RadioGroupItem
                value={o.key}
                data-testid={`trouble-save-${o.key}`}
                className="mt-0.5"
              />
              <span className="flex-1">
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {o.hint}
                </span>
              </span>
            </label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            data-testid="trouble-save-confirm"
            disabled={!choice}
            onClick={() => {
              if (choice) onConfirm?.(choice);
              onOpenChange(false);
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Trouble Content (Cook mode help card) ---------- */
export function TroubleContent({
  onFinishOffer,
}: {
  onFinishOffer?: () => void;
}) {
  const t = MOCK_TROUBLE;
  return (
    <div data-testid="trouble-content" className="space-y-3">
      <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-warning" />
          {t.problem}
        </p>
        <p className="mt-2 text-sm">
          <b>Explicação provável:</b> {t.explanation}
        </p>
        <p className="text-sm">
          <b>Ação sugerida:</b> {t.action}
        </p>
        <p className="mt-1 text-xs text-muted-foreground italic">
          {t.nextStepAdjust}
        </p>
        {t.safetyWarning && (
          <p className="mt-2 rounded-lg bg-destructive/15 p-2 text-xs text-destructive">
            ⚠ {t.safetyWarning}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        data-testid="trouble-offer-save"
        onClick={onFinishOffer}
      >
        Ao terminar, quero guardar esse aprendizado
      </Button>
    </div>
  );
}
