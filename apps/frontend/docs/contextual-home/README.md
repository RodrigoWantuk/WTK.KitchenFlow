# Contextual home and public entry (frontend)

## Presentation boundary

Stable application models live in `src/contracts/contextualHome.ts`.
UI components consume those models through `ContextualHomeAdapter`.
They must not depend on future live OpenAPI DTOs (PLAN-0021).

### Display text

Dynamic titles and labels use `HomeDisplayText`:

- `catalog` — localization key resolved by `renderHomeText` / i18n;
- `literal` — plain text rendered as React text (never HTML, never passed through key lookup).

Prototype fixtures continue to use catalog references. Future live adapters may supply literal recipe/product names. Telemetry must never receive literal recipe or product text.

Stable reason, readiness, effort, cleanup, uncertainty, conflict, source, and status codes remain catalog-driven codes.

`HomeSuggestionCandidate` also carries timing, requirements, preparation, shopping, attention, and freshness projections.

### Source retryability

`HomeSourceResult.retryable` distinguishes transient recoverable failures (Retry allowed) from permanent capability gaps (production unavailable-until-PLAN-0021). Empty and incomplete states are not error-style retries.

### Quick-chooser capability

`HomeQuickChooserDefinition.capabilityStatus`:

| Status | Meaning | Retry |
|---|---|---|
| `available` | Questions may be answered | n/a |
| `temporarily_unavailable` | Transient definition load failure | yes (`retryable: true`) |
| `not_implemented` | Permanent gap (production until PLAN-0021) | no |

A thrown error from `getQuickChooserDefinition` must map to `temporarily_unavailable` + `retryable: true`, never to permanent `not_implemented`.

### Suggestion result handling

Resolved `loadQuickChooserSuggestions` Promises are classified by status:

| Status | Behavior | `quick_chooser_completed` |
|---|---|---|
| `ready` (with candidates) | Publish + close | yes (`outcome: ready`) |
| `empty` | Publish truthful empty result + close | yes (`outcome: empty`) — completed search with zero candidates |
| `failed` + `retryable` | Keep chooser open; retain answers; Retry | no |
| `unavailable` + `retryable` | Keep open; Retry | no |
| `unavailable` + `!retryable` | Truthful unavailable; Cancel only | no |
| invalid tier/shape | Fail closed; do not crash the home | no |

## Adapters

| Mode | Adapter | Notes |
|---|---|---|
| production | `createUnavailableContextualHomeAdapter` | `capabilityStatus: not_implemented`, `retryable: false` everywhere until PLAN-0021 |
| prototype / test | `createMockContextualHomeAdapter` | Synthetic fixtures only; never silently wired in production. Prefer immutable adapter per scenario |

## Routes

| Path | Surface |
|---|---|
| `/` | Public entry (`PublicEntryPage`) — rendered **outside** `SessionProvider`; no `getSession()` / `/api/v1/session` |
| `/acesso` | Backend-managed login challenge (production) / demo access (prototype) — session scoped |
| `/app/hoje` | Contextual home — session scoped |
| `/app/despensa/*` | Production inventory (PLAN-0016) — preserved |

## Async consistency

`ContextualHomePage` uses a generation counter and AbortController so older responses cannot overwrite newer context. Sources load independently. An open chooser is closed when context is invalidated. Stale definition loads must not reopen the chooser.

## Quick chooser accessibility

Built on Radix Dialog with focus trap, Escape, focus restore to opener, cancel-during-load abort, and stale-attempt suppression.

## Scenario switching (prototype)

`PrototypeContextualHomeRoute` recreates an immutable mock adapter via `useMemo` keyed by scenario id.

## Reduced motion

Public entry demo CTA:

- explicit reduced preference → `behavior: "auto"`;
- explicit no-reduction → `behavior: "smooth"`;
- missing or throwing `matchMedia` → `behavior: "auto"` (conservative; never treat unknown as smooth-safe).

## Source order

1. menu
2. inventory
3. profile
4. quick chooser (explicit action; request-scoped answers)

## Localization

Entry and home catalogs: `entryCatalog.ts`, `homeCatalog.ts`, merged into `productionCatalog.ts`.
Locales: `en`, `pt-BR`, `es`.

## Privacy telemetry

`createNoOpHomeTelemetry` accepts only stable event names and non-private codes.
Do not emit pantry contents, preferences, allergies, recipe text, chooser answers, cookies, or tokens.

## Known limitations

- Production home sources remain unavailable until PLAN-0021.
- Mock fixtures are synthetic and non-authoritative.
- Suggestion fields are presentation projections only.
