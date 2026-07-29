# PLAN-0000: Plan Title

- **Status:** Draft
- **Type:** Implementation | Testing | Research | Documentation | Operations
- **Priority:** Critical | High | Medium | Low
- **Owner:** Unassigned
- **Created:** YYYY-MM-DD
- **Last updated:** YYYY-MM-DDTHH:MM:SSZ
- **Branch:** `agent/plan-0000-short-scope`
- **Pull request:** Not opened
- **Related issues:** None
- **Related ADRs:** None
- **Dependencies:** None

## Objective

Describe the bounded user or engineering outcome this plan must deliver.

## Context

Summarize the problem, relevant current behavior, authoritative requirements, and why this work is needed now. Link canonical documents instead of copying large sections.

## Scope

### Included

- Included outcome or component.

### Excluded

- Explicitly excluded work.

## Requirements and constraints

- Requirement or constraint.
- Preserve all nonfunctional requirements relevant to this work.
- Do not silently reduce scope to a smaller interpretation.
- Do not expand scope merely to make a delivery appear large.

## Substantial run delivery target

State the largest coherent phase, vertical slice, decision-ready result, documentation package, or operational outcome the agent should complete in one execution run when no blocker exists.

- **Target outcome:**
- **Minimum acceptable evidence:** implementation, tests, documentation, contracts, migrations, validation, or other applicable evidence.
- **Adjacent checkpoints to continue through when unblocked:**
- **Valid early-stop conditions:** real external blocker, required decision, unsafe uncertainty, environment/tool failure, conflicting concurrent work, exhausted execution capacity, or required plan revision.

Do not define delivery size by line count, file count, commit count, or elapsed time. A substantial run may use multiple cohesive commits.

## Documentation deliverables

Define every durable and code-level document required by this plan.

### Durable documentation

- Product/user behavior.
- Domain invariants and lifecycle rules.
- Architecture and ADRs.
- APIs, events, schemas, prompts, and generated contracts.
- Configuration, environment variables, defaults, and examples.
- Migrations, compatibility, rollback, or forward-repair guidance.
- Deployment, observability, alerts, runbooks, backup, restore, and support guidance.
- Security, privacy, food safety, AI cost, localization, accessibility, performance, and resilience implications.
- Test strategy, fixtures, evaluation data, commands, results, limitations, and handoff.

Mark items not applicable only with justification.

### Code-level documentation

- XML documentation for new or materially changed project-owned public and protected .NET types and members.
- XML documentation or equivalent durable explanation for non-obvious internal .NET contracts.
- TSDoc/JSDoc for exported reusable TypeScript APIs whose contracts or side effects are not self-evident.
- Inline comments for non-obvious rationale, invariants, hazards, security boundaries, concurrency, idempotency, protocols, compatibility, or unusual behavior.
- Removal or correction of stale, misleading, redundant, false, or commented-out code.
- Generated code documented at the source schema or generator boundary.

List and justify any narrow documentation exception before implementation.

## Assumptions and open questions

### Assumptions

- Assumption that has been verified or still requires verification.

### Open questions

- Question, owner, and the point at which it must be resolved.

## Architecture and contract impact

Describe affected modules, boundaries, APIs, schemas, events, prompts, data ownership, migrations, and deployment behavior.

State whether an ADR is required. Link the ADR when applicable.

## Execution phases

### Phase 1: Name

- [ ] Concrete step.
- [ ] Concrete step.

**Exit criteria**

- Observable condition required before the phase is complete.
- Applicable documentation and code-level documentation are current.
- The phase represents a substantial coherent outcome or a valid blocker is documented.

### Phase 2: Name

- [ ] Concrete step.

**Exit criteria**

- Observable condition required before the phase is complete.
- Applicable documentation and validation are complete.

## Testing and validation plan

Define the verification required for this plan, including relevant:

- unit tests;
- contract tests;
- integration tests;
- end-to-end tests;
- AI evaluations;
- security and authorization checks;
- accessibility checks;
- localization checks;
- performance and resilience checks;
- documentation and code-documentation review;
- manual verification.

## Cross-cutting impact

### Security and privacy

Describe authentication, authorization, sensitive data, secrets, retention, and threat implications.

### Food safety

Describe allergy, contamination, storage, temperature, doneness, reheating, substitution, or equipment-safety implications. Use `Not applicable` only with justification.

### AI behavior and cost

Describe model use, structured outputs, validation, prompt changes, fallback behavior, evaluation, usage, and cost implications.

### Localization and accessibility

Describe user-facing text, units, regional behavior, keyboard operation, assistive technology, and responsive layout implications.

### Operations and observability

Describe configuration, deployment, migrations, metrics, logs, traces, alerts, support, backup, and rollback implications.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Risk description | Low / Medium / High | Low / Medium / High | Mitigation |

## Acceptance criteria

- [ ] Criterion expressed as an observable, testable result.
- [ ] The substantial run delivery target was reached or a valid early-stop reason is documented.
- [ ] Durable documentation is complete and current.
- [ ] Code comments, XML documentation, and TSDoc/JSDoc are complete where applicable.
- [ ] Required documentation enforcement is configured where the plan creates a new project foundation.
- [ ] No unsupported completion claims remain.

## Execution state

This section must be updated before every agent-created commit.

- **Current run delivery target:**
- **Current checkpoint:** No work started.
- **Last completed step:** None.
- **Exact next action:** Finalize and approve the plan.
- **Blockers:** None.
- **Partially modified areas:** None.
- **Documentation delivered:** None.
- **Validation performed:** None.
- **Known failures or limitations:** None.
- **Working tree state:** Clean | Uncommitted changes described below

## Progress log

Append one entry before every agent-created commit. Do not rewrite prior entries to hide failed or superseded work.

### YYYY-MM-DDTHH:MM:SSZ — Agent or contributor

- **Run delivery target:**
- **Checkpoint:**
- **Changes included in the commit:**
- **Documentation and code-documentation delivered:**
- **Validation performed:**
- **Result:**
- **Next action:**
- **Blockers or handoff notes:**

## Completion and handoff checklist

- [ ] All plan phases and acceptance criteria are resolved truthfully.
- [ ] The run delivered a substantial coherent outcome or the valid early-stop reason is explicit.
- [ ] Required tests and evaluations pass, or limitations are documented.
- [ ] Durable documentation, contracts, comments, XML documentation, and TSDoc/JSDoc are current.
- [ ] Security, privacy, safety, localization, accessibility, AI, and operational impacts were reviewed.
- [ ] `docs/plan-status.md` matches this plan.
- [ ] Pull request description links this plan and reports validation evidence.
- [ ] No hidden or unexplained partial work remains.
- [ ] Exact continuation instructions exist if the work is not complete.
- [ ] Delivery state and branch-cleanup responsibility are recorded.
