## Plan and delivery state

- **Plan:** Link `docs/plans/PLAN-XXXX-...md`
- **Plan status:** Draft | Ready | In Progress | Paused | Blocked | Validating | Completed
- **Registry:** Link `docs/plan-status.md`
- **Delivery state:** PR open | Changes requested | Awaiting owner merge | Other

## Summary

Describe what changed and the user or engineering outcome.

## Why

Explain the problem, requirement, or decision that motivated this change.

## Scope

- Included:
- Explicitly excluded:

## Substantial run outcome

State the coherent phase, vertical slice, test campaign, decision-ready result, documentation package, or operational outcome completed during this execution run.

- **Intended run target:**
- **Delivered outcome:**
- **Acceptance criteria resolved:**
- **Why this is substantial:**
- **Valid early-stop reason, when target was not reached:**

Do not justify delivery size by line count, file count, commit count, or elapsed time. Confirm that the work remains cohesive, reviewable, and inside the active plan.

## Execution checkpoint

Describe the last verified checkpoint, any incomplete work, and the exact next action when the plan is not completed.

## Documentation completeness

Describe every documentation artifact added or updated with this delivery.

### Durable documentation

- Product and user behavior:
- Domain rules and invariants:
- Architecture and ADRs:
- APIs, events, schemas, prompts, and generated contracts:
- Configuration and environment variables:
- Migrations, compatibility, rollback, or forward repair:
- Deployment, observability, alerts, runbooks, backup, restore, and support:
- Security, privacy, food safety, AI cost, localization, accessibility, performance, and resilience:
- Test strategy, fixtures, commands, evidence, limitations, and handoff:

Use `Not applicable` with a brief explanation.

### Code-level documentation

- .NET XML documentation added or updated:
- Non-obvious internal .NET contracts documented:
- TypeScript TSDoc/JSDoc added or updated:
- Rationale-focused inline comments added or updated:
- Stale, misleading, redundant, false, or commented-out code removed or corrected:
- Generated-code documentation boundary:
- Explicit documentation exceptions and justification:

## Impact review

- [ ] Product behavior reviewed
- [ ] Architecture boundaries reviewed
- [ ] Security and privacy reviewed
- [ ] Food-safety and allergy implications reviewed
- [ ] Localization implications reviewed
- [ ] Accessibility implications reviewed
- [ ] AI behavior, validation, and cost reviewed
- [ ] Deployment and operational impact reviewed
- [ ] Durable documentation updated
- [ ] Code comments and language-appropriate API documentation updated
- [ ] XML documentation output/enforcement reviewed for .NET project changes
- [ ] The run delivered a substantial coherent outcome or a valid early-stop reason is documented
- [ ] Active plan was updated before every agent-created commit
- [ ] `docs/plan-status.md` was updated before every agent-created commit

Use `Not applicable` with a brief explanation when an item does not apply.

## Validation

List commands, automated tests, evaluations, documentation checks, and manual checks performed. Distinguish passing checks, failures, skipped checks, and environment limitations.

```text
Add validation commands and results here.
```

## Contracts and migrations

Describe API, schema, event, prompt, data, or deployment compatibility changes and the migration or rollback plan.

## Risks and limitations

Document known risks, limitations, deferred work, unverified behavior, failure modes, and any gap between the intended and delivered run target.

## Handoff and next action

State the exact continuation action when work remains. Identify blockers, partially modified areas, documentation gaps, and branch-cleanup responsibility.

## Related work

Link issues, ADRs, implementation plans, testing plans, designs, and dependent pull requests.
