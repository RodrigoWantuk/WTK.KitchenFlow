# PLAN-0016: Implement Production Session and Authenticated Inventory Frontend

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** agent:composer-plan-0016
- **Created:** 2026-08-01
- **Last updated:** 2026-08-02T01:55:00Z
- **Branch:** `agent/plan-0016-production-inventory-frontend`
- **Pull request:** [Draft PR #25](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/25)
- **Related issues:** #20 (High), #21 (Medium), #22 (Medium), #24 (coverage)
- **Related plans:** PLAN-0002, PLAN-0003, PLAN-0005 (Conditional Pass), PLAN-0011 (Blocked), PLAN-0015 (Completed)
- **Related ADRs:** ADR-0002 through ADR-0007
- **Dependencies:** PLAN-0005 merged Conditional Pass on main (`60d98dd9e2e7c460d670e701c027a44f25cdfedc`); committed OpenAPI `packages/contracts/openapi/kitchenflow-v1.json`
- **Plan ID collision handoff:** Draft PR #23 also uses the string “PLAN-0016” for an unrelated AI recipe-protocol documentation plan. For this critical-path inventory work, PLAN-0016 remains assigned to PR #25. PR #23 must later be renumbered to PLAN-0017 on a separate branch/run. Do not merge, cherry-pick, or modify PR #23 from this branch; do not introduce PLAN-0017 files here.

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

- [x] Pin generator; commit generated schema; add generate/drift/typecheck scripts; wire CI.
- [x] Exclude generated CRA mirror from Prettier app scope (`.prettierignore`); format-check application-owned `packages/api-client/src` (generated schema excluded); double-generate leaves no additional tracked diff; drift checks unchanged.

### Phase 2: Live session adapter

- [x] Replace `createUnavailableSessionAdapter()` in production runtime.
- [x] Login form POST, session projection, CSRF-protected logout without browser token storage.
- [x] Strengthen session tests; do **not** claim unsupported `authentication_expired` (401 → signed-out).

### Phase 3: Live inventory adapter + production UI

- [x] Live inventory repository over generated client.
- [x] Production routes mount inventory screens (not FeatureUnavailable for `/app/despensa*`).
- [x] Mutation UI: Consume, Discard, Correct, qualitative availability, metadata edit, soft delete, history (ETag + per-command idempotency; no silent retry on 412/428).
- [x] Custom location when `Other`; list search/status/location filters with draft-vs-submitted query + AbortController; fail-closed quantity mapping.

### Phase 4: Locale, dates, Firefox zoom

- [x] Locale decimal parsing unit tests for `en` / `pt-BR` / `es`.
- [x] Printed dates as calendar dates (helpers present).
- [x] Localize inventory/history enums and timestamps; resource-completeness tests for new keys.
- [ ] #21/#22 CSS remediation remains a hypothesis until independent Firefox native-zoom retest.

### Phase 5: Validation, remediation evidence, draft PR

- [ ] Frontend CI fully green on exact PR head (prior run `30725997092` failed at `format:check`; remediation tip pending push/CI).
- [x] Component/journey tests for list/form/detail + production route proof (126 Jest tests locally).
- [x] Independent retest handoff kept truthful; PLAN-0005 Conditional Pass; PLAN-0011 Blocked.

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

- [x] Production no longer uses `createUnavailableSessionAdapter()` (wired via `createProductionRuntime` + isolation test).
- [x] Production inventory journey no longer renders `FeatureUnavailable` for `/app/despensa*` (route test).
- [x] Generated TypeScript client is reproducible and protected by drift checks (local `generate` ×2 + `check:drift`).
- [ ] Production login/session work through the BFF against integrated Keycloak topology; no OIDC tokens browser-visible (unit coverage present; integrated E2E pending independent retest).
- [ ] Inventory list/detail/create/update/adjust/delete/history against live backend + PostgreSQL (UI + adapter tests present; integrated E2E pending).
- [x] CSRF, idempotency, ETag preserved in client/UI; stale 412/428 never silently retried (component tests).
- [x] Locale decimals correct in `en`, `pt-BR`, `es`; printed dates timezone-independent (unit + form tests).
- [x] Prototype fixtures/mock auth absent from production bundle (`inspect:production-bundle` local pass).
- [ ] Firefox native-zoom pointer and keyboard checks pass independently for #21/#22.
- [ ] Frontend quality gates pass on the exact PR head in GitHub Actions (local suite green; CI pending).
- [x] Issues #20/#24 have concrete remediation implementation; #21/#22 have CSS remediation **hypothesis** only (not proven).
- [x] PLAN-0005 remains Conditional Pass pending independent retest.
- [x] PLAN-0011 remains Blocked with corrected dependencies.
- [x] Exact independent-retest handoff exists (`docs/evidence/plan-0016/independent-retest-handoff.md`).
- [ ] Draft PR body describes current evidence without overclaims (update after CI tip lands).

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

- **Current run delivery target:** Remediate PR #25 until Frontend CI is fully green; then mark **Validating** for independent PLAN-0005 retest.
- **Current checkpoint:** Functional remediations implemented; local Frontend gates green; status remains **In Progress** until GitHub Frontend workflow is fully green on the pushed tip.
- **Last completed step:** Format policy, full mutation/list/custom-location UI, fail-closed mapping, i18n catalog, component/session/route tests, local gate suite.
- **Exact next action:** Commit + push remediation tip; await full green Frontend workflow; then set status **Validating** and refresh PR body.
- **Blockers:** Integrated Keycloak/PostgreSQL stack not running in this agent environment (`docker compose` has no active project). Independent Firefox native-zoom still required.
- **Partially modified areas:** None for coded remediations listed in the user brief. Remaining: CI tip proof; integrated E2E; #21/#22 Firefox native zoom.
- **Documentation delivered:** Plan/registry truthful; evidence handoff + remediation notes updated for format policy and UX completeness.
- **Validation performed (local, 2026-08-02):**
  - Prior CI [30725997092](https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30725997092) **failed** at `format:check` on generated mirror files; later steps skipped.
  - `packages/api-client`: `yarn install --frozen-lockfile`, `yarn generate`, `yarn check:drift`, `yarn typecheck`, `yarn format:check`, second `yarn generate` → no additional tracked diff.
  - `apps/frontend`: `check:api-client-drift`, `typecheck:api-client`, `typecheck`, `lint`, `format:check`, `format:check:api-client`, `test` (126 passed), guards, `build`, `inspect:production-bundle`, `build:prototype`, `build:production`, `inspect:production-bundle`, `audit:policy`, `smoke:browser:ci` — all exit 0.
- **Known failures or limitations:** Frontend CI not yet re-proven on remediation tip; no integrated Keycloak E2E this run; #21/#22 hypothesis only; PLAN-0005 Conditional Pass; PLAN-0011 Blocked; PR #23 collision deferred to later PLAN-0017 renumber (untouched).
- **Working tree state:** Dirty until remediation commit; then push pending CI.

## Progress log

### 2026-08-02T01:55:00Z — agent:composer-plan-0016

- **Checkpoint:** Remediation implementation + local full Frontend gate suite green; status still **In Progress** (CI tip pending).
- **Changes included in the commit:** `.prettierignore` mirror exclusion; api-client owned-source format check; fail-closed `mapQuantity`; list draft/submit/filters/AbortController; full adjustment/delete/history UI; `Other` custom location; inventory i18n catalog; component/session/route tests; crypto polyfill for Jest; plan/registry/evidence updates.
- **Result:** Local gates green; not yet independent-retest ready until Frontend CI fully green on tip.
- **Next action:** Push; await Frontend workflow; move to Validating only after green CI; update PR body.
- **Blockers or handoff notes:** PR #23 must later become PLAN-0017 elsewhere; leave untouched. Do not start PLAN-0011.

### 2026-08-02T01:50:00Z — agent:composer-plan-0016

- **Checkpoint:** Corrected overclaims; status **In Progress**; recorded CI failure `30725997092`.
- **Changes included in the commit:** Plan/registry truth (superseded by remediation commit if combined).
- **Result:** Candidate was not ready; remediation continued in the same run.
- **Next action:** Finish remediations; prove double-generate clean; push; await full green Frontend workflow.
- **Blockers or handoff notes:** PR #23 must later become PLAN-0017 elsewhere; leave untouched.

### 2026-08-02T01:20:00Z — agent:composer-plan-0016

- **Checkpoint:** Draft PR #25 opened; delivery metadata synced.
- **Changes included in the commit:** Plan/registry PR link only.
- **Result:** Superseded — prior Validating claim was premature (CI `format:check` failed).
- **Next action:** Remediate; do not start independent retest yet.

### 2026-08-02T01:10:00Z — agent:composer-plan-0016

- **Run delivery target:** Production session/inventory vertical slice.
- **Checkpoint:** Phases 1–5 implementation candidate — generated client, BFF session, live inventory UI, locale/date helpers, zoom hit-test fix, gates green, retest handoff.
- **Changes included in the commit:** `packages/api-client`, frontend live adapters/UI, production runtime, CI drift checks, evidence handoff, docs.
- **Documentation and code-documentation delivered:** READMEs, PLAN-0016 state, `docs/evidence/plan-0016/`.
- **Validation performed:** Frontend quality gates listed above; production build isolation inspect passed; zoom harness Chromium Passed / Firefox Unsupported in agent env.
- **Result:** Candidate ready for draft PR; PLAN-0005 remains Conditional Pass; PLAN-0011 remains Blocked.
- **Next action:** Draft PR; independent retest.
- **Blockers or handoff notes:** See `docs/evidence/plan-0016/independent-retest-handoff.md`.

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
