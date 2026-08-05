# PLAN-0023 validation handoff

PLAN-0023 is **Validating**. The replacement implementation candidate is `7e24fa2f86350d8a566de0b9f2f1cdba984080ff`; the previous `b72e8efaa6ae6c97998a92967b8e6112f326a14c` candidate is superseded.

Last verified local checkpoint: deterministic preparation workflow, focused PostgreSQL rollback/concurrency/replay coverage, migration upgrade and idempotent script execution, OpenAPI/generated-client checks, and frontend matrix passed.

The corrective implementation persists `DeclaredYield` on the immutable preparation batch and reads that fact for batch, provenance, and idempotent representations. Same-key adjustment mutation now looks up an existing owner-scoped idempotency record before evaluating a stale `If-Match`, after ownership is established. HTTP collection-item validation rejects null inputs and outputs with a stable validation Problem Details response. Provenance is bounded to fifty deterministic related batches per direction and loaded in set queries.

The historical local complete-integration run is inconclusive because its Testcontainers PostgreSQL containers were repeatedly paused or recycled. That limitation is preserved in `command-results.json`. Exact-head Backend/secret scan run `30964375294`, frontend quality/browser-smoke runs `30964372594` and `30964375347`, and PLAN-0005 p0/p1/evidence-consistency run `30964375297` passed for the replacement candidate.

PLAN-0026 is Ready and pinned to this exact SHA. Its independent agent must test from a separate branch and detached candidate worktree, then publish its assessment. The implementation PR remains draft; no approval, auto-merge, or merge was performed.

No credentials, cookies, CSRF values, request bodies, private notes, or production data are present in this evidence directory.
