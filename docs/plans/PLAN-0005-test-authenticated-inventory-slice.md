# PLAN-0005: Independently Validate the Authenticated Inventory Slice

- **Status:** Completed
- **Type:** Testing
- **Priority:** Critical
- **Owner:** independent-agent:composer-plan-0005
- **Created:** 2026-07-29
- **Last updated:** 2026-08-01T20:30:00Z
- **Branch:** `agent/plan-0005-test-inventory-slice`
- **Pull request:** [PR #19](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/19) — **merged**
- **Delivery:** Merged by owner at `60d98dd9e2e7c460d670e701c027a44f25cdfedc` (2026-08-01T20:25:11Z). Final outcome remains **Conditional Pass**. Residual findings High #20, Medium #21/#22, coverage #24, and High #26 were independently **Pass**-verified under PLAN-0016 tip `38e5edfb49407d895995e0cf1b49054dc7ce5c5b` and issues closed; this plan’s Conditional Pass string is not rewritten.
- **System under test:** Integrated `main` after PR #18 merge (`b94abd9a83fe29d88b095e3e9a42f10d01c05414`); merge commit of this plan on main is `60d98dd9e2e7c460d670e701c027a44f25cdfedc`
- **Related implementation plans:** PLAN-0003, PLAN-0014 (on main), PLAN-0015 (Completed via PR #18), PLAN-0016 (remediation; In Progress)
- **Related issues:** #20 (High), #21 (Medium), #22 (Medium), #24 (coverage Blocked)
- **Related ADRs:** ADR-0001 (historical), ADR-0007, ADR-0002 through ADR-0006
- **Dependencies:** PLAN-0002 merged; PR #18 merged by owner; independent agent claim required
- **Final outcome:** Conditional Pass

## Objective

Independently determine whether the first authenticated inventory vertical slice satisfies PLAN-0002, accepted product/domain requirements, architecture, identity isolation, privacy, localization, accessibility, persistence, and operational quality.

This plan is executed by an agent that did not author the implementation. The testing agent must test requirements, not merely confirm implementation claims.

A `Completed` test plan may conclude `Pass`, `Conditional Pass`, `Fail`, or `Inconclusive`.

## Test basis

Mandatory sources:

- PLAN-0002 and every `VS-REQ-*` requirement;
- PLAN-0003 and PLAN-0014 acceptance criteria (PLAN-0004 historical requirements remain informative where not superseded);
- accepted inventory domain documents;
- ADR-0001 through ADR-0006;
- privacy/security documents;
- operations/reliability document;
- product-foundation test gates;
- committed OpenAPI contract;
- stable backend and frontend PR commits;
- migration files, compose files, and generated-client drift checks.

Implementation descriptions are evidence candidates, not the source of expected behavior.

## Scope

### Included

- Authentication, session, logout, CSRF, and cookie behavior.
- Internal-user mapping and two-user isolation.
- Product and lot creation.
- Measured and availability quantities.
- Metadata correction, consume, discard, correct, soft delete, and history.
- ETag/If-Match concurrency.
- Idempotency.
- Cursor pagination/search/filter.
- OpenAPI and generated-client compatibility.
- PostgreSQL migration and atomicity.
- Logs, traces, health, and redaction.
- English, Portuguese (Brazil), and Spanish.
- Keyboard, responsive, semantic, and screen-reader behavior.
- Windows- or Linux-hosted development topology with Linux containers.
- Basic performance/resilience smoke appropriate to the first slice.

### Excluded

- AI behavior.
- Receipt/image parsing.
- Shelf-life inference or food-safety recommendation accuracy.
- Shopping, planning, menu, recipes, cooking, notifications, billing, ads, or community features.
- Production cloud SLA or disaster-recovery certification.

Excluded features must not appear as falsely functional UI or hidden backend dependencies.

## System-under-test baseline

Pinned for independent execution (also recorded in `docs/evidence/plan-0005/environment-manifest.json`):

- **Repository:** `RodrigoWantuk/WTK.KitchenFlow`
- **Integrated main SHA:** `b94abd9a83fe29d88b095e3e9a42f10d01c05414` (PR #18 merge; merged head `de1de624a1075a4b196a1646f7884d3855caecac`)
- **Inventory PLAN-0003 merge:** `f9d429346615bf5b157656822057917ca2fe4032`
- **Inventory final reviewed candidate:** `d9c67e16c0b12eb3b13d581c55a677a8ff7b73a8`
- **Profiles PLAN-0012 merge:** `49985f94d336e6079f1979a2140555f1beab765c`
- **Profiles final reviewed candidate:** `3deaf5ba4837e16383bf1c3c577c014f914b5c94` (validate only session/internal-user/isolation/shared contracts/migration coexistence/safe session projection)
- **Frontend PLAN-0015 implementation:** `e248126346d60c99df82e9c1e9f1954a07e68da2`
- **Frontend PLAN-0015 evidence generation:** `25aa10c39dff3fbdc6ab978a64adc941b3246040`
- **Frontend PLAN-0015 completion PR head:** `de1de624a1075a4b196a1646f7884d3855caecac`
- **Frontend PLAN-0015 completion merge:** `b94abd9a83fe29d88b095e3e9a42f10d01c05414`
- **OpenAPI blob (integrated main):** `0cc5050ced6c43daf69538ad1af3fee135871e58` (`packages/contracts/openapi/kitchenflow-v1.json`; Inventory + Profiles — do not reuse PLAN-0003-only blob)
- **Migrations on integrated main:**
  - Inventory latest: `20260731120209_AddInventoryLotConcurrencyToken`
  - Profiles latest: `20260801070903_EnforceUniqueProfileEquipmentStableCode`
  - Full ordered set listed in the environment manifest
- **Operating system:** Debian GNU/Linux 13 (trixie), kernel `6.12.96+deb13-amd64`, `x86_64`
- **Docker/Compose:** Docker `29.6.2`, Compose `v5.3.1`
- **.NET SDK / Node / Yarn:** `10.0.302` / `24.18.0` / `1.22.22`
- **Container images/digests:** `postgres:18.4@sha256:3a82e1f56c8f0f5616a11103ac3d47e632c3938698946a7ad26da0df1334744a`; `quay.io/keycloak/keycloak:26.7.0@sha256:0f198be292568439d700cdbfb893e69a6009bb43a94a06a945b1d3d506c76b13`
- **Browsers:** Playwright `1.55.1` Chromium + Firefox; host Google Chrome for Keycloak DevTools smoke; WebKit deferred when unsupported
- **Locales:** `en`, `pt-BR`, `es`
- **Test users:** synthetic `inventory-user-a` and `inventory-user-b` only
- **Known pre-existing defects:** Firefox Cook CTA / pantry item pointer hit-test failures at ~200% zoom recorded by PLAN-0015 (keyboard Enter succeeded); production inventory live adapter absent (`FeatureUnavailable`)

Do not execute against moving branch heads without pinning commits.

## Owner validation policy (automated-only gates)

Owner decision for this phase: human/manual validations are **not** exit gates.

| Manual activity | Status |
|---|---|
| Manual exploratory charters | Deferred — non-blocking |
| Manual visual review | Deferred — non-blocking |
| Manual NVDA audit | Deferred — non-blocking |
| Manual VoiceOver audit | Deferred — non-blocking |
| Human screenshot inspection | Deferred — non-blocking |

Charters remain documented below for future/pre-release coverage. They are **not** marked executed. Exit criteria for the current phase require only automated evidence. When a capability cannot be automated in the environment, record `Deferred by owner decision` (never false `Passed`).

## Risk-based priorities

| Area or failure mode | Likelihood | Impact | Priority | Rationale |
|---|---|---|---|---|
| Cross-user inventory disclosure/mutation | Medium | Critical | P0 | Direct privacy/security boundary |
| Browser token exposure or CSRF bypass | Medium | Critical | P0 | Account compromise/state mutation risk |
| Nonatomic quantity/history mutation | Medium | High | P0 | Corrupts core inventory truth |
| Negative or mixed quantity state | Medium | High | P0 | Violates central domain model |
| Stale update overwrites newer state | High | High | P0 | Real multi-tab/device data loss |
| Duplicate create/adjustment on retry | High | High | P0 | Common network failure causes incorrect inventory |
| OpenAPI/client drift | High | High | P1 | Breaks independent frontend/backend lifecycle |
| Migration failure | Medium | High | P1 | Prevents deployment/recovery |
| Localization or decimal/date corruption | Medium | High | P1 | International data correctness issue |
| Inaccessible primary flow | Medium | High | P1 | Product correctness requirement |
| Logs leak notes/tokens | Low | Critical | P1 | Sensitive-data exposure |
| Pagination duplication/omission | Medium | Medium | P2 | Inventory usability/integrity perception |
| Performance degradation | Low | Medium | P2 | First scale signal, not full capacity certification |

## Requirements traceability ownership

PLAN-0005 must create a final table mapping every `VS-REQ-*` to one or more automated or manual evidence items. At minimum:

- `VS-REQ-001..007`: auth/session/isolation/security cases.
- `VS-REQ-010..013`: product identity/input cases.
- `VS-REQ-020..028`: quantity/domain/database/UI cases.
- `VS-REQ-030..035`: storage/package/date/notes cases.
- `VS-REQ-040..049`: transaction/audit/mutation/history cases.
- `VS-REQ-050..056`: concurrency/idempotency cases.
- `VS-REQ-060..064`: query/pagination cases.

No requirement may be marked covered solely because code exists.

## Test environments and data

### Required services

- frontend production build or production-equivalent dev server;
- backend Release build;
- PostgreSQL from clean named volume;
- Keycloak with versioned realm import;
- OpenTelemetry Collector or test exporter when telemetry evidence is collected;
- no external AI, Redis, or RabbitMQ requirement.

### Synthetic data

Create deterministic fixtures:

- user A and user B;
- empty inventory;
- measured lots in each unit;
- availability lots in each state;
- pantry/refrigerator/freezer/custom locations;
- sealed/opened/unknown/no package state;
- past, current, future, and absent printed dates without asserting safety;
- Unicode product names in English, Portuguese, Spanish, and non-Latin scripts;
- maximum-length and boundary strings;
- at least 60 lots for pagination;
- depleted and deleted lots;
- stale versions and repeated idempotency keys.

Never use real personal or production data.

## Automated test execution checklist

### Identity, session, and CSRF — P0

- [x] **TEST-0005-001:** Protected inventory API without session returns 401 and no data.
- [x] **TEST-0005-002:** Protected browser route reaches login flow and returns safely after valid login.
- [x] **TEST-0005-003:** OIDC access/refresh tokens are absent from localStorage, sessionStorage, IndexedDB, page HTML, and JavaScript-visible cookies.
- [x] **TEST-0005-004:** Session cookie has expected HttpOnly/Secure/SameSite/path attributes in HTTPS test environment.
- [x] **TEST-0005-005:** State-changing request without CSRF token is rejected and does not mutate.
- [x] **TEST-0005-006:** Invalid CSRF token is rejected.
- [x] **TEST-0005-007:** Logout invalidates local session; protected request fails afterward.
- [x] **TEST-0005-008:** Untrusted external return URL is rejected.
- [x] **TEST-0005-009:** User A and B resolve to distinct internal UUIDs independent of Keycloak subject format.

### User isolation — P0

For list, detail, patch, adjustment, delete, and history:

- [x] **TEST-0005-010:** User A never sees user B records in list/search/filter/pagination.
- [x] **TEST-0005-011:** User A requesting user B lot ID receives 404.
- [x] **TEST-0005-012:** User A cannot update user B lot by path ID or crafted body.
- [x] **TEST-0005-013:** User A cannot adjust user B lot.
- [x] **TEST-0005-014:** User A cannot delete user B lot.
- [x] **TEST-0005-015:** User A cannot read user B history.
- [x] **TEST-0005-016:** Responses do not disclose whether a foreign ID exists.
- [x] **TEST-0005-017:** Database inspection confirms no accidental owner reassignment.

Any failure in this group is release-blocking Critical.

### Product and quantity — P0/P1

- [x] **TEST-0005-020:** Valid product names at min/max boundaries create successfully.
- [x] **TEST-0005-021:** Empty/whitespace/overlength names fail with stable field code.
- [x] **TEST-0005-022:** Unicode spelling is preserved and searchable according to documented normalization.
- [x] **TEST-0005-023:** Similar product names can coexist; no silent merge occurs.
- [x] **TEST-0005-024:** Measured gram quantity round-trips exactly.
- [x] **TEST-0005-025:** Measured milliliter quantity round-trips exactly.
- [x] **TEST-0005-026:** Measured unit quantity round-trips exactly, including permitted fractional precision if documented.
- [x] **TEST-0005-027:** Zero, negative, excessive precision, NaN, infinity, and scientific-notation abuse are rejected appropriately.
- [x] **TEST-0005-028:** Availability states round-trip exactly.
- [x] **TEST-0005-029:** Mixed measured/availability payload is rejected by API and database constraint.
- [ ] **TEST-0005-030:** Locale decimal entry in each locale submits the intended canonical value. _(Blocked — #20)_

### Storage, package, date, notes — P1

- [x] **TEST-0005-035:** Each standard storage location works.
- [x] **TEST-0005-036:** `Other` without custom label fails; valid boundary labels pass.
- [x] **TEST-0005-037:** Package state optional and each enum works.
- [x] **TEST-0005-038:** Printed date persists as calendar date without timezone shift on positive/negative UTC offsets.
- [ ] **TEST-0005-039:** UI identifies printed date as entered information and does not claim safety. _(Blocked — #20)_
- [x] **TEST-0005-040:** Notes boundary works and notes are absent from logs/metrics/errors.

### Atomic creation and mutations — P0

- [x] **TEST-0005-045:** Create produces product, lot, initial transaction, and audit event in one transaction.
- [x] **TEST-0005-046:** Injected failure before commit leaves none of the four partial records.
- [x] **TEST-0005-047:** Metadata update preserves quantity history.
- [x] **TEST-0005-048:** Consume positive amount produces correct resulting quantity/history.
- [x] **TEST-0005-049:** Consume above current quantity fails without mutation.
- [x] **TEST-0005-050:** Discard positive amount produces correct resulting quantity/history.
- [x] **TEST-0005-051:** Discard above current quantity fails without mutation.
- [x] **TEST-0005-052:** Correct records previous/resulting values and reason.
- [x] **TEST-0005-053:** Reaching zero removes lot from active view but preserves depleted/history access.
- [x] **TEST-0005-054:** Availability change records immutable history.
- [x] **TEST-0005-055:** Delete soft-deletes and records history/audit.
- [x] **TEST-0005-056:** Deleted lot absent from normal detail/list and available only through intended administrative/user filter behavior.
- [x] **TEST-0005-057:** Public API cannot update/delete transaction or audit rows.

### Concurrency and idempotency — P0

- [x] **TEST-0005-060:** Read responses provide version/ETag.
- [x] **TEST-0005-061:** Mutation without `If-Match` returns 428 and does not mutate.
- [x] **TEST-0005-062:** Valid version succeeds and increments version.
- [x] **TEST-0005-063:** Stale version returns 412 and preserves newer data.
- [ ] **TEST-0005-064:** Frontend stale dialog offers reload and never silently retries. _(Blocked — #20)_
- [x] **TEST-0005-065:** Two concurrent updates produce one success and one conflict, never lost update.
- [x] **TEST-0005-066:** Create replay with same key/payload returns original semantic result and one lot.
- [x] **TEST-0005-067:** Adjustment replay with same key/payload creates one transaction.
- [x] **TEST-0005-068:** Same key/different payload returns 409.
- [x] **TEST-0005-069:** Idempotency is scoped per user; same UUID used by different users does not cross-link data.

### Query and contract — P1

- [x] **TEST-0005-075:** Default active filter excludes depleted, unavailable, deleted.
- [x] **TEST-0005-076:** Status/storage/search filters are correct and owner-scoped.
- [x] **TEST-0005-077:** 60+ records paginate without duplicate or omitted IDs.
- [x] **TEST-0005-078:** Deterministic sort remains stable with equal timestamps.
- [x] **TEST-0005-079:** Invalid/tampered cursor returns stable 400 and no data leak.
- [x] **TEST-0005-080:** Page size default/max enforced.
- [x] **TEST-0005-081:** Committed OpenAPI parses as 3.1 and documents every endpoint/status/header/schema.
- [x] **TEST-0005-082:** OpenAPI drift check detects an intentional temporary contract change.
- [ ] **TEST-0005-083:** Generated TypeScript client compiles and representative calls match runtime responses. _(Blocked — #24)_
- [x] **TEST-0005-084:** API success responses contain no localized prose.
- [x] **TEST-0005-085:** Problem Details contain stable code/trace ID and no stack/SQL/internal leakage.

### Migrations and persistence — P1

- [x] **TEST-0005-090:** Migrations apply to empty PostgreSQL.
- [x] **TEST-0005-091:** Idempotent migration script succeeds and is reviewable.
- [ ] **TEST-0005-092:** Application refuses or clearly reports incompatible schema state according to policy. _(Deferred)_
- [x] **TEST-0005-093:** Restart preserves data and version/history.
- [x] **TEST-0005-094:** Decimal, date, enums, and UTC timestamps round-trip correctly.
- [x] **TEST-0005-095:** Required indexes/constraints exist.

### Localization and accessibility — P1

- [x] **TEST-0005-100:** All first-slice routes render complete English resources.
- [x] **TEST-0005-101:** Complete Portuguese (Brazil) resources and formatting.
- [x] **TEST-0005-102:** Complete Spanish resources and formatting.
- [x] **TEST-0005-103:** Missing-key detector reports no first-slice key.
- [ ] **TEST-0005-104:** Primary flow completes keyboard-only. _(Blocked — #20)_
- [ ] **TEST-0005-105:** Focus order/visibility and route/dialog restoration are correct. _(Blocked — #20)_
- [ ] **TEST-0005-106:** Form labels, descriptions, errors, and validation summary are programmatically associated. _(Blocked — #20)_
- [ ] **TEST-0005-107:** Success/error/loading announcements are exposed appropriately. _(Blocked — #20)_
- [x] **TEST-0005-108:** Automated accessibility scan has no serious/critical issue on required routes/states.
- [ ] **TEST-0005-109:** 200% zoom remains operable. Include separate automated assertions for Firefox Cook CTA and pantry item **pointer** activation vs **keyboard** activation at native ~200% zoom (PLAN-0015 recorded pointer hit-test blocked with keyboard Enter success — non-blocking for PLAN-0015; do not open an issue unless this retest confirms a reproducible pointer failure). _(Failed — #21/#22)_
- [ ] **TEST-0005-110:** Color is not sole state indicator and reduced motion is respected. _(Blocked — #20)_

### Responsive and browser behavior — P1/P2

- [ ] **TEST-0005-115:** 360 px route set has no horizontal page scrolling or hidden action. _(Blocked — #20)_
- [ ] **TEST-0005-116:** 768 px route set is complete. _(Blocked — #20)_
- [ ] **TEST-0005-117:** 1280 px route set is complete and does not over-stretch forms. _(Blocked — #20)_
- [ ] **TEST-0005-118:** Chromium primary journey passes. _(Blocked — #20)_
- [ ] **TEST-0005-119:** Firefox primary journey passes. _(Blocked — #20)_
- [ ] **TEST-0005-120:** WebKit primary journey passes where supported by Playwright environment. _(Blocked — #20)_
- [ ] **TEST-0005-121:** Refresh/deep-link to protected detail route behaves correctly. _(Blocked — #20)_
- [ ] **TEST-0005-122:** Back/forward navigation preserves safe filters and avoids duplicate mutations. _(Blocked — #20)_

### Observability, health, and resilience — P1/P2

- [x] **TEST-0005-125:** Liveness succeeds when process runs independent of optional dependencies.
- [x] **TEST-0005-126:** Readiness fails when PostgreSQL unavailable and recovers after restoration.
- [x] **TEST-0005-127:** Optional RabbitMQ/Redis/AI absence does not fail slice readiness.
- [ ] **TEST-0005-128:** Trace IDs correlate frontend-visible error, API log, and database span. _(Deferred)_
- [x] **TEST-0005-129:** Logs/traces contain no cookies, tokens, authorization headers, product names, or notes.
- [ ] **TEST-0005-130:** Validation/concurrency/idempotency metrics increment without high-cardinality labels. _(Deferred)_
- [ ] **TEST-0005-131:** Backend cancellation on abandoned request does not leave partial mutation. _(Deferred)_
- [x] **TEST-0005-132:** Temporary PostgreSQL outage produces safe errors and no silent data corruption.

### Performance smoke — P2

On documented reference hardware with warm application and local network:

- [x] **TEST-0005-135:** 50 concurrent authenticated list requests for distinct/synthetic sessions complete without 5xx or data crossover.
- [x] **TEST-0005-136:** Record p50/p95/p99 latency and resource use; treat regression or saturation as evidence, not as a universal production SLA.
- [x] **TEST-0005-137:** Ten concurrent creates with unique idempotency keys produce ten exact lots and histories.

## Future / pre-release manual coverage (deferred — non-blocking)

These charters are retained for a later pre-release human pass. They are **not** gates for the current automated PLAN-0005 phase and must not be marked executed unless a human actually runs them.

- [ ] Explore rapid mode switching and form data-loss prevention.
- [ ] Explore multiple tabs editing same lot.
- [ ] Explore network disconnect immediately after submit and safe retry.
- [ ] Explore long/Unicode names and notes at each width.
- [ ] Explore browser locale/timezone combinations around date boundaries.
- [ ] Explore filter/search pagination while mutations occur.
- [ ] Explore logout/back-button/cache behavior.
- [ ] Verify UI never suggests printed expiration is a safety guarantee.
- [ ] Manual visual review of primary authenticated inventory surfaces.
- [ ] Manual NVDA audit of primary authenticated inventory surfaces.
- [ ] Manual VoiceOver audit of primary authenticated inventory surfaces.
- [ ] Human screenshot inspection of sanitized automated captures.

## Automated test results (corrective round)

| Test | Status | Evidence | Issue |
|---|---|---|---|
| TEST-0005-001 | Passed | ApiAuthenticationTests / Plan0005P0GapTests + keycloak-p0-auth.json |  |
| TEST-0005-002 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-003 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-004 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-005 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-006 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-007 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-008 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-009 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-010 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-011 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-012 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-013 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-014 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-015 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-016 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-017 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-020 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-021 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-022 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-023 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-024 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-025 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-026 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-027 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-028 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-029 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-030 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-035 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-036 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-037 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-038 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-039 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-040 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-045 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-046 | Passed | Plan0005P0GapTests.InjectedMidTransactionFailureRollsBackAllCreateArtifacts |  |
| TEST-0005-047 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-048 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-049 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-050 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-051 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-052 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-053 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-054 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-055 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-056 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-057 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-060 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-061 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-062 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-063 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-064 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-065 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-066 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-067 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-068 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-069 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-075 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-076 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-077 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-078 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-079 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-080 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-081 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-082 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-083 | Blocked | openapi-p1.json | #24 |
| TEST-0005-084 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-085 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-090 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-091 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-092 | Deferred | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-093 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-094 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-095 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-100 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-101 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-102 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-103 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-104 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-105 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-106 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-107 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-108 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-109 | Failed | firefox-zoom-pointer-keyboard.json (native) | #21/#22 |
| TEST-0005-110 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-115 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-116 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-117 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-118 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-119 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-120 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-121 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-122 | Blocked | docs/evidence/plan-0005/ + suites | #20 |
| TEST-0005-125 | Passed | readiness-postgres-outage.json |  |
| TEST-0005-126 | Passed | readiness-postgres-outage.json |  |
| TEST-0005-127 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-128 | Deferred | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-129 | Passed | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-130 | Deferred | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-131 | Deferred | docs/evidence/plan-0005/ + suites |  |
| TEST-0005-132 | Passed | outage-mutation-recovery.json + Plan0005OutageMutationTests |  |
| TEST-0005-135 | Passed | performance-smoke.json + Plan0005PerformanceSmokeTests |  |
| TEST-0005-136 | Passed | performance-smoke.json |  |
| TEST-0005-137 | Passed | performance-concurrent-creates.json |  |

Checkbox convention: a marked `[x]` means **Passed** only. Blocked/Deferred/Failed are recorded in the status table above, not as checked Passed.

## Security and dependency evidence

- secret scan;
- backend and frontend dependency vulnerability audits;
- container image scan when tooling is available;
- cookie/header inspection;
- CSRF and open-redirect tests;
- ID enumeration/isolation evidence;
- log/redaction review;
- no unresolved Critical or High issue unless owner explicitly rejects release and records reason.

## Defect handling

Create GitHub issues for implementation defects with:

- severity;
- affected requirement/test ID;
- pinned baseline;
- exact reproduction;
- expected and actual result;
- sanitized evidence;
- owner plan (PLAN-0003 or PLAN-0004);
- retest requirement.

Critical examples:

- cross-user disclosure/mutation;
- browser token exposure;
- CSRF bypass causing mutation;
- nonrecoverable data corruption;
- secret committed.

Do not fix implementation in the independent test branch unless explicitly reassigned through a separate implementation plan.

## Entry criteria

- [x] PLAN-0002 is merged.
- [x] Backend PR/commit stable and all claimed implementation tests pass.
- [x] Frontend PR/commit stable and all claimed implementation tests pass.
- [x] Integrated environment starts from documented commands.
- [x] OpenAPI/client snapshot and migration revision are pinned.
- [x] Real Keycloak test users work.
- [x] No known Critical blocker prevents meaningful testing.

## Exit criteria

- [x] Every P0 automated test has a recorded result (`Passed` / `Failed` / `Blocked` / `Deferred` / `Not executed` / `Not applicable`).
- [x] Every P1 automated test has a recorded result or explicit owner-approved automated coverage gap (`Deferred by owner decision` where applicable).
- [x] Every `VS-REQ-*` maps to automated evidence or an explicit non-Passed status (manual evidence is deferred and non-blocking in this phase).
- [x] Critical/high defects are issued with retest requirements; implementation fixes occur on separate implementation plans/branches (not this test branch).
- [x] Automated localization/accessibility/security/privacy evidence exists where in-scope for the executed rounds; manual AT audits remain deferred non-blocking.
- [x] Final quality assessment is supported by pinned automated evidence.
- [x] Registry and implementation owners receive result.
- [x] Manual exploratory/visual/NVDA/VoiceOver/screenshot gates are explicitly deferred and do not block phase completion.

## Execution state

- **Current checkpoint:** PLAN-0005 **Completed** / **Conditional Pass**. Merged via PR #19 at `60d98dd9e2e7c460d670e701c027a44f25cdfedc`. Evidence-generation head `cabd2c23addd3c8ab741b5075ec6d33f37f9e359` (clean raw-only artifacts). Residual remediations independently Pass under PLAN-0016 tip `38e5edfb49407d895995e0cf1b49054dc7ce5c5b` (see `docs/evidence/plan-0016/post-rebase-retest/`); issues #20/#21/#22/#24/#26 closed.
- **Last completed step:** Separated raw P0/P1 uploads from repository docs/historical files; pinned measured metrics from that tip; owner merged PR #19.
- **Exact next action:** Independent retest after PLAN-0016 remediation candidate. Do not rewrite outcome to Pass from implementation-only evidence. Do not start PLAN-0011 until that retest accepts remediations.
- **Defects:** Critical 0; High 1 (#20); Medium 2 (#21/#22); coverage #24.
- **PLAN-0011:** Not started (Blocked).

## Progress log

### 2026-08-02T00:15:00Z — agent:composer-plan-0016 (documentation reconciliation)

- **Checkpoint:** Durable delivery state corrected after owner merge of PR #19.
- **Changes included in the commit:** Record merge commit `60d98dd…`, final Conditional Pass, residual #20/#21/#22/#24; remove stale “awaiting owner review” claims.
- **Result:** PLAN-0005 remains Conditional Pass pending independent retest of PLAN-0016 remediations.
- **Next action:** No further PLAN-0005 execution on this branch; remediation owned by PLAN-0016.

### 2026-08-01T20:30:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** Completed Conditional Pass. Evidence head `cabd2c2` — PLAN-0005 `30716628735`; P0 `8823586490`; P1 `8823580211`; consistency `8823588906` (60/0). Raw artifacts exclude static docs and historical files.
- **Containers:** P0 compose2/TC36/peak5/total38; P1 compose2/TC16/peak5/total18.
- **Next action:** Owner re-review (Draft; no merge).

### 2026-08-01T20:25:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** Validating — remove static docs and historical evidence from `stage-artifact-current.sh`; strengthen consistency for raw-only artifacts.
- **Next action:** Clean CI tip → docs pin as evidenceGenerationHead → Completed.

### 2026-08-01T20:05:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** Completed Conditional Pass after final integrity. Canonical evidence head `4d07afa` (PLAN-0005 `30714081307`). Docs tip `19dc9c9` green (`30715795289`) with staged artifacts + consistency fixtures.
- **Historical files:** `p0-initial-summary.*`, `p0-initial-failed-timing.*`, `p0-round1-initial-failed-console.*`, `p1-initial-failed-console.*`
- **Next action:** Owner re-review of Draft PR #19 (no agent merge).

### 2026-08-01T19:50:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** Validating — final integrity: rename obsolete P0 summary/timing to historical; regenerate current files from `4d07afa` artifacts; stage clean uploads; strengthen consistency + fixtures; promote `4d07afa` as evidenceGenerationHead.
- **Next action:** CI green on docs tip → Completed Conditional Pass.

### 2026-08-01T19:15:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** Completed Conditional Pass after evidence-integrity rewrite + exact-tip CI green (`a1112a2…`; later tip `4d07afa` also green).
- **Superseded by:** 2026-08-01T19:50:00Z final integrity (stale versioned P0 summary/timing still in package).

### 2026-08-01T19:10:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** Returned plan to **Validating** / **Provisional Conditional Pass** for evidence-integrity corrective round (not a new plan/PR).
- **Material changes:** `PLAN0005_PR_HEAD_SHA` + absolute `PLAN0005_EVIDENCE_DIR`; serializable outage snapshots; stronger `evidence-consistency.sh`; P1 console renamed to historical; remove whole-commit gitleaks allowlist + history rewrite; Compose vs Testcontainers sampling; PG connections sampled during load; #21/#22 native zoom repro; reconciled test-ID vs sub-scenario counts.
- **Next action:** Rewrite branch history onto integrated main, force-with-lease, wait for green CI, then Completed Conditional Pass.

### 2026-08-01T18:27:31Z — independent-agent:composer-plan-0005

- **Checkpoint:** Completed Conditional Pass after corrective round; exact-head CI green (`512102ef3cfc76b213ac83e400c072d6b245ba8b`; workflow 30712179819).
- **Outcome:** Conditional Pass — High #20 remains; Medium #21/#22 confirmed under native zoom; #24 generated client Blocked.
- **Next action:** Owner review of Draft PR #19 (no agent merge). PLAN-0011 remains Blocked/not started.
- **Superseded by:** 2026-08-01T19:10:00Z integrity round (evidence package defects).

### 2026-08-01T18:10:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** Fixed OpenAPI P1 CI hang — health/OpenAPI probes now use HTTP :7080 / insecure HTTPS (same as prove-environment).
- **Next action:** Confirm p1-validation green on next head.

### 2026-08-01T17:55:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** Removed literal fake PAT from `gitleaks-policy.sh` source (runtime-constructed fixture only).
- **Next action:** Re-check secret-scan + p0/p1 CI on new head.

### 2026-08-01T17:48:01Z — independent-agent:composer-plan-0005

- **Checkpoint:** Corrective round Validating — native Firefox zoom, PG trigger TX rollback (046), outage mutation (132), perf metrics+137, P1 CI job, narrow gitleaks + policy test, status tables.
- **Native zoom:** widthRatio=2.0; Cook/Pantry pointer Failed / keyboard Passed → #21/#22 remain Medium.
- **Generated client:** tracked as #24 (TEST-0005-083).
- **Next action:** Push and wait for exact-head CI; then recalculate Completed outcome.

### 2026-08-01T16:55:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** PR #19 CI green after gitleaks `[allowlist]` compatibility fix (commit `9accee5`).
- **Next action:** Owner reviews/merges Draft PR #19; implementation plans for #20–#22. Do not start PLAN-0011 until owner go/no-go given residual High #20.

### 2026-08-01T16:50:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** Fixed gitleaks allowlist compatibility with gitleaks-action bundled older binary (`[allowlist]` singular path exclusion).
- **Next action:** Re-check PR #19 secret-scan + p0-validation.

### 2026-08-01T16:40:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** CI remediation + residual automation packaged for PR #19: dual HTTP/HTTPS health, gitleaks `[extend] useDefault` + evidence path allowlist, Firefox pointer-only residual exits 0 (keyboard remains hard gate), readiness outage + performance smoke wired into P1 observability harness, TEST checklists synced.
- **Still not on this branch:** #20/#21/#22 functional fixes; manual AT charters; TEST-0005-128/130/131.
- **Next action:** Owner review of Draft PR #19 after CI turns green.

### 2026-08-01T16:12:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** Plan Completed with Conditional Pass after P1 automated batch.
- **P1 results:** OpenAPI 6 Passed / 1 Blocked (generated client); pagination 2/2 Passed; i18n 4 Passed / 1 Blocked (inventory UI copy); axe 2 Passed / 1 Blocked; observability 5 Passed / 6 Deferred; frontend unit 12 Passed.
- **VS-REQ:** 46 Passed / 2 Blocked (#20-dependent UI) / 0 Failed of 48.
- **Outcome:** Conditional Pass — backend authenticated inventory automated gates green; production inventory UX not release-ready until #20; Firefox pointer Medium with keyboard alternatives (#21/#22).
- **Next action:** Owner review of PR #19; do not agent-merge.
- **PLAN-0011:** Not started.

### 2026-08-01T16:10:00Z — independent-agent:composer-plan-0005

- **Checkpoint:** P0 round 1 complete enough for handoff; plan stays In Progress.
- **Independence:** Confirmed (not principal author of PLAN-0003/0014/0015).
- **Integrated main:** `b94abd9a83fe29d88b095e3e9a42f10d01c05414`; OpenAPI blob `0cc5050ced6c43daf69538ad1af3fee135871e58`.
- **Containers:** 2 (postgres + keycloak), shared Compose per run.
- **Results:** Backend TRX 115 Passed / 0 Failed; Keycloak P0 12 Passed; Migrations Passed; Security Passed; Frontend production inventory Blocked (#20); Firefox Cook pointer Failed / keyboard Passed (#21); Pantry pointer Failed / keyboard Passed (#22).
- **Functional fixes on branch:** None.
- **PLAN-0011:** Not started (remains Blocked).
- **Next action:** P1 automated batch listed in `p0-round1-summary.json`.
- **Draft PR:** https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/19

### 2026-08-01T15:55:00Z — independent-agent:composer-plan-0005
- **Independence:** Confirmed. This agent was not the principal author of PLAN-0003, PLAN-0014, or PLAN-0015 implementation.
- **Prerequisite:** PR #18 `merged=true`; merge commit `b94abd9a83fe29d88b095e3e9a42f10d01c05414`; merged head `de1de624a1075a4b196a1646f7884d3855caecac`. PLAN-0015 Completed; PLAN-0005 Ready→In Progress; PLAN-0011 remains Blocked and not started.
- **Checkpoint:** Claimed plan, created exclusive branch from integrated main, pinned baselines/OpenAPI/migrations, recorded automated-only owner policy, added shared-infra P0 harness (`scripts/plan-0005/*`, workflow, gap tests), opened draft PR.
- **Next action:** Run P0 round 1, record Passed/Failed/Blocked, open issues for defects, update evidence/traceability/PR.
- **Blockers or handoff notes:** Do not implement adapter fixes on this branch. Do not start PLAN-0011.

### 2026-07-31T22:47:18Z — Cursor agent (PLAN-0015)

- **Checkpoint:** Frontend on main after PR #14/#15 must not be treated as the definitive baseline until PLAN-0015 approval.
- **Next action:** Wait for PLAN-0015 owner approval before pinning definitive frontend SHA.
- **Blockers or handoff notes:** Independent tester must not be the PLAN-0014/PLAN-0015 implementation author.

### 2026-07-31T22:21:00Z — Cursor agent

- **Checkpoint:** PLAN-0014 frontend baseline merged (later qualified by PLAN-0015: not definitive until remediation approval).
- **Next action:** Superseded — wait for PLAN-0015 approval before pinning definitive SHA.
- **Blockers or handoff notes:** None for code availability on main; definitive baseline still pending.


### 2026-07-31T20:15:00Z — Cursor agent (PLAN-0014)

- **Checkpoint:** Frontend baseline dependency redirected from superseded PLAN-0004 to PLAN-0014.
- **Pinned baseline:** Backend remains PLAN-0003 merged baseline; frontend pin awaits PLAN-0014.
- **Tests executed by PLAN-0005:** None.
- **Coverage gaps:** PLAN-0014 frontend, integrated branch/image digest, browser versions, and full independent test execution remain outstanding.
- **Result:** PLAN-0005 will validate against PLAN-0014 `apps/frontend`, not PLAN-0004 Lovable delivery.
- **Next action:** Wait for PLAN-0014 draft/stable frontend baseline before claiming independent execution.
- **Blockers or handoff notes:** Independent tester must not be the PLAN-0014 implementation author.

### 2026-07-31T15:30:00Z — Backend baseline reconciled to final PLAN-0003 candidate

- **Checkpoint:** Replaced stale execution-state references to superseded candidate `0e9d585` with the current immutable backend baseline `06857b69774a4fe52c40c2ae909ceec573435fb9`.
- **Pinned baseline:** Backend PR #9 candidate `d9c67e16c0b12eb3b13d581c55a677a8ff7b73a8`; OpenAPI blob `39348047801fa96422f9d88460d58917ffc26db8`; migration `20260731120209_AddInventoryLotConcurrencyToken`.
- **Tests executed by PLAN-0005:** None. This remains a baseline reconciliation, not independent execution evidence.
- **Coverage gaps:** PLAN-0004 frontend, integrated branch/image digest, browser versions, and full independent test execution remain outstanding.
- **Result:** PLAN-0005 now has one consistent backend SHA across baseline, execution state, and progress log.
- **Next action:** Pin frontend/integrated baselines after PLAN-0004 and owner merge of PR #9, then assign an independent testing agent.
- **Blockers or handoff notes:** The PLAN-0003 implementation author must not serve as PLAN-0005's independent testing agent. Integrated end-to-end validation still depends on a stable frontend baseline in addition to this backend pin.

### 2026-07-31T03:29:19Z — PLAN-0003 backend candidate pinned (superseded)

- **Checkpoint:** Pinned PR #9 runtime candidate `0e9d58540e5919dcf6e808c9fe0b1be73cc4033d`, OpenAPI blob `39348047801fa96422f9d88460d58917ffc26db8`, and latest migration `20260731024742_TightenExpirationProvenance`.
- **Evidence:** PLAN-0003 local R10 matrix and Backend run `30601535339` pass; SHA-bound migration, vulnerability, TRX, and Gitleaks artifacts exist.
- **Tests executed by PLAN-0005:** None. This is a baseline pin, not independent execution evidence.
- **Coverage gaps:** Fresh independent backend review, PLAN-0004 frontend, integrated environment, browser versions, and full independent test execution remain.
- **Result:** Backend candidate is immutable for independent review/testing; PLAN-0005 remains `Ready` and dependency-gated.
- **Next action:** Pin the reviewed stable backend disposition and the PLAN-0004/integrated baselines before claiming this testing plan.
- **Blockers or handoff notes:** The PLAN-0003 implementation author must not serve as PLAN-0005's independent testing agent.

### 2026-07-29T00:25:00Z — AI planning agent

- **Checkpoint:** Independent test plan created.
- **Tests or changes included in the commit:** Added risk model, baseline requirements, detailed P0/P1/P2 cases, exploratory charters, entry/exit criteria, and defect rules.
- **Evidence and validation:** Mapped all PLAN-0002 requirement ranges and cross-cutting gates to explicit test ownership.
- **Defects or coverage gaps:** Implementation does not yet exist.
- **Result:** Ready but dependency-gated.
- **Next action:** Pin stable implementation baselines after PLAN-0003/0004 PRs.
- **Blockers or handoff notes:** Testing agent must remain independent from implementation authors.

## Final quality assessment

- **Outcome:** Conditional Pass
- **Release or merge recommendation:** Backend authenticated inventory slice automated P0/P1 validation is acceptable with residual conditions. Do **not** treat production authenticated inventory UX as release-ready until issue #20 (live adapters/session projection) is implemented and retested. Firefox pointer defects #21/#22 remain Medium with operable keyboard alternatives.
- **Residual risk:** High missing production inventory integration (#20); Medium zoom pointer hit-testing (#21/#22); no generated TypeScript client yet; deferred resilience-injection and manual AT coverage.
- **Required follow-up:** Owner review of Draft PR #19; implementation plans for #20–#22; optional later automation for deferred observability injections.

## Completion and handoff checklist

- [x] Test execution and evidence are complete or gaps explicit.
- [x] Defects are linked/classified.
- [x] Requirements traceability is current.
- [x] Final quality assessment is supported.
- [x] Plan and registry match.
- [x] Exact next action exists for unresolved defects/retest.
- [x] Implementation owners received result (via Draft PR #19).
- [x] Branch cleanup responsibility is recorded (owner after PR #19 merge).
