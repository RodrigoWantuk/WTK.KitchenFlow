# PLAN-0025: Independently Retest PLAN-0020 Profile Remediation

- **Status:** Ready
- **Type:** Testing
- **Priority:** High
- **Owner:** Unassigned independent testing agent
- **Created:** 2026-08-03
- **Last updated:** 2026-08-03T22:25:00Z
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

- **Current checkpoint:** Ready. Candidate pinned to `06bd95b` after green exact-head Frontend + PLAN-0005.
- **Exact next action:** Independent testing agent claims this plan, creates `agent/plan-0025-retest-plan-0020-profile`, and retests F-0024-01…05 plus non-regression matrix against the pinned SHA.
- **Blockers:** None for starting independent retest.
- **Working tree state:** Placeholder Ready on implementation branch; validation work must use a separate branch.


## Progress log

### 2026-08-03T22:25:00Z — Ready, pinned to remediation candidate

- **Checkpoint:** Ready. SUT `06bd95baacaabaa099170de1ba41187a8e885dea`. Predecessor PLAN-0024 Fail immutable.
- **Next action:** Independent agent begins PLAN-0025.
- **Blockers or handoff notes:** Do not reopen PLAN-0024; do not merge PR #35 from this plan.
