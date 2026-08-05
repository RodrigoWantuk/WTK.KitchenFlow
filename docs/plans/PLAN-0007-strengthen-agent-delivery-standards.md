# PLAN-0007: Strengthen Agent Documentation and Delivery Standards

- **Status:** Completed
- **Type:** Documentation
- **Priority:** High
- **Owner:** AI governance agent
- **Created:** 2026-07-29
- **Completed:** 2026-07-29
- **Last updated:** 2026-07-29T02:20:00Z
- **Branch:** `agent/plan-0007-strengthen-agent-delivery-standards`
- **Pull request:** [#8](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/8)
- **Related issues:** None
- **Related ADRs:** None
- **Dependencies:** PLAN-0006 merged through PR #7

## Objective

Make two stakeholder requirements mandatory and unambiguous for every AI agent and contributor:

1. every delivery includes complete durable and code-level documentation, including appropriate code comments and XML documentation;
2. every execution run aims for a substantial, coherent delivery rather than stopping after trivial scaffolding or a micro-change when no real blocker exists.

The rules must increase delivery depth without encouraging noisy comments, undocumented exceptions, scope creep, giant unreviewable commits, skipped validation, or false completion claims.

## Delivered scope

The plan updated all governance surfaces that shape agent behavior:

- `AGENTS.md`;
- `CONTRIBUTING.md`;
- `docs/plans/README.md`;
- `docs/plans/0000-plan-template.md`;
- `docs/plans/0000-test-plan-template.md`;
- `.github/pull_request_template.md`;
- `docs/plan-status.md`.

It also reconciled PLAN-0006 as merged through PR #7 and removed the obsolete PR #7 merge blocker from PLAN-0004.

No executable code, product behavior, architecture, contract, dependency, migration, infrastructure resource, credential, or production configuration changed.

## Accepted documentation standard

- Full documentation is part of implementation, testing, research, documentation, infrastructure, security, AI, and operations deliveries.
- Documentation changes are delivered in the same pull request as the behavior or decision they describe.
- Applicable documentation covers product behavior, domain invariants, architecture, ADRs, APIs, events, schemas, prompts, contracts, configuration, migrations, deployment, observability, runbooks, backup/restore, security, privacy, food safety, AI cost, localization, accessibility, performance, resilience, testing, limitations, and handoff.
- New or materially changed project-owned public and protected .NET types and members require accurate XML documentation.
- Non-obvious internal .NET contracts require XML documentation or equivalent durable explanation when domain, security, ownership, concurrency, lifecycle, idempotency, performance, or failure semantics matter.
- New .NET project foundations must enable XML documentation output and repository-scoped missing-documentation enforcement for project-owned public APIs.
- Exported reusable TypeScript components, hooks, functions, classes, types, adapters, and utilities require TSDoc/JSDoc when their contract or side effects are not self-evident.
- Inline comments explain rationale, invariants, hazards, protocols, security boundaries, concurrency, idempotency, compatibility, performance tradeoffs, or intentionally unusual behavior.
- Comments that merely narrate syntax, duplicate clear names, add filler, preserve commented-out code, or become stale are rejected.
- Generated code is documented at its source schema or generator boundary.
- Documentation exceptions must be explicit, narrow, justified in the active plan, and visible in review.

## Accepted substantial-delivery standard

- Each execution run declares a substantial delivery target before implementation begins.
- Unless blocked, an agent completes the largest coherent plan phase, vertical slice, test campaign, research result, documentation package, or operational outcome that can be safely implemented, documented, tested, and validated.
- Reading, planning, scaffolding, one isolated DTO/entity/endpoint/component/migration/test shell, placeholder tests, status-only changes, or comment-only changes are not sufficient run outcomes when safe continuation is possible.
- A substantial run normally includes the applicable implementation, tests, documentation, contracts, migrations, validation, and handoff evidence.
- Delivery size is measured by coherent outcome and resolved acceptance criteria, not line count, file count, commit count, or elapsed time.
- Multiple cohesive and reviewable commits are expected when appropriate; a large delivery does not mean one giant commit.
- Delivery depth never overrides plan scope, architecture boundaries, security, reviewability, tests, documentation, or truthful status reporting.
- Valid early-stop conditions are a real external blocker, required stakeholder decision, unsafe uncertainty, environment/tool failure, conflicting concurrent work, exhausted execution capacity, or a required plan revision.
- Early stops record the exact cause, completed work, validation, remaining work, and immediately executable next action.

## Execution phases

### Phase 1: Define the standard

- [x] Translate stakeholder requirements into precise documentation and delivery-depth rules.
- [x] Preserve reviewability, bounded scope, truthful validation, and safe stop conditions.
- [x] Define .NET XML documentation, TypeScript documentation, and inline-comment expectations.

### Phase 2: Apply the standard

- [x] Update agent rules.
- [x] Update contributor guidance.
- [x] Update plan lifecycle guidance.
- [x] Update implementation/research/documentation/operations plan template.
- [x] Update independent test-plan template.
- [x] Update pull-request evidence template.
- [x] Reconcile the central plan registry.

### Phase 3: Validate and deliver

- [x] Review all changed guidance for contradictions and duplicated rules.
- [x] Confirm no executable source or product scope changed.
- [x] Confirm plan and registry synchronization.
- [x] Open PR #8.
- [x] Mark PLAN-0007 completed while tracking delivery separately.

## Validation performed

- Compared `agent/plan-0007-strengthen-agent-delivery-standards` against `main`.
- Confirmed the branch was one commit ahead and zero commits behind before PR creation.
- Reviewed all eight changed files.
- Confirmed every change is Markdown governance or template content.
- Confirmed documentation requirements cover durable docs, XML documentation, TypeScript documentation, rationale-focused comments, generated-code boundaries, and stale-comment removal.
- Confirmed “substantial delivery” is defined by a coherent validated outcome rather than raw diff size.
- Confirmed multiple cohesive commits remain compatible with the rule.
- Confirmed scope limits, architecture, security, reviewability, tests, and truthful handoffs remain mandatory.
- Confirmed valid stop conditions are explicit.
- Confirmed PLAN-0003 and PLAN-0004 implementation scope is unchanged.
- Confirmed PLAN-0006 delivery is reconciled as merged and PLAN-0004 no longer depends on PR #7 merge.

No executable tests were applicable because no executable code changed.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Agents add comments to every obvious line | Require rationale-focused comments and reject syntax narration |
| XML documentation becomes generic filler | Require accurate contracts, parameters, returns, exceptions, ownership, units, side effects, and failure semantics |
| “Large delivery” causes uncontrolled scope | Bind delivery to the active plan and largest coherent validated outcome |
| Agents create giant unreviewable commits | Require cohesive commits and explicitly separate run size from commit size |
| Agents hide blockers to appear productive | Preserve explicit valid stop conditions and truthful handoff evidence |
| Documentation diverges from implementation | Require same-PR documentation and PR evidence |

## Acceptance criteria

- [x] Full durable documentation is mandatory for every relevant delivery.
- [x] Code comments and language-appropriate API documentation are explicitly required.
- [x] .NET XML documentation expectations are explicit.
- [x] TypeScript exported-contract documentation expectations are explicit.
- [x] Obvious, redundant, stale, false, and misleading comments are rejected.
- [x] Every run must target a substantial coherent outcome.
- [x] Trivial stopping points are rejected when safe continuation is possible.
- [x] Valid blockers and stop conditions remain explicit.
- [x] Large delivery is separated from giant commits and scope creep.
- [x] Plan and PR templates collect documentation and delivery-depth evidence.
- [x] Final diff validation is complete.
- [x] Pull request is open.
- [x] No unsupported completion claim remains.

## Execution state

- **Current run delivery target:** Deliver the complete governance update across all agent lifecycle entry points.
- **Current checkpoint:** PLAN-0007 execution is complete and validated; PR #8 is open against `main`.
- **Last completed step:** Opened PR #8 and synchronized completed plan and registry state.
- **Exact next action:** Repository owner reviews and merges PR #8, then reconciles delivery to `Merged` and deletes the working branch.
- **Blockers:** Owner review and merge are delivery dependencies, not execution blockers.
- **Partially modified areas:** None.
- **Documentation delivered:** Agent rules, contributor rules, plan lifecycle, both plan templates, PR template, registry, and this completed plan.
- **Validation performed:** Full branch diff review and governance consistency checks listed above.
- **Known failures or limitations:** Executable analyzer and CI enforcement will be introduced by future implementation plans because no executable project foundation is changed here.
- **Working tree state:** Clean after the final plan-state commit.

## Progress log

### 2026-07-29T02:10:00Z — AI governance agent

- **Run delivery target:** Apply complete documentation and substantial-delivery requirements across all governance entry points.
- **Checkpoint:** Complete governance policy prepared and committed.
- **Changes included in the commit:** Added PLAN-0007; strengthened agent, contributor, planning, testing-plan, and pull-request guidance; reconciled PLAN-0006 merge and PLAN-0004 blocker state.
- **Documentation and code-documentation delivered:** All planned governance and template documentation.
- **Validation performed:** Reviewed bounded scope, useful comments, XML/TSDoc coverage, run-depth expectations, valid stop conditions, and compatibility with existing plan rules.
- **Result:** Future agents are required to deliver complete documentation and substantial coherent progress per run without sacrificing safety or reviewability.
- **Next action:** Validate the branch, open the pull request, and finalize PLAN-0007.
- **Blockers or handoff notes:** None.

### 2026-07-29T02:20:00Z — AI governance agent

- **Run delivery target:** Complete validation and repository delivery for the governance update.
- **Checkpoint:** PLAN-0007 completed and PR #8 opened.
- **Changes included in the commit:** Finalized plan and registry state after full-diff validation and PR creation.
- **Documentation and code-documentation delivered:** Final execution evidence and owner handoff.
- **Validation performed:** Confirmed eight documentation/template files changed, branch alignment, requirement coverage, and absence of executable impact.
- **Result:** Completed; delivery remains PR open.
- **Next action:** Owner reviews and merges PR #8.
- **Blockers or handoff notes:** Delete `agent/plan-0007-strengthen-agent-delivery-standards` after merge and reconcile delivery to `Merged`.

## Completion and handoff checklist

- [x] All phases and acceptance criteria are resolved truthfully.
- [x] Required validation passes or limitations are documented.
- [x] Documentation and templates are internally consistent.
- [x] Security, privacy, safety, localization, accessibility, AI, and operational implications were reviewed.
- [x] `docs/plan-status.md` matches this plan.
- [x] Pull request links this plan and reports validation evidence.
- [x] No hidden or unexplained partial work remains.
- [x] Exact continuation instructions exist.
- [x] Delivery state and branch-cleanup responsibility are recorded.

## Later amendments

- [`PLAN-0007-amendment-2026-08-05-lean-validation.md`](PLAN-0007-amendment-2026-08-05-lean-validation.md) — lean risk-based validation default (2026-08-05).
