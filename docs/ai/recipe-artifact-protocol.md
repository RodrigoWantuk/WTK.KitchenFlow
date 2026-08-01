# AI Recipe Artifact Protocol

- **Status:** Validating — protocol `0.3-draft`
- **Related plan:** [`PLAN-0016`](../plans/PLAN-0016-define-ai-recipe-artifact-protocol.md)
- **Last updated:** 2026-08-01
- **Evaluation baseline:** `deepseek-v4-flash`, thinking enabled, `reasoning_effort: high`

## Product boundary

Cocinaris uses AI for culinary interpretation, candidate generation, selected-recipe expansion, adaptation and later guided assistance. Deterministic application code remains authoritative for identity, profile, equipment, inventory, quantities, expiration, reservations, projected purchases, shopping-list aggregation, package arithmetic, concrete scheduling, authorization, concurrency and mutations.

AI output is always a proposed, versioned artifact. It is parsed, schema-validated, semantically validated and may be rejected or repaired. No model response directly mutates inventory, menu, shopping, reminders or user state.

The protocol balances two requirements:

1. aggressively minimize input, reasoning and output tokens;
2. preserve a fluid user experience and enough culinary quality to justify AI.

The initial flow therefore generates **three compact candidates in one call** and expands **only the selected candidate**.

## Operations

### `recipe.suggest_candidates.v1`

Returns exactly three compact candidates for either immediate cooking or menu planning. Candidates contain comparison and validation data, but no detailed cooking steps.

### `recipe.expand_selected.v1`

Runs only after selection. It produces one persisted recipe revision with final ingredients, equipment, preparation tasks, stages, dependencies, relative lead times, sensory cues, storage guidance, produced components and reconciliation hints.

The backend derives concrete reminder timestamps from relative dependencies, accepted meal time and timezone.

Step explanation, troubleshooting, substitution and reconciliation remain future small-context operations. They receive only the active stage and minimum required state, never the entire historical conversation.

## Execution context

Every suggestion request contains:

```json
{
  "executionContext": {
    "executionMode": "cook_now",
    "localDateTime": "2026-08-01T18:10:00-03:00",
    "timeZone": "America/Sao_Paulo",
    "targetMealType": "dinner",
    "targetMealTime": null,
    "availableLeadMinutes": 55
  }
}
```

`executionMode` is a closed enum:

| Value | Meaning |
|---|---|
| `cook_now` | Suggest one immediate meal from current physical availability. No implicit multi-recipe purchase projection. |
| `menu_planning` | Suggest for a dated slot using physical stock, reservations, planned purchases, projected package surplus and previously accepted meals. |

`targetMealType` is a stable enum:

```text
breakfast
morning_snack
lunch
afternoon_snack
dinner
late_snack
any
```

The backend normally derives the meal type from local time, but an explicit user choice overrides it. The model never guesses timezone or silently changes the requested meal.

### `cook_now`

- Use current physical `availableForPlanning` only, unless the user explicitly includes an existing future purchase.
- `availableLeadMinutes`, maximum active time and maximum total time are hard constraints.
- A candidate requiring soaking, thawing, marinating, fermentation, cooling or another blocking preparation beyond the available window is invalid.
- Shopping tolerance remains request-controlled.

### `menu_planning`

- Target one dated meal slot at a time, or a small ordered group when necessary.
- Simulate accepted meals sequentially.
- After each acceptance, the backend recalculates reservations, shortfalls, planned purchases, projected package surplus and availability before requesting the next batch.
- Concrete dates and reminders remain backend-owned.

## Three-candidate strategy

The production default and maximum are both three. One model call produces the batch so the model can compare candidates and enforce diversity.

### `cook_now`

1. `on_hand_first`: prioritize physical stock; zero or one additional ingredient.
2. `on_hand_flexible`: reuse physical stock; up to three additional ingredients.
3. `exploratory`: broader but bounded ingredient set and a meaningfully different meal experience.

### `menu_planning`

1. `on_hand_first`: prioritize opened, near-expiry and physically available ingredients.
2. `planned_purchase_reuse`: prioritize items already covered by the shopping plan or projected package surplus, avoiding a new shopping-list line when quality is comparable.
3. `exploratory`: allow a new ingredient structure and additional purchases while remaining practical.

Every candidate returns its stable `candidateStrategy` so the UI can label it without interpreting prose.

## Culinary plausibility and diversity

Every candidate must use a recognizable dish archetype, established recipe pattern or conventional technique. The model must not combine ingredients merely because they are available.

Across the batch:

- all three `dishFormat` values should differ when constraints permit;
- at least two `primaryTechnique` values must differ;
- no pair may share both the same main ingredient structure and technique;
- renaming, seasoning changes, sauce swaps or side-dish swaps alone are not distinct recipes;
- a later round may not substantially reproduce supplied prior fingerprints.

