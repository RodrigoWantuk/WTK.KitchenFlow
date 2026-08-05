# PLAN-0023 validation handoff

PLAN-0023 is **In Progress**. The previous `b72e8efaa6ae6c97998a92967b8e6112f326a14c` candidate is superseded and PLAN-0026 is not ready or pinned.

Last verified local checkpoint: deterministic preparation workflow, focused PostgreSQL rollback/concurrency/replay coverage, migration upgrade and idempotent script execution, OpenAPI/generated-client checks, and frontend matrix passed.

The corrective implementation persists `DeclaredYield` on the immutable preparation batch and reads that fact for batch, provenance, and idempotent representations. Same-key adjustment mutation now looks up an existing owner-scoped idempotency record before evaluating a stale `If-Match`, after ownership is established. HTTP collection-item validation rejects null inputs and outputs with a stable validation Problem Details response. Provenance is bounded to fifty deterministic related batches per direction and loaded in set queries.

The historical local complete-integration run is inconclusive because its Testcontainers PostgreSQL containers were repeatedly paused or recycled. That limitation is preserved in `command-results.json`. The complete replacement candidate requires green exact-head Backend, Frontend, PLAN-0005, evidence-consistency, and secret-scan workflows.

After the replacement candidate is green, PLAN-0026 must be pinned and claimed by a separate independent agent using its own branch and detached candidate worktree. The implementation PR remains draft; no approval, auto-merge, or merge was performed.

No credentials, cookies, CSRF values, request bodies, private notes, or production data are present in this evidence directory.
