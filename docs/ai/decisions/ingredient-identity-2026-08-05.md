# Decision: Canonical Ingredient Identity Treatment

- **Plan:** PLAN-0022
- **Date:** 2026-08-05
- **Status:** Accepted for implementation handoff

## Decision

Ingredient identity for recipe AI contracts is **reference-preserving, backend-owned**.

1. Model outputs must copy `ingredientRef` / inventory item IDs and display names exactly when using supplied availability.
2. The model must not invent canonical catalog IDs, merge distinct products, or rename ingredients.
3. Canonical ingredient identity resolution (synonyms, packaging variants, culinary equivalents) is a future deterministic backend service, not an AI authority.
4. Until that service exists, AI validation treats identity as exact-string / exact-ID equality against the request snapshot.

## Rationale

AI remains untrusted. Identity collisions and food-safety-relevant product distinctions must not be resolved by generative renaming.

## Implementation consequence

The production AI Gateway may attach optional backend-resolved canonical IDs to context later. Response schemas continue to require exact references from supplied snapshots.
