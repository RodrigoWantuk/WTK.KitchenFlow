# PLAN-0002: Specify the First Authenticated Inventory Vertical Slice

- **Status:** In Progress
- **Type:** Documentation
- **Priority:** Critical
- **Owner:** AI planning agent
- **Created:** 2026-07-29
- **Last updated:** 2026-07-29T00:15:00Z
- **Branch:** `agent/plan-0002-first-vertical-slice-plans`
- **Pull request:** Not opened
- **Related issues:** None
- **Related ADRs:** ADR-0001 through ADR-0006
- **Dependencies:** PLAN-0001 completed and merged

## Objective

Produce an implementation-ready specification for KitchenFlow's first authenticated vertical slice and create unambiguous downstream implementation and independent-testing plans that weaker AI agents can execute without reconstructing product intent.

The slice must prove the accepted frontend, backend, identity, contract, persistence, localization, observability, and test architecture through one real product outcome:

> An authenticated adult user can create, view, correct, consume, discard, and delete a manually entered inventory lot while every operation remains isolated to that user and auditable.

This plan is complete only when PLAN-0003, PLAN-0004, PLAN-0005, and the cross-platform development-environment document exist, agree with this specification, and are registered in `docs/plan-status.md`.

## Authoritative context

Agents executing this plan or its descendants must read, in order:

1. [`../../AGENTS.md`](../../AGENTS.md)
2. [`../README.md`](../README.md)
3. [`../product/vision.md`](../product/vision.md)
4. [`../product/initial-release.md`](../product/initial-release.md)
5. [`../product/user-journeys.md`](../product/user-journeys.md)
6. [`../domain/README.md`](../domain/README.md)
7. [`../domain/inventory-lifecycle.md`](../domain/inventory-lifecycle.md)
8. [`../architecture/overview.md`](../architecture/overview.md)
9. [`../architecture/principles.md`](../architecture/principles.md)
10. ADR-0001 through ADR-0006
11. [`../security/privacy-and-data-protection.md`](../security/privacy-and-data-protection.md)
12. [`../security/security-and-abuse.md`](../security/security-and-abuse.md)
13. [`../testing/product-foundation-gates.md`](../testing/product-foundation-gates.md)

When this plan conflicts with a canonical accepted document, the canonical document wins and the conflict must be reported before implementation.

## Scope

### Included

- Exact user-visible behavior of the first inventory slice.
- Exact minimum identity and session behavior.
- Minimum product and lot data model.
- Versioned REST endpoint inventory.
- Request, response, error, concurrency, ownership, and pagination rules.
- Responsive frontend route and state inventory.
- Localization and accessibility requirements.
- Audit and observability requirements.
- Backend, frontend/Lovable, and independent-test work packages.
- Cross-platform development environment for Windows and Linux.

### Excluded

- AI generation, parsing, troubleshooting, or provider integration.
- Receipt or image upload.
- Full shelf-life inference or food-safety rule engine.
- Barcode or shared product catalog.
- Shopping, planning, menu, recipes, cooking execution, leftovers, or notifications.
- RabbitMQ business messages, Redis-backed behavior, subscriptions, billing, credits, ads, or email delivery.
- Collaborative household members.
- Production cloud provisioning.

Excluded architecture components may exist as disabled development services or placeholders only when needed to validate infrastructure conventions. They must not be introduced into the slice's product path without a new plan.

## Required user journey

### VS-JOURNEY-001: First inventory lot

1. An unauthenticated browser requests a protected route.
2. The backend-managed authentication flow redirects to Keycloak.
3. After successful authentication, the backend creates or resolves an internal KitchenFlow user from the OIDC issuer and subject.
4. The user opens the inventory screen.
5. The screen shows a localized empty state when no active lots exist.
6. The user selects `Add product`.
7. The user enters a product name, quantity representation, storage location, and optional package/expiration information.
8. Client-side validation gives immediate guidance, but the backend repeats every authoritative validation.
9. The backend creates the user-owned product record, inventory lot, initial inventory transaction, and audit record atomically.
10. The browser navigates to the created lot or returns to the list with a success state.
11. The list and detail routes show only the current user's data.
12. The user can correct metadata, record consumption, record discard, or delete an erroneous lot.
13. A stale update produces an explicit conflict state and never overwrites newer data silently.
14. Refreshing or reopening the application preserves the authoritative PostgreSQL state.

## Functional requirements

### Authentication and ownership

