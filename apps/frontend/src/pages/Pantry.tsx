import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  AlertCircle,
  Snowflake,
  Refrigerator,
  Package as PackageIcon,
} from "lucide-react";
import { PreparedComponentAvailabilityBar } from "@/features/pantry/PreparedComponentAvailabilityBar";
import { projectPreparedComponentFromPantryItem } from "@/adapters/mock/preparedComponentFixtures";

const locIcon: Record<string, typeof PackageIcon> = {
  pantry: PackageIcon,
  fridge: Refrigerator,
  freezer: Snowflake,
  other: PackageIcon,
};

function ApproxBlob({ v }: { v: string }) {
  const map: Record<string, number> = {
    lots: 100,
    some: 60,
    low: 25,
    unknown: 0,
    out: 0,
  };
  const pct = map[v] ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary/70"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground capitalize">
        {v || "?"}
      </span>
    </div>
  );
}

function ReservedBar({ item, tr }: { item: any; tr: (k: string) => string }) {
  const nav = useNavigate();
  const availability = projectPreparedComponentFromPantryItem(item);
  if (!availability || item.mode !== "measured") return null;
  return (
    <PreparedComponentAvailabilityBar
      availability={availability}
      tr={tr}
      onReviewShortfall={() => nav("/app/compras?review=shortfall")}
    />
  );
}

/**
 * Pantry list card: detail navigation and shortfall action are sibling controls
 * (no interactive nesting).
 */
export function PantryItemCard({
  item,
  tr,
}: {
  item: any;
  tr: (k: string) => string;
}) {
  const Icon = locIcon[item.location] || PackageIcon;
  return (
    <Card
      data-testid={`pantry-item-${item.id}`}
      className="p-4 card-hover space-y-2"
    >
      <Link
        to={`/app/despensa/${item.id}`}
        data-testid={`pantry-item-link-${item.id}`}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/70 text-foreground/80">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-medium">{item.name}</h3>
              {item.attention && (
                <span className="pill bg-warning/20 text-foreground/80">
                  <AlertCircle className="h-3 w-3 text-warning" />
                  {tr(`pantry.attentionReasons.${item.attention}`)}
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {item.mode === "measured" ? (
                <span data-testid={`pantry-qty-${item.id}`}>
                  {item.qty} {item.unit}
                </span>
              ) : (
                <ApproxBlob v={item.availability} />
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{tr(`pantry.locations.${item.location}`)}</span>
              {item.expiry && (
                <span>
                  · venc. {new Date(item.expiry).toLocaleDateString()}
                </span>
              )}
              {item.packaging === "opened" && <span>· aberto</span>}
            </div>
          </div>
        </div>
      </Link>
      <ReservedBar item={item} tr={tr} />
    </Card>
  );
}

export default function Pantry() {
  const { tr, pantry } = useStore();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    return pantry.filter(
      (i) =>
        (!q || i.name.toLowerCase().includes(q.toLowerCase())) &&
        (tab === "all" ||
          (tab === "attention" ? i.attention : i.location === tab)),
    );
  }, [pantry, q, tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{tr("pantry.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {pantry.length} {pantry.length === 1 ? "item" : "itens"}
          </p>
        </div>
        <Link to="/app/despensa/novo">
          <Button data-testid="pantry-add" className="rounded-full">
            <Plus className="mr-1 h-4 w-4" />
            {tr("pantry.add")}
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid="pantry-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr("pantry.search")}
          className="pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full flex-wrap justify-start">
          <TabsTrigger data-testid="tab-all" value="all">
            {tr("pantry.all")}
          </TabsTrigger>
          <TabsTrigger data-testid="tab-attention" value="attention">
            {tr("pantry.attention")}
          </TabsTrigger>
          <TabsTrigger data-testid="tab-pantry" value="pantry">
            {tr("pantry.locations.pantry")}
          </TabsTrigger>
          <TabsTrigger data-testid="tab-fridge" value="fridge">
            {tr("pantry.locations.fridge")}
          </TabsTrigger>
          <TabsTrigger data-testid="tab-freezer" value="freezer">
            {tr("pantry.locations.freezer")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <Card data-testid="pantry-empty" className="p-10 text-center">
              <p className="font-display text-xl">{tr("pantry.empty")}</p>
              <Link to="/app/despensa/novo" className="mt-4 inline-block">
                <Button>{tr("pantry.addFirst")}</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((i) => (
                <PantryItemCard key={i.id} item={i} tr={tr} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
