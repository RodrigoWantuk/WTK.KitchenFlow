# Architecture Decision Records

Architecture Decision Records capture significant decisions, context, alternatives, and consequences.

## Mandatory lifecycle

- **Draft:** being written.
- **Proposed:** ready for stakeholder decision.
- **Accepted:** approved and binding.
- **Rejected:** reviewed and not adopted.
- **Superseded:** replaced by a later ADR.
- **Deprecated:** retained for history but no longer recommended.

Do not rewrite accepted history. Add a note or superseding ADR.

## Current ADRs

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-frontend-platform-and-boundary.md) | React/TypeScript frontend through Lovable with a strict backend boundary | Accepted |
| [0002](0002-backend-platform-and-modular-monolith.md) | .NET 10 ASP.NET Core modular monolith and .NET workers | Accepted |
| [0003](0003-primary-data-and-asynchronous-messaging.md) | PostgreSQL, transactional outbox, RabbitMQ, and optional Redis | Accepted |
| [0004](0004-identity-and-browser-session.md) | Keycloak OIDC and backend-managed browser session | Accepted |
| [0005](0005-ai-gateway-and-usage-governance.md) | Central AI gateway, structured context, model routing, and quota ledger | Accepted |
| [0006](0006-deployment-and-observability.md) | Containers, Docker Compose test environment, Virginia production, and OpenTelemetry | Accepted |

## Future decision backlog

ADRs or implementation designs are still required for:

- exact Lovable project runtime, state, component, localization, and test libraries;
- detailed .NET solution and module enforcement;
- migration tooling conventions and schema ownership;
- exact RabbitMQ topology and scheduler implementation;
- exact cloud and managed-service vendors;
- AI providers, model catalog, prompt storage, evaluation tooling, and credit conversion;
- notification providers;
- object-storage provider and media pipeline;
- billing and advertising;
- secret management;
- deployment pipeline and release gates;
- retention schedule and legal launch-country matrix.

Use [`0000-adr-template.md`](0000-adr-template.md) for future records.
