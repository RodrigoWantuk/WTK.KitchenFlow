# PLAN-0004: Implement Lovable Application Shell and Inventory UX

- **Status:** Superseded
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Unassigned Lovable/frontend implementation agent
- **Created:** 2026-07-29
- **Last updated:** 2026-07-31T20:15:00Z
- **Branch:** `agent/plan-0004-lovable-inventory-ux`
- **Pull request:** Not opened
- **Superseded by:** [PLAN-0014](PLAN-0014-integrate-emergent-frontend.md)
- **Related implementation plan:** PLAN-0002
- **Related documentation plan:** PLAN-0006
- **Related issues:** None
- **Related ADRs:** ADR-0001 (historical), ADR-0007, ADR-0004, ADR-0006
- **Dependencies:** PLAN-0002 merged; PLAN-0006 merged before execution; PLAN-0003 OpenAPI contract milestone for live integration

## Supersession notice

This plan is **Superseded** by [PLAN-0014](PLAN-0014-integrate-emergent-frontend.md). The authoritative frontend prototype was completed in `RodrigoWantuk/kitchen-emergent` and is imported into `apps/frontend` under PLAN-0014. Do not execute PLAN-0004 Lovable generation or dedicated-repository sync workflows. Retain this document for historical requirements that PLAN-0014 preserves where still applicable (session boundary, mock/live isolation, accessibility, localization, inventory contract readiness).

## Objective

Generate and integrate the responsive React/TypeScript KitchenFlow application shell and first authenticated inventory experience through Lovable, then connect the inventory layer to the backend contract without allowing Lovable or frontend code to own authentication tokens, persistence, domain rules, or authoritative inventory state.

The first Lovable generations must also provide a broad, highly navigable, explicitly mocked prototype of the accepted first-release product surface. This prototype exists to validate information architecture, terminology, workflow continuity, forms, responsiveness, and product direction before every backend module exists.

The final PLAN-0004 outcome has two distinct layers:

1. a production-aligned, contract-ready inventory and session experience implementing PLAN-0002;
2. a broad prototype-only product exploration layer backed by synthetic data and isolated mock adapters.

The broad prototype is not evidence that its backend capabilities exist. Inventory is the only product module connected to PLAN-0003 during this plan.

## Design authority and non-wireframe rule

Lovable is expected to make strong design decisions. This plan defines product personality, experience principles, required workflows, states, constraints, and validation outcomes. It intentionally does **not** prescribe screen sketches, ASCII wireframes, pixel-level layouts, fixed navigation composition, exact card placement, or desktop/mobile component arrangement.

The Lovable/frontend agent must:

- allow Lovable to propose the information architecture, page composition, navigation pattern, responsive transformations, and visual hierarchy;
- review those decisions against product clarity, accessibility, localization, and task completion rather than against a preconceived wireframe;
- ask Lovable to explain major UX decisions before broad code generation;
- reject designs that are attractive but indirect, confusing, inaccessible, overly decorative, or inconsistent with product boundaries;
- document material deviations from the general design direction and why they improve the product.

Do not add a rigid screen sketch to this plan during execution. A later approved design artifact may document implemented behavior, but it must not silently replace product requirements.

## General product and visual direction

### Product personality

KitchenFlow should communicate:

- calm organization;
- practical confidence;
- real everyday food;
- warm but restrained hospitality;
- modern, trustworthy software;
- direct guidance without pressure or judgment.

The preferred balance is welcoming and culinary with a modern technological foundation. Technology and AI should feel embedded in the product rather than presented as a mascot or spectacle.

### Visual anti-patterns

Avoid a visual language that resembles:

- a cold corporate administration system;
- a childish recipe game;
- a social-media food feed;
- a rustic themed kitchen with excessive wood, gingham, chalkboards, or decorative utensils;
- a generic AI dashboard filled with gradients, glowing effects, robots, or chat-first composition;
- a dense enterprise data grid as the default experience;
- a wellness product that moralizes food choices;
- a warning-heavy interface that creates anxiety around expiration.

### Color direction

Use a warm, natural, restrained palette as the starting direction:

- a forest or deep botanical green as the primary brand/action family;
- warm off-white or very light cream backgrounds instead of clinical pure white everywhere;
- clean warm surfaces with subtle green-gray secondary surfaces;
- a restrained warm orange or amber accent for selected emphasis and operational attention;
- graphite or deep neutral text;
- semantic success, warning, and error colors that meet contrast requirements and are never the only state indicator.

Lovable may tune exact values, saturation, contrast, and token relationships. It must produce semantic design tokens rather than scattering literal colors through components. The primary action color, attention color, warning color, and destructive color must remain visually distinct.

The first accepted prototype may be light-theme only, but theme tokens must not prevent a future system-following dark theme. Do not spend the first generation duplicating every screen in dark mode.

### Typography direction

Preferred starting direction:

- Manrope or a comparable modern rounded sans-serif for headings and selected display text;
- Inter or a comparable highly legible interface sans-serif for body, controls, data, and forms.

Lovable may select an equivalent combination when it improves generated-runtime compatibility, localization, loading performance, or visual coherence. The choice must:

- support Portuguese, Spanish, and English glyphs;
- remain readable at compact interface sizes;
- preserve clear numeric and unit presentation;
- avoid decorative script, handwritten, or editorial serif fonts for operational controls;
- use a limited and consistent type scale;
- avoid remote font loading that introduces an unreviewed privacy, licensing, or performance dependency.

