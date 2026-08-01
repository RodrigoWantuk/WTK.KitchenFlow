# Superseded P1 console log

`p1-initial-failed-console.txt` captures an early PLAN-0005 P1 attempt where pagination (or an adjacent P1 group) ended with `overall: Failed`.

It is retained for audit only and is **not** the current P1 result.

## Historical context

- Execution: historical / pre-corrective P1 completion attempt
- Known failure: pagination path produced `overall: Failed` in the console dump
- Correction applied: P1 pagination filter + OpenAPI HTTP `:7080` / insecure HTTPS probes; P1 job now records `overall: Passed` when groups succeed
- Superseding evidence: CI artifacts `plan-0005-p1-evidence-<prHeadSha>` from the evidence-generation head of the current PR tip (see PR #19 body and `final-quality-assessment.json` after the integrity round)
- Integrated main under test: `b94abd9a83fe29d88b095e3e9a42f10d01c05414`

Do not treat this console as the current P1 result. Do not place an unidentified Failed console inside the final artifact without this historical marker.
