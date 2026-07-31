# PLAN-0015: Remediate and Validate the Imported Frontend Baseline

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Cursor agent (PLAN-0015)
- **Created:** 2026-07-31
- **Last updated:** 2026-07-31T22:47:18Z
- **Branch:** `agent/plan-0015-remediate-frontend-baseline`
- **Pull request:** Not opened
- **Related implementation plans:** PLAN-0014 (implemented on main; remediation pending), PLAN-0005, PLAN-0011
- **Related ADRs:** ADR-0007
- **Dependencies:** PLAN-0014 merged via PR #14 (`4166973`) and completion docs via PR #15 (`6256011`)

## Objective

Preserve the Emergent experience and PLAN-0014 feature surface while making the frontend baseline technically honest: explicit prototype versus production runtimes, confined mock session state, stable preparation-route external-store snapshots, real rendered-flow tests, production isolation gates, honest CI, and triaged dependency vulnerabilities.

## Context

PLAN-0014 imported and wired the Emergent frontend into `apps/frontend` and merged to `main` through PR #14 (implementation) and PR #15 (status docs). That merge occurred **before explicit owner review**. The owner decided to **preserve** the incorporated work and remediate incrementally through this plan rather than revert.

PLAN-0014 remains on `main` and must not be reopened as `Ready`/`In Progress`. Its durable status is:

```text
Implemented — remediation and independent validation pending through PLAN-0015
```

This frontend is **not** declared production-ready by PLAN-0015 until the owner reviews and approves the draft PR.

## Scope

### Included

- Correct merge/governance documentation for PLAN-0014/#14/#15.
- Explicit `prototype` / `production` / `test` frontend modes via build-time configuration.
- Composition roots that require adapters (no silent mock defaults in production).
- Session adapter boundary; production must not treat localStorage `authed` as authentication.
- Stable `useSyncExternalStore` snapshots for preparation route.
- Rendered RTL tests for Home route, cook handoff, reserved bar, shopping shortfalls.
- Strong production-isolation tests and CI gates.
- Blocking lint (`--max-warnings 0`), format check, dual builds, honest audit policy.
- Dependency vulnerability triage with versioned exceptions only when justified.
- Draft PR against `main` (no agent merge/approve/auto-merge).

### Excluded

- Reverting or removing the Emergent-imported UX surface.
- Silent CRA/Vite migration.
- Hand-authored OpenAPI DTO duplicates.
- Authoritative reservation/inventory/unit-conversion logic in React.
- Direct Keycloak/token storage.
- Merging or self-approving the PLAN-0015 PR.
- Marking PLAN-0015 `Completed` without owner review.
- Unblocking PLAN-0011 or treating PLAN-0005 frontend SHA as definitive without PLAN-0015 approval.

## Substantial run delivery target

- **Target outcome:** Deliver PLAN-0015 through a draft PR ready for owner review: runtimes, session boundary, snapshot fix, isolation/tests, CI honesty, vulnerability triage, corrected governance docs.
- **Minimum acceptable evidence:** green typecheck/lint/format/test; prototype and production builds; isolation tests; candidacy SHA; remaining vuln justifications; smoke evidence recorded truthfully.
- **Valid early-stop:** environment failure, exhausted capacity, or required owner decision outside agent authority (merge/approve).

## Execution phases

### Phase 0: Governance and truthful PLAN-0014 record

- [x] Create PLAN-0015 and register it `In Progress`.
- [x] Correct PLAN-0014 merge narrative (no false owner authorization claim).
- [x] Set PLAN-0014 status to implemented-with-remediation-pending.
- [x] Re-block PLAN-0011 pending PLAN-0015 approval.
- [x] Update PLAN-0005: frontend not definitive until PLAN-0015 approval.
- [x] Add agent PR/merge prohibition to `AGENTS.md` and `CONTRIBUTING.md`.

### Phase 1: Explicit runtimes

- [ ] Build-time `REACT_APP_FRONTEND_MODE` (`prototype`|`production`|`test`).
- [ ] `createPrototypeRuntime` / `createProductionRuntime` composition roots.
- [ ] Production: no ScenarioBar, no synthetic seeds, no mock prep repository default, controlled unavailable states.
- [ ] Prototype: banner/indicator; fixtures and ScenarioBar allowed.

