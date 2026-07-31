import type { PreparedComponentAvailability } from "../../contracts/preparation";

/**
 * Fixture projections for prepared-component availability.
 * Arithmetic is pre-resolved here; UI must not recompute from recipe/lot rules.
 */
export const MOCK_PREPARED_COMPONENT_AVAILABLE: PreparedComponentAvailability = {
  inventoryItemId: "cp_broth",
  totalQuantity: { value: 2000, unit: "ml" },
  reservedQuantity: { value: 1000, unit: "ml" },
  freeQuantity: { value: 1000, unit: "ml" },
  status: "available",
  reservations: [
    {
      title: "Escondidinho rápido",
      reservedQuantity: { value: 600, unit: "ml" },
      when: "Terça",
    },
    {
      title: "Sopa de feijão",
      reservedQuantity: { value: 400, unit: "ml" },
      when: "Sexta",
    },
  ],
};

/** Fully reserved — free quantity is zero, no shortfall. */
export const MOCK_PREPARED_COMPONENT_FULLY_RESERVED: PreparedComponentAvailability = {
  inventoryItemId: "cp_broth_exact",
  totalQuantity: { value: 1000, unit: "ml" },
  reservedQuantity: { value: 1000, unit: "ml" },
  freeQuantity: { value: 0, unit: "ml" },
  status: "fullyReserved",
  reservations: [
    {
      title: "Escondidinho rápido",
      reservedQuantity: { value: 600, unit: "ml" },
      when: "Terça",
    },
    {
      title: "Sopa de feijão",
      reservedQuantity: { value: 400, unit: "ml" },
      when: "Sexta",
    },
  ],
};

/** Shortfall — reserved exceeds total; only the shortfall should go to shopping. */
export const MOCK_PREPARED_COMPONENT_SHORTFALL: PreparedComponentAvailability = {
  inventoryItemId: "cp_broth_debt",
  totalQuantity: { value: 2000, unit: "ml" },
  reservedQuantity: { value: 2200, unit: "ml" },
  freeQuantity: { value: 0, unit: "ml" },
  shortfallQuantity: { value: 200, unit: "ml" },
  status: "shortfall",
  reservations: [
    {
      title: "Escondidinho rápido",
      reservedQuantity: { value: 1200, unit: "ml" },
      when: "Terça",
    },
    {
      title: "Sopa de feijão",
      reservedQuantity: { value: 1000, unit: "ml" },
      when: "Sexta",
    },
  ],
};

/**
 * Maps a pantry mock item with reservedFor into a presentation projection.
 * Used only during the mock phase; live adapters will receive backend projections.
 */
export function projectPreparedComponentFromPantryItem(item: {
  id: string;
  qty: number;
  unit: string;
  reservedFor?: Array<{ title: string; qtyNum: number; unit: string; when?: string; recipeId?: string }>;
}): PreparedComponentAvailability | null {
  if (!item.reservedFor || item.reservedFor.length === 0) return null;
  const total = Number(item.qty) || 0;
  const reserved = item.reservedFor.reduce((sum, r) => sum + (Number(r.qtyNum) || 0), 0);
  const free = Math.max(0, total - reserved);
  const shortfall = Math.max(0, reserved - total);
  const status =
    shortfall > 0 ? "shortfall" : free === 0 ? "fullyReserved" : "available";
  return {
    inventoryItemId: item.id,
    totalQuantity: { value: total, unit: item.unit },
    reservedQuantity: { value: reserved, unit: item.unit },
    freeQuantity: { value: free, unit: item.unit },
    shortfallQuantity:
      shortfall > 0 ? { value: shortfall, unit: item.unit } : undefined,
    status,
    reservations: item.reservedFor.map((r) => ({
      recipeId: r.recipeId,
      title: r.title,
      reservedQuantity: { value: r.qtyNum, unit: r.unit },
      when: r.when,
    })),
  };
}
