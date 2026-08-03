# PLAN-0020: Implement Profile, Household, Preferences, and Equipment Frontend

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** High
- **Owner:** Cursor agent (PLAN-0020 profile frontend remediation)
- **Created:** 2026-08-02
- **Last updated:** 2026-08-03T01:10:00Z
- **Branch:** `agent/plan-0020-profile-frontend`
- **Pull request:** [Draft PR #35](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/35)
- **Dependencies:** PLAN-0012 and PLAN-0016 merged; PLAN-0011 merged via PR #34 (`eb9e92c`); generated OpenAPI client available
- **Related product:** `docs/product/audience-and-profile.md`
- **Related backend:** `docs/plans/PLAN-0012-implement-profile-household-equipment-backend.md`
- **Related plans:** PLAN-0011 (merged), PLAN-0021 (live home), PLAN-0024 (independent validation — Draft until remediation candidate finalized)
- **Starting SHA:** `eb9e92c21ac817e497235168786daeb3f35c30cd`
- **Review baseline:** `a50152c78e872685b9f760db53c05984308174d8`

## Objective

Deliver a production frontend for the already implemented owner-scoped profile backend so an authenticated adult can review and edit household context, locale/timezone/measurement settings, cooking context, preferences/restrictions, equipment, and progressive completeness without exposing sensitive fields in session projections or inventing frontend authority.

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

- [ ] Workspace presence/version/ETag invariants fail closed; mutation impossible outside ready consistent workspace.
- [ ] Post-mutation reload failure blocks subsequent writes without misreporting the save.
- [ ] Write durability permits only durable; controlled fields use localized typed options.
- [ ] Invalid numeric input is never converted to zero; field errors reach accessible controls.
- [ ] Custom preference labels round-trip; allergy/medical use accessible modal.
- [ ] Unsaved changes protected; ProfileProvider scoped to profile routes.
- [ ] Overview uses completeness section data and adult policy truthfully.
- [ ] Equipment validation and keyboard behavior complete.
- [ ] Authenticated profile browser scenarios pass (intercepted harness).
- [ ] Locales complete; production isolation; generated client drift zero.
- [ ] Frontend and PLAN-0005 pass on the final published head.
- [ ] PLAN-0024 pinned Ready only after remediation candidate is stable.

## Execution state

- **Current checkpoint:** Remediation R1–R12 implemented; local gates Passed; ready to push.
- **Review baseline:** `a50152c78e872685b9f760db53c05984308174d8`
- **Remediation functional tip:** 
- **Exact next action:** Commit; push draft PR #35; await exact-head CI; pin PLAN-0024 when green.
- **Blockers:** Local Firefox zoom relies on PLAN-0005 CI.
- **Working tree state:** Ready to commit remediations.

## Progress log

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
