# PLAN-0007: Strengthen Agent Documentation and Delivery Standards

- **Status:** In Progress
- **Type:** Documentation
- **Priority:** High
- **Owner:** AI governance agent
- **Created:** 2026-07-29
- **Last updated:** 2026-07-29T02:10:00Z
- **Branch:** `agent/plan-0007-strengthen-agent-delivery-standards`
- **Pull request:** Not opened
- **Related issues:** None
- **Related ADRs:** None
- **Dependencies:** PLAN-0006 merged through PR #7

## Objective

Make two stakeholder requirements mandatory and unambiguous for every AI agent and contributor:

1. every delivery includes complete durable and code-level documentation, including appropriate code comments and XML documentation;
2. every execution run aims for a substantial, coherent delivery rather than stopping after trivial scaffolding or a micro-change when no real blocker exists.

The rules must be enforceable without encouraging noisy comments, undocumented exceptions, scope creep, giant unreviewable commits, skipped validation, or false completion claims.

## Context

The repository already requires plan-driven execution, current documentation, reviewable commits, and truthful handoff state. It does not yet define the expected completeness of code comments and XML documentation, nor does it explicitly require agents to maximize useful progress within an execution run.

This plan strengthens governance only. It does not alter product behavior, architecture, executable code, contracts, dependencies, infrastructure, or active implementation scope.

## Scope

### Included

- Add a mandatory documentation-completeness standard to `AGENTS.md` and `CONTRIBUTING.md`.
- Define .NET XML documentation expectations.
- Define TypeScript TSDoc/JSDoc and inline-comment expectations.
- Define durable documentation that accompanies behavior, contracts, configuration, migrations, operations, tests, and AI workflows.
- Define a substantial-delivery-per-run mandate.
- Clarify valid stop conditions and required handoff evidence.
- Update plan guidance and templates so every plan declares its run delivery target and documentation deliverables.
- Update the pull-request template with documentation and delivery-depth evidence.
- Reconcile PLAN-0006 delivery as merged and remove the obsolete PR #7 merge blocker from PLAN-0004.

### Excluded

- Retrofitting XML documentation or comments into existing executable code.
- Adding analyzers, compiler warning configuration, CI gates, or documentation generators before executable projects exist.
- Changing PLAN-0003 or PLAN-0004 implementation scope.
- Requiring comments that merely restate syntax.
- Defining delivery size by line count, file count, commit count, or elapsed time.

## Requirements and constraints

- **GOV-007-001:** Full documentation is part of every implementation, testing, research, documentation, infrastructure, security, AI, and operations delivery.
- **GOV-007-002:** Documentation changes are delivered in the same pull request as the behavior or decision they describe.
- **GOV-007-003:** New or materially changed .NET public and protected types and members require accurate XML documentation unless generated code or an explicit documented exception applies.
- **GOV-007-004:** Internal .NET contracts with non-obvious domain, security, concurrency, lifecycle, or failure semantics also require XML documentation or equivalent durable explanation.
- **GOV-007-005:** Exported reusable TypeScript components, hooks, functions, types, and adapters require TSDoc/JSDoc when their contract, side effects, accessibility behavior, security behavior, or failure semantics are not self-evident.
- **GOV-007-006:** Inline comments explain rationale, invariants, hazards, protocol details, concurrency, idempotency, ownership, security, or intentionally unusual behavior; they must not narrate obvious syntax.
- **GOV-007-007:** Stale, misleading, redundant, or false comments must be corrected or removed in the same change.
- **GOV-007-008:** Generated files are documented at their source schema/generator boundary and are not manually edited solely to add comments.
- **GOV-007-009:** Each execution run declares a substantial delivery target before implementation begins.
- **GOV-007-010:** Unless blocked, an agent completes the largest coherent plan phase or vertical outcome that can be safely implemented, documented, tested, and validated in the run.
- **GOV-007-011:** Reading, planning, scaffolding, one isolated DTO, one isolated endpoint, placeholder tests, or a status-only change is not a sufficient run outcome when the agent can safely continue.
- **GOV-007-012:** A substantial run may contain multiple cohesive commits; large delivery does not mean one giant commit.
- **GOV-007-013:** Delivery depth never overrides plan scope, architecture boundaries, security, reviewability, test requirements, or truthful state reporting.
- **GOV-007-014:** An agent may stop early only for a real blocker, required stakeholder decision, unsafe uncertainty, environment/tool failure, conflicting concurrent work, exhausted execution capacity, or a necessary plan revision.
- **GOV-007-015:** Early stops record the exact blocker, completed work, validation, remaining work, and immediately executable next action.

## Architecture and contract impact

None. This change affects repository governance and execution quality only.

Future .NET implementation plans should introduce repository-scoped enforcement for XML documentation when executable projects are created, including XML documentation output and missing-documentation analysis for project-owned public APIs. Generated code and intentional exceptions must be explicit and narrow.

## Execution phases

### Phase 1: Define the standard

- [x] Translate stakeholder requirements into precise documentation and delivery-depth rules.
- [x] Preserve reviewability, bounded scope, truthful validation, and safe stop conditions.
- [x] Define language-specific code documentation expectations.

**Exit criteria**

- The rules are objective enough for a weaker agent to apply without interpreting “large” as uncontrolled scope or “comments” as syntax narration.

### Phase 2: Apply the standard across governance entry points

- [x] Update `AGENTS.md`.
- [x] Update `CONTRIBUTING.md`.
- [x] Update `docs/plans/README.md`.
- [x] Update the general plan template.
- [x] Update the independent test-plan template.
- [x] Update the pull-request template.
- [x] Reconcile the plan registry.

**Exit criteria**

- Agents encounter the requirements during onboarding, planning, implementation, testing, review, and handoff.

