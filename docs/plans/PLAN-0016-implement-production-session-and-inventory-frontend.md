# PLAN-0016: Implement Production Session and Authenticated Inventory Frontend

- **Status:** Validating
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** agent:composer-plan-0016
- **Created:** 2026-08-01
- **Last updated:** 2026-08-02T03:00:00Z
- **Branch:** `agent/plan-0016-production-inventory-frontend`
- **Pull request:** [Draft PR #25](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/25)
- **Related issues:** #20 (High), #21 (Medium), #22 (Medium), #24 (coverage), #26 (High)
- **Related plans:** PLAN-0002, PLAN-0003, PLAN-0005 (Conditional Pass), PLAN-0011 (Blocked), PLAN-0015 (Completed)
- **Related ADRs:** ADR-0002 through ADR-0007
- **Dependencies:** PLAN-0005 merged Conditional Pass on main (`60d98dd9e2e7c460d670e701c027a44f25cdfedc`); committed OpenAPI `packages/contracts/openapi/kitchenflow-v1.json`
- **Plan ID collision handoff:** Former Draft PR #23 collision is resolved: AI recipe-protocol work shipped as [PLAN-0017](PLAN-0017-define-ai-recipe-artifact-protocol.md) via [PR #31](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/31) (PR #23 closed as superseded). PLAN-0016 remains exclusively PR #25.

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

- [x] Frontend CI fully green on remediation tip `4d2afd0` (`30727899304` / `30727897692`) and Validating tip `aab6162` (`30728066476` / `30728064641`); prior failure `30725997092` superseded.
- [x] Component/journey tests for list/form/detail + production route proof (126 Jest tests locally + CI).
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
- [x] Frontend quality gates pass on the exact PR head in GitHub Actions (`30728066476` / `30728064641` success on `aab6162`; remediation tip `4d2afd0` also green).
- [x] Issues #20/#24 have concrete remediation implementation; #21/#22 have CSS remediation **hypothesis** only (not proven).
- [x] PLAN-0005 remains Conditional Pass pending independent retest.
- [x] PLAN-0011 remains Blocked with corrected dependencies.
- [x] Exact independent-retest handoff exists (`docs/evidence/plan-0016/independent-retest-handoff.md`).
- [x] Draft PR body describes current evidence without overclaims (refreshed with CI tip).

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

- **Current run delivery target:** Remediate independent PLAN-0018 Fail findings (#21/#22 pointer; #26 isolation) then re-validate.
- **Current checkpoint:** **Validating** — PR tip `2f0d24a` and product tip `68c04fc` have green Backend, Frontend, and PLAN-0005 workflows (implementation CI only).
- **Last independently tested SHA:** `814af253814d0ec7f8b0adbbca9c50040b5bab07` (PLAN-0018 Fail — immutable)
- **Remediation candidate SHA:** `2f0d24adc44bf5f1ba61f8e43402d38aa39e201f` (PR head); product changes through `68c04fc`
- **Last completed step:** #26/#21/#22 remediations + evidence + CI IDs recorded; PR #25 remains Draft.
- **Exact next action:** Independent retest of tip `2f0d24a` (do not reuse implementation evidence as final authority); keep issues open; owner merge only after retest.
- **Blockers:** None for coding. Owner merge blocked until independent retest Pass/Conditional Pass.
- **Known failures or limitations:** PLAN-0018 Fail on `814af25` stands; PLAN-0005 Conditional Pass until independent acceptance; PLAN-0011 Blocked; #21/#22/#26/#20/#24 remain open; PR #23 closed/superseded by PLAN-0017 PR #31.
- **Working tree state:** Remediation candidate pushed; PLAN-0018 Fail evidence immutable.

## Progress log

### 2026-08-02T04:45:00Z — agent:composer-plan-0016

- **Checkpoint:** Status **Validating** on remediation tip `68c04fc`.
- **CI proof:** Backend `30730920972`; PLAN-0005 `30730920959`; Frontend `30730919691` + `30730920952` (audit flake re-run).
- **Issues:** #21/#22/#26 remain open for independent verification; #20/#24 owner-controlled; no merge/approval.
- **Next action:** Independent retest handoff (`docs/evidence/plan-0016/independent-retest-handoff.md`).

### 2026-08-02T04:20:00Z — agent:composer-plan-0016

- **Checkpoint:** CI remediation — gitleaks allowlist for PLAN-0018 Git blob SHA pins; Firefox harness preserves xvfb-run `XAUTHORITY` (CI `cannot open display` was from blanking authority).
- **Prior CI:** Frontend green (`30730671764` / `30730670487`); Backend secret-scan failed on `openapiBlobSha`; PLAN-0005 P0 Firefox launch failed (`Authorization required` / blank XAUTHORITY).
- **Next action:** Push fix; re-await Backend + PLAN-0005 + Frontend green; then Validating.

### 2026-08-02T04:05:00Z — agent:composer-plan-0016

- **Checkpoint:** Local full validation + remediation evidence package (pre-CI).
- **Backend:** `dotnet test apps/backend/KitchenFlow.slnx -c Release` → 204 Passed (46/14/144).
- **Frontend:** full gate list including smoke:browser:ci + validate:firefox-native-zoom → exit 0; matrix all Passed; widthRatio=2.0.
- **API client:** double generate clean.
- **Evidence:** `docs/evidence/plan-0016/remediation-after-plan-0018/`; handoff updated.
- **Status:** still **In Progress** until GHA green on exact tip; then Validating.
- **Next action:** Push; record workflow IDs; Validating.

### 2026-08-02T03:50:00Z — agent:composer-plan-0016

- **Checkpoint:** #21/#22 Firefox native-zoom pointer root cause + fix.
- **#21 root cause:** Firefox full-page zoom elevates `devicePixelRatio` (1→2 at ~200%); Playwright `locator.click` mis-maps CSS centers so the pointer lands off-target (often on nearby chrome). `elementFromPoint(CSS center)` still hits the Cook CTA — product hit-test geometry is sound when the pointer lands correctly.
- **#22 root cause:** Same DPR mapping defect, plus prototype `ScenarioBar` fixed FAB overlapped pantry card hit boxes when zoom induced the mobile breakpoint (`innerWidth < 768`).
- **Product fix:** Move ScenarioBar into the sticky header (no fixed FAB overlay); keep no card hover transforms; strengthen scroll-margin for sticky header + bottom nav.
- **Harness:** Fail-closed `yarn validate:firefox-native-zoom` — elementFromPoint gate + DPR-compensated real mouse click; pointer Fail exits non-zero; also updated `scripts/plan-0005/firefox-zoom-pointer-keyboard.cjs`.
- **Local result matrix:** Cook pointer/keyboard Passed; Pantry pointer/keyboard Passed; `widthRatio=2.0`.
- **Next action:** Full suite + CI; evidence under `docs/evidence/plan-0016/remediation-after-plan-0018/`.

### 2026-08-02T03:35:00Z — agent:composer-plan-0016

- **Checkpoint:** #26 backend isolation — ownership before precondition.
- **Root cause:** `MutateAsync` evaluated `If-Match` present/valid before owner-scoped `LoadActiveAsync`; fabricated `"v1"` yielded 412 before nondisclosing 404.
- **Changes:** `InventoryLotApplicationWorkflow` loads owned active lot first; `FailIfNotOwnedActiveAsync` gates update/adjust/delete before body validation; integration test proves foreign≡nonexistent for adjust/update/delete/history/precondition variants; owner 428/412/OK unchanged.
- **Validation:** `ForeignAndNonexistentLotMutationsAreNondisclosingForPreconditionVariants` Passed; inventory unit tests Passed.
- **Next action:** Firefox #21/#22 pointer diagnosis (no speculative CSS).

### 2026-08-02T03:20:00Z — agent:composer-plan-0016

- **Checkpoint:** Phase 0 — remediation start after PLAN-0018 Fail; branch contains merged PR #27 evidence.
- **Verified:** PR #25 Draft head was `05db662` (merge of #27); `docs/plans/PLAN-0018-*` and `docs/evidence/plan-0018/` present; PLAN-0016 In Progress; PLAN-0005 Conditional Pass; PLAN-0011 Blocked.
- **Blocking findings retained open:** #21 Cook CTA pointer @ Firefox native ~200%; #22 pantry item pointer @ Firefox native ~200%; #26 foreign adjust returns 412 instead of nondisclosing 404.
- **Result:** Repository truth restored for remediation; no claim that issues are closed; PLAN-0018 Fail assessment remains immutable.
- **Next action:** Land #26 ownership-before-precondition fix + tests; then Firefox diagnosis.

### 2026-08-02T03:00:00Z — agent:independent-retest-plan-0018

- **Checkpoint:** Independent PLAN-0018 assessment **Fail**; PLAN-0016 returned to **In Progress**.
- **Evidence:** `docs/evidence/plan-0018/final-assessment.md`
- **Result:** #20/#24 remediations look effective; #21/#22 pointer unresolved; #26 High isolation finding opened.
- **Next action:** Implementation remediation on PLAN-0016 branch; re-run independent retest.
- **Notes:** PR #23 closed/superseded by PLAN-0017 PR #31 on main.

### 2026-08-02T02:00:00Z — agent:composer-plan-0016

- **Checkpoint:** Status **Validating**; Frontend CI green on `4d2afd0`; PR body refreshed.
- **Changes included in the commit:** Plan/registry/PR body sync only after CI proof.
- **Result:** Candidate ready for independent retest. Not owner-merged. #21/#22/#20/#24 not closed by this agent.
- **Next action:** Independent PLAN-0005 retest handoff; owner review/merge authority.
- **Blockers or handoff notes:** PLAN-0017 already on main via PR #31. Do not start PLAN-0011 until this retest completes.

### 2026-08-02T01:55:00Z — agent:composer-plan-0016

- **Checkpoint:** Remediation implementation + local full Frontend gate suite green; status **In Progress** pending CI.
- **Changes included in the commit:** `.prettierignore` mirror exclusion; api-client owned-source format check; fail-closed `mapQuantity`; list draft/submit/filters/AbortController; full adjustment/delete/history UI; `Other` custom location; inventory i18n catalog; component/session/route tests; crypto polyfill for Jest; plan/registry/evidence updates.
- **Result:** Tip `4d2afd0` pushed; Frontend CI subsequently green (`30727899304` / `30727897692`).
- **Next action:** Move to Validating; update PR body.
- **Blockers or handoff notes:** PLAN-0017 already on main via PR #31. Do not start PLAN-0011 until this retest completes.

### 2026-08-02T01:50:00Z — agent:composer-plan-0016

- **Checkpoint:** Corrected overclaims; status **In Progress**; recorded CI failure `30725997092`.
- **Changes included in the commit:** Plan/registry truth (superseded by remediation commit if combined).
- **Result:** Candidate was not ready; remediation continued in the same run.
- **Next action:** Finish remediations; prove double-generate clean; push; await full green Frontend workflow.
- **Blockers or handoff notes:** PLAN-0017 already on main via PR #31.

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
