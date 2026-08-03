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

Do not rewrite PLAN-0024 evidence. A new remediation candidate requires PLAN-0025 independent retest.

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
PLAN-0020 reopened In Progress after PLAN-0024 Fail against 5733bb4.
Remediate F-0024-01…05 on draft PR #35; publish a new exact green candidate for PLAN-0025.
Do not merge until independent retest Passes.
Issue #37 remains open pending retest.
```
