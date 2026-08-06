# PLAN-0022 Amendment — Lean Recipe AI Evaluation (2026-08-05)

- **Status:** Accepted
- **Type:** Research amendment
- **Parent plan:** [`PLAN-0022`](PLAN-0022-evaluate-and-finalize-recipe-ai-contracts.md)
- **Created:** 2026-08-05
- **Stakeholder authorization:** Owner instruction to adopt lean validation and execute a reduced PLAN-0022 campaign
- **Validation policy:** [`PLAN-0007-amendment-2026-08-05-lean-validation.md`](PLAN-0007-amendment-2026-08-05-lean-validation.md)

## Objective

Unblock recipe AI contract implementation with decision-ready strict contracts. This amendment replaces the original repeated multi-fixture statistical campaign with a lean deterministic-plus-bounded-live evaluation.

This campaign is **not** intended to statistically select a permanent provider.

## Superseded original expectations

The following original PLAN-0022 expectations are superseded for execution:

- at least three repetitions of every principal fixture;
- p50/p95 latency claims from a large sample;
- routine independent validation or a successor retest plan (for example PLAN-0029);
- production AI Gateway or provider adapter implementation.

Historical provisional provider notes from PLAN-0017 remain immutable evidence and may be referenced.

## Required deterministic work

Validate all existing request fixtures locally for:

- JSON parsing;
- schema validity of finalized response contracts against positive/negative fixtures;
- required references;
- collection and string limits;
- canonical units;
- hard constraints;
- equipment references;
- privacy-sensitive fields;
- injection/no-authority behavior.

Add or correct deterministic validators and positive/negative fixtures where needed.

## Bounded live-provider campaign

Rules:

- synthetic data only;
- credentials only through an ignored environment variable (`DEEPSEEK_API_KEY`);
- never commit or print the API key;
- set a small cost ceiling before calls;
- keep the live campaign outside default repository tests.

Execute only this representative set:

| Run | Mode | Model policy |
|---|---|---|
| 1 | `cook_now` | thinking-high |
| 2 | `cook_now` | fallback non-thinking |
| 3 | `menu_planning` | thinking-high |
| 4 | `menu_planning` | fallback non-thinking |

Add at most one retry when a response is empty, truncated, or schema-invalid.

Do not claim statistically reliable p95 latency from this sample. Record observed latency and explicitly defer statistical performance characterization.

## Decision output required

Finalize and version:

- strict candidate response schema;
- strict selected-expansion schema;
- collection and string bounds;
- exact-reference rules;
- canonicalization rules;
- ingredient identity treatment;
- package-confidence threshold;
- synchronous `cook_now` model policy;
- menu-planning model policy;
- fallback and repair behavior;
- protocol disposition: Accepted, Revised, or Rejected.

## Validation for this plan

Use only focused checks relevant to changed files:

- fixture parser tests;
- schema validator tests;
- positive and negative contract fixtures;
- injection/no-authority fixture tests;
- generated schema or contract drift check for AI schemas;
- documentation consistency check.

Do not create an independent PLAN-0022 validation PR.
Do not create PLAN-0029 merely to retest PLAN-0022.
Owner review and focused CI are sufficient unless a concrete critical defect is discovered.

## Excluded

- production AI Gateway/provider adapter;
- real-user data;
- permanent provider selection solely from this sample;
- image generation infrastructure.
