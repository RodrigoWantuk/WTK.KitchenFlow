import type { ReactElement } from "react";
import { ShoppingBag } from "lucide-react";
import { formatQuantity } from "@/contracts/quantity";
import type { PreparedComponentAvailability } from "@/contracts/preparation";

export interface PreparedComponentAvailabilityBarProps {
  availability: PreparedComponentAvailability;
  tr: (key: string) => string;
  /** Opens shopping review focused on shortfall when status is shortfall. */
  onReviewShortfall?: () => void;
}

/**
 * Presentational reserved/free/shortfall bar.
 * Renders only fields from PreparedComponentAvailability — no inventory arithmetic.
 */
export function PreparedComponentAvailabilityBar({
  availability,
  tr,
  onReviewShortfall,
}: PreparedComponentAvailabilityBarProps): ReactElement {
  const total = availability.totalQuantity.value;
  const reservedForBar = Math.min(availability.reservedQuantity.value, total);
  const usedPct = total > 0 ? (reservedForBar / total) * 100 : 0;
  const statusAttr =
    availability.status === "shortfall"
      ? "debt"
      : availability.status === "fullyReserved"
        ? "exact"
        : "balanced";

  return (
    <div
      data-testid={`pantry-reserved-${availability.inventoryItemId}`}
      data-status={statusAttr}
      className="mt-2 space-y-1"
    >
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary/70">
        <div
          className={
            availability.status === "shortfall"
              ? "h-full bg-destructive/80"
              : "h-full bg-accent/70"
          }
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
        <span className="text-muted-foreground">
          {formatQuantity(availability.reservedQuantity)}{" "}
          {tr("pantry.reserved.label")}
          {availability.reservations.length > 1 ? (
            <span
              title={availability.reservations
                .map(
                  (r) => `${r.title} (${formatQuantity(r.reservedQuantity)})`,
                )
                .join(" + ")}
            >
              {" "}
              · {availability.reservations.length} receitas
            </span>
          ) : null}
        </span>
        {availability.status === "shortfall" &&
        availability.shortfallQuantity ? (
          <button
            type="button"
            data-testid={`pantry-reserved-debt-${availability.inventoryItemId}`}
            className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive"
            onClick={onReviewShortfall}
          >
            <ShoppingBag className="h-3 w-3" /> {tr("pantry.reserved.debt")}{" "}
            {formatQuantity(availability.shortfallQuantity)}
          </button>
        ) : availability.status === "fullyReserved" ? (
          <span className="text-muted-foreground">
            · {tr("pantry.reserved.exact")}
          </span>
        ) : (
          <span className="text-primary">
            · {formatQuantity(availability.freeQuantity)}{" "}
            {tr("pantry.reserved.free")}
          </span>
        )}
      </div>
    </div>
  );
}
