# PLAN-0005 requirements traceability (raw-artifact separation)

Integrated main SHA (system under test): `b94abd9a83fe29d88b095e3e9a42f10d01c05414`
OpenAPI contract git object id: `0cc5050ced6c43daf69538ad1af3fee135871e58`

Identity:

- `integratedMainSha` — main tip under test
- `evidenceGenerationHead` — `cabd2c23addd3c8ab741b5075ec6d33f37f9e359` (canonical clean raw-only P0/P1 artifacts)
- `checkedOutCommitSha` example — `6ad36ba3fa0ab9c1ad2460004798662d3780b446` (Actions merge ref)
- `currentPrTip` — consult PR #19 metadata (may be this documentation pin)

Evidence-generation CI: workflow `30716628735`; artifacts P0 `8823586490`, P1 `8823580211`, consistency `8823588906`.

Raw P0/P1 artifacts contain only run-generated evidence (no static assessment/manifest/traceability; no historical supersession files).

Status vocabulary: `Passed` | `Failed` | `Blocked` | `Not executed` | `Deferred` | `Not applicable`

## Counting units

1. **Requirements** — one status per `VS-REQ-*` row below.
2. **Test IDs** — one aggregate status per `TEST-0005-*`. `TEST-0005-109` aggregates to **Failed** while any pointer sub-scenario is Failed (keyboard Passed does not cancel it).
3. **Sub-scenarios** — independent results under a test ID. For `TEST-0005-109` there are exactly four:
   - Cook pointer: Failed (#21)
   - Cook keyboard: Passed
   - Pantry pointer: Failed (#22)
   - Pantry keyboard: Passed

## Requirement results

| Requirement | Test ID | Method / script | Artifact | Status | Issue | Head baseline |
|---|---|---|---|---|---|---|
| VS-REQ-001 | TEST-0005-001 | `ApiAuthenticationTests / keycloak-p0-auth.mjs` | `keycloak-p0-auth.json` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-002 | TEST-0005-003 | `keycloak-p0-auth.mjs token storage assertions` | `keycloak-p0-auth.json` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-003 | TEST-0005-009 | `Plan0005P0GapTests + Keycloak subject mapping` | `keycloak-p0-auth.json` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-004 | TEST-0005-010 | `Plan0005P0GapTests.OwnerIsolation` | `trx plan0005-p0` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-005 | TEST-0005-011 | `Plan0005P0GapTests foreign lot 404` | `trx plan0005-p0` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-006 | TEST-0005-009 | `Keycloak users A/B` | `keycloak-p0-auth.json` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-007 | TEST-0005-007 | `keycloak-p0-auth.mjs logout + Plan0005P0GapTests` | `keycloak-p0-auth.json` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-010 | TEST-0005-020 | `Inventory product create tests` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-011 | TEST-0005-021 | `Product name validation tests` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-012 | TEST-0005-023 | `Similar names coexist` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-013 | TEST-0005-022 | `Unicode name round-trip` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-020 | TEST-0005-024 | `Quantity create validation` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-021 | TEST-0005-028 | `Availability vs measured` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-022 | TEST-0005-024 | `Measured units` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-023 | TEST-0005-024 | `Decimal numeric storage` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-024 | TEST-0005-028 | `Availability states` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-025 | TEST-0005-029 | `Mixed payload rejection` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-026 | TEST-0005-030 | `Locale decimal UI` | `frontend-production-inventory.json` | Blocked | #20 | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-027 | TEST-0005-049 | `Consume above quantity` | `Plan0005P0GapTests` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-028 | TEST-0005-053 | `Zero removes from active` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-030 | TEST-0005-035 | `Storage locations` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-031 | TEST-0005-036 | `Other location label` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-032 | TEST-0005-037 | `Package state` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-033 | TEST-0005-038 | `Printed date` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-034 | TEST-0005-039 | `UI printed date safety copy` | `frontend-production-inventory.json` | Blocked | #20 | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-035 | TEST-0005-040 | `Notes boundary + redaction` | `TelemetryRedactionTests` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-040 | TEST-0005-045/046 | `CreateIsAtomicOnSuccess + InjectedMidTransactionFailureRollsBackAllCreateArtifacts` | `trx + outage evidence` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-041 | TEST-0005-047 | `Metadata update` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-042 | TEST-0005-052 | `Correct adjustment` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-043 | TEST-0005-048/050/052 | `Consume/Discard/Correct` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-044 | TEST-0005-049/051 | `Over-consume/discard rejected` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-045 | TEST-0005-052 | `Correct previous/resulting` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-046 | TEST-0005-054 | `Availability history` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-047 | TEST-0005-055 | `Soft delete` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-048 | TEST-0005-056 | `Deleted absent from normal queries` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-049 | TEST-0005-057 | `Immutable history API` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-050 | TEST-0005-060 | `ETag/version on read` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-051 | TEST-0005-061 | `If-Match required` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-052 | TEST-0005-061 | `428 without If-Match` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-053 | TEST-0005-063 | `412 stale` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-054 | TEST-0005-066 | `Idempotency-Key create` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-055 | TEST-0005-066/067 | `Replay same result` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-056 | TEST-0005-068 | `Same key different payload 409` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-060 | TEST-0005-075 | `Default active filter` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-061 | TEST-0005-076 | `Filters owner-scoped` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-062 | TEST-0005-077/080 | `Plan0005P1PaginationTests` | `trx-p1` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-063 | TEST-0005-078 | `Deterministic sort` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |
| VS-REQ-064 | TEST-0005-079 | `Invalid cursor 400` | `trx` | Passed |  | `b94abd9a83fe29d88b095e3e9a42f10d01c05414` |

## Test-case result summary

Counting unit = **test ID** (see above).

- Passed: 82
- Failed: 1 (`TEST-0005-109` aggregate — pointer residual under native zoom)
- Blocked: 17
- Deferred: 4
- Not executed: 0
- Total test IDs: 104

### TEST-0005-109 sub-scenarios (independent)

- Cook pointer: Failed → issue #21
- Cook keyboard: Passed
- Pantry pointer: Failed → issue #22
- Pantry keyboard: Passed
- Sub-scenario Passed: 2 / Failed: 2 (pointer failures remain visible; keyboard does not upgrade pointer)

## Workflow / group results

- P0 / P1 / evidence-consistency / secret-scan: canonical on evidence-generation head `4d07afa`
- Evidence JSON must carry `integratedMainSha`, `prHeadSha`, `checkedOutCommitSha`, `evidenceGenerationSha`

## Defect counts (provisional until integrity CI)

- Critical: 0
- High: 1 (#20 production inventory FeatureUnavailable / live adapters)
- Medium: 2 (#21 Cook pointer native zoom, #22 Pantry pointer native zoom); keyboard operable
- Coverage Blocked issue: #24 generated TypeScript client (TEST-0005-083)

## Deferred coverage

- TEST-0005-128 / 130 / 131 (owner Deferred)
- Manual exploratory / NVDA / VoiceOver / screenshot (Deferred — non-blocking)

