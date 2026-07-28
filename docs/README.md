# KitchenPilot Documentation

This directory is the durable source of truth for product, architecture, engineering, AI, quality, security, and operations decisions.

Documentation must evolve with the implementation. A code change that modifies behavior, contracts, architecture, configuration, deployment, or operational procedures is incomplete until the related documentation is updated.

## Documentation map

```text
product/            Product vision, users, problems, scope, and requirements
architecture/       System architecture, principles, boundaries, and ADRs
ai/                 AI capabilities, prompt lifecycle, providers, validation, and evaluation
testing/            Quality strategy, test levels, and release gates
security/           Security, privacy, threat modeling, and incident practices
operations/         Deployment, observability, backups, and support procedures
```

Some directories will be created when their first approved document is added. Empty placeholder directories are intentionally not tracked by Git.

## Start here

1. [`product/vision.md`](product/vision.md)
2. [`architecture/overview.md`](architecture/overview.md)
3. [`architecture/principles.md`](architecture/principles.md)
4. [`ai/overview.md`](ai/overview.md)
5. [`testing/strategy.md`](testing/strategy.md)
6. [`architecture/decisions/README.md`](architecture/decisions/README.md)

## Document lifecycle

Documents should use one of these statuses when a status is relevant:

- **Draft**: under discussion and not yet binding.
- **Proposed**: ready for review and decision.
- **Accepted**: approved and binding.
- **Superseded**: replaced by another document or decision.
- **Rejected**: considered and intentionally not adopted.
- **Deprecated**: still present for compatibility or history, but should not guide new work.

## Writing standards

- Write technical documentation in English.
- Prefer direct, testable statements over aspirational language.
- Separate facts, decisions, assumptions, risks, and open questions.
- Link to the canonical document instead of duplicating rules.
- Use diagrams that can be reviewed and versioned as text when practical.
- Include dates using ISO 8601 (`YYYY-MM-DD`).
- Reference issues and pull requests when a document is created or materially changed.

## Product documentation versus implementation documentation

Product documents explain the user problem, expected outcomes, rules, and acceptance criteria. Architecture documents explain system boundaries and trade-offs. Implementation details belong near the relevant code when they are local and short-lived, but durable cross-cutting knowledge belongs here.
