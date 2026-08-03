# PLAN-0024: Independently Validate PLAN-0020 Profile Frontend

- **Status:** Ready
- **Type:** Testing
- **Priority:** High
- **Owner:** Unassigned independent testing agent
- **Created:** 2026-08-03
- **Last updated:** 2026-08-03T02:20:00Z
- **Branch:** `agent/plan-0024-validate-plan-0020-profile` (when claimed)
- **Pull request:** Not opened
- **System under test:** Draft [PR #35](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/35) / `agent/plan-0020-profile-frontend` @ `f59606e3958d7db71cd6c7ff900d41111160c39c`
- **Related implementation plan:** [PLAN-0020](PLAN-0020-implement-profile-household-equipment-frontend.md)
- **Related plans:** PLAN-0012 (backend), PLAN-0016 (session/inventory frontend), PLAN-0005 (inventory validation baseline)
- **Dependencies:** PLAN-0020 remediation candidate green (Frontend `30778578106`, PLAN-0005 `30778578095`)

## Objective

Independently determine whether the PLAN-0020 production profile frontend satisfies the accepted profile contract, progressive-field semantics, shared concurrency, privacy, accessibility, and production-isolation requirements without modifying product behavior during assessment.

## Test basis

- `docs/product/audience-and-profile.md`
- `docs/plans/PLAN-0020-implement-profile-household-equipment-frontend.md` acceptance criteria and remediation scope
- PLAN-0012 backend contracts and OpenAPI `kitchenflow-v1.json` profile operations
- ADR-0004 identity/session and privacy/security docs
- `docs/testing/product-foundation-gates.md`
- Review baseline `a50152c` findings remediated on tip `6215b89` / CI tip `f59606e`

## Scope

### Included

- Absent profile scaffold (`profileExists: false`, no ETag) versus empty fields
- Section PATCH versus accidental PUT replacement
- Progressive field confirm/remove/default-not-silent-confirm
- Shared profile/preferences/equipment concurrency token and 412/428/409 UX
- Workspace consistency invariants and mutation-ready guards
- Explicit allergy/medical confirmation; opaque custom codes; note-as-label for custom entries
- Equipment ordered replace and keyboard reorder
- Session-safe field refresh after save; adult-declaration policy unavailable default
- ProfileProvider route scope (no profile fetch on home/inventory/access)
- Locales `en` / `pt-BR` / `es`; keyboard; focus; 360/768/1280; 200% zoom; reduced motion
- Production isolation (no profile fixture fallback)
- Generated-client drift zero
- Intercepted authenticated browser smoke scenarios

### Excluded

- Changing PLAN-0020 product code during assessment (defects are reported, not fixed here)
- Inventing production terms/privacy version identifiers
- Live recommendation/home source integration (PLAN-0021)

## Substantial test-run target

Decision-ready Pass / Conditional Pass / Fail assessment against pinned SHA `f59606e3958d7db71cd6c7ff900d41111160c39c`, with evidence under `docs/evidence/plan-0024/`.

## Acceptance criteria

- [ ] Candidate SHA pinned and environment manifest recorded
- [ ] Contract/mapping, concurrency, preference, equipment, session, a11y/i18n, and isolation gates executed
- [ ] Final assessment document states Pass, Conditional Pass, or Fail with justification
- [ ] Blocking findings filed or linked when Fail/Conditional Pass
- [ ] Assessment agent is independent of the PLAN-0020 implementation author

## Execution state

- **Current checkpoint:** Ready — pinned to remediation CI tip `f59606e3958d7db71cd6c7ff900d41111160c39c`.
- **Exact next action:** Independent testing agent claims the plan, creates branch from the pinned SHA (or reviews PR #35 at that tip), and executes the campaign.
- **Blockers:** None for claim.
- **Working tree state:** Ready placeholder.

## Progress log

### 2026-08-03T02:20:00Z — PLAN-0020 remediation complete

- **Checkpoint:** Pinned SUT `f59606e`; status **Ready**.
- **Next action:** Independent agent claim and execute.

### 2026-08-03T01:10:00Z — PLAN-0020 remediation reopen

- **Checkpoint:** Removed premature candidate pin references (`5efcfb8`). PLAN-0024 remained Draft/unpinned.
- **Next action:** Wait for remediation candidate.

### 2026-08-03T00:00:00Z — PLAN-0020 claim

- **Checkpoint:** Independent validation placeholder registered as PLAN-0024.
- **Next action:** Wait for PLAN-0020 draft PR candidate SHA; then claim and execute.
