# PLAN-0000: Test Plan Title

- **Status:** Draft
- **Type:** Testing
- **Priority:** Critical | High | Medium | Low
- **Owner:** Unassigned
- **Created:** YYYY-MM-DD
- **Last updated:** YYYY-MM-DDTHH:MM:SSZ
- **Branch:** `agent/plan-0000-test-short-scope`
- **Pull request:** Not opened
- **System under test:** Branch, pull request, commit, release, or environment
- **Related implementation plan:** None
- **Related issues:** None
- **Related ADRs:** None
- **Dependencies:** None

## Objective

Define the independent quality question this test plan must answer and the evidence required to answer it.

## Test basis

List the authoritative requirements, acceptance criteria, contracts, designs, ADRs, implementation plan, and known risks from which tests are derived.

Do not rely only on implementation descriptions. Verify expected behavior against product and architecture requirements.

## Scope

### Included

- Behavior, component, workflow, platform, locale, role, or failure mode to test.

### Excluded

- Explicitly excluded behavior and the reason.

## System-under-test baseline

- **Repository and branch:**
- **Commit or pull request:**
- **Environment:**
- **Configuration:**
- **External dependencies and versions:**
- **Test data revision:**
- **Known pre-existing defects:**

Do not start execution against an ambiguous or moving baseline without documenting how changes will be handled.

## Risk-based priorities

| Area or failure mode | Likelihood | Impact | Test priority | Rationale |
|---|---|---|---|---|
| Risk description | Low / Medium / High | Low / Medium / High | P0 / P1 / P2 / P3 | Rationale |

## Requirements traceability

| Requirement or acceptance criterion | Test case or evidence | Level | Status |
|---|---|---|---|
| Requirement link or identifier | Test identifier | Unit / Contract / Integration / E2E / Evaluation / Manual | Not Run |

Every applicable requirement must have evidence or a documented coverage gap.

## Test approach

Describe the strategy for relevant levels:

- unit and component verification;
- API and contract testing;
- persistence and integration testing;
- end-to-end user journeys;
- AI behavior evaluations;
- security and authorization testing;
- privacy and data-isolation testing;
- food-safety and allergy scenarios;
- localization and regionalization testing;
- accessibility testing;
- performance, load, and resilience testing;
- migration, backup, recovery, and rollback testing;
- exploratory and manual testing.

## Test environments and data

Describe required environments, services, accounts, roles, devices, browsers, locales, units, synthetic households, inventory states, fixtures, and provider simulations.

- Never use production personal data.
- Identify privacy-sensitive fixtures.
- Version AI evaluation datasets and recorded responses.
- Document environment limitations that reduce confidence.

## Test cases and execution checklist

### Area 1: Name

- [ ] **TEST-0000-001:** Test case and expected result.
- [ ] **TEST-0000-002:** Test case and expected result.

### Area 2: Name

- [ ] **TEST-0000-003:** Test case and expected result.

For complex test cases, link dedicated fixtures, scripts, specifications, or automated tests rather than expanding this file indefinitely.

## Defect handling

Record defects in issues when they require implementation work. Keep a concise execution summary here.

| Defect | Severity | Affected requirement | Status | Retest evidence |
|---|---|---|---|---|
| Issue link | Critical / High / Medium / Low | Requirement | Open | Not retested |

Distinguish:

- product defects;
- test defects;
- environment failures;
- expected behavior requiring clarification;
- accepted limitations.

## Entry criteria

- [ ] Test basis is available and sufficiently stable.
- [ ] System-under-test baseline is identified.
- [ ] Required environment and test data are available.
- [ ] Blocking implementation defects are understood.
- [ ] Safety-critical and authorization scenarios are prioritized.

## Exit criteria

- [ ] All P0 and P1 tests have a recorded result.
- [ ] Applicable acceptance criteria have evidence or an explicit coverage gap.
- [ ] Critical and high-severity defects are resolved or explicitly accepted by the owner.
- [ ] Required regression testing is complete.
- [ ] AI evaluation thresholds are satisfied when applicable.
- [ ] Security, privacy, food-safety, localization, and accessibility evidence is recorded when applicable.
- [ ] Known limitations and residual risks are documented.
- [ ] `docs/plan-status.md` matches the test plan state.

## Evidence summary

Link or summarize:

- automated test results;
- evaluation reports;
- screenshots or recordings when appropriate;
- logs and correlation identifiers with sensitive data removed;
- performance measurements;
- accessibility evidence;
- manual test notes;
- retest results.

## Execution state

This section must be updated before every agent-created commit.

- **Current checkpoint:** Test execution not started.
- **Last completed step:** None.
- **Exact next action:** Finalize the test basis and entry criteria.
- **Blockers:** None.
- **Tests executed:** None.
- **Defects found:** None.
- **Evidence produced:** None.
- **Known coverage gaps:** None.
- **Working tree state:** Clean | Uncommitted changes described below

## Progress log

Append one entry before every agent-created commit. Do not rewrite prior entries to hide failures, regressions, or environment limitations.

### YYYY-MM-DDTHH:MM:SSZ — Agent or contributor

- **Checkpoint:**
- **Tests or changes included in the commit:**
- **Evidence and validation:**
- **Defects or coverage gaps:**
- **Result:**
- **Next action:**
- **Blockers or handoff notes:**

## Final quality assessment

- **Outcome:** Pass | Conditional Pass | Fail | Inconclusive
- **Release or merge recommendation:**
- **Residual risk:**
- **Required follow-up:**

A test plan may be marked `Completed` with a failing outcome when execution is complete and the failure evidence is documented. Do not confuse completion of testing with approval of the product change.

## Completion and handoff checklist

- [ ] Test execution and evidence are complete or gaps are explicit.
- [ ] Defects are linked and classified.
- [ ] Requirements traceability is current.
- [ ] Final quality assessment is supported by evidence.
- [ ] Active plan and `docs/plan-status.md` match.
- [ ] Exact next action is recorded for unresolved defects or retesting.
- [ ] Pull request or implementation owner received the result.
- [ ] Branch-cleanup responsibility is recorded.
