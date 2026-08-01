# PLAN-0016: Define AI Recipe Artifact Protocol and Model Evaluation Pack

- **Status:** Validating
- **Type:** Documentation
- **Priority:** High
- **Owner:** Stakeholder + AI architecture collaboration
- **Created:** 2026-08-01
- **Last updated:** 2026-08-01T21:12:00Z
- **Branch:** `docs/plan-0016-ai-recipe-artifacts`
- **Pull request:** Draft PR #23
- **Related ADRs:** ADR-0005
- **Dependencies:** Accepted AI gateway boundary, recipe/cooking domain, PLAN-0013 orchestration direction

## Objective

Define the smallest useful, economical and reliable AI surface for recipe discovery, immediate cooking and multi-day menu planning.

AI generates versioned JSON artifacts persisted and reused by selection, menu planning, projected shopping, preparation schedules, reminders, guided cooking and reconciliation. Deterministic application code remains authoritative wherever rules or calculations suffice.

## Product decisions

1. Candidate generation returns exactly three compact recipes in one call.
2. Only the selected candidate is expanded into a complete recipe artifact.
3. The production flow has two explicit modes:
   - `cook_now`: one immediate meal from current physical stock and explicit local meal context;
   - `menu_planning`: sequential dated slots with reservations, planned purchases and projected package surplus.
4. Every request includes local datetime, timezone, stable `targetMealType`, preparation window and target time when applicable.
5. Candidate strategies deliberately provide:
   - an inventory-first option;
   - a flexible/reuse option;
   - an exploratory option.
6. In menu planning, the middle option prioritizes already planned purchases and projected package surplus to reduce shopping-list growth.
7. Accepted recipes reserve physical stock and planned purchases. They do not prematurely mutate physical inventory.
8. Shopping demand is aggregated globally across accepted recipes by canonical ingredient identity.
9. Package quantity is resolved deterministically using user choice/preferences, purchase history, catalog, bounded model hint, then exact-demand fallback.
10. Only sufficiently reliable package sources create projected reusable surplus.
11. Planned-purchase surplus is exposed to later recipe generation as `availableForPlanning` with `availabilitySource: planned_purchase`.
12. The backend owns all arithmetic: balances, sufficiency, reservations, shortfalls, packages, percentages and shopping quantities.
13. Ingredient state is explicit. The model cannot assume cooked, thawed, soaked, chopped or prepared state.
14. Candidate preparation profiles expose blocking preparation and minimum lead time.
15. Expanded recipes return relative preparation dependencies. The backend calculates concrete reminders and validates schedulability.
16. A `cook_now` candidate is invalid if its blocking preparation chain exceeds `availableLeadMinutes`.
17. Candidates must use recognizable dishes or conventional techniques and be materially different.
18. The backend computes semantic fingerprints and rejects near-duplicates across the current and later batches.
19. Cocinaris owns generation-session state. Full provider history and prior reasoning are not replayed.
20. All user/inventory text is untrusted data, never instructions.
21. Ordinary recipe generation does not use Google or web search.
22. DeepSeek V4 Flash with thinking-high is the current evaluation baseline, not unconditional production approval.
23. `cook_now` has a strict latency gate and may use a validated non-thinking fallback if thinking-high remains too slow.

## Included

- `recipe.suggest_candidates.v1` and `recipe.expand_selected.v1` boundaries.
- `cook_now` and `menu_planning` request semantics.
- Meal-type and local-time parameters.
- Exactly-three-candidate strategy.
- Application-owned generation sessions and bounded rejection memory.
- Physical, planned-purchase and prepared-component availability.
- Reservations, shopping aggregation, package assumptions and projected surplus.
- Ingredient state and preparation dependency semantics.
- Reminder ownership and scheduling boundary.
- Hardened fixed system prompt.
- Token/latency policy and provider evaluation baseline.
- Protocol `0.3-draft` fixtures and evaluation record.

## Excluded

- Production provider integration.
- Inventory/menu/shopping implementation.
- PLAN-0011 work.
- Final JSON Schema and strict-tool implementation.
- Final canonical ingredient identity implementation.
- Store/catalog integrations.
- Nutrition guarantees or authoritative food-safety decisions.
- Automatic execution of model suggestions.

## Required artifacts

