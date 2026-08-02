import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useInventoryRepository } from "./InventoryProvider";
import { formatQuantityLabel } from "./quantityDisplay";
import {
  InventoryApiError,
  type InventoryHistoryEntry,
  type InventoryLotView,
} from "@/adapters/live/inventoryTypes";
import { useSession } from "@/app/session/SessionProvider";
import {
  useProductionI18n,
  type ProductionLocale,
} from "@/app/i18n/ProductionI18nProvider";
import { formatCalendarDateForDisplay } from "@/lib/calendarDate";
import { parseLocaleDecimal } from "@/lib/localeDecimal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Lot detail with adjust, history, delete, and stale-version conflict handling.
 */
export function ProductionInventoryDetail() {
  const { lotId = "" } = useParams();
  const repo = useInventoryRepository();
  const { session } = useSession();
  const { t, locale } = useProductionI18n();
  const navigate = useNavigate();
  const [lot, setLot] = useState<InventoryLotView | null>(null);
  const [history, setHistory] = useState<InventoryHistoryEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setConflict(false);
    try {
      const [next, hist] = await Promise.all([
        repo.getLot(lotId),
        repo.getHistory(lotId),
      ]);
      setLot(next);
      setHistory(hist);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof InventoryApiError && err.code === "not_found"
          ? t("inventory.error.notFound")
          : t("inventory.error.loadDetail"),
      );
    }
  }, [lotId, repo, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function requireCsrf(): Promise<string> {
    if (!session.csrfToken) {
      throw new InventoryApiError(
        "authentication_required",
        "Missing CSRF token",
        401,
      );
    }
    return session.csrfToken;
  }

  async function onConsume() {
    if (!lot) return;
    setAdjustError(null);
    const parsed = parseLocaleDecimal(adjustValue, locale);
    if (!parsed.ok) {
      setAdjustError(t("inventory.error.invalidDecimal"));
      return;
    }
    setBusy(true);
    try {
      const csrfToken = await requireCsrf();
      const next = await repo.adjustLot(
        lot.lotId,
        { type: "Consume", value: parsed.value, reasonCode: "ui_consume" },
        {
          csrfToken,
          etag: lot.etag,
          idempotencyKey: crypto.randomUUID(),
        },
      );
      setLot(next);
      setAdjustValue("");
      setHistory(await repo.getHistory(lot.lotId));
    } catch (err) {
      if (
        err instanceof InventoryApiError &&
        err.code === "precondition_failed"
      ) {
        setConflict(true);
        setError(t("inventory.error.staleVersion"));
      } else {
        setAdjustError(t("inventory.error.adjust"));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!lot) return;
    if (!window.confirm(t("inventory.confirmDelete"))) return;
    setBusy(true);
    try {
      const csrfToken = await requireCsrf();
      await repo.deleteLot(lot.lotId, { csrfToken, etag: lot.etag });
      navigate("/app/despensa");
    } catch (err) {
      if (
        err instanceof InventoryApiError &&
        err.code === "precondition_failed"
      ) {
        setConflict(true);
        setError(t("inventory.error.staleVersion"));
      } else {
        setError(t("inventory.error.delete"));
      }
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return (
      <p role="status" data-testid="inventory-detail-loading">
        {t("inventory.loading")}
      </p>
    );
  }

  if (status === "error" && !lot) {
    return (
      <div role="alert" className="space-y-3">
        <p>{error}</p>
        <Button type="button" onClick={() => void reload()}>
          {t("inventory.actions.retry")}
        </Button>
        <Button asChild variant="secondary">
          <Link to="/app/despensa">{t("inventory.actions.back")}</Link>
        </Button>
      </div>
    );
  }

  if (!lot) return null;

  return (
    <div data-testid="production-inventory-detail" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link to="/app/despensa">{t("inventory.actions.back")}</Link>
          </p>
          <h1 className="mt-1 font-display text-3xl">{lot.productName}</h1>
          <p className="mt-2 text-muted-foreground">
            {formatQuantityLabel(lot.quantity, locale as ProductionLocale, t)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link
              to={`/app/despensa/${lot.lotId}/editar`}
              data-testid="inventory-edit"
            >
              {t("inventory.actions.edit")}
            </Link>
          </Button>
          <Button
            type="button"
            variant="destructive"
            data-testid="inventory-delete"
            disabled={busy}
            onClick={() => void onDelete()}
          >
            {t("inventory.actions.delete")}
          </Button>
        </div>
      </div>

      {conflict && (
        <div
          role="alert"
          data-testid="inventory-stale-conflict"
          className="rounded-xl border border-warning/40 bg-warning/10 p-4"
        >
          <p>{t("inventory.error.staleVersion")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("inventory.error.staleHint")}
          </p>
          <Button
            type="button"
            className="mt-3"
            data-testid="inventory-reload-conflict"
            onClick={() => void reload()}
          >
            {t("inventory.actions.reloadReview")}
          </Button>
        </div>
      )}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">
            {t("inventory.fields.location")}
          </dt>
          <dd>{t(`inventory.location.${lot.storageLocation}`)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t("inventory.fields.printedDate")}
          </dt>
          <dd data-testid="inventory-printed-date">
            {lot.printedExpirationDate
              ? formatCalendarDateForDisplay(lot.printedExpirationDate, locale)
              : t("inventory.fields.none")}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">
            {t("inventory.fields.notes")}
          </dt>
          <dd>{lot.notes || t("inventory.fields.none")}</dd>
        </div>
        <div className="sm:col-span-2 text-xs text-muted-foreground">
          {t("inventory.printedDateDisclaimer")}
        </div>
      </dl>

      {lot.quantity.kind === "measured" && (
        <section className="space-y-3 rounded-xl border p-4">
          <h2 className="font-display text-xl">
            {t("inventory.actions.consume")}
          </h2>
          <label className="block max-w-xs">
            <span className="text-sm">{t("inventory.fields.amount")}</span>
            <Input
              data-testid="inventory-adjust-value"
              value={adjustValue}
              onChange={(event) => setAdjustValue(event.target.value)}
              inputMode="decimal"
              aria-invalid={Boolean(adjustError)}
              aria-describedby={adjustError ? "adjust-error" : undefined}
            />
          </label>
          {adjustError && (
            <p
              id="adjust-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {adjustError}
            </p>
          )}
          <Button
            type="button"
            data-testid="inventory-consume"
            disabled={busy}
            onClick={() => void onConsume()}
          >
            {t("inventory.actions.consume")}
          </Button>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl">{t("inventory.history.title")}</h2>
        <ol data-testid="inventory-history" className="space-y-2">
          {history.map((entry) => (
            <li
              key={entry.entryId}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <span className="font-medium">{entry.kind}</span>
              {entry.type ? ` · ${entry.type}` : ""}
              <span className="block text-xs text-muted-foreground">
                {entry.occurredAt}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
