# PLAN-0026 findings

Immutable SUT: `7e24fa2f86350d8a566de0b9f2f1cdba984080ff`

## Summary

| ID | Severity | Status | Title |
|---|---|---|---|
| F-0026-01 | P1 | Open | Concurrent same-key preparation can return false `412 precondition_failed` instead of authoritative replay |
| F-0026-02 | P1 | Open | `ck_preparation_batches_declared_yield` accepts all-null and measured-value-without-unit rows |
| F-0026-03 | P2 | Open | Provenance responses are hard-bounded to 50 batches without truncation/continuation signal |

No P0 findings.

---

## F-0026-01

- **Finding ID:** F-0026-01
- **Severity:** P1
- **Status:** Open
- **Requirement:** Preparation idempotency — concurrent duplicate delivery of the same owner-scoped key must yield exactly one preparation and authoritative replay for losers (no false stale-write failure).
- **Affected SUT SHA:** `7e24fa2f86350d8a566de0b9f2f1cdba984080ff`
- **Environment:** local Testcontainers PostgreSQL 18.4; WebApplicationFactory integration host; hostname `NOTEBOOK-DEB-RODRIGO`
- **Preconditions:** Authenticated owner; one parent lot; identical preparation body; identical `Idempotency-Key`; synchronized concurrent POST `/api/v1/inventory/preparations`.
- **Exact reproduction:** `Plan0026IndependentPreparedComponentValidationTests.ConcurrentSameKeyPreparationAndKeyReuseBehaveDeterministically` (10 gated concurrent iterations). Reproduced on validation branch and again in the detached SUT worktree.
- **Expected result:** Both HTTP responses `201 Created` with the same `batchId`; exactly one parent consumption; idempotent replay disposition for the loser.
- **Actual result:** One response `201`, the other `412` with `precondition_failed` when the loser reloads parent versions after the winner commits but after the initial idempotency miss. Store-level same-key coverage still passes because it does not exercise this HTTP validation ordering race.
- **Evidence paths:** `reports/integration-plan0026.txt`, `reports/sut-dotnet-test.txt`, `apps/backend/tests/KitchenFlow.IntegrationTests/Plan0026IndependentPreparedComponentValidationTests.cs`
- **Security/privacy impact:** None observed (owner-scoped). Reliability impact: clients retrying after apparent timeout can receive a false concurrency failure and may attempt a new key, risking duplicate preparation attempts.
- **Suggested remediation boundary:** In `PreparedComponentApplicationWorkflow.PrepareAsync`, after a version/precondition failure (and/or before returning `precondition_failed`), re-read the owner-scoped idempotency record and replay when the semantic hash matches — mirroring the adjustment `MutateAsync` same-key ordering.
- **Retest requirement:** Re-run the independent concurrent same-key preparation test for at least 10 synchronized iterations with zero `412` outcomes, plus existing store-level same-key coverage.

---

## F-0026-02

- **Finding ID:** F-0026-02
- **Severity:** P1
- **Status:** Open
- **Requirement:** Declared-yield check constraint must reject invalid persisted combinations including all-null yield and measured value without unit.
- **Affected SUT SHA:** `7e24fa2f86350d8a566de0b9f2f1cdba984080ff`
- **Environment:** PostgreSQL 18.4 after migration `20260804013603_AddPreparedComponentTransactions`
- **Preconditions:** Migrated database; valid owner/product rows for FK satisfaction.
- **Exact reproduction:** Direct SQL inserts against `inventory.preparation_batches` (see `reports/declared-yield-constraint-probe.txt`) and `QualitativePreparationPersistsReplaysAndRejectsInvalidConstraintRows`.
- **Expected result:** Check constraint violation (`23514`) for all-null; value-without-unit; unit-without-value; mixed measured/availability; zero/negative; unknown unit; unknown availability.
- **Actual result:** Constraint **accepts** `all-null` and `value-without-unit` because PostgreSQL CHECK treats UNKNOWN (NULL) as passing. Application-layer validation still rejects these on the normal API path.
- **Evidence paths:** `reports/declared-yield-constraint-probe.txt`, `reports/integration-plan0026.txt`
- **Security/privacy impact:** None direct. Integrity impact: defense-in-depth for authoritative preparation history is incomplete; a bypass or future code path could persist invalid declared yield.
- **Suggested remediation boundary:** Rewrite `ck_preparation_batches_declared_yield` with explicit `FALSE`-producing predicates (for example `NOT (...)` wrappers / `IS NOT DISTINCT FROM` style completeness checks) in a forward migration; keep application validation.
- **Retest requirement:** Re-run the direct-SQL rejection matrix and ensure `MigrationsCreateRequiredSchemasAndTables` asserts this constraint name.

---

## F-0026-03

- **Finding ID:** F-0026-03
- **Severity:** P2
- **Status:** Open
- **Requirement:** Provenance is bounded to 50 related batches per direction; clients must not reasonably mistake an incomplete snapshot for complete history when documentation/behavior disagree or omit truncation signals.
- **Affected SUT SHA:** `7e24fa2f86350d8a566de0b9f2f1cdba984080ff`
- **Environment:** HTTP integration host
- **Preconditions:** Parent lot with 55 consumed-by preparation batches.
- **Exact reproduction:** `ProvenanceIsBoundedToFiftyDeterministicBatchesAndDoesNotDiscloseTruncationFlag`
- **Expected result:** Bound of 50 is enforced; contract/docs clearly communicate truncation, or response includes an explicit incomplete/truncated signal.
- **Actual result:** Exactly 50 batches returned with stable ordering; response has no `hasMore` / `truncated` / `continuationToken` field. Bound behavior itself is correct.
- **Evidence paths:** independent integration test output in `reports/integration-plan0026.txt`
- **Security/privacy impact:** None. Usability/contract completeness impact only.
- **Suggested remediation boundary:** Document the hard bound in OpenAPI/domain docs and/or add an explicit truncation indicator without inventing pagination in this slice.
- **Retest requirement:** Confirm docs/OpenAPI and/or response signal after remediation.
