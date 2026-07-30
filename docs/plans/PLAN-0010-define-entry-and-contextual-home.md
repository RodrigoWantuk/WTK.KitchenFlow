# PLAN-0010: Define the Public Entry and Contextual Home Experience

- **Status:** In Progress
- **Type:** Documentation
- **Priority:** High
- **Owner:** AI product-documentation agent
- **Created:** 2026-07-30
- **Last updated:** 2026-07-30
- **Branch:** `agent/plan-0010-contextual-home-experience`
- **Pull request:** To be opened after the branch has an initial commit
- **Related implementation plan:** PLAN-0011
- **Related plans:** PLAN-0004
- **Related product documents:** `docs/product/user-journeys.md`, `docs/product/initial-release.md`
- **Related domain documents:** `docs/domain/planning-and-shopping.md`

## Objective

Convert the stakeholder decision for the public landing page and authenticated home into accepted, testable product behavior and an executable future implementation plan.

The resulting documentation must define:

- a concise public explanation of the product before authentication;
- an optional video, animation, or interactive demonstration with accessible and low-bandwidth fallbacks;
- a personal authenticated greeting and a persistent cooking-oriented home question;
- local-time-aware meal context without requesting precise location;
- a strict, explainable suggestion-source priority;
- a one- or two-question quick chooser when the user wants help narrowing options;
- graceful behavior when plans, inventory, profile data, or AI are unavailable.

## Scope

### Included

- accepted public-entry and authenticated-home product behavior;
- recommendation-source priority and fallback rules;
- local-time and timezone semantics;
- localization, accessibility, privacy, telemetry, AI-degradation, and responsive requirements;
- updates to existing journeys, release requirements, planning rules, and documentation reading paths;
- a future implementation plan for frontend, contracts, tests, and staged live integration.

### Explicitly excluded

- executable frontend or backend changes;
- final marketing copy, final video, final animation, or final brand identity;
- repository or namespace renaming;
- direct AI-provider integration;
- recommendation-model selection or ranking-weight implementation;
- legal approval of public-page claims;
- analytics-provider selection.

## Substantial run outcome

- **Intended run target:** Deliver the complete accepted product specification and a future implementation plan, update all directly affected canonical documents, and leave the repository ready for owner review.
- **Delivered outcome:** In progress.
- **Acceptance criteria resolved:** In progress.
- **Why this is substantial:** The work defines a cross-cutting product entry point and home decision surface spanning product, planning, localization, accessibility, privacy, AI degradation, telemetry, and frontend/backend boundaries.
- **Valid early-stop reason, when target was not reached:** Not applicable.

## Decisions to preserve

1. The public page explains what the application is and what it can do before login.
2. Rich demonstration media is optional enhancement, never a dependency for understanding or conversion.
3. The authenticated home uses a personal, intimate tone without becoming childish, intrusive, or judgmental.
4. A localized equivalent of “What shall we cook today?” remains the primary home orientation.
5. Suggestion context uses the user's local timezone and daypart, not the server timezone.
6. Suggestion sources are presented in this order:
   1. relevant accepted menu entries;
   2. inventory-based suggestions, prioritizing food needing attention;
   3. profile-based suggestions;
   4. a one- or two-question quick chooser.
7. Urgency influences ordering and explanation but never forces a recipe choice.
8. Missing context removes or degrades only the affected tier.
9. AI failure must not remove scheduled meals, saved recipes, deterministic attention, or the ability to continue cooking.
10. The product name and repository rename are handled by a separate plan.

## Documentation deliverables

- `docs/product/entry-and-contextual-home.md` as the canonical accepted behavior;
- updates to `docs/product/user-journeys.md`;
- updates to `docs/product/initial-release.md`;
- updates to `docs/domain/planning-and-shopping.md`;
- update to `docs/README.md` reading paths;
- `PLAN-0011` for future implementation;
- synchronized `docs/plan-status.md` entries.

## Acceptance criteria