Font assets and licenses must be reviewed. Prefer properly licensed bundled fonts or robust local fallbacks.

### Iconography direction

Use one consistent outline icon family, with Lucide as the preferred starting point when compatible with the generated stack.

Requirements:

- do not mix unrelated outline and filled icon styles;
- accompany unfamiliar or consequential actions with text;
- do not rely on icons alone for destructive, safety-relevant, or ambiguous actions;
- maintain accessible names and adequate touch targets;
- avoid decorative icon density.

### Brand symbol direction

A future KitchenFlow mark should be abstract and simple. Preferred conceptual ingredients are flow, transformation, a subtle `K`, and a vessel or meal shape. Do not default to:

- chef hats;
- crossed fork and knife symbols;
- robot cooks;
- brains combined with food;
- generic plates with cutlery;
- complex illustrative mascots.

PLAN-0004 may use a restrained temporary wordmark and simple provisional mark. It must not claim final brand approval or spend implementation scope producing a complete identity system.

### Photography and imagery

Use food photography selectively, primarily where a recipe or completed result benefits from it. Inventory, planning, attention, and operational forms must remain effective without images.

Requirements:

- do not fill the shell or dashboard with decorative stock food photography;
- use realistic, diverse food examples rather than perfect luxury imagery;
- provide stable placeholders and graceful missing-image states;
- avoid imagery that creates unrealistic dietary, body, or lifestyle expectations;
- treat all prototype imagery as replaceable and license-reviewed before release.

### Motion and feedback

Use subtle, functional motion for route continuity, state changes, panels, confirmations, and focus orientation.

- Respect `prefers-reduced-motion`.
- Avoid decorative looping animation.
- Avoid delaying task completion for transitions.
- Use animation to explain a state change, not to call attention to the interface itself.
- Loading feedback must reflect real or simulated progress honestly.

### Density and spacing

Use balanced density:

- enough whitespace to make decisions and forms easy to scan;
- enough information density to avoid excessive navigation and scrolling;
- progressive disclosure for advanced metadata and secondary actions;
- large enough touch targets for mobile use;
- no assumption that mobile means hiding essential information.

A future user-selectable compact mode may be considered, but it is not required in this plan.

### Voice and terminology

Copy should be objective, welcoming, and calm.

Prefer language such as:

- “Three products may need your attention.”
- “Review the quantity before continuing.”
- “This date was entered by you.”

Avoid alarmist, judgmental, infantilizing, or overly playful language.

The product itself is the assistant. Do not introduce a named AI character or mascot. Contextual actions and explanations are preferred over a permanent chat persona.

User-facing terminology should be familiar and task-oriented. Technical domain terms such as `InventoryLot` remain internal. Lovable should propose localized navigation labels and test their clarity; route and API names remain stable regardless of display copy.

## Responsive SPA experience principles

The user experience must behave as a single-page application after initial load:

- internal navigation uses client-side routing without full document reloads;
- route state is deep-linkable where appropriate;
- browser back and forward behavior is correct;
- filters and meaningful navigation state survive expected route transitions;
- focus is managed after client-side navigation;
- loading, error, and stale states are explicit;
- authenticated data is never embedded into unsafe public static output.

The generated runtime may be TanStack Start, React with Vite, or another Lovable-supported React runtime. Preserve the supported generated runtime unless an accepted ADR supersedes it. SSR or prerendering may exist at runtime level, but the authenticated product experience must retain SPA-like navigation and must not leak user-specific data.

The experience must adapt continuously rather than implement only three isolated snapshots. Validate at least 360 px, 768 px, and 1280 px, plus intermediate widths. Lovable decides how navigation, action placement, content grouping, and forms transform between widths.

No horizontal page scrolling is accepted at target widths. Text enlargement, localization expansion, browser zoom, virtual keyboards, safe areas, and touch input must be considered.

## Critical Lovable repository constraint

As of this plan's creation, Lovable cannot import this existing GitHub monorepo. Connecting a Lovable project to GitHub creates a separate repository for that project and syncs its default branch.

Therefore:

- Never attempt to connect Lovable directly to `RodrigoWantuk/WTK.KitchenFlow`.
- Create a dedicated Lovable generation repository with a stable name such as `WTK.KitchenFlow.Frontend.Lovable`.
- Treat that repository as a generation and synchronization workspace.
- Treat `WTK.KitchenFlow/apps/frontend` as the authoritative release copy.
- Integrate through a controlled Git subtree workflow or an equally reviewable history-preserving process documented before use.
- Never copy backend, secrets, private environment files, or unrelated monorepo documentation into the Lovable project.

If Lovable gains supported existing-repository import before execution, do not change this workflow silently. Propose a plan or ADR update with verified official documentation.

## Mandatory reading and precedence

Read the complete path in `docs/README.md`, PLAN-0002, PLAN-0006, ADR-0001, ADR-0004, product profile and journeys, inventory domain, privacy and security, frontend README, and testing gates.

Precedence:

1. accepted product and domain documents;
2. accepted ADRs;
3. PLAN-0002;
4. this plan and the accepted PLAN-0006 refinement;
5. generated Lovable defaults.

Generated code is never exempt from repository rules.

