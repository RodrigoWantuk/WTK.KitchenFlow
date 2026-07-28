# PLAN-0001 — Document the KitchenFlow Product Foundation

- **Type:** Documentation
- **Status:** In Progress
- **Owner:** AI documentation agent
- **Branch:** `agent/plan-0001-document-product-foundation`
- **Created:** 2026-07-28
- **Last updated:** 2026-07-28

## Objective

Convert the complete 2026-07-28 stakeholder discovery into durable, structured, implementation-ready documentation for KitchenFlow.

The resulting documentation must preserve the product intent, domain behavior, first-release scope, architecture direction, AI governance, operational requirements, privacy constraints, and unresolved questions established during the discovery interview. Future implementation and testing agents must be able to work from the repository without access to the original conversation.

## Context and authoritative requirements

The repository currently contains high-level product, architecture, AI, and testing documents, but the detailed stakeholder decisions made during the 2026-07-28 discovery are not yet represented in the repository.

The stakeholder explicitly requires that no material product or architecture information from the discovery be lost. Technical documentation must be written in English.

The central product question established by the discovery is:

> Considering what food exists, how much exists, how long it remains usable, and what the user is willing to do, what is the best way to transform that food into useful meals?

All product modules provide context or actions around this decision problem.

## Included scope

- Product problem, value proposition, target audience, objectives, and product principles.
- User profile, optional context, onboarding, localization, adult-only policy, and household assumptions.
- Inventory products, lots, quantities, storage states, shelf-life hierarchy, provenance, reservations, lifecycle transitions, leftovers, waste, and reconciliation.
- Recipe generation, import, normalization, revisions, derivation, ownership, sharing by copy, guided cooking, mise en place, troubleshooting, execution history, and photos.
- Optional menu planning, flexible reservations, shopping assistance, package remainder planning, and plan adaptation.
- Initial release capabilities, optional modules, graceful degradation, notifications, data rights, and deferred community features.
- Frontend and backend separation, React/Lovable frontend, .NET backend direction, modular monolith, PostgreSQL, asynchronous processing, identity, AI gateway, quotas, observability, deployment, scale envelopes, reliability, and security constraints.
- AI context construction, structured protocols, model routing, cost governance, reuse of generated content, and provider failure behavior.
- LGPD/GDPR-oriented privacy requirements, data minimization, consent, export, deletion, retention, imported-image handling, and user-photo handling.
- Mandatory reading paths for future agents.
- Architecture Decision Records for decisions that are sufficiently established.

## Explicitly excluded

- Executable frontend or backend implementation.
- Database migrations or API schemas.
- Final cloud vendor selection and production pricing.
- Final subscription prices, advertising provider, or exact AI credit schedule.
- Public searchable recipe catalog and ranking implementation.
- Legal advice or a substitute for professional legal review before launch.

## Assumptions and dependencies

- The frontend remains React and TypeScript generated and evolved through Lovable.
- Frontend and backend are independently buildable, testable, deployable, and observable.
- The backend recommendation is .NET, subject to an accepted ADR in this change.
- The first release is a responsive web application and requires an account.
- Product and architecture documents must distinguish accepted decisions, current recommendations, and deferred refinements.
- Existing repository governance and plan rules remain authoritative.

## Open questions preserved for future plans

- Exact cloud services and managed-versus-self-hosted component choices.
- Exact AI providers, models, credit conversion, free-plan limits, subscription tiers, and ad policy.
- Final food shelf-life reference data sources and regional curation process.
- Exact notification provider and browser push support matrix.
- Exact billing provider and payment fraud controls.
- Detailed UI information architecture and visual design.
- Legal wording, lawful bases, international transfers, retention periods, and country availability.
- Exact launch service-level objectives after load testing.

## Architecture and contract impact

This plan creates and updates durable product and architecture documentation. It records technology decisions that will constrain later implementation plans but does not create executable contracts.

Relevant decisions must be represented as ADRs rather than being buried only in narrative documentation.

