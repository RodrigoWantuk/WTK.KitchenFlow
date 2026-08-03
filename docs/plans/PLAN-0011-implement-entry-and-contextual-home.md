# PLAN-0011: Implement the Public Entry and Contextual Home Experience

- **Status:** Completed
- **Type:** Implementation
- **Priority:** High
- **Owner:** Cursor agent (PLAN-0011 contract hardening)
- **Created:** 2026-07-30
- **Last updated:** 2026-08-02T19:45:00Z
- **Branch:** `agent/plan-0011-contextual-home`
- **Pull request:** [PR #34](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/34) (**Merged**)
- **Merge commit:** `eb9e92c21ac817e497235168786daeb3f35c30cd` (2026-08-02T23:39:13Z)
- **Binding amendment:** [`PLAN-0011-amendment-2026-08-02-next-execution.md`](PLAN-0011-amendment-2026-08-02-next-execution.md)
- **Related documentation plan:** PLAN-0010
- **Related frontend plan:** PLAN-0014 (on main); remediation [PLAN-0015](PLAN-0015-remediate-frontend-baseline.md) (**Completed**; manual visual/NVDA/VoiceOver deferred as non-blocking)
- **Related production integration plan:** [PLAN-0016](PLAN-0016-implement-production-session-and-inventory-frontend.md) (**Completed**; merged via PR #25)
- **Related live-sources plan:** [PLAN-0021](PLAN-0021-implement-contextual-home-live-sources.md) (owns former Phase 3/4)
- **Related product document:** `docs/product/entry-and-contextual-home.md`
- **Dependencies:** PLAN-0019 merged (`444969c`); PLAN-0016 on `main`; host `NOTEBOOK-DEB-RODRIGO` GitHub App workflow available. Live home contracts deferred to PLAN-0021.

## Objective

Implement a responsive, accessible public entry page and authenticated contextual home that help a user understand the product before login and answer the primary question “What shall we cook today?” after login.

The implementation must preserve the accepted source priority:

1. relevant accepted menu entries;
2. current-inventory suggestions, prioritizing products needing attention;
3. profile-based suggestions;
4. a one- or two-question quick chooser.

## Blocking state

None for PLAN-0011 Phase 1 + Phase 2 presentation scope. Live contextual-home sources remain PLAN-0021.

## Scope

### Included

- signed-out public landing route and authenticated home route;
- backend-managed authentication redirect integration;
- concise product briefing and optional rich demonstration media;
- static, reduced-motion, reduced-data, caption, and transcript fallbacks;
- personal greeting with neutral fallback;
- local-time and daypart context using explicit or browser IANA timezone;
- source-tier composition, source labels, explanation, and independent failure states;
- quick chooser with one or two questions;
- typed presentation/application models and source adapter boundaries;
- synthetic prototype adapters followed by generated-contract live adapters;
- localization in English, Portuguese (Brazil), and Spanish;
- accessibility, responsive behavior, performance, privacy-safe telemetry, degraded AI behavior, and tests.

### Explicitly excluded

- final brand rename or repository migration;
- direct AI-provider calls from the frontend;
- a new authentication provider or browser token storage;
- authoritative inventory, menu, or profile logic in React;
- exact model/provider selection;
- hidden profile mutation from questionnaire answers;
- precise-location permission;
- sponsored recommendation placement;
- final legal copy or unreviewed marketing claims.

## Architectural boundaries

- The backend owns session, user identity, authoritative data, recommendation orchestration, quotas, and validated AI access.
- The frontend consumes generated OpenAPI contracts through application-owned adapters.
- Presentation components depend on application models and source interfaces, not raw generated DTOs.
- Prototype fixtures are synthetic, isolated, and excluded from production paths.
- The home may aggregate multiple backend sources, but a source failure must not erase successful tiers.
- The server timezone is never treated as the user's meal context.
- Timezone is an IANA identifier; fixed UTC offsets are insufficient for saved behavior.
- Suggestion display never mutates accepted plans, reservations, inventory, profile, or execution state.

## Delivery phases

### Phase 1 — Public entry

Deliver the signed-out page with:

- concise value proposition;
- truthful feature overview;
- login/account CTA through backend redirect;
- adult-only notice and legal-link placeholders;
- optional video, animation, or interactive walkthrough;
- static fallback, captions, transcript, keyboard control, and reduced-motion behavior;
- responsive and localization-complete presentation;
- no personal data or authenticated API call in public rendering.

### Phase 2 — Mock-backed authenticated home

Deliver a production-aligned presentation using typed synthetic adapters:

- greeting and primary question;
- local daypart scenarios;
- all four source tiers;
- no-menu, empty-inventory, incomplete-profile, AI-unavailable, API-failure, stale-conflict, and no-candidate states;
- quick chooser cancellation, skip, one-question, and two-question paths;
- source explanations, time, effort, missing-item, readiness, and urgency presentation;
- development-only scenario coverage and gallery integration.

### Phase 3 — Contract design and generation

Define or consume accepted contracts for:

- session/display-name/timezone context;
- relevant accepted menu entries and readiness;
- inventory-attention candidates;
- profile-fit candidates;
- quick-chooser question definitions and request context;
- suggestion explanation, source, capability state, and traceable failure data.

Generate frontend types reproducibly. Do not handwrite a duplicate live DTO model.

### Phase 4 — Live source adapters

Integrate each tier independently. Preserve partial success and source-specific failures. Add cancellation, request correlation, retry boundaries, cache policy, freshness semantics, ETag/version behavior where applicable, and privacy-safe telemetry.

### Phase 5 — Validation and hardening

Complete automated and manual validation, correct defects, update durable and code-level documentation, pin the final system-under-test baseline, and hand off to an independent test plan when risk justifies it.

## Functional requirements

### Routing and session

- Signed-out `/` displays the public entry.
- Signed-in navigation reaches the authenticated home without exposing tokens.
- Protected-route session failure redirects to login while preserving an allowed return path.
- Login starts through the backend redirect; React never collects the identity-provider password.

### Greeting and timezone

- Use a safe display name only when provided by the authenticated session/profile contract.
- Provide neutral fallback copy.
- Prefer saved timezone, then browser IANA timezone, then neutral context.
- Let the user review and override the saved timezone.
- Test daylight-saving transitions and invalid/obsolete timezone identifiers.

### Tier ordering

- Tier 1 appears before Tier 2 when relevant accepted menu candidates exist.
- Tier 2 appears before Tier 3 when usable inventory candidates exist.
- Tier 3 follows confirmed profile context.
- Tier 4 remains a visible explicit action and may also become the primary empty-state action.
- The UI may use sections or a feed, but tests must be able to assert source priority.

### Quick chooser

- Ask one question when sufficient; never ask more than two in this flow.
- Do not ask for context already known with sufficient confidence.
- Answers remain request-scoped unless the user explicitly saves a preference.
- The user can cancel, skip, go back, and retry.
- Validation and errors are announced accessibly.

### Degradation

- Scheduled meals, stored recipe instructions, deterministic readiness, deterministic inventory attention, favorites, active cooking, and navigation remain available without AI where their backing services are available.
- AI-only generation/adaptation displays a truthful capability state and retry path.
- One failed tier does not blank the entire home.

## Contract expectations

Contracts must represent at least:

- local date/time context and timezone source;
- suggestion source tier;
- reason codes suitable for localization;
- recipe/preparation identity and revision;
- readiness, required preparation, missing items, and uncertainty;
- estimated active/total time and effort when available;
- inventory-attention influences without leaking unrelated private inventory;
- capability status and recoverable error code;
- question ID, localized prompt key, answer options, and request-scoped answer schema;
- trace ID for safe support without exposing sensitive content.

Exact endpoints require a separate accepted contract design if existing modules cannot supply them cleanly.

## Accessibility and localization

- Validate 360 px, 768 px, 1280 px, intermediate widths, 200% zoom, keyboard-only, touch, screen reader, and virtual keyboard behavior.
- Respect reduced motion and reduced data.
- Rich media has captions, transcript, accessible names, controls, and static fallback.
- Suggestion source, readiness, urgency, and errors are not color-only.
- All visible strings are localization keys with complete `en`, `pt-BR`, and `es` resources.
- Dates, times, dayparts, units, decimals, and pluralization are locale-aware.

## Privacy, security, and telemetry

- Do not request precise location for meal context.
- Do not place access/refresh tokens in browser storage.
- Do not emit pantry items, private notes, restrictions, recipe text, questionnaire answers, cookies, authorization headers, or CSRF tokens into telemetry.
- Telemetry may use bounded reason/source codes and pseudonymous session-safe correlation under accepted consent policy.
- Public rendering contains no authenticated data.
- Demonstration fixtures contain no real personal data or copyrighted recipe text.

## Performance and resilience

- Public core content renders without rich media.
- Responsive images/video use bounded sizes and lazy loading where appropriate.
- Home tiers can render progressively without layout instability that harms interaction.
- Timezone/daypart calculation is deterministic and testable.
- Retry behavior is bounded and user initiated where a repeated request could incur AI cost.
- Cached suggestions display freshness and must not appear as current when their source context is stale.

## Test requirements

Automated coverage must include:

- route/session behavior;
- source-tier priority and independent omission;
- current local time around midnight and daypart boundaries;
- multiple IANA timezones and daylight-saving transitions;
- invalid timezone fallback;
- menu/no-menu, inventory/no-inventory, complete/incomplete-profile states;
- urgency explanation without forced selection;
- one-question and two-question quick chooser;
- cancellation, retry, stale conflict, partial-source failure, and AI-unavailable behavior;
- localization resource completeness and text expansion;
- keyboard, focus, dialog, live-region, and reduced-motion behavior;
- public-page static/media fallback;
- telemetry redaction;
- production isolation of fixtures/scenario controls;
- build, type-check, lint, unit/component tests, browser tests, and accessibility checks.

## Acceptance criteria

- [x] A signed-out adult visitor can understand the product and reach authentication without rich media.
- [x] Rich demonstration media satisfies accessibility and fallback requirements.
- [x] An authenticated user sees a safe greeting and the primary cooking question.
- [x] Local-time context uses a valid user/browser IANA timezone and supports override.
- [x] All four source tiers are implemented in the accepted order.
- [x] Each suggestion communicates its source and material reasoning.
- [x] Urgent inventory is prioritized but never forced.
- [x] The quick chooser asks no more than two material questions and does not silently change the profile.
- [x] Missing context and source failures degrade independently.
- [x] AI unavailability preserves deterministic and stored workflows.
- [x] Frontend, backend, AI Gateway, authentication, privacy, and authoritative-state boundaries remain intact.
- [x] Required automated and manual validation passes (local gates + browser smoke + exact-head Frontend/PLAN-0005 CI Passed).
- [x] Durable documentation and TSDoc/JSDoc are complete where applicable.

## Execution state

- **Current checkpoint:** Merged via PR #34 at `eb9e92c21ac817e497235168786daeb3f35c30cd`.
- **Exact tip SHA (functional implementation tip):** `9079887c7aa8d7d41691de6752381883346fabee`
- **CI-validated tip:** `9017e7e0cf6f3243bd18f0a4fa5fce105e91f5f4`
- **Review baseline (final hardening):** `ca2dc3685dd4a4dec659724d6fe67e72a78cfd53`
- **Exact next action:** None for PLAN-0011 implementation — follow-on work is PLAN-0020 / PLAN-0021.
- **Blockers:** None.
- **Working tree state:** Delivery reconciled on `main` after owner merge.

## Progress log

### 2026-08-03T00:10:00Z — PLAN-0020 claim (post-merge reconciliation)

- **Checkpoint:** PR #34 merge recorded on `main` as `eb9e92c21ac817e497235168786daeb3f35c30cd`. Delivery updated from draft/awaiting merge to **Merged**.
- **Changes included in the commit:** PLAN-0011 / amendment / registry / evidence delivery truth only (immutable functional/CI tips preserved).
- **Validation performed:** `github-app-run gh pr view 34` state MERGED; `origin/main` tip includes merge commit.
- **Next action:** PLAN-0020 owns subsequent frontend profile work.
- **Blockers or handoff notes:** Live contextual-home sources remain PLAN-0021.

### 2026-08-02T19:45:00Z — Cursor agent (PLAN-0011 contract hardening)

- **Checkpoint:** Exact-head Frontend + PLAN-0005 green on `9017e7e`; PLAN-0011 returned to **Completed**.
- **Changes included in the commit:** Plan/registry/evidence/amendment completion; PR body reconciliation.
- **Validation performed:** Frontend run `30763598158` (quality + browser-smoke success); PLAN-0005 run `30763598175` (p0/p1/evidence-consistency success) on `9017e7e0cf6f3243bd18f0a4fa5fce105e91f5f4`. Branch 0 behind `main`, MERGEABLE, draft, reviewer `RodrigoWantuk`, no unresolved threads.
- **Next action:** Owner review of draft PR #34 only — no agent merge.
- **Blockers or handoff notes:** Next frontend plan PLAN-0020; live contextual-home PLAN-0021.

### 2026-08-02T19:40:00Z — Cursor agent (PLAN-0011 contract hardening)

- **Checkpoint:** Functional tip recorded as `9079887c7aa8d7d41691de6752381883346fabee`.
- **Changes included in the commit:** Evidence/plan tip SHA + registry next action.
- **Validation performed:** Same local gates as functional commit (not re-run for packaging).
- **Next action:** Push; await exact-head CI; mark Completed when green.
- **Blockers or handoff notes:** Keep draft; no agent merge.

### 2026-08-02T19:35:00Z — Cursor agent (PLAN-0011 contract hardening)

- **Checkpoint:** Discriminated chooser definition + runtime normalize + exhaustive QuickChooser landed; local gates Passed.
- **Changes included in the commit:** `HomeQuickChooserDefinition` union; `validateHomeQuickChooserDefinition` / normalize; boundary wire; QuickChooser switch; adapters/tests/i18n; docs/plan/registry/evidence.
- **Validation performed:** `yarn typecheck`, `lint`, `format:check`, `test`, `guard:*`, `build` / `build:prototype` / `build:production`, `inspect:production-bundle`, `audit:policy`, `check:api-client-drift`, `typecheck:api-client`, `format:check:api-client`, `smoke:browser:ci` Passed. `validate:firefox-native-zoom` Failed locally (Firefox root/`$HOME` ownership).
- **Next action:** Record functional tip SHA; push; await exact-head CI.
- **Blockers or handoff notes:** Keep draft; no agent merge. Functional tip: `9079887c7aa8d7d41691de6752381883346fabee`.


### 2026-08-02T18:40:00Z — Cursor agent (PLAN-0011 final remediation)

- **Checkpoint:** Residual remediations verified; Frontend + PLAN-0005 exact-head CI green; PLAN-0011 returned to **Completed**.
- **Changes included in the commit:** Plan/registry/evidence completion; PR body reconciliation.
- **Validation performed:** Frontend run `30761370986` (quality + browser-smoke success); PLAN-0005 run `30761370988` (p0/p1/evidence-consistency success) on `f3fc22e6edbcbb422ae116c8afc46206ae3ec4e8`.
- **Next action:** Owner review of draft PR #34 only — no agent merge.
- **Blockers or handoff notes:** Next frontend plan PLAN-0020; live contextual-home PLAN-0021.


### 2026-08-02T18:40:00Z — Cursor agent (PLAN-0011 final remediation)

- **Checkpoint:** Residual remediations implemented (definition retry, suggestion status/telemetry, HomeDisplayText, reduced-motion unknown → auto).
- **Changes included in the commit:** Contracts, QuickChooser/ContextualHomePage, PublicEntryPage, mocks, i18n, tests, docs/plan/registry.
- **Validation performed:** typecheck/lint/format/test (208)/guards/builds/isolation/api-client/smoke Passed.
- **Next action:** Push draft PR #34; await exact-head CI.
- **Blockers or handoff notes:** Keep draft; no agent merge.


### 2026-08-02T18:30:00Z — Cursor agent (PLAN-0011 final remediation)

- **Checkpoint:** Restored **In Progress** for residual contract/retry/telemetry/a11y gaps on tip `893b8a4`.
- **Changes included in the commit:** Plan/registry claim + functional residual remediations.
- **Validation performed:** Host `NOTEBOOK-DEB-RODRIGO`; branch synced at review baseline.
- **Next action:** Land residual fixes; local gates; exact-head CI; return Completed only when green.
- **Blockers or handoff notes:** Keep draft; no agent merge.


### 2026-08-02T17:45:00Z — Cursor agent (PLAN-0011 remediation)

- **Checkpoint:** Remediations verified; Frontend + PLAN-0005 exact-head CI green; PLAN-0011 returned to **Completed**.
- **Changes included in the commit:** Plan/registry/evidence completion; PR body reconciliation.
- **Validation performed:** Frontend run `30759307393` (quality + browser-smoke success); PLAN-0005 run `30759307434` (p0/p1/evidence-consistency success) on `8849133ec1427d57286f4974a665797c3309ec80`.
- **Next action:** Owner review of draft PR #34 only — no agent merge.
- **Blockers or handoff notes:** Next frontend plan PLAN-0020; live contextual-home PLAN-0021.


### 2026-08-02T17:42:00Z — Cursor agent (PLAN-0011 remediation)

- **Checkpoint:** Pinned functional remediation tip `febbd5eb2642b77ed2e4848db721b77ac5e0caac`.
- **Changes included in the commit:** Plan/registry/evidence tip SHA packaging only.
- **Validation performed:** Same local gates as remediation commit; CI pending after push.
- **Next action:** Push and await exact-head CI.
- **Blockers or handoff notes:** Keep draft; no agent merge.


### 2026-08-02T17:40:00Z — Cursor agent (PLAN-0011 remediation)

- **Checkpoint:** Implemented remediations 1–6 against review baseline `2bdcd4f`.
- **Changes included in the commit:** Expanded `HomeSuggestionCandidate` presentation model + mock scenarios; Radix Dialog QuickChooser with abort/cancel/stale-attempt; generation-counter stale protection; deterministic immutable-per-scenario prototype route; `retryable` contract; reduced-motion public CTA; tests; smoke coverage; docs.
- **Validation performed:** `yarn typecheck/lint/format:check/test` (197); guards; builds + production isolation; api-client drift; `yarn smoke:browser:ci` Passed (incl. public reduced-motion CTA). Local Firefox zoom blocked by environment.
- **Next action:** Push draft PR #34; await exact-head Frontend + PLAN-0005 CI.
- **Blockers or handoff notes:** Keep draft; no agent approve/merge. Next frontend plan after merge: PLAN-0020; live home: PLAN-0021.


### 2026-08-02T17:23:05Z — Cursor agent (PLAN-0011 remediation)

- **Checkpoint:** Restored **In Progress** after review found unresolved blockers on PR #34 tip `2bdcd4f`.
- **Changes included in the commit:** Plan/registry remediation claim; begin remediations 1–6.
- **Validation performed:** Host `NOTEBOOK-DEB-RODRIGO`; branch synced; PR #34 draft; CI was green on baseline but product blockers remain.
- **Next action:** Implement expanded presentation model, Radix modal chooser, stale protection, deterministic scenarios, retryability, reduced motion.
- **Blockers or handoff notes:** Keep draft until all blockers fixed and exact-head CI green.



### 2026-08-02T16:52:10Z — Cursor agent (PLAN-0011)

- **Checkpoint:** Amended Phase 1+2 **Completed**. Exact head CI green after PLAN-0005 p0 flake rerun.
- **Changes included in the commit:** Plan/registry completion metadata; PR workflow IDs.
- **Validation performed:** Frontend quality+browser-smoke success; PLAN-0005 p0/p1/evidence-consistency success on `c895b4ce2282f6b8df6ca8bfc5fff64caea4f990` (run `30757026929` after `--failed` rerun).
- **Next action:** Owner review of draft PR #34 only — no agent merge.
- **Blockers or handoff notes:** Next frontend plan PLAN-0020; live contextual-home PLAN-0021.


### 2026-08-02T16:36:30Z — Cursor agent (PLAN-0011)

- **Checkpoint:** Recorded tip SHA `f7d516089a077b39bd9c95c7cc157f44443eaa7d` in plan/registry/evidence after hardening commit.
- **Changes included in the commit:** Tip SHA packaging only.
- **Validation performed:** Same local gates as hardening commit; CI pending on push.
- **Next action:** Push and await exact-head CI.
- **Blockers or handoff notes:** None.


### 2026-08-02T16:35:00Z — Cursor agent (PLAN-0011)

- **Checkpoint:** Fixed public-route session bootstrap and Phase 1+2 hardening gaps; reconciled PLAN-0019 merge metadata; deleted redundant PLAN-0019 refs after identical-tree verification.
- **Changes included in the commit:** SessionScopedRoutes for access/app only; PublicEntryPage without useSession; progressive source load/retry; timezone override; chooser retry; empty-menu omit; one/two-question scenarios; expanded tests; docs.
- **Validation performed:** Local frontend gates Passed; browser smoke Passed; Firefox zoom local environment blocked (CI covers).
- **Next action:** Push and await exact-head CI for draft PR #34.
- **Blockers or handoff notes:** Next frontend plan PLAN-0020; live home PLAN-0021.


### 2026-08-02T14:48:30Z — Cursor agent (PLAN-0011)

- **Checkpoint:** Repaired tip/CI metadata after shell expansion emptied SHAs; functional tip `76e4f962bfc011531fc1f83aa4a41bbf53a1dfff` remains the CI-green product tip.
- **Changes included in the commit:** Plan, registry, and evidence tip/CI fields restored.
- **Validation performed:** Frontend `30752619945`, PLAN-0005 `30752619970` success on `76e4f962bfc011531fc1f83aa4a41bbf53a1dfff`.
- **Next action:** Owner review of draft PR #34 (no agent merge).
- **Blockers or handoff notes:** PLAN-0021 for live sources.



### 2026-08-02T14:42:00Z — Cursor agent (PLAN-0011)

- **Checkpoint:** Fix PLAN-0005 Firefox zoom home CTA after Phase 2 replaced Today suggestions.
- **Changes included in the commit:** Point native-zoom/diagnose scripts at `home-nav-pantry` → `/app/despensa`.
- **Validation performed:** Frontend CI green on `6ba87b2`; PLAN-0005 p0 failed on missing `sugg-open-r2`; retest after this fix.
- **Next action:** Push fix and wait for Backend/Frontend/PLAN-0005 green on new tip.
- **Blockers or handoff notes:** None.


### 2026-08-02T14:28:45Z — Cursor agent (PLAN-0011)

- **Checkpoint:** Phase 1 public entry + Phase 2 mock-backed contextual home implemented with tests and production isolation.
- **Changes included in the commit:** Presentation models; public entry; contextual home UI + quick chooser; mock/unavailable adapters; runtime wiring; i18n; Jest; smoke/zoom updates; docs/evidence; plan/registry.
- **Validation performed:** Local frontend gates + api-client drift Passed; browser smoke/CI pending after push.
- **Next action:** Draft PR + wait for required workflows on final head.
- **Blockers or handoff notes:** PLAN-0021 owns live sources.

### 2026-08-02T14:12:42Z — Cursor agent (PLAN-0011)

- **Checkpoint:** Claimed **In Progress** after confirming PR #33 / PLAN-0019 on `main` (`444969c`) and host GitHub App workflow.
- **Changes included in the commit:** Plan header, blocking state, execution state, progress log, and registry row. No feature code yet.
- **Substantial run target:** Phase 1 + Phase 2 as one frontend delivery; live contracts deferred to PLAN-0021.
- **Next action:** Implement public entry + mock-backed contextual home with tests and production isolation.
- **Blockers or handoff notes:** None for amended scope.

### 2026-08-02T12:05:00Z — agent:composer-plan-0016

- **Checkpoint:** Unblocked to **Ready** after PLAN-0016 Completed / post-rebase Pass (`38e5edfb49407d895995e0cf1b49054dc7ce5c5b`).
- **Changes included in the commit:** Status, dependencies, execution state, and registry row. No PLAN-0011 feature work.
- **Next action:** Claim and start Phase 1.
- **Blockers or handoff notes:** Live contracts still required for later live phases.

### 2026-08-02T00:15:00Z — agent:composer-plan-0016

- **Checkpoint:** Blocker restated — PLAN-0015 Completed (manual deferred non-blocking); current prerequisite is PLAN-0016 + independent PLAN-0005 retest.
- **Changes included in the commit:** Dependencies, blocking state, execution state, and registry row updated. No PLAN-0011 feature work.
- **Result:** Plan remains Blocked.
- **Next action:** Do not claim until PLAN-0016 remediation passes independent retest.
- **Blockers or handoff notes:** Residual #20/#21/#22/#24.

### 2026-07-31T22:47:18Z — Cursor agent (PLAN-0015)

- **Checkpoint:** Re-blocked pending PLAN-0015 owner approval; PLAN-0014 code remains on main but is not a sufficient unblock alone.
- **Next action:** Do not claim until PLAN-0015 is approved.
- **Blockers or handoff notes:** Preserve PLAN-0014 UX surface; do not start competing frontend redesigns.

### 2026-07-31T22:21:00Z — Cursor agent

- **Checkpoint:** Temporarily marked Ready after PLAN-0014 merge (superseded by PLAN-0015 re-block).
- **Next action:** Superseded — wait for PLAN-0015 approval.
- **Blockers or handoff notes:** Live menu/profile/inventory-attention/recommendation contracts still required for live phases.


### 2026-07-31T20:15:00Z — Cursor agent (PLAN-0014)

- **Checkpoint:** Dependency restated against PLAN-0014; plan remains Blocked.
- **Changes included in the commit:** Related frontend plan and blocker wording updated; PLAN-0004 reference replaced.
- **Validation performed:** Confirmed PLAN-0014 owns the Emergent import that unblocks this plan.
- **Result:** PLAN-0011 stays Blocked until PLAN-0014 baseline acceptance.
- **Next action:** Do not claim until PLAN-0014 completes the official frontend baseline.
- **Blockers or handoff notes:** None beyond documented blockers.
