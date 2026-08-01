# PLAN-0016: Define AI Recipe Artifact Protocol and Model Evaluation Pack

- **Status:** Draft
- **Type:** Documentation
- **Priority:** High
- **Owner:** Stakeholder + AI architecture collaboration
- **Created:** 2026-08-01
- **Last updated:** 2026-08-01T17:43:00Z
- **Branch:** `docs/plan-0016-ai-recipe-artifacts`
- **Pull request:** Draft PR #23
- **Related issues:** None
- **Related ADRs:** ADR-0005
- **Dependencies:** Accepted AI gateway boundary, recipe/cooking domain, PLAN-0013 orchestration direction

## Objective

Define, together with the product owner, the smallest useful AI surface for recipe ideation and expansion.

AI generates versioned JSON artifacts persisted and reused by recipe selection, menus, shopping calculations, preparation schedules, reminders, guided cooking, and later reconciliation. Deterministic application code remains authoritative wherever rules/calculations suffice.

## Current stakeholder decisions

1. Profile, onboarding, equipment, skills, inventory quantities, expiration, storage state, menu assembly, shopping arithmetic, reservations, scheduling, and mutations are deterministic.
2. Manual inventory names remain user-owned and are not normalized by an AI call.
3. Initial recipe AI uses two calls:
   - `recipe.suggest_candidates.v1`: one batch call returning compact candidates.
   - `recipe.expand_selected.v1`: one call after selection returning the complete reusable recipe artifact.
4. Candidate generation receives the complete user-declared inventory and equipment snapshots; the model may choose any allowed subset and is not expected to use every item.
5. `inventoryUsageMode` controls global inventory behavior: `inventory_only`, `prefer_inventory`, or `open_choice`.
6. Per-request required/excluded ingredient and equipment constraints apply to every candidate and override general freedom.
7. Empty constraint arrays leave selection free under `inventoryUsageMode`.
8. Inventory references preserve the exact supplied `itemId`, `userName`, and `unit`; required quantities use the same unit.
9. Named ingredient constraints preserve the exact user-provided name.
10. Percent used, amount remaining, sufficiency, and shopping shortfall are calculated by application code.
11. Candidate recipes must be materially different, not minor renames or seasoning variations.
12. Full recipe output stores ingredients, how-to, pre-preparations, durations, dependencies, relative scheduling offsets, sensory cues, equipment, yield, storage, and produced components.
13. Exact calendar timestamps are calculated by the backend.
14. Step explanation and troubleshooting use separate smaller contracts later.
15. Request/response protocol is JSON-only; a compact fixed system prompt precedes the variable JSON and is cacheable.
16. All free text is bounded and treated as untrusted data, never as instructions.

## Included

- Operation identifiers/responsibilities.
- Reusable persisted artifact strategy.
- Compact fixed system prompt.
- Complete inventory/equipment snapshot semantics.
- Inventory usage modes.
- Required/excluded ingredient and equipment overrides.
- Draft JSON benchmark requests.
- Candidate/expanded response contracts.
- Token minimization and prompt-injection treatment.
- Evaluation checklist and unresolved decisions.

## Excluded

- Provider selection.
- Production provider integration.
- Final JSON Schema files.
- Final token budgets.
- Image/receipt extraction.
- Troubleshooting, step explanation, adaptation, or reconciliation contracts.
- Nutrition guarantees or food-safety authority.
- Automatic application of AI suggestions.

## Deliverables

- `docs/ai/recipe-artifact-protocol.md`
- `docs/ai/prompts/recipe-suggest-candidates.system.txt`
- `docs/ai/examples/README.md`
- Seven JSON benchmark requests covering normal, expiry-priority, limited-equipment/inventory-only, batch/freezer, injection/overrides, basic expansion, and multi-day preparation.

## Acceptance criteria

Do not mark Ready or Completed until the stakeholder approves operation boundaries, prompt text, request envelope, usage-mode semantics, override semantics, candidate/recipe fields, limits/token strategy, benchmark scenarios, and acceptable model behavior.

Examples must parse as JSON and contain synthetic data only.

## Execution state

- **Current checkpoint:** Compact candidate system prompt, complete-snapshot semantics, three inventory usage modes, and per-candidate required/excluded ingredient/equipment constraints are documented and reflected in all benchmark requests.
- **Last completed step:** Incorporated first model-comparison feedback: exact name/unit preservation, distinct candidate requirement, global inventory choice, and explicit overrides.
- **Exact next action:** Stakeholder reruns candidate examples against low-cost models using the fixed prompt plus JSON and reports schema, diversity, constraint, and unit-preservation results.
- **Blockers:** Stakeholder decisions on candidate count, maximum snapshot size, common staples, output budget, and preferred model behavior.
- **Validation performed:** All seven request files parsed as JSON locally; documentation-only change; synthetic data only.
- **Working tree state:** Draft documentation branch and Draft PR #23; no application code/provider call.
- **Substantial run target:** Achieved for this collaborative contract refinement.

## Progress log

### 2026-08-01T17:43:00Z — OpenAI architecture collaboration

- **Checkpoint:** Added compact fixed prompt and explicit complete-inventory selection semantics.
- **Decisions captured:** `inventory_only` / `prefer_inventory` / `open_choice`; all-candidate required/excluded ingredients and equipment; exact inventory name/unit preservation; named-constraint preservation; diversity requirement.
- **Examples:** Updated seven benchmark requests to protocol `0.2-draft`.
- **Next action:** Product owner repeats low-cost model comparisons with prompt + JSON.

### 2026-08-01T17:00:00Z — OpenAI architecture collaboration

- **Checkpoint:** PLAN-0016 opened as Draft.
- **Decisions captured:** deterministic-first boundary; two recipe operations; reusable persisted artifacts; absolute quantities; backend-owned shopping/scheduling arithmetic.
- **Examples:** Seven self-contained JSON benchmark requests.
- **Next action:** Product owner evaluates multiple models and returns annotated results.
