# PLAN-0012: Implement Account, Household, Profile and Equipment Backend Slice

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Cursor cloud agent
- **Created:** 2026-07-31
- **Last updated:** 2026-07-31T18:45:00Z
- **Branch:** `cursor/plan-0012-profile-backend-1672`
- **Pull request:** Not opened
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

- [ ] Progressive profile distinguishes absent, confirmed, removed, default, temporary, and durable semantics at the contract level
- [ ] Single household context per account with required cadence and locale fields
- [ ] Eight restriction categories with stable non-localized codes; allergies and medical restrictions only via explicit user commands
- [ ] Cooking context, equipment, adult declaration, and accepted terms versions persisted with owner consistency
- [ ] All mutations owner-scoped with concurrency token and `If-Match`
- [ ] Session endpoint never exposes restrictions, allergies, or private notes
- [ ] Privacy-minimizing audit history without sensitive payloads
- [ ] Module-owned export and deletion projection interfaces prepared for Privacy workflows
- [ ] Architecture tests enforce module boundaries
- [ ] Full test suite deterministic with zero skipped tests
- [ ] Release build zero warnings, locked restore, migrations from empty and prior main, OpenAPI truthful

## Execution state

- **Current phase:** P0 — plan registration and module foundation
- **Last verified checkpoint:** `main` at `f9d4293` confirmed; registry reconciliation and PLAN-0012 document created
- **Blockers:** None
- **Exact next action:** Implement `KitchenFlow.Modules.Profiles` domain and application layer, then persistence and API adapters

## Progress log

### 2026-07-31T18:45:00Z — Plan claimed

- Confirmed `main` contains merge commit `f9d429346615bf5b157656822057917ca2fe4032` (PLAN-0003 via PR #9).
- Reconciled `docs/plan-status.md` for PLAN-0003, PLAN-0008, PLAN-0010, PLAN-0004, PLAN-0005.
- Created PLAN-0012 and registered as In Progress on branch `cursor/plan-0012-profile-backend-1672`.
- **Next:** Implement Profiles module vertical slice.
