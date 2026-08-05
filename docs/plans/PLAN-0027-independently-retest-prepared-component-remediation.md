# PLAN-0027: Independently Retest Prepared-Component Remediation

- **Status:** In Progress
- **Type:** Testing
- **Priority:** High
- **Owner:** Independent validation agent (PLAN-0027)
- **Created:** 2026-08-05
- **Last updated:** 2026-08-05T15:00:47Z
- **Branch:** `agent/plan-0027-retest-prepared-components`
- **Pull request:** Draft [PR #42](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/42)
- **Implementation plan:** PLAN-0023
- **Implementation pull request:** Draft [PR #39](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/39)
- **Historical validation:** PLAN-0026 / Draft PR #40 — Fail at `7e24fa2f86350d8a566de0b9f2f1cdba984080ff`
- **System under test:** `9bff2e130afb4a0f31ea0b84925362f546d1179e`

## Objective

Independently retest the PLAN-0023 replacement candidate without modifying production behavior, specifically attempting to disprove the remediation of F-0026-01, F-0026-02, and F-0026-03 while preserving the historical PLAN-0026 Fail record.

## Required independent validation

- synchronized same-key/same-command preparation delivery, including replay, one parent consumption, one batch/output/history graph, and no false 412;
- same-key semantic mismatch and different-key stale-parent behavior;
- direct PostgreSQL declared-yield matrix: all invalid NULL/mixed/zero/negative/unknown combinations reject with `23514`, while all valid measured and qualitative modes persist;
- provenance boundaries 0, 1, 49, 50, 51, and 55, independent consumed/produced truncation flags, stable `PreparedAt`/`BatchId` ordering, owner isolation, and absence of N+1 loading;
- non-regression of atomic multi-parent consumption, partial arithmetic, immutable measured and qualitative yield, migration/upgrade/idempotent script, OpenAPI/generated clients, adjustment idempotency, privacy, telemetry, append-only history, and existing inventory operations.

## Execution state

- **Current run delivery target:** Independently retest F-0026-01/02/03 remediation and non-regression against pinned SUT without modifying product behavior.
- **Current checkpoint:** Claimed on `agent/plan-0027-retest-prepared-components` at 2026-08-05T15:00:47Z; SUT worktree detached at `9bff2e130afb4a0f31ea0b84925362f546d1179e`; packaging head `d928752f746030bfd735f84d5b15239562923092` documentation-only delta verified; PR #39 remains open draft.
- **Exact next action:** Open draft validation PR and execute independent remediation/non-regression matrix against the immutable SUT worktree.
- **Blockers:** None at claim time.
- **Working tree state:** Validation branch clean except unrelated pre-existing untracked artifacts excluded from this plan.
- **Constraint:** The implementation agent must not claim, execute, assess, approve, or merge this plan.

## Progress log

### 2026-08-05T15:00:47Z — Independent validation agent

- **Checkpoint:** Claimed PLAN-0027. Verified PR #39 open+draft, SUT ancestor of packaging head, documentation-only candidate-to-head drift, and exact-candidate workflows 31013020164 / 31013020163 / 31013020245 Passed.
- **Evidence and validation:** Created `docs/evidence/plan-0027/` claim package and detached SUT worktree. No product gates executed yet; no readiness inferred from implementation evidence. Confirmed known P3 handoff wording discrepancy attributing historical runs 30964375294/30964372594/30964375347/30964375297 to the replacement candidate.
- **Result:** Plan moved Ready → In Progress.
- **Next action:** Open draft validation PR and execute adversarial retest matrix.
