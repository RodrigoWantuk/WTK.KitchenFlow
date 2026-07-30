# PLAN-0010: Define the Public Entry and Contextual Home Experience

- **Status:** Completed
- **Type:** Documentation
- **Priority:** High
- **Owner:** AI product-documentation agent
- **Created:** 2026-07-30
- **Last updated:** 2026-07-30
- **Branch:** `agent/plan-0010-contextual-home-experience`
- **Pull request:** [PR #11](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/11)
- **Related implementation plan:** PLAN-0011
- **Related plans:** PLAN-0004
- **Related product documents:** `docs/product/entry-and-contextual-home.md`, `docs/product/user-journeys.md`, `docs/product/initial-release.md`
- **Related domain documents:** `docs/domain/planning-and-shopping.md`

## Objective

Convert the stakeholder decision for the public landing page and authenticated home into accepted, testable product behavior and an executable future implementation plan.

The resulting documentation defines:

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
- **Delivered outcome:** Complete accepted specification, synchronized product and domain documentation, and implementation-ready PLAN-0011.
- **Acceptance criteria resolved:** All PLAN-0010 acceptance criteria.
- **Why this is substantial:** The delivery defines a cross-cutting product entry point and home decision surface spanning product, planning, localization, accessibility, privacy, AI degradation, telemetry, performance, and frontend/backend boundaries.
- **Valid early-stop reason, when target was not reached:** Not applicable; the intended run target was reached.

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
- updated `docs/product/user-journeys.md`;
- updated `docs/product/initial-release.md`;
- updated `docs/domain/planning-and-shopping.md`;
- updated `docs/README.md` reading paths and non-negotiable summary;
- PLAN-0011 for future implementation;
- synchronized `docs/plan-status.md` entries.

## Acceptance criteria

- [x] Public entry behavior is concise, truthful, accessible, localized, and understandable without rich media.
- [x] Authenticated home behavior defines greeting, primary question, and neutral fallbacks.
- [x] Local timezone and daypart handling are explicit and do not require precise geolocation.
- [x] The four suggestion tiers and their ordering are explicit.
- [x] Menu, inventory, profile, and quick-chooser fallbacks are explicit.
- [x] Urgency remains advisory and explainable.
- [x] AI-unavailable behavior remains useful and authoritative state remains unchanged.
- [x] Accessibility, responsive behavior, reduced motion, captions/transcripts, localization, privacy, and safe telemetry are covered.
- [x] A future implementation plan defines phases, dependencies, contracts, validation, and handoff.
- [x] Existing canonical documents and the registry are synchronized in the final branch state.

## Documentation completeness

### Durable documentation

- Product and user behavior: Completed in the canonical entry/home specification, journeys, and initial-release definition.
- Domain rules and invariants: Completed in planning and shopping, including source ordering, advisory urgency, independent degradation, and no-mutation rules.
- Architecture and ADRs: No new architectural decision was required; existing frontend/backend, authentication, generated-contract, AI Gateway, and authoritative-state boundaries remain binding.
- APIs, events, schemas, prompts, and generated contracts: No executable contract changed. PLAN-0011 defines the required future contract capabilities and generated-client boundary.
- Configuration and environment variables: No runtime configuration changed. PLAN-0011 identifies timezone, prototype isolation, media, and telemetry concerns for implementation.
- Migrations, compatibility, rollback, or forward repair: Not applicable; documentation-only delivery.
- Deployment, observability, alerts, runbooks, backup, restore, and support: No deployment artifact changed. Product-level media degradation, partial-source failure, support trace IDs, and privacy-safe telemetry requirements are documented.
- Security, privacy, food safety, AI cost, localization, accessibility, performance, and resilience: Covered through no precise location, no public personal data, no direct frontend AI, advisory urgency, safe telemetry, media fallbacks, three locales, accessible interactions, progressive source rendering, and AI degradation.
- Test strategy, fixtures, commands, evidence, limitations, and handoff: PLAN-0011 defines unit, component, browser, accessibility, localization, timezone, telemetry-redaction, source-priority, and production-isolation validation.

### Code-level documentation

No executable code changed. XML documentation, TSDoc/JSDoc, generated-code comments, and inline-code comments were not applicable to this documentation-only delivery. PLAN-0011 requires TSDoc/JSDoc for non-self-evident reusable frontend contracts when implementation begins.

## Validation performed

- Cross-checked the canonical specification against the accepted product vision, journeys, release scope, planning invariants, AI degradation, privacy, localization, accessibility, and frontend/backend boundaries.
- Confirmed the same source order appears in the canonical product document, release definition, user journey, planning domain rule, documentation summary, and PLAN-0011.
- Confirmed the specification does not authorize direct frontend AI calls, precise-location collection, server-time meal inference, silent plan mutation, forced urgent-item selection, hidden profile mutation, browser token storage, or authoritative client-side inventory behavior.
- Confirmed public content remains understandable without video or animation and requires captions, transcript, controls, static fallback, reduced motion, and reduced-data behavior when rich media exists.
- Confirmed missing menu, inventory, profile, recommendation, and AI sources degrade independently.
- Confirmed PLAN-0011 separates mock-backed frontend work from later live-contract integration.
- Reviewed the branch comparison with `main`: the change set contains only Markdown documentation and plan files.
- Confirmed all new document and plan links use repository-relative paths and the final registry records each plan once.

No executable test command was applicable because no executable source, dependency, contract snapshot, migration, or infrastructure resource changed.

## Risks and limitations

- Exact daypart boundaries require locale-aware product research and may evolve; the product rule is local-time relevance, not a single global breakfast/lunch/dinner schedule.
- Recommendation ranking inside a tier remains future implementation work.
- Live menu, profile, inventory-attention, and recommendation adapters depend on accepted backend contracts.
- Public claims and final media require product, privacy, accessibility, and legal review before launch.
- The GitHub connector exposed single-file content commits but no usable repository tree-read/write transaction for this session. Initial plan registration and registry synchronization therefore occurred in sequential commits rather than one atomic commit. The exception is recorded openly; the final PR branch state synchronizes PLAN-0010, PLAN-0011, and the registry before review.

## Execution state

- **Current checkpoint:** Documentation package complete and PR #11 ready for owner review.
- **Run delivery target:** Complete the full documentation package and future implementation plan in this run.
- **Delivered outcome:** Canonical public-entry/contextual-home behavior, synchronized journeys/release/domain documentation, and detailed future implementation plan.
- **Acceptance criteria resolved:** All.
- **Files or areas materially changed:** Documentation index; product entry/home specification; product journeys; initial release; planning and shopping; PLAN-0010; PLAN-0011; central registry.
- **Documentation delivered:** Complete durable documentation package listed above.
- **Validation performed:** Cross-document consistency, architecture-boundary, privacy, accessibility, localization, degradation, source-priority, link, and Markdown-only diff review.
- **Known failures or limitations:** No executable validation was applicable; exact daypart policy and live contracts remain future work.
- **Blockers:** Owner review and merge are delivery dependencies, not execution blockers.
- **Partially modified areas:** None.
- **Exact next action:** Owner reviews and merges PR #11. After the authoritative frontend snapshot is integrated, an implementation agent claims PLAN-0011 and delivers its public-entry and mock-backed-home phases before live adapters.
- **Working tree state:** Remote branch fully committed; no hidden local work.

## Progress log

### 2026-07-30T02:10:00Z — AI product-documentation agent

- **Run delivery target:** Complete the accepted entry/home specification and future implementation plan.
- **Checkpoint:** Registered PLAN-0010 on `agent/plan-0010-contextual-home-experience`.
- **Files materially changed:** `docs/plans/PLAN-0010-define-entry-and-contextual-home.md`.
- **Documentation delivered:** Initial plan and explicit decisions, scope, acceptance criteria, risks, and handoff.
- **Validation performed:** Reviewed current plan numbers and related accepted product/domain documents.
- **Known failures or limitations:** The connector's single-file contents operation prevented atomic initial plan-and-registry creation; this temporary exception is reconciled in the final branch state.
- **Blockers:** None.
- **Exact next action:** Create the canonical specification and future implementation plan, then update affected documents and registry.

### 2026-07-30T02:38:00Z — AI product-documentation agent

- **Run delivery target:** Complete the accepted entry/home specification and future implementation plan.
- **Checkpoint:** Completed PLAN-0010 and prepared PR #11 for review.
- **Files materially changed:** `docs/README.md`, `docs/product/entry-and-contextual-home.md`, `docs/product/user-journeys.md`, `docs/product/initial-release.md`, `docs/domain/planning-and-shopping.md`, PLAN-0010, PLAN-0011, and `docs/plan-status.md`.
- **Documentation delivered:** Accepted public-entry and contextual-home behavior; local-time, tier-priority, fallback, accessibility, privacy, telemetry, and AI-degradation rules; future implementation phases, contracts, tests, and handoff.
- **Validation performed:** Cross-document consistency review, architectural-boundary review, privacy/accessibility/localization review, relative-link review, and branch comparison confirming documentation-only scope.
- **Known failures or limitations:** Exact localized daypart boundaries and live endpoint shapes remain intentionally deferred to PLAN-0011.
- **Blockers:** None for PLAN-0010. PLAN-0011 is blocked by the authoritative frontend import and live source contracts.
- **Exact next action:** Synchronize the registry in the final branch commit, update the PR description, and request owner review.
