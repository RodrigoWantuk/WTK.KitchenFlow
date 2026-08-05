# PLAN-0027: Independently Retest Prepared-Component Remediation

- **Status:** Draft
- **Type:** Testing
- **Priority:** High
- **Owner:** Unassigned independent testing agent
- **Created:** 2026-08-05
- **Branch:** `agent/plan-0027-retest-prepared-components`
- **Implementation plan:** PLAN-0023
- **Implementation pull request:** Draft [PR #39](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/39)
- **Historical validation:** PLAN-0026 / Draft PR #40 — Fail at `7e24fa2f86350d8a566de0b9f2f1cdba984080ff`
- **System under test:** Unpinned until a replacement exact green PLAN-0023 candidate exists

## Objective

Independently retest the PLAN-0023 replacement candidate without modifying production behavior, specifically attempting to disprove the remediation of F-0026-01, F-0026-02, and F-0026-03 while preserving the historical PLAN-0026 Fail record.

## Required independent validation

- synchronized same-key/same-command preparation delivery, including replay, one parent consumption, one batch/output/history graph, and no false 412;
- same-key semantic mismatch and different-key stale-parent behavior;
- direct PostgreSQL declared-yield matrix: all invalid NULL/mixed/zero/negative/unknown combinations reject with `23514`, while all valid measured and qualitative modes persist;
- provenance boundaries 0, 1, 49, 50, 51, and 55, independent consumed/produced truncation flags, stable `PreparedAt`/`BatchId` ordering, owner isolation, and absence of N+1 loading;
- non-regression of atomic multi-parent consumption, partial arithmetic, immutable measured and qualitative yield, migration/upgrade/idempotent script, OpenAPI/generated clients, adjustment idempotency, privacy, telemetry, append-only history, and existing inventory operations.

## Execution state

- **Current checkpoint:** Placeholder only; no independent work has been performed and no candidate is pinned.
- **Exact next action:** Wait for PLAN-0023 to publish a replacement exact-head green candidate, then move to Ready, pin that SHA, and have a different testing agent claim this plan in a detached worktree.
- **Constraint:** The implementation agent must not claim, execute, assess, approve, or merge this plan.
