import type { ShoppingRequirementProjection } from "../../contracts/preparation";

/**
 * Reservation-aware shopping requirements for the mock phase.
 * Only rows with shortfallQuantity.value > 0 should be sent to the shopping list.
 */
export const MOCK_SHOPPING_REQUIREMENTS: ShoppingRequirementProjection[] = [
  {
    requirementId: "req-broth-shortfall",
    productId: "prod-broth",
    displayName: "Caldo de carne",
    requiredQuantity: { value: 2200, unit: "ml" },
    availableQuantity: { value: 2000, unit: "ml" },
    reservedQuantity: { value: 2200, unit: "ml" },
    freeQuantity: { value: 0, unit: "ml" },
    shortfallQuantity: { value: 200, unit: "ml" },
    sourceMeals: [
      {
        planEntryId: "pl-escondidinho",
        recipeId: "r1",
        recipeTitle: "Escondidinho rápido",
        mealLabel: "Terça · jantar",
      },
      {
        planEntryId: "pl-sopa",
        recipeId: "r3",
        recipeTitle: "Sopa de feijão",
        mealLabel: "Sexta · jantar",
      },
    ],
    reasonCode: "fullyReserved",
  },
  {
    requirementId: "req-onion-missing",
    productId: "prod-onion",
    displayName: "Cebola",
    requiredQuantity: { value: 2, unit: "un" },
    availableQuantity: { value: 0, unit: "un" },
    reservedQuantity: { value: 0, unit: "un" },
    freeQuantity: { value: 0, unit: "un" },
    shortfallQuantity: { value: 2, unit: "un" },
    sourceMeals: [
      {
        recipeId: "r3",
        recipeTitle: "Sopa de feijão",
        mealLabel: "Sexta · jantar",
      },
    ],
    reasonCode: "notInInventory",
  },
  {
    requirementId: "req-beans-covered",
    productId: "prod-beans",
    displayName: "Feijão preto",
    requiredQuantity: { value: 500, unit: "g" },
    availableQuantity: { value: 800, unit: "g" },
    reservedQuantity: { value: 500, unit: "g" },
    freeQuantity: { value: 300, unit: "g" },
    shortfallQuantity: { value: 0, unit: "g" },
    sourceMeals: [
      {
        recipeId: "r3",
        recipeTitle: "Sopa de feijão",
        mealLabel: "Sexta · jantar",
      },
    ],
    reasonCode: "insufficientQuantity",
  },
];

/**
 * Returns only requirements that still need to be purchased (shortfall > 0).
 * Covered inventory/reservation rows must not be sent to shopping.
 */
export function selectShoppingShortfalls(
  projections: ShoppingRequirementProjection[],
): ShoppingRequirementProjection[] {
  return projections.filter((p) => p.shortfallQuantity.value > 0);
}
