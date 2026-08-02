# PLAN-0018 Requirements Traceability

System under test: PR #25 @ `814af253814d0ec7f8b0adbbca9c50040b5bab07`

| Requirement / issue | Test IDs | Result | Evidence |
|---|---|---|---|
| Generated OpenAPI TS client (#24) | TEST-0018-001 | Passed | `generated-client-result.json` |
| Frontend quality gates | TEST-0018-002 | Passed | `frontend-quality-result.json` |
| Real Keycloak login/session/CSRF/token absence | TEST-0005-002..011 (reused harness) | Passed | `authentication-session-result.json` |
| Production inventory create/list/adjust/history/delete | TEST-0018-INV-* | Mixed (see journey) | `production-inventory-journey-result.json` |
| Other + custom location | TEST-0018-INV-CREATE-other-custom, CUSTOM-LOCATION, OTHER-REQUIRED | Passed create/round-trip; missing custom rejected (422) | journey |
| ETag 412 / missing If-Match 428 | TEST-0018-INV-412/428 + component tests | Passed | journey + Detail/Form tests |
| Two-user isolation | TEST-0018-INV-ISOLATION-* + TEST-0005-011 | Failed on adjust 412 | journey + #26 |
| Locale decimals | localeDecimal + Form tests | Passed | `locale-date-result.json` |
| Printed dates | TEST-0018-INV-PRINTED-DATE + calendarDate | Passed | journey + `locale-date-result.json` |
| Firefox #21 Cook pointer/keyboard | TEST-0005-109 Cook_* | Pointer Failed / Keyboard Passed | `firefox-zoom-pointer-keyboard.json` |
| Firefox #22 Pantry pointer/keyboard | TEST-0005-109 Pantry_* | Pointer Failed / Keyboard Passed | `firefox-zoom-pointer-keyboard.json` |
| Production isolation (#20 related) | TEST-0018-009 | Passed | `production-isolation-result.json` |
| #20 FeatureUnavailable inventory | isolation + journey + ProductionInventoryRoutes | Passed | multiple |
