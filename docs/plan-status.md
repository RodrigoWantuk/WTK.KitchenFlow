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
| [PLAN-0012](plans/PLAN-0012-implement-profile-household-equipment-backend.md) | Implement Account, Household, Profile and Equipment Backend Slice | Implementation | Validating | [PR #12](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/12) / Changes requested | Cursor agent | `cursor/plan-0012-profile-backend-1672` | OpenAPI collections/enums/ETag/CSRF; null no-profile versions; GET read metrics; isolation/CSRF/OpenAPI tests; 150/150 local | Await green Backend CI on remediation head; owner re-review | Owner re-review after CI green | 2026-08-01T06:36:00Z |
| [PLAN-0015](plans/PLAN-0015-remediate-frontend-baseline.md) | Remediate and Validate the Imported Frontend Baseline | Implementation | Validating | [Draft PR #16](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/16) | Cursor agent | `agent/plan-0015-remediate-frontend-baseline` | Residual nesting/focus/evidence round ready for owner re-review | Owner reviews draft PR #16 (no agent merge) | Owner merge authorization | 2026-08-01T05:20:00Z |
| [PLAN-0011](plans/PLAN-0011-implement-entry-and-contextual-home.md) | Implement the Public Entry and Contextual Home Experience | Implementation | Blocked | Not started | Unassigned frontend/product implementation agent | `agent/plan-0011-contextual-home` | PLAN-0014 code on main; remediations pending PLAN-0015 | Resume only after owner approves PLAN-0015 | PLAN-0015 remediation approval | 2026-07-31T22:47:18Z |
| [PLAN-0005](plans/PLAN-0005-test-authenticated-inventory-slice.md) | Independently Validate the Authenticated Inventory Slice | Testing | Ready | Backend merged; frontend pending PLAN-0015 | Unassigned independent test agent | `agent/plan-0005-test-inventory-slice` | Frontend present on main but not definitive until PLAN-0015 approval | Wait for PLAN-0015 approval before pinning definitive frontend SHA | PLAN-0015 owner approval for definitive frontend baseline | 2026-07-31T22:47:18Z |

## Completed plans

Plans with status `Completed` belong here. Keep the most recent completed plans at the top.

| Plan | Title | Type | Delivery | Result | Completed |
|---|---|---|---|---|---|
| [PLAN-0014](plans/PLAN-0014-integrate-emergent-frontend.md) | Integrate Emergent Frontend and Establish Production Frontend Baseline | Implementation | [Merged via PR #14](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/14) (+ docs [#15](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/15)) | Implemented on main (`4166973`); **remediation and independent validation pending through [PLAN-0015](plans/PLAN-0015-remediate-frontend-baseline.md)**. Merge of #14 occurred before explicit owner review; owner chose preserve + incremental remediation | 2026-07-31 |
| [PLAN-0013](plans/PLAN-0013-define-closed-loop-kitchen-orchestration.md) | Define Closed-Loop Kitchen Orchestration | Documentation | [Merged via PR #13](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/13) | Accepted localized recovery, prepared-component inventory, sequential planning simulation, reconciliation, uncertainty, controlled troubleshooting learning, and multi-day preparation dependency routes with explicit responsibility boundaries | 2026-07-31 |
| [PLAN-0003](plans/PLAN-0003-implement-backend-inventory-slice.md) | Implement Backend Foundation and Inventory Core | Implementation | [Merged via PR #9](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/9) | Final candidate `d9c67e1` green in CI run 30643543261 with Keycloak smoke and 115 tests | 2026-07-31 |
| [PLAN-0010](plans/PLAN-0010-define-entry-and-contextual-home.md) | Define the Public Entry and Contextual Home Experience | Documentation | [Merged via PR #11](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/11) | Accepted public briefing, personal contextual home, local-time behavior, ordered menu/inventory/profile/quick-chooser sources, accessible media fallback, privacy-safe telemetry, AI degradation, and future implementation plan | 2026-07-30 |
| [PLAN-0008](plans/PLAN-0008-define-lean-launch-ai-economics.md) | Define Lean Launch, Acquisition, AI Unit Economics, and Monetization | Operations | [Merged via PR #10](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/10) | Staged acquisition, no-audience recruitment, bounded ads, ultra-light model evaluation, AI budgets, metrics, and monetization hypotheses fully specified | 2026-07-29 |
| [PLAN-0007](plans/PLAN-0007-strengthen-agent-delivery-standards.md) | Strengthen Agent Documentation and Delivery Standards | Documentation | [Merged via PR #8](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/8) | Mandatory full documentation, XML/TSDoc and useful-comment standards, plus substantial coherent delivery targets for every agent run | 2026-07-29 |
| [PLAN-0006](plans/PLAN-0006-refine-lovable-design-brief.md) | Refine the Lovable Product Design Brief | Documentation | [Merged via PR #7](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/7) | General visual direction, Lovable design authority, SPA behavior, broad mocked prototype, scenarios, gallery, and production-isolation requirements added to PLAN-0004 | 2026-07-29 |
| [PLAN-0002](plans/PLAN-0002-specify-authenticated-inventory-vertical-slice.md) | Specify the First Authenticated Inventory Vertical Slice | Documentation | [Merged via PR #6](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/6) | Exact first-slice specification, detailed backend/Lovable/test plans, and canonical Windows/Linux development environment | 2026-07-29 |
| [PLAN-0001](plans/PLAN-0001-document-product-foundation.md) | Document the KitchenFlow Product Foundation | Documentation | [Merged via PR #5](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/5) | Complete product, domain, release, architecture, AI, privacy, security, operations, ADR, agent-reading, and test-gate foundation | 2026-07-28 |

## Cancelled or superseded plans

| Plan | Title | Status | Replacement or reason | Updated |
|---|---|---|---|---|
| [PLAN-0004](plans/PLAN-0004-implement-lovable-inventory-ux.md) | Implement Lovable Application Shell and Inventory UX | Superseded | Replaced by [PLAN-0014](plans/PLAN-0014-integrate-emergent-frontend.md); Emergent snapshot becomes the official frontend baseline | 2026-07-31T20:15:00Z |

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
