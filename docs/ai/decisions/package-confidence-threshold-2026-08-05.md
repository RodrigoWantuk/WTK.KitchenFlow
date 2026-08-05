# Decision: Package-Confidence Threshold

- **Plan:** PLAN-0022
- **Date:** 2026-08-05
- **Status:** Accepted for implementation handoff

## Decision

Package quantity and surplus projection remain **backend-owned**. The model must not compute package counts, remainder percentages, or shopping quantities.

When the backend later exposes projected package surplus to menu-planning context:

1. Only surplus marked with confidence `high` may be treated as `planned_purchase` availability for model consumption.
2. Confidence below `high` must be omitted from AI context or labeled non-usable; the model must not upgrade confidence.
3. Initial implementation threshold: **`high` only** (reject `medium`, `low`, `unknown` for surplus reuse).

## Rationale

Optimistic package surplus is a common source of inventory/planning inconsistency. A strict threshold keeps AI proposals conservative until purchase confirmation updates physical stock.

## Implementation consequence

`availabilitySource: planned_purchase` items in suggestion context are emitted only after deterministic confidence filtering. Schema validation rejects invented package arithmetic in model output.