- **VS-REQ-001:** Every inventory endpoint requires an authenticated backend session.
- **VS-REQ-002:** The browser stores no OIDC access token or refresh token in JavaScript-accessible storage.
- **VS-REQ-003:** The backend resolves an internal `UserId` UUID from `(Issuer, Subject)` and never accepts `UserId` from client payloads.
- **VS-REQ-004:** Every query and mutation applies the current internal `UserId` as an invariant filter.
- **VS-REQ-005:** Access to another user's lot returns `404`, not `403`, to avoid confirming resource existence.
- **VS-REQ-006:** Development includes two deterministic users for isolation tests.
- **VS-REQ-007:** Logout invalidates the KitchenFlow session and initiates provider logout when supported.

### Product identity

- **VS-REQ-010:** A product is a user-owned identity representing the actual food or household product, not a generic culinary ingredient.
- **VS-REQ-011:** Product name is required after Unicode-aware trimming and must contain 1 to 160 user-visible characters.
- **VS-REQ-012:** Product matching and deduplication are not automatic in this slice. Similar names may coexist.
- **VS-REQ-013:** Product names preserve the user's spelling and locale; a normalized search key may be derived but is not shown as authoritative text.

### Lot quantity

- **VS-REQ-020:** A lot cannot be created without one valid quantity representation.
- **VS-REQ-021:** Quantity mode is exactly one of `Measured` or `Availability`.
- **VS-REQ-022:** `Measured` requires a decimal value greater than zero and one canonical unit: `Gram`, `Milliliter`, or `Unit`.
- **VS-REQ-023:** Measured quantity uses a decimal representation; floating-point storage is prohibited.
- **VS-REQ-024:** `Availability` requires exactly one state: `Available`, `Low`, or `Unavailable`; measured value and unit must be absent.
- **VS-REQ-025:** The backend rejects payloads that mix measured and availability fields.
- **VS-REQ-026:** The frontend may display localized kilograms, liters, or pluralized units, but the API persists canonical grams, milliliters, or units.
- **VS-REQ-027:** A consumption or discard adjustment cannot reduce a measured lot below zero.
- **VS-REQ-028:** When measured quantity reaches zero, the lot remains historically addressable but is excluded from the default active list.

### Storage and package state

- **VS-REQ-030:** Storage location is required and is one of `Pantry`, `Refrigerator`, `Freezer`, or `Other`.
- **VS-REQ-031:** `Other` requires a user-visible location label from 1 to 80 characters.
- **VS-REQ-032:** Package state is optional and, when present, is one of `Sealed`, `Opened`, or `Unknown`.
- **VS-REQ-033:** Printed expiration date is optional, stores a calendar date without time, and records provenance as `UserEntered`.
- **VS-REQ-034:** This slice displays the entered date but does not infer post-opening or storage-dependent shelf life.
- **VS-REQ-035:** Optional notes are private, trimmed, and limited to 1,000 characters.

### Mutations and history

- **VS-REQ-040:** Lot creation atomically creates the product, lot, initial transaction, and audit event.
- **VS-REQ-041:** Metadata correction can change product display name, storage, package state, printed expiration date, custom location, and notes.
- **VS-REQ-042:** Quantity corrections use an explicit inventory adjustment rather than silently replacing history.
- **VS-REQ-043:** Measured adjustments support `Consume`, `Discard`, and `Correct`.
- **VS-REQ-044:** `Consume` and `Discard` require a positive delta no greater than current quantity.
- **VS-REQ-045:** `Correct` requires the resulting quantity and records previous and resulting values.
- **VS-REQ-046:** Availability adjustments record the resulting availability state and reason.
- **VS-REQ-047:** Delete is reserved for an erroneously created lot. It is a soft deletion with audit history, not physical database erasure.
- **VS-REQ-048:** Deleted lots are absent from normal list and detail queries.
- **VS-REQ-049:** Audit and transaction records are immutable through the public API.

### Concurrency and idempotency

- **VS-REQ-050:** Every lot representation contains an opaque concurrency version.
- **VS-REQ-051:** Every update, adjustment, and delete requires `If-Match` with the last observed version.
- **VS-REQ-052:** Missing `If-Match` returns `428 Precondition Required`.
- **VS-REQ-053:** A stale version returns `412 Precondition Failed` with a stable error code and no mutation.
- **VS-REQ-054:** Create and adjustment commands accept an `Idempotency-Key` UUID header.
- **VS-REQ-055:** Repeating a completed command with the same user, endpoint, and idempotency key returns the original semantic result and does not duplicate transactions.
- **VS-REQ-056:** Reusing a key with a different payload returns `409 Conflict`.

### Query and pagination

