# Command results — PLAN-0016 remediation after PLAN-0018

Recorded against working tree culminating in tip `ba812e4` plus this evidence commit (final tip recorded after push).

## Backend

```bash
dotnet test apps/backend/KitchenFlow.slnx -c Release
```

- KitchenFlow.UnitTests: Passed 46
- KitchenFlow.ArchitectureTests: Passed 14
- KitchenFlow.IntegrationTests: Passed 144
- Total: **204** Passed, 0 Failed

Includes `#26` regression `ForeignAndNonexistentLotMutationsAreNondisclosingForPreconditionVariants`.

## API client

```bash
cd packages/api-client
yarn install --frozen-lockfile
yarn generate
yarn check:drift
yarn typecheck
yarn format:check
yarn generate
git status --short   # no tracked drift
```

All exit 0.

## Frontend

```bash
cd apps/frontend
yarn install --frozen-lockfile
yarn check:api-client-drift
yarn typecheck:api-client
yarn typecheck
yarn lint
yarn format:check
yarn format:check:api-client
yarn test                 # 23 suites / 126 tests
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
BUILD_PATH=build-prototype yarn build:prototype
BUILD_PATH=build-production yarn build:production
DISPLAY=:99 HOME=/root XAUTHORITY= yarn validate:firefox-native-zoom
```

All exit 0. Firefox matrix: Cook/Pantry × pointer/keyboard = Passed; `widthRatio=2.0`; Firefox 141.0.
