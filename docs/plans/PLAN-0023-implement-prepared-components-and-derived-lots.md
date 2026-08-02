# PLAN-0023: Implement Prepared Components and Derived Inventory Lots

- **Status:** Ready
- **Type:** Implementation
- **Priority:** High
- **Owner:** Unassigned backend/domain implementation agent
- **Created:** 2026-08-02
- **Last updated:** 2026-08-02
- **Branch:** `agent/plan-0023-prepared-component-lots`
- **Pull request:** Not opened
- **Dependencies:** PLAN-0003 and PLAN-0016 inventory foundations merged
- **Related product:** `docs/product/closed-loop-kitchen-orchestration.md`
- **Related domain:** `docs/domain/inventory-lifecycle.md`
- **Successor:** Sequential planning receives a separate plan after this contract is stable

## Objective

Implement the first bounded backend slice from the accepted closed-loop orchestration order: prepared reusable components and derived inventory lots with provenance, quantity/state, parent consumption, storage, shelf-life evidence, reservations, history, concurrency, and idempotent authoritative transactions.

## User outcome

KitchenFlow can represent outputs such as stock, cooked beans, sauce, dough, chopped vegetables, shredded meat, or meal bases as real inventory lots rather than recipe notes, preserving where they came from and how they may be reused.

## Included scope

- prepared-component product/lot identity;
- partial lot transitions and derived-lot provenance;
- parent input lot references and actual consumed quantities;
- produced quantity/yield and canonical unit or qualitative availability;
- prepared timestamp, storage, lifecycle state, shelf-life evidence, and confidence;
- atomic consume-input/create-output transaction;
- immutable history and audit-safe projections;
- owner isolation;
- ETag/`If-Match`, idempotency, and retry-safe behavior;
- reservation/allocation compatibility;
- PostgreSQL migration and forward-repair guidance;
- OpenAPI 3.1 contracts and generated TypeScript client;
- backend/domain/application/integration/contract tests;
- minimal production frontend projection only if required to inspect the new lots; broad cooking UI is excluded;
- operations/runbook and code-level documentation.

## Excluded scope

- sequential weekly planning simulation;
- recipe generation or AI calls;
- complete guided cooking execution;
- final execution reconciliation;
- localized plan recovery;
- preparation reminders/scheduler;
- multi-day route UI;
- troubleshooting;
- package optimization;
- multi-user household collaboration.

## Domain invariants

- A prepared component is an authoritative inventory lot.
- Creation cannot occur without an explicit source transaction or authorized manual correction path.
- Input consumption and output creation commit atomically.
- A partial input transition preserves the unaffected remainder as its own lot state when required.
- Provenance links are immutable history, not cross-module mutable references.
- Quantity arithmetic, units, ownership, shelf-life source, and reservations remain deterministic.
- Duplicate command delivery cannot consume inputs or create outputs twice.
- A user cannot reference or infer another user's parent lots.
- AI never creates the transaction directly.

## Delivery phases

### Phase 1 — Domain and application contract

- define prepared-component identity and provenance;
- define command/query ports;
- define transaction, correction, and error semantics;
- define compatibility with current inventory lots/history.

### Phase 2 — Persistence and migration

- schema/migration/indexes/constraints;
- atomic parent consumption and output creation;
- concurrency and idempotency;
- migration from current `main`, idempotent script, and fail-closed invalid-data behavior.

### Phase 3 — HTTP and generated contracts

- endpoints/commands for creating and inspecting prepared outputs;
- ETag, CSRF, Problem Details, idempotency headers;
- OpenAPI export/lint/drift;
- generated client regeneration.

### Phase 4 — Tests and operations

- domain and application tests;
- PostgreSQL integration and concurrency tests;
- cross-user isolation;
- retry/replay;
- migration and forward repair;
- telemetry redaction;
- runbook and evidence.

## Independent validation

Because the plan affects inventory consumption, derived lots, concurrency, and migrations, create a separate independent testing plan before completion or as the implementation reaches `Validating`.

## Acceptance criteria

- [ ] Prepared outputs are first-class owner-scoped lots.
- [ ] Inputs and outputs reconcile atomically.
- [ ] Partial transitions preserve correct remainder and provenance.
- [ ] Duplicate requests cannot double-consume or duplicate outputs.
- [ ] Cross-user parent references return nondisclosing failure.
- [ ] ETag, CSRF, idempotency, and Problem Details are complete.
- [ ] Migration and forward-repair paths are tested.
- [ ] OpenAPI/generated client are reproducible.
- [ ] Telemetry and history contain no private payload leakage.
- [ ] Independent test plan provides a final assessment.
- [ ] Sequential planning is not implemented prematurely.

## Execution state

- **Current checkpoint:** Current inventory foundation supports ordinary owner-scoped lots and adjustments; prepared-component semantics are documented but not implemented.
- **Run target:** Deliver the complete backend vertical slice through contracts, migrations, tests, runbook, and independent-test handoff.
- **Blockers:** None for backend start. Coordinate generated-client changes with any active frontend plan.
- **Exact next action:** Claim after the immediate PLAN-0011 assignment is underway or merged, branch from current `main`, create the independent test-plan placeholder, and implement Phase 1 through Phase 4.
