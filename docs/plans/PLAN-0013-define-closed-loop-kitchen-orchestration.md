# PLAN-0013: Define Closed-Loop Kitchen Orchestration

- **Status:** Completed
- **Type:** Documentation
- **Priority:** High
- **Owner:** OpenAI product and architecture documentation agent
- **Created:** 2026-07-31
- **Last updated:** 2026-07-31T19:20:00Z
- **Branch:** `agent/plan-0013-closed-loop-orchestration`
- **Pull request:** Not opened
- **Related issues:** None
- **Related ADRs:** ADR-0001 through ADR-0006
- **Dependencies:** Accepted product foundation and domain documentation

## Objective

Record the accepted product direction that makes KitchenFlow a closed-loop kitchen orchestration system rather than a recipe catalog, static pantry, or calendar.

The documentation defines:

- localized recovery when reality diverges from an accepted plan;
- prepared components as first-class inventory lots;
- sequential planning simulation where earlier projected use changes later suggestions;
- truthful cooking completion and inventory reconciliation;
- simulation before plan acceptance;
- pragmatic inventory uncertainty;
- contextual troubleshooting with explicit controlled learning;
- multi-day preparation routes with real dependencies.

## Scope

### Included

- One canonical accepted product document.
- Clear backend, frontend-team, and product-prototype responsibility boundaries.
- Future implementation decomposition and ordering constraints.
- Documentation index and plan-registry updates.

### Excluded

- Executable code.
- API, event, schema, migration, prompt, provider, or algorithm selection.
- Claims that the accepted behavior is already implemented.
- Advanced automatic optimization of every package remainder.

## Accepted requirements

### Localized plan recovery

When a meal is skipped, replaced by delivery, moved, prepared outside the application, affected by changed inventory, or invalidated by missing preparation, the system recalculates only the impacted meals, reservations, shopping requirements, preparation actions, and inventory attention.

Unaffected accepted decisions remain stable. Recovery is explicit, reversible, and may offer rescheduling, localized replacement, portion changes, reservation release, preservation, freezing, or no change.

### Prepared components as inventory

A recipe may depend on another preparation, such as stock, cooked beans, cooked rice, shredded meat, sauce, dough, purée, chopped vegetables, or another reusable base.

The prerequisite may be prepared immediately, scheduled separately, refrigerated, frozen, purchased ready-made when permitted, or substituted.

Its output becomes one or more inventory lots with product identity, quantity, provenance, parent inputs, preparation time, storage, lifecycle state, shelf-life evidence, reservations, and history.

### Sequential planning simulation

Planning operates over a non-authoritative projected inventory state. Earlier candidate meals apply projected consumption, reservations, produced components, expected leftovers, and confirmed purchases before later candidates are evaluated.

Example:

```text
Available chicken: 1,000 g
Day A projected use: 250 g
Day B evaluates against the projected 750 g remainder
```

Known or user-confirmed package sizes influence projected shopping and subsequent availability. The system never invents an exact package size.

### Plan simulation before acceptance

The user may compare projected consequences before accepting:

- inventory used and remaining;
- shopping requirements;
- known package-size impact;
- expected leftovers and prepared components;
- preparation sessions and dependencies;
- active effort, elapsed time, cleanup, storage, and freezer demand;
- uncertainty and assumptions.

Simulation and draft state do not create authoritative reservations, shopping items, or inventory mutations.

### Execution reconciliation

Cooking completion proposes actual consumption, substitutions, omissions, additions, portions produced and consumed, leftovers, freezing, preservation, waste, and reservation release.

The user may edit the proposal. Execution completion and authoritative mutations commit atomically or remain explicitly pending reconciliation.

Quick completion without guided cooking may mark a planned meal as performed, but it must not imply that inventory has been reconciled.

### Inventory uncertainty

The product distinguishes exact, approximate, qualitative, unknown, sourced, inferred, and user-confirmed information.

It requests confirmation only when uncertainty materially changes feasibility, safety, shopping, or planning. Strong explicit evidence is not silently replaced by weaker estimates. The UI does not force false precision.

### Troubleshooting and controlled learning

Troubleshooting uses bounded execution context and changes execution-local instructions by default.

At finalization, the user may discard the adaptation, save a recipe revision, create a derived recipe, or explicitly confirm a learned preference. Allergies and medical restrictions are never inferred from behavior.

### Preparation dependency route

The preparation route is derived from accepted meals, recipe prerequisites, prepared-component outputs, inventory, thawing, soaking, marinating, cooling, storage, preservation, and dependency relationships.

It is not a flat reminder list. It models real dates, time windows, timezone, readiness, blocked tasks, completed tasks, and downstream impact.

## Responsibility boundaries

### Backend and deterministic domain logic

Own:

- product and lot identity;
- quantity arithmetic and projected inventory;
- reservations and component allocation;
- dependency validation and due-window calculation;
- timezone-aware authoritative scheduling;
- conflict detection and invariant enforcement;
- reconciliation, atomicity, idempotency, concurrency, history, privacy, and authorization;
- AI gateway context, validation, quotas, and cost governance.

### Frontend implementation team

Own:

- generated-contract adapters;
- production state management;
- stale, retry, conflict, and pending-reconciliation presentation;
- accessibility, localization, responsiveness, and automated frontend testing;
- technical component decomposition and integration.

### Product-design prototype tools

May define and demonstrate:

- visual hierarchy and interaction concepts;
- dialogs, comparisons, route presentation, explanations, and mock scenarios;
- synthetic states for accepted behavior.

They do not own domain arithmetic, persistence, authoritative schedules, food-safety truth, or backend contracts.

