# PLAN-0004: Implement Lovable Application Shell and Inventory UX

- **Status:** Ready
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Unassigned Lovable/frontend implementation agent
- **Created:** 2026-07-29
- **Last updated:** 2026-07-29T00:25:00Z
- **Branch:** `agent/plan-0004-lovable-inventory-ux`
- **Pull request:** Not opened
- **Related implementation plan:** PLAN-0002
- **Related issues:** None
- **Related ADRs:** ADR-0001, ADR-0004, ADR-0006
- **Dependencies:** PLAN-0002 merged; PLAN-0003 OpenAPI contract milestone for live integration

## Objective

Generate and integrate the responsive React/TypeScript KitchenFlow application shell and first inventory experience through Lovable, then connect it to the backend contract without allowing Lovable or frontend code to own authentication tokens, persistence, domain rules, or authoritative inventory state.

The outcome is a polished, accessible, localized inventory experience for the exact PLAN-0002 user journey, not a visual prototype disconnected from real contracts.

## Critical Lovable repository constraint

As of this plan's creation, Lovable cannot import this existing GitHub monorepo. Connecting a Lovable project to GitHub creates a separate repository for that project and syncs its default branch.

Therefore:

- Never attempt to connect Lovable directly to `RodrigoWantuk/WTK.KitchenFlow`.
- Create a dedicated Lovable generation repository with a stable name such as `WTK.KitchenFlow.Frontend.Lovable`.
- Treat that repository as a generation/synchronization workspace.
- Treat `WTK.KitchenFlow/apps/frontend` as the authoritative release copy.
- Integrate through a controlled Git subtree workflow or an equally reviewable history-preserving process documented before use.
- Never copy backend, secrets, private environment files, or unrelated monorepo documentation into the Lovable project.

If Lovable gains supported existing-repository import before execution, do not change this workflow silently. Propose a plan/ADR update with verified official documentation.

## Mandatory reading and precedence

Read the complete path in `docs/README.md`, PLAN-0002, ADR-0001, ADR-0004, product profile/journeys, inventory domain, privacy/security, frontend README, and testing gates.

Precedence:

1. product/domain documents;
2. ADRs;
3. PLAN-0002;
4. this plan;
5. generated Lovable defaults.

Generated code is never exempt from repository rules.

## Deliverable boundaries

### Owned paths

```text
apps/frontend/
scripts/lovable/
docs/frontend/             implementation and sync documentation only
packages/contracts/        generated frontend artifacts only when prescribed
```

### Prohibited behavior

- Do not modify backend endpoint behavior or persistence.
- Do not use Lovable Cloud, Supabase, or another generated backend.
- Do not add a direct database connection.
- Do not use Keycloak JavaScript adapters or store access/refresh tokens in `localStorage`, `sessionStorage`, IndexedDB, or React state.
- Do not call Keycloak Admin APIs.
- Do not call AI providers.
- Do not handwrite duplicated backend DTO interfaces when generated OpenAPI types exist.
- Do not embed English-only UI text in components.
- Do not accept a visually attractive result that fails keyboard, responsive, localization, or error-state requirements.
- Do not replace the Lovable-generated React runtime merely to match a personal preference.

## Lovable project creation protocol

### Owner actions required

The repository owner or authorized Lovable workspace administrator must:

1. create a new Lovable project;
2. use Plan mode before Agent/Build mode;
3. connect the project to a new dedicated GitHub repository;
4. keep repository name/owner stable because renaming or moving breaks sync;
5. provide the frontend agent access to the generated repository or exported code;
6. enable two-factor authentication on the Lovable account/workspace.

An AI coding agent cannot complete these account-level actions without owner access. Record a `Blocked` state if the repository/project is unavailable.

### Project knowledge

Create `docs/frontend/lovable-project-knowledge.md`, kept below Lovable's project-knowledge character limit, and paste it into Lovable Project Knowledge. It must state at least:

- KitchenFlow purpose and central decision problem;
- adult-only responsive web product;
- React/TypeScript only;
- backend is external ASP.NET Core under same-origin `/api`;
- cookie session managed by backend;
- no token storage or direct Keycloak SDK;
- no Supabase/Lovable backend/database/auth;
- API types generated from OpenAPI;
- English source locale plus `pt-BR` and `es` resources;
- accessible keyboard-first UI;
- inventory uses products and lots, not aggregate ingredients;
- quantity is measured or availability state;
- planning, AI, recipes, and other modules are out of scope;
- generated changes must remain inside frontend scope.