Candidates expose `dishFormat`, `primaryTechnique` and `primaryIngredientRefs`. The backend computes the authoritative fingerprint and performs overlap checks.

## Application-owned generation session

The UI may feel conversational, but Cocinaris owns the session:

```json
{
  "generationSession": {
    "generationSessionId": "gs-123",
    "round": 2,
    "planningRevision": 8,
    "inventoryRevision": 17,
    "targetSlotId": "slot-2026-08-04-dinner",
    "priorCandidateSummaries": [],
    "acceptedRecipeRefs": []
  }
}
```

For another batch after rejection, send the current canonical state plus a compact bounded list of prior semantic summaries/fingerprints and explicit rejection reasons when available. Do not replay full candidate outputs or previous reasoning. Maximum prior summaries sent to the model: 9.

Provider conversation state and cache are optimizations only. Correctness never depends on them. Stable content stays at the request prefix: system prompt, structured schema/tool definition, stable policies, profile/equipment, then dynamic state.

## Planning availability

The model receives a backend-computed projection:

```json
{
  "availabilitySnapshot": {
    "revision": 17,
    "scope": "complete_planning_projection",
    "items": [
      {
        "ingredientRef": "ingredient-rice",
        "inventoryItemId": null,
        "userName": "Arroz branco",
        "state": "raw",
        "unit": "g",
        "availabilitySource": "planned_purchase",
        "availableForPlanning": 800,
        "confidence": "high"
      }
    ]
  }
}
```

`availabilitySource` is one of:

```text
on_hand
planned_purchase
prepared_component
```

The backend may retain detailed ledgers, but the model uses only supplied `availableForPlanning`. It must not calculate balances, reservations, remaining quantity, shortfall, purchase quantity, package count, percentages or sufficiency.

## Accepted recipe and projected shopping flow

When a candidate is accepted:

1. validate it against current revisions;
2. expand it unless an equivalent persisted revision already exists;
3. reserve available physical quantities;
4. aggregate remaining demand into the menu shopping plan;
5. resolve an assumed purchase package quantity;
6. reserve recipe demand against that planned purchase;
7. expose unused projected package quantity to later menu slots;
8. send the recalculated projection to the next suggestion call.

Example:

```text
Accepted demand: 200 g rice
Assumed package: 1000 g
Reserved from planned purchase: 200 g
Projected reusable availability: 800 g
```

This projected remainder is a core cost-reduction mechanism. It lets later recipes reuse items already being purchased instead of introducing unrelated shopping lines.

Physical inventory is not increased until purchase confirmation. Planned and physical stock remain separate ledgers. On confirmation, reconcile planned quantity with actual quantity and preserve future reservations.

## Purchase-package resolution

The application resolves package size using this precedence:

1. package explicitly selected by the user;
2. user-preferred package for the canonical ingredient;
3. previous confirmed purchase history;
4. persisted regional/package catalog;
5. bounded package hint from selected-recipe expansion;
6. exact-demand fallback.

Only sources 1–4 may create high-confidence reusable surplus. A model hint is provisional. Exact-demand fallback creates no speculative surplus. The model never decides package count or shopping-list quantity.

Shopping demand is aggregated globally across accepted recipes by canonical ingredient identity. If ingredient identity cannot be resolved safely, keep separate lines rather than silently merging.

## Ingredient state

Every availability item declares a state:

```text
raw
cooked
cooked_and_cooled
frozen
thawed
soaked
chopped
prepared_component
unknown
```

The model must not assume an item is cooked, thawed, soaked, chopped or otherwise prepared unless declared. Required state transformations appear as advance preparation or recipe stages.

## Advance preparation and reminders

Compact candidate profile:

```json
{
  "preparationProfile": {
    "requiresAdvancePreparation": true,
    "minimumLeadMinutes": 480,
    "blockingPreparationCodes": ["soak"],
    "mayProduceReusableComponents": true
  }
}
```

Expanded preparation task:

```json
{
  "taskId": "prep-soak-beans",
  "taskType": "soak",
  "name": "Deixar o feijão de molho",
  "instructions": "Cobrir com água e manter refrigerado.",
  "activeMinutes": 5,
  "passiveMinutes": 480,
  "minimumLeadMinutes": 480,
  "blocking": true,
  "canRunPreviousDay": true,
  "dependsOn": [],
  "producesState": "soaked"
}
```

AI returns relative timing and dependencies only. The backend calculates concrete start/deadline timestamps, reminder delivery, timezone behavior, commitment conflicts and rescheduling. A selected recipe with advance preparation cannot silently enter a menu without a schedulable route or explicit user override.

## Hard and soft constraints

Hard constraints are absolute: allergies/restrictions, required/excluded ingredients, equipment, capabilities, target meal, lead time, maximum time, `inventory_only`, ingredient state and explicit user constraints.