## Deliverable boundaries

### Owned paths

```text
apps/frontend/
scripts/lovable/
docs/frontend/             implementation, design rationale, and sync documentation only
packages/contracts/        generated frontend artifacts only when prescribed
```

### Prohibited behavior

- Do not modify backend endpoint behavior or persistence.
- Do not use Lovable Cloud, Supabase, or another generated backend.
- Do not add a direct database connection.
- Do not use Keycloak JavaScript adapters or store access or refresh tokens in `localStorage`, `sessionStorage`, IndexedDB, or durable React state.
- Do not call Keycloak Admin APIs.
- Do not call AI providers.
- Do not handwrite duplicated backend DTO interfaces when generated OpenAPI types exist.
- Do not embed English-only UI text in components.
- Do not accept a visually attractive result that fails keyboard, responsive, localization, mock-state, or error-state requirements.
- Do not replace the Lovable-generated React runtime merely to match a personal preference.
- Do not present prototype-only modules as live production integrations.
- Do not ship prototype scenario controls, fixture selectors, or development galleries enabled in production.
- Do not create dead navigation, inert buttons, or forms that cannot produce a deliberate prototype result.
- Do not constrain Lovable with wireframes that were not explicitly approved by the stakeholder.

## Prototype fidelity model

### Layer A: production-aligned inventory slice

This layer receives the highest implementation fidelity and later connects to PLAN-0003.

It includes:

- login and session states;
- authenticated application shell;
- inventory list and filters;
- create product and lot form;
- lot detail;
- metadata correction;
- consume, discard, quantity correction, and availability changes;
- history;
- soft-delete flow;
- empty, loading, error, validation, idempotent retry, and stale-version conflict states;
- minimum profile and locale controls required by the session experience.

Before the OpenAPI milestone, Layer A uses a typed mock adapter matching PLAN-0002. After the milestone, the live adapter replaces it without rewriting presentation behavior.

### Layer B: broad prototype-only product exploration

This layer exists for stakeholder navigation and UX validation. It remains mock-backed during PLAN-0004 unless another approved implementation plan supplies a contract.

The prototype must cover the accepted first-release surface sufficiently to navigate and validate:

- short product introduction and authentication entry;
- progressive onboarding and quick-versus-complete setup choice;
- household and personal cooking profile;
- preferences, dislikes, allergies, intolerances, restrictions, goals, skill, time, effort, cleanup tolerance, and equipment;
- home or dashboard experience;
- attention and expiring-product workflow;
- pantry and inventory beyond the Layer A happy path;
- manual shopping list and shopping-plan review;
- optional meal planning and accepted menu intentions;
- contextual recipe suggestion exploration;
- recipe library, recipe detail, favorites, and favorite groups;
- recipe import and generation entry points represented only as simulations;
- mise en place review;
- guided cooking stages;
- textual troubleshooting simulation;
- cooking completion and proposed inventory reconciliation;
- leftovers, freezing, discard, and result recording;
- execution history, result notes, and optional photo gallery placeholders;
- notification and attention preferences;
- profile, language, region, units, equipment, and general settings;
- privacy center, data export request, content deletion, and account deletion request simulations.

Mocked AI pages must simulate deterministic sample responses locally. They must not call an AI provider, consume real tokens, or imply model availability.

### Prototype interaction requirements

A prototype control is accepted only when it does at least one of the following:

- navigates to a meaningful route or state;
- opens and completes a form;
- mutates synthetic mock state;
- displays confirmation, validation, conflict, loading, or failure behavior;
- intentionally demonstrates a disabled future capability with an explicit explanation.

Inert controls are defects. Placeholder links that navigate nowhere are prohibited.

Forms must support realistic completion, validation, cancellation, unsaved-change behavior, and success or failure feedback even when the result is stored only in mock state.

### Prototype data and scenarios

Use synthetic, realistic, culturally neutral-enough fixtures with localized text. Include varied examples such as:

- opened and sealed quantities of the same product;
- refrigerated, frozen, pantry, and custom storage;
- a partially thawed item;
- a low or approximate household staple;
- an item nearing an entered expiration date;
- a product reserved for a plan;
- a missing planned ingredient;
- a refrigerated leftover;
- an active cooking execution;
- a completed recipe with notes;
- AI unavailable;
- API unavailable;
- stale data conflict;
- empty new-user state.

Fixtures must contain no real user data, secrets, copyrighted recipe text copied without permission, or safety claims presented as facts.

### Prototype scenario switcher and gallery

Provide a development-only scenario mechanism that can switch the prototype among defined states without repetitive manual setup. Exact UI placement is Lovable's decision.

At minimum support:

- new user;
- onboarding in progress;
- empty pantry;
- populated pantry;
- products needing attention;
- planned meal with missing item;
- shopping list in progress;
- cooking in progress;
- completed execution with leftovers;
- AI unavailable;
- API error;
- stale conflict.

Provide a development-only prototype gallery or equivalent route index that exposes all major routes and important states for stakeholder review, including loading, empty, populated, error, validation, success, conflict, and disabled-future behavior.

Prototype mode must be isolated behind an explicit development or preview configuration. Production builds must fail a check or otherwise prove that scenario controls and prototype-only galleries are disabled or inaccessible.

## Lovable project creation protocol

### Owner actions required

