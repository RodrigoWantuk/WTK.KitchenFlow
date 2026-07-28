# Plan Execution Registry

This file is the canonical, repository-wide view of implementation, testing, research, documentation, and operational plans.

Detailed plans live under [`docs/plans/`](plans/). This registry exists so that a new agent can understand current work, ownership, progress, blockers, and the exact continuation point without reconstructing state from chat history or branch diffs.

## Mandatory agent rule

Before creating **every commit**, an agent must update the active plan's `Execution state` and `Progress log`, update the matching row in this registry, and ensure both describe the state produced by the same commit.

## Status model

Use exactly one execution status: **Draft**, **Ready**, **In Progress**, **Paused**, **Blocked**, **Validating**, **Completed**, **Cancelled**, or **Superseded**.

Pull-request and merge state are tracked separately in the `Delivery` column.

## Active plans

| Plan | Title | Type | Status | Delivery | Owner | Branch / PR | Current checkpoint | Exact next action | Blocker | Updated |
|---|---|---|---|---|---|---|---|---|---|---|
| [PLAN-0001](plans/PLAN-0001-document-product-foundation.md) | Document the KitchenFlow Product Foundation | Documentation | In Progress | Branch open | AI documentation agent | `agent/plan-0001-document-product-foundation` | Complete discovery, accepted product foundation, first release, and core domain documents created | Create and reconcile architecture, AI, privacy, security, operations, and ADR documentation | None | 2026-07-28 |

## Completed plans

| Plan | Title | Type | Delivery | Result | Completed |
|---|---|---|---|---|---|
| _None_ |  |  |  |  |  |

## Cancelled or superseded plans

| Plan | Title | Status | Replacement or reason | Updated |
|---|---|---|---|---|
| _None_ |  |  |  |  |

## Registry maintenance rules

- Every plan appears exactly once.
- Link plan IDs to their files.
- Use ISO 8601 dates and UTC timestamps when precision matters.
- Current checkpoint states the last verified state.
- Exact next action must be immediately actionable.
- Delivery states include `Not started`, `Branch open`, `PR open`, `Changes requested`, `Awaiting owner merge`, and `Merged`.
- Blocked plans identify the blocker.
- Ownership changes require a progress-log handoff.
- Move rows instead of duplicating them.
- Preserve historical terminal entries.
- Reconcile delivery and branch deletion after merge.
