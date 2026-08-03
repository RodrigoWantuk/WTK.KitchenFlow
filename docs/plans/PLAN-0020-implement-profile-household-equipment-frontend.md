# PLAN-0020: Implement Profile, Household, Preferences, and Equipment Frontend

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** High
- **Owner:** Cursor agent (PLAN-0020 profile frontend)
- **Created:** 2026-08-02
- **Last updated:** 2026-08-03T00:15:00Z
- **Branch:** `agent/plan-0020-profile-frontend`
- **Pull request:** Pending draft open
- **Dependencies:** PLAN-0012 and PLAN-0016 merged; PLAN-0011 merged via PR #34 (`eb9e92c`); generated OpenAPI client available
- **Related product:** `docs/product/audience-and-profile.md`
- **Related backend:** `docs/plans/PLAN-0012-implement-profile-household-equipment-backend.md`
- **Related plans:** PLAN-0011 (merged), PLAN-0021 (live home), PLAN-0024 (independent validation placeholder)
- **Starting SHA:** `eb9e92c21ac817e497235168786daeb3f35c30cd`

## Objective

Deliver a production frontend for the already implemented owner-scoped profile backend so an authenticated adult can review and edit household context, locale/timezone/measurement settings, cooking context, preferences/restrictions, equipment, and progressive completeness without exposing sensitive fields in session projections or inventing frontend authority.

## User outcome

An authenticated user can configure enough durable context to improve later recommendations while remaining free to skip nonessential fields, correct information, remove entries, and understand which data is confirmed.

## Included scope

- production routes for profile overview and editing;
- household/default serving and cadence fields exposed by the accepted API;
- language, region, IANA timezone, currency, and measurement settings supported by the backend contract;
- cooking context, skill/confidence, time, effort, cleanup, reheating, leftover, freezing, and planning preferences represented by accepted fields;
- explicit preference/restriction categories;
- allergy and medical restriction entry only through explicit user action;
- equipment list editing and ordering;
- profile completeness presentation and progressive next-step prompts;
- ETag/`If-Match`, CSRF, Problem Details, 409/412/428, retry, and stale-review UX;
- generated OpenAPI client use through application-owned adapters;
- `en`, `pt-BR`, and `es`;
- responsive, keyboard, screen-reader, reduced-motion, and 200% zoom behavior;
- production isolation and comprehensive tests;
- durable documentation and TSDoc/JSDoc.

## Excluded scope

- AI-based profile inference or natural-language onboarding;
- multi-member household accounts, invitations, or permissions;
- billing, subscription, notifications, marketing consent implementation, or final legal copy;
- silent durable learning from quick-chooser answers or behavior;
- changing backend profile semantics inside React;
- direct Keycloak SDK or token storage;
- recommendation generation;
- inventing production terms/privacy version identifiers for adult declaration.

## Architecture and contract rules

- Use the generated client for:
  - `GET/PUT/PATCH /api/v1/profile`;
  - `GET/PUT /api/v1/profile/preferences`;
  - `GET/PUT /api/v1/profile/equipment`;
  - `GET /api/v1/profile/completeness`;
  - safe `GET /api/v1/session` fields.
- Presentation models must not expose raw generated DTOs throughout the component tree.
- Backend owns stable codes, validation, concurrency, authorization, completeness, and sensitive-history redaction.
- Session data must not grow to include allergies, medical restrictions, or private notes merely for convenience.
- Treat an absent profile differently from an empty field (`profileExists: false` scaffold, not 404).
- Preserve `null`, absent, confirmed, removed, default (wire), temporary, and durable semantics from PLAN-0012.
- Ordinary forms use PATCH; PUT replace remains repository-level only.
- Do not use localStorage/sessionStorage as authoritative profile storage.
- Do not translate stable codes in API payloads; localize at presentation boundaries.

## Delivery phases

### Phase 1 — Contract and adapter baseline

