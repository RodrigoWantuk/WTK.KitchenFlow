# Plan Execution Registry

This file is the canonical, repository-wide view of implementation, testing, research, documentation, and operational plans.

Detailed plans live under [`docs/plans/`](plans/). This registry exists so that a new agent can understand current work, ownership, progress, blockers, and the exact continuation point without reconstructing state from chat history or branch diffs.

## Mandatory agent rule

Before creating **every commit**, an agent must:

1. update the active plan's `Execution state` and `Progress log` sections;
2. update the matching row in this registry;
3. record the checkpoint represented by the commit, substantial run target, documentation delivered, validation performed, blockers, and exact next action;
4. ensure both files describe the repository state that will exist after the commit.

This requirement applies even when the commit is partial, documentation-only, test-only, or created because the agent must stop. A commit made by an agent without the corresponding plan-state update is noncompliant.

The plan and registry updates should be included in the same commit as the work they describe. Do not create a misleading status-only update before the implementation exists.

## Status model

Use exactly one execution status:

- **Draft**: the plan is being written and is not ready to execute.
- **Ready**: scope and acceptance criteria are sufficiently defined for work to start.
- **In Progress**: implementation or test execution is actively underway.
- **Paused**: work stopped intentionally and can continue without resolving a blocker.
- **Blocked**: work cannot continue until a documented dependency or decision is resolved.
- **Validating**: implementation is complete enough for tests, evaluations, or acceptance verification.
- **Completed**: all plan acceptance criteria and required validation are complete.
- **Cancelled**: work was intentionally abandoned and will not be completed.
- **Superseded**: another plan replaces this plan.

Pull-request and merge state are tracked separately in the `Delivery` column. Execution may be `Completed` while delivery is still `PR open` or `Awaiting owner merge`.

## Active plans

Plans with status `Draft`, `Ready`, `In Progress`, `Paused`, `Blocked`, or `Validating` belong here.

| Plan | Title | Type | Status | Delivery | Owner | Branch / PR | Current checkpoint | Exact next action | Blocker | Updated |
|---|---|---|---|---|---|---|---|---|---|---|
| [PLAN-0007](plans/PLAN-0007-strengthen-agent-delivery-standards.md) | Strengthen Agent Documentation and Delivery Standards | Documentation | In Progress | Branch open | AI governance agent | `agent/plan-0007-strengthen-agent-delivery-standards` | Documentation-completeness and substantial-run rules are prepared across agent, contributor, planning, testing, and PR guidance | Commit synchronized policy, validate full diff, open PR, and finalize delivery state | None | 2026-07-29T02:10:00Z |
| [PLAN-0003](plans/PLAN-0003-implement-backend-inventory-slice.md) | Implement Backend Foundation and Inventory Core | Implementation | Ready | Not started | Unassigned backend agent | `agent/plan-0003-backend-inventory-slice` | Exact backend structure, auth, persistence, API, contract, observability, phases, and tests are specified | Claim the plan and verify the development environment | None | 2026-07-29 |
| [PLAN-0004](plans/PLAN-0004-implement-lovable-inventory-ux.md) | Implement Lovable Application Shell and Inventory UX | Implementation | Ready | Not started | Unassigned Lovable/frontend agent | `agent/plan-0004-lovable-inventory-ux` | Technical workflow and refined design brief are specified; Layer A inventory and Layer B broad mock prototype are separated | Owner creates the dedicated Lovable project/repository and the frontend agent claims the plan | Owner Lovable setup; live API waits for PLAN-0003 contract | 2026-07-29 |
| [PLAN-0005](plans/PLAN-0005-test-authenticated-inventory-slice.md) | Independently Validate the Authenticated Inventory Slice | Testing | Ready | Not started | Unassigned independent test agent | `agent/plan-0005-test-inventory-slice` | P0/P1/P2 cases, evidence, traceability, entry/exit, and defect rules are specified | Pin stable PLAN-0003 and PLAN-0004 PR commits when available | Stable implementation baselines | 2026-07-29 |

## Completed plans

Plans with status `Completed` belong here. Keep the most recent completed plans at the top.

| Plan | Title | Type | Delivery | Result | Completed |
|---|---|---|---|---|---|
| [PLAN-0006](plans/PLAN-0006-refine-lovable-design-brief.md) | Refine the Lovable Product Design Brief | Documentation | [Merged via PR #7](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/7) | General visual direction, Lovable design authority, SPA behavior, broad mocked prototype, scenarios, gallery, and production-isolation requirements added to PLAN-0004 | 2026-07-29 |
| [PLAN-0002](plans/PLAN-0002-specify-authenticated-inventory-vertical-slice.md) | Specify the First Authenticated Inventory Vertical Slice | Documentation | [Merged via PR #6](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/6) | Exact first-slice specification, detailed backend/Lovable/test plans, and canonical Windows/Linux development environment | 2026-07-29 |
| [PLAN-0001](plans/PLAN-0001-document-product-foundation.md) | Document the KitchenFlow Product Foundation | Documentation | [Merged via PR #5](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/5) | Complete product, domain, release, architecture, AI, privacy, security, operations, ADR, agent-reading, and test-gate foundation | 2026-07-28 |

## Cancelled or superseded plans

| Plan | Title | Status | Replacement or reason | Updated |
|---|---|---|---|---|
| _None_ |  |  |  |  |

## Registry maintenance rules

- Every plan appears exactly once in this file.
- Link the plan ID to its Markdown file.
- Use ISO 8601 dates and UTC timestamps when time precision matters.
- `Current checkpoint` must state the last verified state, not an intention.
- `Exact next action` must be concrete enough for a different agent to execute immediately.
- `Delivery` must state the repository delivery state, such as `Not started`, `Branch open`, `PR open`, `Changes requested`, `Awaiting owner merge`, or `Merged`.
- A blocked row must identify the blocking decision, dependency, issue, or external event.
- When responsibility changes, update `Owner` and add a handoff entry to the plan progress log.
- Move rows between sections instead of duplicating them.
- Do not delete historical completed, cancelled, or superseded entries unless a documented archival policy is introduced.
- Reconcile delivery state and branch deletion after a pull request is merged.