- `docs/ai/recipe-artifact-protocol.md`
- `docs/ai/prompts/recipe-suggest-candidates.system.txt`
- `docs/ai/examples/README.md`
- protocol `0.3` fixtures for immediate cooking, projected shopping reuse and another batch after rejection;
- provider/model evaluation record.

## Token and experience requirements

Candidate discovery must:

- generate three options in one request;
- omit detailed cooking steps;
- bound summaries to 18 words;
- send no previous reasoning;
- send at most nine compact prior-candidate semantic summaries;
- reuse a stable cache-friendly prefix;
- persist and reuse expanded recipes;
- collect cache-hit/miss, reasoning, output, latency, repair and cost metrics.

Synchronous `cook_now` target gate:

```text
p50 <= 15 seconds
p95 <= 25 seconds
empty/truncated JSON = 0
maximum automatic repair attempts = 1
```

If the selected thinking configuration cannot meet that gate after compaction, use the validated non-thinking fallback for `cook_now`. Menu planning may use progressive UI and retain higher reasoning when measured quality justifies it.

## Validation requirements

Before marking Completed:

1. Parse every new fixture as JSON.
2. Run at least three repetitions of the principal suggestion scenarios.
3. Record model ID/backend fingerprint, prompt version, thinking, max tokens, cache hits/misses, reasoning/output tokens, time to first token, total latency, raw response, schema validity, semantic validity, diversity, plausibility, repair count and cost.
4. Validate exact IDs, names, units and sources.
5. Validate hard constraints, equipment/capabilities, ingredient state and lead time.
6. Validate assumptions do not duplicate additional ingredients.
7. Validate three candidates and deterministic diversity fingerprints.
8. Validate projected-purchase reuse without model-authored arithmetic.
9. Validate injection resistance.
10. Obtain stakeholder approval before marking Ready for merge or Completed.

## Execution state

- **Current checkpoint:** Protocol `0.3-draft` defines immediate cooking, sequential menu planning, projected shopping availability, preparation reminders, compact generation sessions, three-candidate strategies and a hardened prompt.
- **Last completed step:** Incorporated live DeepSeek V4 Flash/Pro benchmarks and stakeholder decisions about thinking-high, local meal context, projected package reuse and pre-preparation reminders.
- **Exact next action:** Rerun the three protocol `0.3` suggestion fixtures against DeepSeek V4 Flash thinking-high, capture streaming/token/latency metrics and annotate schema/semantic failures.
- **Blockers:** Final repeated benchmark evidence, final strict-output choice, canonical ingredient identity boundary and package-confidence thresholds.
- **Validation performed:** Documentation and synthetic fixture design; no production provider integration or application implementation.
- **Working tree state:** Draft documentation PR #23; do not merge until stakeholder re-review.
- **Substantial run target:** Achieved for protocol consolidation; model validation remains.

## Progress log

### 2026-08-01T21:12:00Z — Protocol 0.3 consolidation

- Defined `cook_now` and `menu_planning` as separate flows sharing the same compact candidate operation.
- Fixed candidate count at three and formalized inventory-first, planned-purchase-reuse/flexible and exploratory strategies.
- Added local datetime, timezone, target meal and available lead time to the request boundary.
- Defined application-owned generation sessions and bounded prior-candidate fingerprints instead of replaying provider conversations.
- Defined physical stock, planned purchases and prepared components as separate availability sources using backend-computed `availableForPlanning`.
- Defined accepted-recipe reservations, global shopping aggregation, package-resolution precedence and projected surplus reuse.
- Defined ingredient states, advance preparations, relative dependencies and backend-owned reminders.
- Hardened the fixed prompt against implausible combinations, unavailable equipment, unsupported claims, stale state, assumption duplication and near-duplicates.
- Selected DeepSeek V4 Flash thinking-high as the evaluation baseline subject to a strict `cook_now` latency gate.
- Added protocol `0.3` benchmark scenarios and a provider-evaluation record.

### 2026-08-01T17:43:00Z — Protocol 0.2 refinement

- Added compact fixed prompt, inventory usage modes, complete-snapshot semantics and all-candidate required/excluded constraints.
- Preserved exact inventory IDs, names and units.

### 2026-08-01T17:00:00Z — Plan opened

- Established deterministic-first boundary, two recipe operations and reusable persisted artifacts.
