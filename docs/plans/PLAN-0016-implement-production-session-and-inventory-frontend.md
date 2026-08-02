# PLAN-0016: Implement Production Session and Authenticated Inventory Frontend

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** agent:composer-plan-0016
- **Created:** 2026-08-01
- **Last updated:** 2026-08-02T00:15:00Z
- **Branch:** `agent/plan-0016-production-inventory-frontend`
- **Pull request:** Not opened
- **Related issues:** #20 (High), #21 (Medium), #22 (Medium), #24 (coverage)
- **Related plans:** PLAN-0002, PLAN-0003, PLAN-0005 (Conditional Pass), PLAN-0011 (Blocked), PLAN-0015 (Completed)
- **Related ADRs:** ADR-0002 through ADR-0007
- **Dependencies:** PLAN-0005 merged Conditional Pass on main (`60d98dd9e2e7c460d670e701c027a44f25cdfedc`); committed OpenAPI `packages/contracts/openapi/kitchenflow-v1.json`

## Objective

Close the production frontend integration gap discovered by PLAN-0005 so the first authenticated inventory vertical slice is genuinely usable through the production frontend:

```text
production frontend
→ backend-managed login
→ authenticated session projection
→ generated TypeScript API client
→ real inventory list/detail/create/update/adjust/delete/history
→ concurrency and idempotency behavior
→ localized and accessible production UI
→ targeted PLAN-0005 remediation evidence
```

## Context

PLAN-0005 concluded **Conditional Pass** after PR #19 merged at `60d98dd9e2e7c460d670e701c027a44f25cdfedc`. Residual findings:

| Issue | Severity | Gap |
|---|---|---|
| #20 | High | Production inventory journey blocked (`FeatureUnavailable` / `createUnavailableSessionAdapter`) |
| #21 | Medium | Firefox ~200% native zoom Cook CTA pointer failure |
| #22 | Medium | Firefox ~200% native zoom pantry-item pointer failure |
| #24 | Coverage | Generated TypeScript OpenAPI client missing |

PLAN-0015 is Completed; its manual visual/NVDA/VoiceOver checks were deferred as non-blocking. PLAN-0011 remains Blocked until this plan lands and an **independent** PLAN-0005 retest accepts the remediations. This plan does **not** implement PLAN-0011 contextual-home features and does **not** rewrite PLAN-0005 from Conditional Pass to Pass.

## Scope

### Included

