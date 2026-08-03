# PLAN-0020: Implement Profile, Household, Preferences, and Equipment Frontend

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** High
- **Owner:** PLAN-0020 remediation agent
- **Created:** 2026-08-02
- **Last updated:** 2026-08-03T22:02:03Z
- **Branch:** `agent/plan-0020-profile-frontend`
- **Pull request:** [Draft PR #35](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/35)
- **Dependencies:** PLAN-0012 and PLAN-0016 merged; PLAN-0011 merged via PR #34 (`eb9e92c`); generated OpenAPI client available
- **Related product:** `docs/product/audience-and-profile.md`
- **Related backend:** `docs/plans/PLAN-0012-implement-profile-household-equipment-backend.md`
- **Related plans:** PLAN-0011 (merged), PLAN-0021 (live home), PLAN-0024 (**Completed — Fail** at `5733bb4`, evidence PR #36), PLAN-0025 (successor independent retest — after remediation candidate)
- **Starting SHA:** `eb9e92c21ac817e497235168786daeb3f35c30cd`
- **Review baseline:** `a50152c78e872685b9f760db53c05984308174d8`
- **Failed independent SUT:** `5733bb4de957b53469a28bc60c472a90f0955907`
- **Independent validation:** PLAN-0024 / [PR #36](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/36) @ `b549a97ff91acc0236121556e8edc81fcea82156` — **Fail**
- **Blocking issue:** [#37](https://github.com/RodrigoWantuk/WTK.Cocinaris/issues/37)

## Objective

Deliver a production frontend for the already implemented owner-scoped profile backend so an authenticated adult can review and edit household context, locale/timezone/measurement settings, cooking context, preferences/restrictions, equipment, and progressive completeness without exposing sensitive fields in session projections or inventing frontend authority.

## PLAN-0024 remediation scope (issue #37)

Immutable Fail against SUT `5733bb4`. Remediate without rewriting PLAN-0024 evidence:

1. **F-0024-01 (P1)** — Fail closed on malformed required numerics (`sortOrder`, completeness counters/percentage/sectionCounts); optional capacity stays nullable.
2. **F-0024-02 (P1)** — Route logout through unsaved-changes coordinator when a profile editor is dirty.
3. **F-0024-03 (P2)** — Map equipment `entries[i].stableCode` field errors to a real focusable entry target with localized copy.
4. **F-0024-04 (P2)** — Persistent accessible names (not placeholder-only) on Preferences/Equipment controls.
5. **F-0024-05 (P3)** — `isCustomStableCode` matches exact minted `custom_<uuid-v4>` shape.

## Residual remediation scope (PR #35 review baseline `9df4ec9`)

Against review baseline `9df4ec980c6de1d9d27454ac84499df0aa45ef8d` (major remediation accepted):

1. Route-level unsaved-changes coordinator protecting shell/brand/history navigation without page-local `GuardedLink` dependence.
2. Browser Back/Forward confirmation without reopen loops; clean history after save/cancel.
3. Explicit accessible `saveRefreshFailed` banner; reload does not clear the warning until success.
4. Separate `sessionRefreshWarning` when session refresh fails after a successful save.
5. Shared `canMutate` readiness across all profile pages; localized `workspace_not_ready` copy.
6. Authenticated intercepted browser coverage for shell/history/post-save/session-refresh residuals.

Prior CI tip `f59606e` / packaging `9df4ec9` are superseded. Tip `5733bb4` is the immutable PLAN-0024 Fail SUT.

## Remediation scope (PR #35 review)

Against review baseline `a50152c`:

1. Complete workspace presence/version/ETag consistency (fail closed; mutation guard; post-save refresh failure).
2. Separate read durability (`durable`|`temporary`) from write durability (`durable` only).
3. Typed localized controls for closed enum fields.
4. Stop coercing invalid numeric input to zero; capacity validation.
5. Surface Problem Details field errors accessibly.
6. Custom preference semantics (`note` as label for `custom_*`).
7. Accessible Radix sensitive confirmation dialog.
8. Unsaved-change protection with accessible confirm.
9. Restrict `ProfileProvider` to `/app/perfil*` only.
10. Overview completeness projection + truthful adult policy presentation.
11. Harden equipment editing (validation, focus, live region).
12. Authenticated browser coverage via Playwright interception.

## Acceptance criteria

- [x] Workspace presence/version/ETag invariants fail closed; mutation impossible outside ready consistent workspace.
- [x] Post-mutation reload failure blocks subsequent writes without misreporting the save.
- [x] Write durability permits only durable; controlled fields use localized typed options.
- [x] Invalid numeric input is never converted to zero; field errors reach accessible controls.
- [x] Custom preference labels round-trip; allergy/medical use accessible modal.
- [x] Unsaved changes protected; ProfileProvider scoped to profile routes.
- [x] Overview uses completeness section data and adult policy truthfully.
- [x] Equipment validation and keyboard behavior complete.
- [x] Authenticated profile browser scenarios pass (intercepted harness).
- [x] Locales complete; production isolation; generated client drift zero.
- [ ] F-0024-01 through F-0024-05 remediated with canonical regression tests.
- [ ] Frontend and PLAN-0005 pass on the new remediation candidate.
- [ ] PLAN-0025 Ready and pinned; PLAN-0024 remains immutable Completed/Fail.
- [ ] Issue #37 updated (remediated, awaiting independent retest) but not closed by this agent.

## Execution state

- **Current checkpoint:** Reopened **In Progress** after PLAN-0024 Fail. Remediation of F-0024-01…05 underway on PR #35.
- **Failed SUT:** `5733bb4de957b53469a28bc60c472a90f0955907`
- **Evidence:** PR #36 @ `b549a97ff91acc0236121556e8edc81fcea82156`
- **Exact next action:** Implement fail-closed numeric mapping, protected logout, equipment error focus, accessible names, and strict custom stable codes; then gates + PLAN-0025.
- **Blockers:** Independent validation Fail (#37) until remediations land and PLAN-0025 retests.
- **Working tree state:** Docs reopen commit pending; product remediations next.


## Progress log

### 2026-08-03T22:02:03Z — Reopen after PLAN-0024 Fail

- **Checkpoint:** PLAN-0020 **In Progress**. Recorded immutable Fail SUT `5733bb4`, evidence PR #36 / tip `b549a97`, issue #37, findings F-0024-01…05. PR #35 remains draft.
- **Next action:** Functional remediation of all five findings.
- **Blockers or handoff notes:** Do not rewrite PLAN-0024 evidence; do not merge.

### 2026-08-03T03:15:00Z — Cursor agent (PLAN-0020 residual remediation complete)

- **Checkpoint:** Exact-head Frontend `30780915229` + PLAN-0005 `30780915260` Passed on `5733bb4`; PLAN-0020 **Completed**; PLAN-0024 Ready and pinned.
- **Changes included in the commit:** Plan/registry/evidence completion; PLAN-0024 Ready pin; PR body reconciliation.
- **Validation performed:** Frontend + PLAN-0005 green on published tip `5733bb4de957b53469a28bc60c472a90f0955907`. Draft, MERGEABLE, reviewer `RodrigoWantuk`.
- **Next action:** Owner review; PLAN-0024 independent validation may begin.
- **Blockers or handoff notes:** No agent merge. **Superseded by PLAN-0024 Fail.**

### 2026-08-03T03:20:00Z — Cursor agent (PLAN-0020 residual remediation)

- **Checkpoint:** Route-level unsaved coordinator, shell/history protection, saveRefreshFailed/sessionRefreshWarning/canMutate, intercepted browser residuals Implemented and locally validated.
- **Changes included in the commit:** `createBrowserRouter` + `UnsavedChangesCoordinatorProvider`; ProfileProvider soft session refresh; page `canMutate` wiring; i18n; smoke residuals; plan/registry/docs.
- **Validation performed:** typecheck/lint/format/test (323+)/guards/builds/api-client/smoke:browser:ci Passed locally.
- **Next action:** Push; exact-head CI; Complete + Ready PLAN-0024 when green.
- **Blockers or handoff notes:** Keep draft; no agent merge.
