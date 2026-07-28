# Contributing to KitchenFlow

KitchenFlow is an early-stage source-available project with an accepted product and architecture foundation. Contributions must preserve product intent, domain integrity, security, privacy, food safety, accessibility, localization, cost control, operability, and testability.

## Before starting

Read:

- `README.md`;
- `AGENTS.md`;
- `docs/README.md` and its role-specific foundation path;
- `docs/plan-status.md`;
- `docs/plans/README.md`;
- the active plan;
- every applicable accepted ADR.

Open or reference an issue for nontrivial work when it improves scope, decision, defect, or dependency traceability.

## Language

All technical content is written in English. User-facing content uses the selected localization system and is not hard-coded in application logic.

## Plan requirement

Every nontrivial agent contribution uses a numbered plan and registry entry.

Before implementation:

1. create or claim the plan;
2. confirm included and excluded scope;
3. define testable acceptance criteria and required validation;
4. identify ownership, dependencies, branch, checkpoint, and exact next action;
5. register the plan.

Before every agent-created commit, update the active plan and registry with the state produced by that commit. Before pausing or handing off, leave enough repository state for another contributor to continue without conversation history.

## Product and architecture consistency

Do not introduce behavior that contradicts the accepted foundation, especially:

- aggregate-only inventory instead of lot lifecycle;
- silent AI state mutation;
- forced menu planning or inventory participation;
- shared mutable recipes across users;
- frontend-owned authoritative rules;
- direct AI provider calls outside the gateway;
- Redis or queues as authoritative product storage;
- an undocumented reduction of initial release scope.

A durable change requires stakeholder-approved product documentation or an ADR, as applicable.

## Branches and commits

Agent branches include the plan ID:

```text
agent/plan-0001-short-scope
```

Use concise imperative English commit messages. Commit plan-state updates with the work they describe. Delete merged branches unless a documented operational reason requires retention.

## Pull requests

A pull request includes:

- linked plan and delivery state;
- summary and rationale;
- included and excluded scope;
- user and developer impact;
- product and domain effects;
- architecture and contracts;
- security, privacy, food-safety, localization, accessibility, AI-cost, and operational effects;
- automated and manual validation;
- failures, skipped checks, limitations, and exact handoff.

## Quality requirements

Before review:

- run formatting, analysis, build, tests, evaluations, and scans appropriate to the change;
- test failure and recovery paths;
- verify authorization and data isolation;
- verify idempotency and concurrency when applicable;
- validate localization and accessibility;
- confirm no secrets, personal data, source images, or private transcripts were added;
- ensure docs, ADRs, contracts, plan, and registry match the branch;
- disclose checks that could not run.

AI-generated work is held to the same standard and is not accepted merely because it compiles or appears plausible.

## License

Contributions are distributed under the repository's PolyForm Noncommercial License 1.0.0 unless a separate written agreement states otherwise.
