# KitchenFlow Documentation

This directory is the durable source of truth for product, architecture, engineering, AI, quality, security, operations, and work-execution decisions.

Documentation must evolve with the implementation. A code change that modifies behavior, contracts, architecture, configuration, deployment, operational procedures, or plan execution state is incomplete until the related documentation is updated.

## Documentation map

```text
plan-status.md       Canonical registry of active, paused, blocked, and completed plans
plans/               Executable implementation, testing, research, documentation, and operations plans
product/             Product vision, users, problems, scope, and requirements
architecture/        System architecture, principles, boundaries, and ADRs
ai/                  AI capabilities, prompt lifecycle, providers, validation, and evaluation
testing/             Quality strategy, test levels, and release gates
security/            Security, privacy, threat modeling, and incident practices
operations/          Deployment, observability, backups, and support procedures
```

Some directories will be created when their first approved document is added. Empty placeholder directories are intentionally not tracked by Git.

## Start here

Every implementation or testing agent must begin with:

1. [`plan-status.md`](plan-status.md)
2. [`plans/README.md`](plans/README.md)
3. the active plan assigned to the work
4. [`product/vision.md`](product/vision.md)
5. [`architecture/overview.md`](architecture/overview.md)
6. [`architecture/principles.md`](architecture/principles.md)
7. [`ai/overview.md`](ai/overview.md) when AI behavior is involved
8. [`testing/strategy.md`](testing/strategy.md)
9. [`architecture/decisions/README.md`](architecture/decisions/README.md)

Repository-wide mandatory rules remain defined in [`../AGENTS.md`](../AGENTS.md).

## Plan execution documents

Detailed plans live under `docs/plans/`. The central status and handoff view lives in `docs/plan-status.md`.

Before every agent-created commit, the agent must update both the active plan and the central registry so they describe the state produced by that commit. This includes partial work, validation results, blockers, and the exact next action.

The plan system is intended to make work resumable from repository state alone and to support independent implementation and testing agents.

## Document lifecycle

Documents should use one of these statuses when a status is relevant:

- **Draft**: under discussion and not yet binding.
- **Proposed**: ready for review and decision.
- **Accepted**: approved and binding.
- **Superseded**: replaced by another document or decision.
- **Rejected**: considered and intentionally not adopted.
- **Deprecated**: still present for compatibility or history, but should not guide new work.

Execution-plan statuses are defined separately in [`plan-status.md`](plan-status.md) and must not be replaced with document-lifecycle statuses.

## Writing standards

- Write technical documentation in English.
- Prefer direct, testable statements over aspirational language.
- Separate facts, decisions, assumptions, risks, progress, and open questions.
- Link to the canonical document instead of duplicating rules.
- Use diagrams that can be reviewed and versioned as text when practical.
- Include dates using ISO 8601 (`YYYY-MM-DD`).
- Use UTC ISO 8601 timestamps when plan progress requires time precision.
- Reference issues, plans, ADRs, and pull requests when a document is created or materially changed.
- Do not rewrite plan progress history to hide failed approaches, interruptions, or handoffs.

## Product documentation versus implementation documentation

Product documents explain the user problem, expected outcomes, rules, and acceptance criteria. Architecture documents explain system boundaries and trade-offs. Plans explain how a bounded body of work will be delivered and verified. Implementation details belong near the relevant code when they are local and short-lived, but durable cross-cutting knowledge belongs here.