The repository owner or authorized Lovable workspace administrator must:

1. create a new Lovable project;
2. use Plan mode before Agent or Build mode;
3. connect the project to a new dedicated GitHub repository;
4. keep repository name and owner stable because renaming or moving may break sync;
5. provide the frontend agent access to the generated repository or exported code;
6. enable two-factor authentication on the Lovable account or workspace.

An AI coding agent cannot complete these account-level actions without owner access. Record a `Blocked` state if the repository or project is unavailable.

### Project Knowledge

Create `docs/frontend/lovable-project-knowledge.md`, keep it below Lovable's current Project Knowledge limit, and paste it into Lovable Project Knowledge. It must state at least:

- KitchenFlow's purpose and central decision problem;
- adult-only, responsive, multilingual web product;
- SPA-like client navigation after initial load;
- React and TypeScript only;
- backend is external ASP.NET Core under same-origin `/api`;
- cookie session is managed by the backend;
- no token storage or direct Keycloak SDK;
- no Supabase, Lovable backend, database, auth, server function, or AI provider;
- API types generated from OpenAPI;
- English source locale plus complete `pt-BR` and `es` resources;
- accessible keyboard-first and touch-friendly UI;
- calm, warm, modern, practical product personality;
- botanical green, warm neutral, and restrained amber visual direction without fixed color values;
- balanced density, selective food imagery, subtle motion, and no AI mascot;
- inventory uses products and lots, not aggregate ingredients;
- quantity is measured or availability state;
- Layer A inventory is production-aligned and contract-ready;
- Layer B broader product surface is synthetic and prototype-only;
- no dead controls;
- prototype scenario switcher and gallery are development-only;
- Lovable owns layout and information-architecture proposals; no rigid wireframe is supplied;
- generated changes remain inside frontend scope.

### Initial Lovable Plan-mode prompt

Use or adapt this prompt without removing constraints:

```text
Design the first KitchenFlow web experience as a responsive React and TypeScript application with SPA-like client navigation.

KitchenFlow helps adults transform available, usable, or purchasable food into useful meals with less effort, waste, and dependence on delivery. It should feel calm, warm, modern, practical, and trustworthy. Avoid a cold enterprise dashboard, childish recipe app, rustic kitchen theme, social-media food feed, or flashy AI interface.

Use a general visual direction based on botanical or forest green, warm light neutrals, restrained amber accents, graphite text, balanced density, selective food imagery, subtle functional motion, and one consistent outline icon family. You may choose and refine exact design tokens, typography, navigation, hierarchy, component composition, and responsive behavior. Prefer a modern heading sans such as Manrope and a highly legible interface sans such as Inter, or justified equivalents. Do not create a named AI mascot.

Do not follow or invent a rigid wireframe. First propose the information architecture, route grouping, responsive navigation strategy, design-token direction, component system, prototype architecture, accessibility approach, and key workflow decisions for approval. Explain why the proposed structure is intuitive and direct.

The authoritative backend is a separate ASP.NET Core API under same-origin /api. Do not create or use Lovable Cloud, Supabase, a database, authentication storage, server functions, direct Keycloak integration, or AI provider calls. Do not store access or refresh tokens in browser-accessible storage.

Implement two clearly separated fidelity layers.

Layer A is production-aligned and will later connect to the backend OpenAPI contract:
- /login
- /inventory
- /inventory/new
- /inventory/:lotId
- loading, empty, populated, filtered, depleted, deleted, recoverable error, validation, and stale-conflict states
- measured quantity in grams, milliliters, or units
- availability state: available, low, unavailable
- pantry, refrigerator, freezer, or custom storage
- optional package state, user-entered printed expiration date, and private notes
- create, edit metadata, consume, discard, correct quantity, delete an erroneous lot, and view immutable history

Layer B is a broad prototype-only, synthetic, navigable representation of the accepted first-release product. It should cover onboarding, profile and equipment, dashboard, attention, shopping, optional planning, recipe suggestions, recipe library and detail, favorites, mise en place, guided cooking, textual troubleshooting simulation, completion and reconciliation, leftovers, execution history, notifications, settings, and privacy workflows.

Every visible control must navigate, mutate synthetic state, complete a form, display a deliberate state, or explicitly explain a disabled future capability. Do not generate dead buttons or empty links.

Create realistic synthetic scenarios for new user, empty and populated pantry, expiring products, missing planned ingredient, shopping in progress, cooking in progress, completed cooking with leftovers, AI unavailable, API error, and stale conflict. Provide a development-only scenario switcher and prototype gallery or equivalent route index for stakeholder review. Prototype controls and fixtures must be isolated and disabled from production builds.

Design continuously across device widths and validate at 360px, 768px, 1280px, and intermediate widths. Use accessible semantic HTML, keyboard-complete forms, visible focus, non-color-only state, proper dialog focus, screen-reader announcements, reduced-motion support, and 200% zoom operation.

All visible copy must use localization keys. Provide English, Portuguese (Brazil), and Spanish resources. Support text expansion and locale-aware dates, decimals, pluralization, and units.

Use typed mock adapters. Do not invent backend fields for Layer A. Keep Layer B prototype contracts explicitly separate from production API contracts.

Before generating broad code, produce a concise approval plan covering information architecture, route map, design system, responsive strategy, prototype-mode isolation, mock scenarios, component boundaries, state ownership, accessibility, localization, and API boundary.
```