- **VS-REQ-060:** The default list returns active, nondeleted lots with measured quantity greater than zero or availability other than `Unavailable`.
- **VS-REQ-061:** List supports `status=active|depleted|deleted`, storage-location filter, product-name search, and deterministic sort.
- **VS-REQ-062:** Pagination is cursor-based. Default page size is 25 and maximum is 100.
- **VS-REQ-063:** The default sort is `updatedAt desc, lotId desc`.
- **VS-REQ-064:** Cursor contents are opaque to clients and validated by the backend.

## Minimum domain model

The implementation may use richer internal types, but it must preserve these concepts.

### InternalUser

- `Id: Guid`
- `Issuer: string`
- `Subject: string`
- `CreatedAt: Instant/UTC timestamp`
- unique constraint on `(Issuer, Subject)`

### Product

- `Id: Guid`
- `OwnerUserId: Guid`
- `DisplayName: string`
- `NormalizedSearchName: string`
- `CreatedAt`, `UpdatedAt`
- `IsDeleted`

### InventoryLot

- `Id: Guid`
- `OwnerUserId: Guid`
- `ProductId: Guid`
- quantity as a validated discriminated domain value
- storage location and optional custom location
- optional package state
- optional printed expiration date and provenance
- optional private notes
- `Version` concurrency token
- `CreatedAt`, `UpdatedAt`, optional `DeletedAt`

### InventoryTransaction

- `Id: Guid`
- `OwnerUserId: Guid`
- `LotId: Guid`
- `Type: Initial | Consume | Discard | Correct | AvailabilityChanged | Deleted`
- previous and resulting quantity snapshots where applicable
- reason code and optional user note
- idempotency key where applicable
- `OccurredAt`

### AuditEvent

- stable event name
- actor user ID
- target type and ID
- correlation ID
- nonsecret structured metadata
- timestamp

Business entities must not depend on EF Core attributes, HTTP types, Keycloak types, or frontend schemas.

## Required REST contract

All routes are under `/api/v1`. OpenAPI 3.1 is generated from the backend and treated as the source contract for the frontend.

### Session

- `GET /session` — current authenticated user summary and supported locale metadata.
- `POST /auth/login` — initiates backend OIDC challenge; browser navigation endpoint, not JSON credential exchange.
- `POST /auth/logout` — ends local session and provider session where possible.

### Inventory

- `GET /inventory/lots`
- `POST /inventory/lots`
- `GET /inventory/lots/{lotId}`
- `PATCH /inventory/lots/{lotId}`
- `POST /inventory/lots/{lotId}/adjustments`
- `DELETE /inventory/lots/{lotId}`
- `GET /inventory/lots/{lotId}/history`

### Contract rules

- Request and response DTOs are distinct from persistence entities.
- JSON uses camelCase.
- UUID values use canonical string form.
- Timestamps use UTC RFC 3339 strings.
- Calendar dates use `YYYY-MM-DD` without timezone.
- Decimal quantities are JSON numbers and must round-trip without binary floating-point domain storage.
- Enums serialize as documented stable string values.
- Success responses contain no localized prose.
- Validation and domain failures use `application/problem+json` with `type`, `title`, `status`, `traceId`, and stable `errorCode`; field failures also provide an `errors` object keyed by contract field.
- `400` is malformed input, `401` unauthenticated, `404` absent or not owned, `409` idempotency conflict, `412` stale version, `422` valid JSON rejected by domain rules, `428` missing precondition, and `500` unexpected failure.
- OpenAPI examples must cover measured quantity, availability quantity, validation error, stale version, and idempotent replay.

## Required frontend routes and states

### Routes

- `/login`
- `/inventory`
- `/inventory/new`
- `/inventory/:lotId`

### Inventory list

Must include:

- responsive page heading and `Add product` action;
- localized empty state;
- skeleton/loading state;
- recoverable API error state with retry;
- product name, localized quantity, storage, optional expiration, and last-updated summary;
- search and storage filter;
- keyboard-accessible item navigation;
- pagination/load-more behavior that preserves filters;
- depleted and deleted views available through explicit filters, not mixed into active inventory.

### Create and edit form

Must include:

- product name;
- quantity-mode selector;
- measured value and unit or availability-state control;
- storage location and conditional custom location;
- optional package state;
- optional printed expiration date;
- optional notes;
- inline accessible validation summary;
- submit progress and duplicate-submit prevention;
- unsaved-change protection;
- server validation mapping by stable field/error code.

### Lot detail

Must include:

