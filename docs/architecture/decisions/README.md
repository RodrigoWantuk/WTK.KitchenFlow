# Architecture Decision Records

Architecture Decision Records (ADRs) capture significant decisions, their context, considered alternatives, and consequences.

## When an ADR is required

Create an ADR for decisions that materially affect:

- system boundaries or deployment topology;
- languages, frameworks, databases, or major dependencies;
- API, event, or schema conventions;
- authentication, authorization, security, or privacy;
- AI providers, prompts, evaluations, or model-routing strategy;
- data ownership, retention, migrations, or compatibility;
- localization, accessibility, observability, or release processes;
- decisions that are expensive or risky to reverse.

Routine implementation details do not require an ADR unless they establish a durable precedent.

## File naming

Use a four-digit sequence followed by a short kebab-case title:

```text
0001-backend-platform.md
0002-frontend-platform.md
0003-primary-database.md
```

Use `0000-adr-template.md` as the starting point.

## Status lifecycle

- **Draft**: being written.
- **Proposed**: ready for decision.
- **Accepted**: approved and binding.
- **Rejected**: reviewed and not adopted.
- **Superseded**: replaced by a later ADR.
- **Deprecated**: retained for history but no longer recommended.

Do not rewrite the historical rationale of an accepted ADR to make a later outcome appear inevitable. Add notes or create a superseding ADR.

## Decision process

1. Define the problem and decision drivers.
2. Identify realistic options, including retaining the current state.
3. Compare options using the same criteria.
4. Document security, privacy, cost, operability, portability, testing, and migration impact.
5. Record the decision and its consequences.
6. Link the implementing issues and pull requests.
7. Review the result after implementation when the decision includes measurable expectations.

## Current decision backlog

The initial architecture overview identifies the first ADRs required before implementation choices become binding. See [`../overview.md`](../overview.md#decisions-still-required).
