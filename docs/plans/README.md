# Execution Plans

This directory contains executable plans used to hand work to implementation, testing, research, documentation, and operations agents.

A plan is not a high-level roadmap item. It is a versioned execution contract that defines scope, constraints, acceptance criteria, validation, documentation, progress, delivery depth, and the exact handoff state for a bounded body of work.

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

## Templates

- Use [`0000-plan-template.md`](0000-plan-template.md) for implementation, research, documentation, and operations work.
- Use [`0000-test-plan-template.md`](0000-test-plan-template.md) when the primary responsibility is independent test design or execution.

The test-plan template adds requirements traceability, risk-based priorities, system-under-test baselines, evidence tracking, defect classification, and a final quality assessment. Use it when independent validation is justified by elevated risk or an explicit owner request. Ordinary work follows the lean default in [`PLAN-0007-amendment-2026-08-05-lean-validation.md`](PLAN-0007-amendment-2026-08-05-lean-validation.md) and does not require a separate testing plan.

## Required plan content

Every plan must define:

- objective and user or engineering outcome;
- context and authoritative requirements;
- included and excluded scope;
- assumptions, dependencies, and open questions;
- architecture and contract impact;
- substantial delivery target for each execution run or phase;
- ordered implementation or execution phases;
- complete documentation deliverables;
- testing and validation strategy;
- security, privacy, food-safety, AI, localization, accessibility, performance, and operational implications where relevant;
- acceptance criteria;
- execution state, exact next action, and blockers;
- append-only progress log;
- completion and handoff checklist.

## Substantial delivery mandate

An execution run must aim for the largest coherent plan phase, vertical slice, test campaign, research outcome, documentation package, or operational result that can be safely completed and validated within the active plan.

The plan must state the intended run outcome before work begins. When no real blocker exists, an agent must continue through adjacent in-scope checkpoints rather than stopping after only:

- reading or summarizing existing material;
- writing a plan without beginning an already authorized phase;
- creating scaffolding, empty projects, folders, or placeholders;
- adding one isolated DTO, entity, endpoint, component, migration, test shell, or configuration stub;
- making status-only, comment-only, or formatting-only progress;
- completing a trivial checkpoint while the next dependent checkpoint can be safely finished and validated.

A substantial run normally completes the relevant combination of implementation, tests, documentation, contracts, migrations, validation, and handoff evidence. Size is measured by coherent outcome and resolved acceptance criteria, not raw diff size.

The mandate does not permit scope creep, unrelated bundling, giant commits, skipped tests, weakened controls, or false completion claims. A large run may and usually should contain multiple cohesive commits.

A run may stop early only for a documented external blocker, required stakeholder decision, unsafe uncertainty, environment or tool failure, conflicting concurrent work, exhausted execution capacity, or necessary plan revision. The plan state must identify the exact reason, completed work, validation, remaining work, and immediately executable next action.

## Complete documentation mandate

Every plan must identify the full documentation package required by its scope. Documentation is delivered in the same pull request as the implementation, behavior, contract, configuration, migration, operational change, or decision it describes.

Depending on scope, documentation includes:

- product behavior and user flows;
- domain rules, invariants, and lifecycle behavior;
- architecture and ADRs;
- APIs, events, schemas, prompts, and generated contracts;
- configuration, environment variables, defaults, and examples;
- database migrations, compatibility, rollback, or forward-repair procedures;
- deployment, observability, alerts, runbooks, backup, restore, and support guidance;
- security, privacy, food safety, AI cost, localization, accessibility, performance, and resilience;
- test strategy, fixtures, evaluation data, commands, results, limitations, and handoff.

Implementation plans must also define code-level documentation:

- XML documentation for new or materially changed project-owned public and protected .NET types and members;
- XML documentation or equivalent durable explanation for non-obvious internal .NET contracts;
- TSDoc/JSDoc for exported reusable TypeScript APIs whose contracts or side effects are not self-evident;
- rationale-focused inline comments for non-obvious invariants, hazards, security boundaries, concurrency, idempotency, protocols, compatibility, or unusual behavior;
- removal or correction of stale, misleading, redundant, false, or commented-out code.

Generated code is documented at its source schema or generator boundary. Exceptions must be narrow, justified in the plan, and visible in review.

## Mandatory lifecycle

### 1. Create or select the plan

Before changing implementation files, the agent must:

1. read `AGENTS.md`, `docs/plan-status.md`, and all relevant project documentation;
2. create the plan or explicitly claim an existing `Ready`, `Paused`, or `Blocked` plan;
3. add or update the registry row;
4. define the branch, owner, current checkpoint, exact next action, and current run delivery target.

### 2. Execute in substantial bounded checkpoints

- Follow the ordered phases unless the plan is updated with the reason for deviation.
- Complete the largest coherent, safe, validated phase possible in the run.
- Use multiple cohesive commits when the phase is too large for one reviewable commit.
- Keep completed and pending checklist items truthful.
- Record discoveries that change scope, risks, documentation, or acceptance criteria before continuing.
- Create an ADR when the work requires a durable architectural decision.
- Do not silently reduce requirements to make the plan appear complete.
- Do not expand beyond the plan merely to make a delivery appear large.

### 3. Update state before every commit

Before every agent-created commit, update both:

- the active plan's `Execution state` and `Progress log`;
- the matching row in `docs/plan-status.md`.

The update must describe the state produced by that commit, including:

- the substantial run target and checkpoint completed or partially completed;
- files or areas materially changed;
- documentation and code-documentation delivered;
- tests, evaluations, or manual checks performed;
- known failures or unverified behavior;
- the exact next action;
- any blocker or handoff information.

The plan-state changes must be committed with the implementation they describe.

### 4. Pause or hand off safely

Before stopping for any reason, the agent must leave the repository resumable:

- set status to `Paused` or `Blocked` when appropriate;
- identify the intended run target and why it was not fully reached;
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
- durable documentation, code comments, XML documentation, TSDoc/JSDoc, and generated contracts are current where applicable;
- known limitations are recorded;
- the final execution state contains no hidden unfinished work;
- the registry is moved to the completed section.

Delivery state may remain `PR open` or `Awaiting owner merge` after execution becomes `Completed`.

## Implementation and testing separation

For risk-sensitive or substantial features, the implementation plan should define expected verification, while a separate testing plan independently verifies the delivered behavior.

A testing agent must not merely trust the implementation plan's completion claims. It must:

- derive tests from product requirements and acceptance criteria;
- identify the exact branch, pull request, commit, or release under test;
- inspect changed behavior, contracts, code comments, and documentation claims;
- maintain a requirements-to-evidence traceability matrix;
- execute the largest coherent risk-based test campaign possible per run;
- record evidence, failures, defects, and coverage gaps;
- distinguish product defects from test defects and environment limitations;
- provide a final quality assessment and merge or release recommendation;
- update its own plan and registry row before every commit.

Completion of a test plan does not imply that the tested change passed. A completed test plan may have a final outcome of `Fail` or `Inconclusive` when execution and evidence are complete.

## Concurrency rules

- One agent must not claim a plan already owned by another active agent without an explicit handoff.
- Plans that modify overlapping files or contracts must document coordination and merge order.
- Shared architecture or contract changes should be delivered before dependent plans when practical.
- If concurrent work invalidates a plan assumption, pause and update the plan before continuing.

## Plan history

Do not rewrite progress history to hide failed approaches or interruptions. Correct inaccurate entries with a later entry. Completed plans remain in the repository as implementation and decision history.
