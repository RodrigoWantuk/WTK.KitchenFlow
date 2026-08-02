# PLAN-0019: Reconcile the Active Roadmap and Define the Next Work Queue

- **Status:** Completed
- **Type:** Documentation
- **Priority:** Critical
- **Owner:** Repository planning review
- **Created:** 2026-08-02
- **Last updated:** 2026-08-02T13:38:00Z
- **Branch:** `agent/plan-0019-reconcile-roadmap`
- **Pull request:** Draft PR opened by the planning review
- **Base:** `main` at `388cd6a560bfc275e14e1ab72852ec30f31285e2`
- **Related plans:** PLAN-0008, PLAN-0011, PLAN-0017, PLAN-0020, PLAN-0021, PLAN-0022, PLAN-0023

## Objective

Reconcile KitchenFlow's durable documentation and current repository state after the authenticated inventory frontend merge, remove stale execution metadata, decide whether active work should be merged or separated, and leave a prioritized, bounded queue that another developer can execute without conversation history.

## Authoritative basis reviewed

The review covered the complete canonical reading paths defined by `docs/README.md`:

- repository, contribution, agent, plan, and environment governance;
- accepted discovery and reference-persona evidence;
- product vision, audience/profile, public entry/contextual home, closed-loop orchestration, user journeys, and initial release;
- inventory, planning/shopping, recipes/cooking, and cross-domain invariants;
- architecture overview, principles, and ADR-0001 through ADR-0007;
- AI architecture, usage/cost governance, recipe artifact protocol, provider evaluation material, and thumbnail policy;
- privacy, security/abuse, testing strategy, product foundation gates, and platform/reliability guidance;
- active plans and relevant completed implementation plans;
- frontend, backend, and contract package operational READMEs.

Historical evidence artifacts were used only when they affect current delivery truth. They do not override accepted product, domain, architecture, or current registry state.

## Findings

### Repository truth requiring reconciliation

- PLAN-0016 and PR #25 are merged into `main` at `e35c453acccd79f01398e51b7fe8ee4cb94f44a3`.
- PR #32 then added a host-specific GitHub App workflow to `AGENTS.md`; current reviewed `main` is `388cd6a560bfc275e14e1ab72852ec30f31285e2`.
- The root README still claimed that no production application had been implemented.
- The frontend README still described PLAN-0015 approval as pending.
- The registry still described PLAN-0016 as ready for review instead of merged.
- PLAN-0011 still mixed immediately executable public/mock frontend work with later live backend-contract work.
- PLAN-0017's documentation delivery was merged, but the plan remained `Validating` because operation-specific benchmark work had not been separated from the documentation outcome.
- PLAN-0008 remained too broad to absorb recipe-specific validation without obscuring ownership and acceptance criteria.

### Plan merge/consolidation decision

No two complete active plans should be merged:

- PLAN-0011 is a frontend/product implementation outcome.
- PLAN-0008 is an operations, launch, growth, AI-economics, and monetization program.
- PLAN-0017 is a completed protocol-definition outcome.

Merging any pair would create an overbroad plan with conflicting owners, validation, and delivery cadence.

The overlapping unfinished work is consolidated instead:

- PLAN-0017's repeated model benchmarks, strict-output decision, and final contract thresholds move to PLAN-0022.
- The recipe-specific portion of PLAN-0008 Phase 3 also delegates to PLAN-0022.
- PLAN-0011 Phase 3/4 live-contract work moves to PLAN-0021.
- PLAN-0011 remains the immediate public-entry and mock-backed contextual-home delivery.
- PLAN-0020 owns the missing production profile/household/equipment frontend.
- PLAN-0023 begins the first backend slice from the accepted closed-loop implementation order.

This preserves historical plans while removing duplicate future ownership.

## Prioritized work queue

