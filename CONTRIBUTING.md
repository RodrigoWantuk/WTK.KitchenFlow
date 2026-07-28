# Contributing to KitchenFlow

KitchenFlow is currently an early-stage source-available project. Contributions must preserve product intent, architectural clarity, documentation quality, safety, privacy, localization readiness, and testability.

## Before starting

Read:

- `README.md`;
- `AGENTS.md`;
- `docs/README.md`;
- the relevant product and architecture documents;
- every applicable Architecture Decision Record.

Open or reference an issue for nontrivial work so scope, acceptance criteria, and architectural impact are visible before implementation grows.

## Language

All technical content must be written in English, including code, comments, tests, documentation, branches, commits, issues, and pull requests.

User-facing content must use the selected localization system once established. Do not hard-code interface text in application logic.

## Branches and commits

Use descriptive branch names. Agent-created branches should use:

```text
agent/<short-scope>
```

Use concise imperative commit messages, for example:

```text
Add pantry quantity validation
Document AI provider fallback policy
Fix household authorization boundary
```

Delete merged working branches after the merge unless an explicit operational reason requires them to remain.

## Pull requests

Keep pull requests cohesive and reviewable. A pull request must describe:

- what changed;
- why it changed;
- user and developer impact;
- architecture, security, privacy, safety, localization, and operational implications;
- tests and validation performed;
- known limitations or follow-up work.

Update documentation in the same pull request when behavior, architecture, contracts, configuration, or operations change.

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
- disclose checks that could not be run.

## AI-generated contributions

AI-generated code and documentation are held to the same standard as human-generated work. The contributor is responsible for reviewing correctness, dependencies, licensing, security, privacy, architecture, and tests.

Generated output must not be merged solely because it compiles or appears plausible.

## License

By contributing, you agree that your contribution will be distributed under the repository's PolyForm Noncommercial License 1.0.0 terms unless a separate written agreement states otherwise.
