# AI Recipe Artifact Protocol

- **Status:** Validating — protocol `0.3-draft`
- **Plan:** [`PLAN-0017`](../plans/PLAN-0017-define-ai-recipe-artifact-protocol.md)
- **Thumbnail policy:** [`PLAN-0008`](../plans/PLAN-0008-define-lean-launch-ai-economics.md)
- **Updated:** 2026-08-02
- **Text-model baseline:** `deepseek-v4-flash`, thinking enabled, `reasoning_effort: high`

## Boundary

Cocinaris uses AI to propose culinary artifacts. Application code remains authoritative for identity, authorization, inventory, quantities, expiration, reservations, shopping aggregation, package arithmetic, scheduling, concurrency and mutations.

Every model response is parsed, schema-validated and semantically validated. It may be rejected or repaired and never mutates product state directly.

The initial flow generates exactly **three compact candidates in one call** and expands only the selected candidate. The selected expansion also returns a bounded `thumbnailVisual` description. Image generation is a separate PLAN-0008 operation and never blocks recipe use.

## Operations

### `recipe.suggest_candidates.v1`

Returns exactly three compact candidates for either:

- `cook_now`: immediate meal using current physical availability and a hard lead window;
- `menu_planning`: dated meal using physical stock, reservations, planned purchases and reliable projected package surplus.

Candidates contain comparison and validation fields, not detailed cooking steps. Transient candidates may reuse an existing cached image, but do not automatically trigger paid image generation.

### `recipe.expand_selected.v1`

Produces one persisted recipe revision containing ingredients, equipment, preparation tasks, stages, dependencies, relative lead times, sensory cues, storage/freezing guidance, produced components, reconciliation hints and `thumbnailVisual`.

The backend converts relative dependencies into concrete reminders and validates/canonicalizes the visual descriptor.

### `recipe.thumbnail.generate.v1`

A separate PLAN-0008 operation. It receives only a validated visual descriptor plus versioned render policy. Provider, model, prompt, cache job, budget, storage, moderation and fallback behavior do not belong to the recipe artifact.

## Required request context

Every suggestion request includes:

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

The model never guesses timezone or silently changes the requested meal. A `cook_now` candidate is invalid when soaking, thawing, marinating, fermentation, cooling or another blocking preparation exceeds the available lead window.

## Candidate strategies

One call returns one candidate for each strategy:

| Mode | Strategy | Intent |
|---|---|---|
| both | `on_hand_first` | prioritize current stock and minimize additions |
| `cook_now` | `on_hand_flexible` | reuse stock with bounded additions |
| `menu_planning` | `planned_purchase_reuse` | reuse existing shopping lines or reliable projected surplus |
| both | `exploratory` | meaningfully different but still practical option |

All candidates must be recognizable dishes or conventional techniques. Across a batch they must differ materially in dish format, primary technique and main ingredient structure. Renaming, seasoning changes, sauce swaps or side changes alone are not sufficient diversity.

The backend computes authoritative semantic fingerprints and rejects near-duplicates across current and later rounds.

## Generation sessions

Cocinaris owns generation-session state. Another batch receives current canonical state plus at most nine compact prior semantic summaries/fingerprints and explicit rejection reasons. Full model responses, provider conversation history and reasoning are not replayed.

Provider cache/state is an optimization only; correctness never depends on it.

## Planning availability and shopping

The model consumes backend-computed `availableForPlanning` values. Availability source is one of:

```text
on_hand
planned_purchase
prepared_component
```

The model must not calculate balances, sufficiency, reservations, remaining quantities, shortfalls, package counts, percentages or shopping quantities.

When a recipe is accepted, deterministic code:

1. validates current revisions;
2. expands or reuses a persisted equivalent;
3. validates the complete recipe and `thumbnailVisual`;
4. reserves physical availability;
5. aggregates remaining demand into one shopping plan;
6. resolves package quantity using user choice, preference, purchase history, catalog, bounded hint, then exact-demand fallback;
7. reserves recipe demand against the planned purchase;
8. exposes reliable unused package quantity to later menu slots.

Physical stock is not increased until purchase confirmation. Planned and physical stock remain separate ledgers.

## Ingredient state and preparation

Availability explicitly declares states such as `raw`, `cooked`, `frozen`, `thawed`, `soaked`, `chopped`, `prepared_component` or `unknown`.

The model cannot assume a prepared state. Required transformations appear as advance preparations or recipe stages.

Candidates expose:

- whether advance preparation is required;
- minimum lead minutes;
- blocking preparation codes;
- whether reusable components may be produced.

Expanded tasks return relative dependencies only. Concrete timestamps, reminders, conflict handling and rescheduling remain backend-owned.

## Constraints and exact references

Hard constraints are absolute: restrictions, required/excluded ingredients, equipment/capabilities, target meal, lead time, maximum time, inventory mode, ingredient state and explicit user constraints.

