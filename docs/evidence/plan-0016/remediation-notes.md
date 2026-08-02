# PLAN-0016 remediation notes

## Issue #20 — production inventory journey

- Replaced `createUnavailableSessionAdapter()` with `createBffSessionAdapter()`.
- Added `createLiveInventoryRepository()` over the generated OpenAPI client.
- Production routes: `/app/despensa`, `/app/despensa/novo`, `/app/despensa/:lotId`, `/app/despensa/:lotId/editar`.
- Production access page initiates backend-managed login; no prototype localStorage auth.

## Issue #24 — generated TypeScript client

- Package: `packages/api-client`
- Generator: `openapi-typescript@7.9.1`
- Runtime: `openapi-fetch@0.14.0`
- Committed output + CRA mirror under `apps/frontend/src/generated/api-client`
- Drift: `yarn check:api-client-drift` (CI enforced)

## Issues #21 / #22 — Firefox native zoom pointer

- Removed CSS `transform` on `.card-hover:hover` (known Firefox zoom hit-test mismatch with transformed ancestors).
- Added `scroll-margin-block` for Cook CTA / pantry / inventory links.
- Increased AppShell bottom padding slightly for fixed mobile nav clearance.
- Independent headed Firefox retest still required (see handoff).

## Locale decimals and printed dates

- Explicit locale parsers for `en`, `pt-BR`, `es`.
- Printed package dates kept as `YYYY-MM-DD` calendar strings with UTC display formatting.
