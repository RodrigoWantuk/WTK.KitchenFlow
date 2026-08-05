# PLAN-0023 validation handoff

PLAN-0023 is **Completed** after independent PLAN-0027 Pass.

Functional product SUT: `9bff2e130afb4a0f31ea0b84925362f546d1179e`

PLAN-0027 validation head: `03c4e176ee3dee199e0b10a4166749e9687a2374`

Consolidated implementation and validation head: `99d84dab3735c2230985c6011a835e4adce52006`

Consolidated exact-head workflows: Backend `31040038676`, Frontend `31040038769`, and PLAN-0005 `31040038628` — Passed.

Last verified local checkpoint: deterministic preparation workflow, focused PostgreSQL rollback/concurrency/replay coverage, migration upgrade and idempotent script execution, OpenAPI/generated-client checks, and frontend matrix passed.

The remediation re-reads an owner-scoped preparation idempotency record after parent ownership is established and again before stale precondition failure, so a same-key winner is replayed rather than reported as a false 412. The declared-yield constraint is explicitly fail-closed under PostgreSQL NULL semantics. Provenance remains bounded to fifty deterministic related batches per direction, is set-loaded, and reports independent truncation flags.

## Candidate and workflow attribution

- Historical failed SUT `7e24fa2f86350d8a566de0b9f2f1cdba984080ff`: Backend `30964375294`, Frontend `30964372594` and `30964375347`, and PLAN-0005 `30964375297`; independent PLAN-0026 result: **Fail**.
- Replacement functional SUT `9bff2e130afb4a0f31ea0b84925362f546d1179e`: Backend `31013020164`, Frontend `31013020163`, and PLAN-0005 `31013020245`; independent PLAN-0027 result: **Pass**.
- Documentation packaging head `d928752f746030bfd735f84d5b15239562923092`: Backend `31016455273`, Frontend `31016457649`, and PLAN-0005 `31016455555`.

The historical local complete-integration run is inconclusive because its Testcontainers PostgreSQL containers were repeatedly paused or recycled. That limitation is preserved in `command-results.json`.

PLAN-0026 is Completed — Fail; PR #40 is immutable historical evidence. PLAN-0027 is Completed — Pass; PR #42 was incorporated into the PLAN-0023 branch. PLAN-0023 is Completed; awaiting final documentation-head CI and owner review through PR #39. F-0027-01 was resolved without product behavior changes.

No credentials, cookies, CSRF values, request bodies, private notes, or production data are present in this evidence directory.