## Execution phases

### Phase 1 — Register and inventory

- [x] Create PLAN-0001 and register it in `docs/plan-status.md`.
- [x] Review the existing documentation map and governance requirements.
- [ ] Identify all canonical documents that require creation or revision.

### Phase 2 — Product and domain foundation

- [ ] Document the problem, audience, value proposition, principles, and product boundaries.
- [ ] Document primary journeys and the initial release definition.
- [ ] Document inventory, planning, shopping, recipes, cooking, and lifecycle domain behavior.
- [ ] Preserve decisions, rationale, optionality, and deferred capabilities.

### Phase 3 — Architecture and governance

- [ ] Update the system architecture and architecture principles.
- [ ] Document AI gateway, cost, quota, context, and resilience requirements.
- [ ] Document privacy, security, age, data rights, and file-handling requirements.
- [ ] Document scalability, reliability, asynchronous jobs, observability, and deployment assumptions.
- [ ] Add ADRs for accepted frontend, backend, identity, persistence, messaging, and AI-boundary decisions.

### Phase 4 — Agent onboarding and validation

- [ ] Update documentation indexes and mandatory reading rules.
- [ ] Cross-check all discovery decisions against the canonical documents.
- [ ] Verify links, terminology, status markers, and contradictions.
- [ ] Mark the plan completed and update the registry.
- [ ] Open a pull request with complete validation and handoff information.

## Validation strategy

- Review every product and architecture decision from the discovery against a coverage checklist.
- Compare new documentation with existing product vision, architecture, AI, and testing documents.
- Verify that accepted decisions are not presented as unresolved hypotheses.
- Verify that future ideas are not represented as first-release commitments.
- Verify that imported source images and URLs are not retained according to the accepted product policy.
- Verify that frontend and backend separation and Lovable/React constraints are explicit.
- Verify that all AI access is centralized and deterministic domain rules remain outside model authority.
- Verify relative links and repository paths manually.
- Review the complete branch diff before opening the pull request.

## Acceptance criteria

- [ ] The complete stakeholder discovery is represented in durable repository documentation without relying on chat history.
- [ ] The central product decision question and waste-reduction core are explicit.
- [ ] Product, inventory, recipe, planning, shopping, cooking, AI, privacy, and architecture decisions are documented.
- [ ] The first release and deferred capabilities are clearly separated.
- [ ] Architecture decisions have appropriate ADRs.
- [ ] Future agents have an explicit mandatory reading path through the new foundation.
- [ ] Existing canonical documents are updated or linked so contradictory guidance does not remain.
- [ ] The plan and registry truthfully describe the final branch state.
- [ ] A reviewable pull request is open against `main`.

## Execution state

- **Current checkpoint:** PLAN-0001 is registered. Existing repository governance and documentation structure were reviewed. No product-foundation documents have been changed yet.
- **Exact next action:** Create the canonical product, domain, architecture, AI, privacy, operations, and release documents, then update existing indexes and agent reading rules in a single plan-compliant documentation commit.
- **Blockers:** None.
- **Uncommitted work:** None after this commit.

## Progress log

### 2026-07-28 — Plan registered

- Created PLAN-0001 for the complete product-foundation documentation delivery.
- Registered the plan as `In Progress` on branch `agent/plan-0001-document-product-foundation`.
- Reviewed the merged plan framework and current registry.
- Validation performed: confirmed PR #4 is merged and plan-driven execution is mandatory.
- Known limitations: detailed discovery documentation has not yet been written.
- Next action: produce and cross-link the canonical foundation documentation.

## Completion and handoff checklist

- [ ] All acceptance criteria resolved.
- [ ] Documentation coverage checklist completed.
- [ ] Relevant ADRs added and linked.
- [ ] Existing documents reconciled.
- [ ] Full branch diff reviewed.
- [ ] Pull request opened.
- [ ] Exact post-merge branch cleanup responsibility documented.
