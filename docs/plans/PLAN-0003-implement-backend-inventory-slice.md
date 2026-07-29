# PLAN-0003: Implement Backend Foundation and Inventory Core

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Codex backend implementation agent
- **Created:** 2026-07-29
- **Last updated:** 2026-07-28T00:00:00Z
- **Branch:** `agent/plan-0003-backend-inventory-slice`
- **Pull request:** Not opened
- **Related implementation plan:** PLAN-0002
- **Related issues:** None
- **Related ADRs:** ADR-0002, ADR-0003, ADR-0004, ADR-0006
- **Dependencies:** PLAN-0002 merged; development environment available

## Objective

Implement the authoritative backend half of the first authenticated inventory vertical slice defined by PLAN-0002. Deliver a production-shaped but bounded ASP.NET Core foundation that authenticates through Keycloak, owns user isolation, persists product and lot history in PostgreSQL, publishes a validated OpenAPI 3.1 contract, and passes deterministic unit, integration, architecture, migration, and security tests.

The agent must implement the exact PLAN-0002 contract. It must not invent frontend behavior, introduce AI, broaden into other KitchenFlow modules, or replace the defined inventory semantics with generic CRUD.

## Mandatory reading and precedence

Read the complete required path in `docs/README.md`, then PLAN-0002, ADR-0002, ADR-0003, ADR-0004, ADR-0006, inventory domain documentation, security documentation, operations documentation, and product-foundation test gates.

Precedence:

1. accepted product/domain documents;
2. accepted ADRs;
3. PLAN-0002 requirements;
4. this implementation plan;
5. local implementation preference.

Stop and record a blocker instead of silently violating a higher-precedence source.

## Deliverable boundaries

### Owned paths

The backend agent owns changes under:

```text
apps/backend/
packages/contracts/openapi/
infrastructure/compose/
infrastructure/keycloak/
scripts/backend/
docs/backend/               only when implementation-specific documentation is required
```

It may update shared repository files only when required for build, CI, plan state, or documentation indexing.

### Prohibited paths and behavior

- Do not modify `apps/frontend`.
- Do not implement UI mocks.
- Do not call AI providers.
- Do not add RabbitMQ business messages or a worker project merely because the future architecture contains workers.
- Do not add Redis as a required runtime dependency.
- Do not add shopping, planning, recipes, cooking, notifications, media, billing, ads, or collaborative household models.
- Do not use Keycloak IDs as KitchenFlow domain primary keys.
- Do not expose EF entities as API DTOs.
- Do not accept owner/user IDs from clients.
- Do not use `float` or `double` for inventory quantities.
- Do not store access or refresh tokens in browser-readable state.

## Required solution structure

Create this structure unless a concrete .NET tooling limitation is documented in the plan before the commit that deviates:

```text
apps/backend/
├── global.json
├── Directory.Build.props
├── Directory.Packages.props
├── KitchenFlow.slnx
├── src/
│   ├── KitchenFlow.Api/
│   ├── KitchenFlow.SharedKernel/
│   ├── KitchenFlow.Modules.Identity/
│   ├── KitchenFlow.Modules.Inventory/
│   └── KitchenFlow.Infrastructure/
└── tests/
    ├── KitchenFlow.UnitTests/
    ├── KitchenFlow.IntegrationTests/
    └── KitchenFlow.ArchitectureTests/
```

### Project responsibilities

- `KitchenFlow.Api`: composition root, HTTP endpoints, auth challenge/logout routes, middleware, OpenAPI, health endpoints, rate limiting, Problem Details, CSRF integration.
- `KitchenFlow.SharedKernel`: small dependency-free primitives such as result/error abstractions, clock interfaces, identifiers, and pagination primitives. It must not become a miscellaneous helper dump.
- `KitchenFlow.Modules.Identity`: internal-user model and application service that maps OIDC `(issuer, subject)` to internal user UUID.
- `KitchenFlow.Modules.Inventory`: domain values, entities, use cases, validation, endpoint contracts owned by inventory, and module registration.
- `KitchenFlow.Infrastructure`: EF Core DbContext, mappings, migrations, PostgreSQL adapters, audit persistence, idempotency persistence, OIDC/Keycloak configuration adapters, OpenTelemetry exporters.

