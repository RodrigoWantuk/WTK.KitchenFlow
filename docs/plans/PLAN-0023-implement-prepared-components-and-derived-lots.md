# PLAN-0023: Implement Prepared Components and Derived Inventory Lots

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** High
- **Owner:** Codex backend/domain implementation agent
- **Created:** 2026-08-02
- **Last updated:** 2026-08-04T21:53:04Z
- **Branch:** `agent/plan-0023-prepared-component-lots`
- **Pull request:** Draft [PR #39](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/39)
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

- **Claimed at:** 2026-08-04T01:24:28Z
- **Main baseline:** `f166ce21020f6704d3fcd99b4b6d195b33638155`
- **Current checkpoint:** Domain/application contract, PostgreSQL persistence/migration, authenticated HTTP/OpenAPI surface, generated client, unit coverage, migration constraints, runbook updates, provenance integrity, rollback, stale concurrency, and concurrent idempotency replay coverage are implemented. PLAN-0026 remains Draft and unpinned.
- **Run target:** Deliver the complete owner-scoped preparation transaction vertical slice: domain/application contract, atomic PostgreSQL persistence and migration, HTTP/OpenAPI/client contract, tests, operations documentation, implementation evidence, and an independently testable candidate.
- **Blockers:** None. Existing untracked frontend build and smoke artifacts are preserved and excluded from this plan.
- **Exact next action:** Run the complete required backend, migration, OpenAPI, generated-client, and frontend validation matrix; then record exact candidate evidence before moving to `Validating`.

## Progress log

### 2026-08-04T01:24:28Z — Codex backend/domain implementation agent

- **Run delivery target:** Complete the prepared-component and derived-lot backend vertical slice through an independently testable candidate.
- **Checkpoint:** Claimed PLAN-0023 from the verified `origin/main` baseline `f166ce21020f6704d3fcd99b4b6d195b33638155`.
- **Changes included in the commit:** Plan claim, registry reconciliation, and Draft PLAN-0026 independent-validation placeholder only.
- **Documentation reviewed:** Repository rules, plan registry, active-plan contract, inventory module/application/persistence/API orientation, product lifecycle, domain inventory lifecycle, security, testing gates, and migration/runbook conventions.
- **Evidence and validation:** `hostname` confirmed `NOTEBOOK-DEB-RODRIGO`; `github-app-run git fetch --all --prune`; `github-app-run git pull --ff-only origin main`; baseline confirmed as `f166ce21020f6704d3fcd99b4b6d195b33638155`.
- **Defects or coverage gaps:** No product validation executed yet. Pre-existing untracked generated build/smoke artifacts remain outside the commit.
- **Result:** Claim complete; implementation may begin.
- **Next action:** Deliver Phase 1 domain/application contracts and begin Phase 2 persistence.

### 2026-08-04T01:43:45Z — Codex backend/domain implementation agent

- **Run delivery target:** Deliver the first complete implementation checkpoint: deterministic preparation transaction behavior from domain through generated contract.
- **Checkpoint:** Implemented manual preparation batches with multi-parent measured consumption, a single output product partitioned into portions, immutable provenance/history, owner-scoped queries, per-parent opaque concurrency versions, semantic idempotency, and prepared shelf-life metadata.
- **Changes included in the commit:** Inventory domain/application/persistence/API contracts; relational migration and append-only triggers; OpenAPI snapshot and generated TypeScript mirrors; unit and migration-constraint tests; lifecycle and runbook documentation; implementation evidence scaffold.
- **Documentation reviewed:** Product closed-loop orchestration, inventory lifecycle, architecture principles, privacy, testing gates, backend workflow, current inventory implementation, and migration conventions.
- **Evidence and validation:** Build and unit tests passed (`49` unit tests). Empty local PostgreSQL database upgraded through `20260804013603_AddPreparedComponentTransactions`; preparation triggers were verified. OpenAPI export/check/lint and all generated-client checks passed. Integration-suite execution was attempted twice; the environment emitted pre-existing OIDC redirect `500` failures before a conclusive full-suite summary, so it is not treated as passing evidence.
- **Defects or coverage gaps:** Dedicated preparation PostgreSQL atomicity/race tests and full exact-head CI remain required. Reservation/lock persistence is intentionally not implemented because planning data does not yet exist; the compatibility boundary is documented.
- **Result:** Implementation checkpoint complete and compiling; not yet ready for independent validation.
- **Next action:** Add preparation-specific integration tests, execute migration/idempotent-script and full CI gates, then update evidence and publish an immutable candidate.

### 2026-08-04T01:49:00Z — Codex backend/domain implementation agent

- **Run delivery target:** Extend the implementation checkpoint with real PostgreSQL provenance integrity coverage.
- **Checkpoint:** Added a Testcontainers PostgreSQL test that creates an authoritative preparation graph, verifies append-only batch/input/output metadata, and proves composite owner links reject a mismatched owner.
- **Changes included in the commit:** Preparation provenance integration test and synchronized evidence/plan state.
- **Evidence and validation:** `PreparationProvenanceIsOwnerConsistentAndAppendOnly` passed against PostgreSQL 18 (1/1).
- **Defects or coverage gaps:** Atomic write-store rollback and concurrent stale-parent delivery require dedicated tests; full exact-head CI is still pending.
- **Result:** PostgreSQL integrity checkpoint passed.
- **Next action:** Add write-store atomic rollback/concurrency tests and complete required gates.

### 2026-08-04T21:53:04Z — Codex backend/domain implementation agent

- **Run delivery target:** Close the preparation transaction correctness gap before executing the full candidate gate matrix.
- **Checkpoint:** Preparation validation is now side-effect free until every input and output rule passes. PostgreSQL integration coverage proves full rollback when output persistence fails, one-winner behavior for concurrent different keys, and authoritative replay for concurrent same-key delivery.
- **Changes included in the commit:** Deterministic semantic output hashing; deferred detached parent mutation; concurrent idempotency reread; one unit test and three real PostgreSQL Testcontainers tests.
- **Evidence and validation:** `dotnet build KitchenFlow.slnx -c Release --no-restore` passed; UnitTests passed 50/50; `PostgreSqlInventoryPreparationStoreTests` passed 3/3 against PostgreSQL 18.
- **Defects or coverage gaps:** The broader Backend workflow, idempotent migration-script execution, HTTP/Keycloak checks, OpenAPI/client drift, secret scan, and exact-head CI remain unverified.
- **Result:** Atomic write-store and concurrency checkpoint passed locally; the plan remains In Progress.
- **Next action:** Run the complete local validation matrix and write privacy-safe exact-command evidence.
