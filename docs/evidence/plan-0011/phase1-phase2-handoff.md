# PLAN-0011 evidence — Phase 1 + Phase 2

## Scope

Public entry (Phase 1) and mock-backed authenticated contextual home (Phase 2).
Live source contracts remain PLAN-0021.

## Functional tip

Recorded after local gates on branch `agent/plan-0011-contextual-home`.
Exact SHA is filled in the plan/registry at commit time.

## Local validation (commands)

```bash
cd apps/frontend
yarn typecheck
yarn lint
yarn format:check
yarn test
yarn guard:ts-only
yarn guard:interactive-nesting
yarn guard:build-mode
yarn guard:production-isolation
yarn build
yarn inspect:production-bundle
yarn build:prototype
yarn build:production
yarn inspect:production-bundle
yarn audit:policy

cd packages/api-client
yarn check:drift
yarn typecheck
```

Results at packaging time: all of the above Passed locally before push.

## Architecture notes

- Presentation models: `apps/frontend/src/contracts/contextualHome.ts`
- Production adapter: `createUnavailableContextualHomeAdapter` (no fixtures)
- Prototype/test adapter: `createMockContextualHomeAdapter` (synthetic only)
- Production composition must not import `adapters/mock`
- Default safe return URL: `/app/hoje`
- Inventory routes under `/app/despensa` preserved

## Handoff to PLAN-0021

Replace unavailable home adapter with live source adapters using the stable
presentation models and independent per-tier failure behavior established here.
Do not invent OpenAPI shapes in the PLAN-0011 PR.
