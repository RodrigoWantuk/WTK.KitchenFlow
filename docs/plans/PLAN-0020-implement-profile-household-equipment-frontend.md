# PLAN-0020: Implement Profile, Household, Preferences, and Equipment Frontend

- **Status:** Completed
- **Type:** Implementation
- **Priority:** High
- **Owner:** Cursor agent (PLAN-0020 profile frontend remediation)
- **Created:** 2026-08-02
- **Last updated:** 2026-08-03T03:15:00Z
- **Branch:** `agent/plan-0020-profile-frontend`
- **Pull request:** [Draft PR #35](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/35)
- **Dependencies:** PLAN-0012 and PLAN-0016 merged; PLAN-0011 merged via PR #34 (`eb9e92c`); generated OpenAPI client available
- **Related product:** `docs/product/audience-and-profile.md`
- **Related backend:** `docs/plans/PLAN-0012-implement-profile-household-equipment-backend.md`
- **Related plans:** PLAN-0011 (merged), PLAN-0021 (live home), PLAN-0024 (independent validation — Draft until residual remediation candidate finalized)
- **Starting SHA:** `eb9e92c21ac817e497235168786daeb3f35c30cd`
- **Review baseline:** `a50152c78e872685b9f760db53c05984308174d8`

## Objective

Deliver a production frontend for the already implemented owner-scoped profile backend so an authenticated adult can review and edit household context, locale/timezone/measurement settings, cooking context, preferences/restrictions, equipment, and progressive completeness without exposing sensitive fields in session projections or inventing frontend authority.

## Residual remediation scope (PR #35 review baseline `9df4ec9`)

Against review baseline `9df4ec980c6de1d9d27454ac84499df0aa45ef8d` (major remediation accepted):

1. Route-level unsaved-changes coordinator protecting shell/brand/history navigation without page-local `GuardedLink` dependence.
2. Browser Back/Forward confirmation without reopen loops; clean history after save/cancel.
3. Explicit accessible `saveRefreshFailed` banner; reload does not clear the warning until success.
4. Separate `sessionRefreshWarning` when session refresh fails after a successful save.
5. Shared `canMutate` readiness across all profile pages; localized `workspace_not_ready` copy.
6. Authenticated intercepted browser coverage for shell/history/post-save/session-refresh residuals.

Prior CI tip `f59606e` / packaging `9df4ec9` are superseded by this residual remediation candidate once published.

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

Prior green tip `5efcfb8` / packaging `a50152c` are superseded by this remediation candidate once published.

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
- [x] Frontend and PLAN-0005 pass on the final published head.
- [x] PLAN-0024 pinned Ready after remediation candidate is stable.
- [x] Route-level unsaved-change coordination protects shell, brand, profile links, and history without prompt loops.
- [x] `saveRefreshFailed` and `sessionRefreshWarning` are visibly presented; `canMutate` is truthful on every page.
- [x] Residual authenticated browser scenarios pass; Frontend and PLAN-0005 green on the new candidate; PLAN-0024 repinned.

## Execution state

- **Current checkpoint:** Residual remediation **Completed**; exact-head CI green.
- **Review baseline (residual):** `9df4ec980c6de1d9d27454ac84499df0aa45ef8d`
- **Residual functional tip / CI tip:** `5733bb4de957b53469a28bc60c472a90f0955907`
- **Exact next action:** Owner review of draft PR #35; independent validation via PLAN-0024.
- **Blockers:** None.
- **Working tree state:** Completion packaging may advance PR head.


## Progress log

### 2026-08-03T03:15:00Z — Cursor agent (PLAN-0020 residual remediation complete)

- **Checkpoint:** Exact-head Frontend `30780915229` + PLAN-0005 `30780915260` Passed on `5733bb4`; PLAN-0020 **Completed**; PLAN-0024 Ready and pinned.
- **Changes included in the commit:** Plan/registry/evidence completion; PLAN-0024 Ready pin; PR body reconciliation.
- **Validation performed:** Frontend + PLAN-0005 green on published tip `5733bb4de957b53469a28bc60c472a90f0955907`. Draft, MERGEABLE, reviewer `RodrigoWantuk`.
- **Next action:** Owner review; PLAN-0024 independent validation may begin.
- **Blockers or handoff notes:** No agent merge.

### 2026-08-03T03:20:00Z — Cursor agent (PLAN-0020 residual remediation)

- **Checkpoint:** Route-level unsaved coordinator, shell/history protection, saveRefreshFailed/sessionRefreshWarning/canMutate, intercepted browser residuals Implemented and locally validated.
- **Changes included in the commit:** `createBrowserRouter` + `UnsavedChangesCoordinatorProvider`; ProfileProvider soft session refresh; page `canMutate` wiring; i18n; smoke residuals; plan/registry/docs.
- **Validation performed:** typecheck/lint/format/test (323+)/guards/builds/api-client/smoke:browser:ci Passed locally.
- **Next action:** Push; exact-head CI; Complete + Ready PLAN-0024 when green.
- **Blockers or handoff notes:** Keep draft; no agent merge.

### 2026-08-03T03:00:00Z — Cursor agent (PLAN-0020 residual remediation reopen)

- **Checkpoint:** Restored **In Progress**; PLAN-0024 returned to Draft/unpinned; residual navigation and post-save UX remediation underway.
- **Changes included in the commit:** Plan/registry restore + route-level unsaved coordinator (`useBlocker` via `createBrowserRouter`), shell/history protection, `saveRefreshFailed`/`sessionRefreshWarning`/`canMutate`, page wiring, intercepted browser residuals, docs.
- **Validation performed:** Pending full local gates in this run.
- **Next action:** Validate, push, exact-head CI; then Complete and Ready PLAN-0024.
- **Blockers or handoff notes:** Keep draft; no agent merge. Prior candidate `f59606e`/`9df4ec9` superseded.

### 2026-08-03T02:20:00Z — Cursor agent (PLAN-0020 remediation complete)

- **Checkpoint:** Exact-head Frontend `30778578106` + PLAN-0005 `30778578095` Passed on `f59606e`; PLAN-0020 **Completed**; PLAN-0024 Ready and pinned.
- **Changes included in the commit:** Plan/registry/evidence completion; PLAN-0024 Ready pin; PR body reconciliation.
- **Validation performed:** Frontend + PLAN-0005 green on published tip `f59606e3958d7db71cd6c7ff900d41111160c39c`. Draft, MERGEABLE, reviewer `RodrigoWantuk`.
- **Next action:** Owner review; PLAN-0024 independent validation may begin.
- **Blockers or handoff notes:** No agent merge.

### 2026-08-03T02:10:00Z — Cursor agent (PLAN-0020 remediation)

- **Checkpoint:** R1–R12 remediations complete locally; smoke including intercepted authenticated profile Passed.
- **Changes included in the commit:** Workspace invariants + mutation guard; durability split; controlled codes/controls; numeric validation; field errors; custom prefs; Radix sensitive/unsaved dialogs; ProfileProvider scoped to `/app/perfil*`; overview/adult policy; equipment harden; intercepted browser smoke; docs.
- **Validation performed:** typecheck/lint/format/test (314)/guards/builds/isolation/api-client/smoke:browser:ci Passed.
- **Next action:** Push; exact-head Frontend + PLAN-0005; mark Completed + Ready PLAN-0024 when green.
- **Blockers or handoff notes:** Keep draft; no agent merge.

### 2026-08-03T01:10:00Z — Cursor agent (PLAN-0020 remediation reopen)

- **Checkpoint:** Restored **In Progress**; review baseline `a50152c`; remediation R1–R12 implemented locally (pending commit/validation).
- **Changes included in the commit:** Plan/registry restore + remediation implementation (see subsequent commits).
- **Validation performed:** Host `NOTEBOOK-DEB-RODRIGO`; branch synced to review baseline; core provider/mapper tests Passed during remediation.
- **Next action:** Commit remediations; full local gates; push draft PR #35; exact-head CI.
- **Blockers or handoff notes:** Keep draft; PLAN-0024 remains Draft unpinned until remediation candidate finalized.


### 2026-08-03T00:35:00Z — Cursor agent (PLAN-0020 completion)

- **Checkpoint:** Frontend `30774513344` + PLAN-0005 `30774513343` Passed on `5efcfb8`; PLAN-0020 returned to **Completed** (later reopened for remediation).
- **Validation performed:** Exact-head CI on `5efcfb8`; packaging tip `a50152c` also green after PLAN-0005 p0 flake rerun.
- **Next action:** Owner review — superseded by remediation assignment.
- **Blockers or handoff notes:** Historical tip only; not acceptance-ready per review findings.
