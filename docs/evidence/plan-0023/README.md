# PLAN-0023 implementation evidence

This directory records reproducible, privacy-safe evidence for the prepared-component implementation candidate.

- Baseline: `f166ce21020f6704d3fcd99b4b6d195b33638155`
- Branch: `agent/plan-0023-prepared-component-lots`
- Draft implementation PR: #39
- Historical independent validation: PLAN-0026 completed **Fail** at `7e24fa2f86350d8a566de0b9f2f1cdba984080ff` in Draft PR #40. Its immutable evidence remains outside this branch. F-0026-01/02/03 are being remediated; PLAN-0027 is the future independent retest, unpinned until a new exact green candidate exists.

Evidence records commands, timestamps, tested commits, exit codes, and artifact paths only. It never contains credentials, cookies, CSRF values, request bodies, private notes, or personal inventory data.

The remediation local matrix includes focused PostgreSQL, authenticated preparation HTTP, migration-model, contract, generated-client, and frontend checks. Same-key preparation passed 50 synchronized HTTP iterations with no retry wrapper; the failed historical candidate exposed a real replay-ordering defect, not flakiness. The prior local complete integration assembly remains inconclusive because Testcontainers PostgreSQL instances were paused or recycled by the local Docker session. This is implementation evidence only, not an independent-validation Pass or a replacement-candidate claim.
