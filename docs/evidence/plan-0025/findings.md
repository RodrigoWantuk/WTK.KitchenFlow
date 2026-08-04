# PLAN-0025 findings

## Outcome

No new or residual P0/P1/P2/P3 finding was reproduced against SUT `06bd95baacaabaa099170de1ba41187a8e885dea`.

| Historical finding | Severity at PLAN-0024 | Retest status | Evidence |
|---|---:|---|---|
| F-0024-01 malformed numerics | P1 | Passed — required values fail closed with `ProfileApiError(code: malformed)`; nullable capacity remains nullable and malformed present capacity fails closed | independent test + full adapter suite |
| F-0024-02 dirty logout | P1 | Passed — coordinator blocks dirty logout and does not loop; clean logout remains immediate | production composition + browser smoke |
| F-0024-03 equipment stableCode focus | P2 | Passed — known error maps to a focusable row target with inline localized error | component test + source inspection |
| F-0024-04 persistent accessible names | P2 | Passed — relevant fields have visible/associated contextual labels, role-query coverage, unique IDs and no placeholder-only dependency | component test + catalog/source inspection |
| F-0024-05 exact custom code | P3 | Passed — only `custom_<uuid-v4>` with RFC 4122 variant is recognized | independent test + source inspection |

The first local PLAN-0005 P0 attempt omitted the workflow's Xvfb/Openbox wrapper and therefore failed its native Firefox subgroup. It was an execution-environment setup error, not a product finding: the required wrapper rerun passed all five P0 groups and the independent native Firefox check passed separately.