### Initial Lovable Plan-mode prompt

Use or adapt this prompt without removing constraints:

```text
Design the first authenticated KitchenFlow inventory experience as a responsive React and TypeScript web application.

KitchenFlow helps adults transform available food into useful meals. This task is only the application shell and manual inventory lot experience. The authoritative backend is a separate ASP.NET Core API under same-origin /api. Do not create or use Lovable Cloud, Supabase, a database, authentication storage, server functions, or AI calls.

Required routes:
- /login
- /inventory
- /inventory/new
- /inventory/:lotId

Required inventory states:
- loading, empty, populated, filtered, depleted, deleted, recoverable error
- measured quantity in grams, milliliters, or units
- availability state: available, low, unavailable
- pantry, refrigerator, freezer, or custom storage
- optional package state, printed expiration date, and private notes
- create, edit metadata, consume, discard, correct quantity, delete erroneous lot, and view history
- explicit stale-version conflict recovery

Design for 360px, 768px, and 1280px widths. Use accessible semantic HTML, keyboard-complete forms, visible focus, non-color-only state, dialogs with focus management, and screen-reader announcements.

All visible copy must use localization keys. Provide English, Portuguese (Brazil), and Spanish resources. Do not hard-code API data or invent backend fields. Use typed mock adapters until the OpenAPI contract is supplied.

Before generating code, produce a component, route, state, accessibility, localization, and API-boundary plan for approval.
```

### Build-mode prompt discipline

- Send one bounded feature or state group per Lovable task.
- Reference PLAN-0002 concepts directly.
- Require Lovable to explain files changed and verification performed.
- Reject any generated backend, Supabase integration, authentication provider, or hard-coded mock that leaks into production paths.
- Save the approved current Lovable plan in the generated project's `.lovable/plan.md` when available.

## Generated runtime policy

New Lovable projects may use TanStack Start with SSR, while older projects may use React + Vite. The agent must inspect the generated repository and preserve the generated supported runtime unless an accepted ADR supersedes it.

Required regardless of runtime:

- TypeScript strict mode;
- React functional components;
- Node.js 24 LTS baseline;
- package-manager choice follows the generated lockfile and is pinned through the `packageManager` field where supported;
- dependency lockfile committed;
- lint, type-check, test, and production-build scripts;
- no secrets in browser build variables;
- server-side rendering code must not call authenticated inventory APIs during public rendering in a way that leaks cookie/user data.

## Controlled repository integration

### Preferred subtree workflow

Document exact remote name and commands in `scripts/lovable/README.md`.

Initial import concept:

```text
git remote add lovable-frontend <dedicated-repository-url>
git fetch lovable-frontend main
git subtree add --prefix=apps/frontend lovable-frontend main --squash
```

Subsequent Lovable-to-monorepo synchronization concept:

```text
git fetch lovable-frontend main
git subtree pull --prefix=apps/frontend lovable-frontend main --squash
```

Monorepo-to-Lovable synchronization concept, only after reviewed monorepo frontend changes are merged and the external repository policy permits it:

```text
git subtree push --prefix=apps/frontend lovable-frontend <reviewed-target-branch>
```

Exact commands must be tested in a disposable branch before first production use. Never force-push or push unrelated monorepo history to the Lovable repository.

### Import review gate

Before accepting generated code into `apps/frontend`:

- inventory all dependencies and licenses;
- remove generated backend/auth/database integrations;
- verify no secrets or Lovable environment identifiers are committed;
- verify architecture, localization, accessibility, security, and testability;
- preserve attribution/license files required by dependencies;
- record generated source commit SHA from the Lovable repository.

## Frontend architecture

Use feature-oriented boundaries:

```text
apps/frontend/src/
├── app/                  routing, providers, shell, error boundaries
├── features/
│   ├── session/
│   └── inventory/
├── components/           reusable presentation components only
├── i18n/                 locale setup and resources
├── lib/
│   ├── api/              generated types/client adapter
│   ├── format/           locale-aware date, decimal, unit formatting
│   └── security/         CSRF/session request utilities
└── test/                 shared test utilities and fixtures
```

