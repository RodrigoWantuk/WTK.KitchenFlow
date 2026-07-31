import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

const AISLES = ["produce","fridge","meat","bakery","grocery","cleaning","other"];

export default function Shopping() {
  const { tr, shopping, toggleShopping, removeShopping, addShopping, finishShopping } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", qty: "", unit: "un", aisle: "grocery" });
  const [finishOpen, setFinish] = useState(false);

  const grouped = useMemo(() => {
    const g = {};
    AISLES.forEach(a => g[a] = []);
    shopping.forEach(i => { if (!g[i.aisle]) g[i.aisle] = []; g[i.aisle].push(i); });
    return g;
  }, [shopping]);

  const done = shopping.filter(i => i.checked).length;
  const pct = shopping.length ? Math.round((done / shopping.length) * 100) : 0;

  const submitAdd = () => {
    if (!newItem.name) return;
    addShopping({ ...newItem, qty: Number(newItem.qty) || 1, origin: "manual" });
    setNewItem({ name: "", qty: "", unit: "un", aisle: "grocery" });
    setAddOpen(false);
    toast.success("Item adicionado");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">{tr("shopping.title")}</h1>
          <p className="text-sm text-muted-foreground">{done}/{shopping.length} · {pct}%</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="sh-add" onClick={() => setAddOpen(true)} className="rounded-full"><Plus className="mr-1 h-4 w-4" />{tr("shopping.addItem")}</Button>
          <Button data-testid="sh-finish" variant="outline" onClick={() => setFinish(true)}>{tr("shopping.finish")}</Button>
        </div>
      </div>
      <Progress value={pct} className="h-2" />

      {shopping.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">{tr("shopping.empty")}</Card>
      ) : (
        <div className="space-y-4">
          {AISLES.filter(a => grouped[a]?.length).map(a => (
            <Card key={a} className="p-4">
              <p className="mb-3 font-display text-lg">{tr(`shopping.aisles.${a}`)}</p>
              <ul className="divide-y divide-border">
                {grouped[a].map(i => (
                  <li key={i.id} data-testid={`sh-item-${i.id}`} className="flex items-center gap-3 py-3">
                    <Checkbox data-testid={`sh-check-${i.id}`} checked={i.checked} onCheckedChange={() => toggleShopping(i.id)} className="h-5 w-5" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${i.checked ? "line-through text-muted-foreground" : ""}`}>{i.name}</p>
                      <p className="text-[11px] text-muted-foreground">{i.qty} {i.unit} · {tr(`shopping.origin.${i.origin}`)}</p>
                    </div>
                    <button data-testid={`sh-remove-${i.id}`} onClick={() => removeShopping(i.id)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{tr("shopping.addItem")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input data-testid="sh-new-name" placeholder="Nome" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <Input data-testid="sh-new-qty" placeholder="Qtd" value={newItem.qty} onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })} />
              <Input data-testid="sh-new-unit" placeholder="un" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
              <select data-testid="sh-new-aisle" value={newItem.aisle} onChange={(e) => setNewItem({ ...newItem, aisle: e.target.value })} className="rounded-md border border-border bg-background px-2 text-sm">
                {AISLES.map(a => <option key={a} value={a}>{tr(`shopping.aisles.${a}`)}</option>)}
              </select>
            </div>
            <Button data-testid="sh-new-save" onClick={submitAdd} className="w-full">{tr("common.save")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={finishOpen} onOpenChange={setFinish}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl">{tr("shoppingReconcile.title")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{tr("shoppingReconcile.description")}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3">
              <p className="font-display text-2xl leading-none" data-testid="reconcile-tomove">{done}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tr("shoppingReconcile.willAdd")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/40 p-3">
              <p className="font-display text-2xl leading-none" data-testid="reconcile-tokeep">{shopping.length - done}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tr("shoppingReconcile.willKeep")}</p>
            </div>
          </div>
          {done > 0 && (
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-2 text-xs">
              {shopping.filter(i => i.checked).map(i => (
                <li key={i.id} data-testid={`reconcile-item-${i.id}`} className="flex justify-between">
                  <span>{i.name}</span>
                  <span className="text-muted-foreground">{i.qty} {i.unit}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFinish(false)}>{tr("common.cancel")}</Button>
            <Button data-testid="sh-finish-confirm" disabled={done === 0} onClick={() => {
              finishShopping();
              setFinish(false);
              toast.success(`${done} ${tr("shoppingReconcile.moved")}`);
            }}>{tr("shoppingReconcile.confirm")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