### Phase 3: Validate and deliver

- [ ] Review all changed guidance for contradictions and duplicated rules.
- [ ] Confirm no executable source or product scope changed.
- [ ] Confirm plan and registry synchronization.
- [ ] Open a pull request.
- [ ] Mark PLAN-0007 completed while tracking delivery separately.

**Exit criteria**

- The owner can merge one cohesive governance update with no hidden implementation effects.

## Testing and validation plan

- Review the full diff against `main`.
- Verify that every changed file is Markdown governance or template content.
- Verify `GOV-007-*` requirements are represented in agent rules, planning guidance, templates, or PR evidence.
- Verify “substantial delivery” is defined by a coherent validated outcome, not raw size.
- Verify code comments are required where useful but obvious syntax narration is rejected.
- Verify XML documentation requirements cover public/protected .NET APIs and non-obvious internal contracts.
- Verify TypeScript exported reusable contracts receive equivalent documentation guidance.
- Verify valid blockers and early-stop rules remain compatible with truthful handoffs.
- Verify PLAN-0003 and PLAN-0004 scope is unchanged.

## Cross-cutting impact

### Security and privacy

Better documentation must include authorization, sensitive-data handling, retention, threat assumptions, secrets, and failure behavior where relevant. Comments and documentation must never disclose credentials, production data, personal data, private prompts, or exploitable operational details beyond the repository's accepted security posture.

### Food safety

Food-safety rules, uncertainty, curated sources, validation, and user-facing limitations must be documented alongside related implementation. This governance change does not add food-safety behavior.

### AI behavior and cost

AI operations must document provider/model policy, structured contracts, context limits, validation, fallback, quotas, metrics, cost, privacy, and degraded behavior. This plan does not add an AI operation.

### Localization and accessibility

User-facing behavior documentation must include localization and accessibility implications. Code comments and XML/TSDoc remain technical English.

### Operations and observability

Operational deliveries must include configuration, deployment, migration, rollback, monitoring, alerts, runbooks, backup/recovery, and support guidance appropriate to the change.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Agents add comments to every obvious line | Medium | Medium | Require rationale-focused comments and reject syntax narration |
| XML documentation becomes generic filler | Medium | Medium | Require accurate contracts, parameters, returns, exceptions, ownership, and failure semantics |
| “Large delivery” causes uncontrolled scope | Medium | High | Bind delivery to the active plan and largest coherent validated phase |
| Agents create giant unreviewable commits | Medium | High | Explicitly permit and expect multiple cohesive commits within one run |
| Agents hide blockers to appear productive | Low | High | Preserve explicit valid stop conditions and truthful handoff requirements |
| Documentation diverges from implementation | Medium | High | Require same-PR documentation and review evidence |

## Acceptance criteria

- [x] Full durable documentation is mandatory for every relevant delivery.
- [x] Code comments and language-appropriate API documentation are explicitly required.
- [x] .NET XML documentation expectations are explicit.
- [x] TypeScript exported-contract documentation expectations are explicit.
- [x] Obvious, redundant, stale, and misleading comments are rejected.
- [x] Every run must target a substantial coherent outcome.
- [x] Trivial stopping points are rejected when safe continuation is possible.
- [x] Valid blockers and stop conditions remain explicit.
- [x] Large delivery is separated from giant commits and scope creep.
- [x] Plan and PR templates collect documentation and delivery-depth evidence.
- [ ] Final diff validation is complete.
- [ ] Pull request is open.
- [ ] No unsupported completion claim remains.

## Execution state

This section must be updated before every agent-created commit.

- **Current checkpoint:** Governance updates are prepared across agent rules, contributor guidance, plan lifecycle, templates, and pull-request evidence; final diff validation remains.
- **Last completed step:** Applied the documentation-completeness and substantial-delivery rules to every planned governance entry point.
- **Exact next action:** Commit the synchronized policy update, validate the complete branch diff, open the pull request, and finalize PLAN-0007 delivery state.
- **Blockers:** None.
- **Partially modified areas:** Final validation and pull-request delivery remain.
- **Validation performed:** Cross-checked intended rules against existing plan-driven execution, reviewability, and truthful handoff requirements while drafting.
- **Known failures or limitations:** Executable analyzer and CI enforcement will be introduced by future implementation plans because no executable project baseline is changed here.
- **Working tree state:** Clean after the policy commit represented by this state.

## Progress log

### 2026-07-29T02:10:00Z — AI governance agent

- **Checkpoint:** Complete governance policy prepared.
- **Changes included in the commit:** Added PLAN-0007; strengthened agent, contributor, planning, testing-plan, and pull-request guidance; reconciled PLAN-0006 merge and PLAN-0004 blocker state.
- **Validation performed:** Reviewed the policy for bounded scope, useful comments, XML/TSDoc coverage, substantial-run expectations, valid stop conditions, and compatibility with existing plan rules.
- **Result:** Future agents are required to deliver complete documentation and substantial coherent progress per run without sacrificing safety or reviewability.
- **Next action:** Validate the branch against `main`, open the pull request, and finalize PLAN-0007.
- **Blockers or handoff notes:** None.

## Completion and handoff checklist

- [ ] All phases and acceptance criteria are resolved truthfully.
- [ ] Required validation passes or limitations are documented.
- [ ] Documentation and templates are internally consistent.
- [ ] Security, privacy, safety, localization, accessibility, AI, and operational implications were reviewed.
- [ ] `docs/plan-status.md` matches this plan.
- [ ] Pull request links this plan and reports validation evidence.
- [ ] No hidden or unexplained partial work remains.
- [ ] Exact continuation instructions exist.
- [ ] Delivery state and branch-cleanup responsibility are recorded.
