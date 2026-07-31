# PLAN-0014: Integrate Emergent Frontend and Establish Production Frontend Baseline

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Cursor agent (PLAN-0014)
- **Created:** 2026-07-31
- **Last updated:** 2026-07-31T20:15:00Z
- **Branch:** `agent/plan-0014-integrate-emergent-frontend`
- **Pull request:** Not opened
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

- [ ] Copy Emergent `frontend/` into `apps/frontend/`.
- [ ] Record provenance.
- [ ] Commit without feature refactors.

### Phase 2: Shared preparation route state

- [ ] Single store/adapter boundary for route task completion.
- [ ] Home carousel and full route share state; unlock next dependency; start-now has consequence.

### Phase 3: Reserved component presentation

- [ ] `PreparedComponentAvailability` projection; presentational bar; review-shortfall action.

### Phase 4: Route-to-cooking handoff

- [ ] Ready state, correct recipe id, CTA hierarchy, “Later” preserves completion, cook payload.

### Phase 5: Reservation-aware shopping

- [ ] `ShoppingRequirementProjection` fixtures and UI; send only shortfall.

### Phase 6: Stabilization

- [ ] Remove Emergent coupling; isolate mock/live; TypeScript boundaries; session/API seams.

### Phase 7: Quality gates and handoff

- [ ] Mandatory tests; CI workflow; asset audit; finalize docs; open draft PR.

## Testing and validation plan

- Unit/component tests for route carousel, reserved bar, cook handoff, shopping projections.
- Build, lint, format, typecheck.
- Mock/production isolation guard.
- Dependency audit.
- Responsive/a11y smoke checklist (360/768/1280, 200% zoom, keyboard, touch, reduced motion, pt-BR/en/es).

## Acceptance criteria

- [ ] Snapshot `69f798f66b7987c4ed785c52c90a5539bf46f52e` imported.
- [ ] `apps/frontend` is the official source.
- [ ] PLAN-0004 Superseded; ADR updated; PLAN-0005 and PLAN-0011 reconciled.
- [ ] Home and full route share preparation state.
- [ ] Next actionable task highlighted; blocked tasks not highlighted.
- [ ] Completing last required dependency offers Cook.
- [ ] Reserved/free/shortfall bar complete from projections.
- [ ] Shopping review represents availability and reservations; only shortfall is sent.
- [ ] No authoritative reservation/inventory arithmetic in presentation components.
- [ ] Mock and production isolated; Emergent deps removed.
- [ ] Build, lint, typecheck, and tests green.
- [ ] Assets audited; CI active; docs complete.
- [ ] Draft PR open against `main`; no unrelated changes; no merge.

## Execution state

- **Current checkpoint:** PLAN-0014 created; PLAN-0004 superseded; PLAN-0005/0011 reconciled; ADR-0007 drafted; branch `agent/plan-0014-integrate-emergent-frontend` created from `main` at `b5a36b4`.
- **Last completed step:** Governance documentation for Phase 0.
- **Exact next action:** Faithfully import Emergent `frontend/` at commit `69f798f66b7987c4ed785c52c90a5539bf46f52e` into `apps/frontend/` and commit with provenance.
- **Blockers:** None.
- **Partially modified areas:** Documentation only.
- **Validation performed:** Confirmed local Emergent clone at `69f798f66b7987c4ed785c52c90a5539bf46f52e`; `frontend/` present; excluded paths identified.
- **Known failures or limitations:** No lockfile in Emergent snapshot; will be generated after import during stabilization.
- **Working tree state:** Governance docs pending first commit.
- **Substantial run target:** Complete PLAN-0014 through draft PR in this run.

## Progress log

### 2026-07-31T20:15:00Z — Cursor agent

- **Checkpoint:** PLAN-0014 established; PLAN-0004 superseded; PLAN-0005 and PLAN-0011 reconciled; ADR-0007 proposed superseding ADR-0001.
- **Changes included in the commit:** Plan, registry, superseded/reconciled plans, ADR-0007, ADR index, ADR-0001 status note.
- **Validation performed:** Verified Emergent source commit checkout and `frontend/` layout.
- **Result:** Governance ready for faithful import.
- **Next action:** Import Emergent frontend snapshot into `apps/frontend/`.
- **Blockers or handoff notes:** None.

## Completion and handoff checklist

- [ ] All acceptance criteria truthful.
- [ ] Provenance documented with exact commit.
- [ ] Draft PR linked from plan and registry.
- [ ] `docs/plan-status.md` matches this plan.
- [ ] No merge performed by this plan.
- [ ] Exact continuation recorded for any unfinished work.
