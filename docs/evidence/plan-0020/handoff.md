# PLAN-0020 evidence — profile frontend vertical slice

## Merge prerequisite

- PLAN-0011 / PR #34 merged at `eb9e92c21ac817e497235168786daeb3f35c30cd` on `main`.

## Residual remediation (complete)

| Role | Value |
|---|---|
| Residual review baseline | `9df4ec980c6de1d9d27454ac84499df0aa45ef8d` |
| Superseded major-remediation functional tip | `6215b89147ffd53cc132fea87687a549a475ce07` |
| Superseded major-remediation CI tip | `f59606e3958d7db71cd6c7ff900d41111160c39c` |
| Residual functional / CI tip | `5733bb4de957b53469a28bc60c472a90f0955907` |
| Current PR head | PR metadata (completion packaging may advance SHA) |

## Scope delivered (residual)

Route-level unsaved-change coordination (`useBlocker` + profile layout registration), shell/brand/history protection without prompt loops, explicit `saveRefreshFailed` and soft `sessionRefreshWarning` banners, shared `canMutate`, localized `workspace_not_ready`, extended intercepted browser coverage.

## Exact-head CI

- Frontend: https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30780915229
- PLAN-0005: https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30780915260

## Known limitations

- Adult declaration acceptance mutation unavailable in production until accepted policy versions are configured.
- Technique/goal/abandonment free-text labels not round-tripped (catalog + unknown-code fallback only).

## Handoff

```text
PR #35 residual remediation complete.
PLAN-0024 is Ready for an independent agent against exact candidate 5733bb4de957b53469a28bc60c472a90f0955907.
Do not merge until the PLAN-0024 assessment is reviewed by the owner.
```
