# PLAN-0007 Amendment — Lean Risk-Based Validation (2026-08-05)

- **Status:** Accepted
- **Type:** Documentation amendment
- **Parent plan:** [`PLAN-0007`](PLAN-0007-strengthen-agent-delivery-standards.md)
- **Created:** 2026-08-05
- **Stakeholder authorization:** Owner instruction to adopt lean risk-based validation after PLAN-0023 merge (PR #39)
- **Related surfaces:** `AGENTS.md`, `docs/testing/strategy.md`, `docs/testing/product-foundation-gates.md`, `docs/plans/README.md`

## Objective

Replace routine heavyweight validation ceremonies with a lean, risk-based default that preserves safety for high-impact changes without requiring separate testing plans, candidate/packaging SHA rituals, or repeated full-suite retests for ordinary work.

## Why this amendment exists

After PLAN-0023 delivery, repeated candidate, packaging-head, independent validation, and retest cycles consumed disproportionate time relative to residual risk for most changes. Stakeholder direction is to keep substantial delivery and truthful documentation, while making normal validation proportional to the files and risks actually changed.

## Default standard validation

For normal implementation, research, documentation, and contract work, require only:

1. targeted unit tests for changed deterministic behavior;
2. one focused integration or contract test when a real boundary changes;
3. format/build/typecheck for affected projects;
4. one final CI execution on the PR head.

Do **not** require by default:

- a separate testing plan;
- an independent testing agent;
- an additional validation PR;
- duplicated evidence packages;
- candidate and packaging SHA ceremonies;
- repeated full backend and frontend suites after documentation-only commits;
- repeated test execution without a specific risk hypothesis.

## Test only affected areas

| Change class | Default validation |
|---|---|
| Backend-only | Targeted backend tests + backend CI |
| Frontend-only | Targeted frontend tests + frontend CI |
| Contract change | Contract generation/drift check + affected consumer build |
| Documentation-only | Documentation/link/evidence consistency checks only |
| AI schema/fixture change | Deterministic schema/fixture validators + focused contract drift check |

Complete backend and frontend matrices are not mandatory for every small change when unrelated areas were not affected.

## Repetition policy

| Situation | Executions |
|---|---|
| Default deterministic behavior | One execution |
| Suspected flaky behavior | Up to 3 executions |
| Concurrency or idempotency changes | 5 to 10 focused synchronized executions |
| Beyond 10 repetitions | Requires a documented, reproduced race or an explicit owner request |

Do not use 50-iteration tests as a routine standard.

## Independent validation

Independent validation is **not** required by default.

Reserve it for concrete high-impact risk, such as:

- cross-user authorization or data exposure;
- destructive or irreversible migrations;
- payment or financial accounting;
- production credential handling;
- confirmed concurrency corruption;
- data-loss recovery;
- critical food-safety enforcement.

Even for elevated-risk work, use one focused independent review rather than a chain of validation and retest plans unless a real blocking defect is found.

## Final-head rule

Agents should complete implementation, tests, and documentation before the final push.

Run CI once on that final head.

After CI passes, record run IDs in the PR description or comment. Do **not** create another documentation-only commit solely to record successful workflow IDs.

## Relationship to PLAN-0007

This amendment does not weaken:

- complete durable and code-level documentation;
- substantial coherent delivery per run;
- truthful plan/registry updates;
- architecture, security, privacy, or food-safety boundaries;
- owner-only merge authority.

It narrows only the default validation ceremony and repetition expectations.

## Adoption

This amendment is effective immediately for new agent work, including PLAN-0022. Historical evidence packages and prior independent validation plans remain immutable records; they are not rewritten.