Adjust paths to generated runtime conventions while preserving these logical boundaries.

### State ownership

- Backend data is server state and must use the generated client through one adapter boundary.
- Form state is local and temporary.
- No durable inventory truth in browser storage.
- Filter state may live in URL query parameters.
- Locale preference may use a safe browser preference and later backend profile; do not store sensitive content.
- Do not introduce a global state library unless generated runtime already requires it and local/server state cannot solve the need.

## API contract and client generation

Live integration begins only after PLAN-0003 records the OpenAPI milestone SHA.

Required:

- consume `packages/contracts/openapi/kitchenflow-v1.json`;
- generate TypeScript types reproducibly with a pinned tool;
- preferred initial toolchain is `openapi-typescript` plus `openapi-fetch`, unless generated runtime incompatibility is demonstrated and recorded before choosing another generator;
- generated files are not edited manually;
- add `api:generate` and `api:check` scripts;
- CI regenerates and fails on drift;
- one project-owned wrapper sets base path, `credentials: include`, CSRF header, correlation header when required, Problem Details parsing, and cancellation;
- components and feature hooks never concatenate endpoint URL strings directly;
- stable backend `errorCode` values map to localization keys;
- unknown codes fall back to a safe generic localized message with trace ID.

### Session flow

- Protected route loader calls `GET /api/v1/session`.
- `401` routes to `/login` without losing an allowed local return path.
- Login action navigates to backend `/api/v1/auth/login`; it does not post credentials from React.
- Logout posts to backend with CSRF token.
- CSRF token is held in memory/session query cache, not persisted as a secret.
- No provider access or refresh token is visible to JavaScript.

## Exact UI requirements

### Application shell

- Skip link.
- Semantic landmark structure.
- Responsive header/navigation with Inventory as the only enabled product module in this slice.
- Locale selector.
- Account/logout control.
- Global recoverable error boundary.
- No placeholder navigation to unimplemented modules unless clearly disabled and noninteractive.

### Login route

- Product value statement without claims that AI or full product features are already available.
- `Sign in` action that starts backend auth redirect.
- Loading and auth-failure state.
- Adult-only service notice and links/placeholders for privacy/terms as documented; do not fabricate legal text.

### Inventory list

Implement all PLAN-0002 list states and:

- semantic heading hierarchy;
- primary add action;
- search with debounced request and cancellable prior request;
- storage and status filters reflected in URL;
- empty state differentiated from no search results;
- list/card presentation that remains usable at all target widths;
- localized quantity and dates;
- expiration displayed as user-entered information without safety guarantee language;
- pagination/load more with preserved scroll/focus behavior;
- refresh after mutations without duplicate rows.

### Create/edit form

- Reuse one validated form model for create and metadata editing while keeping quantity adjustments separate.
- Quantity mode switch clears incompatible values only after explicit confirmation when data would be lost.
- Decimal input accepts locale display but submits canonical decimal.
- Prevent scientific notation, NaN, infinity, and negative/zero measured creation.
- Conditional custom location is required for `Other`.
- Printed expiration uses calendar-date semantics.
- Show client validation immediately on submit and server validation after response.
- Focus validation summary then first invalid field.
- Disable duplicate submit while preserving cancellation/navigation safety.
- Generate fresh UUID `Idempotency-Key` per intentional create attempt; reuse it for network retry of the same payload.

### Lot detail and actions

- Display ETag/version-backed current state.
- Edit metadata dialog/page.
- Consume and discard dialogs require positive amount and show resulting quantity preview.
- Correct action clearly distinguishes correction from consumption/discard.
- Availability lot actions choose resulting state.
- Delete requires explicit confirmation that it is for erroneous records.
- Send `If-Match` on every mutation.
- On `412`, show stale-data dialog with reload action; do not automatically resubmit.
- On idempotent network uncertainty, retry with the same key.
- History is read-only and chronologically clear.
- After successful action, announce result, update query cache, and place focus predictably.

## Localization

- Use `i18next`/`react-i18next` unless generated runtime has an equally capable established solution; record deviations.
- Provide complete `en`, `pt-BR`, and `es` resource files for this slice.
- No visible string literals in feature components except inaccessible technical identifiers in tests.
- Format decimals, dates, and units through `Intl`.
- Do not translate stable API enum values inside API code; map them at presentation boundary.
- Tests assert missing keys and interpolation correctness.
- Avoid concatenated translated fragments.

