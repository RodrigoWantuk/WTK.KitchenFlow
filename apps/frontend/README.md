# KitchenFlow Frontend

Official KitchenFlow frontend package living at `apps/frontend`.

## Authority

- This directory is the **only** official frontend source for KitchenFlow.
- Imported from Emergent snapshot `69f798f66b7987c4ed785c52c90a5539bf46f52e` (see [`docs/development/emergent-frontend-import-provenance.md`](../../docs/development/emergent-frontend-import-provenance.md)).
- `kitchen-emergent` is a historical snapshot. There is **no** bidirectional sync.
- Emergent and Lovable remain optional generation tools only (ADR-0007).

## Stack

- React 19 + TypeScript (gradual migration; `allowJs` enabled)
- Create React App + CRACO
- Yarn classic (`packageManager` field)

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
yarn test
yarn build
```

## Mock vs live adapters

| Path | Role |
|---|---|
| `src/adapters/mock/` | Fixture-backed presentation projections for prototype flows |
| `src/adapters/live/` | Placeholder for future generated OpenAPI clients |
| `src/contracts/` | Presentation models (`PreparedComponentAvailability`, `ShoppingRequirementProjection`, preparation route) |
| `src/features/` | Shared UI for preparation route, pantry availability bar, shopping review, cook handoff |

Presentation components consume projections. They must **not** perform authoritative inventory, reservation, or unit-conversion arithmetic.

## Session and API seams

- Browser auth remains BFF/session oriented (no token storage, no direct Keycloak admin).
- AI providers are never called from the frontend.
- Live backend wiring is intentionally incomplete until inventory/home contracts stabilize.

## CI

GitHub Actions workflow: `.github/workflows/frontend.yml` (install, typecheck, lint, test, build, Emergent isolation guard).
