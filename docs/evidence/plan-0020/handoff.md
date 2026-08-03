# PLAN-0020 evidence — profile frontend vertical slice

## Merge prerequisite

- PLAN-0011 / PR #34 merged at `eb9e92c21ac817e497235168786daeb3f35c30cd` on `main`.

## Residual remediation (in progress)

| Role | Value |
|---|---|
| Residual review baseline | `9df4ec980c6de1d9d27454ac84499df0aa45ef8d` |
| Superseded major-remediation functional tip | `6215b89147ffd53cc132fea87687a549a475ce07` |
| Superseded major-remediation CI tip | `f59606e3958d7db71cd6c7ff900d41111160c39c` |
| Superseded packaging tip | `9df4ec980c6de1d9d27454ac84499df0aa45ef8d` |
| Residual functional tip | pending |
| Residual CI-validated tip | pending |

## Prior major remediation (historical; superseded for acceptance)

| Role | Value |
|---|---|
| Pre-remediation review baseline | `a50152c78e872685b9f760db53c05984308174d8` |
| Functional tip | `6215b89147ffd53cc132fea87687a549a475ce07` |
| CI tip | `f59606e3958d7db71cd6c7ff900d41111160c39c` |

## Scope delivered (residual)

Route-level unsaved-change coordination (`useBlocker` + profile layout registration), shell/brand/history protection without prompt loops, explicit `saveRefreshFailed` and `sessionRefreshWarning` banners, shared `canMutate`, localized `workspace_not_ready`, extended intercepted browser coverage.

## Known limitations

- Adult declaration acceptance mutation unavailable in production until accepted policy versions are configured.
- Technique/goal/abandonment free-text labels not round-tripped (catalog + unknown-code fallback only).
- Independent validation tracked by PLAN-0024 (Draft/unpinned until residual tip is finalized).

## Handoff

```text
PLAN-0020 residual remediation in progress against baseline 9df4ec9.
PLAN-0024 remains Draft until the residual candidate is CI-green and pinned.
No agent approval, auto-merge, or merge was performed.
```