## Accessibility

Target WCAG 2.2 AA behavior for the slice.

Required automated and manual checks:

- semantic landmarks and headings;
- keyboard-only route and form completion;
- visible focus;
- no focus traps outside dialogs;
- dialog focus containment and restoration;
- labels/instructions/errors programmatically associated;
- validation summary links to fields;
- status announcements via appropriate live regions;
- touch targets and responsive zoom;
- contrast and non-color-only states;
- reduced-motion respect;
- 200% zoom without loss of operation.

## Testing

Use the generated stack's compatible unit runner; prefer Vitest for Vite/TanStack-based output and Playwright for browser E2E.

### Component/unit tests

Cover:

- quantity-mode validation;
- locale decimal parsing/formatting;
- unit and date formatting;
- error-code localization;
- CSRF/idempotency/If-Match header construction;
- empty/loading/error/populated states;
- stale-conflict dialog;
- conditional custom-location field;
- focus behavior where component tests can verify it.

### Contract integration tests

- generation succeeds from committed OpenAPI;
- generated client compiles;
- no handwritten duplicate DTO drift;
- representative measured and availability responses render correctly;
- Problem Details map to stable UI messages.

### E2E tests

Against real backend/Keycloak environment:

- unauthenticated redirect and login;
- create measured lot;
- create availability lot;
- list/search/filter;
- edit metadata;
- consume/discard/correct;
- stale version conflict using two browser contexts;
- delete erroneous lot;
- logout;
- responsive checks at 360, 768, 1280;
- keyboard-only primary journey;
- locales `en`, `pt-BR`, `es`.

Do not duplicate PLAN-0005 independent execution claims. PLAN-0004 tests are implementation evidence; PLAN-0005 determines independent quality outcome.

## Required commands before review

Use the generated package manager lockfile. Equivalent scripts must exist:

```text
<package-manager> install --frozen-lockfile
<package-manager> run lint
<package-manager> run typecheck
<package-manager> run api:generate
<package-manager> run api:check
<package-manager> run test
<package-manager> run build
<package-manager> exec playwright test
```

Also record dependency audit output and generated-repository source SHA.

## Execution phases

### Phase 0: Claim, owner setup, and baseline

- [ ] Assign frontend agent and update registry.
- [ ] Owner creates Lovable project and dedicated repository.
- [ ] Create implementation branch from current monorepo `main` after PLAN-0002 merge.
- [ ] Record monorepo baseline, Lovable project/repository identity, generated runtime, lockfile, and source SHA.

**Exit criteria:** Required accounts/repositories exist and no attempt is made to import the monorepo into Lovable.

### Phase 1: Knowledge and approved Lovable plan

- [ ] Add/paste project knowledge.
- [ ] Run initial Plan-mode prompt.
- [ ] Review route/component/state/accessibility/localization plan.
- [ ] Remove any generated backend/auth/database proposal before approval.

**Exit criteria:** Approved Lovable plan matches PLAN-0002 and is saved/recorded.

### Phase 2: Generate visual shell with typed mock boundary

- [ ] Generate shell, routes, components, locale resources, responsive states.
- [ ] Use a typed mock adapter matching PLAN-0002 concepts without inventing undocumented fields.
- [ ] Validate visual states and accessibility in Lovable preview.

**Exit criteria:** All required static states exist without external backend coupling.

### Phase 3: Export and controlled subtree integration

- [ ] Connect Lovable to dedicated repository.
- [ ] Record generated source SHA.
- [ ] Test subtree workflow in disposable branch.
- [ ] Import into `apps/frontend`.
- [ ] Remove forbidden generated services/dependencies.
- [ ] Add sync documentation/scripts.

**Exit criteria:** Monorepo builds the imported frontend independently and review identifies its source.

### Phase 4: OpenAPI and session integration

- [ ] Wait for PLAN-0003 contract milestone.
- [ ] Generate client/types.
- [ ] Replace mock adapter with live same-origin API adapter.
- [ ] Implement session/login/logout/CSRF behavior.
- [ ] Add contract drift checks.

