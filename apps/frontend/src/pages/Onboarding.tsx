import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DIET_PREFERENCES, RESTRICTIONS, GOALS, EQUIPMENT_LIST } from "@/lib/mockData";
import { Check, ChevronRight } from "lucide-react";

function Chip({ active, onClick, children, testid }: { active: boolean; onClick: () => void; children: React.ReactNode; testid: string }) {
  return (
    <button data-testid={testid} onClick={onClick} className={`rounded-full border px-4 py-2 text-sm transition-colors ${active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
      {active && <Check className="mr-1 inline h-3.5 w-3.5" />}{children}
    </button>
  );
}

function toggle(arr: string[], v: string) { return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]; }

export default function Onboarding() {
  const { tr, profile, setProfile, setAuthed } = useStore();
  const nav = useNavigate();
  const [step, step_set] = useState(0);
  const [local, setLocal] = useState(profile);

  const steps = tr("onboarding.steps") as any; // i18n nested arrays not reflected in tr(): string
  const finish = () => { setProfile({ ...local, onboardingDone: true }); setAuthed(true); nav("/app/hoje"); };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-10 md:py-16">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl">{tr("onboarding.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tr("onboarding.sub")}</p>
        </div>

        <div className="mb-6 flex gap-2">
          {steps.map((s: any, i: number) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>
        <p className="mb-6 text-sm font-medium text-foreground">{steps[step]}</p>

        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium">Adultos</label>
                <div className="mt-2 flex items-center gap-4">
                  <Slider data-testid="ob-adults" value={[local.household.adults]} min={1} max={6} step={1} onValueChange={([v]) => setLocal({ ...local, household: { ...local.household, adults: v } })} className="flex-1" />
                  <span className="w-8 text-center font-display text-lg">{local.household.adults}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Crianças</label>
                <div className="mt-2 flex items-center gap-4">
                  <Slider data-testid="ob-children" value={[local.household.children]} min={0} max={6} step={1} onValueChange={([v]) => setLocal({ ...local, household: { ...local.household, children: v } })} className="flex-1" />
                  <span className="w-8 text-center font-display text-lg">{local.household.children}</span>
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Como sua casa costuma comer?</p>
              <div className="flex flex-wrap gap-2">
                {DIET_PREFERENCES.map(p => (
                  <Chip key={p} testid={`ob-pref-${p}`} active={local.preferences.includes(p)} onClick={() => setLocal({ ...local, preferences: toggle(local.preferences, p) })}>{p}</Chip>
                ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground mb-3">Objetivos</p>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(g => (
                  <Chip key={g} testid={`ob-goal-${g}`} active={local.goals.includes(g)} onClick={() => setLocal({ ...local, goals: toggle(local.goals, g) })}>{g}</Chip>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Restrições médicas ou alergias</p>
              <div className="flex flex-wrap gap-2">
                {RESTRICTIONS.map(r => (
                  <Chip key={r} testid={`ob-rest-${r}`} active={local.restrictions.includes(r)} onClick={() => setLocal({ ...local, restrictions: toggle(local.restrictions, r) })}>{r}</Chip>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Diferenciamos restrições de simples preferências.</p>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6">
              {[
                ["Habilidade", "skill"], ["Tempo disponível", "time"], ["Esforço tolerado", "effort"], ["Tolerância à limpeza", "cleanup"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="text-sm font-medium">{label}</label>
                  <div className="mt-2 flex items-center gap-4">
                    <Slider data-testid={`ob-${key}`} value={[(local as any)[key]]} min={1} max={3} step={1} onValueChange={([v]) => setLocal({ ...local, [key]: v })} className="flex-1" />
                    <span className="w-16 text-center text-xs text-muted-foreground">{["Baixo","Médio","Alto"][(local as any)[key]-1]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {step === 4 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">O que você tem em casa?</p>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_LIST.map(e => (
                  <Chip key={e} testid={`ob-eq-${e}`} active={local.equipment.includes(e)} onClick={() => setLocal({ ...local, equipment: toggle(local.equipment, e) })}>{e}</Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button data-testid="ob-skip" onClick={finish} className="text-sm text-muted-foreground hover:text-foreground">{tr("onboarding.skip")}</button>
          <div className="flex gap-2">
            {step > 0 && <Button variant="outline" data-testid="ob-prev" onClick={() => step_set(step - 1)}>{tr("common.back")}</Button>}
            {step < steps.length - 1
              ? <Button data-testid="ob-next" onClick={() => step_set(step + 1)}>{tr("onboarding.next")} <ChevronRight className="ml-1 h-4 w-4" /></Button>
              : <Button data-testid="ob-done" onClick={finish}>{tr("onboarding.done")}</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