### Build-mode prompt discipline

- Send one bounded workflow, feature group, state family, or design-system task per Lovable request.
- Use Plan mode before broad structural changes.
- Require Lovable to explain major UX decisions, files changed, mock/live boundaries, and verification performed.
- Reference PLAN-0002 concepts directly for Layer A.
- Reject generated backend, Supabase, auth provider, direct AI integration, or hard-coded mock data leaking into production adapters.
- Reject broad rewrites that discard already validated routes or states without a documented reason.
- Save the approved current Lovable plan in the generated project's `.lovable/plan.md` when available.
- Record stakeholder feedback and the Lovable change that resolved it.

## Generated runtime policy

New Lovable projects may use TanStack Start with SSR, while older projects may use React with Vite. Inspect the generated repository and preserve the generated supported runtime unless an accepted ADR supersedes it.

Required regardless of runtime:

- TypeScript strict mode;
- React functional components;
- SPA-like internal navigation;
- Node.js 24 LTS baseline;
- package-manager choice follows the generated lockfile and is pinned through the `packageManager` field where supported;
- one committed dependency lockfile;
- lint, type-check, test, and production-build scripts;
- no secrets in browser build variables;
- semantic design tokens through CSS custom properties or an equivalent centralized system;
- prototype mode isolated through explicit configuration;
- server-rendered code must not call authenticated inventory APIs during public rendering in a way that leaks cookie or user data.

## Controlled repository integration

### Preferred subtree workflow

Document the exact remote name and commands in `scripts/lovable/README.md`.

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

Test exact commands in a disposable branch before first production use. Never force-push or push unrelated monorepo history to the Lovable repository.

### Import review gate

Before accepting generated code into `apps/frontend`:

- inventory all dependencies and licenses;
- remove generated backend, auth, database, server-function, and AI integrations;
- verify no secrets or Lovable environment identifiers are committed;
- verify architecture, localization, accessibility, responsive behavior, security, prototype isolation, and testability;
- preserve attribution and license files required by dependencies;
- record the generated source commit SHA from the Lovable repository;
- document the generated runtime, package manager, design-token strategy, and prototype-mode switch;
- verify no final brand claim is made for provisional assets.

## Frontend architecture

Use feature-oriented boundaries. Adapt exact paths to the generated runtime while preserving the logical separation:

```text
apps/frontend/src/
├── app/                  routing, providers, shell, error boundaries
├── features/
│   ├── session/
│   ├── inventory/
│   └── prototype/        broad mock-only workflows or route composition
├── components/           reusable presentation components only
├── design/               tokens, primitives, typography, icon policy
├── i18n/                 locale setup and resources
├── lib/
│   ├── api/              generated live types and client adapter
│   ├── mock/             typed synthetic adapters and fixtures
│   ├── format/           locale-aware date, decimal, and unit formatting
│   └── security/         CSRF and session request utilities
└── test/                 shared test utilities and fixtures
```

Prototype-only code must not become a second production domain implementation. Prefer adapter boundaries that let Layer A swap mock and live data without duplicating presentation logic.

### State ownership

- Backend data is server state and uses the generated client through one adapter boundary.
- Form state is local and temporary.
- No durable authoritative inventory truth exists in browser storage.
- Filter state may live in URL query parameters.
- Locale preference may use a safe browser preference and later backend profile; do not store sensitive content.
- Prototype scenario state may use in-memory or development-only browser storage containing synthetic data only.
- Production builds must not load prototype fixtures as authoritative data.
- Do not introduce a global state library unless the generated runtime already requires it and local or server state cannot solve the demonstrated need.

## API contract and client generation

Live integration begins only after PLAN-0003 records the OpenAPI milestone SHA.

Required:

- consume `packages/contracts/openapi/kitchenflow-v1.json`;
- generate TypeScript types reproducibly with a pinned tool;
- preferred initial toolchain is `openapi-typescript` plus `openapi-fetch`, unless generated-runtime incompatibility is demonstrated and recorded before choosing another generator;
- generated files are not edited manually;
- add `api:generate` and `api:check` scripts;
- CI regenerates and fails on drift;
- one project-owned wrapper sets base path, `credentials: include`, CSRF header, correlation header when required, Problem Details parsing, and cancellation;
- components and feature hooks never concatenate endpoint URL strings directly;
- stable backend `errorCode` values map to localization keys;
- unknown codes fall back to a safe generic localized message with trace ID;
- mock Layer B contracts must not be placed in the OpenAPI-generated contract directory.

### Session flow

- Protected route handling calls `GET /api/v1/session`.
- `401` routes to `/login` without losing an allowed local return path.
- Login action navigates to backend `/api/v1/auth/login`; it does not post credentials from React.
- Logout posts to backend with the CSRF token.
- CSRF token is held in memory or session query cache, not persisted as a secret.
- No provider access or refresh token is visible to JavaScript.
- Prototype mode may simulate authenticated and unauthenticated scenarios but must not replace the real session adapter in production.

## Layer A functional requirements

These are behavioral requirements, not screen-layout prescriptions.

### Application shell and login

