# Backend Profile Runbook

- **Status:** Active
- **Applies to:** KitchenFlow API profile v1 contract, PostgreSQL `profiles` schema, and session-safe projections
- **Related plan:** PLAN-0012

## Scope

This runbook documents the authenticated profile, household, preferences, equipment, and completeness endpoints delivered by `KitchenFlow.Modules.Profiles`.

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/profile` | Progressive profile scaffold or persisted profile |
| PUT/PATCH | `/api/v1/profile` | Durable mutations; first create without `If-Match` |
| GET/PUT | `/api/v1/profile/preferences` | Explicit preference/restriction commands only |
| GET/PUT | `/api/v1/profile/equipment` | Equipment replace |
| GET | `/api/v1/profile/completeness` | Non-blocking completeness summary |
| GET | `/api/v1/session` | Safe projection: display name, language, timezone, measurement system, profile existence/completeness, adult declaration |

Sensitive restrictions, allergies, private notes, and full profile payloads are never returned from `/api/v1/session`.

## Local validation

```bash
dotnet build apps/backend/KitchenFlow.slnx -c Release
dotnet test apps/backend/KitchenFlow.slnx -c Release
dotnet ef database update \
  --project apps/backend/src/KitchenFlow.Infrastructure/KitchenFlow.Infrastructure.csproj \
  --startup-project apps/backend/src/KitchenFlow.Api/KitchenFlow.Api.csproj
```

After the API is running with a trusted development certificate or CI loopback URL:

```bash
KITCHENFLOW_OPENAPI_URL=http://127.0.0.1:7080/openapi/v1.json bash scripts/backend/export-openapi.sh
bash scripts/backend/lint-openapi.sh
git diff --exit-code -- packages/contracts/openapi/kitchenflow-v1.json
```

## Privacy and audit

Profile change history records section names and field codes only. Export and deletion projection hooks are module-owned and prepared for future Privacy workflows without storing sensitive payloads in audit metadata.

## Operations

- Profile mutations require CSRF on PUT/PATCH routes.
- Updates after the first create require a current `If-Match` ETag.
- Owner isolation is enforced at application and PostgreSQL foreign-key boundaries.
- Migrations are forward-only; apply `InitialProfilesSlice` before serving profile routes against an existing database.