1. **PLAN-0011 — Public entry and mock-backed contextual home.** Immediate next developer assignment. Deliver Phase 1 and Phase 2 as one substantial frontend outcome without inventing live contracts.
2. **PLAN-0020 — Profile, household, preferences, and equipment frontend.** Consume the already merged PLAN-0012 backend and expose editable production UI.
3. **PLAN-0022 — Recipe AI benchmark and strict-contract finalization.** Complete the evidence that PLAN-0017 intentionally left open and provide decision-ready inputs to PLAN-0008 and future AI implementation.
4. **PLAN-0021 — Live contextual-home source vertical slice.** Starts only after the presentation contract from PLAN-0011 and profile frontend from PLAN-0020 are stable; integrates source-specific backend/read contracts and live adapters.
5. **PLAN-0023 — Prepared components and derived inventory lots.** First implementation slice from the closed-loop orchestration order. Sequential planning receives its own later plan only after this contract is stable.
6. **PLAN-0008 — Launch/economics Phases 1–2.** May proceed as a documentation/research stream without activating spend or production provider calls; recipe-operation evaluation is delegated to PLAN-0022.

## Scope

### Included

- roadmap and registry reconciliation;
- binding amendments for PLAN-0008, PLAN-0011, and PLAN-0017;
- creation of PLAN-0020 through PLAN-0023;
- correction of stale root/frontend status documentation;
- explicit execution and merge-order guidance;
- handoff prompt basis for the next developer.

### Excluded

- application code;
- provider calls or benchmark execution;
- acquisition spend;
- implementation of the newly created plans;
- changing accepted product or architecture decisions;
- merging or approving the draft PR.

## Validation

- Cross-checked the work queue against the accepted initial-release lifecycle.
- Confirmed PLAN-0012, PLAN-0016, profile APIs, session boundary, generated client, and production inventory UI are on `main`.
- Confirmed PLAN-0011 can execute Phase 1 and Phase 2 without unavailable live contracts.
- Confirmed live home sources require explicit backend contracts and cannot be invented in React.
- Confirmed the closed-loop document requires prepared components before sequential planning.
- Confirmed all AI implementation remains behind ADR-0005's AI Gateway.
- Confirmed no plan authorizes direct frontend provider calls, browser token storage, silent authoritative mutation, or scope reduction.
- Confirmed the new `AGENTS.md` host rule is a mandatory prerequisite for the next developer's remote Git/GitHub operations.

## Connector delivery note

The available GitHub connector creates or updates one content file per contents-API commit and does not expose the base tree SHA needed for a repository-tree transaction. The final branch state is reconciled and reviewable, but the documentation package is necessarily delivered through sequential connector commits. This limitation is recorded rather than hidden.

## Acceptance criteria

- [x] Current merged repository state is reflected truthfully.
- [x] Every active plan has one current owner boundary and exact next action.
- [x] PLAN-0017 documentation delivery is separated from residual model research.
- [x] PLAN-0011 immediate frontend scope is separated from future live contracts.
- [x] PLAN-0008 no longer duplicates recipe-operation benchmark ownership.
- [x] Natural next implementation and research plans exist.
- [x] Work order and non-concurrency constraints are explicit.
- [x] The next developer assignment is unambiguous.
- [x] No agent approval, auto-merge, or merge is performed.

## Execution state

- **Current checkpoint:** Documentation review and roadmap reconciliation completed on the planning branch.
- **Substantial run target:** Produce a decision-ready next-work queue and all missing bounded plan artifacts.
- **Delivered outcome:** Binding amendments, new plans, truthful registry, and corrected repository status documentation.
- **Validation performed:** Canonical documentation cross-check and current GitHub delivery-state verification.
- **Known limitation:** No executable code changed; CI should run documentation/secret checks only.
- **Blockers:** None for owner review.
- **Exact next action:** Owner reviews the draft PR. After merge, assign PLAN-0011 to the next developer.
- **Working tree state:** Connector-backed branch; no local working tree.

## Progress log

### 2026-08-02T13:38:00Z — repository planning review

- Reviewed the canonical documentation map, active plans, accepted ADRs, current implementation READMEs, and merged PR state.
- Reconciled stale status claims after PR #25 and PR #32.
- Declined unsafe whole-plan mergers and consolidated only overlapping residual work.
- Defined PLAN-0020 through PLAN-0023.
- Selected PLAN-0011 Phase 1 + Phase 2 as the next developer assignment.
- Recorded the connector's single-file commit limitation.
