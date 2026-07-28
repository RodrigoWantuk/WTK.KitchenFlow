# Plan Execution Registry

This file is the canonical repository-wide view of implementation, testing, research, documentation, and operational plans.

Before every agent-created commit, update the active plan and this registry so both describe the state produced by the same commit.

## Active plans

| Plan | Title | Type | Status | Delivery | Owner | Branch / PR | Current checkpoint | Exact next action | Blocker | Updated |
|---|---|---|---|---|---|---|---|---|---|---|
| [PLAN-0001](plans/PLAN-0001-document-product-foundation.md) | Document the KitchenFlow Product Foundation | Documentation | Validating | Branch open | AI documentation agent | `agent/plan-0001-document-product-foundation` | All foundation documents, ADRs, test gates, and repository entry points are written and reconciled | Compare against `main`, validate all changed files and links, then open the PR and complete the plan | None | 2026-07-28 |

## Completed plans

| Plan | Title | Type | Delivery | Result | Completed |
|---|---|---|---|---|---|
| _None_ |  |  |  |  |  |

## Cancelled or superseded plans

| Plan | Title | Status | Replacement or reason | Updated |
|---|---|---|---|---|
| _None_ |  |  |  |  |

## Status model

Execution statuses are **Draft**, **Ready**, **In Progress**, **Paused**, **Blocked**, **Validating**, **Completed**, **Cancelled**, and **Superseded**. Delivery is tracked separately.

## Registry rules

- Every plan appears exactly once and links to its file.
- Current checkpoint is the last verified state.
- Exact next action is concrete and immediately actionable.
- Delivery identifies branch, PR, requested changes, merge, and cleanup state.
- Preserve terminal history and update ownership handoffs.
