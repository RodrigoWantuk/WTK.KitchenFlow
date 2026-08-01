# PLAN-0016: Define AI Recipe Artifact Protocol and Model Evaluation Pack

- **Status:** Draft
- **Type:** Documentation
- **Priority:** High
- **Owner:** Stakeholder + AI architecture collaboration
- **Created:** 2026-08-01
- **Last updated:** 2026-08-01T17:00:00Z
- **Branch:** `docs/plan-0016-ai-recipe-artifacts`
- **Pull request:** Draft PR
- **Related issues:** None
- **Related ADRs:** ADR-0005
- **Dependencies:** Accepted AI gateway boundary, recipe/cooking domain, PLAN-0013 orchestration direction

## Objective

Define, together with the product owner, the smallest useful AI surface for recipe ideation and recipe expansion.

The AI must generate versioned JSON artifacts that can be persisted and reused by card menus, shopping calculations, preparation schedules, reminders, guided cooking, and later reconciliation. The application remains deterministic wherever rules and calculations are sufficient.

## Current stakeholder decisions

1. Profile, onboarding, equipment, skills, inventory quantities, expiration, storage state, menu assembly, shopping arithmetic, reservations, scheduling, and mutations are deterministic.
2. Manual inventory names remain user-owned. The application validates length and safety but does not spend AI calls normalizing ordinary manual entry.
3. Initial recipe AI uses two calls:
   - `recipe.suggest_candidates.v1`: one batch call returning multiple compact recipe candidates.
   - `recipe.expand_selected.v1`: one call only after selection, returning the full reusable recipe artifact.
4. Candidate ingredient use returns absolute quantities and references the exact inventory item ID and user-provided name.
5. Percent used, amount remaining, sufficiency, and shopping shortfall are calculated by application code.
6. Full recipe output stores ingredients, how-to, pre-preparations, durations, dependencies, relative scheduling offsets, sensory cues, equipment, yield, storage, and reusable produced components.
7. Exact calendar timestamps are calculated by the backend from relative dependencies and the accepted menu time.
8. Step explanation and troubleshooting will use separate, smaller operation contracts in later plans.
9. Requests and responses are JSON-only at the application protocol boundary.
10. All free text is bounded and treated as untrusted data, never as higher-priority instructions.

## Included

- Draft operation identifiers and responsibilities.
- Reusable persisted artifact strategy.
- Draft JSON request envelopes for model comparison.
- Candidate and expanded-recipe response contracts.
- Token-minimization direction.
- Prompt-injection treatment for user and imported text.
- Evaluation checklist for comparing providers/models.
- Explicit unresolved decisions requiring stakeholder discussion.

## Excluded

- Provider selection.
- Production code or direct provider integration.
- Final JSON Schema files.
- Final token budgets.
- Image/receipt extraction.
- Troubleshooting, step explanation, adaptation, or reconciliation contracts.
- Nutrition guarantees or food-safety authority.
- Automatic application of AI suggestions.

## Deliverables

- `docs/ai/recipe-artifact-protocol.md`
- `docs/ai/examples/README.md`
- Multiple self-contained JSON benchmark requests for:
  - ordinary weekday candidates;
  - expiration-priority candidates;
  - limited-equipment candidates;
  - batch/freezer candidates;
  - prompt-injection resistance;
  - selected-recipe expansion;
  - multi-day preparation expansion.

## Acceptance criteria

This draft must not be marked Ready or Completed until the stakeholder explicitly approves:

- operation boundaries;
- request envelope;
- candidate fields;
- complete recipe artifact fields;
- inventory matching behavior;
- limits and token strategy;
- benchmark scenarios;
- which model outputs are acceptable.

Examples must parse as JSON and must contain no real user data.

## Execution state

- **Current checkpoint:** Initial protocol draft and seven benchmark request examples created for stakeholder/model evaluation.
- **Last completed step:** Recorded the two-call reusable-artifact architecture and generated self-contained JSON requests.
- **Exact next action:** Stakeholder runs the examples against candidate models, compares outputs, and records desired/undesired behavior before schemas or gateway code are finalized.
- **Blockers:** Stakeholder decisions on candidate count, output detail, strictness of ingredient matching, token budgets, and preferred model behavior.
- **Validation performed:** JSON syntax validation; documentation-only review.
- **Working tree state:** Draft documentation branch; no application code or provider call.
- **Substantial run target:** Achieved for initial collaborative discussion and model-comparison pack.

## Progress log

### 2026-08-01T17:00:00Z — OpenAI architecture collaboration

- **Checkpoint:** PLAN-0016 opened as Draft.
- **Decisions captured:** deterministic-first product boundary; two recipe operations; reusable persisted artifacts; absolute ingredient quantities; backend-owned shopping and scheduling arithmetic.
- **Examples:** Seven self-contained JSON benchmark requests.
- **Next action:** Product owner evaluates multiple models and returns annotated results.
