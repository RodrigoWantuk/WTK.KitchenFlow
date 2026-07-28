# Implementation and Test Plans

This directory contains executable plans used to hand work to implementation, testing, research, documentation, and operations agents.

A plan is not a high-level roadmap item. It is a versioned execution contract that defines scope, constraints, acceptance criteria, validation, progress, and the exact handoff state for a bounded body of work.

The repository-wide status of every plan is tracked in [`../plan-status.md`](../plan-status.md).

## When a plan is required

A plan is required for every nontrivial agent change, including:

- product feature implementation;
- architecture or infrastructure work;
- database or contract changes;
- AI workflow or prompt changes;
- test-suite creation or test execution campaigns;
- security, privacy, accessibility, localization, or performance work;
- significant refactoring;
- documentation work that changes project policy or durable technical guidance.

A very small correction may use a lightweight plan, but it must still be registered before an agent commits the change. Do not use plan size as a reason to bypass traceability.

## Plan identifiers and file names

Use a monotonically increasing four-digit identifier:

```text
PLAN-0001-short-kebab-case-title.md
PLAN-0002-another-bounded-delivery.md
```

The plan ID is permanent. Renaming the title must not change the numeric identifier.

Agent branches should include the plan ID:

```text
agent/plan-0001-short-scope
```

A pull request should link the plan and include its ID in the PR body. Including the ID in the PR title is recommended when it improves traceability.

## Plan types

Use one primary type:

- **Implementation**: product, backend, frontend, integration, or infrastructure delivery.
- **Testing**: validation work performed independently from implementation.
- **Research**: a bounded investigation that must produce a decision-ready result.
- **Documentation**: durable documentation or governance changes.
- **Operations**: deployment, migration, observability, backup, recovery, or maintenance work.

A plan may include multiple disciplines, but it must identify a primary type and responsible owner.

## Required plan content

Every plan must define:

- objective and user or engineering outcome;
- context and authoritative requirements;
- included and excluded scope;
- assumptions, dependencies, and open questions;
- architecture and contract impact;
- ordered implementation or execution phases;
- testing and validation strategy;
- security, privacy, food-safety, AI, localization, accessibility, performance, and operational implications where relevant;
- acceptance criteria;
- execution state, exact next action, and blockers;
- append-only progress log;
- completion and handoff checklist.

Use [`0000-plan-template.md`](0000-plan-template.md) as the starting point.

## Mandatory lifecycle

### 1. Create or select the plan

Before changing implementation files, the agent must:

1. read `AGENTS.md`, `docs/plan-status.md`, and all relevant project documentation;
2. create the plan or explicitly claim an existing `Ready`, `Paused`, or `Blocked` plan;
3. add or update the registry row;
4. define the branch, owner, current checkpoint, and exact next action.

### 2. Execute in bounded checkpoints

- Follow the ordered phases unless the plan is updated with the reason for deviation.
- Keep completed and pending checklist items truthful.
- Record discoveries that change scope, risks, or acceptance criteria before continuing.
- Create an ADR when the work requires a durable architectural decision.
- Do not silently reduce requirements to make the plan appear complete.

### 3. Update state before every commit

Before every agent-created commit, update both:

- the active plan's `Execution state` and `Progress log`;
- the matching row in `docs/plan-status.md`.

The update must describe the state produced by that commit, including:

- the checkpoint completed or partially completed;
- files or areas materially changed;
- tests, evaluations, or manual checks performed;
- known failures or unverified behavior;
- the exact next action;
- any blocker or handoff information.

The plan-state changes must be committed with the implementation they describe.

### 4. Pause or hand off safely

Before stopping for any reason, the agent must leave the repository resumable:

- set status to `Paused` or `Blocked` when appropriate;
- identify the last verified checkpoint;
- identify incomplete or partially modified files;
- record commands already run and their results;
- state the exact next action, not a vague goal;
- document unresolved decisions and risks;
- identify whether the working tree or branch contains uncommitted work.

A different agent must be able to continue from the repository alone, without access to the previous chat.

### 5. Validate and complete

A plan may be marked `Completed` only when:

- all acceptance criteria are satisfied or explicitly marked not applicable with justification;
- implementation and test work agree;
- required automated and manual validation has been performed;
- documentation and contracts are current;
- known limitations are recorded;
- the final execution state contains no hidden unfinished work;
- the registry is moved to the completed section.

Delivery state may remain `PR open` or `Awaiting owner merge` after execution becomes `Completed`.

## Implementation and testing separation

For risk-sensitive or substantial features, the implementation plan should define expected verification, while a separate testing plan may independently verify the delivered behavior.

A testing agent must not merely trust the implementation plan's completion claims. It must:

- derive tests from requirements and acceptance criteria;
- inspect changed behavior and contracts;
- record evidence, failures, and coverage gaps;
- distinguish product defects from test-environment limitations;
- update its own plan and registry row before every commit.

## Concurrency rules

- One agent must not claim a plan already owned by another active agent without an explicit handoff.
- Plans that modify overlapping files or contracts must document coordination and merge order.
- Shared architecture or contract changes should be delivered before dependent plans when practical.
- If concurrent work invalidates a plan assumption, pause and update the plan before continuing.

## Plan history

Do not rewrite progress history to hide failed approaches or interruptions. Correct inaccurate entries with a later entry. Completed plans remain in the repository as implementation and decision history.
