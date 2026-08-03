# PLAN-0024 test matrix

SUT: `5733bb4de957b53469a28bc60c472a90f0955907`

| Phase | Scope | Method | Result | Evidence |
|---|---|---|---|---|
| Prep | Candidate drift / PR #35 open | git + gh | Passed (docs-only after candidate) | `environment.json` |
| A | Contract mapping / fail-closed / CSRF / If-Match | Jest adversarial + existing live/map tests | **Fail** (F-0024-01); other probes Passed | `adversarial-tests.log`, `profile-related-tests.log` |
| B | Workspace consistency / mutation queue / 412 path | Jest ProfileProvider + adversarial | Passed | `profile-related-tests.log` |
| C | Progressive fields / numeric empty≠0 / locales | Jest ProfileData + catalog parity | Passed (locale key parity en/pt-BR/es) | ProfileData tests; catalog check |
| D | Preferences / sensitive Allergy+Medical dialog | Jest ProfilePreferences | Passed (existing suite) | `profile-related-tests.log` |
| E | Equipment order / opaque codes | Jest + adversarial order probe | Passed with P2/P3 residuals F-0024-03/05 | equipment tests + findings |
| F | Session/route scope | ProductionProfileRoutes + smoke | Passed | smoke profile route gate |
| G | Unsaved Links/Back | Smoke + UnsavedChangesCoordinator | Passed for covered paths; **Fail** on logout (F-0024-02) | smoke + logout adversarial |
| H | Post-save reload / session warning separation | Smoke intercepted + provider tests | Passed | smoke save-refresh / session-refresh |
| I | Adult declaration unavailable default | Runtime + overview tests | Passed | production runtime / overview |
| J | a11y/i18n/responsive | Smoke 360/768/1280, locales, keyboard, reduced-motion; Firefox native zoom | Passed automated gates; accessible-name gap F-0024-04; **no AT audit claimed** | smoke + firefox json |
| K | Production isolation / security | guards + bundle inspect | Passed | guard/inspect logs |
| Regression | Full frontend quality/build/smoke gates on SUT worktree | yarn scripts | Passed (see command-results) | `command-results.json` |
| Adversarial | Independent probes + mutation proofs | Jest `src/validation/plan-0024` | 22 Passed / 4 Failed (defect probes) | `adversarial-tests.log` |

## Accessibility check classes

| Class | Executed? | Notes |
|---|---|---|
| Automated accessibility checks | Partial | Keyboard smoke, focus-visible baseline, dialog roles in component tests; no axe suite claimed for profile |
| Keyboard browser checks | Yes | Smoke keyboard-only journey; Firefox keyboard @ native ~200% Passed |
| Manual visual checks | No | Not performed in this campaign |
| Assistive-technology checks | No | NVDA/VoiceOver not run; do not claim full screen-reader audit |

## Gate scoreboard (SUT worktree)

All commands recorded in `command-results.json`. Highlights:

- API client generate/drift/typecheck/format: Passed (after installing `packages/api-client`)
- typecheck / lint / format / test (323): Passed
- guards + builds + inspect + audit: Passed
- `smoke:browser:ci`: Passed (24/24), including profile intercepted scenarios
- `validate:firefox-native-zoom`: Passed after Xvfb/`HOME=/root` environment fix (Cook/Pantry pointer+keyboard)
