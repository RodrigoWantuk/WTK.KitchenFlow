# PLAN-0020: Implement Profile, Household, Preferences, and Equipment Frontend

- **Status:** Ready
- **Type:** Implementation
- **Priority:** High
- **Owner:** Unassigned frontend implementation agent
- **Created:** 2026-08-02
- **Last updated:** 2026-08-02
- **Branch:** `agent/plan-0020-profile-frontend`
- **Pull request:** Not opened
- **Dependencies:** PLAN-0012 and PLAN-0016 merged; generated OpenAPI client available
- **Related product:** `docs/product/audience-and-profile.md`
- **Related backend:** `docs/plans/PLAN-0012-implement-profile-household-equipment-backend.md`
- **Related plans:** PLAN-0011 and PLAN-0021

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
- ETag/`If-Match`, CSRF, Problem Details, 404/412/428, retry, and stale-review UX;
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
- PLAN-0011 public landing/home implementation.

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
- Treat an absent profile differently from an empty field.
- Preserve `null`, absent, confirmed, removed, default, temporary, and durable semantics from PLAN-0012.
- Do not use localStorage/sessionStorage as authoritative profile storage.
- Do not translate stable codes in API payloads; localize at presentation boundaries.

## Delivery phases

### Phase 1 — Contract and adapter baseline

- regenerate and verify the API client;
- inventory profile endpoints and error contracts;
- define application/presentation models;
- implement production repository/adapters;
- add adapter contract tests and drift checks.

### Phase 2 — Profile overview and core editing

- implement routes, loading/error/not-found/session states;
- implement household and locale/timezone/measurement editing;
- support ETag concurrency and review/retry;
- preserve browser IANA fallback without treating server timezone as user context.

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
- successful GET/PUT/PATCH;
- replace versus partial-update semantics;
- `404`, `400`, `401`, `403`, `409`, `412`, and `428`;
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

PLAN-0020 and PLAN-0011 may touch shared routing, session, shell, localization, and test utilities. With one developer, merge PLAN-0011 first and start PLAN-0020 from updated `main`. Parallel work requires explicit file ownership and merge order in both plans.

## Acceptance criteria

- [ ] All accepted profile backend capabilities have truthful production UI or an explicit documented exclusion.
- [ ] Sensitive categories require explicit user action.
- [ ] No profile data is inferred or silently persisted.
- [ ] ETag concurrency, CSRF, and Problem Details are handled.
- [ ] Generated contracts remain canonical.
- [ ] Supported locales and accessibility gates pass.
- [ ] Production contains no mock fallback.
- [ ] Documentation and code-level comments are complete.
- [ ] Independent review is requested before merge.

## Execution state

- **Current checkpoint:** PLAN-0012 backend and generated contracts are on `main`; frontend implementation has not started.
- **Run target:** Deliver Phases 1–4 plus hardening as one production profile frontend vertical slice.
- **Blockers:** None after PLAN-0011 merge; concurrent execution requires coordination.
- **Exact next action:** After PLAN-0011 merges, claim the plan, create the branch from current `main`, regenerate the client, and implement the production profile frontend.
