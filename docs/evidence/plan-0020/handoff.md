# PLAN-0020 evidence — profile frontend vertical slice

## Merge prerequisite

- PLAN-0011 / PR #34 merged at `eb9e92c21ac817e497235168786daeb3f35c30cd` on `main`.

## Independent validation (immutable Fail)

| Role | Value |
|---|---|
| Failed SUT | `5733bb4de957b53469a28bc60c472a90f0955907` |
| PLAN-0024 evidence PR | [#36](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/36) |
| Evidence branch head | `b549a97ff91acc0236121556e8edc81fcea82156` |
| Outcome | **Fail** |
| Blocking issue | [#37](https://github.com/RodrigoWantuk/WTK.Cocinaris/issues/37) |
| P1 | F-0024-01, F-0024-02 |
| P2 | F-0024-03, F-0024-04 |
| P3 | F-0024-05 |

Do not rewrite PLAN-0024 evidence. Remediation candidate requires PLAN-0025 independent retest.

## Remediation candidate (awaiting PLAN-0025)

| Role | Value |
|---|---|
| Functional / CI tip | `06bd95baacaabaa099170de1ba41187a8e885dea` |
| Exact-head Frontend (PR) | https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30857947860 |
| Exact-head PLAN-0005 | https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30857947726 |
| PLAN-0020 status | **Validating** |
| Successor retest | [PLAN-0025](../../plans/PLAN-0025-independently-retest-plan-0020-profile-remediation.md) Ready |

### Remediated findings (implementation claim — pending independent retest)

- **F-0024-01** — Required numeric projections fail closed via `mapRequiredFiniteInteger` / `mapOptionalFiniteNumber`; blank strings no longer become zero.
- **F-0024-02** — Shell logout routes through `useOptionalUnsavedChangesCoordinator().requestNavigation`.
- **F-0024-03** — Equipment `stableCode` field errors target focusable `profile-equipment-entry-<key>` rows with localized copy.
- **F-0024-04** — Preferences/Equipment controls use persistent visible labels / accessible names in en, pt-BR, es.
- **F-0024-05** — `isCustomStableCode` matches exact minted `custom_<uuid-v4>` shape.

## Residual remediation (historical — failed independent validation)

| Role | Value |
|---|---|
| Residual review baseline | `9df4ec980c6de1d9d27454ac84499df0aa45ef8d` |
| Superseded major-remediation functional tip | `6215b89147ffd53cc132fea87687a549a475ce07` |
| Superseded major-remediation CI tip | `f59606e3958d7db71cd6c7ff900d41111160c39c` |
| Failed residual functional / CI tip | `5733bb4de957b53469a28bc60c472a90f0955907` |

## Scope delivered (residual)

Route-level unsaved-change coordination (`useBlocker` + profile layout registration), shell/brand/history protection without prompt loops, explicit `saveRefreshFailed` and soft `sessionRefreshWarning` banners, shared `canMutate`, localized `workspace_not_ready`, extended intercepted browser coverage.

## Exact-head CI (failed SUT — historical)

- Frontend: https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30780915229
- PLAN-0005: https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30780915260

## Known limitations

- Adult declaration acceptance mutation unavailable in production until accepted policy versions are configured.
- Technique/goal/abandonment free-text labels not round-tripped (catalog + unknown-code fallback only).

## Handoff

```text
PLAN-0020 remediation complete against PLAN-0024 findings.

New exact candidate:
06bd95baacaabaa099170de1ba41187a8e885dea

Exact-head CI:
Frontend 30857947860 — Passed
PLAN-0005 30857947726 — Passed

PLAN-0020 is Validating.
PLAN-0024 remains the immutable historical Fail against 5733bb4.
PLAN-0025 is Ready for an independent agent against 06bd95b.
Issue #37 remains open pending retest.

PR #35 remains draft.
No agent approval, auto-merge or merge was performed.
```
