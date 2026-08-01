# PLAN-0005: Independently Validate the Authenticated Inventory Slice

- **Status:** Ready
- **Type:** Testing
- **Priority:** Critical
- **Owner:** Unassigned independent testing agent
- **Created:** 2026-07-29
- **Last updated:** 2026-07-31T22:47:18Z
- **Branch:** `agent/plan-0005-test-inventory-slice`
- **Pull request:** Not opened
- **System under test:** Stable PLAN-0003 backend and remediated PLAN-0014/PLAN-0015 frontend baseline commits in an integrated test environment
- **Related implementation plans:** PLAN-0003, PLAN-0014 (on main), PLAN-0015 (remediation)
- **Related issues:** None
- **Related ADRs:** ADR-0001 (historical), ADR-0007, ADR-0002 through ADR-0006
- **Dependencies:** PLAN-0002 merged; PLAN-0015 merged via PR #16 with remaining manual validation before treating a frontend SHA as the definitive baseline; stable implementation baselines and deployable environment

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

Before execution, fill all fields and commit them:

- **Repository:** `RodrigoWantuk/WTK.KitchenFlow`
- **Backend PR and commit:** [PR #9](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/9) candidate `d9c67e16c0b12eb3b13d581c55a677a8ff7b73a8`; ready for independent PLAN-0005 execution after owner merge
- **Frontend PR and commit:** Required — pin after remaining PLAN-0015 manual validation; PR #16 is already merged and must not be treated as still draft/open
- **Integrated branch/commit or environment image digest:** Required
- **OpenAPI snapshot SHA:** Git blob `39348047801fa96422f9d88460d58917ffc26db8` from backend candidate `d9c67e16c0b12eb3b13d581c55a677a8ff7b73a8`
- **Lovable source repository commit:** Required
- **Operating system:** Windows or Linux, exact version
- **Docker/Compose versions:** Required
- **.NET SDK and Node versions:** Required
- **Container image versions/digests:** Required
- **Database migration revision:** `20260731120209_AddInventoryLotConcurrencyToken` from backend candidate `d9c67e16c0b12eb3b13d581c55a677a8ff7b73a8`
- **Browser versions:** Chromium, Firefox, and WebKit through Playwright where supported
- **Locales:** `en`, `pt-BR`, `es`
- **Test users:** synthetic user A and user B only
- **Known pre-existing defects:** Required, may be `None`

Do not execute against moving branch heads without pinning commits.

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

- [ ] **TEST-0005-001:** Protected inventory API without session returns 401 and no data.
- [ ] **TEST-0005-002:** Protected browser route reaches login flow and returns safely after valid login.
- [ ] **TEST-0005-003:** OIDC access/refresh tokens are absent from localStorage, sessionStorage, IndexedDB, page HTML, and JavaScript-visible cookies.
- [ ] **TEST-0005-004:** Session cookie has expected HttpOnly/Secure/SameSite/path attributes in HTTPS test environment.
- [ ] **TEST-0005-005:** State-changing request without CSRF token is rejected and does not mutate.
- [ ] **TEST-0005-006:** Invalid CSRF token is rejected.
- [ ] **TEST-0005-007:** Logout invalidates local session; protected request fails afterward.
- [ ] **TEST-0005-008:** Untrusted external return URL is rejected.
- [ ] **TEST-0005-009:** User A and B resolve to distinct internal UUIDs independent of Keycloak subject format.

### User isolation — P0

For list, detail, patch, adjustment, delete, and history:

- [ ] **TEST-0005-010:** User A never sees user B records in list/search/filter/pagination.
- [ ] **TEST-0005-011:** User A requesting user B lot ID receives 404.
- [ ] **TEST-0005-012:** User A cannot update user B lot by path ID or crafted body.
- [ ] **TEST-0005-013:** User A cannot adjust user B lot.
- [ ] **TEST-0005-014:** User A cannot delete user B lot.
- [ ] **TEST-0005-015:** User A cannot read user B history.
- [ ] **TEST-0005-016:** Responses do not disclose whether a foreign ID exists.
- [ ] **TEST-0005-017:** Database inspection confirms no accidental owner reassignment.

Any failure in this group is release-blocking Critical.

### Product and quantity — P0/P1

- [ ] **TEST-0005-020:** Valid product names at min/max boundaries create successfully.
- [ ] **TEST-0005-021:** Empty/whitespace/overlength names fail with stable field code.
- [ ] **TEST-0005-022:** Unicode spelling is preserved and searchable according to documented normalization.
- [ ] **TEST-0005-023:** Similar product names can coexist; no silent merge occurs.
- [ ] **TEST-0005-024:** Measured gram quantity round-trips exactly.
- [ ] **TEST-0005-025:** Measured milliliter quantity round-trips exactly.
- [ ] **TEST-0005-026:** Measured unit quantity round-trips exactly, including permitted fractional precision if documented.
- [ ] **TEST-0005-027:** Zero, negative, excessive precision, NaN, infinity, and scientific-notation abuse are rejected appropriately.
- [ ] **TEST-0005-028:** Availability states round-trip exactly.
- [ ] **TEST-0005-029:** Mixed measured/availability payload is rejected by API and database constraint.
- [ ] **TEST-0005-030:** Locale decimal entry in each locale submits the intended canonical value.

### Storage, package, date, notes — P1

- [ ] **TEST-0005-035:** Each standard storage location works.
- [ ] **TEST-0005-036:** `Other` without custom label fails; valid boundary labels pass.
- [ ] **TEST-0005-037:** Package state optional and each enum works.
- [ ] **TEST-0005-038:** Printed date persists as calendar date without timezone shift on positive/negative UTC offsets.
- [ ] **TEST-0005-039:** UI identifies printed date as entered information and does not claim safety.
- [ ] **TEST-0005-040:** Notes boundary works and notes are absent from logs/metrics/errors.

### Atomic creation and mutations — P0

- [ ] **TEST-0005-045:** Create produces product, lot, initial transaction, and audit event in one transaction.
- [ ] **TEST-0005-046:** Injected failure before commit leaves none of the four partial records.
- [ ] **TEST-0005-047:** Metadata update preserves quantity history.
- [ ] **TEST-0005-048:** Consume positive amount produces correct resulting quantity/history.
- [ ] **TEST-0005-049:** Consume above current quantity fails without mutation.
- [ ] **TEST-0005-050:** Discard positive amount produces correct resulting quantity/history.
- [ ] **TEST-0005-051:** Discard above current quantity fails without mutation.
- [ ] **TEST-0005-052:** Correct records previous/resulting values and reason.
- [ ] **TEST-0005-053:** Reaching zero removes lot from active view but preserves depleted/history access.
- [ ] **TEST-0005-054:** Availability change records immutable history.
- [ ] **TEST-0005-055:** Delete soft-deletes and records history/audit.
- [ ] **TEST-0005-056:** Deleted lot absent from normal detail/list and available only through intended administrative/user filter behavior.
- [ ] **TEST-0005-057:** Public API cannot update/delete transaction or audit rows.

### Concurrency and idempotency — P0

- [ ] **TEST-0005-060:** Read responses provide version/ETag.
- [ ] **TEST-0005-061:** Mutation without `If-Match` returns 428 and does not mutate.
- [ ] **TEST-0005-062:** Valid version succeeds and increments version.
- [ ] **TEST-0005-063:** Stale version returns 412 and preserves newer data.
- [ ] **TEST-0005-064:** Frontend stale dialog offers reload and never silently retries.
- [ ] **TEST-0005-065:** Two concurrent updates produce one success and one conflict, never lost update.
- [ ] **TEST-0005-066:** Create replay with same key/payload returns original semantic result and one lot.
- [ ] **TEST-0005-067:** Adjustment replay with same key/payload creates one transaction.
- [ ] **TEST-0005-068:** Same key/different payload returns 409.
- [ ] **TEST-0005-069:** Idempotency is scoped per user; same UUID used by different users does not cross-link data.

### Query and contract — P1

- [ ] **TEST-0005-075:** Default active filter excludes depleted, unavailable, deleted.
- [ ] **TEST-0005-076:** Status/storage/search filters are correct and owner-scoped.
- [ ] **TEST-0005-077:** 60+ records paginate without duplicate or omitted IDs.
- [ ] **TEST-0005-078:** Deterministic sort remains stable with equal timestamps.
- [ ] **TEST-0005-079:** Invalid/tampered cursor returns stable 400 and no data leak.
- [ ] **TEST-0005-080:** Page size default/max enforced.
- [ ] **TEST-0005-081:** Committed OpenAPI parses as 3.1 and documents every endpoint/status/header/schema.
- [ ] **TEST-0005-082:** OpenAPI drift check detects an intentional temporary contract change.
- [ ] **TEST-0005-083:** Generated TypeScript client compiles and representative calls match runtime responses.
- [ ] **TEST-0005-084:** API success responses contain no localized prose.
- [ ] **TEST-0005-085:** Problem Details contain stable code/trace ID and no stack/SQL/internal leakage.

### Migrations and persistence — P1

- [ ] **TEST-0005-090:** Migrations apply to empty PostgreSQL.
- [ ] **TEST-0005-091:** Idempotent migration script succeeds and is reviewable.
- [ ] **TEST-0005-092:** Application refuses or clearly reports incompatible schema state according to policy.
- [ ] **TEST-0005-093:** Restart preserves data and version/history.
- [ ] **TEST-0005-094:** Decimal, date, enums, and UTC timestamps round-trip correctly.
- [ ] **TEST-0005-095:** Required indexes/constraints exist.

### Localization and accessibility — P1

- [ ] **TEST-0005-100:** All first-slice routes render complete English resources.
- [ ] **TEST-0005-101:** Complete Portuguese (Brazil) resources and formatting.
- [ ] **TEST-0005-102:** Complete Spanish resources and formatting.
- [ ] **TEST-0005-103:** Missing-key detector reports no first-slice key.
- [ ] **TEST-0005-104:** Primary flow completes keyboard-only.
- [ ] **TEST-0005-105:** Focus order/visibility and route/dialog restoration are correct.
- [ ] **TEST-0005-106:** Form labels, descriptions, errors, and validation summary are programmatically associated.
- [ ] **TEST-0005-107:** Success/error/loading announcements are exposed appropriately.
- [ ] **TEST-0005-108:** Automated accessibility scan has no serious/critical issue on required routes/states.
- [ ] **TEST-0005-109:** 200% zoom remains operable. Include separate automated assertions for Firefox Cook CTA and pantry item **pointer** activation vs **keyboard** activation at native ~200% zoom (PLAN-0015 recorded pointer hit-test blocked with keyboard Enter success — non-blocking for PLAN-0015; do not open an issue unless this retest confirms a reproducible pointer failure).
- [ ] **TEST-0005-110:** Color is not sole state indicator and reduced motion is respected.

### Responsive and browser behavior — P1/P2

- [ ] **TEST-0005-115:** 360 px route set has no horizontal page scrolling or hidden action.
- [ ] **TEST-0005-116:** 768 px route set is complete.
- [ ] **TEST-0005-117:** 1280 px route set is complete and does not over-stretch forms.
- [ ] **TEST-0005-118:** Chromium primary journey passes.
- [ ] **TEST-0005-119:** Firefox primary journey passes.
- [ ] **TEST-0005-120:** WebKit primary journey passes where supported by Playwright environment.
- [ ] **TEST-0005-121:** Refresh/deep-link to protected detail route behaves correctly.
- [ ] **TEST-0005-122:** Back/forward navigation preserves safe filters and avoids duplicate mutations.

### Observability, health, and resilience — P1/P2

- [ ] **TEST-0005-125:** Liveness succeeds when process runs independent of optional dependencies.
- [ ] **TEST-0005-126:** Readiness fails when PostgreSQL unavailable and recovers after restoration.
- [ ] **TEST-0005-127:** Optional RabbitMQ/Redis/AI absence does not fail slice readiness.
- [ ] **TEST-0005-128:** Trace IDs correlate frontend-visible error, API log, and database span.
- [ ] **TEST-0005-129:** Logs/traces contain no cookies, tokens, authorization headers, product names, or notes.
- [ ] **TEST-0005-130:** Validation/concurrency/idempotency metrics increment without high-cardinality labels.
- [ ] **TEST-0005-131:** Backend cancellation on abandoned request does not leave partial mutation.
- [ ] **TEST-0005-132:** Temporary PostgreSQL outage produces safe errors and no silent data corruption.

### Performance smoke — P2

On documented reference hardware with warm application and local network:

- [ ] **TEST-0005-135:** 50 concurrent authenticated list requests for distinct/synthetic sessions complete without 5xx or data crossover.
- [ ] **TEST-0005-136:** Record p50/p95/p99 latency and resource use; treat regression or saturation as evidence, not as a universal production SLA.
- [ ] **TEST-0005-137:** Ten concurrent creates with unique idempotency keys produce ten exact lots and histories.

## Manual exploratory charters

- [ ] Explore rapid mode switching and form data-loss prevention.
- [ ] Explore multiple tabs editing same lot.
- [ ] Explore network disconnect immediately after submit and safe retry.
- [ ] Explore long/Unicode names and notes at each width.
- [ ] Explore browser locale/timezone combinations around date boundaries.
- [ ] Explore filter/search pagination while mutations occur.
- [ ] Explore logout/back-button/cache behavior.
- [ ] Verify UI never suggests printed expiration is a safety guarantee.

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

- [ ] PLAN-0002 is merged.
- [ ] Backend PR/commit stable and all claimed implementation tests pass.
- [ ] Frontend PR/commit stable and all claimed implementation tests pass.
- [ ] Integrated environment starts from documented commands.
- [ ] OpenAPI/client snapshot and migration revision are pinned.
- [ ] Real Keycloak test users work.
- [ ] No known Critical blocker prevents meaningful testing.

## Exit criteria

- [ ] Every P0 test has a recorded result.
- [ ] Every P1 test has a recorded result or explicit owner-approved coverage gap.
- [ ] Every `VS-REQ-*` maps to evidence.
- [ ] Critical/high defects are fixed and retested or final outcome is Fail/Conditional Pass with explicit release rejection/conditions.
- [ ] Localization/accessibility/security/privacy evidence exists.
- [ ] Final quality assessment is supported by pinned evidence.
- [ ] Registry and implementation owners receive result.

## Execution state

- **Current checkpoint:** Backend baseline from PLAN-0003 remains pin-ready. PLAN-0015 Completed (evidence generation head `25aa10c`; frontend implementation `e248126`); definitive pin and claim wait on owner merge of PR #18.
- **Last completed step:** Registry/docs reconciled for PLAN-0015 completion; PLAN-0005 still Not started.
- **Exact next action:** After PR #18 merge, an independent agent claims PLAN-0005, creates its exclusive branch and moves it to In Progress; pin approved frontend SHA and integrated environment/browser baselines.
- **Blockers:** Wait for owner merge of PR #18 (PLAN-0015 completion docs); integrated environment image digest remain unfilled.
- **Tests executed:** None.
- **Defects found:** None.
- **Evidence produced:** Immutable backend baseline pin only.
- **Known coverage gaps:** Frontend, integrated, browser-version, and locale baselines are still required before independent execution. Also: Firefox Cook CTA / pantry item pointer vs keyboard at 200% (carried from PLAN-0015).
- **Working tree state:** Not applicable until an independent agent claims execution.

## Progress log

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

- **Outcome:** Not evaluated
- **Release or merge recommendation:** Not available
- **Residual risk:** Entire runtime behavior remains untested until implementation.
- **Required follow-up:** Execute this plan against pinned integrated baselines.

## Completion and handoff checklist

- [ ] Test execution and evidence are complete or gaps explicit.
- [ ] Defects are linked/classified.
- [ ] Requirements traceability is current.
- [ ] Final quality assessment is supported.
- [ ] Plan and registry match.
- [ ] Exact next action exists for unresolved defects/retest.
- [ ] Implementation owners received result.
- [ ] Branch cleanup responsibility is recorded.
