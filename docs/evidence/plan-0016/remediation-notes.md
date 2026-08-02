# PLAN-0016 remediation notes

## Issue #20 — production inventory journey

- Replaced `createUnavailableSessionAdapter()` with `createBffSessionAdapter()`.
- Added `createLiveInventoryRepository()` over the generated OpenAPI client.
- Production routes: `/app/despensa`, `/app/despensa/novo`, `/app/despensa/:lotId`, `/app/despensa/:lotId/editar`.
- Production access page initiates backend-managed login; no prototype localStorage auth.
- Mutation UI covers Consume, Discard, Correct, qualitative availability change, metadata edit, soft delete, and history refresh.
- List uses draft search vs submitted query, status/location filters, cursor load-more, AbortController race protection.
- `Other` storage requires a custom location label (≤80) mapped to backend `customLocation`.

## Issue #24 — generated TypeScript client

- Package: `packages/api-client`
- Generator: `openapi-typescript@7.9.1`
- Runtime: `openapi-fetch@0.14.0`
- Committed output + CRA mirror under `apps/frontend/src/generated/api-client`
- Drift: `yarn check:api-client-drift` (CI enforced)
- Format policy: CRA mirror excluded via `apps/frontend/.prettierignore`; application-owned api-client sources checked via `yarn format:check:api-client` (generated schema excluded in `packages/api-client/.prettierignore`)
- Prior CI failure `30725997092` was format-check on mirror files; remediated by ignore policy rather than hand-formatting generated output

## Fail-closed projections

- `mapQuantity` rejects incomplete qualitative quantities and mixed measured+availability payloads; never invents `Available`.

## Issues #21 / #22 — Firefox native zoom pointer

- Removed CSS `transform` on `.card-hover:hover` (known Firefox zoom hit-test mismatch with transformed ancestors).
- Added `scroll-margin-block` for Cook CTA / pantry / inventory links.
- Increased AppShell bottom padding slightly for fixed mobile nav clearance.
- Independent headed Firefox retest still required (see handoff). Chromium / CSS `zoom` / keyboard-only success are **not** proof.

## Locale decimals and printed dates

- Explicit locale parsers for `en`, `pt-BR`, `es`.
- Printed package dates kept as `YYYY-MM-DD` calendar strings with UTC display formatting.
- Inventory enums/history kinds/reason codes localized via `inventoryCatalog` with completeness tests.

## Plan ID collision

- Draft PR #23 also labeled “PLAN-0016” (AI recipe-protocol docs). Remains untouched from this branch.
- Handoff: renumber PR #23 to PLAN-0017 on a separate branch/run later. Do not introduce PLAN-0017 files into PR #25.
