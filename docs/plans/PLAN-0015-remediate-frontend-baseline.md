# PLAN-0015: Remediate and Validate the Imported Frontend Baseline

- **Status:** Validating
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Cursor agent (PLAN-0015)
- **Created:** 2026-07-31
- **Last updated:** 2026-08-01T05:20:00Z
- **Branch:** `agent/plan-0015-remediate-frontend-baseline`
- **Pull request:** [Draft PR #16](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/16)
- **Implementation SHA (prior reviewed head):** `11f00bdfdcd2f8139d449841c52968df587ed794`
- **Last CI-validated code SHA (prior round):** `11f00bdfdcd2f8139d449841c52968df587ed794`
- **Prior push workflow (green):** [Frontend #30680034509](https://github.com/RodrigoWantuk/WTK.KitchenFlow/actions/runs/30680034509)
- **Prior PR workflow (green):** [Frontend #30680035933](https://github.com/RodrigoWantuk/WTK.KitchenFlow/actions/runs/30680035933)
- **Current PR head:** consult [PR #16](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/16) metadata (`headRefOid`)
- **This residual round Implementation / Last CI-validated SHA:** recorded in PR #16 body after push+CI (no self-SHA commit loop)
- **Latest exact-head CI (this residual round):** recorded in PR #16 body (push + PR workflows + browser-smoke artifact id)
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
- Automated Playwright browser smoke (reproducible) plus explicit manual validation items.
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
- [x] Automated browser smoke reproducible; manual zoom explicitly Not executed.

### Phase 5: CI honesty and dependencies

- [x] Blocking lint/format/test/typecheck/dual builds/isolation/ts-only/build-mode/bundle-inspect/audit policy.
- [x] Remove `|| true` soft-fails from blocking gates.
- [x] Fail-closed audit policy + fixture tests including terminal error/summary/signal/maxBuffer cases.
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

### Automated browser smoke (Playwright)

**Canonical evidence:** GitHub Actions artifact `browser-smoke-report` on the exact-head workflow run (see PR #16 body). Runtime JSON/HTML under `apps/frontend/docs/browser-smoke/` are gitignored and are not durable “current” evidence. Schema example: `apps/frontend/docs/browser-smoke/browser-smoke-report.schema.example.json`.

Runner: `yarn smoke:browser` / CI `yarn smoke:browser:ci`  
Dependency: direct `playwright@1.55.1` (`yarn smoke:browser:install`).

| Check | Result | Notes |
|---|---|---|
| 360 / 768 / 1280 journeys | **Passed** (CI artifact) | |
| keyboard-only baseline vs focused `:focus-visible` | **Passed** (CI artifact) | landing, acesso/demo, carousel, main nav, route, settings, pantry asChild CTA |
| CSS zoom approximation | **Passed** (CI artifact) | Explicitly **not** browser zoom |
| touch/mobile (iPhone 12 device) | **Passed** (CI artifact) | |
| prefers-reduced-motion (fail-closed) | **Passed** (CI artifact) | includes open scenario Sheet when present; claims limited to rendered nodes |
| production locale mobile 360 | **Passed** (CI artifact) | |
| locale pt-BR / en / es (prototype) | **Passed** (CI artifact) | |
| Despensa shortfall → compras | **Passed** (CI artifact) | |
| CTA Cozinhar | **Passed** (CI artifact) | |

### Manual browser validation

| Check | Result | Notes |
|---|---|---|
| Real browser zoom 200% | **Not executed — owner/manual validation required** | CSS `zoom` approximation must not be claimed as browser zoom |
| Full assistive-tech audit (NVDA/VoiceOver) | **Not executed — owner/manual validation required** | Awaiting explicit owner decision on a later plan |

#### Owner checklist — real browser zoom 200%

Surfaces: Landing, Acesso, Home, Despensa, Planejamento, Compras, modal/dialog, carrossel, CTA Cozinhar.

Verify: no content loss; no global horizontal overflow; actions reachable; text readable; dialogs usable; navigation functional.

## Bundle size evidence (gzip, CRA report)

| Mode | JS gzip | CSS gzip |
|---|---|---|
| `yarn build` / `build:production` | ~94.8 kB | ~11.65 kB |
| `yarn build:prototype` | ~212 kB | ~11.7 kB |

Bundle inspect: zero hits for forbidden prototype tokens in production JS.

## Remaining limitations

- Live BFF session / live projections not wired; production shows FeatureUnavailable / empty — **no mock data**.
- CRA/`react-scripts@5` retained; advisory **`1124282`** allowlisted through **2026-12-31**.
- Incompatible Yarn resolution warnings remain for packages listed in `apps/frontend/docs/dependency-resolution-triage.md` (each justified individually; babel systemjs downgrade corrected to `7.29.8`).
- Real browser zoom 200% and full AT audit remain manual.

## Execution state

- **Current checkpoint:** Residual nesting/focus/evidence round landed; status `Validating`; draft PR #16.
- **Last completed step:** Full-src interactive nesting remediation + AST guard; baseline/focused focus-visible smoke; smoke evidence moved to CI artifacts; plan/registry updated.
- **Exact next action:** Owner re-reviews draft PR #16 after quality + browser-smoke CI on the new implementation SHA; agent must not merge/approve.
- **Blockers:** Owner review required for merge and for unblocking PLAN-0011 / definitive PLAN-0005 frontend pin. Manual real zoom 200% and full AT audit remain pending.
- **Validation performed:** typecheck, lint, format, test (92), `guard:interactive-nesting`, audit:policy; CI after push.
- **Working tree state:** Residual remediations on PLAN-0015 branch; PR remains draft.
- **Substantial run target:** Achieved for owner re-review after residual nesting/focus/evidence fixes.

## Progress log

### 2026-08-01T05:20:00Z — Cursor agent

- **Checkpoint:** Residual nesting, focus-false-positive, and smoke evidence honesty; PLAN-0015 remains Validating.
- **Prior reviewed head:** `11f00bd…` with push `30680034509` and PR `30680035933`.
- **Changes:** AST `yarn guard:interactive-nesting` over all `src/**/*.{tsx,jsx}` (no deliberate exceptions); convert remaining Link/Button nests (AppShell, Today, Pantry, Recipes sibling fav, RecipeDetail, ItemDetail); focus helper compares baseline vs focused styles; smoke report is CI artifact-only; opens scenario Sheet under reduced-motion when present.
- **Validation:** Local gates + 92 Jest tests; CI recorded in PR body after push.
- **Result:** Draft PR updated for owner re-review; not Completed; not merged.
- **Next action:** Owner review; do not merge/approve by agent.

### 2026-08-01T04:45:00Z — Cursor agent

- **Checkpoint:** Review-fix round for last independent-review issues; PLAN-0015 remains Validating.
- **Changes:** Yarn Classic audit exit bitmask vs `auditSummary`; `asChild` CTAs on Landing/ProductionApp; smoke focus-visible + reduced-motion fail-closed helpers/tests; production mobile locale select; SHA field terminology corrected (no hardcoded “Final branch head SHA”).
- **Prior CI record kept:** workflow `30679221482` green on `720b263f493ffa15613e132c21394662d6734a49` until this round’s new head is CI-validated.
- **Validation:** Local typecheck/lint/format/test (78)/audit:policy; browser-smoke + quality CI after push.
- **Result:** Draft PR updated for owner re-review; not Completed; not merged.
- **Next action:** Owner review; do not merge/approve by agent.

### 2026-08-01T01:30:57Z — Cursor agent

- **Checkpoint:** Residual independent-review issues closed; PLAN-0015 remains Validating.
- **Changes:** Semantic audit-policy fail-closed + terminal fixtures; Playwright versioned smoke + CI job; resolution triage table; ProductionI18nProvider (pt-BR/en/es); docs classification automated vs manual.
- **Validation:** Local gates + automated browser smoke all Passed; manual browser zoom Not executed.
- **Result:** Draft PR ready for new owner review; not Completed; not merged.
- **Next action:** Owner review of final head + CI jobs; do not merge/approve by agent.

### 2026-08-01T00:56:47Z — Cursor agent

- **Checkpoint:** Independent-review blocker remediations landed; PLAN-0015 remains Validating.
- **Changes included:** production-default `yarn build`; PrototypeApp/ProductionApp + webpack stubs; bundle inspect; prior audit/tests/smoke.
- **Result:** Draft PR candidate; residual round followed.
- **Next action:** Owner review (continued with residual fixes).

### 2026-07-31T23:15:00Z — Cursor agent

- **Checkpoint:** Initial remediations landed; PLAN-0015 moved to Validating.
- **Next action:** Superseded by later rounds.

### 2026-07-31T22:47:18Z — Cursor agent

- **Checkpoint:** PLAN-0015 claimed; branch opened from main after PR #14/#15.
- **Next action:** Implement explicit prototype/production runtimes.

## Completion and handoff checklist

- [x] Acceptance criteria truthful for delivered work.
- [x] Draft PR linked; not merged/approved by agent.
- [x] PLAN-0015 status `Validating` at handoff (not `Completed`).
- [x] Implementation SHA vs Last CI-validated code SHA terminology documented (PR head via GitHub metadata; avoid infinite SHA-only commits).
- [x] Quality + browser-smoke CI, vulns, smoke, limitations listed for owner.
- [x] Exact continuation recorded for unfinished items (owner review + manual zoom checklist).
