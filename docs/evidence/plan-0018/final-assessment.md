# PLAN-0018 Final Assessment

- **Outcome:** **Fail**
- **System under test:** PR #25 @ `814af253814d0ec7f8b0adbbca9c50040b5bab07`
- **Assessed at (UTC):** 2026-08-02
- **Assessor:** agent:independent-retest-plan-0018

## Decision summary

PLAN-0016 does **not** fully resolve the residual PLAN-0005 remediations required for Pass.

| Residual / requirement | Result | Evidence |
|---|---|---|
| #20 production inventory journey | **Passed** (live wiring + authenticated API journey) | `production-isolation-result.json`, `production-inventory-journey-result.json`, route/component tests |
| #24 generated TypeScript client | **Passed** | `generated-client-result.json` |
| #21 Firefox Cook CTA pointer @ native ~200% | **Failed** | `firefox-zoom-pointer-keyboard.json` |
| #22 Firefox pantry item pointer @ native ~200% | **Failed** | `firefox-zoom-pointer-keyboard.json` |
| Locale decimals (`en`/`pt-BR`/`es`) | **Passed** (unit + form component tests) | `locale-date-result.json` |
| Printed calendar dates | **Passed** (API round-trip + helpers) | inventory journey + calendarDate tests |
| Stale conflict 412 / missing If-Match 428 | **Passed** (API); UI component coverage Passed | inventory journey + Detail/Form tests |
| Auth / CSRF / no browser OIDC tokens | **Passed** | `authentication-session-result.json` |
| Two-user isolation | **Failed** (adjust returns 412 vs nondisclosing 404) | journey + issue #26 |

Firefox keyboard sub-scenarios Passed; pointer remains Failed. Keyboard success does **not** convert pointer Fail into Pass. Native `widthRatio=2.0` was measured.

## Why not Pass / Conditional Pass

- Pass requires Firefox native pointer **and** keyboard for #21 and #22 — pointer Failed.
- Conditional Pass forbids leaving mandatory residual PLAN-0005 cases unresolved and forbids remaining High defects — #21/#22 unresolved; #26 High isolation status-code disclosure.

## Plan status consequences

- **PLAN-0018:** Completed with result **Fail**.
- **PLAN-0005:** remains **Conditional Pass**.
- **PLAN-0016:** return to **In Progress** (implementation changes required for #21/#22 and #26).
- **PLAN-0011:** remains **Blocked**.
- Issues #20/#24: remediation evidence supports owner closure after review; **do not close without owner instruction**.
- Issues #21/#22: remain open; pointer Fail reproduced.
- Issue **#26**: new High finding from this retest.

## Limitations

- Production SPA click-path under a true same-origin reverse proxy sharing Keycloak redirect host `https://localhost:7443` was not completed; inventory contract was proven via real Keycloak session on the API origin with production live adapters verified in source/bundle. This limitation does **not** excuse #21/#22 or #26.
- CI `30728413882` is baseline context only; Phase 1 gates were re-executed independently.

## Exact next action

Implementation agents must remediate #21/#22 (native Firefox pointer) and #26 (nondisclosing foreign mutation responses) on a PLAN-0016 follow-up; then re-run PLAN-0018 (or successor) before promoting PLAN-0005 to Pass.