- Reproducible OpenAPI TypeScript client from `packages/contracts/openapi/kitchenflow-v1.json`.
- Live BFF session adapter (`POST /api/v1/auth/login`, `GET /api/v1/session`, `POST /api/v1/auth/logout`).
- Live inventory adapter for the full authenticated inventory vertical slice.
- Production inventory routes and screens replacing `FeatureUnavailable` for that journey.
- Locale-aware decimal parsing (`en`, `pt-BR`, `es`).
- Printed package dates as timezone-independent calendar dates.
- Root-cause fixes for Firefox native-zoom pointer defects (#21, #22).
- Remediation evidence and independent-retest handoff for PLAN-0005 cases.

### Excluded

- PLAN-0011 contextual home / recommendation source tiers.
- Menu planning, recipe generation, shopping, cook-mode authority.
- Repository or product rename.
- Claiming PLAN-0005 Pass without independent retest.
- Manual NVDA/VoiceOver/visual claims unless a human performs them.

## Requirements and constraints

- Preserve production vs prototype composition roots; no mock fallback in production.
- Never place OIDC access or refresh tokens in JavaScript storage.
- CSRF, UUID idempotency keys, opaque ETags, `If-Match`, 412, and 428 remain mandatory.
- Backend remains authoritative for inventory arithmetic and lifecycle transitions.
- Generated code must not be manually edited.
- All user-visible production inventory text uses localization resources (`en`, `pt-BR`, `es`).
- Do not silently rewrite PLAN-0005 outcome.

## Generated TypeScript client policy

| Item | Decision |
|---|---|
| Generator | `openapi-typescript` **7.9.1** (pinned) |
| Runtime helper | `openapi-fetch` **0.14.0** (pinned) — typed fetch wrapper over generated paths |
| Source contract | `packages/contracts/openapi/kitchenflow-v1.json` |
| Generated location | `packages/api-client/src/generated/schema.ts` (committed) |
| Application-owned code | `packages/api-client/src/` (non-generated) + frontend adapters |
| Regeneration | `yarn generate` in `packages/api-client` (also `apps/frontend` script proxy) |
| Drift check | `yarn check:drift` — fails if regenerated output differs |
| Typecheck | `yarn typecheck` in `packages/api-client` |
| Nullable / enums / dates | Follow OpenAPI 3.1 null unions; enums as string unions; calendar dates as `YYYY-MM-DD` strings (no `Date` timezone coercion in adapters) |
| Problem details | Mapped by application adapters from `application/problem+json` |
| Response headers | ETag / Idempotency replay accessed via `Response.headers` on the fetch wrapper |
| Isolation | UI uses presentation models from `apps/frontend/src/adapters/live/` — never binds components directly to generated DTO shapes |
| Ownership | Contracts package owns OpenAPI source; `packages/api-client` owns generation; frontend owns presentation adapters |

## Substantial run delivery target

- **Target outcome:** Production inventory vertical slice usable end-to-end against the real BFF, with generated client drift protection, #21/#22 fixes, and independent-retest handoff.
- **Minimum acceptable evidence:** implementation, unit/integration-style frontend tests, frontend quality gates, remediation evidence docs, draft PR.
- **Adjacent checkpoints:** session → inventory adapter → production UI → locale/zoom → retest handoff → draft PR.
- **Valid early-stop conditions:** environment/tool failure, missing Keycloak/OIDC for full browser login, or required owner decision.

## Documentation deliverables

### Durable documentation

- This plan and `docs/plan-status.md`.
- Frontend README (production session/inventory run instructions).
- Contracts README (generated-client policy).
- `packages/api-client/README.md`.
- Authentication/session production behavior notes in frontend docs.
- Independent retest handoff under `docs/plans/` or `docs/evidence/plan-0016/`.
- PLAN-0011 dependency correction.

### Code-level documentation

- TSDoc on exported session/inventory adapters, locale decimal helpers, and presentation mappers.
- Generator boundary documented; generated members not manually documented.
- Inline comments for CSRF, ETag, idempotency, and logout redirect semantics.

## Execution phases

### Phase 0: Repository truth reconciliation

- [x] Record PLAN-0005 PR #19 merged / Conditional Pass / residual issues.
- [x] Correct PLAN-0011 blockers (PLAN-0015 complete; blocked on PLAN-0016 + independent retest).
- [x] Create and register PLAN-0016.

### Phase 1: Generated client

- [ ] Pin generator; commit generated schema; add generate/drift/typecheck scripts; wire CI.

### Phase 2: Live session adapter

- [ ] Replace `createUnavailableSessionAdapter()` in production runtime.
- [ ] Login form POST, session projection, CSRF-protected logout without browser token storage.

### Phase 3: Live inventory adapter + production UI

- [ ] Full inventory slice over generated client.
- [ ] Production routes: list/detail/create/edit/adjust/delete/history with conflict UX.

### Phase 4: Locale, dates, Firefox zoom

- [ ] Locale decimal parsing tests for `en` / `pt-BR` / `es`.
- [ ] Printed dates as calendar dates.
- [ ] Root-cause fix for #21/#22 (no keyboard-only acceptance).

### Phase 5: Validation, remediation evidence, draft PR

- [ ] Frontend quality gates green.
- [ ] Integrated validation evidence or honest limitations.
- [ ] Independent retest handoff; draft PR; PLAN-0005 remains Conditional Pass.

## Testing and validation plan

- Generated-client generation, drift, TypeScript compile, representative calls, problem-details, ETag headers.
- Session states: signed-out, authenticated, unavailable, expired, login return URL, logout CSRF, no token storage.
- Inventory: CRUD/adjust/history, locales, dates, 412/428, idempotency, cancellation.
- Frontend gates listed in acceptance criteria.
- Integrated browser validation with backend + PostgreSQL + Keycloak when environment allows.
- Manual NVDA/VoiceOver/visual: deferred unless human-executed.

## Cross-cutting impact

### Security and privacy

Backend-managed cookies only; CSRF on mutations; no secrets in browser; telemetry must not include product names, notes, CSRF, or cookies.

### Food safety

Printed dates are user-entered evidence only; UI must not claim safety guarantees.

### AI behavior and cost

Not applicable — no model operations in this slice.

### Localization and accessibility

Production inventory UI localized in `en`, `pt-BR`, `es`; accessible validation/error announcements; pointer and keyboard checked independently for zoom defects.

### Operations and observability

Document API base path (same-origin `/api/v1`), regeneration commands, and retest handoff.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Logout SignOut redirect breaks fetch-based SPA logout | Medium | High | Prefer `redirect: "manual"` + hard navigation; adjust backend only if demonstrably required |
| Firefox zoom defect is environmental | Medium | Medium | Fix sticky/transform hit-testing; re-run headed Firefox native zoom |
| Independent retest not run in this branch | High | Medium | Leave exact handoff; keep PLAN-0005 Conditional Pass |

## Acceptance criteria

- [ ] Production no longer uses `createUnavailableSessionAdapter()`.
- [ ] Production inventory journey no longer renders `FeatureUnavailable`.
- [ ] Generated TypeScript client is reproducible and protected by drift checks.
- [ ] Production login/session work through the BFF; no OIDC tokens browser-visible.
- [ ] Inventory list/detail/create/update/adjust/delete/history against real backend protocol.
- [ ] CSRF, idempotency, ETag preserved; stale changes never silently overwritten/retried.
- [ ] Locale decimals correct in `en`, `pt-BR`, `es`; printed dates timezone-independent.
- [ ] Prototype fixtures/mock auth absent from production bundle.
- [ ] Firefox native-zoom pointer and keyboard checks pass independently for #21/#22.
- [ ] Frontend quality gates pass; backend/contract gates if contracts change.
- [ ] Issues #20/#24 have concrete remediation; #21/#22 have root-cause fixes + evidence.
- [ ] PLAN-0005 remains Conditional Pass pending independent retest.
- [ ] PLAN-0011 remains Blocked with corrected dependencies.
- [ ] Exact independent-retest handoff exists.
- [ ] Draft PR describes scope, validation, risks, limitations, owner-only merge authority.

## Independent retest handoff

See `docs/evidence/plan-0016/independent-retest-handoff.md` (created when remediation candidate is ready).

Minimum retest coverage:

- Production inventory journey (#20).
- Generated-client coverage (#24).
- Localized decimal, printed-date, stale-conflict cases.
- Firefox native-zoom pointer checks (#21, #22).
- Production isolation / no mock fallback.
- Authentication, CSRF, two-user isolation smoke.

## Execution state

- **Current run delivery target:** Full production session + inventory vertical slice with generated client, #21/#22 fixes, and draft PR.
- **Current checkpoint:** Phase 0 documentation reconciliation and PLAN-0016 registration on branch.
- **Last completed step:** Branch created from main `60d98dd`; PLAN-0016 authored.
- **Exact next action:** Commit Phase 0 docs; implement generated client and live adapters.
- **Blockers:** None for Phase 0–3 code; full OIDC browser login may require local compose.
- **Partially modified areas:** Plan docs and registry (this commit).
- **Documentation delivered:** PLAN-0016; PLAN-0005/0011/registry reconciliation in same commit.
- **Validation performed:** Confirmed PR #19 merged at `60d98dd9e2e7c460d670e701c027a44f25cdfedc`; PLAN-0016 ID free.
- **Known failures or limitations:** Implementation not yet landed.
- **Working tree state:** Uncommitted Phase 0 documentation updates.

## Progress log

### 2026-08-02T00:15:00Z — agent:composer-plan-0016

- **Run delivery target:** Production session/inventory vertical slice.
- **Checkpoint:** Phase 0 — repository truth reconciled; PLAN-0016 registered In Progress.
- **Changes included in the commit:** PLAN-0016 created; PLAN-0005 delivery state corrected to merged Conditional Pass; PLAN-0011 blockers corrected; `docs/plan-status.md` updated.
- **Documentation and code-documentation delivered:** Plan protocol docs only.
- **Validation performed:** `gh pr view 19` confirms MERGED at `60d98dd…`; branch `agent/plan-0016-production-inventory-frontend` from that head.
- **Result:** Documentation truth restored; implementation begins next.
- **Next action:** Generate OpenAPI TypeScript client; implement live session and inventory adapters and production UI.
- **Blockers or handoff notes:** Do not start PLAN-0011; do not rewrite PLAN-0005 to Pass.

## Completion and handoff checklist

- [ ] All plan phases and acceptance criteria are resolved truthfully.
- [ ] Independent retest handoff is executable.
- [ ] Draft PR opened; agent will not merge/approve/auto-merge.
- [ ] `docs/plan-status.md` matches this plan.
