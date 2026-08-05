# PLAN-0022: Evaluate and Finalize Recipe AI Artifact Contracts

- **Status:** In Progress
- **Type:** Research
- **Priority:** High
- **Owner:** Cursor agent (PLAN-0022 lean evaluation)
- **Created:** 2026-08-02
- **Last updated:** 2026-08-05
- **Branch:** `agent/plan-0022-recipe-ai-evaluation`
- **Pull request:** Draft (opening with this delivery)
- **Predecessor:** PLAN-0017 documentation delivery
- **Related operations plan:** PLAN-0008
- **Related ADR:** ADR-0005
- **Lean evaluation amendment:** [`PLAN-0022-amendment-2026-08-05-lean-evaluation.md`](PLAN-0022-amendment-2026-08-05-lean-evaluation.md)
- **Lean validation policy:** [`PLAN-0007-amendment-2026-08-05-lean-validation.md`](PLAN-0007-amendment-2026-08-05-lean-validation.md)

## Objective

Produce decision-ready evidence for the recipe candidate and selected-expansion protocol, finalize strict machine contracts and thresholds, and accept, revise, or reject the draft protocol **without** implementing production provider integration.

Under the lean amendment, the goal is to **unblock recipe AI contract implementation**, not to statistically select a permanent provider.

## Consolidated ownership

This plan is the sole owner of:

- PLAN-0017's unfinished benchmark campaign (now reduced by the lean amendment);
- the recipe-specific model-evaluation portion of PLAN-0008 Phase 3;
- the strict JSON Schema/tool-output decision;
- final candidate/expansion field limits and semantic thresholds.

PLAN-0017 is completed as documentation history. PLAN-0008 consumes this plan's evidence for economics and routing; it does not duplicate the campaign.

## Included scope

- deterministic validation of fixtures 01–10;
- strict candidate and expansion JSON Schemas (`0.3`);
- positive/negative contract fixtures and semantic validators;
- bounded live campaign: 1 thinking + 1 fallback for `cook_now`, 1 thinking + 1 fallback for `menu_planning`;
- at most one repair retry for empty/truncated/invalid output;
- injection/no-authority checks;
- ingredient-identity and package-confidence decisions;
- `cook_now` / menu-planning model policy;
- protocol disposition.

## Excluded scope

- production AI Gateway/provider adapter;
- real-user data;
- authoritative inventory/planning/shopping implementation;
- image generation, object storage, or thumbnail jobs;
- browser/provider credentials in source;
- direct frontend provider calls;
- model reasoning retention or publication;
- selection of a permanent provider solely from this benchmark;
- three-repetition statistical campaigns and p95 claims from the lean sample;
- independent validation PR or PLAN-0029 retest.

## Environment and credential rules

- Use synthetic fixtures only.
- Keep API keys in ignored environment/secret storage (`DEEPSEEK_API_KEY`).
- Never commit or print credentials or private reasoning.
- Bound total test cost before the first call (`PLAN0022_COST_CEILING_USD`, default `0.05`).
- Separate live-provider evaluation from default repository tests (`PLAN0022_LIVE_EVAL=1`).
- On `NOTEBOOK-DEB-RODRIGO`, use GitHub App wrappers, an `agent/` branch, a draft PR, and request `RodrigoWantuk` review.

## Execution phases

### Phase 1 — Deterministic fixtures and schemas

- parse every request fixture as JSON;
- publish strict response schemas;
- add positive/negative fixtures and semantic validators;
- document decisions for identity, package confidence, and routing.

### Phase 2 — Bounded live campaign

- run the four representative calls only;
- capture observed latency/cost without p50/p95 claims;
- classify schema/semantic failures and repairs.

### Phase 3 — Contract finalization and disposition

- version schemas and bounds as protocol `0.3`;
- set disposition Accepted / Revised / Rejected;
- hand implementation to a later AI Gateway plan;
- unblock PLAN-0021 when remaining menu/planning source contracts are satisfied.

## Acceptance criteria

- [x] All request fixtures parse and have deterministic validators.
- [x] Strict candidate and expansion schemas are versioned.
- [x] Positive and negative contract fixtures cover schema, references, units, limits, privacy, and injection/no-authority cases.
- [ ] Bounded live campaign executed (4 calls, ≤1 repair each) with cost ceiling.
- [x] Exact-reference, canonical-unit, equipment, lead-time, and assumption rules are encoded.
- [x] Ingredient-identity and package-confidence decisions are recorded.
- [x] `cook_now` and menu-planning model policies are recorded.
- [x] Statistical p50/p95 characterization explicitly deferred.
- [x] Protocol disposition is explicit (**Revised** → `0.3`).
- [x] No production integration or user data is introduced.
- [x] No independent validation PR / PLAN-0029 created.
- [x] PLAN-0008 references this evidence rather than duplicating it.

## Execution state

- **Current checkpoint:** Lean validation policy adopted; post-merge PLAN-0023/0026/0027 reconciliation written; protocol `0.3` schemas, fixtures, validators, and decisions delivered; deterministic tests passed. Live campaign blocked on missing `DEEPSEEK_API_KEY`.
- **Run target:** Complete lean Phases 1–3, including the four live calls when the credential is available, then mark Completed and open/update the draft PR.
- **Blockers:** `DEEPSEEK_API_KEY` not present in the agent environment (runtime prerequisite).
- **Exact next action:** Export `DEEPSEEK_API_KEY`, set `PLAN0022_LIVE_EVAL=1`, run `node scripts/ai/recipe-live-eval.mjs`, record evidence, then mark PLAN-0022 Completed and update PLAN-0021 to Ready.

## Progress log

### 2026-08-05 — Lean adoption and deterministic contract finalization

- Adopted [`PLAN-0007-amendment-2026-08-05-lean-validation.md`](PLAN-0007-amendment-2026-08-05-lean-validation.md) and [`PLAN-0022-amendment-2026-08-05-lean-evaluation.md`](PLAN-0022-amendment-2026-08-05-lean-evaluation.md).
- Reconciled registry delivery for PLAN-0023 (merged PR #39 at `7912d4676ffc1f06ac193b7d6788c3a910ed2bd1`), PLAN-0026 (PR #40 closed without merge, Fail), and PLAN-0027 (Pass, incorporated through PR #39 / PR #42).
- Published strict schemas under `packages/contracts/ai/recipe/`, positive/negative fixtures, and Node validators.
- Validation: `cd packages/contracts/ai/recipe && npm test && npm run check:drift` — passed.
- Protocol disposition set to **Revised** (`0.3`).
- Live campaign not yet executed (credential missing).
