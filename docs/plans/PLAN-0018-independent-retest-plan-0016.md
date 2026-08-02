# PLAN-0018: Independently Retest PLAN-0016 Authenticated Inventory Remediations

- **Status:** In Progress
- **Type:** Testing
- **Priority:** Critical
- **Owner:** agent:independent-retest-plan-0018
- **Created:** 2026-08-02
- **Last updated:** 2026-08-02T02:45:00Z
- **Branch:** `agent/plan-0018-independent-retest-plan-0016`
- **Pull request:** (pending)
- **System under test:** Draft PR #25 / `agent/plan-0016-production-inventory-frontend` @ `814af253814d0ec7f8b0adbbca9c50040b5bab07`
- **Base at PLAN-0016 start:** `60d98dd9e2e7c460d670e701c027a44f25cdfedc`
- **Related plans:** PLAN-0005 (Conditional Pass), PLAN-0016 (Validating), PLAN-0011 (Blocked)
- **Related issues:** #20, #21, #22, #24
- **Plan ID collision:** Draft PR #23 also uses “PLAN-0016” for unrelated AI recipe docs. Leave PR #23 untouched. PLAN-0017 remains reserved for future renumbering of PR #23. This plan uses **PLAN-0018** only.

## Objective

Independently determine whether the PLAN-0016 remediation candidate at the pinned SHA resolves residual PLAN-0005 findings and related authentication/inventory requirements, without modifying production behavior.

Possible outcomes: **Pass** | **Conditional Pass** | **Fail** | **Inconclusive**. Do not predetermine the result.

## Independence restrictions

Permitted changes only:

- PLAN-0018 documentation and registry rows;
- test-only automation and fixtures (synthetic data);
- environment manifests;
- sanitized evidence under `docs/evidence/plan-0018/`;
- requirements traceability and reports;
- issue/PR evidence comments and non-approving reviews on PR #25.

Do **not** fix defects found during the retest. Do **not** weaken tests to obtain a pass.

## System under test pin

| Item | Value |
|---|---|
| PR | [#25](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/25) |
| Branch | `agent/plan-0016-production-inventory-frontend` |
| Exact SHA | `814af253814d0ec7f8b0adbbca9c50040b5bab07` |
| PLAN-0016 prior “final candidate” note | `aab6162` (docs-only delta to `814af25`; workflows green) |
| Authoritative Frontend CI on tip | [30728413882](https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30728413882) (`quality` + `browser-smoke` success) |
| PLAN-0005 validation workflow on tip | [30728413915](https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30728413915) |
| Stale CI ID not to cite as current-head | `30728412465` |

Independent local gate execution is still mandatory; CI is baseline context only.

## Scope

### Included

- Generated client determinism and drift.
- Frontend quality gates from a clean checkout of the pinned SHA.
- Production-equivalent env: Release API, PostgreSQL, Keycloak, production FE, same-origin topology.
- Real Keycloak auth/session/logout/token absence.
- Complete production inventory journey (create/list/filter/detail/adjust/delete/history).
- CSRF, ETag 412, missing If-Match 428, idempotency.
- Two-user isolation.
- Locale decimals and printed calendar dates.
- Firefox native ~200% zoom pointer **and** keyboard for #21/#22 (independent scores).
- Production isolation (no mock/prototype auth in production inventory path).

### Excluded

- Modifying PLAN-0016 product code.
- Starting PLAN-0011.
- Touching PR #23 / introducing PLAN-0017.
- Claiming Pass without mandatory phases.
- Owner merge or issue closure without owner instruction.

## Acceptance criteria

- [ ] Phase 1 clean source + generated client + frontend gates recorded with exit codes on pinned SHA.
- [ ] Environment manifest committed (sanitized).
- [ ] Authentication/session real Keycloak results recorded.
- [ ] Production inventory journey results recorded.
- [ ] Concurrency/idempotency/CSRF results recorded.
- [ ] Two-user isolation results recorded.
- [ ] Locale/date results recorded.
- [ ] Firefox native-zoom pointer and keyboard results recorded for #21 and #22.
- [ ] Production isolation results recorded.
- [ ] `docs/evidence/plan-0018/final-assessment.md` states Pass | Conditional Pass | Fail | Inconclusive with justification.
- [ ] Draft PR targeting `agent/plan-0016-production-inventory-frontend` opened with evidence only.
- [ ] Non-approving review left on PR #25 linking PLAN-0018 evidence.
- [ ] PLAN-0005 / PLAN-0016 / PLAN-0011 statuses updated only according to outcome rules.

## Evidence package

`docs/evidence/plan-0018/` — see directory contents after execution.

## Execution state

- **Current run delivery target:** Decision-ready independent assessment of PLAN-0016 tip `814af25`.
- **Current checkpoint:** Branch created from pinned SHA; plan registration underway; Phase 1 starting.
- **Exact next action:** Commit plan/registry; run Phase 1 gates; construct integrated environment; execute Phases 3–9; write final assessment; open Draft PR; review #25.
- **Blockers:** None known yet.
- **Working tree state:** Dirty with PLAN-0018 docs (untracked) plus ignored local frontend build artifacts from prior work.

## Progress log

### 2026-08-02T02:45:00Z — agent:independent-retest-plan-0018

- **Checkpoint:** PLAN-0018 created; branch `agent/plan-0018-independent-retest-plan-0016` from `814af25`; PR #25 head verified unchanged.
- **Changes:** Plan file + registry row (this commit).
- **Result:** Ready to execute Phase 1.
- **Next action:** Independent gate suite + environment construction.
- **Notes:** PR #23 untouched; PLAN-0017 unused.
