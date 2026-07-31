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
yarn install
yarn start
```

### Quality scripts

```bash
yarn typecheck
yarn lint
yarn format:check
yarn test
yarn build:prototype
yarn build:production
yarn guard:ts-only
yarn guard:production-isolation
yarn audit:policy
```

## Mock vs live adapters

| Path | Role |
|---|---|
| `src/adapters/mock/` | Fixture-backed presentation projections for **prototype/test** only |
| `src/adapters/live/` | Explicit unavailable / future OpenAPI adapters for **production** |
| `src/contracts/` | Presentation models |
| `src/features/` | Shared UI for preparation route, pantry availability bar, shopping review, cook handoff |
| `src/app/session/` | `SessionAdapter` boundary (mock vs unavailable) |

Presentation components consume projections. They must **not** perform authoritative inventory, reservation, or unit-conversion arithmetic.

## Session and API seams

- Browser auth remains BFF/session oriented (no token storage, no direct Keycloak admin).
- Production mode does not treat `localStorage` `authed` as authentication.
- AI providers are never called from the frontend.
- Live backend wiring remains incomplete until inventory/home contracts stabilize; production shows controlled unavailable states instead of silent mocks.

## Dependency triage

See [`docs/dependency-vulnerability-triage.md`](docs/dependency-vulnerability-triage.md) and `audit-allowlist.json`.

## CI

GitHub Actions workflow: `.github/workflows/frontend.yml` — blocking typecheck, lint (`--max-warnings 0`), format, tests, dual builds, isolation guards, and allowlist-aware audit.

## TypeScript

Application sources under `src/` must be TypeScript (`.ts`/`.tsx`). Enforce with `yarn guard:ts-only`.
