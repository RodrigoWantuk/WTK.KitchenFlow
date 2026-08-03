# PLAN-0020 evidence — profile frontend vertical slice

## Merge prerequisite

- PLAN-0011 / PR #34 merged at `eb9e92c21ac817e497235168786daeb3f35c30cd` on `main`.

## Review remediation

| Role | Value |
|---|---|
| Review baseline (pre-remediation) | `a50152c78e872685b9f760db53c05984308174d8` |
| Superseded functional tip | `4ddc87475b156ccb984cd7fe879a2f1086c9c1d5` |
| Superseded CI tip | `5efcfb8b5f70a1389e9e2c709afe7edf51d016ba` |
| Remediation functional tip | pending |
| CI-validated remediation tip | pending |

## Scope delivered (remediation)

Contract/concurrency hardening, typed controls, numeric validation, field errors, custom preference semantics, accessible sensitive dialog, unsaved-change protection, ProfileProvider scoped to `/app/perfil*`, overview/adult policy truthfulness, equipment hardening, intercepted authenticated browser smoke.

## Known limitations

- Adult declaration acceptance mutation unavailable in production until accepted policy versions are configured.
- Technique/goal/abandonment free-text labels not round-tripped (catalog + unknown-code fallback only).
- Independent validation tracked by PLAN-0024 (remains Draft until remediation tip is pinned).

## Handoff

```text
PR #35 remediation in progress.
PLAN-0024 stays Draft/unpinned until the remediation candidate is finalized.
```
