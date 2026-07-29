# KitchenFlow Backend

This directory contains the independently deployable KitchenFlow backend API and worker solution.

## Accepted platform

- .NET 10 LTS;
- ASP.NET Core 10;
- modular monolith;
- separate .NET API and worker deployables;
- REST and OpenAPI 3.1;
- Entity Framework Core and PostgreSQL;
- RabbitMQ and transactional outbox;
- Keycloak through OpenID Connect;
- optional Redis for non-authoritative acceleration;
- OpenTelemetry.

See [`ADR-0002`](../../docs/architecture/decisions/0002-backend-platform-and-modular-monolith.md) and the remaining accepted ADRs.

## Local authenticated-slice development

Start PostgreSQL and Keycloak with `docker compose -f infrastructure/compose/compose.dev.yml up -d`. The API launch profiles use `http://localhost:7080` and `https://localhost:7443`; the latter is the Keycloak redirect origin and must use a trusted ASP.NET Core development certificate. Verify it with `dotnet dev-certs https --check --trust` where the host supports trust installation.

Configure `KITCHENFLOW_DB_CONNECTION`, `KITCHENFLOW_OIDC_AUTHORITY`, `KITCHENFLOW_OIDC_CLIENT_ID`, `KITCHENFLOW_OIDC_CLIENT_SECRET`, and `KITCHENFLOW_SESSION_KEYRING_PATH` through an ignored local environment file or secret store. The session key-ring path is development-local only; production deployments must provide a shared protected key ring. Do not place OIDC tokens or client secrets in browser configuration.

## Responsibilities

- backend-for-frontend and API endpoints;
- identity integration, secure browser session, and domain authorization;
- product and household application workflows;
- authoritative inventory, recipe, planning, shopping, cooking, quota, privacy, and audit state;
- transactions, concurrency, idempotency, and migrations;
- AI gateway, context selection, structured workflows, validation, quotas, and cost accounting;
- persistent jobs, outbox publication, message consumption, retries, and dead letters;
- provider integration and degraded behavior;
- observability and support diagnostics without unnecessary private content.

## Initial module direction

```text
Accounts
Profiles
Inventory
Recipes
Cooking
Planning
Shopping
Notifications
Ai
UsageAndBilling
Privacy
AuditAndSupport
```

Modules own their rules and persistence mappings. Cross-module behavior uses explicit application contracts rather than arbitrary table mutation.

## Python boundary

Python is not the authoritative backend. An isolated Python worker may be introduced only when a concrete model, image, or specialized-library requirement justifies it through a plan and ADR. It does not own authentication, authorization, inventory, quota, or the primary database.

## Required properties

- independently buildable, testable, deployable, and observable;
- configuration-driven across environments;
- horizontally scalable where stateless;
- secure by default and explicit about authorization;
- provider-independent at external boundaries;
- compatible with versioned contracts;
- useful during AI and optional-service degradation;
- resumable and idempotent for persistent jobs;
- compliant with documented privacy, deletion, and retention behavior.

## Required reading

- [`../../docs/README.md`](../../docs/README.md)
- [`../../docs/domain/README.md`](../../docs/domain/README.md)
- [`../../docs/architecture/overview.md`](../../docs/architecture/overview.md)
- [`../../docs/ai/overview.md`](../../docs/ai/overview.md)
- [`../../docs/security/security-and-abuse.md`](../../docs/security/security-and-abuse.md)
- [`../../docs/operations/platform-and-reliability.md`](../../docs/operations/platform-and-reliability.md)
- [`../../docs/testing/product-foundation-gates.md`](../../docs/testing/product-foundation-gates.md)
