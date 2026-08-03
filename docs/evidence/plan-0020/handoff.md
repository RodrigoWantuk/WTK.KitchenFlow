# PLAN-0020 evidence — profile frontend vertical slice

## Merge prerequisite

- PLAN-0011 / PR #34 merged at `eb9e92c21ac817e497235168786daeb3f35c30cd` on `main`.

## Scope delivered

Production profile overview and editing routes, live repository adapters, shared workspace concurrency, preference/equipment management, progressive completeness, session refresh for safe fields, localization (`en` / `pt-BR` / `es`), production isolation, and automated tests.

## Known limitations

- Adult declaration acceptance mutation unavailable in production until accepted policy versions are configured.
- Technique/goal/abandonment free-text labels not round-tripped (catalog + unknown-code fallback only).
- Independent validation tracked by PLAN-0024 (placeholder).

## SHA distinctions

| Role | Value |
|---|---|
| Branch start / PLAN-0011 merge | `eb9e92c21ac817e497235168786daeb3f35c30cd` |
| Functional implementation tip | `4ddc874` (full SHA recorded after push) |
| CI-validated tip | pending exact-head Frontend (+ PLAN-0005 where applicable) |
| Current PR head | PR metadata |

## Handoff

```text
PR ready for owner review after exact-head CI.
Independent PLAN-0020 validation may begin against the exact candidate SHA (PLAN-0024).
PLAN-0021 remains blocked until profile and other live-source prerequisites are merged.
```
