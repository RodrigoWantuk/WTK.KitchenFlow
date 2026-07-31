import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function ItemForm() {
  const { tr, addPantry } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", category: "grocery", mode: "measured", qty: "", unit: "g", availability: "some", location: "pantry", packaging: "sealed", expiry: "", opened: "", notes: "" });
  const [showMore, setShowMore] = useState(false);

  const save = (mode: string) => {
    if (!f.name) { toast.error("Nome é obrigatório"); return; }
    // any: mock addPantry accepts mixed qty string/number shapes before normalization
    const payload: any = { ...f };
    if (payload.mode === "measured") payload.qty = Number(payload.qty) || 0;
    else { delete payload.qty; delete payload.unit; }
    addPantry(payload);
    toast.success(tr("item.saved"));
    if (mode === "another") setF({ ...f, name: "", qty: "", notes: "" });
    else if (mode === "view") nav("/app/despensa");
    else nav("/app/despensa");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-4xl">{tr("pantry.add")}</h1>
        <p className="text-sm text-muted-foreground">Rápido e sem formulário longo.</p>
      </div>

      <Card className="space-y-5 p-6">
        <div>
          <Label htmlFor="name">{tr("item.name")}</Label>
          <Input id="name" data-testid="if-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Arroz integral" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{tr("item.category")}</Label>
            <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
              <SelectTrigger data-testid="if-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["produce","fridge","meat","bakery","grocery","cleaning","other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{tr("item.location")}</Label>
            <Select value={f.location} onValueChange={(v) => setF({ ...f, location: v })}>
              <SelectTrigger data-testid="if-location"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["pantry","fridge","freezer","other"].map(c => <SelectItem key={c} value={c}>{tr(`pantry.locations.${c}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>{tr("item.qty")}</Label>
          <RadioGroup value={f.mode} onValueChange={(v) => setF({ ...f, mode: v })} className="mt-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="measured" data-testid="if-mode-measured" /> {tr("pantry.qtyModes.measured")}</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="approx" data-testid="if-mode-approx" /> {tr("pantry.qtyModes.approx")}</label>
          </RadioGroup>
          {f.mode === "measured" ? (
            <div className="mt-3 grid grid-cols-[1fr_120px] gap-3">
              <Input data-testid="if-qty" placeholder="500" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} inputMode="decimal" />
              <Select value={f.unit} onValueChange={(v) => setF({ ...f, unit: v })}>
                <SelectTrigger data-testid="if-unit"><SelectValue /></SelectTrigger>
                <SelectContent>{["g","kg","ml","L","un","fatias","porções"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {["lots","some","low","unknown","out"].map(a => (
                <button key={a} data-testid={`if-av-${a}`} type="button" onClick={() => setF({ ...f, availability: a })} className={`rounded-full border px-3 py-1.5 text-sm ${f.availability === a ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
                  {tr(`pantry.approx.${a}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        <button data-testid="if-more-toggle" type="button" onClick={() => setShowMore(v => !v)} className="text-sm text-primary underline underline-offset-4">
          {showMore ? "Menos opções" : "Mais opções (embalagem, validade, notas)"}
        </button>

        {showMore && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{tr("item.pack")}</Label>
              <Select value={f.packaging} onValueChange={(v) => setF({ ...f, packaging: v })}>
                <SelectTrigger data-testid="if-pack"><SelectValue /></SelectTrigger>
                <SelectContent>{["sealed","opened","none"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{tr("item.expiry")}</Label>
              <Input type="date" data-testid="if-expiry" value={f.expiry} onChange={(e) => setF({ ...f, expiry: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>{tr("item.notes")}</Label>
              <Textarea data-testid="if-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button data-testid="if-save" onClick={() => save("back")}>{tr("item.save")}</Button>
          <Button variant="outline" data-testid="if-save-another" onClick={() => save("another")}>{tr("item.addAnother")}</Button>
          <Button variant="ghost" data-testid="if-cancel" onClick={() => nav("/app/despensa")}>{tr("item.cancel")}</Button>
        </div>
      </Card>
    </div>
  );
}
