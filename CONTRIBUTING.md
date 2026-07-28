# Contributing to KitchenFlow

KitchenFlow is currently an early-stage source-available project. Contributions must preserve product intent, architectural clarity, documentation quality, safety, privacy, localization readiness, and testability.

## Before starting

Read:

- `README.md`;
- `AGENTS.md`;
- `docs/README.md`;
- `docs/plan-status.md`;
- `docs/plans/README.md`;
- the relevant product and architecture documents;
- every applicable Architecture Decision Record and active plan.

Open or reference an issue for nontrivial work so scope, acceptance criteria, and architectural impact are visible before implementation grows.

## Language

All technical content must be written in English, including code, comments, tests, documentation, branches, commits, issues, and pull requests.

User-facing content must use the selected localization system once established. Do not hard-code interface text in application logic.

## Plan requirement

Every nontrivial contribution performed by an agent must use a plan under `docs/plans/` and a matching row in `docs/plan-status.md`.

Before implementation begins:

1. create or claim the plan;
2. confirm included and excluded scope;
3. define testable acceptance criteria and required validation;
4. identify ownership, dependencies, branch, current checkpoint, and exact next action;
5. register the plan in `docs/plan-status.md`.

Use `docs/plans/0000-plan-template.md` and follow the lifecycle defined in `docs/plans/README.md`.

## Branches and commits

Use descriptive branch names. Agent-created branches should include the plan ID:

```text
agent/plan-0001-short-scope
```

Use concise imperative commit messages, for example:

```text
Add pantry quantity validation
Document AI provider fallback policy
Fix household authorization boundary
```

Before **every agent-created commit**, update:

- the active plan's `Execution state` and `Progress log`;
- the matching row in `docs/plan-status.md`.

The update must record the checkpoint represented by the commit, material changes, validation performed, known limitations, blockers, and exact next action. Commit the plan-state updates together with the work they describe.

Before pausing, blocking, or handing off work, leave enough repository state for another contributor to continue without access to the previous conversation.

Delete merged working branches after the merge unless an explicit operational reason requires them to remain.

## Pull requests

Keep pull requests cohesive and reviewable. A pull request must describe:

- the linked plan and current delivery state;
- what changed;
- why it changed;
- user and developer impact;
- architecture, security, privacy, safety, localization, and operational implications;
- tests and validation performed;
- known limitations or follow-up work.

Update documentation, the active plan, and `docs/plan-status.md` in the same pull request when behavior, architecture, contracts, configuration, operations, or execution state change.

## Architecture decisions

Do not establish a durable technology, data, security, deployment, AI, or contract precedent without an accepted ADR. Use `docs/architecture/decisions/0000-adr-template.md`.

## Quality requirements

Before requesting review:

- run relevant formatting, analysis, build, and test commands;
- add tests appropriate to the risk and behavior;
- verify failure and recovery paths;
- validate localization and accessibility implications;
- confirm no credentials, personal data, or private transcripts were added;
- ensure documentation remains truthful;
- ensure the plan and registry match the branch state;
- disclose checks that could not be run.

## AI-generated contributions

AI-generated code and documentation are held to the same standard as human-generated work. The contributor is responsible for reviewing correctness, dependencies, licensing, security, privacy, architecture, and tests.

Generated output must not be merged solely because it compiles or appears plausible.

## License

By contributing, you agree that your contribution will be distributed under the repository's PolyForm Noncommercial License 1.0.0 terms unless a separate written agreement states otherwise.
