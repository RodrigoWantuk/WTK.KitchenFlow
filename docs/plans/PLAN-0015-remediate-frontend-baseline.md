# PLAN-0015: Remediate and Validate the Imported Frontend Baseline

- **Status:** Validating
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Cursor agent (PLAN-0015)
- **Created:** 2026-07-31
- **Last updated:** 2026-07-31T23:15:00Z
- **Branch:** `agent/plan-0015-remediate-frontend-baseline`
- **Pull request:** Draft (opening against `main`)
- **Candidate SHA:** `864e6bc5a0ee80374538ee6857f9f4c310cc49fb`
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
- Rendered RTL tests for Home carousel, cook handoff, reserved bar, shopping shortfalls.
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

- [x] Build-time `REACT_APP_FRONTEND_MODE` (`prototype`|`production`|`test`).
- [x] `createPrototypeRuntime` / `createProductionRuntime` composition roots.
- [x] Production: no ScenarioBar render, no synthetic seeds, no mock prep repository default, controlled unavailable states.
- [x] Prototype: banner/indicator; fixtures and ScenarioBar allowed.

### Phase 2: Session boundary

- [x] `SessionAdapter` contract and states.
- [x] Prototype mock session; production incomplete/BFF-ready adapter without fake auth.
- [x] Production must not persist or trust `authed` from localStorage.

### Phase 3: Stable preparation-route snapshots

- [x] Repository-versioned or memoized projection snapshot.
- [x] Provider requires injected repository (no silent shared mock default in production paths).
- [x] RTL tests for mount stability and shared Home/Plan updates.

### Phase 4: Tests and isolation

- [x] RTL coverage for Home carousel, cook handoff, reserved bar, shopping shortfalls.
- [x] Production isolation tests beyond Emergent package name grep.
- [x] Record smoke evidence truthfully (executed vs not executed).

### Phase 5: CI honesty and dependencies

- [x] Blocking lint/format/test/typecheck/dual builds/isolation/ts-only/audit policy.
- [x] Remove `|| true` soft-fails from blocking gates.
- [x] Clear unused-import/lint warnings to `--max-warnings 0`.
- [x] Triage high/moderate vulns; versioned allowlist only when justified.

### Phase 6: Handoff

- [x] PLAN-0015 `Validating`; draft PR open; no agent merge/approve.
- [ ] Owner review of candidate SHA / CI (owner action).

## Acceptance criteria

- [x] PLAN-0014 work preserved on main; no revert of imported frontend.
- [x] Docs do not claim nonexistent owner merge authorization for #14.
- [x] Agent merge/approve/auto-merge prohibited in durable docs.
- [x] PLAN-0011 blocked pending PLAN-0015 approval.
- [x] PLAN-0005 notes frontend baseline not definitive until PLAN-0015 approval.
- [x] Prototype and production composition roots separated.
- [x] Production does not render ScenarioBar or use silent mock fallbacks.
- [x] Production does not use local `authed` as authentication.
- [x] Missing live adapters yield controlled unavailable states.
- [x] Preparation-route `useSyncExternalStore` snapshot is referentially stable between notifications.
- [x] Rendered tests cover main PLAN-0014 flows.
- [x] Smoke results recorded without false pass claims.
- [x] Lint zero warnings; format check blocking; audit not soft-failed with `|| true`.
- [x] High vulns fixed or individually excepted with versioned justification.
- [x] Prototype and production builds green; isolation tests green.
- [x] PLAN-0015 remains `Validating` with draft PR; not completed/merged by agent.

## Smoke evidence (truthful)

| Check | Result | Notes |
|---|---|---|
| Home carousel + Plan chain share completion | **Executed (RTL)** | `PreparationRouteProvider.test.tsx` shared snapshot + Home unlock |
| Complete dependencies → Cook CTA | **Executed (unit/RTL)** | Ready target + handoff ids after required deps |
| Pantry reserved shortfall → shopping review | **Executed (RTL)** | Availability bar + shopping shortfall send |
| 360 / 768 / 1280 px | **Not executed** | No interactive browser matrix in this agent run |
| 200% zoom | **Not executed** | |
| keyboard-only | **Partial** | Carousel has keyboard handlers; no full a11y audit run |
| touch mobile viewport | **Not executed** | |
| prefers-reduced-motion | **Not executed** | |
| pt-BR / en / es | **Not executed** | i18n keys remain; locale switch not smoke-tested |

## Remaining limitations

- Live BFF session (`GET /api/v1/session`) not integrated; production session is explicitly `unavailable`.
- Live preparation-route / shopping projections not wired; production shows controlled unavailable/empty states.
- Shared `store.ts` module still contains the `cocinaris_state_v1` identifier string; production paths use prefs-only persistence and empty fixtures.
- CRA/`react-scripts@5` retained; advisory `1124282` (react-router RSC CSRF, patch ≥8.3.0) allowlisted through 2026-12-31.
- Interactive viewport/locale smoke matrix above remains for owner or follow-up agent with a browser.

## Execution state

- **Current checkpoint:** Remediations implemented; status `Validating`; draft PR for owner review.
- **Last completed step:** Dual builds, honest CI gates, RTL/isolation tests, vuln triage, governance corrections.
- **Exact next action:** Owner reviews draft PR; agent must not merge/approve.
- **Blockers:** Owner review required for merge and for unblocking PLAN-0011 / definitive PLAN-0005 frontend pin.
- **Validation performed:** `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` (29), `yarn build:prototype`, `yarn build:production`, `yarn guard:*`, `yarn audit:policy`.
- **Working tree state:** Branch ready for draft PR.
- **Substantial run target:** Achieved for draft-PR handoff.

## Progress log

### 2026-07-31T23:15:00Z — Cursor agent

- **Checkpoint:** Remediations landed; PLAN-0015 moved to Validating for owner review.
- **Changes included in the commit:** Runtimes, session, snapshot fix, RTL/isolation tests, CI honesty, vuln triage, README, plan evidence.
- **Validation performed:** Local gates listed above; smoke matrix partially executed (RTL only).
- **Result:** Draft PR candidate ready; not Completed.
- **Next action:** Owner review; do not merge/approve by agent.
- **Blockers or handoff notes:** PLAN-0011 remains Blocked; PLAN-0005 frontend not definitive.

### 2026-07-31T22:47:18Z — Cursor agent

- **Checkpoint:** PLAN-0015 claimed; branch opened from main after PR #14/#15.
- **Changes included in the commit:** plan, registry, PLAN-0014 status correction, agent merge prohibition, PLAN-0011/0005 dependency notes.
- **Validation performed:** Read AGENTS/CONTRIBUTING/plan docs and confirmed baseline SHAs.
- **Result:** Governance phase landed.
- **Next action:** Implement explicit prototype/production runtimes.
- **Blockers or handoff notes:** Do not merge or self-approve any PLAN-0015 PR.

## Completion and handoff checklist

- [x] Acceptance criteria truthful for delivered work.
- [x] Draft PR linked; not merged/approved by agent.
- [x] PLAN-0015 status `Validating` at handoff (not `Completed`).
- [x] Candidate SHA, CI, vulns, smoke, limitations listed for owner.
- [x] Exact continuation recorded for unfinished items.
