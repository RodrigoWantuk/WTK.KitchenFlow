# PLAN-0003: Implement Backend Foundation and Inventory Core

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Codex backend remediation agent
- **Created:** 2026-07-29
- **Last updated:** 2026-07-30T03:10:00Z
- **Branch:** `agent/plan-0003-backend-inventory-slice`
- **Pull request:** [#9](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/9) (draft, changes required)
- **Current implementation baseline:** `2ddeb0fed9aeaa53af6e0c37ec1f2fa227a16d49`
- **Current review base:** `b798fed9e940d15f9c828ce34881f58d1cf516a9`
- **Related specification:** PLAN-0002
- **Related ADRs:** ADR-0002, ADR-0003, ADR-0004, ADR-0006

## Objective

Implement the authoritative backend half of the first authenticated inventory vertical slice defined by PLAN-0002. The completed slice must provide a production-shaped ASP.NET Core foundation with backend-managed Keycloak authentication, strict owner isolation, PostgreSQL product and lot history, a truthful OpenAPI 3.1 contract, deterministic concurrency and idempotency, complete operational documentation, and independently repeatable validation.

This plan is not complete merely because the happy path works. Completion requires the implementation, generated contract, migration path, tests, observability, documentation, and evidence to agree at one final reviewed commit.

## Historical execution record

The detailed implementation log and previous completion claim remain preserved in Git history at commit `2ddeb0fed9aeaa53af6e0c37ec1f2fa227a16d49` and its ancestors. This revalidation supersedes the completion claim but does not erase that history.

The prior CI run against commit `7987982` remains useful historical evidence. It is not evidence for the current or future final head because later commits changed implementation and documentation.

## Revalidation basis

The independent revalidation inspected:

- current PR #9 metadata and branch divergence;
- PLAN-0002 and the original PLAN-0003 requirements;
- API endpoints and application orchestration;
- Identity and Inventory module boundaries;
- PostgreSQL read/write adapters, mappings, constraints, and migrations;
- concurrency and idempotency behavior;
- generated OpenAPI and its transformer;
- authentication, configuration, health, rate limiting, and CSRF behavior;
- telemetry redaction and required metrics;
- unit, integration, architecture, migration, and smoke tests;
- CI, local-development scripts, and operator documentation;
- current-head workflow and status evidence.

## Revalidation verdict

The branch contains substantial and useful remediation after the first review. It now has thin endpoint mappings, explicit inventory persistence ports, owner-consistent database constraints, concurrent-create coverage, opaque version tokens, improved Problem Details/OpenAPI metadata, XML documentation enforcement in production projects, HTTPS-only launch settings, a meaningful replacement for the placeholder unit test, and a reproducible Keycloak smoke script.

However, **PR #9 must remain draft and PLAN-0003 must remain In Progress**. The current OpenAPI snapshot is not approved as the stable frontend integration contract. The current implementation baseline still has correctness, architecture, contract, observability, documentation, testing, and evidence gaps listed below.

## Confirmed improvements since the first review

The remediation agent should preserve these improvements while completing the remaining work:

1. `InventoryEndpoints` maps routes to a service instead of directly querying Entity Framework.
2. Owner-scoped read and write ports exist in the Inventory module and have PostgreSQL adapters.
3. Composite owner foreign keys and additional quantity/history constraints exist in the EF model and follow-up migrations.
4. Concurrent create requests using the same idempotency key have an integration test.
5. Lot versions are exposed as opaque protected tokens and matched to ETags.
6. Problem Details includes stable error-code, trace, and field-error extensions.
7. OpenAPI now declares a session security scheme, common headers, enums, and selected examples.
8. Production projects generate XML documentation and treat missing public documentation as an error.
9. The HTTP-only launch profile was removed; local cookie authentication is explicitly HTTPS.
10. The previous no-op unit test was replaced by a real normalization invariant.
11. The PostgreSQL 18 volume mount is intentionally documented for the image's current cluster layout.
12. A two-profile real-Keycloak smoke script exists and avoids printing credentials, provider tokens, cookies, callback parameters, and request bodies.

## Remaining work

### P0 — synchronize the branch and establish one reviewable final baseline

The branch is currently 67 commits ahead and 2 commits behind `main`, and GitHub reports the PR as non-mergeable.

Required work:

1. Rebase onto or merge the current `main` into `agent/plan-0003-backend-inventory-slice`.
2. Preserve every newer accepted product document, plan, registry row, and governance requirement from `main`.
3. Resolve `docs/plan-status.md` by keeping PLAN-0003 in the active section until every criterion below passes.
4. Re-run the complete validation suite after the synchronization.
5. Record the exact synchronized base SHA and final candidate SHA.

Exit evidence:

- branch is 0 commits behind `main`;
- PR is mergeable or has only known repository-policy restrictions;
- no accepted document or registry row from `main` is lost;
- all later validation points to one final candidate SHA.

### P0 — complete the application and identity boundaries

`InventoryApplicationService` remains a large HTTP-returning class inside `KitchenFlow.Api`. It still owns contract validation, canonical request hashing, cursor parsing/signing, idempotency orchestration, domain construction, mutation selection, and Problem Details mapping. The Inventory module only contains a narrow adjustment/delete lifecycle use case. `CurrentUserService` also provisions internal users directly through `ApplicationDbContext` from the API project.

This does not satisfy the required module responsibilities or the requirement for explicit typed application use cases whose results are mapped to HTTP at the API boundary.

Required work:

1. Add explicit Inventory application handlers for:
   - `CreateInventoryLot`;
   - `ListInventoryLots`;
   - `GetInventoryLot`;
   - `UpdateInventoryLotMetadata`;
   - `AdjustInventoryLot`;
   - `DeleteInventoryLot`;
   - `GetInventoryLotHistory`.
2. Move application input validation and canonicalization into module-owned command/query types or validators that do not reference ASP.NET Core.
3. Return typed application results and stable module errors instead of `IResult`.
4. Keep HTTP-only concerns in the API adapter:
   - route/query/body binding;
   - reading headers;
   - HTTP status selection;
   - Problem Details serialization;
   - ETag header emission;
   - authentication challenge/logout behavior.
5. Keep cursor transport protection in an explicit adapter, while the application query receives a validated sort position rather than an opaque HTTP token.
6. Move issuer/subject provisioning behind an Identity-module use case and persistence port. Implement the EF adapter in Infrastructure. The API adapter may extract claims, but it must not own the persistence workflow.
7. Remove obsolete or unused abstractions after extraction, including any result/clock type that is no longer the chosen application contract.
8. Strengthen architecture tests so they fail when:
   - API classes implement Inventory business use cases;
   - application types reference ASP.NET Core or EF Core;
   - Identity application logic references `ApplicationDbContext`;
   - forbidden project references or namespaces appear;
   - HTTP endpoint methods receive persistence/domain entities.

Exit evidence:

- the API inventory layer is a transport adapter;
- all seven use cases are independently unit-testable without ASP.NET Core or PostgreSQL;
- Identity provisioning is module-owned and infrastructure-adapted;
- architecture tests prove these boundaries rather than only checking endpoint parameter types.

### P0 — make idempotency failure classification correct and race-safe

The PostgreSQL write adapter currently converts broad `DbUpdateException` failures into `IdempotencyConflict`. A foreign-key, check-constraint, serialization, connectivity, or unrelated unique failure can therefore be misclassified and replayed as if another request won the idempotency key.

Required work:

1. Detect PostgreSQL error code `23505` only for the exact idempotency unique constraint.
2. Do not classify any other `DbUpdateException` as idempotency contention.
3. Roll back and clear or discard the failed EF change tracker before trying to read the winning record. Prefer a short-lived context or explicit transaction boundary for replay.
4. Define one concurrent-duplicate behavior:
   - bounded polling followed by replay; or
   - documented retryable `409 idempotency_in_progress`.
5. Apply the same behavior to create and adjustment commands.
6. Verify same-key/different-payload behavior when requests race, not only after one request has completed.
7. Add configuration for idempotency retention. Do not implement a cleanup worker in this plan.
8. Add atomicity tests proving that a non-idempotency database failure leaves no partial product, lot, transaction, audit event, or idempotency record.

Required tests:

- concurrent identical create;
- concurrent create with same key and different payload;
- concurrent identical adjustment;
- concurrent adjustment with same key and different payload;
- unrelated check/FK failure is not reported as idempotency contention;
- winner response status/body/ETag is replayed exactly;
- no duplicate lot or transaction is created.

### P0 — correct and harden the OpenAPI contract

The generated document is improved but still differs from runtime behavior and valid JSON payloads.

Required work:

1. Do not add `X-CSRF-TOKEN` to `/api/v1/auth/login`. Login is an anonymous OIDC challenge protected by state/correlation and does not consume a session-issued antiforgery token.
2. Add ETag only to lot create/read/update/adjustment responses that actually emit it. Do not advertise ETag on session or unrelated success responses.
3. Represent measured and availability quantities as a truthful mutually exclusive schema. Valid measured requests must allow `availabilityState: null`; valid availability requests must allow `measuredValue` and `unit` to be null or absent as defined by the contract.
4. Preserve nullability for optional package state and adjustment value. `AvailabilityChanged` must remain valid without a numeric value.
5. Make Problem Details schemas truthful:
   - `status` is an integer when present;
   - `errors` values are arrays of strings;
   - required stable extensions are documented per variant;
   - runtime content type is `application/problem+json`.
6. Add complete examples for:
   - measured quantity;
   - availability quantity;
   - field validation failure;
   - domain-rule failure;
   - missing and stale precondition;
   - completed idempotent replay;
   - reused idempotency key;
   - invalid cursor;
   - authentication failure.
7. Add contract tests that compare runtime behavior with generated declarations for security, CSRF, ETag, nullability, status codes, content types, and examples.
8. Add an OpenAPI 3.1 parse/lint step in CI in addition to snapshot drift.
9. Regenerate `packages/contracts/openapi/kitchenflow-v1.json` only after these corrections.
10. Publish a new stable milestone SHA to the frontend plan only after the final contract tests and CI pass.

### P0 — secure configuration and readiness

The composition root currently contains development fallback values for OIDC configuration, including a default client secret, and `/health/ready` checks only PostgreSQL.

Required work:

1. Bind database, OIDC, cookie/data-protection, and idempotency settings to validated options.
2. Permit development fixture defaults only through clearly development-only configuration that cannot silently apply in staging or production.
3. In non-Development environments, fail startup when authority, client ID, client secret, database connection, or required key-ring configuration is absent or placeholder-valued.
4. Remove source-level production fallbacks such as `development-only-change-me` from runtime option selection.
5. Extend readiness to verify:
   - PostgreSQL connectivity;
   - required OIDC configuration validity;
   - required data-protection/key-ring configuration for the environment.
6. Decide and document whether readiness also performs a bounded OIDC metadata reachability check. If it does, isolate timeout/failure behavior and avoid leaking provider details.
7. Add tests for missing, placeholder, and valid configuration in Development and non-Development environments.
8. Add explicit open-redirect tests for local, absolute, scheme-relative, encoded, and malformed return URLs.
9. Ensure every framework-generated authentication, CSRF, rate-limit, and unexpected-error response follows the documented Problem Details contract and includes a safe trace ID.

### P0 — resolve metadata-correction history semantics

Metadata updates currently return no `InventoryTransaction`; `/history` therefore cannot show product-name, storage, package-state, expiration, custom-location, or notes corrections. Audit events currently use empty metadata and do not provide an owner-visible correction projection.

Required work:

1. Make an explicit contract decision consistent with PLAN-0002:
   - either include metadata corrections in the owner-visible lot history through a safe audit projection; or
   - formally separate lifecycle transactions from correction audit history and expose/document the second owner-visible source.
2. Do not add an undocumented transaction enum that conflicts with PLAN-0002.
3. Record at least changed field names and safe before/after semantics needed for correction history. Do not place private note text or other sensitive values in telemetry.
4. Keep audit records immutable.
5. Add integration tests proving correction visibility, owner isolation, ordering, and deletion retention.
6. Update OpenAPI and frontend handoff documentation to match the chosen history shape.

### P1 — complete observability instead of claiming instrumentation alone

The implementation has ASP.NET Core and EF instrumentation plus a redaction processor, but PLAN-0003 also requires operation-specific counters and identity-aware readiness.

Required work:

1. Add an application-owned `Meter` with stable, low-cardinality counters for:
   - inventory mutations by operation and outcome;
   - validation/domain rejection;
   - optimistic-concurrency failure;
   - idempotency replay, reuse, and in-progress outcomes;
   - authorization/authentication failure without user identifiers.
2. Keep route, status, and latency on framework instrumentation.
3. Ensure logs and traces carry trace/correlation IDs without pantry contents, product names, private notes, cookies, tokens, raw headers, or request bodies.
4. Add exporter-level tests or an in-memory exporter proving forbidden values are absent after the full telemetry pipeline, not only after calling the redaction helper directly.
5. Document metric names, labels, cardinality limits, and operational interpretation.

### P1 — expand automated coverage to the accepted requirements

Existing tests prove important paths but do not cover every accepted rule.

Required unit coverage:

- all product-name boundary lengths and normalization cases;
- notes and custom-location boundary lengths;
- expiration date/provenance construction and restoration;
- every availability transition;
- consume/discard/correct boundaries and precision;
- deletion, repeated deletion, and mutation-after-delete behavior;
- product rename and metadata update behavior;
- version increment and timestamp behavior;
- invalid restoration states must fail rather than relying on null-forgiving assumptions;
- adjustment reason and note constraints.

Required integration coverage:

- concurrent internal-user provisioning for one issuer/subject;
- owner isolation for list, read, update, adjustment, delete, and history;
- atomic create and rollback of all side effects;
- audit event existence and safe metadata;
- decimal round-trip at scale boundaries;
- every database check and owner-consistency constraint;
- missing, malformed, stale, and valid `If-Match` on every mutation;
- CSRF rejection and success on create, update, adjustment, delete, and logout;
- malformed JSON, unsupported content type, route/query validation, and field-error mapping;
- active/depleted/deleted list behavior and filter combinations;
- cursor filter preservation and tampering;
- production unexpected-error redaction;
- open redirect rejection;
- complete OpenAPI/runtime agreement.

Required migration coverage:

- empty database to latest;
- each committed prior migration to latest with representative data;
- idempotent SQL script generation and application;
- documented forward-repair procedure;
- constraint verification after upgrade.

### P1 — finish CI, security gates, and reproducible operations

Required work:

1. Generate an idempotent SQL migration artifact in CI and retain it as workflow evidence.
2. Add an explicit OpenAPI parse/lint gate.
3. Make the vulnerability audit fail according to a documented critical/high policy rather than relying on human interpretation of console output.
4. Add or invoke secret scanning according to repository policy.
5. Run the final full workflow against the exact final candidate SHA after every remediation and branch synchronization change.
6. Do not treat a workflow run for an older SHA as evidence for the final candidate.
7. Resolve the browser-certificate evidence contradiction:
   - run the smoke on a host that trusts the development certificate without the diagnostic bypass; or
   - record an explicit stakeholder-approved waiver and make documentation consistently state what evidence is accepted.
8. Keep the insecure-certificate switch diagnostic-only and out of CI and normal validation commands.

### P1 — complete developer and operator documentation

The backend README currently does not contain the complete executable workflow.

Required documentation:

1. Exact prerequisites and supported versions.
2. Safe environment/secret setup.
3. One command to start dependencies.
4. Restore, format, build, and test commands.
5. Migration creation, empty apply, upgrade apply, idempotent SQL generation, rollback implications, and forward repair.
6. API startup over trusted HTTPS.
7. OpenAPI export, lint, and drift verification.
8. Real-Keycloak smoke setup, expected evidence, and certificate requirements.
9. Health/readiness interpretation.
10. Troubleshooting for PostgreSQL, Keycloak, cookies, CSRF, HTTPS trust, migrations, and contract drift.
11. Data-protection key-ring expectations for development and later multi-instance deployment.
12. Known limitations and branch/PR handoff.

## Remediation sequence

Execute the remaining work in this order:

1. **R1 — synchronize with `main` and stabilize the baseline.**
2. **R2 — extract Inventory and Identity application boundaries and strengthen architecture tests.**
3. **R3 — fix persistence error classification, concurrent idempotency, and atomicity.**
4. **R4 — decide and implement correction-history semantics.**
5. **R5 — correct OpenAPI nullability, headers, examples, Problem Details, and linting.**
6. **R6 — validate configuration, readiness, authentication errors, and redirects.**
7. **R7 — add required metrics and full-pipeline redaction evidence.**
8. **R8 — complete unit, integration, migration, security, and contract coverage.**
9. **R9 — complete runbooks and CI artifacts.**
10. **R10 — run final validation at one candidate SHA and request independent re-review.**

Do not republish a stable frontend contract before R5, R8, and R10 pass.

## Acceptance criteria

- [ ] Branch is synchronized with current `main` and preserves all newer accepted documentation and plan registry entries.
- [ ] Seven Inventory use cases are module-owned, typed, and independent of ASP.NET Core and EF Core.
- [ ] Identity provisioning is module-owned with an Infrastructure persistence adapter.
- [ ] Architecture tests enforce the intended project and namespace boundaries.
- [ ] Idempotency distinguishes exact-key contention from unrelated database failures.
- [ ] Concurrent create and adjustment behavior is deterministic and fully tested.
- [ ] Non-idempotency failures roll back every atomic side effect.
- [ ] Metadata corrections have an explicit, immutable, owner-visible history contract.
- [ ] OpenAPI matches runtime security, CSRF, ETag, nullability, errors, and examples.
- [ ] OpenAPI parses/lints as 3.1 and snapshot drift is checked in CI.
- [ ] Production configuration has no development secret fallback and fails fast when invalid.
- [ ] Readiness covers PostgreSQL and required identity/data-protection configuration.
- [ ] Required low-cardinality metrics and full-pipeline redaction evidence exist.
- [ ] Unit, integration, architecture, migration, security, and contract tests cover the accepted PLAN-0002/PLAN-0003 matrix.
- [ ] Idempotent migration SQL, upgrade evidence, and forward-repair guidance exist.
- [ ] Developer and operator workflows are complete and executable.
- [ ] The final candidate SHA passes locked restore, vulnerability and secret gates, formatting, Release build, complete tests, Compose readiness, migrations, OpenAPI export/lint/drift, and accepted Keycloak smoke evidence.
- [ ] PLAN-0005 receives the exact final candidate SHA for independent validation.
- [ ] A fresh reviewer confirms no critical/high issue remains before PLAN-0003 moves to Completed.

## Required final evidence

Record exact commands and results for:

```text
dotnet --info
dotnet restore apps/backend/KitchenFlow.slnx --locked-mode
dotnet format apps/backend/KitchenFlow.slnx --verify-no-changes --no-restore
dotnet build apps/backend/KitchenFlow.slnx -c Release --no-restore
dotnet test apps/backend/KitchenFlow.slnx -c Release --no-build
dotnet list apps/backend/KitchenFlow.slnx package --vulnerable --include-transitive
<secret-scanning command or workflow evidence>
<compose startup and readiness commands>
<empty and upgrade migration commands>
<idempotent SQL generation and verification command>
<OpenAPI export, parse/lint, and drift commands>
<real-Keycloak accepted browser smoke command>
```

The evidence must identify the final candidate SHA and must not expose credentials, tokens, cookies, callback parameters, private notes, product names, or request bodies.

## Execution state

- **Current checkpoint:** Independent revalidation completed against PR #9 head `2ddeb0fed9aeaa53af6e0c37ec1f2fa227a16d49`.
- **Run delivery target:** Replace the incorrect completion state with a detailed, executable remediation plan and synchronized registry state.
- **Delivered outcome:** Revalidation findings and ordered remediation requirements are now the canonical PLAN-0003 continuation.
- **Acceptance criteria resolved:** Revalidation and remediation planning only; implementation criteria remain open.
- **Files or areas materially changed:** This plan and `docs/plan-status.md`.
- **Documentation delivered:** Detailed architecture, persistence, contract, security, history, observability, testing, CI, migration, and runbook remediation instructions.
- **Validation performed:** Inspected current PR metadata, branch divergence, current-head statuses, original plan requirements, implementation files, generated OpenAPI, tests, migrations, CI, and documentation.
- **Known failures or limitations:** No executable tests were run by this independent documentation review. Current head has no associated workflow run/status; older CI evidence is not final-head evidence.
- **Blockers:** Branch is 2 commits behind `main`; PR is currently non-mergeable; P0 remediation remains.
- **Partially modified areas:** Runtime implementation was inspected but not changed during this revalidation checkpoint.
- **Exact next action:** Synchronize the branch with current `main`, preserve all newer plan/documentation changes, and execute R2 application/identity boundary remediation before changing contract claims.
- **Working tree state:** The remote branch contains a documentation-only revalidation update; implementation remains at the inspected baseline until the next remediation commit.

## Progress log

### 2026-07-30T03:10:00Z — Independent backend revalidation agent

- **Run delivery target:** Revalidate PLAN-0003 and PR #9 after the remediation commits, identify remaining gaps, and leave a directly executable continuation.
- **Checkpoint:** Reviewed PR #9 head `2ddeb0fed9aeaa53af6e0c37ec1f2fa227a16d49` against PLAN-0002, PLAN-0003, current `main`, implementation, contract, migrations, tests, CI, and documentation.
- **Result:** Substantial first-review issues were corrected, but the plan is not complete. The stable-contract and merge claims are withdrawn pending R1–R10.
- **Validation performed:** Static repository and PR review; branch comparison; current-head workflow/status inspection; contract/runtime consistency review; test and documentation traceability review.
- **Known failures or unverified behavior:** No current-head CI/status exists. The branch is 2 commits behind current `main`. The prior successful CI run targeted an older implementation SHA. The browser-smoke documentation and completion claim disagree about whether the diagnostic certificate bypass is acceptable evidence.
- **Blockers:** Branch divergence and the P0 remediation sections above.
- **Exact next action:** Synchronize with current `main`, then extract module-owned Inventory and Identity application use cases with enforcing architecture tests.

Earlier implementation progress remains preserved in Git history through commit `2ddeb0fed9aeaa53af6e0c37ec1f2fa227a16d49` and its ancestors.