Soft preferences are optimized only after every hard constraint passes. Impossible constraints return no invalid candidate and a bounded `constraints_unsatisfiable` clarification.

`inventoryUsageMode` remains:

| Value | Meaning |
|---|---|
| `inventory_only` | Every non-assumed ingredient is supplied as available; no additions. |
| `prefer_inventory` | Prefer available items with bounded additions. |
| `open_choice` | Availability remains context, but a broader ingredient set is allowed. |

Inventory presence means choice, not obligation. Coherent recipes are preferred over maximizing inventory-item count.

## Exact references and assumptions

For supplied items the model copies exact stable reference/ID, `userName`, `unit` and `availabilitySource`. Required quantity uses the same unit. Renaming and unit conversion are forbidden.

`assumptionsUsed` contains only authorized assumptions actually used. An assumption may never also appear in `additionalIngredients`.

Unsupported claims such as `homemade`, `fresh`, `healthy`, `authentic`, `traditional` or `high-protein` are forbidden unless supported by input data or deterministic analysis.

## Candidate artifact

A compact candidate contains:

- `candidateId`, `candidateStrategy`, `name`, `targetMealType`;
- `dishFormat`, `primaryTechnique`, `primaryIngredientRefs`;
- summary of at most 18 words;
- servings, active/passive/total time and stable difficulty enum;
- complete `requiredEquipmentIds` and `requiredCapabilities`;
- exact `inventoryUses`, bounded `additionalIngredients`;
- `preparationProfile`, `assumptionsUsed`.

Detailed steps, substitutions, troubleshooting, shopping/package arithmetic and narrative nutrition claims are excluded.

## Expanded recipe artifact

The selected recipe includes identity/revision, yield, ingredients with source/quantity/unit/state, equipment/capabilities, advance preparations, cooking stages/dependencies, durations, relative lead times, sensory cues, storage/freezing guidance, produced components, bounded package hints and reconciliation prompts.

A persisted expansion must support normal cards, shopping, reminders, guided cooking, storage and reconciliation without another AI call.

## Token, latency and model policy

Candidate generation uses exactly three candidates in one call, compact fields, no detailed steps, no previous reasoning and no full historical replay. Persist and reuse expansions. Do not use web search for ordinary recipe generation.

Current evaluation baseline:

```text
model: deepseek-v4-flash
thinking: enabled
reasoning_effort: high
```

Effective provider levels are `high` and `max`; compatibility values `low` and `medium` map to `high`. `max` is not selected.

Use streaming transport for time-to-first-token telemetry and generic progress only. Never expose or persist reasoning content. Render candidate cards only after full validation.

Synchronous `cook_now` release gate:

- target p50 <= 15 seconds;
- target p95 <= 25 seconds;
- no truncated or empty final JSON;
- at most one automatic repair attempt.

If thinking-high cannot meet this gate after contract compaction, use a validated non-thinking fallback for `cook_now`. Menu planning may retain thinking-high behind progressive UI because it is less latency-sensitive. Quality does not justify an indefinite spinner.

Record prompt tokens, cache hits/misses, reasoning tokens, final tokens, time to first token, total latency, repair rate and cost per accepted recipe.

## Structured output and validation

Compatibility mode may use JSON output with deterministic schema validation. Preferred evaluation is strict tool calling with a closed JSON Schema when provider Beta risk is accepted.

Application validation always checks exact references, field types/enums, count, hard constraints, equipment/capabilities, lead-time feasibility, states, ingredient limits, assumption duplication, diversity/fingerprints, culinary plausibility and revision freshness.

All strings from users, inventory, OCR, imports, URLs and notes are untrusted data. Keep instructions separate from JSON, use closed schemas and limits, normalize Unicode/control characters, validate semantics and never execute model output directly.

## Resolved decisions

- Exactly three candidates in one batch call.
- Application-owned generation sessions; no provider-owned authoritative conversation.
- Explicit `cook_now` and `menu_planning` modes.
- Explicit stable meal type plus local date/time/timezone.
- Stock and planned-purchase reservations; no premature physical mutation.
- One aggregated shopping plan across accepted recipes.
- Planned-package surplus becomes projected planning availability.
- Relative AI preparation dependencies; concrete backend reminders.
- DeepSeek V4 Flash thinking-high is the evaluation baseline, subject to latency gate.
- Web/Google search is disabled for ordinary generation.
- Full conversation history and reasoning are not replayed.

## Remaining implementation decisions

- Final JSON Schema/tool definition and acceptance of provider Beta strict-tool risk.
- Canonical ingredient identity service for shopping aggregation.
- Initial package catalog and confidence thresholds.
- Final operation token/cost ceilings after repeated benchmarks.
- Food-safety/storage authority and disclaimer policy.
- Exact slow-response progress UI.
