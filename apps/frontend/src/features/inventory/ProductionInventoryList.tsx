import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useInventoryRepository } from "./InventoryProvider";
import { formatQuantityLabel } from "./quantityDisplay";
import type { InventoryLotView } from "@/adapters/live/inventoryTypes";
import { InventoryApiError } from "@/adapters/live/inventoryTypes";
import { useSession } from "@/app/session/SessionProvider";
import {
  useProductionI18n,
  type ProductionLocale,
} from "@/app/i18n/ProductionI18nProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Authenticated production inventory list with search and cursor pagination.
 */
export function ProductionInventoryList() {
  const repo = useInventoryRepository();
  const { session } = useSession();
  const { t, locale } = useProductionI18n();
  const [items, setItems] = useState<InventoryLotView[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (cursor?: string, append = false) => {
      setStatus("loading");
      setError(null);
      try {
        const page = await repo.listLots({
          search: search || undefined,
          cursor,
          pageSize: 20,
        });
        setItems((prev) => (append ? [...prev, ...page.items] : page.items));
        setNextCursor(page.nextCursor);
        setStatus("ready");
      } catch (err) {
        if (err instanceof InventoryApiError && err.code === "cancelled") {
          return;
        }
        setStatus("error");
        setError(t("inventory.error.loadList"));
      }
    },
    [repo, search, t],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (session.status === "loading") {
    return (
      <p role="status" data-testid="inventory-loading">
        {t("inventory.loading")}
      </p>
    );
  }

  return (
    <div data-testid="production-inventory-list" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{t("inventory.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("inventory.subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/despensa/novo" data-testid="inventory-create">
            {t("inventory.actions.create")}
          </Link>
        </Button>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <label className="min-w-[12rem] flex-1">
          <span className="sr-only">{t("inventory.search")}</span>
          <Input
            data-testid="inventory-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("inventory.search")}
          />
        </label>
        <Button type="submit" variant="secondary">
          {t("inventory.actions.search")}
        </Button>
      </form>

      {status === "error" && (
        <div role="alert" className="space-y-2">
          <p>{error}</p>
          <Button
            type="button"
            data-testid="inventory-retry"
            onClick={() => void load()}
          >
            {t("inventory.actions.retry")}
          </Button>
        </div>
      )}

      {status === "ready" && items.length === 0 && (
        <div data-testid="inventory-empty" className="rounded-xl border p-8">
          <p>{t("inventory.empty")}</p>
          <Button asChild className="mt-4">
            <Link to="/app/despensa/novo">{t("inventory.actions.create")}</Link>
          </Button>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.lotId}>
            <Link
              to={`/app/despensa/${item.lotId}`}
              data-testid={`inventory-lot-link-${item.lotId}`}
              className="block rounded-xl border border-border p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium">{item.productName}</h2>
                <span className="text-sm text-muted-foreground">
                  {t(`inventory.location.${item.storageLocation}`)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatQuantityLabel(
                  item.quantity,
                  locale as ProductionLocale,
                  t,
                )}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {nextCursor && (
        <Button
          type="button"
          variant="secondary"
          data-testid="inventory-load-more"
          onClick={() => void load(nextCursor, true)}
        >
          {t("inventory.actions.loadMore")}
        </Button>
      )}
    </div>
  );
}
