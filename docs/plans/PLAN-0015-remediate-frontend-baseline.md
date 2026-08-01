# PLAN-0015: Remediate and Validate the Imported Frontend Baseline

- **Status:** Validating
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Cursor agent (PLAN-0015)
- **Created:** 2026-07-31
- **Last updated:** 2026-08-01T00:56:47Z
- **Branch:** `agent/plan-0015-remediate-frontend-baseline`
- **Pull request:** [Draft PR #16](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/16)
- **Implementation SHA:** `d31b8765bb79e43a15fdf88906a452529517fdf9`
- **Final branch head SHA:** _(updated in follow-up docs commit after this record)_
- **CI run for final head:** _(recorded after Frontend workflow completes)_
- **Related implementation plans:** PLAN-0014 (implemented on main; remediation pending), PLAN-0005, PLAN-0011
- **Related ADRs:** ADR-0007
- **Dependencies:** PLAN-0014 merged via PR #14 (`4166973`) and completion docs via PR #15 (`6256011`)

## Objective

Preserve the Emergent experience and PLAN-0014 feature surface while making the frontend baseline technically honest: fail-closed production builds, true PrototypeApp/ProductionApp isolation, resilient audit policy, integrated Home/route tests, CTA hierarchy, pantry a11y, bundle inspection, and truthful smoke evidence.

## Context

PLAN-0014 imported and wired the Emergent frontend into `apps/frontend` and merged to `main` through PR #14 (implementation) and PR #15 (status docs). That merge occurred **before explicit owner review**. The owner decided to **preserve** the incorporated work and remediate incrementally through this plan rather than revert.

PLAN-0014 remains on `main` and must not be reopened as `Ready`/`In Progress`. Its durable status is:

```text
Implemented — remediation and independent validation pending through PLAN-0015
```

Historical PLAN-0014 claims that mock and production were fully isolated are **superseded by PLAN-0015** (incomplete separation was a remediation driver).

This frontend is **not** declared production-ready by PLAN-0015 until the owner reviews and approves the draft PR.

## Scope

### Included

- Correct merge/governance documentation for PLAN-0014/#14/#15.
- Explicit `prototype` / `production` / `test` frontend modes via build-time configuration.
- `yarn build` defaults to production (never silent prototype); explicit `build:prototype` / `build:production`.
- Separate `PrototypeApp` / `ProductionApp` composition roots; production webpack stubs exclude mock graph.
- Session adapter boundary; production must not treat localStorage `authed` as authentication.
- Stable `useSyncExternalStore` snapshots for preparation route.
- Integrated RTL tests for Home + full route, cook handoff with real router, pantry card a11y.
- Production isolation guards + **bundle inspect** for forbidden prototype tokens.
- Blocking lint (`--max-warnings 0`), format check, dual builds, fail-closed audit policy with fixture tests.
- Dependency vulnerability triage with versioned exceptions only when justified (active: `1124282`).
- Manual smoke matrix evidence (viewports, zoom, keyboard, touch, reduced motion, locales).
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

- **Target outcome:** Deliver PLAN-0015 through a draft PR ready for owner review after independent-review blocker fixes.
- **Minimum acceptable evidence:** green typecheck/lint/format/test/guards; `yarn build` production; prototype+production builds; bundle inspect; audit policy + tests; integrated route tests; smoke matrix recorded; candidacy SHAs + CI.
- **Valid early-stop:** environment failure, exhausted capacity, or required owner decision outside agent authority (merge/approve).

## Execution phases

### Phase 0: Governance and truthful PLAN-0014 record

- [x] Create PLAN-0015 and register it `In Progress`.
- [x] Correct PLAN-0014 merge narrative (no false owner authorization claim).
- [x] Set PLAN-0014 status to implemented-with-remediation-pending.
- [x] Re-block PLAN-0011 pending PLAN-0015 approval.
- [x] Update PLAN-0005: frontend not definitive until PLAN-0015 approval.
- [x] Add agent PR/merge prohibition to `AGENTS.md` and `CONTRIBUTING.md`.
- [x] Mark superseded PLAN-0014 isolation claims as historical.

### Phase 1: Explicit runtimes

- [x] Build-time `REACT_APP_FRONTEND_MODE` (`prototype`|`production`|`test`).
- [x] `PrototypeApp` / `ProductionApp` composition roots (webpack replaces PrototypeApp in production).
- [x] Production: no ScenarioBar, no synthetic seeds/store/fixtures, controlled unavailable states.
- [x] Prototype: banner/indicator; fixtures and ScenarioBar allowed.
- [x] `yarn build` = production; missing mode fails closed in production NODE_ENV.

### Phase 2: Session boundary

- [x] `SessionAdapter` contract and states.
- [x] Prototype mock session; production incomplete/BFF-ready adapter without fake auth.
- [x] Production must not persist or trust `authed` from localStorage.

### Phase 3: Stable preparation-route snapshots

- [x] Repository-versioned or memoized projection snapshot.
- [x] Provider requires injected repository (no silent shared mock default in production paths).
- [x] RTL tests for mount stability and shared Home/Plan updates.

### Phase 4: Tests and isolation

- [x] Integrated Home + RouteChain + MemoryRouter tests (multi-target, CTA, Later, cook query).
- [x] Pantry card: sibling Link + shortfall action (no nested interactive).
- [x] Cook handoff with real router navigation assertions.
- [x] Bundle inspect gate for forbidden prototype tokens.
- [x] Manual smoke matrix executed and recorded (Passed/Blocked only with notes).

### Phase 5: CI honesty and dependencies

- [x] Blocking lint/format/test/typecheck/dual builds/isolation/ts-only/build-mode/bundle-inspect/audit policy.
- [x] Remove `|| true` soft-fails from blocking gates.
- [x] Fail-closed audit policy + fixture tests (clean/unapproved/allowlisted/expired/mismatch/empty/invalid/spawn/registry).
- [x] Active allowlist documents exception `1124282` (not empty).

### Phase 6: Handoff

- [x] PLAN-0015 `Validating`; draft PR open; no agent merge/approve.
- [ ] Owner review of final head SHA / CI (owner action).

## Acceptance criteria

- [x] PLAN-0014 work preserved on main; no revert of imported frontend.
- [x] Docs do not claim nonexistent owner merge authorization for #14.
- [x] Agent merge/approve/auto-merge prohibited in durable docs.
- [x] PLAN-0011 blocked pending PLAN-0015 approval.
- [x] PLAN-0005 notes frontend baseline not definitive until PLAN-0015 approval.
- [x] Prototype and production composition roots separated (ProductionApp does not mount mock store/fixtures).
- [x] Production does not render ScenarioBar or use silent mock fallbacks.
- [x] Production does not use local `authed` as authentication.
- [x] Missing live adapters yield controlled unavailable states.
- [x] Preparation-route `useSyncExternalStore` snapshot is referentially stable between notifications.
- [x] Integrated tests cover Home↔route, multi-target CTA readiness, cook handoff, pantry a11y.
- [x] Smoke results recorded without false pass claims.
- [x] Lint zero warnings; format check blocking; audit not soft-failed with `|| true`.
- [x] High vulns fixed or individually excepted with versioned justification (`1124282` active).
- [x] `yarn build` is production; prototype build remains explicit; bundle inspect green.
- [x] PLAN-0015 remains `Validating` with draft PR; not completed/merged by agent.

## Smoke evidence (truthful)

Source: `apps/frontend/docs/plan-0015-manual-smoke-matrix.json` (prototype `yarn start`, Playwright headless_shell).

| Check | Result | Notes |
|---|---|---|
| 360px Landing→Access→Home→Pantry→Plan | **Passed** | bottomnav on narrow viewport |
| 360px touch/mobile nav | **Passed** | |
| 768px journey | **Passed** | |
| 1280px journey + keyboard carousel | **Passed** | ArrowRight on carousel |
| 200% zoom Landing→Home | **Passed** | CSS `zoom=2` |
| touch/mobile viewport (iPhone 12) | **Passed** | |
| prefers-reduced-motion | **Passed** | |
| locale pt-BR / en / es | **Passed** | landing + shell switch |
| Despensa déficit → compras review | **Passed** | `componentShared` → `pantry-reserved-debt-cp_broth` |
| CTA Cozinhar navegação | **Passed** | `/app/cozinhar/r3?sourcePreparationRouteId=…&relatedPlanEntryId=…` |
| Home carousel + Plan chain (RTL) | **Passed** | `HomeAndRoute.integration.test.tsx` |
| Cook handoff router (RTL) | **Passed** | real MemoryRouter paths/query |

## Bundle size evidence (gzip, CRA report)

| Mode | JS gzip | CSS gzip |
|---|---|---|
| `yarn build` / `build:production` | **93.46 kB** | **11.65 kB** |
| `yarn build:prototype` | **212.22 kB** | **11.69 kB** |

Bundle inspect: zero hits for forbidden prototype tokens in production JS (`build/production-bundle-report.json`).

## Remaining limitations

- Live BFF session (`GET /api/v1/session`) not integrated; production session is explicitly unavailable / FeatureUnavailable.
- Live preparation-route / shopping / pantry projections not wired; production shows controlled unavailable/empty states — **no mock data**.
- CRA/`react-scripts@5` retained; advisory **`1124282`** (react-router RSC CSRF, patch ≥8.3.0) allowlisted through **2026-12-31**.
- Yarn resolution warnings may still appear for CRA-transitive overrides; each override remediates known advisories without breaking current builds (see `dependency-vulnerability-triage.md`).
- Prototype store module still exists for PrototypeApp only; production webpack replaces PrototypeApp so mock graph is not shipped.

## Execution state

- **Current checkpoint:** Independent-review blockers remediated; status `Validating`; draft PR #16 awaiting owner re-review.
- **Last completed step:** Fail-closed build, ProductionApp isolation + bundle inspect, hardened audit policy + tests, integrated Home/route/CTA/pantry tests, smoke matrix Passed, docs SHA fields.
- **Exact next action:** Owner reviews draft PR #16 against final head + CI; agent must not merge/approve.
- **Blockers:** Owner review required for merge and for unblocking PLAN-0011 / definitive PLAN-0005 frontend pin.
- **Validation performed:** `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test` (54), `yarn guard:*`, `yarn build`, `yarn build:prototype`, `yarn build:production`, `yarn inspect:production-bundle`, `yarn audit:policy`, manual smoke matrix.
- **Working tree state:** Remediation commit(s) on PLAN-0015 branch; PR remains draft.
- **Substantial run target:** Achieved for owner re-review handoff.

## Progress log

### 2026-08-01T00:56:47Z — Cursor agent

- **Checkpoint:** Independent-review blocker remediations landed; PLAN-0015 remains Validating.
- **Changes included:** production-default `yarn build`; PrototypeApp/ProductionApp + webpack stubs; bundle inspect; fail-closed audit policy + TS fixture tests; Home↔Route integration tests; CTA hierarchy + per-target readiness; pantry sibling actions; smoke matrix; PLAN-0014 supersession note; CI workflow gates.
- **Validation performed:** Local gates listed above; smoke matrix all Passed for required journeys.
- **Result:** Draft PR ready for new owner review; not Completed; not merged.
- **Next action:** Owner review of final head + Frontend CI; do not merge/approve by agent.
- **Blockers or handoff notes:** PLAN-0011 remains Blocked; PLAN-0005 frontend not definitive.

### 2026-07-31T23:15:00Z — Cursor agent

- **Checkpoint:** Initial remediations landed; PLAN-0015 moved to Validating for owner review.
- **Changes included in the commit:** Runtimes, session, snapshot fix, RTL/isolation tests, CI honesty, vuln triage, README, plan evidence.
- **Validation performed:** Local gates; smoke matrix partially executed (RTL only) at that time.
- **Result:** Draft PR candidate; later superseded by 2026-08-01 blocker fixes.
- **Next action:** Owner review (superseded by additional remediations).
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
- [x] Implementation vs final head SHA distinction documented (filled after push).
- [x] Candidate CI, vulns, smoke, limitations listed for owner.
- [x] Exact continuation recorded for unfinished items (owner review only).
