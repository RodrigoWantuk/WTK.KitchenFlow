import { useMemo, useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatQuantity } from "@/contracts/quantity";
import type { ShoppingRequirementProjection } from "@/contracts/preparation";
import {
  MOCK_SHOPPING_REQUIREMENTS,
  selectShoppingShortfalls,
} from "@/adapters/mock/shoppingRequirementFixtures";

export interface ShoppingRequirementReviewProps {
  tr: (key: string) => string;
  projections?: ShoppingRequirementProjection[];
  /** Called with shortfall-only rows the user selected to send. */
  onSendShortfalls?: (items: ShoppingRequirementProjection[]) => void;
}

/**
 * Reservation-aware shopping review.
 * Lists covered and shortfall rows for transparency, but only shortfall can be sent.
 */
export function ShoppingRequirementReview({
  tr,
  projections = MOCK_SHOPPING_REQUIREMENTS,
  onSendShortfalls,
}: ShoppingRequirementReviewProps): ReactElement {
  const shortfalls = useMemo(
    () => selectShoppingShortfalls(projections),
    [projections],
  );
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(shortfalls.map((s) => s.requirementId)),
  );

  const toggle = (id: string, enabled: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const send = () => {
    const chosen = shortfalls.filter((s) => selected.has(s.requirementId));
    onSendShortfalls?.(chosen);
  };

  return (
    <section data-testid="shopping-requirement-review" className="space-y-4">
      <div>
        <h2 className="font-display text-2xl">{tr("plan.missing.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {tr("plan.missing.reservationAware")}
        </p>
      </div>
      <ul className="space-y-2">
        {projections.map((row) => {
          const isShortfall = row.shortfallQuantity.value > 0;
          return (
            <Card
              key={row.requirementId}
              data-testid={`shopping-req-${row.requirementId}`}
              data-shortfall={isShortfall ? "true" : "false"}
              className="p-3"
            >
              <div className="flex items-start gap-3">
                {isShortfall ? (
                  <Checkbox
                    data-testid={`shopping-req-check-${row.requirementId}`}
                    checked={selected.has(row.requirementId)}
                    onCheckedChange={(v) =>
                      toggle(row.requirementId, v === true)
                    }
                    className="mt-1 h-5 w-5"
                  />
                ) : (
                  <span className="mt-1 h-5 w-5" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{row.displayName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {[
                      row.availableQuantity
                        ? `Disp. ${formatQuantity(row.availableQuantity)}`
                        : null,
                      row.reservedQuantity
                        ? `Res. ${formatQuantity(row.reservedQuantity)}`
                        : null,
                      isShortfall
                        ? `Falta ${formatQuantity(row.shortfallQuantity)}`
                        : tr("plan.missing.nothing"),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {row.sourceMeals.length > 0 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {row.sourceMeals
                        .map((m) => `${m.recipeTitle} (${m.mealLabel})`)
                        .join(" · ")}
                    </p>
                  ) : null}
                  {row.reasonCode === "fullyReserved" ? (
                    <p
                      className="mt-1 text-[11px] text-destructive"
                      data-testid={`shopping-req-debt-${row.requirementId}`}
                    >
                      {tr("plan.missing.reservationDebt")}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </ul>
      <Button
        data-testid="shopping-req-send"
        disabled={shortfalls.every((s) => !selected.has(s.requirementId))}
        onClick={send}
      >
        {tr("plan.missing.sendSelected")}
      </Button>
    </section>
  );
}