- regenerate and verify the API client;
- define application/presentation models;
- implement production repository/adapters;
- add adapter contract tests and drift checks;
- presentation catalogs and opaque custom-code helpers;
- adult-declaration policy boundary (production unavailable by default).

### Phase 2 — Profile overview and core editing

- routes, loading/error/session states;
- household and locale/timezone/measurement editing via PATCH;
- ETag concurrency and review/retry;
- browser IANA suggestion without silent persist.

### Phase 3 — Preferences, restrictions, and equipment

- explicit category-aware preference/restriction UX;
- heightened communication for allergy/medical data without medical claims;
- equipment add/remove/reorder flows;
- validation, duplicate stable-code handling, and accessible errors.

### Phase 4 — Completeness and progressive setup

- completeness summary;
- optional next-step prompts;
- clear skip/cancel behavior;
- no blocking of inventory or home use because optional profile fields are incomplete.

### Phase 5 — Hardening

- full locale/accessibility/responsive tests;
- session/privacy/telemetry review;
- production-isolation proof;
- browser smoke and documentation.

## Testing requirements

- absent profile and first save;
- successful GET/PATCH (PUT covered at repository level only);
- replace versus partial-update semantics;
- `400`, `401`, `403`, `409`, `412`, and `428`;
- stale ETag review and retry;
- concurrent preference/equipment edits;
- duplicate equipment stable codes;
- explicit allergy/medical entry and removal;
- no sensitive values in session or telemetry;
- timezone and locale behavior;
- localization resource completeness;
- keyboard/focus/live-region behavior;
- 360/768/1280/intermediate widths and 200% zoom;
- production bundle contains no prototype profile fixtures;
- generated client drift remains zero.

## Concurrency and merge order

Started from post-PR #34 `main` (`eb9e92c`). No concurrent PLAN-0011 branch work.

## Acceptance criteria

- [x] All accepted profile backend capabilities have truthful production UI or an explicit documented exclusion (adult declaration mutation gated by policy).
- [x] Sensitive categories require explicit user action.
- [x] No profile data is inferred or silently persisted.
- [x] ETag concurrency, CSRF, and Problem Details are handled.
- [x] Generated contracts remain canonical.
- [ ] Supported locales and accessibility gates pass (local/CI pending on published tip).
- [x] Production contains no mock fallback.
- [x] Documentation and code-level comments are complete.
- [ ] Independent review is requested before merge (draft PR pending).

## Execution state

- **Current checkpoint:** Vertical slice validated locally; ready to push draft PR.
- **Run target:** Deliver Phases 1–5 as one production profile frontend vertical slice; open draft PR; exact-head CI.
- **Blockers:** Local Firefox zoom blocked by root/`$HOME` ownership (rely on PLAN-0005 CI).
- **Exact next action:** Push draft PR; await exact-head CI.
- **Working tree state:** Implementation ready to commit on `agent/plan-0020-profile-frontend`.

## Progress log

### 2026-08-03T00:30:00Z — Cursor agent (PLAN-0020 claim + vertical slice)

- **Checkpoint:** Claimed from post-merge `main` (`eb9e92c`); PLAN-0011 delivery reconciled; PLAN-0024 placeholder created; profile vertical slice implemented and locally validated.
- **Changes included in the commit:** Contracts/adapters/catalogs; ProfileProvider; overview/dados/preferencias/equipamentos; shell nav; i18n; guards; smoke gate; docs/evidence.
- **Validation performed:** `yarn install --frozen-lockfile`, `typecheck`, `lint`, `format:check`, `test` (40/276), `guard:*`, `build`/`build:prototype`/`build:production`, `inspect:production-bundle`, `audit:policy`, `generate:api-client` + drift/typecheck/format, `smoke:browser:ci` Passed. `validate:firefox-native-zoom` Failed locally (Firefox root/`$HOME`).
- **Next action:** Push; open draft PR; await exact-head Frontend (+ PLAN-0005).
- **Blockers or handoff notes:** Adult policy unavailable in production by design; free-text ordered-list labels deferred; independent validation PLAN-0024.
