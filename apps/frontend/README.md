# KitchenFlow Frontend

Official KitchenFlow frontend package living at `apps/frontend`.

## Authority

- This directory is the **only** official frontend source for KitchenFlow.
- Imported from Emergent snapshot `69f798f66b7987c4ed785c52c90a5539bf46f52e` (see [`docs/development/emergent-frontend-import-provenance.md`](../../docs/development/emergent-frontend-import-provenance.md)).
- `kitchen-emergent` is a historical snapshot. There is **no** bidirectional sync.
- Emergent and Lovable remain optional generation tools only (ADR-0007).
- After PLAN-0014 merge, remediations land through **PLAN-0015**. This package is **not** declared production-ready until PLAN-0015 is owner-approved.

## Stack

- React 19 + TypeScript (`allowJs: false`)
- Create React App + CRACO
- Yarn classic (`packageManager` field)

## Frontend modes (build-time)

Set `REACT_APP_FRONTEND_MODE` at build/start time (validated):

| Mode | Script | Behavior |
|---|---|---|
| `prototype` | `yarn start` / `yarn build:prototype` | ScenarioBar, fixtures, mock session allowed |
| `production` | `yarn build:production` | No scenario tooling; unavailable adapters; no local `authed` |
| `test` | `yarn test` | Prototype-compatible composition for Jest |

Composition roots live under `src/app/runtime/`. Providers require injected adapters — no silent mock defaults in production.

## Development

```bash
cd apps/frontend
yarn install --frozen-lockfile
yarn start
```

### Quality scripts

```bash
yarn typecheck
yarn lint
yarn format:check
yarn test
yarn guard:ts-only
yarn guard:build-mode
yarn guard:production-isolation
yarn build
yarn inspect:production-bundle
yarn build:prototype
yarn build:production
yarn audit:policy
```

### Automated browser smoke (Playwright)

Playwright is a **direct** `devDependency`. Do not rely on global installs or absolute browser cache paths.

```bash
cd apps/frontend
yarn install --frozen-lockfile
yarn smoke:browser:install
yarn start   # terminal 1 — prototype mode
yarn smoke:browser   # terminal 2
```

CI uses `yarn smoke:browser:ci` (`SMOKE_MANAGE_SERVER=1`) after the quality job. Any `Failed` / `Blocked` / `Not executed` mandatory automated check exits non-zero.

Reports land under `docs/browser-smoke/` (JSON + HTML; failure screenshots/traces when enabled).

**Manual** browser validation (for example real browser zoom 200%) is tracked separately in PLAN-0015 and is not claimed Passed by the automated matrix.

## Mock vs live adapters

| Path | Role |
|---|---|
| `src/adapters/mock/` | Fixture-backed presentation projections for **prototype/test** only |
| `src/adapters/live/` | Live inventory repository and related production boundaries |
| `src/generated/api-client/` | CRA mirror of `@kitchenflow/api-client` (do not edit; regenerate) |
| `src/contracts/` | Presentation models |
| `src/features/inventory/` | Production inventory screens |
| `src/app/session/` | `SessionAdapter` boundary (`createBffSessionAdapter` in production; mock in prototype) |

Presentation components consume projections. They must **not** perform authoritative inventory, reservation, or unit-conversion arithmetic.

## Generated OpenAPI client

Canonical package: `packages/api-client` (generator `openapi-typescript` 7.9.1 + runtime `openapi-fetch` 0.14.0).

```bash
cd apps/frontend
yarn generate:api-client   # regenerate + sync CRA mirror
yarn check:api-client-drift
yarn typecheck:api-client
```

CI fails when the OpenAPI snapshot, package output, or frontend mirror drift.

## Session and API seams

- Browser auth is BFF/session oriented via `POST /api/v1/auth/login`, `GET /api/v1/session`, `POST /api/v1/auth/logout`.
- Cookies use `credentials: "include"`; OIDC tokens are never stored in JavaScript storage.
- Production inventory routes live under `/app/despensa` (list/detail/create/edit/adjust/history).
- Production does not fall back to mock pantry data or prototype `localStorage` auth.
- Same-origin API base path: `/api/v1` (proxy or reverse-proxy in integrated environments).
- Contextual home and other product areas may still show controlled unavailable states.

### Local integrated run (production mode)

1. Start backend + PostgreSQL + Keycloak per `apps/backend` / infrastructure docs.
2. Serve the production build behind the same origin as the API (or configure a same-origin proxy).
3. Open `/acesso` → backend-managed login → `/app/despensa`.

## Dependency triage

- Vulnerabilities / allowlist: [`docs/dependency-vulnerability-triage.md`](docs/dependency-vulnerability-triage.md) and `audit-allowlist.json`
- Incompatible Yarn resolutions (individual table): [`docs/dependency-resolution-triage.md`](docs/dependency-resolution-triage.md)

## CI

GitHub Actions workflow: `.github/workflows/frontend.yml` — required jobs **quality** and **browser-smoke** (blocking; no `continue-on-error` / `|| true`).

## TypeScript

Application sources under `src/` must be TypeScript (`.ts`/`.tsx`). Enforce with `yarn guard:ts-only`.
