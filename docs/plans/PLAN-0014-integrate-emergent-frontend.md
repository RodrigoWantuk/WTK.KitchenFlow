# PLAN-0014: Integrate Emergent Frontend and Establish Production Frontend Baseline

- **Status:** Validating
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Cursor agent (PLAN-0014)
- **Created:** 2026-07-31
- **Last updated:** 2026-07-31T22:01:34Z
- **Branch:** `agent/plan-0014-integrate-emergent-frontend`
- **Pull request:** [Draft PR #14](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/14)
- **Related implementation plans:** PLAN-0004 (superseded), PLAN-0005, PLAN-0011
- **Related documentation plan:** PLAN-0013
- **Related issues:** None
- **Related ADRs:** ADR-0001 (superseded by ADR-0007), ADR-0007
- **Dependencies:** Emergent snapshot `69f798f66b7987c4ed785c52c90a5539bf46f52e` available locally

## Objective

Import the final Emergent frontend snapshot into `apps/frontend` as the sole official KitchenFlow frontend source, complete three partially implemented product flows (shared preparation-route state, reserved prepared-component presentation, route-to-cooking handoff), add reservation-aware shopping projections, remove Emergent platform coupling, establish TypeScript and adapter boundaries for gradual backend integration, and activate frontend quality gates and CI.

## Context

PLAN-0004 assumed Lovable generation into a dedicated repository followed by monorepo integration. The authoritative product prototype was instead completed in `RodrigoWantuk/kitchen-emergent` and must be imported once. After this plan:

- `WTK.KitchenFlow/apps/frontend` is the only official frontend source;
- `kitchen-emergent` is a historical snapshot that may be archived;
- no bidirectional sync with Emergent is planned;
- Lovable and Emergent remain optional generation tools only.

Authoritative inventory arithmetic, reservations, unit conversion, and food-safety rules remain backend responsibilities. The frontend may only render projections and hold temporary UI state.

## Scope

### Included

- Faithful import of `frontend/` from Emergent commit `69f798f66b7987c4ed785c52c90a5539bf46f52e`.
- Shared preparation-route application state used by Home, Plan, full route, and cook handoff.
- Reserved prepared-component presentation model and UI.
- Route-complete → Cook CTA hierarchy and handoff payload.
- Reservation-aware shopping requirement projections (fixture-backed).
- Removal of Emergent platform coupling.
- Mock/live adapter isolation and TypeScript boundaries for models, adapters, and projections.
- Frontend CI: install, lockfile, build, lint, format, typecheck, unit/component/route tests, dependency audit, scenario-resource production guard.
- Asset license audit for public repository exposure.
- Supersession of PLAN-0004; reconciliation of PLAN-0005 and PLAN-0011; ADR-0007.
- Draft PR against `main` (no merge).

### Excluded

- Backend behavior changes.
- FastAPI/MongoDB import.
- Authoritative inventory, reservation, allocation, or unit-conversion logic in React.
- Food-safety enforcement.
- Direct AI provider calls.
- Token storage or direct Keycloak client.
- General visual redesign.
- Profile live adapters against unmerged backend PRs.
- PLAN-0005 independent test execution as this plan's author.

## Requirements and constraints

- Import only Emergent `frontend/`; exclude `backend/`, `.emergent/`, `memory/`, `test_reports/`, `.env`, MongoDB, FastAPI, installed dependencies, and logs.
- Final layout must be `apps/frontend/{package.json,src,public}` without nested `apps/frontend/frontend/`.
- First import commit must be faithful and not mixed with large refactors.
- React and TypeScript are architectural decisions; Emergent and Lovable are optional tooling.
- Do not duplicate OpenAPI DTOs by hand.
- Do not integrate profile contracts from unapproved PRs.
- Preserve accepted mock prototype flows while isolating them from production paths.
- Update PLAN-0014 and `docs/plan-status.md` in every agent commit.

## Substantial run delivery target

- **Target outcome:** Complete PLAN-0014 through draft PR: import, three feature completions, shopping projections, Emergent decoupling, adapter/TS baseline, tests, CI, documentation, and draft PR.
- **Minimum acceptable evidence:** green local build/lint/typecheck/tests for the completed baseline; provenance docs; ADR and plan registry updates; draft PR URL.
- **Adjacent checkpoints to continue through when unblocked:** all phases below.
- **Valid early-stop conditions:** environment/tool failure, conflicting concurrent work, exhausted capacity, or required stakeholder decision.

## Documentation deliverables

### Durable documentation

- PLAN-0014 execution plan and registry updates.
- PLAN-0004 superseded; PLAN-0005 dependency on PLAN-0014 baseline; PLAN-0011 remains blocked until baseline merges.
- ADR-0007 superseding ADR-0001.
- Frontend README: official source, provenance, development, mock/live, CI.
- Import provenance record (repository, branch, commit, date, method, included/excluded paths).
- Asset audit notes.

### Code-level documentation

- TSDoc for exported TypeScript contracts, adapters, and shared hooks.
- Inline comments only for non-obvious invariants (shared route state, projection boundaries, cook handoff hierarchy).

## Assumptions and open questions

### Assumptions

- Local Emergent clone can be checked out to the pinned commit.
- CRA + CRACO runtime from the snapshot remains acceptable under ADR-0007 until a later ADR changes it.
- Yarn classic matches the Emergent `packageManager` field.

### Open questions

- None blocking import. Exact live OpenAPI client generation remains a later plan after inventory/home contracts stabilize.

## Architecture and contract impact

- `apps/frontend` becomes the official frontend package.
- Presentation components consume application models and projections, never authoritative arithmetic.
- Mock adapters produce fixtures; live adapters will later consume generated OpenAPI clients.
- ADR-0007 records React/TypeScript, monorepo authority, and optional generation tooling.

## Execution phases

### Phase 0: Governance

- [x] Create PLAN-0014 and register it.
- [x] Mark PLAN-0004 Superseded by PLAN-0014.
- [x] Update PLAN-0005 to depend on PLAN-0014 baseline.
- [x] Keep PLAN-0011 blocked pending baseline integration.
- [x] Add ADR-0007 and supersede ADR-0001.

### Phase 1: Faithful import

- [x] Copy Emergent `frontend/` into `apps/frontend/`.
- [x] Record provenance.
- [x] Commit without feature refactors.

### Phase 2: Shared preparation route state

- [x] Single store/adapter boundary for route task completion.
- [x] Home carousel and full route share state; unlock next dependency; start-now has consequence.

### Phase 3: Reserved component presentation

- [x] `PreparedComponentAvailability` projection; presentational bar; review-shortfall action.

### Phase 4: Route-to-cooking handoff

- [x] Ready state, correct recipe id, CTA hierarchy, “Later” preserves completion, cook payload.

### Phase 5: Reservation-aware shopping

- [x] `ShoppingRequirementProjection` fixtures and UI; send only shortfall.

### Phase 6: Stabilization

- [x] Remove Emergent coupling; isolate mock/live; TypeScript boundaries; session/API seams.

### Phase 7: Quality gates and handoff

- [x] Mandatory tests; CI workflow; asset audit; finalize docs; open draft PR.

## Testing and validation plan

- Unit/component tests for route carousel, reserved bar, cook handoff, shopping projections.
- Build, lint, format, typecheck.
- Mock/production isolation guard.
- Dependency audit.
- Responsive/a11y smoke checklist (360/768/1280, 200% zoom, keyboard, touch, reduced motion, pt-BR/en/es).

## Acceptance criteria

- [x] Snapshot `69f798f66b7987c4ed785c52c90a5539bf46f52e` imported.
- [x] `apps/frontend` is the official source.
- [x] PLAN-0004 Superseded; ADR updated; PLAN-0005 and PLAN-0011 reconciled.
- [x] Home and full route share preparation state.
- [x] Next actionable task highlighted; blocked tasks not highlighted.
- [x] Completing last required dependency offers Cook.
- [x] Reserved/free/shortfall bar complete from projections.
- [x] Shopping review represents availability and reservations; only shortfall is sent.
- [x] No authoritative reservation/inventory arithmetic in presentation components.
- [x] Mock and production isolated; Emergent deps removed.
- [x] Build, lint, typecheck, and tests green.
- [x] Assets audited; CI active; docs complete.
- [x] Draft PR open against `main`; no unrelated changes; no merge.

## Execution state

- **Current checkpoint:** PLAN-0014 implementation complete on branch; draft PR #14 open against `main` (not merged).
- **Last completed step:** Draft PR opened after features, Emergent removal, TS/CI/docs commits.
- **Exact next action:** Owner review of draft PR #14; merge only after CI green and review approval.
- **Blockers:** None.
- **Partially modified areas:** Gradual JS→TS migration remains optional follow-up.
- **Validation performed:** Local yarn typecheck/lint/test/build; draft PR URL recorded.
- **Known failures or limitations:** ESLint scopes to JS/JSX; live adapters are placeholders; mock imagery needs later license replacement.
- **Working tree state:** Clean after handoff commit recording PR #14.
- **Substantial run target:** Achieved — draft PR opened.

## Progress log

### 2026-07-31T22:05:00Z — Cursor agent

- **Checkpoint:** Draft PR #14 opened for PLAN-0014 against `main` (no merge).
- **Changes included in the commit:** Plan/registry delivery state with PR link.
- **Validation performed:** `gh pr create --draft` succeeded.
- **Result:** Handoff ready for owner review.
- **Next action:** Wait for CI + owner review; do not merge from this agent run.
- **Blockers or handoff notes:** None.

### 2026-07-31T22:02:30Z — Cursor agent

- **Checkpoint:** Stabilization and quality gates committed: Emergent removed, TypeScript/yarn.lock, tests isolation guard, frontend CI, asset audit, README.
- **Changes included in the commit:** package/craco cleanup; eslint/tsconfig; yarn.lock; workflow; docs.
- **Validation performed:** Prior local `yarn typecheck|lint|test|build` retained as evidence for this commit set.
- **Result:** Baseline ready for draft PR.
- **Next action:** Push and open draft PR against `main`.
- **Blockers or handoff notes:** None.

### 2026-07-31T22:01:34Z — Cursor agent (resume after tool outage)

- **Checkpoint:** Shared preparation route + reserved presentation + cook handoff + shopping shortfall + Emergent removal + TS/adapters + tests/CI/docs ready for commit and draft PR.
- **Changes included in the commit:** Contracts/adapters/features wiring into App/Today/Plan/Pantry/Shopping/CookFlow; Emergent visual-edits removed; `tsconfig`, `yarn.lock`, frontend CI workflow, asset audit, frontend README.
- **Validation performed:** `yarn typecheck`; `yarn lint`; `yarn test` (10); `yarn build`.
- **Result:** Acceptance criteria satisfied except draft PR URL (opened in following step).
- **Next action:** Push branch and open draft PR; then mark PLAN-0014 Validating/Completed for execution with Delivery=PR open.
- **Blockers or handoff notes:** Earlier agents failed only on Cursor tool availability; work resumed from uncommitted Phase 2 stubs.

### 2026-07-31T20:17:24Z — Cursor agent

- **Checkpoint:** Faithful import of Emergent `frontend/` into `apps/frontend/`.
- **Changes included in the commit:** Full filtered copy of snapshot sources; `docs/development/emergent-frontend-import-provenance.md`; plan/registry updates.
- **Validation performed:** `git rev-parse` equals `69f798f66b7987c4ed785c52c90a5539bf46f52e`; layout checks passed.
- **Result:** Official tree populated; no feature refactors in this commit.
- **Next action:** Shared preparation route state (Home + full route).
- **Blockers or handoff notes:** Do not treat Emergent as a sync remote.

### 2026-07-31T20:15:00Z — Cursor agent

- **Checkpoint:** PLAN-0014 established; PLAN-0004 superseded; PLAN-0005 and PLAN-0011 reconciled; ADR-0007 proposed superseding ADR-0001.
- **Changes included in the commit:** Plan, registry, superseded/reconciled plans, ADR-0007, ADR index, ADR-0001 status note.
- **Validation performed:** Verified Emergent source commit checkout and `frontend/` layout.
- **Result:** Governance ready for faithful import.
- **Next action:** Import Emergent frontend snapshot into `apps/frontend/`.
- **Blockers or handoff notes:** None.

## Completion and handoff checklist

- [x] All acceptance criteria truthful.
- [x] Provenance documented with exact commit.
- [x] Draft PR linked from plan and registry.
- [x] `docs/plan-status.md` matches this plan.
- [x] No merge performed by this plan.
- [x] Exact continuation recorded for any unfinished work.
