# PLAN-0024 findings

System under test: `5733bb4de957b53469a28bc60c472a90f0955907`  
Assessor: independent testing agent (PLAN-0024)  
Assessment: **Fail**

## Summary

| Severity | Count | IDs |
|---|---|---|
| P0 | 0 | — |
| P1 | 2 | F-0024-01, F-0024-02 |
| P2 | 2 | F-0024-03, F-0024-04 |
| P3 | 1 | F-0024-05 |

Tracking issue: [#37](https://github.com/RodrigoWantuk/WTK.Cocinaris/issues/37)  
Blocking comment on implementation PR: [#35](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/35#issuecomment-5165966031)

---

## F-0024-01

- **Severity:** P1
- **Status:** Open
- **Requirement:** Phase A — malformed successful responses must fail closed; adapter must not publish silently coerced values
- **Affected SUT SHA:** `5733bb4de957b53469a28bc60c472a90f0955907`
- **Environment:** Node v24.18.0 / Jest on validation branch (product sources identical to SUT)
- **Preconditions:** Live mapper `mapCompleteness` / `mapPreferencesCollection` / `mapEquipmentCollection`
- **Exact reproduction steps:**
  1. Call `mapCompleteness` with `percentComplete: null` (or missing numeric wire value coerced through `coerceNumber`).
  2. Call `mapPreferencesCollection` / `mapEquipmentCollection` with an entry whose `sortOrder` is `null`.
  3. Observe the mapper returns a snapshot with `0` instead of throwing `ProfileApiError(malformed)`.
- **Expected result:** Throw `ProfileApiError` with code `malformed` (fail closed).
- **Actual result:** Publishes `percentComplete: 0` / `sortOrder: 0` without error.
- **Evidence paths:**
  - `apps/frontend/src/adapters/live/profile/mapProfile.ts` (`coerceNumber(...) ?? 0`)
  - `docs/evidence/plan-0024/reports/adversarial-tests.log`
  - `apps/frontend/src/validation/plan-0024/plan0024Adversarial.test.tsx` (3 failing probes)
- **Privacy/security impact:** None direct. Integrity impact: a truncated/malformed success payload can be treated as a plausible empty/zero profile projection and influence ordering.
- **Suggested remediation boundary:** PLAN-0020 frontend adapter only — reject nullish required numerics in `mapCompleteness` / preference & equipment entry mapping.
- **Retest requirement:** Re-run PLAN-0024 adversarial malformed-numeric suite; must pass.

---

## F-0024-02

- **Severity:** P1
- **Status:** Open
- **Requirement:** Phase G — dirty profile drafts must confirm before navigation discards them; silent data loss is forbidden
- **Affected SUT SHA:** `5733bb4de957b53469a28bc60c472a90f0955907`
- **Environment:** Jest + Testing Library rendering `ProductionApp`
- **Preconditions:** Authenticated intercepted session; route `/app/perfil/dados`; dirty `displayName`
- **Exact reproduction steps:**
  1. Open Profile Data with a confirmed profile.
  2. Edit `displayName` without saving.
  3. Click `production-logout`.
- **Expected result:** Unsaved-changes `alertdialog` appears once; logout does not proceed until Stay/Discard; draft preserved on Stay.
- **Actual result:** Logout runs immediately; no confirmation dialog; draft is discarded when the shell navigates away.
- **Evidence paths:**
  - `apps/frontend/src/app/ProductionApp.tsx` (logout `onClick={() => void logout()}`)
  - `docs/evidence/plan-0024/reports/adversarial-tests.log`
  - `apps/frontend/src/validation/plan-0024/plan0024LogoutUnsaved.test.tsx`
- **Privacy/security impact:** None. User-entered profile draft is silently lost.
- **Suggested remediation boundary:** PLAN-0020 shell — route logout through the same unsaved-changes coordinator used for Links/`useBlocker`.
- **Retest requirement:** Adversarial logout probe must pass; browser smoke should add a dirty-logout scenario.

---

## F-0024-03

- **Severity:** P2
- **Status:** Open
- **Requirement:** Phase C/J — field-level Problem Details must focus the correct control; known paths must not produce dead jump targets
- **Affected SUT SHA:** `5733bb4de957b53469a28bc60c472a90f0955907`
- **Environment:** Source inspection + existing equipment page structure
- **Preconditions:** `PUT /api/v1/profile/equipment` returns `validation_failed` with `errors["entries[0].stableCode"]`
- **Exact reproduction steps:**
  1. Save equipment so the backend returns a `stableCode` field error on `entries[i]`.
  2. Observe error summary entry id `profile-equipment-stableCode-<key>`.
  3. Confirm no element with that `id` exists; no inline message; `profile.equipment.stableCode` i18n key is absent.
- **Expected result:** Inline/entry-level error with focusable target, or treat path as unknown summary-only without broken jump.
- **Actual result:** Summary claims a known field and focuses a missing id; label may fall back to the raw key.
- **Evidence paths:** `apps/frontend/src/features/profile/ProfileEquipmentPage.tsx`; `apps/frontend/src/app/i18n/profileUiCatalog.ts` (no `profile.equipment.stableCode`)
- **Privacy/security impact:** None
- **Suggested remediation boundary:** PLAN-0020 equipment page + i18n catalog
- **Retest requirement:** Component test simulating backend `entries[i].stableCode` field errors.

---

## F-0024-04

- **Severity:** P2
- **Status:** Open
- **Requirement:** Phase J — form controls must expose accessible names (not placeholder-only)
- **Affected SUT SHA:** `5733bb4de957b53469a28bc60c472a90f0955907`
- **Environment:** Source inspection of Preferences and Equipment editors
- **Preconditions:** Profile Preferences or Equipment page rendered
- **Exact reproduction steps:**
  1. Inspect custom label / note / capacity / constraint note inputs.
  2. Attempt `getByRole('textbox', { name: ... })` for those controls.
- **Expected result:** Persistent accessible name via `<label>`, `aria-label`, or `aria-labelledby`.
- **Actual result:** Several inputs rely on placeholder text only.
- **Evidence paths:** `ProfilePreferencesPage.tsx`, `ProfileEquipmentPage.tsx`
- **Privacy/security impact:** None
- **Suggested remediation boundary:** PLAN-0020 profile forms a11y
- **Retest requirement:** Testing Library accessible-name assertions for all text fields; keyboard pass unchanged.

---

## F-0024-05

- **Severity:** P3
- **Status:** Open
- **Requirement:** Opaque custom stable codes should be recognized only in the minted `custom_<uuid>` shape
- **Affected SUT SHA:** `5733bb4de957b53469a28bc60c472a90f0955907`
- **Environment:** Unit (`customCodes.test.ts` encodes the weak predicate)
- **Preconditions:** Existing entry with `stableCode: "custom_"`
- **Exact reproduction steps:** Call `isCustomStableCode("custom_")` → `true`; equipment save then requires `customName`.
- **Expected result:** Only UUID-suffixed codes minted by `createCustomStableCode` classify as custom.
- **Actual result:** Any whitespace-free `custom_` prefix within length bounds is accepted.
- **Evidence paths:** `apps/frontend/src/features/profile/customCodes.ts`
- **Privacy/security impact:** None material (does not embed user text)
- **Suggested remediation boundary:** Tighten `isCustomStableCode` regex; update unit tests
- **Retest requirement:** Unit tests for malformed prefixes

---

## Non-findings / residual notes (not defects against PLAN-0020 contract)

- Soft session refresh after save that preserves the authenticated shell on BFF `unavailable`/`signedOut` is **required** by PLAN-0020 Phase F/H (`sessionRefreshWarning`). Not classified as a defect.
- Production bundle `enableScenarioBar:!1` and home `home.fixture.*` catalog strings are not profile fixture fallbacks; `inspect:production-bundle` and `guard:production-isolation` passed.
- Locale preference `localStorage` write is expected; no OIDC access/refresh tokens observed in the production bundle.
