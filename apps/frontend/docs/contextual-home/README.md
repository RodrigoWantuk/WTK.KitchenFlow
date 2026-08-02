# Contextual home and public entry (frontend)

## Presentation boundary

Stable application models live in `src/contracts/contextualHome.ts`.
UI components consume those models through `ContextualHomeAdapter`.
They must not depend on future live OpenAPI DTOs (PLAN-0021).

`HomeSuggestionCandidate` carries presentation-only fields: timing, effort/cleanup/readiness codes, available/missing requirements, preparation requirements, shopping state, uncertainty/conflict codes, attention influence, and freshness. Values are stable codes and localization keys — never raw pantry contents.

`HomeSourceResult.retryable` distinguishes transient recoverable failures (Retry allowed) from permanent capability gaps (for example production unavailable-until-PLAN-0021). Empty and incomplete states are not error-style retries.

## Adapters

| Mode | Adapter | Notes |
|---|---|---|
| production | `createUnavailableContextualHomeAdapter` | Controlled capability-unavailable; `retryable: false` everywhere until PLAN-0021 |
| prototype / test | `createMockContextualHomeAdapter` | Synthetic fixtures only; never silently wired in production. Prefer immutable adapter per scenario (`createMockContextualHomeAdapter({ scenario })`) |

## Routes

| Path | Surface |
|---|---|
| `/` | Public entry (`PublicEntryPage`) — rendered **outside** `SessionProvider`; no `getSession()` / `/api/v1/session` |
| `/acesso` | Backend-managed login challenge (production) / demo access (prototype) — session scoped |
| `/app/hoje` | Contextual home — session scoped |
| `/app/despensa/*` | Production inventory (PLAN-0016) — preserved |

Public routes intentionally sit above authenticated providers so a session outage cannot blank the product briefing.

## Async consistency

`ContextualHomePage` uses a generation counter and AbortController:

- older successful responses cannot overwrite newer context;
- older failures cannot replace newer successes;
- locale, timezone, timezone override, adapter instance, and scenario changes bump generation and abort in-flight loads;
- sources load independently (not one blocking `Promise.all`);
- unmount prevents further state publication;
- an open chooser is closed when context is invalidated.

## Quick chooser

Built on Radix Dialog:

- focus moves into the dialog; Tab/Shift+Tab stay inside;
- Escape closes (including during submit, which cancels the attempt);
- background content is not interactable while open;
- focus returns to the opener control;
- accessible title and description;
- Cancel remains available during busy loads and aborts/invalidates the attempt;
- late results and late failures after cancel or a newer attempt are ignored;
- `onComplete` is never invoked after cancel;
- answers stay request-scoped (no profile/menu/inventory/localStorage mutation);
- Retry appears only when `definition.retryable` is true for unavailable capability, or after a transient suggestion failure.

## Scenario switching (prototype)

`PrototypeContextualHomeRoute` recreates an immutable mock adapter via `useMemo` keyed by scenario id. Correctness must not depend on passive-effect ordering between parent mutation and child reloads.

## Reduced motion

Public entry demo CTA resolves `prefers-reduced-motion` before `scrollIntoView`:

- reduce → `behavior: "auto"`;
- otherwise → `behavior: "smooth"`;
- missing `matchMedia` → safe smooth fallback.

Browser smoke covers the public CTA under the reduced-motion scenario.

## Source order

1. menu
2. inventory
3. profile
4. quick chooser (explicit action; request-scoped answers)

A failed tier must not erase successful siblings.

## Localization

Entry and home catalogs: `entryCatalog.ts`, `homeCatalog.ts`, merged into `productionCatalog.ts`.
Locales: `en`, `pt-BR`, `es`.

## Privacy telemetry

`createNoOpHomeTelemetry` accepts only stable event names and non-private codes.
Do not emit pantry contents, preferences, allergies, recipe text, chooser answers, cookies, or tokens.

## Known limitations

- Production home sources remain unavailable until PLAN-0021.
- Mock fixtures are synthetic and non-authoritative.
- Suggestion fields are presentation projections only; React must not calculate sufficiency, food safety, or mutate authoritative state.
