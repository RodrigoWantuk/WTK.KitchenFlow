/**
 * Shared display quantity for presentation-only projections.
 * Authoritative arithmetic and unit conversion remain backend responsibilities.
 */
export interface QuantityDisplay {
  /** Numeric magnitude already resolved by an adapter or backend projection. */
  value: number;
  /** Display unit label (for example ml, g). */
  unit: string;
  /** Optional localization-ready formatting hint. */
  formatted?: string;
}

/**
 * Formats a quantity for UI without performing unit conversion.
 */
export function formatQuantity(quantity: QuantityDisplay): string {
  const value = Number.isInteger(quantity.value)
    ? String(quantity.value)
    : quantity.value.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  return quantity.formatted ?? `${value} ${quantity.unit}`;
}
