# PLAN-0024: Independently Validate PLAN-0020 Profile Frontend

- **Status:** Draft
- **Type:** Testing
- **Priority:** High
- **Owner:** Unassigned independent testing agent
- **Created:** 2026-08-03
- **Last updated:** 2026-08-03T00:00:00Z
- **Branch:** `agent/plan-0024-validate-plan-0020-profile` (when claimed)
- **Pull request:** Not opened
- **System under test:** Draft PR for PLAN-0020 / `agent/plan-0020-profile-frontend` (exact candidate SHA TBD at claim)
- **Related implementation plan:** [PLAN-0020](PLAN-0020-implement-profile-household-equipment-frontend.md)
- **Related plans:** PLAN-0012 (backend), PLAN-0016 (session/inventory frontend), PLAN-0005 (inventory validation baseline)
- **Dependencies:** PLAN-0020 draft PR published with a stable candidate SHA; Frontend and applicable PLAN-0005 workflows green on that tip

## Objective

Independently determine whether the PLAN-0020 production profile frontend satisfies the accepted profile contract, progressive-field semantics, shared concurrency, privacy, accessibility, and production-isolation requirements without modifying product behavior during assessment.

## Test basis

- `docs/product/audience-and-profile.md`
- `docs/plans/PLAN-0020-implement-profile-household-equipment-frontend.md` acceptance criteria
- PLAN-0012 backend contracts and OpenAPI `kitchenflow-v1.json` profile operations
- ADR-0004 identity/session and privacy/security docs
- `docs/testing/product-foundation-gates.md`

## Scope

### Included

- Absent profile scaffold (`profileExists: false`, no ETag) versus empty fields
- Section PATCH versus accidental PUT replacement
- Progressive field confirm/remove/default-not-silent-confirm
- Shared profile/preferences/equipment concurrency token and 412/428/409 UX
- Explicit allergy/medical confirmation; opaque custom codes
- Equipment ordered replace and keyboard reorder
- Session-safe field refresh after save; adult-declaration policy unavailable default
- Locales `en` / `pt-BR` / `es`; keyboard; focus; 360/768/1280; 200% zoom; reduced motion
- Production isolation (no profile fixture fallback)
- Generated-client drift zero

### Excluded

- Changing PLAN-0020 product code during assessment (defects are reported, not fixed here)
- Inventing production terms/privacy version identifiers
- Live recommendation/home source integration (PLAN-0021)

## Substantial test-run target

Decision-ready Pass / Conditional Pass / Fail assessment against one pinned PLAN-0020 candidate SHA, with evidence under `docs/evidence/plan-0024/`.

## Acceptance criteria

- [ ] Candidate SHA pinned and environment manifest recorded
- [ ] Contract/mapping, concurrency, preference, equipment, session, a11y/i18n, and isolation gates executed
- [ ] Final assessment document states Pass, Conditional Pass, or Fail with justification
- [ ] Blocking findings filed or linked when Fail/Conditional Pass
- [ ] Assessment agent is independent of the PLAN-0020 implementation author

## Execution state

- **Current checkpoint:** Placeholder created during PLAN-0020 claim; not started.
- **Exact next action:** After PLAN-0020 publishes a stable candidate SHA, claim this plan on a new branch, pin the SUT, and execute the independent campaign.
- **Blockers:** PLAN-0020 candidate not yet finalized for independent validation.
- **Working tree state:** Draft placeholder only.

## Progress log

### 2026-08-03T00:00:00Z — PLAN-0020 claim

- **Checkpoint:** Independent validation placeholder registered as PLAN-0024.
- **Next action:** Wait for PLAN-0020 draft PR candidate SHA; then claim and execute.
