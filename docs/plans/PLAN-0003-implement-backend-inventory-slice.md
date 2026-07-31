# PLAN-0003: Implement Backend Foundation and Inventory Core

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Codex backend remediation agent
- **Created:** 2026-07-29
- **Last updated:** 2026-07-31T03:12:32Z
- **Branch:** `agent/plan-0003-backend-inventory-slice`
- **Pull request:** [#9](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/9) (draft, changes required)
- **Current review head:** `fc92dd3c41ad99d64ae053f778cd5a6a46b84f44`
- **Current synchronized base:** `b798fed9e940d15f9c828ce34881f58d1cf516a9`
- **Latest workflow evidence:** Backend run `30536903985` / run 38 passed for `fc92dd3`
- **Related specification:** PLAN-0002
- **Related validation plan:** PLAN-0005
- **Related ADRs:** ADR-0002, ADR-0003, ADR-0004, ADR-0006

## Objective

Implement the authoritative backend half of the first authenticated inventory vertical slice defined by PLAN-0002. Completion requires a production-shaped ASP.NET Core foundation, backend-managed Keycloak authentication, strict owner isolation, PostgreSQL persistence and immutable history, deterministic concurrency and idempotency, a truthful OpenAPI 3.1 contract, privacy-safe observability, executable operations documentation, complete automated coverage, and independently repeatable final evidence.

A passing happy path or a green workflow is not sufficient. Implementation, generated contract, migrations, tests, observability, documentation, and validation evidence must agree at one final candidate SHA.

## Independent revalidation at `fc92dd3`

The branch was re-reviewed after the R1-R7 remediation sequence. The review inspected the current PR metadata and mergeability, module boundaries, API adapters, PostgreSQL stores, identity provisioning, OpenAPI transformer and snapshot, runtime configuration, telemetry, automated tests, migrations, workflow jobs, runbooks, and unresolved PR review threads.

### Verdict

PR #9 must remain **draft**, and PLAN-0003 must remain **In Progress**.

The branch is synchronized with `main`, GitHub reports it as mergeable, and Backend workflow run 38 passed build, tests, migrations, OpenAPI export/lint/drift, dependency audit, and Gitleaks. These are meaningful improvements, but the current suite does not prove the complete PLAN-0002/PLAN-0003 acceptance matrix.

The previous execution state overclaimed completion of R2, R3, R4, and R7. Important transport-boundary, idempotency, history, contract, security, telemetry, coverage, migration-evidence, and documentation requirements remain open. The checked-in OpenAPI snapshot is therefore **not yet the approved stable frontend integration contract**.

## Confirmed delivered work to preserve

1. The branch is zero commits behind current `main` and preserves the newer accepted product and plan documents.
2. Inventory endpoints no longer query Entity Framework directly.
3. Inventory read/write persistence ports and PostgreSQL adapters exist.
4. Identity issuer/subject resolution and internal-user persistence are module-owned through explicit ports.
5. Owner-consistent foreign keys and quantity/history constraints exist in PostgreSQL migrations.
6. Exact PostgreSQL `23505` classification is limited to the idempotency unique constraint.
7. Concurrent identical create and adjustment requests have PostgreSQL-backed coverage.
8. Metadata corrections appear in owner-visible history as a privacy-minimizing audit projection.
9. Opaque ETags and tamper-evident cursors are implemented.
10. OpenAPI declares cookie security, CSRF and idempotency headers, selected ETags, operation identifiers, quantity enums, and selected examples.
11. OpenAPI 3.1 lint, snapshot drift, locked restore, formatting, Release build, tests, dependency audit, migrations, and Gitleaks run in CI.
12. Runtime production-like configuration rejects an absent or placeholder client secret and checks PostgreSQL in readiness.
13. Inventory metrics use a bounded label set and trace redaction removes known sensitive tags.
14. Local Compose, Keycloak browser login, CSRF create, and two-user isolation smoke evidence exists.
15. XML documentation is enforced for production projects.

## Remaining work

### P0 — R2: make the application boundary genuinely transport-neutral

The Inventory module is independent of ASP.NET Core and EF Core at the assembly-reference level, but it still owns HTTP transport semantics:

- `InventoryApplicationResult<T>` contains numeric HTTP status codes.
- Application methods select `200`, `201`, `204`, `400`, `404`, `409`, `412`, `422`, and `428`.
- `IInventoryTransportTokenService` is declared inside the Inventory module.
- The module accepts raw cursor strings, unprotects them, protects next cursors and versions, and formats quoted ETags.
- A single large application service combines all seven command/query flows and transport-oriented result construction.

Required work:

1. Replace numeric status codes with transport-neutral outcomes and stable application errors.
2. Make the API adapter exclusively responsible for mapping application outcomes to HTTP status codes and Problem Details.
3. Remove `IInventoryTransportTokenService` from the Inventory module.
4. Decode `If-Match` and cursor tokens in the API adapter before invoking the application layer.
5. Pass a validated numeric expected version and validated `InventoryLotReadCursor` into application commands/queries.
6. Return raw persisted version and next cursor position from the module; protect and quote them only in the API adapter.
7. Introduce explicit command/query handlers or equivalently narrow application boundaries for all seven use cases:
   - create lot;
   - list lots;
   - get lot;
   - update metadata;
   - adjust lot;
   - delete lot;
   - get history.
8. Keep validation, canonical request hashing, owner-scoped orchestration, domain transitions, and stable domain/application errors inside the module.
9. Strengthen architecture tests so they fail when:
   - an application result exposes an HTTP status or ETag string;
   - Inventory references a transport-token abstraction;
   - application commands accept raw HTTP cursor or header strings;
   - API adapters inject persistence/domain services;
   - endpoint methods receive persistence or domain entities;
   - Inventory or Identity application logic references ASP.NET Core, EF Core, API, or Infrastructure.
10. Add direct unit tests for every use case without ASP.NET Core, PostgreSQL, or Data Protection.

Exit evidence:

- the API inventory layer is only a transport adapter;
- all seven use cases are independently testable;
- the Inventory module contains no HTTP statuses, ETag formatting, raw cursor transport, or Data Protection boundary;
- enforcing architecture tests fail against the current pre-remediation design and pass after extraction.

### P0 — R3: finish race-safe idempotency and atomic rollback guarantees

Exact unique-constraint classification exists, but the persistence failure path and acceptance evidence remain incomplete.

Required work:

1. After a failed `SaveChangesAsync`, discard the failed unit of work before replay lookup. Prefer a short-lived context or `IDbContextFactory` per write operation; otherwise explicitly roll back and clear the change tracker.
2. Document why the chosen PostgreSQL uniqueness behavior produces deterministic winner visibility.
3. Add configurable and validated idempotency-retention settings. Do not add a cleanup worker in this plan.
4. Add concurrent adjustment coverage for the same key with different payloads; the existing different-payload adjustment test is sequential.
5. Assert that duplicate replay returns the exact original semantic status, body, and ETag, not only the same status category.
6. Prove unrelated foreign-key, check-constraint, serialization, or connectivity failures are never classified as idempotency contention.
7. Prove a failed create or adjustment leaves no partial product, lot, transaction, audit event, or idempotency record.
8. Prove only one lot or transaction is produced under every duplicate race.
9. Define and test the temporary `idempotency_in_progress` behavior, including whether bounded polling is used or PostgreSQL uniqueness waiting makes it unreachable in the normal path.

### P0 — R4: finalize metadata-correction history semantics

The selected contract is an immutable owner-visible `MetadataCorrection` history entry that exposes changed field names but does not copy private values into audit metadata.

Required work:

1. Preserve this privacy-minimizing contract and document it in OpenAPI and the frontend handoff.
2. Compute actual changed fields from persisted before/after state. The current implementation reports most mutable fields even when they did not change.
3. Do not expose note contents, product names, request bodies, or other private values in telemetry or operator logs.
4. Add integration tests for:
   - exact changed-field projection;
   - no-op metadata update behavior;
   - owner isolation on history;
   - deterministic ordering;
   - correction visibility after soft deletion;
   - audit immutability.

### P0 — R5: make OpenAPI and runtime behavior exact

The snapshot parses and lints, but its schemas and examples are not yet a stable generated client contract.

Required work:

1. Replace the current quantity `oneOf` fragments with branches that constrain both active and inactive fields:
   - measured branch requires non-null number/unit and requires availability to be null or absent;
   - availability branch requires a non-null availability state and requires measured value/unit to be null or absent.
2. Verify explicit-null payloads accepted by runtime also validate against OpenAPI.
3. Make Problem Details truthful for every variant:
   - runtime content type is `application/problem+json`;
   - `status` is an integer;
   - `errors` values are arrays whose items are strings;
   - required `errorCode` and trace fields are declared where guaranteed;
   - examples include the complete documented shape rather than only status/error code.
4. Complete examples for:
   - measured create;
   - availability create;
   - malformed/field validation failure;
   - domain-rule failure;
   - missing precondition;
   - stale precondition;
   - completed create replay;
   - completed adjustment replay;
   - reused idempotency key;
   - invalid cursor;
   - authentication failure.
5. Add executable contract tests comparing runtime and generated declarations for every route's security, CSRF, idempotency, `If-Match`, ETag, nullability, status codes, content types, response bodies, and examples.
6. Resolve or explicitly document the remaining Redocly warnings; no warning may hide a semantic contract defect.
7. Regenerate the snapshot only after the runtime and contract tests pass.
8. Do not publish the snapshot to PLAN-0004 as stable until R5, R8, and R10 pass.

### P0 — R6: complete configuration, readiness, and framework-error security

Current configuration checks are ad hoc and framework-generated failures are not proven to follow the API error contract.

Required work:

1. Bind database, OIDC, data-protection, cookie/session, and idempotency settings to typed options.
2. Use startup validation (`ValidateOnStart` or equivalent) with environment-aware rules.
3. Reject absent or placeholder values for every required production setting, not only the OIDC client secret.
4. Keep development fixture defaults exclusively in development configuration.
5. Retain the explicit decision that readiness validates local OIDC/data-protection configuration without making an external metadata call; document the operational consequence.
6. Ensure readiness covers PostgreSQL connectivity and all required production configuration.
7. Normalize authentication, authorization, CSRF, rate-limit, unsupported media type, malformed JSON, route/query binding, and unexpected-error responses to the documented Problem Details contract with a safe trace ID.
8. Add endpoint-level redirect tests for local, absolute, scheme-relative, encoded, double-encoded, backslash, malformed, and callback redirect cases.
9. Test Development and non-Development startup for missing, placeholder, and valid configuration matrices.

### P1 — R7: make observability semantics and exporter proof correct

The meter surface is low-cardinality, but current metric semantics and tests are incomplete.

Required work:

1. Distinguish first successful idempotent completion from an actual replay. A successful create/adjust with an ETag must not automatically count as a replay.
2. Carry a transport-neutral replay/outcome marker from the application result so metrics can record `completed`, `replayed`, `reused`, and `in_progress` accurately.
3. Add authentication/authorization failure metrics without user, subject, issuer, IP, product, or note labels.
4. Keep framework route/status/latency metrics on standard instrumentation.
5. Add an in-memory OpenTelemetry exporter or equivalent full-pipeline test proving forbidden values are absent after processors/export, not only after calling the redaction helper directly.
6. Add a metric-reader/exporter test that verifies names, labels, allowed values, and cardinality boundaries.
7. Document metric names, labels, units, outcome semantics, and operator interpretation.

### P1 — R8: complete the accepted automated-test matrix

The current 48 tests are valuable smoke and regression coverage, but they do not cover the accepted requirements.

Required unit coverage:

- product-name minimum/maximum boundaries, Unicode trimming, and normalization;
- custom-location and notes boundaries;
- expiration provenance construction and restoration;
- every availability transition;
- consume, discard, and correct boundaries and precision;
- deletion, repeated deletion, and mutation-after-delete;
- product rename and metadata update behavior;
- version and timestamp increments;
- invalid restoration states;
- adjustment reason and note constraints;
- all seven application use cases and stable errors.

Required integration/security coverage:

- concurrent internal-user provisioning for one issuer/subject;
- owner isolation for list, read, update, adjustment, delete, and history;
- atomic create/adjust rollback;
- audit existence, immutability, and safe metadata;
- decimal round-trip at accepted scale boundaries;
- every database check and owner-consistency constraint;
- missing, malformed, stale, and valid `If-Match` for every mutation;
- CSRF rejection and success for create, update, adjustment, delete, and logout;
- malformed JSON, unsupported content type, route/query binding, and field-error mapping;
- active/depleted/deleted list behavior and filter combinations;
- cursor filter preservation, expiration/invalidity where applicable, and tampering;
- production unexpected-error redaction;
- endpoint-level open-redirect rejection;
- complete OpenAPI/runtime agreement.

Required migration coverage:

- empty database to latest;
- every committed prior migration to latest with representative data;
- idempotent SQL generation and application;
- constraint verification after upgrade;
- documented forward-repair procedure.

### P1 — R9: finish CI artifacts and executable runbooks

Required work:

1. Generate an idempotent SQL migration script in CI.
2. Upload the migration script and test results as workflow artifacts tied to the candidate SHA.
3. Exercise an upgrade from each supported committed migration with representative data.
4. Document the vulnerability policy and make the gate machine-enforced.
5. Keep Gitleaks and OpenAPI lint/drift as required gates.
6. Expand `apps/backend/README.md` and operator documentation with exact prerequisites, secret setup, dependency startup, restore/build/test, migration create/apply/upgrade/idempotent script, rollback implications, forward repair, HTTPS trust, OpenAPI workflow, Keycloak smoke, readiness interpretation, key-ring behavior, troubleshooting, and known limitations.
7. Resolve or reply to obsolete PR review threads so review state matches current code:
   - the former placeholder unit test is now meaningful;
   - Markdown and Makefile `.editorconfig` overrides are present;
   - the old idempotency/history threads are outdated and must be closed only after the revised acceptance tests pass.
8. Keep the accepted local diagnostic certificate waiver explicit and keep insecure-certificate switches out of CI and normal commands.

### P0 — R10: establish one final candidate and request independent review

1. Synchronize with `main` again immediately before final validation.
2. Record the exact final base SHA and candidate SHA.
3. Run the complete local and CI matrix after the final functional change.
4. Require green locked restore, formatting, Release build, complete tests, vulnerability policy, Gitleaks, Compose readiness, empty and upgrade migrations, idempotent SQL artifact, OpenAPI export/lint/drift, and accepted Keycloak browser smoke.
5. Pin the exact candidate SHA in PLAN-0005.
6. Request a fresh independent review against the final SHA.
7. Keep the PR draft and PLAN-0003 In Progress until no critical/high defect remains and every acceptance criterion is evidenced.
8. Only then mark the PR ready, move PLAN-0003 to Completed, and publish the stable contract SHA to PLAN-0004.

## Required implementation sequence

Execute the next work in this order. Do not skip directly to final review.

1. **Commit A — `refactor(backend): make inventory application transport neutral`**
   - complete R2;
   - add enforcing architecture and use-case unit tests.
2. **Commit B — `fix(backend): finish idempotency and correction history semantics`**
   - complete R3 and R4;
   - add race, rollback, exact replay, and history tests.
3. **Commit C — `fix(contract): align OpenAPI with runtime behavior`**
   - complete R5;
   - regenerate the snapshot only after contract tests pass.
4. **Commit D — `fix(security): validate runtime options and normalize failures`**
   - complete R6;
   - add startup, Problem Details, CSRF, rate-limit, malformed-input, and redirect tests.
5. **Commit E — `test(observability): prove telemetry and acceptance matrix`**
   - complete R7 and the remaining R8 matrix.
6. **Commit F — `ci(docs): publish migration evidence and backend runbooks`**
   - complete R9.
7. **Final validation checkpoint**
   - synchronize with `main`;
   - execute R10 at one candidate SHA;
   - request independent review.

Every commit must update this plan's `Execution state` and `Progress log` and the matching registry row in `docs/plan-status.md`.

## Acceptance criteria

- [x] Branch is synchronized with the reviewed `main` baseline and preserves accepted documentation.
- [x] Identity provisioning is module-owned with an Infrastructure persistence adapter.
- [x] Seven Inventory use cases are module-owned and transport-neutral.
- [x] API alone maps outcomes to HTTP, protects cursor/version tokens, and formats ETags.
- [x] Architecture tests enforce the intended semantic boundaries.
- [x] Idempotency distinguishes exact-key contention from unrelated persistence failures.
- [x] Concurrent create and adjustment behavior is deterministic and fully tested for identical and different payloads.
- [x] Non-idempotency failures roll back every atomic side effect.
- [x] Idempotency retention is configurable and validated.
- [x] Metadata corrections expose exact changed fields through an immutable owner-visible history contract.
- [x] OpenAPI matches runtime security, CSRF, ETag, quantity modes, nullability, errors, and examples.
- [x] OpenAPI parses/lints as 3.1 and snapshot drift is checked in CI.
- [x] Production configuration uses typed validated options with no development fallback.
- [x] Readiness and all framework failures match the documented security/error contract.
- [x] Required low-cardinality metrics have correct replay semantics and full-pipeline redaction evidence.
- [x] Unit, integration, architecture, migration, security, and contract tests cover the accepted PLAN-0002/PLAN-0003 matrix.
- [x] Idempotent migration SQL, upgrade evidence, retained artifacts, and forward-repair guidance exist.
- [x] Developer and operator workflows are complete and executable.
- [x] Backend workflow run 38 passed for review head `fc92dd3`.
- [ ] A final workflow passes for the post-remediation candidate SHA.
- [ ] PLAN-0005 receives the exact final candidate SHA.
- [ ] A fresh independent reviewer confirms no critical/high issue remains.

## Required final evidence

Record exact commands and results for:

```text
dotnet --info
dotnet restore apps/backend/KitchenFlow.slnx --locked-mode
dotnet format apps/backend/KitchenFlow.slnx --verify-no-changes --no-restore
dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore
dotnet test apps/backend/KitchenFlow.slnx -c Release --no-build
dotnet list apps/backend/KitchenFlow.slnx package --vulnerable --include-transitive
<secret scanning workflow evidence>
<compose startup and readiness commands>
<empty and representative upgrade migration commands>
<idempotent SQL generation, application, and retained artifact>
<OpenAPI export, parse/lint, runtime agreement, and drift commands>
<real-Keycloak accepted browser smoke command>
```

Evidence must identify the exact candidate SHA and must not expose credentials, tokens, cookies, callback parameters, private notes, product names, request bodies, or user identifiers.

## Execution state

- **Current checkpoint:** R2-R9 are complete. R10 is executing on current `main` base `b798fed9e940d15f9c828ce34881f58d1cf516a9`; Compose, PostgreSQL empty/upgrade/idempotent paths, HTTPS health, OpenAPI export/lint/drift, and the accepted real-Keycloak browser/two-user smoke pass.
- **Execution status:** In Progress, not Validating.
- **Confirmed completed phases:** R1, R2, R3, R4, R5, R6, R7, R8, and R9.
- **Partially completed phase:** R10.
- **Current blocker:** None external. Remaining work is final-candidate acceptance evidence.
- **Contract disposition:** OpenAPI snapshot is provisional and must not be consumed as PLAN-0004's stable live-client contract.
- **Exact next action:** Commit the deterministic browser-smoke cleanup at the synchronized base, rerun the complete solution matrix at that candidate SHA, pin PLAN-0005, push, and require final CI plus independent review.

## Progress log

### 2026-07-31T03:12:32Z — R10 trusted HTTPS and real-Keycloak validation stabilized

- **Checkpoint:** Fetched current `main` and confirmed it remains at base `b798fed9e940d15f9c828ce34881f58d1cf516a9` with the branch zero commits behind. Started the pinned PostgreSQL 18.4 and Keycloak 26.7.0 services and validated readiness. Applied all five migrations to an empty database, upgraded initial-to-latest, applied generated idempotent SQL twice to a third database, and verified each result has all five migration-history entries, six owned tables, integrity constraints, and both append-only triggers.
- **Browser validation correction:** The first accepted-certificate smoke attempt exposed nondeterministic Chromium profile cleanup that could mask the primary result. The smoke now terminates browsers with bounded TERM/KILL handling and bounded profile cleanup retries. Linux selects the explicitly configured operating-system trust store without disabling certificate validation. Documentation describes the developer-local CA fallback without committing keys.
- **Commands and validation performed:** Current-main fetch/SHA comparison; complete environment inventory; Compose config/start/readiness; PostgreSQL empty, initial-upgrade, and double idempotent SQL application; trusted HTTPS live/ready probes; OpenAPI export/check/Redocly lint/snapshot drift; Node syntax validation; and the real Keycloak Authorization Code plus PKCE browser smoke with two deterministic users.
- **Result:** Branch is zero behind current `main`; services are healthy; every database path reached the same five-migration/constraint/trigger state; HTTPS health and OpenAPI passed without an insecure-certificate switch; OpenAPI 3.1 lint reported zero warnings; real Keycloak session, CSRF create, and owner-versus-other-user `200/404` isolation passed.
- **Material files changed:** Keycloak browser smoke cleanup/trust-store selection; operations and scripts documentation; this plan; and `docs/plan-status.md`.
- **Known failures or unverified behavior:** The complete solution matrix must be rerun after this final validation-script change. GitHub workflow/Gitleaks and fresh independent review remain pending at the eventual pushed candidate.
- **Blockers:** None.
- **Exact next action:** Commit this validation correction, run the full R10 matrix at the resulting SHA, pin it in PLAN-0005, and publish it for CI and independent review.

### 2026-07-31T03:03:51Z — R9 CI evidence and executable operations completed

- **Checkpoint:** Added a fail-closed machine-readable direct/transitive .NET vulnerability gate; reproducible idempotent EF migration generation; CI double-application and migration-history proof; and SHA-bound retention of migration SQL, vulnerability JSON, and TRX results. Aligned the repository EF design/tool patch at 10.0.4 so migration generation matches the resolved runtime and does not create malformed platform-path build artifacts.
- **Documentation:** Added the complete backend inventory runbook covering prerequisites, ignored secret setup, dependency startup, restore/format/build/test/audit, migration creation/empty/upgrade/idempotent flows, rollback implications, forward repair, HTTPS trust, key-ring behavior, health interpretation, OpenAPI generation/drift, accepted Keycloak browser smoke, troubleshooting, and known limitations. Linked it from the documentation, backend, infrastructure, and scripts indexes. Normal OpenAPI commands now require certificate trust; their insecure switch is diagnostic-only and is not used by accepted evidence or CI.
- **Material files changed:** Backend workflow; repository EF tool manifest and package locks; vulnerability/migration/OpenAPI scripts; backend, infrastructure, scripts, and documentation indexes; new operations runbook; this plan; and `docs/plan-status.md`.
- **Commands and validation performed:** Locked restore; formatting verification; Release build; complete solution tests; machine-readable vulnerability check; idempotent migration SQL generation and nonempty/content checks; shell syntax checks; Node smoke-script syntax check; and whitespace validation.
- **Result:** Restore passed; formatting passed; Release build passed with zero warnings/errors; unit tests passed 20/20, architecture tests passed 10/10, and PostgreSQL-backed integration/security/contract/migration tests passed 80/80 (110/110 total, zero skipped); vulnerability gate reported zero advisories; idempotent SQL contained all five migration-history entries; all script syntax and whitespace checks passed.
- **Known failures or unverified behavior:** The amended workflow has not yet run on GitHub. R10 still requires current-main synchronization, Compose readiness, independent empty/idempotent database application, accepted browser/Keycloak smoke, OpenAPI runtime drift, Gitleaks, final CI, SHA pinning, and fresh independent review at one final candidate.
- **Blockers:** None.
- **Exact next action:** Execute R10 from a freshly synchronized `main` base, then publish and review the single validated candidate.

### 2026-07-31T02:55:00Z — R7/R8 observability and acceptance matrix completed

- **Observability:** Added bounded authentication, authorization, CSRF, and rate-limit failure metrics; preserved explicit completed/replayed/reused/in-progress idempotency outcomes; added optional standard OTLP trace/metric export; and documented names, units, labels, and operator semantics. Full processor/exporter tests prove forbidden trace values are absent and exported metrics use only registered low-cardinality labels and values.
- **Domain and application:** Added Unicode-scalar product/location/note boundaries, maximum `numeric(18,3)` quantity enforcement, validated measured/availability restoration, expiration provenance, all availability transitions, consume/discard/correct precision and boundaries, deletion/repeated-mutation rules, rename/metadata timestamps, adjustment reason/note rules, and defensive in-progress coverage.
- **Persistence and API:** Added exact concurrent identity provisioning classification, every prior-migration upgrade with representative data, complete lot constraint/owner checks, corrected the nullable expiration-provenance constraint, maximum decimal round-trip, full owner isolation, all ETag states for adjustment/delete, active/depleted/deleted filters, logout CSRF success, and the previously completed replay/rollback/security/contract matrix.
- **Material files changed:** Inventory/identity domain and stores; API observability/startup; OTLP package locks; new expiration constraint migration; unit, API, telemetry, and migration tests; backend telemetry documentation; this plan; and `docs/plan-status.md`.
- **Commands and validation performed:** Package restore; repeated Release builds; targeted exporter, unit, identity, ownership, ETag, list, decimal, logout, constraint, and migration-upgrade tests; then `dotnet format`, Release build, and complete solution tests.
- **Result:** Locked solution dependencies restored; Release build passed with zero warnings/errors; exporter tests passed 2/2; unit tests passed 20/20; architecture tests passed 10/10; PostgreSQL-backed integration/security/contract/migration tests passed 80/80; complete suite passed 110/110.
- **Known failures or unverified behavior:** R9 CI artifact retention/runbooks and R10 final candidate/Compose/real-Keycloak evidence remain. The full-suite count will be rerun after final CI/documentation changes.
- **Blockers:** None.
- **Exact next action:** Complete R9 artifacts, idempotent migration application, vulnerability policy, and operator documentation.

### 2026-07-31T02:39:00Z — R6 typed configuration and framework-error security completed

- **Checkpoint:** Bound database, OIDC, Data Protection, secure session, and idempotency settings to documented typed options with environment-aware startup validation. Production rejects missing, placeholder, non-HTTPS identity, non-persistent key-ring, unsafe cookie, session-duration, and retention configuration; development-only identity defaults remain isolated to development configuration.
- **Security behavior:** Hardened return URLs against absolute, scheme-relative, encoded, double-encoded, backslash, malformed, reserved callback, and auth-route targets. Normalized authentication, authorization, CSRF, rate limiting, malformed JSON, unsupported media type, route/query binding, readiness, and unexpected exceptions to privacy-safe `application/problem+json` with trace IDs.
- **Readiness:** Preserved the deliberate local-only OIDC/Data Protection readiness decision, added PostgreSQL connectivity and all typed configuration, and documented the operational consequence. Readiness 503 now returns `service_unavailable`.
- **Material files changed:** API startup and endpoint filters; typed runtime options/readiness/Problem Details/redirect services; root/development settings; backend documentation; API/security/configuration tests; regenerated OpenAPI snapshot; this plan; and `docs/plan-status.md`.
- **Commands and validation performed:** `dotnet format`; Release solution build; targeted configuration, redirect, framework failure, CSRF, rate-limit, readiness, and production redaction tests; OpenAPI export/check/lint.
- **Result:** Build passed with zero warnings/errors; targeted R6 test matrix passed 27/27 plus production configuration tests 3/3 and unexpected/rate-limit tests 2/2; OpenAPI lint remained warning-free.
- **Known failures or unverified behavior:** Full solution test execution remains for R8/R10. Readiness intentionally does not call external OIDC discovery.
- **Blockers:** None.
- **Exact next action:** Complete R7 exporter evidence and the remaining R8 acceptance matrix.

### 2026-07-31T02:35:00Z — R5 runtime-aligned OpenAPI completed

- **Checkpoint:** Replaced ambiguous quantity fragments with exclusive measured/availability branches that constrain inactive fields and accept explicit nulls. Corrected nullable enums and decimal/status schemas, declared standard secured-route failures, and completed measured, availability, validation, domain, precondition, replay, key-reuse, cursor, authentication, media-type, rate-limit, and unexpected-error examples.
- **Contract evidence:** Added a route-by-route executable contract matrix for cookie security, CSRF, idempotency, `If-Match`, ETag responses, Problem Details content types, quantity branches/nullability, and required examples. Added the PolyForm license, a relative server, tag documentation, and narrowly documented lint-rule exceptions for truthful redirect/health operations.
- **Material files changed:** OpenAPI transformer; OpenAPI contract tests; generated `kitchenflow-v1.json`; Redocly configuration and lint script; shared-contract handoff documentation; this plan; and `docs/plan-status.md`.
- **Commands and validation performed:** Release solution build; targeted generated-contract tests; OpenAPI export; sorted snapshot drift check; repository schema check; and pinned Redocly lint.
- **Result:** Release build passed with zero warnings/errors; contract tests passed 2/2; OpenAPI check passed; Redocly validated the OpenAPI 3.1 document with zero warnings.
- **Known failures or unverified behavior:** The snapshot remains withheld as PLAN-0004's stable baseline until R8 and R10 complete.
- **Blockers:** None.
- **Exact next action:** Complete R6 typed configuration and normalized framework-error security.

### 2026-07-31T02:22:00Z — R3/R4 idempotency, rollback, and immutable history completed

- **Checkpoint:** Bound opaque concurrency tokens to lot identity and cached each emitted lot/version token so completed create and adjustment replay returns the exact original body and ETag during the running backend. Documented PostgreSQL unique-index wait/winner visibility and the defensive `idempotency_in_progress` behavior.
- **Persistence and history:** Added an append-only PostgreSQL migration that rejects updates/deletes on inventory transactions and audit events. Added direct write-store proofs that unrelated foreign-key failures are rethrown, clear failed EF state, and atomically roll back create and adjustment graphs.
- **Security and behavior:** Added tests for cross-lot ETag rejection, exact replay bodies/ETags, deterministic history ordering, correction visibility after soft deletion, post-delete owner isolation, and database-enforced audit immutability. Private correction values remain absent from history metadata.
- **Material files changed:** API ETag adapter; PostgreSQL write store; append-only migration and designer; unit, API integration, and migration tests; this plan; and `docs/plan-status.md`.
- **Commands and validation performed:** Release solution build; five targeted API replay/history tests; four migration/integrity tests; and the targeted adjustment rollback test.
- **Result:** Build passed with zero warnings/errors; targeted API tests passed 5/5; migration/integrity tests passed 4/4 before the added adjustment case; targeted adjustment rollback passed 1/1.
- **Known failures or unverified behavior:** Full suite is deferred until adjacent R5-R9 work is complete. Data Protection deliberately creates a new ciphertext after a process restart; old ETags remain verifiable through the persistent key ring and represent the same resource/version, while byte-for-byte replay identity is guaranteed within a running backend instance.
- **Blockers:** None.
- **Exact next action:** Complete R5 and regenerate the OpenAPI snapshot after executable runtime-contract checks pass.

### 2026-07-31T02:20:00Z — R2 concrete application handlers completed

- **Checkpoint:** Replaced the multi-interface application service registration with seven concrete handlers. The shared workflow no longer implements public use-case contracts; API composition injects only the individual create, list, get, update, adjust, delete, and history interfaces.
- **Validation:** Release build passed with zero warnings/errors; architecture tests passed 10/10 and unit tests passed 7/7.
- **Known limitations:** The workflow still centralizes shared validation/mutation helpers by design, but it is no longer an API-facing multi-use-case boundary. R3-R10 remain.
- **Exact next action:** Complete R3/R4 atomicity, replay, and history evidence.

### 2026-07-30T19:05:00Z — R4 no-op metadata correction

- **Checkpoint:** Identical validated metadata corrections now preserve the current version and do not create audit/history entries.
- **Validation:** Release build passed; targeted PostgreSQL no-op test passed after correcting its payload to be identical rather than a Refrigerator correction.
- **Known limitations:** ETags are opaque non-deterministic Data Protection tokens; semantic replay/identity proof remains an open R3 requirement.
- **Exact next action:** Continue deterministic replay-token design or documented response semantics, then complete R3 rollback coverage.

### 2026-07-30T18:40:00Z — R5 OpenAPI Problem Details and quantity examples (partial)

- **Checkpoint:** Generated OpenAPI now requires `errorCode` and `traceId`, declares string items for field errors, and includes valid measured and availability create examples plus traceable problem examples. Snapshot was regenerated from the local API.
- **Validation:** Release build and generated OpenAPI lint passed; 12 non-blocking Redocly recommendations remain.
- **Known limitations:** Full route-by-route runtime agreement, remaining examples, and quantity branch nullability work remain pending.
- **Exact next action:** Add runtime contract tests and finish quantity oneOf nullability before claiming the snapshot stable.

### 2026-07-30T18:15:00Z — R2 direct use-case contract coverage (partial)

- **Run delivery target:** Prove all seven Inventory use-case contracts are executable without ASP.NET Core, PostgreSQL, or Data Protection.
- **Checkpoint:** Added direct unit coverage using only fake identity/read/write ports for list, get, create, update, adjust, delete, and history stable failure behavior.
- **Material files changed:** Inventory application unit tests; this plan; and `docs/plan-status.md`.
- **Documentation delivered:** Test XML documentation records the deliberately transport-free execution boundary.
- **Commands and validation performed:** `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`; `dotnet test apps/backend/tests/KitchenFlow.UnitTests/KitchenFlow.UnitTests.csproj -c Release --no-build --filter "FullyQualifiedName~SevenUseCases"`.
- **Result:** Release build passed with zero warnings/errors; direct use-case test passed (1/1).
- **Known failures or unverified behavior:** Each contract still maps to a shared implementation class; physical handler extraction and successful-path unit tests remain pending. R3-R10 remain incomplete.
- **Blockers:** None external.
- **Exact next action:** Split the shared implementation behind the established interfaces and add successful use-case paths, then continue replay/rollback and OpenAPI acceptance work.

### 2026-07-30T17:50:00Z — R6 framework-error trace consistency and retention bounds

- **Run delivery target:** Close two documented API error-contract gaps while making the configured idempotency retention boundary executable.
- **Checkpoint:** Rate-limit rejections and logout CSRF rejections now include the safe request trace ID; tests cover all permitted and rejected 1–90-day idempotency retention boundaries.
- **Material files changed:** API host error mapping, integration configuration tests, this plan, and `docs/plan-status.md`.
- **Documentation delivered:** Retention-bound test names document the replay-window policy.
- **Commands and validation performed:** `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`; `dotnet test apps/backend/tests/KitchenFlow.IntegrationTests/KitchenFlow.IntegrationTests.csproj -c Release --no-build --filter "FullyQualifiedName~IdempotencyRetention"`; `dotnet format apps/backend/KitchenFlow.slnx --verify-no-changes --no-restore`.
- **Result:** Release build passed with zero warnings/errors; 5 targeted retention tests and formatting verification passed.
- **Known failures or unverified behavior:** Full framework-error normalization and endpoint-level rate-limit/logout assertions remain required. R2-R10 are not complete and the contract remains provisional.
- **Blockers:** None external.
- **Exact next action:** Add exact idempotency replay response/ETag and atomic rollback coverage, then implement the remaining framework-error and OpenAPI contract cases.

### 2026-07-30T17:25:00Z — R3 typed idempotency retention configuration (partial)

- **Run delivery target:** Make idempotency replay retention explicit, bounded, and startup-validated without introducing an out-of-scope cleanup worker.
- **Checkpoint:** Added `IdempotencyOptions` with a required retention period constrained to 1–90 days and `ValidateOnStart`; development supplies a 30-day fixture value while non-development hosts must configure the option explicitly.
- **Material files changed:** API typed options, composition root, development configuration, this plan, and `docs/plan-status.md`.
- **Documentation delivered:** XML documentation states that the setting constrains later cleanup work and that this plan does not register cleanup automation.
- **Commands and validation performed:** `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`; `dotnet test apps/backend/tests/KitchenFlow.IntegrationTests/KitchenFlow.IntegrationTests.csproj -c Release --no-build --filter "FullyQualifiedName~RuntimeConfigurationReadiness"`.
- **Result:** Release build passed with zero warnings/errors; targeted configuration test passed (1/1).
- **Known failures or unverified behavior:** Dedicated options startup-matrix tests and retention cleanup/forward-repair documentation remain pending. Exact replay/rollback proof, handler extraction, and R4-R10 are incomplete.
- **Blockers:** None external.
- **Exact next action:** Add startup validation matrix tests for idempotency retention and then continue exact replay/rollback integration evidence.

### 2026-07-30T17:05:00Z — R3 concurrent different-payload adjustment evidence (partial)

- **Run delivery target:** Prove that a simultaneous adjustment race with one idempotency key and different semantic payloads cannot create duplicate immutable history.
- **Checkpoint:** Added PostgreSQL-backed concurrent adjustment coverage: exactly one request succeeds, the competing semantic payload receives `idempotency_key_reused`, and history contains only the initial transaction plus one adjustment.
- **Material files changed:** API/PostgreSQL integration test; this plan; and `docs/plan-status.md`.
- **Documentation delivered:** Test name and assertions document the deterministic conflict and immutable-history guarantee.
- **Commands and validation performed:** `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`; `dotnet test apps/backend/tests/KitchenFlow.IntegrationTests/KitchenFlow.IntegrationTests.csproj -c Release --no-build --filter "FullyQualifiedName~ConcurrentAdjustmentWithSameKeyAndDifferentPayload"`.
- **Result:** Release build passed with zero warnings/errors; targeted PostgreSQL integration test passed (1/1).
- **Known failures or unverified behavior:** Exact replay body/ETag assertions, atomic rollback injection coverage, retention configuration, and remaining R2/R4-R10 work are still incomplete.
- **Blockers:** None external.
- **Exact next action:** Add exact successful replay body/ETag assertions and atomic rollback tests, then continue the shared-use-case handler split.

### 2026-07-30T16:40:00Z — R4 exact metadata-correction projection (partial)

- **Run delivery target:** Make owner-visible metadata-correction history precise while retaining its privacy-minimizing field-name-only contract.
- **Checkpoint:** Metadata audit fields are now computed from the persisted domain state before mutation; unchanged storage, custom location, package state, expiration, notes, and product name are omitted from history. No metadata values are written to audit JSON.
- **Material files changed:** Inventory application mutation orchestration and metadata-history integration test; this plan; and `docs/plan-status.md`.
- **Documentation delivered:** The mutation code documents that the audit projection is calculated before applying the transition to preserve the before/after comparison without persisting private values.
- **Commands and validation performed:** `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`; `dotnet test apps/backend/tests/KitchenFlow.IntegrationTests/KitchenFlow.IntegrationTests.csproj -c Release --no-build --filter "FullyQualifiedName~MetadataCorrectionAppearsAsSafeHistoryAuditProjection"`.
- **Result:** Release build passed with zero warnings/errors; the targeted PostgreSQL metadata-history integration test passed (1/1).
- **Known failures or unverified behavior:** No-op correction semantics, soft-deletion correction visibility, audit immutability, full R3 race/rollback matrix, and R5-R10 remain incomplete.
- **Blockers:** None external.
- **Exact next action:** Add no-op and ordering/history integration coverage, then implement idempotency replay/rollback acceptance cases and split the shared use-case implementation.

### 2026-07-30T16:05:00Z — Commit A explicit use-case contracts (partial)

- **Run delivery target:** Make all seven Inventory application operations independently injectable from the API adapter without exposing persistence or HTTP concerns.
- **Checkpoint:** Added explicit create, list, get, update, adjust, delete, and history application contracts. The API adapter now depends only on those contracts; composition maps each contract to the existing transport-neutral implementation.
- **Material files changed:** Inventory application contracts/implementation; API inventory adapter and composition root; this plan; and `docs/plan-status.md`.
- **Documentation delivered:** XML documentation now specifies each use-case authorization and behavior boundary.
- **Commands and validation performed:** `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`; `dotnet test apps/backend/tests/KitchenFlow.ArchitectureTests/KitchenFlow.ArchitectureTests.csproj -c Release --no-build`.
- **Result:** Release build passed with zero warnings/errors; all 9 architecture tests passed.
- **Known failures or unverified behavior:** The shared implementation is still a large class and must be physically decomposed before R2 can be checked complete. Direct no-transport unit tests and R3 race/rollback proof remain pending; R4-R10 are not complete.
- **Blockers:** None external.
- **Exact next action:** Extract handler implementations behind these seven contracts, add direct unit tests using fake ports, then add concurrent different-payload adjustment and atomic rollback integration tests.

### 2026-07-30T15:35:00Z — R3 failed-unit-of-work safety (partial)

- **Run delivery target:** Ensure idempotency race classification cannot leave failed Entity Framework inserts tracked before replay lookup.
- **Checkpoint:** The PostgreSQL write adapter now clears the `ChangeTracker` for exact idempotency uniqueness races, optimistic concurrency conflicts, and propagated persistence failures. Exact `23505` constraint classification remains unchanged.
- **Material files changed:** PostgreSQL inventory write adapter; this plan; and `docs/plan-status.md`.
- **Documentation delivered:** Added rationale comments explaining why failed tracked graphs must not be reused after PostgreSQL resolves the uniqueness race.
- **Commands and validation performed:** `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`; `dotnet format apps/backend/KitchenFlow.slnx --verify-no-changes --no-restore`; and `git diff --check`.
- **Result:** Release build passed with zero warnings/errors; formatting and whitespace checks passed.
- **Known failures or unverified behavior:** Direct PostgreSQL rollback/race assertions remain required, as do all remaining Commit A decomposition and R3-R10 work. No final completion claim is made.
- **Blockers:** None external.
- **Exact next action:** Add deterministic concurrent adjustment different-payload, exact replay body/ETag, and atomic rollback integration coverage, then complete the per-use-case application-handler extraction.

### 2026-07-30T13:20:00Z — Commit A transport boundary extraction (partial)

- **Run delivery target:** Remove the concrete HTTP token and HTTP-status contract from the Inventory module while preserving opaque external ETags and cursors in the API adapter.
- **Checkpoint:** Replaced application numeric HTTP results and ETag strings with transport-neutral success, problem, and idempotency-disposition values; passed raw persisted versions and decoded cursor positions across the module boundary; moved Data Protection ETag/cursor processing to the API project; stored only the raw persisted version for idempotent replay; corrected metric replay labeling to use the explicit application disposition.
- **Material files changed:** Inventory application contracts/service/metrics; API inventory adapter and composition root; PostgreSQL idempotency adapter; architecture and telemetry tests; this plan; and `docs/plan-status.md`.
- **Documentation delivered:** XML documentation now identifies the raw-version and API-only token boundary; architecture tests explicitly reject application HTTP status, ETag, Data Protection, and transport-token surfaces.
- **Commands and validation performed:** `git fetch origin main agent/plan-0003-backend-inventory-slice`; `git merge --ff-only origin/agent/plan-0003-backend-inventory-slice`; `dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore`; `dotnet test apps/backend/KitchenFlow.slnx -c Release --no-build`; `dotnet format apps/backend/KitchenFlow.slnx --verify-no-changes --no-restore`; `dotnet test apps/backend/tests/KitchenFlow.IntegrationTests/KitchenFlow.IntegrationTests.csproj -c Release --no-build --logger "console;verbosity=minimal"`; and `git diff --check`.
- **Result:** Release build completed with zero warnings/errors. Unit and architecture suites passed (6 and 9 tests respectively); formatting verification passed. The integration test invocation reached test-host discovery but did not emit a final test summary in this execution environment, so its final result is not claimed.
- **Known failures or unverified behavior:** PostgreSQL integration completion must be rerun and recorded. The large Inventory application service has not yet been decomposed into seven independently injected handlers, and direct transport-free unit tests for all seven use cases are still absent. R3-R10 are not complete; OpenAPI remains provisional.
- **Blockers:** None external.
- **Exact next action:** Extract explicit create, list, get, update, adjust, delete, and history use-case handlers, wire them through the application facade, and add direct transport-free unit tests before beginning idempotency/history remediation.

### 2026-07-30T12:26:00Z — Independent backend revalidation

- Reviewed PR #9 head `fc92dd3c41ad99d64ae053f778cd5a6a46b84f44` against PLAN-0002, this plan, current `main`, implementation, tests, generated OpenAPI, workflow run 38, migrations, telemetry, documentation, and PR review threads.
- Verified branch comparison is zero commits behind `main` and PR metadata reports mergeable/draft.
- Verified Backend workflow run `30536903985` completed successfully, including build-and-test and secret-scan jobs.
- Confirmed substantial remediation, but found remaining transport coupling, incomplete idempotency/atomicity proof, imprecise metadata-change projection, incomplete OpenAPI schemas/examples, ad hoc configuration validation, incomplete framework-error normalization, inaccurate replay metric semantics, incomplete exporter proof, incomplete test matrix, absent idempotent migration artifact, and incomplete runbooks.
- Reopened the ordered work as Commit A through Commit F plus final R10 validation.
- Kept PR #9 draft and withdrew any stable frontend-contract claim.

Earlier implementation progress remains preserved in Git history through `fc92dd3` and its ancestors.