- Provide skip navigation and semantic landmarks.
- Provide intuitive responsive product navigation with only implemented production modules presented as live.
- Clearly distinguish prototype-only navigation when prototype mode is enabled.
- Provide locale selection and account/logout behavior.
- Provide a global recoverable error boundary.
- Provide a concise product value statement without claiming unavailable AI or backend functionality.
- Start authentication through the backend redirect.
- Include loading, authentication failure, adult-only notice, and policy-link placeholders without fabricating legal text.

### Inventory discovery

Implement all PLAN-0002 list states and:

- clear heading and primary add intent;
- search with debounced, cancellable requests;
- storage and status filters reflected in URL state;
- empty inventory distinguished from no matching results;
- presentation usable at all supported widths;
- localized quantity, unit, date, storage, and status display;
- entered expiration shown as user-entered information without a safety guarantee;
- cursor pagination or load-more behavior preserving filters, scroll, and focus;
- refresh after mutation without duplicate rows.

### Create and edit behavior

- Reuse a validated form model for create and metadata editing while keeping quantity adjustments separate.
- Quantity-mode changes that discard entered data require explicit confirmation.
- Decimal input accepts locale display and submits canonical decimal.
- Reject scientific notation, NaN, infinity, and negative or zero measured creation.
- Require custom location when `Other` is selected.
- Treat printed expiration as a calendar date.
- Provide client validation on submit and map server field validation after response.
- Focus the validation summary and then the first invalid field.
- Prevent duplicate submit while preserving cancellation and navigation safety.
- Generate a fresh UUID `Idempotency-Key` per intentional create attempt and reuse it for network retry of the same payload.
- Protect unsaved changes.

### Lot detail and mutations

- Display current state and provenance appropriate to PLAN-0002.
- Provide edit metadata, consume, discard, correct, availability change, history, and erroneous-record deletion behavior.
- Show resulting quantity previews for consume and discard.
- Distinguish correction from consumption and discard.
- Require explicit destructive confirmation.
- Send `If-Match` on every mutation.
- On `412`, show stale-data recovery with reload and never automatically overwrite or resubmit.
- On idempotent network uncertainty, reuse the same key for the same payload.
- Keep history read-only and understandable.
- After successful actions, announce the result, refresh state, and place focus predictably.

## Localization

- Use `i18next` and `react-i18next` unless the generated runtime has an equally capable established solution; record deviations.
- Provide complete `en`, `pt-BR`, and `es` resources for Layer A and the navigable Layer B prototype.
- No visible string literals in feature components except inaccessible technical identifiers in tests.
- Format decimals, dates, units, and pluralization through `Intl` or an equivalent locale-aware boundary.
- Do not translate stable API enum values inside API code; map them at the presentation boundary.
- Avoid concatenated translated fragments.
- Test missing keys, interpolation, long labels, and text expansion.
- User-facing terminology may differ from technical route or API names but must remain consistent within each locale.

## Accessibility

Target WCAG 2.2 AA behavior for all navigable prototype and Layer A flows.

Required automated and manual checks:

- semantic landmarks and headings;
- keyboard-only route and form completion;
- visible focus;
- no focus traps outside dialogs;
- dialog focus containment and restoration;
- labels, instructions, errors, and descriptions programmatically associated;
- validation summary links to fields;
- status announcements through appropriate live regions;
- touch target sizing and responsive zoom;
- contrast and non-color-only state;
- reduced-motion respect;
- 200% zoom without loss of operation;
- route-change focus management;
- prototype scenario controls accessible when enabled;
- no accessibility exemption for mock-only pages.

## Testing

Use the generated stack's compatible unit runner; prefer Vitest for Vite or TanStack-based output and Playwright for browser E2E.

### Component and unit tests

Cover:

- quantity-mode validation;
- locale decimal parsing and formatting;
- unit and date formatting;
- error-code localization;
- CSRF, idempotency, and If-Match header construction;
- empty, loading, error, populated, and conflict states;
- conditional custom-location field;
- focus behavior where component tests can verify it;
- scenario fixture selection;
- prototype/live adapter separation;
- production prototype-mode disable behavior;
- navigation controls that must not be inert.

### Contract integration tests

- generation succeeds from committed OpenAPI;
- generated client compiles;
- no handwritten duplicate DTO drift;
- representative measured and availability responses render correctly;
- Problem Details map to stable UI messages;
- Layer B mock contracts remain outside generated live contracts.

### E2E implementation evidence

Against the real backend and Keycloak environment for Layer A:

- unauthenticated redirect and login;
- create measured lot;
- create availability lot;
- list, search, and filter;
- edit metadata;
- consume, discard, and correct;
- stale version conflict with two browser contexts;
- delete erroneous lot;
- logout;
- responsive checks at 360, 768, 1280, and an intermediate width;
- keyboard-only primary journey;
- locales `en`, `pt-BR`, and `es`.

Against prototype mode:

- every broad prototype route is reachable;
- primary forms can be completed and alter synthetic state;
- scenario switcher loads every required scenario;
- prototype gallery exposes documented states;
- AI and API unavailable simulations are clear;
- production build does not expose prototype controls;
- no control in the accepted review path is inert.

Do not duplicate PLAN-0005 independent execution claims. PLAN-0004 tests are implementation evidence; PLAN-0005 determines the independent quality outcome.

## Required commands before review

Use the generated package-manager lockfile. Equivalent scripts must exist:

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