Reference direction is inward. Domain/module projects must not depend on `KitchenFlow.Api` or EF Core implementation types.

## Build and code-quality baseline

- Target `net10.0`.
- Pin a .NET 10 SDK feature band in `global.json` with patch roll-forward only.
- Enable nullable reference types, implicit usings, deterministic builds, documentation generation where useful, and treat warnings as errors in CI.
- Use central package management through `Directory.Packages.props`.
- Pin all package versions; floating package versions are prohibited.
- Add `.editorconfig` rules that match repository conventions.
- Use built-in .NET dependency injection and logging.
- Do not add MediatR, AutoMapper, generic repositories, a custom ORM abstraction, or a service-locator pattern.
- Use explicit application services/use-case handlers and explicit mapping code.
- Use `TimeProvider` or an application-owned clock abstraction for testable UTC time.
- Use `CancellationToken` on all async I/O boundaries.

## Persistence design

Use PostgreSQL 18 current minor and Npgsql EF Core provider compatible with .NET 10.

### Database schemas and tables

Use one KitchenFlow database with explicit schemas:

```text
identity.users
inventory.products
inventory.lots
inventory.transactions
platform.idempotency_records
platform.audit_events
```

Keycloak uses a separate database or separate PostgreSQL database name, never KitchenFlow application tables.

### Required constraints

- UUID primary keys generated by application or database consistently.
- Unique `(issuer, subject)` on internal users.
- Foreign keys include owner consistency where PostgreSQL permits a reliable composite constraint; otherwise application and integration tests must prove owner invariants.
- `products.owner_user_id` and `lots.owner_user_id` are required and indexed.
- Product display name length 160; custom location 80; notes 1,000.
- Measured value stored as `numeric(18,3)` or a documented equal-or-safer decimal mapping.
- Quantity-mode check constraints prevent mixed measured/availability state.
- Storage and stable enum values are persisted as controlled strings or explicit converters with migration-safe values.
- Printed expiration is PostgreSQL `date`, not timestamp.
- UTC instants use `timestamptz`.
- Lot `version` is explicit `bigint`, starts at 1, and increments on every successful mutation.
- Soft deletion records `deleted_at` and retains history.
- Transaction and audit records are append-only through application behavior.
- Idempotency record uniqueness includes internal user, operation scope, and idempotency key.

### Migration rules

- Create named migrations; never use `EnsureCreated` outside disposable tests.
- Migrations must run from an empty database in CI.
- Generate an idempotent SQL migration script as an artifact.
- The application must not automatically apply production migrations on startup.
- Development compose may use an explicit migration command/service.
- Document rollback implications. Destructive rollback is not required for the first migration, but forward recovery must be possible.

## Domain implementation requirements

Implement validated value objects or equivalent domain types for:

- product display name;
- measured quantity and unit;
- availability quantity;
- storage location/custom location;
- package state;
- printed expiration date/provenance;
- notes;
- lot concurrency version;
- idempotency key.

The domain must make invalid mixed quantity states unrepresentable after construction.

### Inventory operations

Implement explicit application use cases:

- `CreateInventoryLot`
- `ListInventoryLots`
- `GetInventoryLot`
- `UpdateInventoryLotMetadata`
- `AdjustInventoryLot`
- `DeleteInventoryLot`
- `GetInventoryLotHistory`

Each use case:

1. resolves current internal user from a request-scoped accessor;
2. validates contract input;
3. loads only owner-scoped data;
4. applies domain rules;
5. persists atomically;
6. emits audit metadata;
7. returns a typed result mapped to HTTP at the API boundary.

Do not place business rules in controllers/endpoints or EF configurations.

## Authentication and browser session

Use ASP.NET Core cookie authentication plus OpenID Connect Authorization Code flow with PKCE against Keycloak.

### Required behavior

