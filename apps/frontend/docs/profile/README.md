# Profile frontend (PLAN-0020)

Production profile, household, preferences, and equipment surfaces under `/app/perfil*`.

## Contract rules

- Absent profile: `GET /api/v1/profile` returns `profileExists: false` with progressive defaults — **not** HTTP 404.
- Ordinary edits use **PATCH**; PUT full replace is repository-only and must not be used by normal forms.
- Progressive fields preserve `value`, `presence` (`absent` | `confirmed` | `removed` | wire `default`), `defaultValue`, and `durability`.
- Preferences/equipment share the same profile aggregate concurrency token; after any successful mutation the workspace reloads all four sources and refreshes the session projection.
- Allergy and MedicalRestriction require explicit confirmation; never inferred.
- Custom preference/equipment codes use opaque `custom_<uuid>` forms; user text lives in `note` / `customName` only.
- Adult declaration mutation is gated by an injected `AdultDeclarationPolicy`. Production defaults to policy unavailable until accepted terms/privacy versions are configured.

## Architecture

- Presentation models: `src/contracts/profile/`
- Live adapter: `src/adapters/live/profile/`
- Workspace coordinator: `src/features/profile/ProfileProvider.tsx`
- Choice catalog: `src/features/profile/catalog/` (stable codes + localized labels)
- UI strings: `src/app/i18n/profileUiCatalog.ts`

## Routes

| Path | Purpose |
|---|---|
| `/app/perfil` | Overview / completeness |
| `/app/perfil/dados` | Household, locale, cooking, ordered code lists |
| `/app/perfil/preferencias` | Preferences and restrictions |
| `/app/perfil/equipamentos` | Equipment ordered replace |

## Limitations

- Ordered technique/goal/abandonment lists are catalog-only until a label round-trip contract exists.
- Production adult-declaration acceptance is blocked without reviewed policy versions.
- Live contextual-home consumption of profile remains PLAN-0021.
