# PLAN-0011 evidence — Phase 1 + Phase 2 (+ chooser definition hardening)

## Scope

Includes discriminated `HomeQuickChooserDefinition` + runtime validation for PR #34.
Live source contracts remain PLAN-0021.

## SHA distinctions

| Role | Value |
|---|---|
| Review baseline | `ca2dc3685dd4a4dec659724d6fe67e72a78cfd53` |
| Functional implementation tip | pending contract-hardening commit |
| CI-validated tip | pending exact-head Frontend + PLAN-0005 |
| Current PR head reported in PR metadata | published branch tip after push |

## Contract hardening summary

1. Discriminated available / temporarily_unavailable / not_implemented variants.
2. Available definitions require exactly one or two questions (≥2 options each).
3. Runtime normalize/validate rejects invalid payloads without silent truncation.
4. Invalid definitions fail closed to temporary-unavailable + Retry.
5. QuickChooser switches exhaustively on capabilityStatus.

## Handoff

```text
PR #34 remains draft until exact-head CI is green.
Next frontend plan after merge: PLAN-0020.
Future live contextual-home integration: PLAN-0021.
```