## Future implementation decomposition

Create separate implementation plans only when dependencies and contracts are stable.

1. **Prepared components and derived inventory lots** — prerequisite identity, production, parent-lot consumption, storage, freezing, shelf life, and reservations.
2. **Sequential planning simulation** — projected inventory, candidate feedback, package-size context, comparison, and explicit acceptance.
3. **Execution reconciliation** — proposed versus actual use, leftovers, preservation, waste, quick completion, and pending reconciliation.
4. **Localized plan recovery** — impact detection and reversible changes that preserve unaffected decisions.
5. **Multi-day preparation route** — dependency graph, due windows, reusable components, today projection, and notifications.
6. **Troubleshooting and controlled learning** — bounded AI workflow, execution-local adaptation, revision/derivation, evaluations, privacy, safety, and cost controls.

## Validation

The final documentation was checked to confirm that it:

- records all accepted directions;
- does not authorize AI to mutate authoritative state;
- treats prepared components as first-class inventory lots;
- keeps simulation non-authoritative until acceptance;
- distinguishes completed meals from reconciled executions;
- preserves unaffected accepted decisions during recovery;
- represents preparation as a dependency route rather than labels only;
- requires explicit confirmation for recipe or preference learning;
- separates backend, frontend-team, and prototype responsibilities.

## Cross-cutting implications

- Prepared-component shelf life and handling require deterministic food-safety controls and evidence-aware uncertainty.
- Planning, inventory, recipe, troubleshooting, and execution data remain private and owner-isolated.
- AI operations require registered gateway workflows, schemas, bounded context, validation, evaluation, fallback, quota, telemetry, and cost accounting.
- Dates, times, units, task states, uncertainty, and recovery explanations must be localized and accessible.
- Future asynchronous orchestration requires persistent jobs, idempotent processing, privacy-safe observability, and recoverable pending states.

## Acceptance criteria

- [x] Canonical accepted product document created.
- [x] All eight accepted directions are recorded.
- [x] Responsibility boundaries are explicit.
- [x] Future implementation slices and ordering are recorded.
- [x] Documentation indexes are updated.
- [x] Registry is synchronized before PR creation.
- [x] Cross-document review found no contradiction with accepted inventory, planning, recipe, AI, privacy, safety, or architecture rules.

## Execution state

- **Current run delivery target:** Deliver the complete accepted documentation package and open a reviewable documentation PR.
- **Current checkpoint:** Documentation package complete and ready for pull-request delivery.
- **Last completed step:** Added the canonical accepted specification and updated the documentation and domain indexes.
- **Exact next action:** Open the documentation PR, record its number in this plan and the registry, then hand off for owner review and merge.
- **Blockers:** None.
- **Partially modified areas:** None.
- **Documentation delivered:** Canonical closed-loop orchestration specification, domain index and invariants, documentation reading paths, PLAN-0013, and registry entry.
- **Validation performed:** Manual cross-document review against accepted product, inventory, planning, recipe, architecture, AI, privacy, safety, localization, and operations rules; branch diff review remains before PR creation.
- **Known failures or limitations:** No executable behavior, contract, migration, prompt, provider, or algorithm was implemented. Sequential connector commits were required, but final branch state is synchronized.
- **Working tree state:** Connector-managed branch; no local working tree.

## Progress log

### 2026-07-31T19:10:00Z — OpenAI product and architecture documentation agent

- **Run delivery target:** Deliver the complete accepted documentation package and open a reviewable documentation PR.
- **Checkpoint:** Initial plan created under the corrected PLAN-0013 identifier.
- **Changes included in the commit:** Added scope, accepted requirements, responsibility boundaries, future implementation decomposition, validation, and cross-cutting implications.
- **Documentation delivered:** PLAN-0013.
- **Validation performed:** Confirmed PLAN-0012 is actively used by `cursor/plan-0012-profile-backend-1672`; reset the mistakenly created documentation branch and reserved PLAN-0013 for this work.
- **Result:** Correct numbering established; canonical documentation remained.
- **Next action:** Register the plan and create the accepted product document.
- **Blockers or handoff notes:** Single-file connector commit limitation was recorded for final reconciliation.

### 2026-07-31T19:20:00Z — OpenAI product and architecture documentation agent

- **Run delivery target:** Deliver the complete accepted documentation package and open a reviewable documentation PR.
- **Checkpoint:** Documentation implementation and consistency review complete.
- **Changes included in the branch:** Registered PLAN-0013; added `docs/product/closed-loop-kitchen-orchestration.md`; updated documentation reading paths, foundation summary, domain areas, conceptual entities, and cross-domain invariants.
- **Documentation delivered:** Complete accepted documentation package; code-level documentation not applicable.
- **Validation performed:** Verified all eight stakeholder decisions, responsibility boundaries, future slicing, no direct AI mutation, non-authoritative simulation, truthful reconciliation, first-class prepared lots, localized recovery, and dependency-route semantics.
- **Result:** PLAN-0013 completed; branch is ready for PR creation.
- **Next action:** Open the PR and update delivery metadata.
- **Blockers or handoff notes:** PLAN-0012 remains exclusively assigned to the active profile-backend branch. Future implementation plans must start after applicable contracts and baselines stabilize.

## Completion and handoff checklist

- [x] Acceptance criteria resolved truthfully.
- [x] Documentation package completed.
- [x] Code-level documentation not applicable.
- [x] Cross-cutting impacts reviewed.
- [x] Registry matches the completed plan before PR creation.
- [ ] PR description reports scope and validation.
- [x] No hidden partial work remains.
- [x] Future implementation continuation is explicit.