- `/api/v1/auth/login` challenges the OIDC scheme and accepts only validated local return URLs.
- OIDC callback is handled by backend middleware.
- On successful ticket validation or first protected request, resolve/create internal user by issuer and subject.
- Application session cookie is `HttpOnly`, `Secure`, scoped narrowly, and configured with a justified `SameSite` value.
- Session keys use Data Protection and must support a shared key ring in later multi-instance deployments; local filesystem persistence is acceptable only for development and must be documented.
- `/api/v1/auth/logout` signs out local cookie and OIDC provider.
- `/api/v1/session` returns internal user UUID, preferred locale metadata when available, supported locales, CSRF token, and no provider tokens.
- Never return Keycloak admin APIs or credentials to the frontend.

### CSRF

- Use ASP.NET Core antiforgery for state-changing cookie-authenticated routes.
- Issue a request token through `/api/v1/session` or a dedicated documented endpoint.
- Require `X-CSRF-TOKEN` for POST, PATCH, and DELETE API requests.
- Authentication challenge/callback routes follow OIDC correlation/state protections and are not converted into custom credential endpoints.

### Development realm

Add a versioned development realm import under `infrastructure/keycloak/` containing:

- KitchenFlow realm;
- confidential backend OIDC client with local HTTPS redirect URIs;
- two deterministic test users, `inventory-user-a` and `inventory-user-b`;
- development-only credentials clearly marked as nonproduction fixtures;
- no real email, personal data, production secret, or reusable external credential.

## HTTP and API implementation

Use ASP.NET Core route groups or controllers consistently. Prefer module-owned endpoint registration with the API project as composition root.

### Endpoint checklist

Implement exactly the endpoints required by PLAN-0002 under `/api/v1`.

For each endpoint:

- authorize by default;
- validate route/query/body separately;
- return documented status codes;
- return `ETag` on lot create/read/update/adjustment responses;
- require `If-Match` on mutation routes;
- apply idempotency to create and adjustment;
- produce typed OpenAPI metadata and examples;
- never return localized success prose;
- include cancellation behavior.

### Problem Details

Configure centralized exception and error mapping to `application/problem+json`.

Stable error codes must include at least:

```text
authentication_required
resource_not_found
validation_failed
domain_rule_violated
precondition_required
precondition_failed
idempotency_key_reused
invalid_cursor
rate_limit_exceeded
unexpected_error
```

Unexpected exceptions are logged once with trace ID and return no stack trace, SQL, secret, or internal type name.

### Cursor pagination

- Use an opaque URL-safe cursor signed or otherwise tamper-evident.
- Cursor encodes sort position only, not authorization.
- Always reapply owner scope.
- Invalid cursor returns documented `400 invalid_cursor`.
- Page size default 25, maximum 100.

## Idempotency design

Implement idempotency transactionally in PostgreSQL.

- Hash a canonical representation of relevant request payload plus operation scope.
- Store user ID, key, scope, request hash, status, and serialized semantic response reference.
- First request owns execution.
- Completed replay returns original status/body/ETag semantics.
- Same key with different hash returns `409 idempotency_key_reused`.
- Concurrent in-progress duplicate waits boundedly or returns a documented retryable conflict; choose one behavior and test it.
- Never use Redis as the authoritative idempotency store.
- Define a retention configuration but do not add a cleanup worker in this plan.

## OpenAPI contract milestone

This milestone unblocks PLAN-0004 live integration.

Required outputs:

- runtime OpenAPI 3.1 document at a stable development path;
- reproducible command that exports `packages/contracts/openapi/kitchenflow-v1.json`;
- committed contract snapshot;
- CI drift check that fails when backend endpoints change without regenerating the snapshot;
- schemas and examples for every required request, response, enum, Problem Details variant, ETag, `If-Match`, CSRF, and idempotency header;
- contract lint/parse validation;
- no internal persistence schema leakage.

When this milestone is complete, update PLAN-0003 and PLAN-0004 with the exact commit SHA and contract path before committing.

## Observability and health

Instrument with OpenTelemetry APIs and ASP.NET Core/HTTP/EF instrumentation.

Required:

- W3C trace context;
- structured logs with trace/correlation ID;
- route/status/latency metrics;
- database spans;
- mutation counters;
- validation, concurrency, idempotency replay, and authorization-failure counters;
- redaction of cookies, auth headers, tokens, product names, notes, and request bodies;
- `/health/live` process liveness;
- `/health/ready` PostgreSQL and required identity-configuration readiness;
- optional exporters selected through configuration.

No telemetry backend vendor is hard-coded into domain code.

## Development infrastructure

Create or extend compose assets for the slice:

- PostgreSQL application database;
- PostgreSQL Keycloak database, using the same server or separate container with distinct databases;
- Keycloak pinned container and realm import;
- OpenTelemetry Collector optional/default according to environment document;
- named volumes;
- health checks;
- localhost-only port exposure where possible;
- `.env.example` with nonsecret placeholders;
- no Redis, RabbitMQ, or object storage required by default slice startup.

Provide a single documented command to start dependencies and a separate command to run migrations.

## Testing requirements

### Unit tests

Cover every quantity, storage, expiration, name, adjustment, deletion, concurrency, and cursor domain rule. Include boundary values and invalid mixed states.

### Integration tests

Use real PostgreSQL through Testcontainers or the repository-approved equivalent. Do not use EF Core InMemory provider.

Cover:

- migration from empty database;
- unique user identity;
- atomic create including transaction/audit;
- owner-scoped list/read/update/delete/history;
- two-user isolation;
- decimal round-trip;
- check constraints;
- consume/discard lower bound;
- correction history;
- soft deletion;
- optimistic concurrency;
- idempotency replay/different-payload conflict;
- cursor pagination and tampering;
- Problem Details status/code mappings;
- CSRF rejection and success;
- OpenAPI generation.

Authentication integration tests may use a test authentication handler for endpoint behavior, but at least one compose/E2E smoke path must use real Keycloak before plan completion.

### Architecture tests

Fail when:

- module/domain projects reference API;
- domain types reference EF Core or ASP.NET Core;
- inventory module references frontend or provider SDKs;
- endpoint contracts are persistence entities;
- forbidden project dependencies appear.

### Security checks

- no secret scanning findings introduced;
- dependency vulnerability audit has no unresolved critical/high finding;
- cross-user ID access returns 404;
- logs and Problem Details do not leak sensitive values;
- open redirect attempts are rejected;
- mutation without CSRF is rejected.

## Required commands before review

The exact scripts may wrap these commands, but all results must be recorded:

```text
dotnet --info
dotnet restore apps/backend/KitchenFlow.slnx --locked-mode
dotnet format apps/backend/KitchenFlow.slnx --verify-no-changes
dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore
dotnet test apps/backend/KitchenFlow.slnx -c Release --no-build
dotnet list apps/backend/KitchenFlow.slnx package --vulnerable --include-transitive
<repository command to start dependencies>
<repository command to apply migrations>
<repository command to export OpenAPI>
<repository command to verify OpenAPI drift>
```

Also perform a real browser login smoke test against Keycloak and one create/list operation before marking validation complete.

## Execution phases

### Phase 0: Claim and baseline

- [ ] Assign owner and update registry.
- [ ] Create branch from current `main` after PLAN-0002 merge.
- [ ] Verify required tools from development-environment document.
- [ ] Record baseline commit and no unrelated modifications.

**Exit criteria:** Plan is `In Progress`, branch and baseline are explicit, environment checks pass.

### Phase 1: Solution and dependency foundation

- [ ] Create exact solution/project structure.
- [ ] Add central build/package configuration.
- [ ] Add formatting, analyzers, lock files, and baseline tests.
- [ ] Add CI build/test skeleton if repository CI is absent.

**Exit criteria:** Empty solution restores, formats, builds, and tests on Linux and Windows-compatible paths.

### Phase 2: Local identity and database infrastructure

- [ ] Add compose PostgreSQL and Keycloak.
- [ ] Add Keycloak realm import and two users.
- [ ] Configure HTTPS development and OIDC/cookie session.
- [ ] Implement internal-user provisioning.
- [ ] Add CSRF and session endpoints.

**Exit criteria:** Real browser login/logout works and `/api/v1/session` returns no provider token.

