# PLAN-0025: Independently Retest PLAN-0020 Profile Remediation

- **Status:** Completed
- **Type:** Testing
- **Priority:** High
- **Owner:** Independent testing agent (PLAN-0025)
- **Created:** 2026-08-03
- **Last updated:** 2026-08-03T22:59:56Z
- **Branch:** `agent/plan-0025-retest-plan-0020-profile` (when claimed)
- **Pull request:** Not opened
- **System under test:** Draft [PR #35](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/35) / `agent/plan-0020-profile-frontend` @ `06bd95baacaabaa099170de1ba41187a8e885dea`
- **Predecessor evidence:** [PLAN-0024](PLAN-0024-independently-validate-plan-0020-profile-frontend.md) / [PR #36](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/36) — immutable **Fail** at `5733bb4de957b53469a28bc60c472a90f0955907` (evidence tip `b549a97ff91acc0236121556e8edc81fcea82156`)
- **Blocking issue:** [#37](https://github.com/RodrigoWantuk/WTK.Cocinaris/issues/37)
- **Related implementation plan:** [PLAN-0020](PLAN-0020-implement-profile-household-equipment-frontend.md)
- **Dependencies:** PLAN-0020 remediation candidate with exact-head Frontend + PLAN-0005 green (satisfied)

## Objective

Independently retest whether the PLAN-0020 remediation candidate closes every PLAN-0024 finding (F-0024-01…05) without regressing the accepted profile frontend contract, without modifying product behavior during assessment.

## Scope

### Must retest

- F-0024-01 fail-closed required numerics
- F-0024-02 dirty logout confirmation
- F-0024-03 equipment `stableCode` field-error focus
- F-0024-04 persistent accessible names
- F-0024-05 exact custom stable-code UUID shape
- All PLAN-0024 non-regression areas (workspace concurrency, progressive fields, preferences, equipment, session/route scope, unsaved Links/Back, post-save warnings, adult policy, locales, production isolation)
- Full frontend quality gates, browser smoke, Firefox native zoom, production isolation

### Excluded

- Rewriting PLAN-0024 historical Fail evidence
- Fixing defects during assessment (report only)
- Merging PR #35
- Approving or enabling auto-merge

## Acceptance criteria

- [ ] New candidate SHA pinned; environment manifest recorded
- [ ] Every F-0024-* finding retested with Pass or open residual classification
- [ ] Non-regression matrix executed
- [ ] Final assessment Pass / Conditional Pass / Fail with justification
- [ ] Assessor independent of the PLAN-0020 remediation author
- [ ] Issue #37 updated from retest outcome (close only on Pass with owner authority rules observed)

## Substantial test-run target

Decision-ready Pass / Conditional Pass / Fail against pinned SHA `06bd95baacaabaa099170de1ba41187a8e885dea`, with new evidence under `docs/evidence/plan-0025/` on a validation branch/PR. Do not mutate PLAN-0024 evidence.

## Exact-head CI on candidate (implementation agent — not a substitute for independent retest)

- Frontend (PR): https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30857947860
- PLAN-0005: https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30857947726

## Execution state

- **Current checkpoint:** Completed — **Pass** against immutable SUT `06bd95baacaabaa099170de1ba41187a8e885dea`. Validation evidence is on draft PR #38.
- **Exact next action:** Owner reviews PLAN-0025 evidence and PR #35; merge remains an owner-only action.
- **Blockers:** None.
- **Working tree state:** Validation branch contains only independent tests, plan/registry state, and evidence; no product behavior changed.


## Progress log

### 2026-08-03T22:25:00Z — Ready, pinned to remediation candidate

- **Checkpoint:** Ready. SUT `06bd95baacaabaa099170de1ba41187a8e885dea`. Predecessor PLAN-0024 Fail immutable.
- **Next action:** Independent agent begins PLAN-0025.
- **Blockers or handoff notes:** Do not reopen PLAN-0024; do not merge PR #35 from this plan.

### 2026-08-03T22:38:46Z — Claimed independent retest

- **Checkpoint:** PLAN-0025 is **In Progress** on `agent/plan-0025-retest-plan-0020-profile`. The SUT is fixed at `06bd95baacaabaa099170de1ba41187a8e885dea`; tests will run only from detached worktree `../WTK.Cocinaris-plan-0025-sut`. PR #35 is open and its current packaging head `8b3022b733120fd8c3e8be1f9e95ca5fa888b67b` differs only by the expected documentation files after the candidate.
- **Material changes:** Created the PLAN-0025 evidence package and recorded the claimed test environment; no product behavior or historical PLAN-0024 evidence changed.
- **Validation:** Verified remote refs, PR #35 state, candidate reachability, expected documentation-only delta, and the exact candidate CI workflow IDs `30857947860` and `30857947726` (Passed).
- **Next action:** Publish the claim as a draft validation PR, then execute the independent adversarial and regression campaign.
- **Blockers or handoff notes:** Unrelated untracked local build/smoke artifacts predate this claim and remain excluded from commits.

### 2026-08-03T22:59:56Z — Completed independent retest: Pass

- **Checkpoint:** **Pass**. F-0024-01 through F-0024-05 all passed against `06bd95b`; no P0/P1/P2/P3 regression was found.
- **Material changes:** Added an independent typechecked adversarial mapper/custom-code suite and complete PLAN-0025 evidence only. No product behavior, generated client, dependency, workflow, or PLAN-0024 evidence changed.
- **Validation:** Exact candidate CI identity; API-client generation/drift/typecheck/format; frontend typecheck/lint/format/full test; guards; default/prototype/production builds; production-bundle inspection; audit; Chromium smoke (28 scenarios); native Firefox 200% pointer/keyboard; workflow-equivalent PLAN-0005 P0 and P1 rounds all passed. See `docs/evidence/plan-0025/command-results.json`.
- **Failures or limitations:** An initial P0 attempt omitted Xvfb/Openbox and failed only the native Firefox setup; the exact workflow-equivalent rerun passed. No real assistive-technology session was performed or claimed.
- **Next action:** Close issue #37 with the linked retest evidence; PR #35 is eligible for owner review and merge, but remains draft and no agent performs approval, auto-merge, or merge.
- **Blockers or handoff notes:** Evidence is reproducible from the pinned detached SUT worktree; local generated test artifacts remain uncommitted.
