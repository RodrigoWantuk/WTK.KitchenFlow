# PLAN-0016 → Independent PLAN-0005 retest handoff

## Purpose

PLAN-0016 remediates residual PLAN-0005 findings (#20, #21, #22, #24).
An **independent** testing agent must re-run the affected cases. Implementation-agent tests alone must not rewrite PLAN-0005 from Conditional Pass to Pass.

## System under test

- Branch: `agent/plan-0016-production-inventory-frontend` (or the merged SHA once owner-merged)
- Base main at plan start: `60d98dd9e2e7c460d670e701c027a44f25cdfedc`
- Product identity: KitchenFlow / `WTK.KitchenFlow` (no rename in scope)

## Required retest coverage

| Case | Issue | What to verify |
|---|---|---|
| Production inventory journey | #20 | Production build uses BFF session + live inventory; `/app/despensa` is not `FeatureUnavailable` |
| Generated TypeScript client | #24 | `packages/api-client` generates from OpenAPI; drift check green; representative session/inventory calls compile |
| Locale decimals | PLAN-0005 blocked case | `en` / `pt-BR` / `es` quantity entry via `parseLocaleDecimal` |
| Printed dates | PLAN-0005 blocked case | YYYY-MM-DD calendar dates do not shift by timezone |
| Stale conflict | PLAN-0005 blocked case | 412 surfaces reload/review UI; no silent retry |
| Cook CTA pointer @ Firefox ~200% | #21 | Pointer and keyboard scored independently |
| Pantry item pointer @ Firefox ~200% | #22 | Pointer and keyboard scored independently |
| Production isolation | #20 related | No mock auth / fixtures in production bundle |
| Auth / CSRF / two-user smoke | PLAN-0005 P0 | Backend-managed login, CSRF mutations, user A/B isolation |

## Commands (frontend)

```bash
cd apps/frontend
yarn install --frozen-lockfile
yarn check:api-client-drift
yarn typecheck:api-client
yarn typecheck
yarn lint
yarn format:check
yarn format:check:api-client
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
yarn smoke:browser:ci
```

## Commands (contracts / client)

```bash
cd packages/api-client
yarn install --frozen-lockfile
yarn generate
yarn check:drift
yarn typecheck
yarn format:check
# Prove idempotent generation:
yarn generate
git status --short   # must show no generated drift
```

## Plan ID collision handoff

Draft PR #23 also uses “PLAN-0016” for unrelated AI recipe-protocol documentation. Leave it untouched from this inventory branch. A later run must renumber that work to PLAN-0017, rebase, and reconcile separately.
## Integrated browser validation

Use synthetic users only. Run production-mode frontend with real backend, PostgreSQL, and Keycloak on a same-origin topology.

Validate:

1. Login via `POST /api/v1/auth/login` challenge (no tokens in storage).
2. `GET /api/v1/session` projection (display name, locale, CSRF).
3. Inventory list → create → detail → update → consume/adjust → history → soft delete.
4. CSRF rejection without header; 412 stale `If-Match` shows reload/review; 428 without precondition.
5. User A cannot read User B lots.
6. Firefox native zoom ~200% pointer **and** keyboard for Cook CTA and pantry item (prototype surfaces for #21/#22).

## Implementation remediation notes (not Pass claims)

- Production runtime wires `createBffSessionAdapter` + `createLiveInventoryRepository`.
- Root-cause candidate for #21/#22: removed `transform` from `.card-hover:hover` (Firefox zoom hit-testing) and added `scroll-margin-block` on interactive targets.
- Locale decimals: `apps/frontend/src/lib/localeDecimal.ts` with unit tests.
- Printed dates: `apps/frontend/src/lib/calendarDate.ts` with UTC calendar formatting.

## Deferred (unless a human executes)

- Manual visual QA, NVDA, VoiceOver.

## Outcome recording rules

- Keep PLAN-0005 **Conditional Pass** until this independent retest completes.
- Keep PLAN-0011 **Blocked** until the independent retest accepts remediations.
- Only the independent testing agent (or owner) may upgrade PLAN-0005 outcome.
