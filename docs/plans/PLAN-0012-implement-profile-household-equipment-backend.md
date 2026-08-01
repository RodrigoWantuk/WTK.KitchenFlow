# PLAN-0012: Implement Account, Household, Profile and Equipment Backend Slice

- **Status:** Validating
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Cursor cloud agent
- **Created:** 2026-07-31
- **Last updated:** 2026-08-01T07:30:00Z
- **Branch:** `cursor/plan-0012-profile-backend-1672`
- **Pull request:** Open — [PR #12](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/12) (Changes requested; final security/contract remediation)
- **Base commit:** `f9d429346615bf5b157656822057917ca2fe4032` (PLAN-0003 merged via PR #9)
- **Related specification:** PLAN-0002, `docs/product/audience-and-profile.md`
- **Related ADRs:** ADR-0002, ADR-0003, ADR-0004, ADR-0006
- **Dependencies:** PLAN-0003 merged (identity, session, PostgreSQL foundation)

## Objective

Implement a production-shaped backend slice for progressive profile, single-household context, preferences and restrictions, cooking context, equipment, locale settings, and adult/terms acceptance. The slice is transport-neutral at the module boundary, owner-isolated, concurrency-safe, privacy-minimizing in audit history, and fully covered by automated tests and OpenAPI 3.1 without requiring frontend delivery.

## Scope

### Included

- `KitchenFlow.Modules.Profiles` (domain, application use cases, persistence ports)
- PostgreSQL schema `profiles` with migrations, constraints, indexes, concurrency token
- API adapters for profile, preferences, equipment, completeness
- Safe `GET /api/v1/session` projection extension
- Privacy-minimizing change history and export/deletion projection hooks
- Domain, application, architecture, integration, and contract tests
- OpenAPI export, lint, and drift checks
- Runbook updates

### Excluded

- Frontend, onboarding UI, AI, recipes, planning, shopping, notifications, billing
- Multi-member household collaboration, invitations, inferred allergies or medical restrictions

## Architecture

- Module assembly references only `KitchenFlow.Modules.Identity` and `KitchenFlow.SharedKernel`
- No references to ASP.NET Core, EF Core, Api, Infrastructure, or AI
- API layer owns HTTP mapping, ETag encoding, CSRF, Problem Details
- Infrastructure owns EF records and PostgreSQL stores under `profiles` schema
- Reuse PLAN-0003 patterns: backend session, owner isolation, opaque ETag, `If-Match`, rate limiting

## HTTP contracts

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/profile` | Full owner profile projection |
| PUT | `/api/v1/profile` | Replace durable profile sections |
| PATCH | `/api/v1/profile` | Partial profile update |
| GET | `/api/v1/profile/preferences` | Preferences and restrictions |
| PUT | `/api/v1/profile/preferences` | Explicit preference/restriction commands |
| GET | `/api/v1/profile/equipment` | Active equipment list |
| PUT | `/api/v1/profile/equipment` | Replace equipment list |
| GET | `/api/v1/profile/completeness` | Progressive completeness summary |
| GET | `/api/v1/session` | Extended safe session projection |

## Acceptance criteria

- [x] Progressive profile distinguishes absent, confirmed, removed, default, temporary, and durable semantics at the contract level
- [x] Single household context per account with required cadence and locale fields
- [x] Eight restriction categories with stable non-localized codes; allergies and medical restrictions only via explicit user commands
- [x] Cooking context, equipment, adult declaration, and accepted terms versions persisted with owner consistency
- [x] All mutations owner-scoped with concurrency token and `If-Match`
- [x] Session endpoint never exposes restrictions, allergies, or private notes
- [x] Privacy-minimizing audit history without sensitive payloads
- [x] Module-owned export and deletion projection interfaces prepared for Privacy workflows
- [x] Architecture tests enforce module boundaries
- [x] Full test suite deterministic with zero skipped tests (165/165 local Release: 14 architecture + 29 unit + 122 integration)
- [x] Release build zero warnings, locked restore, migrations from empty and prior main, OpenAPI truthful

## Execution state

- **Current phase:** Validating — final security/contract remediation pushed; awaiting Backend CI and owner re-review
- **Last verified checkpoint:** Owner-bound ETag validation; missing-profile `profileExists`/`version:null` without ETag; unique equipment stable codes + ordering by array position; migration `EnforceUniqueProfileEquipmentStableCode`; OpenAPI snapshot refreshed; local 165/165; migrations idempotent artifact OK
- **Blockers:** Owner re-review after green Backend CI on the final remediation head
- **Exact next action:** Owner re-review of PR #12; do not merge or mark Completed without approval

## Progress log

### 2026-08-01T07:30:00Z — Final security and contract remediation

- Bound profile ETag parsing to the authenticated owner (`TryReadVersion(expectedOwnerUserId, ...)`).
- GET `/api/v1/profile` returns `profileExists: false`, `version: null`, and omits ETag when no profile is persisted.
- Rejected duplicate equipment `stableCode` values after normalization; removed request `sortOrder` (array order is canonical); added unique PostgreSQL index `(OwnerUserId, StableCode)` via incremental migration `20260801070903_EnforceUniqueProfileEquipmentStableCode` (fails closed if duplicates already exist; no silent cleanup).
- Added `ProfileHttpTokenServiceTests` and `ProfileFinalRemediationTests`; refreshed OpenAPI snapshot.
- **Validation:** Release build 0 warnings; local tests 14/29/122; migration apply + idempotent script twice OK.
- **Next:** Push head, await Backend CI, owner re-review. Keep Validating; do not merge or mark Completed.

### 2026-08-01T06:45:00Z — Backend CI green

- Backend workflow https://github.com/RodrigoWantuk/WTK.KitchenFlow/actions/runs/30688134016 succeeded on an earlier remediation head (build-and-test + secret-scan), including OpenAPI export/drift/lint with no soft-fail.
- **Next:** Owner re-review was interrupted by this final remediation round.

### 2026-08-01T06:40:00Z — CI format fix

- Restored missing `[Fact]` on `GetProfileRecordsReadMetricNotMutationMetric` after format analyzer failure on head `1e9e9d0`.
- **Next:** Re-run Backend CI; keep Validating.

### 2026-08-01T06:36:00Z — OpenAPI, runtime, and security remediation

- Merged `origin/main` into `cursor/plan-0012-profile-backend-1672` and reconciled `docs/plan-status.md`.
- OpenAPI: preferences/equipment produce `PreferencesCollectionResponse` / `EquipmentCollectionResponse`; `ProfileFieldAction` / `ProfileFieldDurability` / `PreferenceCommandAction` enums wired into DTOs; response `ETag` and request `If-Match`/`X-CSRF-TOKEN` documented; no `If-None-Match`; HTTP statuses aligned (400/401/403/409/412/428).
- Runtime: missing-profile collections return `{ "version": null, "entries": [] }` without ETag; GET profile/preferences/equipment record `profile_reads_total` instead of mutation metrics.
- Tests: `ProfileContractAndSecurityTests` covers OpenAPI vs runtime, empty-profile collections, precondition rules, cross-user isolation, CSRF rejection, and GET metrics regression.
- Refreshed `packages/contracts/openapi/kitchenflow-v1.json`; `check-openapi.sh` and `lint-openapi.sh` pass.
- **Validation:** `dotnet build/test/format -c Release` green (14/29/107); migrations up to date; OpenAPI lint valid.
- **Next:** Push head, wait for Backend CI, request owner re-review. Keep Validating; do not merge or mark Completed.

### 2026-07-31T22:45:00Z — Review remediation delivered

- Fixed PostgreSQL `Version` increment (`ExpectedVersion + 1`) and real concurrent-write rejection.
- Implemented true PUT replace semantics (omitted fields become `Absent`; omitted lists cleared).
- Added strict `action`/`durability` validation; reject unsupported `temporary` with 400.
- Redacted allergy/medical restriction codes in privacy-minimizing history.
- Reconciled equipment by stable code with soft removal and preserved entry IDs.
- Returned versioned collection responses and ETags for preferences/equipment GET/PUT.
- Mapped duplicate profile creation to controlled `409 profile_already_exists` or `428` when If-Match is missing.
- Added `ProfileRemediationTests` integration coverage and expanded unit tests.
- Merged `main` (PLAN-0013 docs) and reconciled `docs/plan-status.md`.
- **Validation:** `dotnet build/test/format -c Release` green with 140/140 tests.
- **Next:** CI evidence and PR review on final SHA.

### 2026-07-31T19:10:00Z — Profile backend slice implemented

- Added `KitchenFlow.Modules.Profiles` with domain, application use cases, PostgreSQL stores, API adapters, and `profiles` schema migration.
- Extended `GET /api/v1/session` with safe profile projection fields only.
- Added domain, application, architecture, and integration coverage for profile flows.
- Exported OpenAPI snapshot and added `docs/operations/backend-profile-runbook.md`.
- **Validation:** `dotnet build/test -c Release` green with 127 tests; OpenAPI lint passed locally.
- **Next:** CI, Gitleaks, and independent review on pushed candidate SHA.

### 2026-07-31T18:45:00Z — Plan claimed

- Confirmed `main` contains merge commit `f9d429346615bf5b157656822057917ca2fe4032` (PLAN-0003 via PR #9).
- Reconciled `docs/plan-status.md` for PLAN-0003, PLAN-0008, PLAN-0010, PLAN-0004, PLAN-0005.
- Created PLAN-0012 and registered as In Progress on branch `cursor/plan-0012-profile-backend-1672`.
- **Next:** Implement Profiles module vertical slice.
