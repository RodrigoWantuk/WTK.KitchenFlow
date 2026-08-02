# PLAN-0016 PR #25 follow-up remediation (semantic fingerprint + history reload)

## Problem

1. Create idempotency fingerprint used raw form text (`amount.trim()`, inactive quantity fields), so equivalent decimals (`1,0` / `1,00`) or inactive-mode edits could rotate the key after an ambiguous create response.
2. Full-page `reload()` cleared `historyError` and used `Promise.all`; when a lot was already loaded, a repeated history failure could hide the warning while leaving stale history visible.

## Approach

1. Build one normalized `CreateLotInput` (parsed measured value, active quantity mode only, trimmed strings, empty optionals → `null`) and use that object both for fingerprinting and `repo.createLot`.
2. Load lot and history independently; never clear `historyError` until history fetch succeeds; keep prior history visible and mark it stale; keep lot/ETag after mutation success.

## Tests added

- `ProductionInventoryForm.test.tsx`: pt-BR `1,0`↔`1,00`; en `1.0`↔`1.00`; inactive measured/qualitative fields; trim-equivalent product name; semantic amount change.
- `ProductionInventoryDetail.test.tsx`: repeated history reload failures keep warning; recovery clears warning only after success; mutation still called once.

## Local validation

- Backend: 204 Passed (46/14/144)
- api-client: generate ×2, drift, typecheck
- Frontend: typecheck, lint, format, Jest, guards, production/prototype builds, isolation, audit
- Firefox native zoom: Passed (Cook/Pantry pointer+keyboard)

## Functional tip

`85a1027a10d4b7e8caa64033bacf19666687852d`

## Prior tip

`df79be6493be07ed4a1ed9fd647a01c92a6c381c`

## Non-regression

Prior Pass coverage for #20/#21/#22/#24/#26 and mutation-vs-history separation remain; PLAN-0018 Fail on `814af25` immutable.
