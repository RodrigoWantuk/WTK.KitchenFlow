# PLAN-0027 findings

Immutable SUT: `9bff2e130afb4a0f31ea0b84925362f546d1179e`

## Historical finding retest

| Historical ID | Severity | Retest status |
|---|---|---|
| F-0026-01 | P1 | **Passed** |
| F-0026-02 | P1 | **Passed** |
| F-0026-03 | P2 | **Passed** |

## New findings

| ID | Severity | Status | Title |
|---|---|---|---|
| F-0027-01 | P3 | Open | PLAN-0023 handoff attributes historical workflow IDs to the replacement candidate |

---

## F-0027-01

- **Finding ID:** F-0027-01
- **Severity:** P3
- **Status:** Open
- **Requirement:** Implementation evidence must attribute exact-head workflow IDs to the correct SHA.
- **Affected SHA:** Packaging evidence on `d928752f746030bfd735f84d5b15239562923092` (docs only; SUT identity unaffected)
- **Environment:** repository docs inspection
- **Preconditions:** Read `docs/evidence/plan-0023/handoff.md`
- **Exact reproduction:** Later paragraph states runs `30964375294`, `30964372594`, `30964375347`, `30964375297` “passed for the replacement candidate,” while those runs belong to historical Fail SUT `7e24fa2`. Correct replacement workflows are `31013020164`, `31013020163`, `31013020245`.
- **Expected result:** Evidence cites workflows whose `headSha` matches the pinned candidate.
- **Actual result:** Stale wording remains; earlier paragraph correctly cites `31013020164`/`31013020163`/`31013020245`.
- **Evidence paths:** `docs/evidence/plan-0023/handoff.md`; GitHub Actions run metadata independently verified
- **Security/privacy impact:** None
- **Suggested remediation boundary:** Edit PLAN-0023 handoff/evidence wording only (no product change)
- **Retest requirement:** Confirm wording cites correct SHA-bound workflow IDs before final PR #39 merge

No P0/P1/P2 product findings.

## Owner resolution after independent assessment

F-0027-01 was resolved after PLAN-0027 incorporation by correcting
`docs/evidence/plan-0023/handoff.md`. The original finding remains part of the
immutable assessment history. No product behavior was changed.
