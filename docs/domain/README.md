# KitchenFlow Core Domain

- **Status:** Accepted
- **Last updated:** 2026-07-28

## Domain purpose

The core domain coordinates the lifecycle of food and the decisions that transform food into useful meals.

The central question is:

> Considering what food exists, how much exists, how long it remains usable, and what the user is willing to do, what is the best way to transform that food into useful meals?

## Domain areas

### Inventory lifecycle

Owns products, lots, quantities, storage, package and preparation states, shelf-life evidence, provenance, reservations, transitions, consumption, leftovers, preservation, waste, and reconciliation.

See [`inventory-lifecycle.md`](inventory-lifecycle.md).

### Planning and shopping

Owns optional menu intentions, simulations, drafts, accepted plans, flexible reservations, preparation actions, shopping requirements, package remainders, and actual-purchase adaptation.

See [`planning-and-shopping.md`](planning-and-shopping.md).

### Recipes and cooking

Owns recipe identity, normalized content, revisions, derivation, provenance, private sharing by copy, guided executions, troubleshooting, execution-local adaptations, finalization, and learning.

See [`recipes-and-cooking.md`](recipes-and-cooking.md).

## Supporting contexts

- account and household profile;
- preferences and restrictions;
- kitchen equipment and capabilities;
- localization and regional product terminology;
- AI workflows;
- notifications;
- privacy and consent;
- subscription and entitlement.

Supporting contexts must not directly bypass the core domain's validation and state transitions.

## Conceptual entities

```text
KitchenFlowUser
HouseholdProfile
CookingProfile
KitchenCapability

Product
ProductClassification
InventoryLot
StorageLocation
ShelfLifeEvidence
InventoryReservation
InventoryTransaction
WasteEvent

Recipe
RecipeRevision
RecipeShareSnapshot
RecipeExecution
TroubleshootingEvent
ExecutionResult

MealPlan
PlannedMeal
PreparationAction
ShoppingPlan
ShoppingItem
PurchaseReconciliation

AiOperation
UsageLedger
Notification
ConsentRecord
PrivacyRequest
AuditEvent
```

These are conceptual terms, not a final database schema. Implementation plans must refine invariants and contracts without changing accepted product behavior silently.

## Cross-domain invariants

- A user never mutates another user's private recipe or inventory object.
- Quantity or explicit availability state is required for inventory.
- AI never directly mutates authoritative domain state.
- Important state changes are authenticated, authorized, validated, auditable, and idempotent where retries are possible.
- Execution completion and inventory reconciliation are one logical transaction unless explicitly pending reconciliation.
- Planning reservations are flexible and do not claim physical consumption.
- Uncertainty and provenance remain visible.
- Recommendations are advisory and editable.