- [ ] Public entry behavior is concise, truthful, accessible, localized, and understandable without rich media.
- [ ] Authenticated home behavior defines greeting, primary question, and neutral fallbacks.
- [ ] Local timezone and daypart handling are explicit and do not require precise geolocation.
- [ ] The four suggestion tiers and their ordering are explicit.
- [ ] Menu, inventory, profile, and quick-chooser fallbacks are explicit.
- [ ] Urgency remains advisory and explainable.
- [ ] AI-unavailable behavior remains useful and authoritative state remains unchanged.
- [ ] Accessibility, responsive behavior, reduced motion, captions/transcripts, localization, privacy, and safe telemetry are covered.
- [ ] A future implementation plan defines phases, dependencies, contracts, validation, and handoff.
- [ ] Existing canonical documents and the registry are synchronized.

## Documentation completeness

### Durable documentation

- Product and user behavior: In progress.
- Domain rules and invariants: In progress.
- Architecture and ADRs: No new architecture decision is expected; existing boundaries remain binding.
- APIs, events, schemas, prompts, and generated contracts: Deferred to PLAN-0011 because no executable contract changes occur here.
- Configuration and environment variables: Deferred to PLAN-0011.
- Migrations, compatibility, rollback, or forward repair: Not applicable; documentation-only delivery.
- Deployment, observability, alerts, runbooks, backup, restore, and support: Product-level telemetry and degradation requirements are in scope; provider and deployment details are deferred.
- Security, privacy, food safety, AI cost, localization, accessibility, performance, and resilience: In progress.
- Test strategy, fixtures, commands, evidence, limitations, and handoff: Future implementation validation will be defined in PLAN-0011.

### Code-level documentation

No executable code is changed. XML documentation, TSDoc/JSDoc, generated-code boundaries, and inline-code comments are not applicable to this documentation-only delivery.

## Validation plan

- Cross-check the new behavior against accepted product vision, journeys, release scope, planning invariants, AI degradation, privacy, localization, and accessibility rules.
- Verify the suggestion-source order is stated consistently in every affected document.
- Verify no document authorizes direct frontend AI calls, precise-location collection, silent plan mutation, forced urgent-item selection, or authoritative client-side inventory changes.
- Verify all new links and plan IDs are consistent.
- Review the final branch diff and confirm only Markdown documentation changed.

## Risks and limitations

- Exact daypart boundaries require locale-aware product research and may evolve; the product rule is local-time relevance, not a single global breakfast/lunch/dinner schedule.
- Recommendation ranking inside a tier remains future implementation work.
- Live menu, profile, inventory-attention, and recommendation adapters depend on accepted backend contracts.
- Public claims and final media require product, privacy, accessibility, and legal review before launch.
- The GitHub connector exposes single-file content commits but not a repository tree-read operation in this session. The initial registration commit therefore cannot include the registry atomically; the exception is recorded here and the branch will be reconciled before review.

## Execution state

- **Current checkpoint:** Plan registered on the working branch; no canonical product document has been changed yet.
- **Run delivery target:** Complete the full documentation package and future implementation plan in this run.
- **Delivered outcome:** Initial plan registration only.
- **Acceptance criteria resolved:** None yet.
- **Files or areas materially changed:** This plan only.
- **Documentation delivered:** Initial execution plan.
- **Validation performed:** Confirmed the branch starts from the current repository documentation baseline and avoids PLAN-0008/PLAN-0009 numbering conflicts.
- **Known failures or limitations:** Registry synchronization is pending because the connector creates one content-file commit per operation.
- **Blockers:** None.
- **Partially modified areas:** Documentation package not yet started.
- **Exact next action:** Open the draft pull request, create the canonical product document and PLAN-0011, then update all affected accepted documents and finalize this plan and registry.
- **Working tree state:** Remote branch contains only this initial plan commit.

## Progress log

### 2026-07-30T02:10:00Z — AI product-documentation agent

- **Run delivery target:** Complete the accepted entry/home specification and future implementation plan.
- **Checkpoint:** Registered PLAN-0010 on `agent/plan-0010-contextual-home-experience`.
- **Files materially changed:** `docs/plans/PLAN-0010-define-entry-and-contextual-home.md`.
- **Documentation delivered:** Initial plan and explicit decisions, scope, acceptance criteria, risks, and handoff.
- **Validation performed:** Reviewed current plan numbers and related accepted product/domain documents.
- **Known failures or limitations:** The connector's single-file contents operation prevented atomic initial plan-and-registry creation; this is an explicit temporary exception to be reconciled before review.
- **Blockers:** None.
- **Exact next action:** Open a draft PR, create the canonical product specification and future implementation plan, then update the affected documents and registry.
