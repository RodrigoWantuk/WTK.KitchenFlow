# PLAN-0022: Evaluate and Finalize Recipe AI Artifact Contracts

- **Status:** Ready
- **Type:** Research
- **Priority:** High
- **Owner:** Unassigned AI evaluation and contract agent
- **Created:** 2026-08-02
- **Last updated:** 2026-08-02
- **Branch:** `agent/plan-0022-recipe-ai-evaluation`
- **Pull request:** Not opened
- **Predecessor:** PLAN-0017 documentation delivery
- **Related operations plan:** PLAN-0008
- **Related ADR:** ADR-0005

## Objective

Produce decision-ready empirical evidence for the recipe candidate and selected-expansion protocol, finalize strict machine contracts and thresholds, and either accept, revise, or reject protocol `0.3-draft` without implementing production provider integration.

## Consolidated ownership

This plan is the sole owner of:

- PLAN-0017's unfinished repeated benchmark campaign;
- the recipe-specific model-evaluation portion of PLAN-0008 Phase 3;
- the strict JSON Schema/tool-output decision;
- final candidate/expansion field limits and semantic thresholds.

PLAN-0017 is completed as documentation history. PLAN-0008 consumes this plan's evidence for economics and routing; it does not duplicate the campaign.

## Included scope

- fixtures 06–10, with at least three repetitions of principal scenarios;
- candidate and expansion operation evaluation;
- `cook_now` and `menu_planning`;
- DeepSeek V4 Flash thinking-high baseline;
- at least one bounded non-thinking or lower-latency fallback;
- schema validity, exact references, hard constraints, equipment, lead time, state, assumptions, and diversity;
- injection resistance and no-authority source text;
- `thumbnailVisual` fidelity, privacy, field bounds, and canonicalization test vectors;
- TTFT, total latency, tokens, cache use, repair attempts, provider/model fingerprint, and cost;
- strict JSON Schema/tool definition under the accepted contract boundary;
- canonical ingredient identity decision requirements;
- package-confidence threshold proposal;
- final protocol disposition and updated evaluation docs.

## Excluded scope

- production AI Gateway/provider adapter;
- real-user data;
- authoritative inventory/planning/shopping implementation;
- image generation, object storage, or thumbnail jobs;
- browser/provider credentials in source;
- direct frontend provider calls;
- model reasoning retention or publication;
- selection of a permanent provider solely from this benchmark.

## Environment and credential rules

- Use synthetic fixtures only.
- Keep API keys in ignored environment/secret storage.
- Record provider/model/version without recording credentials or private reasoning.
- Bound total test cost before the first call.
- Separate live-provider evaluation from default repository tests.
- Read the final host-specific section of `AGENTS.md` before any remote operation.
- On `NOTEBOOK-DEB-RODRIGO`, use the documented GitHub App wrappers, an `agent/` branch, a draft PR, and request `RodrigoWantuk` review.

## Execution phases

### Phase 1 — Reproduce and validate fixtures

- parse every fixture as JSON;
- validate current schema and semantic expectations;
- document ambiguities before live calls;
- pin operation, prompt, fixture, provider, and model versions.

### Phase 2 — Repeated model campaign

- run at least three repetitions for principal candidate and expansion scenarios;
- capture bounded raw outputs and metrics;
- classify failures and repairs;
- compare thinking-high with a validated lower-latency fallback.

### Phase 3 — Contract finalization

- define strict closed schemas and collection/string limits;
- define exact-reference and canonicalization rules;
- create ingredient-identity and package-confidence decision records;
- add deterministic positive/negative contract fixtures.

### Phase 4 — Decision

- score quality, validity, latency, privacy, and cost;
- decide synchronous `cook_now` model policy;
- decide menu-planning policy;
- set protocol status to Accepted, Revised, or Rejected;
- hand implementation to a later AI Gateway plan.

## Required evidence

For every run:

- fixture and repetition ID;
- operation/workflow/prompt version;
- provider/model/version and relevant reasoning mode;
- TTFT and total latency;
- input/output/cached usage;
- estimated/actual cost;
- schema and semantic result;
- repair/fallback count;
- diversity and hard-constraint result;
- `thumbnailVisual` result where applicable;
- privacy/injection result;
- bounded raw output or privacy-safe failure record.

## Acceptance criteria

- [ ] All fixtures parse and have deterministic validators.
- [ ] Required scenarios have at least three repetitions.
- [ ] Empty/truncated output rate and repair rate are known.
- [ ] `cook_now` latency is measured against p50 <= 15s and p95 <= 25s.
- [ ] Exact references, states, units, constraints, and preparation feasibility are verified.
- [ ] Injection attempts cannot change authority or expose hidden context.
- [ ] Visual descriptors are bounded, faithful, private, and canonicalizable.
- [ ] Thinking-high and fallback policies are evidence-based.
- [ ] Strict contracts and thresholds are versioned.
- [ ] Final disposition is explicit.
- [ ] No production integration or user data is introduced.
- [ ] PLAN-0008 references this evidence rather than duplicating it.

## Execution state

- **Current checkpoint:** Protocol 0.3, prompt, fixtures, and initial evaluation record are on `main`.
- **Run target:** Complete Phases 1–4 as one decision-ready evaluation package.
- **Blockers:** Live provider access and an explicitly bounded evaluation budget are runtime prerequisites; they are not repository blockers.
- **Exact next action:** Claim the plan, verify the host workflow, establish a cost ceiling, run deterministic fixture validation, then execute the repeated provider campaign.