**Exit criteria:** Real Keycloak login and authenticated inventory list work without browser token storage.

### Phase 5: Complete mutations, localization, accessibility, and tests

- [ ] Implement create/edit/adjust/delete/history and conflict recovery.
- [ ] Complete three locales.
- [ ] Complete unit/component/contract/E2E tests.
- [ ] Run responsive and keyboard manual review.
- [ ] Run build, audit, and source review.
- [ ] Open PR with evidence and Lovable provenance.

**Exit criteria:** All acceptance criteria pass and PLAN-0005 receives a stable PR baseline.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Lovable creates a backend or Supabase coupling | High | Critical | Project knowledge, prompt prohibition, import review gate |
| Agent attempts unsupported existing-repo import | High | High | Dedicated repo and subtree workflow |
| Generated runtime differs from assumed Vite SPA | High | Medium | Inspect and preserve generated TanStack Start or Vite runtime |
| Frontend diverges from backend contract | High | High | OpenAPI generation, drift check, milestone dependency |
| Browser token exposure | Medium | Critical | Backend session only, security tests, no Keycloak JS adapter |
| Generated UI lacks error/accessibility states | High | High | Exact state checklist and automated/manual gates |
| Two sources of truth emerge | Medium | High | Monorepo release authority and documented sync protocol |
| Lovable credits are wasted by broad prompts | Medium | Medium | Plan mode first, bounded prompts, one feature/state group at a time |

## Acceptance criteria

- [ ] Frontend is generated through Lovable and provenance is recorded.
- [ ] Lovable uses a dedicated repository; existing monorepo import is not attempted.
- [ ] `apps/frontend` is independently installable, testable, buildable, and deployable.
- [ ] No generated backend, Supabase, direct database, AI call, Keycloak JS adapter, or token storage exists.
- [ ] All PLAN-0002 routes, states, fields, actions, conflict behavior, and history are implemented.
- [ ] API client/types are generated reproducibly from PLAN-0003 OpenAPI and drift-checked.
- [ ] English, Portuguese (Brazil), and Spanish resources are complete.
- [ ] Target widths, keyboard flow, screen-reader semantics, focus, and error announcements pass.
- [ ] Unit/component/contract/E2E tests and production build pass.
- [ ] Dependency/license/security review is recorded.
- [ ] Stable PR baseline is handed to PLAN-0005.

## Execution state

- **Current checkpoint:** Plan is fully specified and ready for owner setup and assignment after PLAN-0002 merges.
- **Last completed step:** Planning only.
- **Exact next action:** Owner creates the Lovable project and dedicated GitHub repository; frontend agent claims the plan and records generated runtime/source baseline.
- **Blockers:** PLAN-0002 merge; owner-level Lovable project/repository creation. Live API integration additionally waits for PLAN-0003 OpenAPI milestone.
- **Partially modified areas:** None.
- **Validation performed:** Checked Lovable's current repository limitation and mapped all PLAN-0002 frontend requirements.
- **Known failures or limitations:** Exact generated runtime and package manager are unknown until project creation.
- **Working tree state:** Not applicable until claimed.

## Progress log

### 2026-07-29T00:25:00Z — AI planning agent

- **Checkpoint:** Lovable/frontend implementation plan created.
- **Changes included in the commit:** Added owner setup, prompt protocol, dedicated-repository/subtree workflow, runtime policy, API integration, exact UI, localization, accessibility, tests, and phases.
- **Validation performed:** Verified the current inability to import an existing GitHub repository into Lovable and separated generation workspace from authoritative monorepo release copy.
- **Result:** Ready for owner setup and agent assignment.
- **Next action:** Create Lovable project/repository after PLAN-0002 merge.
- **Blockers or handoff notes:** Do not start live integration before PLAN-0003 records a stable OpenAPI contract SHA.

## Completion and handoff checklist

- [ ] All phases and acceptance criteria are resolved truthfully.
- [ ] Lovable provenance and sync workflow are documented.
- [ ] Tests, accessibility, localization, audit, and build evidence are complete.
- [ ] PLAN-0005 receives stable baseline.
- [ ] `docs/plan-status.md` matches this plan.
- [ ] PR reports validation and limitations.
- [ ] No hidden partial work remains.
- [ ] Branch and external-repository cleanup/sync responsibility is recorded.