Add a reproducible check proving prototype mode is disabled or inaccessible in the production build. Record dependency audit output and generated-repository source SHA.

## Execution phases

### Phase 0: Claim, owner setup, and baseline

- [ ] Assign the frontend agent and update the registry.
- [ ] Confirm PLAN-0006 merge and read the refined design brief.
- [ ] Owner creates the Lovable project and dedicated repository.
- [ ] Create the implementation branch from current monorepo `main`.
- [ ] Record monorepo baseline, Lovable project and repository identity, generated runtime, lockfile, and source SHA.

**Exit criteria:** Required accounts and repositories exist, PLAN-0006 is merged, and no attempt is made to import the monorepo into Lovable.

### Phase 1: Project Knowledge and approved Lovable plan

- [ ] Add and paste Project Knowledge.
- [ ] Run the refined initial Plan-mode prompt.
- [ ] Review Lovable's proposed information architecture, visual direction, routes, design tokens, prototype architecture, accessibility, localization, and API boundary.
- [ ] Remove generated backend, auth, database, server-function, or AI proposals.
- [ ] Confirm that no rigid stakeholder wireframe is being imposed or invented as a requirement.

**Exit criteria:** The approved Lovable plan is direct, intuitive, responsive, preserves design freedom, and matches product boundaries.

### Phase 2: Generate design system, shell, and broad mock prototype

- [ ] Generate semantic design tokens, typography, icon usage, primitives, shell, and client-side routing.
- [ ] Generate Layer A routes and states using the typed mock adapter.
- [ ] Generate Layer B broad prototype routes and forms using isolated synthetic adapters.
- [ ] Implement required scenarios and development-only prototype gallery.
- [ ] Ensure every accepted control produces a deliberate outcome.
- [ ] Validate navigation, forms, responsiveness, localization, and accessibility in Lovable preview.
- [ ] Collect stakeholder feedback and iterate in bounded tasks.

**Exit criteria:** The stakeholder can navigate and validate the broad accepted first-release experience without live backend dependencies, dead controls, or hidden mock/live ambiguity.

### Phase 3: Export and controlled subtree integration

- [ ] Connect Lovable to the dedicated repository.
- [ ] Record generated source SHA.
- [ ] Test the subtree workflow in a disposable branch.
- [ ] Import into `apps/frontend`.
- [ ] Remove forbidden generated services and dependencies.
- [ ] Add sync documentation and scripts.
- [ ] Add prototype-mode production-disable checks.

**Exit criteria:** The monorepo builds the imported frontend independently, identifies its source, and keeps prototype-only behavior isolated.

### Phase 4: OpenAPI and session integration

- [ ] Wait for PLAN-0003 contract milestone.
- [ ] Generate client and types.
- [ ] Replace the Layer A mock adapter with the live same-origin API adapter.
- [ ] Implement real session, login, logout, and CSRF behavior.
- [ ] Add contract drift checks.
- [ ] Keep Layer B mock-only unless a later approved contract exists.

**Exit criteria:** Real Keycloak login and authenticated inventory behavior work without browser token storage, while broader prototype routes remain clearly simulated.

### Phase 5: Complete mutations, quality, and handoff

- [ ] Complete Layer A create, edit, adjust, delete, history, and conflict behavior.
- [ ] Complete all three locales across accepted prototype review routes.
- [ ] Complete unit, component, contract, prototype, and E2E tests.
- [ ] Run responsive, keyboard, screen-reader-oriented, reduced-motion, and zoom review.
- [ ] Run build, audit, provenance, prototype-disable, and source review.
- [ ] Open the PR with evidence and Lovable provenance.

**Exit criteria:** All acceptance criteria pass and PLAN-0005 receives stable implementation baselines.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Lovable creates backend or Supabase coupling | High | Critical | Project Knowledge, prompt prohibition, import review gate |
| Agent attempts unsupported existing-repository import | High | High | Dedicated repository and controlled subtree workflow |
| Generated runtime differs from assumed Vite SPA | High | Medium | Preserve supported runtime while requiring SPA-like navigation |
| Visual guidance becomes a rigid wireframe | Medium | High | Define outcomes and principles, leave composition to Lovable |
| Lovable produces a generic recipe or AI app | High | Medium | Explicit personality, anti-patterns, color, type, and imagery direction |
| Broad mock prototype is mistaken for implemented product | High | High | Layer labels, isolated adapters, prototype configuration, production-disable gate |
| Broad prototype delays live inventory integration | Medium | High | Separate layers and retain PLAN-0003 OpenAPI milestone |
| Generated UI contains dead actions | High | High | No-dead-control requirement and prototype E2E checks |
| Frontend diverges from backend contract | High | High | OpenAPI generation, drift check, milestone dependency |
| Browser token exposure | Medium | Critical | Backend session only, security tests, no Keycloak JS adapter |
| Generated UI lacks accessibility or error states | High | High | Exact state checklist and automated/manual gates |
| Two sources of truth emerge | Medium | High | Monorepo release authority and documented sync protocol |
| Lovable credits are wasted by broad prompts | Medium | Medium | Plan mode first and bounded tasks after initial approved architecture |

## Acceptance criteria

