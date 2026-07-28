# Primary User Journeys

- **Status:** Accepted
- **Last updated:** 2026-07-28

## Journey design rule

The journeys share a domain but do not force one entry path. A user may begin with a purchase, a few ingredients, a saved recipe, a menu item, an urgent product, or an intention to cook something unrelated to inventory.

## 1. Plan before shopping

```text
Select period and meal context
→ optionally include profile, inventory, equipment, goals, and purchase limits
→ generate multiple recipe and preparation possibilities
→ inspect, edit, reject, lock, or regenerate individual suggestions
→ prepare now, schedule, save, favorite, or discard
→ accept a plan
→ create flexible reservations and advance actions
→ generate a shopping list with package-remainder reasoning
```

The user may mix fixed dates with unscheduled options. Simulation and draft modes do not mutate the active plan or inventory reservations.

## 2. Register a purchase

```text
Manual item, manual list, or receipt photograph
→ parse and normalize products and quantities
→ show uncertain or missing information
→ require quantity confirmation
→ create inventory lots
→ assign storage and shelf-life evidence
→ show the organized inventory and attention state
```

A source image is temporary and is deleted after parsing or immediately after a reported failure.

## 3. Decide what to cook now

```text
Start a recipe request
→ optionally select inventory, manually entered products, equipment, technique, time, effort, or shopping permission
→ lock products or quantities that must not be used
→ receive explainable suggestions
→ see products that need attention and preservation alternatives
→ choose freely
→ inspect the normalized recipe
→ prepare now, schedule, save, favorite, or discard
```

The user is never forced to select the most urgent product.

## 4. Use a scheduled menu item

```text
Receive an in-product, push, or email reminder
→ inspect readiness, missing products, uncertainty, and advance actions
→ start the planned recipe
or adapt the recipe
or replace only this menu item
or reschedule
or ignore the plan
```

The rest of the accepted plan is preserved unless the user approves a broader recalculation.

## 5. Guided cooking

```text
Select recipe and portions
→ review mise en place
→ confirm lots, substitutions, equipment, thawing, and advance preparation
→ start an execution explicitly
→ follow staged instructions
→ request more detail for any stage
→ open text troubleshooting when reality diverges
→ adapt active instructions and record the reason
→ finish cooking
```

Viewing a recipe does not start an execution.

## 6. Finalize and reconcile

```text
Review proposed usage
→ adjust consumed quantities, substitutions, omissions, portions, leftovers, freezing, and waste
→ confirm atomically
→ release reservations
→ record result, rating, difficulty, notes, and optional photos
→ choose whether execution changes become a revision or derived recipe
→ update future decisions
```

If reconciliation is not completed, the execution remains explicitly pending rather than producing a false inventory state.

## 7. Preserve food instead of cooking it

```text
Open attention dashboard
→ inspect estimated urgency and information source
→ choose recipe, freeze, divide, prepare a component, correct data, discard, or remind later
→ apply an explicit lifecycle transition
→ recalculate shelf life and future availability
```

## 8. Operate during AI degradation

```text
AI provider unavailable
→ show clear capability status
→ continue browsing and editing inventory
→ use saved recipes and instructions
→ continue or finalize active cooking
→ manage menu, shopping, favorites, photos, and privacy
→ retry AI-only work later
```

Authoritative state remains consistent during provider failure.

## 9. Exercise privacy rights

```text
Open privacy center
→ inspect categories and purposes
→ correct data or preferences
→ export a readable copy
→ delete selected recipes, executions, photos, or inventory
→ revoke optional permissions
→ request account deletion
→ track deletion progress and legally justified retention
```