For supplied items, the model copies exact stable references, names, units, states and availability sources. Unit conversion and renaming are forbidden.

`assumptionsUsed` lists only authorized assumptions actually used. An assumption cannot also appear as an additional ingredient.

Unsupported claims such as `homemade`, `fresh`, `healthy`, `authentic`, `traditional` or `high-protein` are forbidden unless supported by deterministic input.

## Candidate artifact

A compact candidate contains:

- stable ID and strategy;
- name and target meal type;
- dish format, primary technique and primary ingredient references;
- summary capped at 18 words;
- servings, active/passive/total time and stable difficulty;
- complete equipment IDs and capabilities;
- exact inventory uses and bounded additional ingredients;
- preparation profile and assumptions used.

Detailed steps, troubleshooting, shopping/package arithmetic, nutrition prose and the full visual descriptor are excluded.

## Expanded recipe artifact

A persisted expansion must support cards, shopping, reminders, guided cooking, storage, reconciliation and thumbnail-cache lookup without another text-generation call.

In addition to normal recipe fields, it includes:

```json
{
  "thumbnailVisual": {
    "schemaVersion": "1",
    "appearanceDescription": "Cooked chicken breast in tomato sauce, served with white rice and sautéed carrot slices on one plate.",
    "visibleComponents": [
      "cooked chicken breast",
      "tomato sauce",
      "white rice",
      "sautéed carrot slices"
    ],
    "dishFormat": "plated_main_with_sides",
    "plating": "single modern dinner plate",
    "sauceAppearance": "smooth red tomato sauce coating the chicken",
    "textureAndDoneness": [
      "fully cooked chicken",
      "loose white rice",
      "lightly browned carrots"
    ],
    "garnish": [],
    "dominantColors": ["red", "white", "orange"],
    "excludedElements": ["cutlery", "napkin", "text", "logo", "people"]
  }
}
```

### Visual descriptor rules

- Describe only visible finished-dish properties.
- Include only ingredients/components expected to be visible.
- Preserve material state: cooked, roasted, sautéed, blended, sliced, whole, melted and similar distinctions.
- Do not invent garnish, sides, brands, packaging, tableware or restaurant styling.
- Do not include user identity, pantry quantities, restrictions, private notes, imported source text, URLs or household history.
- Do not make safety, nutrition, freshness, authenticity or guaranteed-result claims.
- Keep fields bounded and canonicalizable.
- Material visual changes create a new descriptor; wording-only edits do not.

The backend validates consistency with normalized ingredients and produced states, canonicalizes accepted JSON and computes the semantic visual identity. The model never authors hashes or cache decisions.

PLAN-0008 separates:

```text
visualIdentityKey = hash(descriptor version + normalized descriptor)
renderCacheKey = hash(visual identity + style/prompt/model/format policy)
```

Only the semantic descriptor belongs to the recipe artifact. Localized title and free-form summary are not durable image cache keys.

Thumbnail generation is asynchronous and fail-soft. Saving, planning, opening and cooking continue with a deterministic placeholder when no image is available.

## Model, latency and token policy

Candidate generation uses compact fields, no detailed steps, no previous reasoning and no full historical replay. Ordinary recipe generation does not use web/Google search.

The visual descriptor is generated only during selected-recipe expansion and must not inflate candidate responses.

Synchronous `cook_now` target:

```text
p50 <= 15 seconds
p95 <= 25 seconds
empty/truncated JSON = 0
maximum automatic repair attempts = 1
```

If thinking-high cannot meet the gate after compaction, use a validated non-thinking fallback for `cook_now`. Menu planning may retain higher reasoning behind progressive UI when measured quality justifies it.

Never expose or persist reasoning content. Record token/cache usage, time to first token, total latency, repair rate, semantic failures and cost per accepted recipe. Track visual-descriptor failures separately from image-generation metrics.

## Validation

Application validation covers:

- closed field types, limits and enums;
- exact references, names, units, states and sources;
- hard constraints and revision freshness;
- equipment/capability and lead-time feasibility;
- assumption duplication;
- culinary plausibility and diversity;
- visual-component fidelity and material state;
- absence of private context in `thumbnailVisual`;
- deterministic visual canonicalization;
- independence of recipe success from thumbnail availability.

All strings from users, inventory, OCR, imports, URLs and notes are untrusted data. Instructions remain separate from data, schemas are closed and model output is never executed directly.

## Remaining decisions

- final strict JSON Schema/tool definition;
- final `thumbnailVisual` limits, enums and canonicalization rules;
- canonical ingredient identity service;
- package catalog and confidence thresholds;
- final token/cost ceilings after repeated benchmarks;
- food-safety/storage authority and disclaimer policy;
- slow-response progress UI;
- implementation handoff to PLAN-0008 image generation and cache infrastructure.
