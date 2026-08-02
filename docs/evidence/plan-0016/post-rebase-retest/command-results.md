# Command results — PLAN-0016 post-rebase retest

Exact tip after packaging: `38e5edfb49407d895995e0cf1b49054dc7ce5c5b`  
Execution tip for commands below: `38e5edfb49407d895995e0cf1b49054dc7ce5c5b`

## Backend

```bash
dotnet test apps/backend/KitchenFlow.slnx -c Release
```

- Result: **204 Passed** (46 Domain / 14 Application / 144 Host)
- Isolation: `ForeignAndNonexistentLotMutationsAreNondisclosingForPreconditionVariants` Passed
- Owner precondition regression: missing If-Match → 428; stale → 412 preserved

## Generated client (#24)

```bash
cd packages/api-client && yarn generate && yarn generate && yarn check:drift && yarn typecheck
```

- Double generate: clean working tree for generated outputs
- `check:drift`: passed (package + frontend mirror)
- `typecheck`: passed

## Production isolation

```bash
cd apps/frontend && yarn inspect:production-bundle
```

- Result: Production bundle isolation passed

## Firefox native zoom (#21 / #22)

```bash
cd apps/frontend
# prototype + production builds as required by harness
DISPLAY=:99 yarn validate:firefox-native-zoom
```

- Artifact: `firefox-zoom-pointer-keyboard.json`
- `widthRatio=2.0`; Cook/Pantry pointer and keyboard all **Passed**

## Production inventory journey (#20 / #26)

Topology: PostgreSQL + Keycloak (plan0018 compose) + API `https://127.0.0.1:7443` rebuilt from tip `38e5edf`.

```bash
PLAN0016_SUT_SHA=38e5edfb49407d895995e0cf1b49054dc7ce5c5b \
  node scripts/plan-0018/inventory-api-journey.mjs
```

- Artifact: `production-inventory-journey-result.json`
- **21/21 Passed**, including isolation mutate **404** and owner **428** / **412**
- OTHER-REQUIRED accepted as fail-closed **400|422**

## GitHub Actions (execution tip)

See `workflow-ids.md`.