- [ ] Frontend is generated through Lovable and provenance is recorded.
- [ ] Lovable uses a dedicated repository; existing-monorepo import is not attempted.
- [ ] Lovable proposes and documents information architecture and responsive composition without being constrained by a rigid wireframe.
- [ ] General visual direction is coherent with calm, warm, modern, practical KitchenFlow positioning.
- [ ] Semantic design tokens, typography, icon policy, imagery policy, motion, and copy direction are implemented consistently.
- [ ] Internal navigation behaves as a SPA after initial load and supports deep links and browser history.
- [ ] `apps/frontend` is independently installable, testable, buildable, and deployable.
- [ ] No generated backend, Supabase, direct database, AI provider call, Keycloak JavaScript adapter, or browser token storage exists.
- [ ] Layer A implements every PLAN-0002 route, state, field, action, conflict behavior, and history requirement.
- [ ] Layer B provides a navigable synthetic prototype of the accepted first-release product surface.
- [ ] All accepted prototype forms produce validation and a deliberate synthetic result.
- [ ] No accepted review-path control is inert.
- [ ] Required prototype scenarios and gallery or equivalent route index exist.
- [ ] Prototype fixtures and controls are disabled or inaccessible in production builds.
- [ ] API client and types are generated reproducibly from PLAN-0003 OpenAPI and drift-checked.
- [ ] English, Portuguese (Brazil), and Spanish resources are complete for accepted routes.
- [ ] Target and intermediate widths, keyboard flow, screen-reader semantics, focus, zoom, reduced motion, and error announcements pass.
- [ ] Unit, component, contract, prototype, E2E, and production-build checks pass.
- [ ] Dependency, license, security, provisional-brand, and generated-source review is recorded.
- [ ] Stable PR baselines are handed to PLAN-0005.

## Execution state

- **Current checkpoint:** Plan superseded by PLAN-0014; no further execution under this plan ID.
- **Last completed step:** Planning and design-brief refinement only; implementation never claimed.
- **Exact next action:** Follow PLAN-0014 for frontend baseline import and completion. Do not claim PLAN-0004.
- **Blockers:** None (superseded).
- **Partially modified areas:** None.
- **Validation performed:** Stakeholder decision recorded that Emergent snapshot `69f798f66b7987c4ed785c52c90a5539bf46f52e` replaces Lovable-first PLAN-0004 execution.
- **Known failures or limitations:** Historical Lovable-dedicated-repository assumptions no longer apply.
- **Working tree state:** Not applicable.

## Progress log

### 2026-07-31T20:15:00Z — Cursor agent (PLAN-0014)

- **Checkpoint:** PLAN-0004 marked Superseded by PLAN-0014.
- **Changes included in the commit:** Status, supersession notice, execution state, and registry move.
- **Validation performed:** Confirmed PLAN-0014 owns Emergent import and baseline establishment.
- **Result:** PLAN-0004 retained for history; no further implementation under this ID.
- **Next action:** None on this plan; continue on PLAN-0014.
- **Blockers or handoff notes:** Preserve applicable inventory UX and isolation requirements when implementing under PLAN-0014.

### 2026-07-29T00:25:00Z — AI planning agent

- **Checkpoint:** Lovable and frontend implementation plan created.
- **Changes included in the commit:** Added owner setup, prompt protocol, dedicated-repository and subtree workflow, runtime policy, API integration, inventory behavior, localization, accessibility, tests, and phases.
- **Validation performed:** Verified the current inability to import an existing GitHub repository into Lovable and separated the generation workspace from the authoritative monorepo release copy.
- **Result:** Technical plan ready for owner setup and agent assignment.
- **Next action:** Refine general product design and broad prototype requirements before Lovable execution.
- **Blockers or handoff notes:** Do not start live integration before PLAN-0003 records a stable OpenAPI contract SHA.

### 2026-07-29 — AI product and UX planning agent

- **Checkpoint:** General Lovable design brief and prototype strategy refined under PLAN-0006.
- **Changes included in the commit:** Added product personality, visual direction, anti-patterns, SPA and responsive principles, design authority, two fidelity layers, broad mocked product surface, scenario fixtures, prototype gallery, no-dead-control rule, prototype isolation, updated Project Knowledge, refined Plan-mode prompt, phases, risks, tests, and acceptance criteria.
- **Validation performed:** Confirmed no screen sketch, ASCII wireframe, fixed navigation composition, or pixel-level layout was introduced. Confirmed Layer A remains gated by PLAN-0003 and Layer B remains synthetic.
- **Result:** The plan gives Lovable enough product direction to design confidently without replacing its layout and information-architecture capability.
- **Next action:** Owner creates the Lovable project and dedicated repository after PLAN-0006 merge.
- **Blockers or handoff notes:** Prototype breadth must not be presented as backend implementation status.

## Completion and handoff checklist

- [ ] All implementation phases and acceptance criteria are resolved truthfully.
- [ ] Lovable provenance and synchronization workflow are documented.
- [ ] Design rationale and major stakeholder feedback are recorded without inventing a rigid historical wireframe.
- [ ] Prototype and live boundaries are documented and production-disable behavior is verified.
- [ ] Tests, accessibility, localization, dependency audit, and build evidence are complete.
- [ ] PLAN-0005 receives stable baselines.
- [ ] `docs/plan-status.md` matches this plan.
- [ ] PR reports validation and limitations.
- [ ] No hidden partial work remains.
- [ ] Branch and external-repository cleanup or synchronization responsibility is recorded.
