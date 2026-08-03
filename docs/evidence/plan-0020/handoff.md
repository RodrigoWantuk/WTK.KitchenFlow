# PLAN-0020 evidence — profile frontend vertical slice

## Merge prerequisite

- PLAN-0011 / PR #34 merged at `eb9e92c21ac817e497235168786daeb3f35c30cd` on `main`.

## Review remediation

| Role | Value |
|---|---|
| Review baseline (pre-remediation) | `a50152c78e872685b9f760db53c05984308174d8` |
| Superseded functional tip | `4ddc87475b156ccb984cd7fe879a2f1086c9c1d5` |
| Superseded CI tip | `5efcfb8b5f70a1389e9e2c709afe7edf51d016ba` |
| Remediation functional tip | `6215b89147ffd53cc132fea87687a549a475ce07` |
| CI-validated remediation tip | `f59606e3958d7db71cd6c7ff900d41111160c39c` |
| Current PR head | PR metadata (completion packaging may advance SHA) |

## Scope delivered (remediation)

Contract/concurrency hardening, typed controls, numeric validation, field errors, custom preference semantics, accessible sensitive dialog, unsaved-change protection, ProfileProvider scoped to `/app/perfil*`, overview/adult policy truthfulness, equipment hardening, intercepted authenticated browser smoke.

## Known limitations

- Adult declaration acceptance mutation unavailable in production until accepted policy versions are configured.
- Technique/goal/abandonment free-text labels not round-tripped (catalog + unknown-code fallback only).
- Independent validation tracked by PLAN-0024 (remains Draft until remediation tip is pinned).

## Exact-head CI (CI-validated tip `f59606e`)

- Frontend: https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30778578106
- PLAN-0005: https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30778578095

## Handoff

```text
PR #35 remediation complete and ready for owner review.
PLAN-0024 is ready for independent validation against exact candidate f59606e3958d7db71cd6c7ff900d41111160c39c.
No agent approval, auto-merge, or merge was performed.
```
