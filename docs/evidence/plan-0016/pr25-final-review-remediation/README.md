# PLAN-0016 PR #25 final-review remediation

## Exact tip

`df79be6493be07ed4a1ed9fd647a01c92a6c381c`

Single SHA for plan, registry, evidence, and PR #25 body. Backend / Frontend / PLAN-0005 CI green on this tip for the three final-review fixes.

## Fixes

1. **P1 — history after mutation:** `adjustLot` success commits lot/ETag before auxiliary `getHistory`. History failure shows secondary warning only; no mutation failure message; no automatic mutation retry.
2. **P2 — create idempotency:** Logical-attempt key via form-lifetime `useRef` fingerprint; reuse after transport/ambiguous failure; new key after material field change or confirmed success; never stored in browser storage.
3. **P2 — edit load:** Explicit loading / ready / not_found / session / error; blocked submit until ready; localized errors; retry + back.

## Local validation

- Backend: 204 Passed
- api-client: generate ×2, drift, typecheck
- Frontend gates: typecheck, lint, format, 134 Jest tests, guards, builds, isolation, audit
- Firefox native zoom: Passed

## CI on exact tip

| Workflow | Run | Conclusion |
| --- | --- | --- |
| Backend | https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30747186391 | success |
| Frontend | https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30747186373 | success |
| PLAN-0005 | https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30747186388 | success |

## Non-regression

Prior Pass coverage for #20/#21/#22/#24/#26 remains; PLAN-0018 Fail on `814af25` immutable.
