import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Search, Star } from "lucide-react";

function Chip({ active, onClick, children, testid }: { active: boolean; onClick: () => void; children: React.ReactNode; testid: string }) {
  return <button data-testid={testid} onClick={onClick} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${active ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>{children}</button>;
}

export default function Recipes() {
  const { tr, recipes, favorites, toggleFavorite } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const list = useMemo(() => recipes.filter(r => {
    if (q && !r.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "have") return r.missing.length === 0;
    if (filter === "quick") return r.totalTime <= 20;
    if (filter === "clean") return r.cleanup === 1;
    if (filter === "fav") return favorites.includes(r.id);
    return true;
  }), [recipes, q, filter, favorites]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">{tr("recipes.title")}</h1>
        <p className="text-sm text-muted-foreground">Combinam com o que você tem em casa.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input data-testid="rec-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("recipes.search")} className="pl-9" />
      </div>

      <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
        <Chip testid="rec-filter-all" active={filter === "all"} onClick={() => setFilter("all")}>Todas</Chip>
        <Chip testid="rec-filter-have" active={filter === "have"} onClick={() => setFilter("have")}>{tr("recipes.available")}</Chip>
        <Chip testid="rec-filter-quick" active={filter === "quick"} onClick={() => setFilter("quick")}>Até 20 min</Chip>
        <Chip testid="rec-filter-clean" active={filter === "clean"} onClick={() => setFilter("clean")}>Pouca limpeza</Chip>
        <Chip testid="rec-filter-fav" active={filter === "fav"} onClick={() => setFilter("fav")}>Favoritos</Chip>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(r => (
          <Link key={r.id} to={`/app/receitas/${r.id}`} data-testid={`rec-card-${r.id}`} className="block">
            <Card className="overflow-hidden card-hover">
              <div className="relative">
                <img src={r.image} alt={r.title} className="h-40 w-full object-cover" />
                <button data-testid={`rec-fav-${r.id}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(r.id); }} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/85 backdrop-blur">
                  <Star className={`h-4 w-4 ${favorites.includes(r.id) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                </button>
                <span className={`pill absolute bottom-3 left-3 ${r.missing.length === 0 ? "bg-primary text-primary-foreground" : "bg-background/90 text-foreground"}`}>
                  {r.missing.length === 0 ? tr("recipes.available") : `${tr("recipes.missing")}: ${r.missing.length}`}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg">{r.title}</h3>
                <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{r.totalTime} min</span>
                  <span>{r.servings} porções</span>
                  <span>{["", "Fácil","Média","Difícil"][r.difficulty]}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      {list.length === 0 && <Card className="p-8 text-center text-muted-foreground">{tr("states.empty")}</Card>}
    </div>
  );
}