### Phase 2: Session boundary

- [ ] `SessionAdapter` contract and states.
- [ ] Prototype mock session; production incomplete/BFF-ready adapter without fake auth.
- [ ] Production must not persist or trust `authed` from localStorage.

### Phase 3: Stable preparation-route snapshots

- [ ] Repository-versioned or memoized projection snapshot.
- [ ] Provider requires injected repository (no silent shared mock default in production paths).
- [ ] RTL tests for mount stability and shared Home/Plan updates.

### Phase 4: Tests and isolation

- [ ] RTL coverage for Home carousel, cook handoff, reserved bar, shopping shortfalls.
- [ ] Production isolation tests beyond Emergent package name grep.
- [ ] Record smoke evidence truthfully (executed vs not executed).

### Phase 5: CI honesty and dependencies

- [ ] Blocking lint/format/test/typecheck/dual builds/isolation/ts-only/audit policy.
- [ ] Remove `|| true` soft-fails from blocking gates.
- [ ] Clear unused-import/lint warnings to `--max-warnings 0`.
- [ ] Triage high/moderate vulns; versioned allowlist only when justified.

### Phase 6: Handoff

- [ ] PLAN-0015 `Validating`; draft PR open; no agent merge/approve.
- [ ] Candidate SHA, CI, remaining vulns, smoke results, limitations listed for owner.

## Acceptance criteria

- [ ] PLAN-0014 work preserved on main; no revert of imported frontend.
- [ ] Docs do not claim nonexistent owner merge authorization for #14.
- [ ] Agent merge/approve/auto-merge prohibited in durable docs.
- [ ] PLAN-0011 blocked pending PLAN-0015 approval.
- [ ] PLAN-0005 notes frontend baseline not definitive until PLAN-0015 approval.
- [ ] Prototype and production composition roots separated.
- [ ] Production does not render ScenarioBar or use silent mock fallbacks.
- [ ] Production does not use local `authed` as authentication.
- [ ] Missing live adapters yield controlled unavailable states.
- [ ] Preparation-route `useSyncExternalStore` snapshot is referentially stable between notifications.
- [ ] Rendered tests cover main PLAN-0014 flows.
- [ ] Smoke results recorded without false pass claims.
- [ ] Lint zero warnings; format check blocking; audit not soft-failed with `|| true`.
- [ ] High vulns fixed or individually excepted with versioned justification.
- [ ] Prototype and production builds green; isolation tests green.
- [ ] PLAN-0015 remains `Validating` with draft PR; not completed/merged by agent.

## Execution state

- **Current checkpoint:** Phase 0 governance docs ready to commit; runtime composition next.
- **Last completed step:** PLAN-0015 authored; PLAN-0014/0011/0005 corrected; AGENTS/CONTRIBUTING merge prohibition added.
- **Exact next action:** Commit Phase 0; implement prototype/production composition roots.
- **Blockers:** None for implementation. Merge/approve reserved to owner.
- **Validation performed:** Confirmed main contains PR #14/#15 merges.
- **Working tree state:** Governance docs modified on PLAN-0015 branch.
- **Substantial run target:** Draft PR with remediations through Phase 5 as capacity allows.

## Progress log

### 2026-07-31T22:47:18Z — Cursor agent

- **Checkpoint:** PLAN-0015 claimed; branch opened from main after PR #14/#15.
- **Changes included in the commit:** (this commit) plan, registry, PLAN-0014 status correction, agent merge prohibition, PLAN-0011/0005 dependency notes.
- **Validation performed:** Read AGENTS/CONTRIBUTING/plan docs and confirmed baseline SHAs.
- **Result:** Governance phase ready to land with first commit.
- **Next action:** Implement explicit prototype/production runtimes.
- **Blockers or handoff notes:** Do not merge or self-approve any PLAN-0015 PR.

## Completion and handoff checklist

- [ ] Acceptance criteria truthful for delivered work.
- [ ] Draft PR linked; not merged/approved by agent.
- [ ] PLAN-0015 status `Validating` at handoff (not `Completed`).
- [ ] Candidate SHA, CI, vulns, smoke, limitations listed for owner.
- [ ] Exact continuation recorded for unfinished items.