### Phase 3: Inventory domain and persistence

- [ ] Implement value objects/entities/use cases.
- [ ] Add EF mappings, constraints, migrations, audit, and idempotency tables.
- [ ] Add unit and PostgreSQL integration tests.

**Exit criteria:** Domain and persistence tests cover all PLAN-0002 backend invariants.

### Phase 4: API and contract milestone

- [ ] Implement required endpoints and Problem Details.
- [ ] Implement ETag/If-Match, idempotency, cursor pagination, rate limits.
- [ ] Generate OpenAPI snapshot and drift check.
- [ ] Publish milestone SHA to PLAN-0004.

**Exit criteria:** Contract tests pass and PLAN-0004 is unblocked for live integration.

### Phase 5: Observability, resilience, and complete validation

- [ ] Add telemetry, health endpoints, redaction tests.
- [ ] Run all required commands.
- [ ] Run real Keycloak smoke and two-user isolation scenario.
- [ ] Review migrations and generated contract.
- [ ] Open PR with evidence.

**Exit criteria:** All acceptance criteria are satisfied and no critical/high security issue remains.

## Acceptance criteria

- [ ] All PLAN-0002 backend requirements are implemented.
- [ ] Two authenticated users cannot observe or mutate each other's data by any tested endpoint or ID substitution.
- [ ] Product/lot creation is atomic with initial transaction and audit event.
- [ ] Quantity is decimal or availability state and invalid mixed representations are impossible.
- [ ] Adjustments preserve immutable history and cannot create negative quantities.
- [ ] ETag/If-Match and idempotency behavior match the contract.
- [ ] OpenAPI 3.1 snapshot is generated reproducibly and drift-checked.
- [ ] PLAN-0004 receives an exact stable contract milestone.
- [ ] Empty-database migration, tests, build, formatting, vulnerability audit, and real Keycloak smoke pass.
- [ ] Logs, traces, errors, and metrics contain no forbidden sensitive content.
- [ ] Documentation and compose instructions are current.
- [ ] No excluded module or infrastructure dependency is introduced.

## Execution state

- **Current checkpoint:** EF Core/Npgsql persistence foundation and internal identity table mapping are buildable.
- **Last completed step:** Added explicit schema/table mappings for internal users, products, lots, transactions, audit events, and idempotency records.
- **Exact next action:** Create migrations and local PostgreSQL/Keycloak compose assets, then connect authenticated API use cases to the persistence model.
- **Blockers:** None.
- **Partially modified areas:** None.
- **Validation performed:** Previous foundation validation plus `dotnet restore apps/backend/KitchenFlow.slnx --force-evaluate` and `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`. Restore and build passed with zero warnings/errors after compatible dependency pins were selected.
- **Known failures or limitations:** Migrations, authentication, API behavior, OpenAPI export, compose services, and integration tests do not exist yet. The initial domain is deliberately bounded to the PLAN-0003 manual lot operations and does not implement broader lifecycle transitions or derived lots.
- **Working tree state:** Build outputs are ignored; tracked solution foundation is ready for validation.

## Progress log

### 2026-07-28T00:00:00Z — Codex backend implementation agent

- **Checkpoint:** Claimed PLAN-0003 and established the implementation baseline.
- **Changes included in the commit:** Updated PLAN-0003 ownership, branch, execution state, baseline evidence, and continuation; reconciled PLAN-0002 delivery in the registry; moved PLAN-0003 to `In Progress`.
- **Validation performed:** `git fetch origin main --prune`; clean status; verified `origin/main` at `e2685b7`; ran the required OS, CPU, memory, disk, Git, Docker, Compose, .NET, Node, npm, curl, jq, and OpenSSL checks.
- **Result:** The prerequisite plan is merged and the supported host can create and validate the backend slice.
- **Next action:** Create the solution and dependency foundation.
- **Blockers or handoff notes:** No production data, credentials, tokens, cookies, or private environment values were inspected or recorded.

### 2026-07-28T00:10:00Z — Codex backend implementation agent