- current lot state and provenance summary;
- edit action;
- consume, discard, correct, and delete actions;
- history list;
- confirmation for destructive actions;
- stale-version recovery that offers reload and never silently overwrites;
- explicit success and failure announcements for assistive technology.

## Localization and accessibility

- Source locale is English; complete first-slice resources are required for English, Portuguese (Brazil), and Spanish.
- Do not use user-visible text returned from the API.
- Dates, decimals, pluralization, and units use locale-aware formatting.
- Canonical API units remain locale-independent.
- All forms support keyboard-only completion.
- Focus moves predictably after route changes, validation failures, dialogs, and successful mutations.
- Labels, descriptions, errors, dialogs, and live status messages expose correct accessible semantics.
- Responsive acceptance widths are 360 px, 768 px, and 1280 px without horizontal page scrolling.
- Color is never the only state indicator.

## Security and privacy requirements

- Use same-origin deployment or reverse-proxy routing for frontend and `/api` whenever practical.
- Use backend-managed `HttpOnly`, `Secure`, appropriately `SameSite` session cookies.
- State-changing cookie-authenticated requests require CSRF protection.
- Development secrets are supplied through ignored environment files or secret stores; no default production credential appears in source.
- Logs do not include cookies, tokens, raw authorization headers, private notes, or complete request bodies.
- Database queries are structurally owner-scoped, not filtered after materialization.
- ID enumeration must not disclose cross-user existence.
- Rate limits cover authentication initiation and mutations.

## Observability requirements

Every request and background-free mutation path must expose:

- correlation/trace identifier;
- route template, result status, and latency;
- authenticated internal user ID only in controlled structured telemetry, never email or token;
- database span and failure classification;
- stable mutation name;
- idempotent replay indicator;
- concurrency-conflict counter;
- validation-failure counter by stable code;
- no high-cardinality product names or notes in metrics.

Health endpoints must distinguish liveness from readiness. Readiness includes PostgreSQL and required identity configuration but must not depend on optional RabbitMQ, Redis, or AI services for this slice.

## Required plan sequencing

1. PLAN-0002 specifies and registers all work.
2. PLAN-0003 creates backend foundation, identity integration, PostgreSQL model, OpenAPI, and inventory behavior.
3. PLAN-0004 may begin Lovable visual generation before the backend is complete, but integration against live APIs cannot begin until PLAN-0003 publishes and validates the OpenAPI contract milestone.
4. PLAN-0005 is owned by an independent testing agent and starts formal execution only after both implementation plans identify stable PR baselines.
5. Backend and frontend changes must use separate branches and pull requests.
6. A contract-breaking backend change after the frontend contract milestone requires coordinated plan updates and regenerated frontend types in the same delivery window.

## Execution phases

### Phase 1: Register and reconcile

- [x] Confirm PLAN-0001 merge.
- [x] Reconcile PLAN-0001 delivery state.
- [x] Register PLAN-0002 with exact first-slice behavior.

**Exit criteria**

- PLAN-0001 is `Merged` in the registry and PLAN-0002 is active.

### Phase 2: Create execution plans

- [ ] Add detailed PLAN-0003 for backend foundation and inventory core.
- [ ] Add detailed PLAN-0004 for Lovable frontend shell and inventory UX.
- [ ] Add detailed PLAN-0005 for independent vertical-slice validation.
- [ ] Register dependency and concurrency rules for all plans.

**Exit criteria**

- Each downstream plan contains explicit phases, file boundaries, commands, tests, failure handling, acceptance criteria, and handoff instructions.

### Phase 3: Document development environment

- [ ] Add a canonical Windows/Linux environment document.
- [ ] Separate host-installed tools from containerized dependencies.
- [ ] Specify supported version lines, verification commands, ports, resource guidance, and optional services.
- [ ] Update the documentation index and infrastructure references.

**Exit criteria**

- A new agent can prepare either Windows or Linux without guessing which services are native or containerized.

### Phase 4: Validate and deliver

- [ ] Cross-check all plans against this specification and accepted ADRs.
- [ ] Verify links, numbering, registry status, dependencies, and no overlapping ownership.
- [ ] Open a pull request.
- [ ] Mark PLAN-0002 completed while retaining downstream plans as `Ready` or dependency-gated.

**Exit criteria**

- Owner can merge a cohesive plan pack that is directly executable by separate agents.

## Testing and validation plan

This documentation plan requires:

