# PLAN-0026 final assessment

- **Outcome:** **Fail**
- **System under test:** PR #39 candidate `7e24fa2f86350d8a566de0b9f2f1cdba984080ff`
- **Implementation packaging head:** `123ad4148a52a84bf43b65d3ce039dc1c6051c7c` (documentation-only delta verified)
- **Validation PR:** #40 (`agent/plan-0026-validate-prepared-components` → `agent/plan-0023-prepared-component-lots`), draft
- **Assessed at (UTC):** 2026-08-05T01:48:18Z

## Decision

Independent validation established exact candidate identity and reproduced two blocking P1 defects:

1. **F-0026-01** — concurrent same-key preparation can return false `412 precondition_failed` instead of authoritative replay.
2. **F-0026-02** — `ck_preparation_batches_declared_yield` accepts all-null and measured-value-without-unit rows due to SQL NULL CHECK semantics.

One bounded P2 remains for provenance truncation signaling (**F-0026-03**). No P0 was found.

Existing inventory non-regression, owner nondisclosure samples, immutable measured declared yield on the happy/API path, adjustment same-key replay (50 iterations), append-only history, OpenAPI lint, generated-client gates, and frontend quality gates passed against the SUT worktree. Green candidate CI is corroboration only and does not override the independent Fail.

## Scope notes

- Product code under `apps/backend/src`, `apps/frontend/src`, and generated contracts was not modified.
- Independent adversarial tests were added only under backend test projects and remain red until the P1 defects are remediated.
- Backend solution test exit code is non-zero solely because of the two independent finding tests; architecture/unit suites and the remainder of the integration assembly passed.

## Owner handoff

PLAN-0023 returns to **In Progress**. PR #39 remains Draft. Remediate F-0026-01 and F-0026-02 on the implementation branch, pin a new exact green candidate, and re-request independent validation. Do not merge PR #39 on this assessment.
