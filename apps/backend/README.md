# KitchenPilot Backend

This directory will contain the independently deployable KitchenPilot backend application.

## Intended responsibilities

- authentication and authorization boundaries;
- household and member application workflows;
- authoritative pantry, shopping, planning, and cooking-session state;
- persistence, migrations, and transactional consistency;
- AI workflow orchestration and structured-response validation;
- background work and integration coordination;
- observability, auditing, rate control, and cost control.

## Current status

No backend platform has been selected. Do not introduce a framework, database library, project layout, or provider SDK until the relevant Architecture Decision Records are accepted.

## Required properties

The backend must be:

- independently buildable, testable, and deployable;
- suitable for managed cloud or self-hosted VPS deployment;
- configuration-driven across environments;
- secure by default and explicit about authorization;
- observable without leaking personal data or credentials;
- provider-independent at external integration boundaries;
- compatible with versioned contracts under `packages/contracts`.

See:

- [`../../docs/architecture/overview.md`](../../docs/architecture/overview.md)
- [`../../docs/architecture/principles.md`](../../docs/architecture/principles.md)
- [`../../docs/ai/overview.md`](../../docs/ai/overview.md)
- [`../../docs/testing/strategy.md`](../../docs/testing/strategy.md)