- manual traceability from every `VS-REQ-*` requirement to PLAN-0003, PLAN-0004, or PLAN-0005;
- link and filename review;
- registry uniqueness and status review;
- architecture/ADR consistency review;
- verification that Lovable workflow does not assume importing this existing monorepo;
- verification that Windows and Linux instructions produce the same Linux-container dependency topology;
- verification that no plan authorizes AI, RabbitMQ business flow, Redis dependency, or broader product scope in the slice.

## Cross-cutting impact

### Security and privacy

This plan defines the first identity, session, ownership, CSRF, audit, and user-isolation behavior. These are release-blocking, not optional refinements.

### Food safety

The slice stores a user-entered printed expiration date but does not infer usability or offer safety advice. The UI and API must not imply that an entered date alone proves food safety.

### AI behavior and cost

AI is intentionally absent. No AI provider credentials, prompt, gateway call, token accounting, or generated culinary advice belongs in this slice.

### Localization and accessibility

English, Portuguese (Brazil), and Spanish resources plus responsive and keyboard-accessible behavior are mandatory implementation scope.

### Operations and observability

The slice establishes migrations, health endpoints, structured telemetry, local containers, and CI conventions that later plans will extend.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Weak agent broadens the slice into the full product | High | High | Explicit exclusions, requirement IDs, file ownership, and phase gates |
| Frontend invents contracts before backend OpenAPI exists | High | High | Contract milestone and generated-client-only rule |
| Lovable is incorrectly pointed at the existing monorepo | High | High | Dedicated export/integration workflow in PLAN-0004 |
| User isolation is implemented as optional filtering | Medium | Critical | Backend invariant, two-user tests, independent P0 validation |
| Quantity uses floating point | Medium | High | Explicit decimal-domain requirement and database tests |
| Stale browser state overwrites inventory | Medium | High | Mandatory ETag/If-Match semantics and conflict UX |
| Architecture scaffolding overwhelms the first outcome | Medium | Medium | Required slice endpoints and explicit deferred infrastructure |
| Windows and Linux environments diverge | Medium | Medium | Linux containers and identical compose topology on both hosts |

## Acceptance criteria

- [ ] PLAN-0001 delivery is reconciled as merged.
- [ ] PLAN-0003, PLAN-0004, and PLAN-0005 exist and are registered exactly once.
- [ ] Every `VS-REQ-*` requirement has an implementation owner and independent validation coverage.
- [ ] Development environment documentation covers Windows and Linux completely.
- [ ] Lovable's current existing-repository limitation is handled explicitly.
- [ ] Downstream plans do not silently broaden or reduce the slice.
- [ ] Required documentation indexes are current.
- [ ] Full branch validation is complete.
- [ ] Pull request is open.
- [ ] No unsupported completion claim remains.

## Execution state

This section must be updated before every agent-created commit.

- **Current checkpoint:** PLAN-0001 merge is reconciled and the exact first authenticated inventory slice is specified in PLAN-0002.
- **Last completed step:** Phase 1 registration and specification.
- **Exact next action:** Add PLAN-0003, PLAN-0004, and PLAN-0005 with requirement traceability and explicit agent instructions.
- **Blockers:** None.
- **Partially modified areas:** No downstream plan or environment document exists yet.
- **Validation performed:** Confirmed PR #5 merge and reviewed the accepted plan templates and foundation documents.
- **Known failures or limitations:** The connector cannot delete the prior merged branch; branch cleanup remains owner or repository-automation housekeeping.
- **Working tree state:** Clean after this commit.

## Progress log

### 2026-07-29T00:15:00Z — AI planning agent

- **Checkpoint:** Registered the first vertical-slice planning effort.
- **Changes included in the commit:** Reconciled PLAN-0001 as merged; added detailed PLAN-0002; updated the central plan registry.
- **Validation performed:** Confirmed PR #5 `merged=true`, merge commit, current templates, and accepted foundation requirements.
- **Result:** The exact slice, contracts, data concepts, user routes, nonfunctional requirements, exclusions, and sequencing are now durable.
- **Next action:** Add the backend, Lovable frontend, and independent test plans.
- **Blockers or handoff notes:** None.

## Completion and handoff checklist

- [ ] All plan phases and acceptance criteria are resolved truthfully.
- [ ] Required validation passes or limitations are documented.
- [ ] Documentation, contracts, and ADR references are current.
- [ ] Security, privacy, safety, localization, accessibility, AI, and operational impacts were reviewed.
- [ ] `docs/plan-status.md` matches this plan.
- [ ] Pull request description links this plan and reports validation evidence.
- [ ] No hidden or unexplained partial work remains.
- [ ] Exact continuation instructions exist.
- [ ] Delivery state and branch-cleanup responsibility are recorded.
