import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  ArrowLeft,
  Trash2,
  Snowflake,
  Refrigerator,
  Package as PackageIcon,
} from "lucide-react";
import { toast } from "sonner";

const locIcon: Record<string, typeof PackageIcon> = {
  pantry: PackageIcon,
  fridge: Refrigerator,
  freezer: Snowflake,
  other: PackageIcon,
};

export default function ItemDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { tr, pantry, updatePantry, removePantry } = useStore();
  const item = pantry.find((i) => i.id === id);
  const [dlg, setDlg] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  if (!item)
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <p className="font-display text-2xl">Item não encontrado.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/app/despensa">{tr("item.backToPantry")}</Link>
        </Button>
      </div>
    );

  const Icon = locIcon[item.location] || PackageIcon;

  const doConsume = () => {
    const n = Number(amount);
    if (item.mode === "measured")
      updatePantry(item.id, { qty: Math.max(0, (item.qty ?? 0) - (n || 0)) });
    else updatePantry(item.id, { availability: "low" });
    toast.success(`Consumidos ${amount || "alguns"} ${item.unit || ""}`);
    setDlg(null);
    setAmount("");
  };
  const doDiscard = () => {
    removePantry(item.id);
    toast.success("Item descartado");
    nav("/app/despensa");
  };
  const doOut = () => {
    updatePantry(
      item.id,
      item.mode === "measured" ? { qty: 0 } : { availability: "out" },
    );
    toast.success("Marcado como esgotado");
  };
  const doMove = (loc: string) => {
    updatePantry(item.id, { location: loc });
    toast.success("Movido");
    setDlg(null);
  };
  const doDelete = () => {
    removePantry(item.id);
    nav("/app/despensa");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        data-testid="item-back"
        onClick={() => nav(-1)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {tr("common.back")}
      </button>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-foreground/80">
            <Icon className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h1 className="font-display text-3xl">{item.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.mode === "measured"
                ? `${item.qty} ${item.unit}`
                : tr(`pantry.approx.${item.availability}`)}
              {" · "}
              {tr(`pantry.locations.${item.location}`)}
              {item.expiry &&
                ` · venc. ${new Date(item.expiry).toLocaleDateString()}`}
            </p>
            {item.attention && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-warning/15 px-3 py-1 text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-warning" />{" "}
                {tr(`pantry.attentionReasons.${item.attention}`)}
              </div>
            )}
            {item.notes && (
              <p className="mt-3 text-sm text-muted-foreground">{item.notes}</p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button data-testid="item-consume" onClick={() => setDlg("consume")}>
            {tr("item.consume")}
          </Button>
          <Button
            variant="outline"
            data-testid="item-correct"
            onClick={() => setDlg("correct")}
          >
            {tr("item.correct")}
          </Button>
          <Button
            variant="outline"
            data-testid="item-move"
            onClick={() => setDlg("move")}
          >
            {tr("item.move")}
          </Button>
          <Button variant="outline" data-testid="item-markout" onClick={doOut}>
            {tr("item.markOut")}
          </Button>
          <Button
            variant="outline"
            data-testid="item-discard"
            onClick={doDiscard}
          >
            {tr("item.discard")}
          </Button>
          <Button variant="ghost" data-testid="item-delete" onClick={doDelete}>
            <Trash2 className="mr-1 h-4 w-4" />
            {tr("item.delete")}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-xl">{tr("item.history")}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between border-b border-border pb-2">
            <span>Adicionado à despensa</span>
            <span className="text-muted-foreground">3 dias atrás</span>
          </li>
          <li className="flex justify-between border-b border-border pb-2">
            <span>Quantidade corrigida</span>
            <span className="text-muted-foreground">ontem</span>
          </li>
          {item.packaging === "opened" && (
            <li className="flex justify-between">
              <span>Embalagem aberta</span>
              <span className="text-muted-foreground">hoje</span>
            </li>
          )}
        </ul>
      </Card>

      <Dialog open={!!dlg} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {dlg === "consume" && tr("item.consume")}
              {dlg === "correct" && tr("item.correct")}
              {dlg === "move" && tr("item.move")}
            </DialogTitle>
          </DialogHeader>
          {dlg === "consume" && (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                Quanto foi consumido?
              </p>
              <div className="flex gap-2">
                <Input
                  data-testid="consume-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={
                    item.mode === "measured"
                      ? `qtd em ${item.unit}`
                      : "descrição"
                  }
                />

                <Button data-testid="consume-confirm" onClick={doConsume}>
                  OK
                </Button>
              </div>
            </div>
          )}
          {dlg === "correct" && (
            <div className="flex gap-2">
              <Input
                data-testid="correct-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`nova qtd em ${item.unit || ""}`}
              />

              <Button
                data-testid="correct-confirm"
                onClick={() => {
                  updatePantry(item.id, { qty: Number(amount) || item.qty });
                  toast.success("Corrigido");
                  setDlg(null);
                  setAmount("");
                }}
              >
                OK
              </Button>
            </div>
          )}
          {dlg === "move" && (
            <div className="grid grid-cols-2 gap-2">
              {["pantry", "fridge", "freezer", "other"].map((l) => (
                <Button
                  key={l}
                  data-testid={`move-${l}`}
                  variant="outline"
                  onClick={() => doMove(l)}
                >
                  {tr(`pantry.locations.${l}`)}
                </Button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDlg(null)}>
              {tr("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
