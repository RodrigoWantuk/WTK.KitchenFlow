import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DIET_PREFERENCES, RESTRICTIONS, GOALS, EQUIPMENT_LIST } from "@/lib/mockData";
import { toast } from "sonner";

function Chip({ active, onClick, children, testid }) {
  return <button data-testid={testid} onClick={onClick} className={`rounded-full border px-3 py-1.5 text-xs ${active ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>{children}</button>;
}
function toggle(a, v) { return a.includes(v) ? a.filter(x => x !== v) : [...a, v]; }

export default function Settings() {
  const { tr, profile, setProfile, lang, setLang, theme, setTheme, resetAll, favorites, history, recipes } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">{tr("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">Organize sua conta, casa, preferências e privacidade.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex flex-wrap justify-start">
          <TabsTrigger data-testid="set-tab-profile" value="profile">{tr("settings.sections.profile")}</TabsTrigger>
          <TabsTrigger data-testid="set-tab-preferences" value="preferences">{tr("settings.sections.preferences")}</TabsTrigger>
          <TabsTrigger data-testid="set-tab-equipment" value="equipment">{tr("settings.sections.equipment")}</TabsTrigger>
          <TabsTrigger data-testid="set-tab-favorites" value="favorites">Favoritos</TabsTrigger>
          <TabsTrigger data-testid="set-tab-appearance" value="appearance">{tr("settings.sections.appearance")}</TabsTrigger>
          <TabsTrigger data-testid="set-tab-privacy" value="privacy">{tr("settings.sections.privacy")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm">Nome</label>
                <Input data-testid="prof-name" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Região</label>
                <Input data-testid="prof-region" value={profile.region} onChange={(e) => setProfile({ region: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Adultos</label>
                <Slider value={[profile.household.adults]} min={1} max={6} step={1} onValueChange={([v]) => setProfile({ household: { ...profile.household, adults: v } })} />
              </div>
              <div>
                <label className="text-sm">Crianças</label>
                <Slider value={[profile.household.children]} min={0} max={6} step={1} onValueChange={([v]) => setProfile({ household: { ...profile.household, children: v } })} />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4 space-y-4">
          <Card className="p-6">
            <p className="mb-2 text-sm font-medium">Preferências</p>
            <div className="flex flex-wrap gap-2">{DIET_PREFERENCES.map(p => <Chip key={p} testid={`pref-${p}`} active={profile.preferences.includes(p)} onClick={() => setProfile({ preferences: toggle(profile.preferences, p) })}>{p}</Chip>)}</div>
            <p className="mb-2 mt-6 text-sm font-medium">Restrições médicas</p>
            <div className="flex flex-wrap gap-2">{RESTRICTIONS.map(p => <Chip key={p} testid={`rest-${p}`} active={profile.restrictions.includes(p)} onClick={() => setProfile({ restrictions: toggle(profile.restrictions, p) })}>{p}</Chip>)}</div>
            <p className="mb-2 mt-6 text-sm font-medium">Objetivos</p>
            <div className="flex flex-wrap gap-2">{GOALS.map(p => <Chip key={p} testid={`goal-${p}`} active={profile.goals.includes(p)} onClick={() => setProfile({ goals: toggle(profile.goals, p) })}>{p}</Chip>)}</div>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <Card className="p-6">
            <p className="mb-3 text-sm text-muted-foreground">Suas receitas e sugestões consideram estes equipamentos.</p>
            <div className="flex flex-wrap gap-2">{EQUIPMENT_LIST.map(e => <Chip key={e} testid={`eq-${e}`} active={profile.equipment.includes(e)} onClick={() => setProfile({ equipment: toggle(profile.equipment, e) })}>{e}</Chip>)}</div>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="mt-4 space-y-4">
          <Card className="p-6">
            <p className="mb-3 font-display text-lg">Favoritos</p>
            {favorites.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum favorito ainda.</p> : (
              <ul className="space-y-1 text-sm">
                {favorites.map(id => {
                  const r = recipes.find(x => x.id === id);
                  return r ? <li key={id}>★ {r.title}</li> : null;
                })}
              </ul>
            )}
          </Card>
          <Card className="p-6">
            <p className="mb-3 font-display text-lg">Histórico</p>
            <ul className="space-y-1 text-sm">
              {history.map((h, i) => {
                const r = recipes.find(x => x.id === h.recipeId);
                return <li key={i}>{new Date(h.at).toLocaleDateString()} · Preparado: {r?.title || "receita"}</li>;
              })}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card className="space-y-4 p-6">
            <div>
              <p className="mb-2 text-sm font-medium">Tema</p>
              <div className="flex gap-2">
                <Button data-testid="set-theme-light" variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>{tr("settings.light")}</Button>
                <Button data-testid="set-theme-dark" variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>{tr("settings.dark")}</Button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{tr("settings.language")}</p>
              <div className="flex gap-2">
                {[["pt-BR","PT-BR"],["en","EN"],["es","ES"]].map(([code, label]) => (
                  <Button key={code} data-testid={`set-lang-${code}`} variant={lang === code ? "default" : "outline"} onClick={() => setLang(code)}>{label}</Button>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">{tr("privacy.demoOnly")}</p>
          <Card className="p-6">
            <p className="font-display text-lg">{tr("privacy.export")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tr("privacy.exportDesc")}</p>
            <Button data-testid="prv-export" variant="outline" className="mt-3" onClick={() => toast.success("Exportação demo iniciada")}>{tr("privacy.export")}</Button>
          </Card>
          <Card className="p-6">
            <p className="font-display text-lg">{tr("privacy.erase")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tr("privacy.eraseDesc")}</p>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button data-testid="prv-erase" variant="outline" className="mt-3">{tr("privacy.erase")}</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>{tr("privacy.erase")}</AlertDialogTitle><AlertDialogDescription>Isso removerá seus dados demonstrativos.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tr("privacy.cancel")}</AlertDialogCancel>
                  <AlertDialogAction data-testid="prv-erase-confirm" onClick={() => { resetAll(); toast.success("Conteúdo removido (demo)"); }}>{tr("privacy.confirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
          <Card className="border-destructive/30 p-6">
            <p className="font-display text-lg text-destructive">{tr("privacy.delete")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tr("privacy.deleteDesc")}</p>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button data-testid="prv-delete" variant="destructive" className="mt-3">{tr("privacy.delete")}</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>{tr("privacy.delete")}</AlertDialogTitle><AlertDialogDescription>Ação irreversível (demonstrativa neste protótipo).</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tr("privacy.cancel")}</AlertDialogCancel>
                  <AlertDialogAction data-testid="prv-delete-confirm" onClick={() => toast.success("Conta excluída (demo)")}>{tr("privacy.confirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
