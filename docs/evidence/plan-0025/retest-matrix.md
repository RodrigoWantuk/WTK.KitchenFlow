# PLAN-0025 retest matrix

| Area | Independent method | Status | Evidence |
|---|---|---|---|
| Candidate identity and drift | Remote git and exact-head workflow inspection | Passed | `environment.json` |
| F-0024-01 required numerics | Independent adversarial mapper tests; existing adapter suite | Passed | `src/validation/plan-0025/profileRemediationRetest.test.ts`, `reports/independent-tests-summary.md` |
| F-0024-02 dirty logout | Production-router unit composition plus intercepted browser smoke for Data/Preferences/Equipment, Stay/Escape/Discard/keyboard/repeat/failure | Passed | `reports/browser-smoke-summary.md` |
| F-0024-03 stable-code field-error focus | Equipment component field-error test and source inspection of entry target/error-summary mapping | Passed | `reports/independent-tests-summary.md` |
| F-0024-04 accessible names | Testing Library role-query suite and localized catalog/source inspection | Passed | `reports/independent-tests-summary.md` |
| F-0024-05 opaque UUID-v4 stable codes | Independent adversarial predicate tests plus generator source inspection | Passed | `src/validation/plan-0025/profileRemediationRetest.test.ts` |
| Contract, concurrency, progressive fields | Adapter/provider/page suites plus full suite | Passed | `command-results.json` |
| Preferences, equipment, navigation, session | Component suites and intercepted production browser smoke | Passed | `reports/browser-smoke-summary.md` |
| Locales, accessibility, responsive, isolation | Locale smoke, role-query suites, guards, production-bundle inspection, 360/768/1280 and Firefox native 200% | Passed; no AT claim | `reports/gate-summary.md`, `reports/firefox-native-zoom-summary.md` |
| Full required gates | Pinned SUT worktree commands plus PLAN-0005 P0/P1 | Passed | `command-results.json` |

Manual visual and real assistive-technology passes were not claimed. The browser checks are automated Chromium and native Firefox pointer/keyboard checks; testing-library accessible-name assertions cover the component-level accessible-name contract.
