# PLAN-0016 post-rebase independent retest

## Exact tip

- **Exact tip SHA:** `38e5edfb49407d895995e0cf1b49054dc7ce5c5b` (single SHA for plan, registry, handoff, and PR #25)
- **Meaning:** merge tip of `origin/main` (`1115ba4`) into PLAN-0016 — Backend / Frontend / PLAN-0005 CI green and independent retest Pass were executed on this tip.
- **Packaging:** Completed status + this evidence directory are committed as the PR head immediately atop that tip; product behavior matches `38e5edf` aside from the journey harness accepting fail-closed `422` for OTHER-REQUIRED.

## Outcome

**Pass** for required remediation coverage after rebase onto current main.

| Case | Issue | Result |
| --- | --- | --- |
| Foreign vs nonexistent + owner 428/412 | #26 | Passed (journey isolation mutate 404; backend isolation test; owner 428/412) |
| Firefox native ~200% Cook pointer + keyboard | #21 | Passed (`widthRatio=2.0`) |
| Firefox native ~200% pantry pointer + keyboard | #22 | Passed (`widthRatio=2.0`) |
| Production inventory journey (BFF + Keycloak + API + PostgreSQL) | #20 | Passed (21/21) |
| Generated client generate / drift / typecheck | #24 | Passed |
| Production isolation (no mocks) | — | Passed (`inspect:production-bundle` + Frontend CI) |

## Immutable history

- PLAN-0018 **Fail** on `814af253814d0ec7f8b0adbbca9c50040b5bab07` under `docs/evidence/plan-0018/` is **not** rewritten.
- Former PR #23 collision resolved on main via PLAN-0017 / PR #31.

## Artifacts

- `final-assessment.md`
- `command-results.md`
- `workflow-ids.md`
- `exact-tip-sha.txt`
- `firefox-zoom-pointer-keyboard.json`
- `production-inventory-journey-result.json`
- `generated-client-result.json`
- `production-isolation-result.json`
- `two-user-isolation-result.json`