- **Checkpoint:** Completed the solution and dependency foundation.
- **Changes included in the commit:** Added `KitchenFlow.slnx`; the API, SharedKernel, Identity, Inventory, Infrastructure, unit, integration, and architecture projects; exact SDK selection; central package/build settings; NuGet lock files; repository formatting rules; a baseline unit test; and Linux CI restore/format/build/test checks.
- **Validation performed:** `dotnet restore apps/backend/KitchenFlow.slnx --force-evaluate`; `dotnet restore apps/backend/KitchenFlow.slnx --locked-mode`; `dotnet format apps/backend/KitchenFlow.slnx --verify-no-changes --no-restore`; `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`; and `dotnet test apps/backend/KitchenFlow.slnx -c Release --no-build`.
- **Result:** Restore, formatting, and Release build passed with zero warnings/errors; the baseline unit test passed. Empty integration and architecture assemblies have no test cases at this checkpoint.
- **Next action:** Implement local PostgreSQL/Keycloak infrastructure and secure identity/session foundation.
- **Blockers or handoff notes:** No runtime service or production credential has been added.

### 2026-07-28T00:20:00Z — Codex backend implementation agent

- **Checkpoint:** Added the dependency-free inventory domain foundation.
- **Changes included in the commit:** Added validated product names, measured and qualitative quantities, storage, notes, expiration provenance, product/lot entities, version increments, explicit adjustment/delete behavior, and immutable transaction records with unit coverage.
- **Validation performed:** `dotnet format apps/backend/KitchenFlow.slnx --verify-no-changes --no-restore`; `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`; `dotnet test apps/backend/tests/KitchenFlow.UnitTests/KitchenFlow.UnitTests.csproj -c Release --no-build`.
- **Result:** Formatting and build pass with zero warnings/errors; five unit tests pass.
- **Next action:** Persist the domain through EF Core/Npgsql and establish local service infrastructure.
- **Blockers or handoff notes:** The first test assertion incorrectly treated consuming all remaining quantity as invalid; it was corrected to test only a negative-result adjustment, matching the accepted nonnegative rule.

### 2026-07-28T00:30:00Z — Codex backend implementation agent

- **Checkpoint:** Added the EF Core/Npgsql persistence foundation.
- **Changes included in the commit:** Added pinned EF Core, Npgsql, OIDC, OpenAPI, OpenTelemetry, integration-test, and architecture-test dependencies; internal-user identity model; and explicit PostgreSQL schema mappings for all PLAN-0003 persistence tables and constraints.
- **Validation performed:** `dotnet restore apps/backend/KitchenFlow.slnx --force-evaluate`; `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`.
- **Result:** Restore and Release build passed with zero warnings/errors. Initial dependency pins exposed vulnerable/incompatible OpenAPI and telemetry transitive versions; pins were upgraded to Microsoft.OpenApi 2.11.0, OpenTelemetry 1.17.0, EF Core/Npgsql 10.0.3, resolving the build and advisory failures.
- **Next action:** Add migrations and compose services before API use cases.
- **Blockers or handoff notes:** No migration has been generated yet; the application does not run persistence automatically on startup.

### 2026-07-29T00:25:00Z — AI planning agent

- **Checkpoint:** Implementation plan created.
- **Changes included in the commit:** Added exact backend scope, structure, persistence, auth, API, contract, observability, test, and phase instructions.
- **Validation performed:** Mapped backend responsibilities to PLAN-0002 and ADR-0002/3/4/6.
- **Result:** Ready for assignment after PLAN-0002 merge.
- **Next action:** Backend agent claims the plan and establishes baseline.
- **Blockers or handoff notes:** Do not begin from the planning branch; branch from updated `main` after merge.

## Completion and handoff checklist

- [ ] All phases and acceptance criteria are resolved truthfully.
- [ ] Tests, migrations, OpenAPI, and real identity smoke evidence are complete.
- [ ] Documentation and ADRs remain current.
- [ ] PLAN-0004 contract handoff is recorded.
- [ ] `docs/plan-status.md` matches this plan.
- [ ] PR reports all validation and limitations.
- [ ] No hidden partial work remains.
- [ ] Branch cleanup responsibility is recorded.
