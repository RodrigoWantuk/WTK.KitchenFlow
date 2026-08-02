# Contextual home and public entry (frontend)

## Presentation boundary

Stable application models live in `src/contracts/contextualHome.ts`.
UI components consume those models through `ContextualHomeAdapter`.
They must not depend on future live OpenAPI DTOs.

## Adapters

| Mode | Adapter | Notes |
|---|---|---|
| production | `createUnavailableContextualHomeAdapter` | Controlled capability-unavailable until PLAN-0021 |
| prototype / test | `createMockContextualHomeAdapter` | Synthetic fixtures only; never silently wired in production |

## Routes

| Path | Surface |
|---|---|
| `/` | Public entry (`PublicEntryPage`) — rendered **outside** `SessionProvider`; no `getSession()` / `/api/v1/session` |
| `/acesso` | Backend-managed login challenge (production) / demo access (prototype) — session scoped |
| `/app/hoje` | Contextual home — session scoped |
| `/app/despensa/*` | Production inventory (PLAN-0016) — preserved |

Public routes intentionally sit above authenticated providers so a session outage cannot blank the product briefing.


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
