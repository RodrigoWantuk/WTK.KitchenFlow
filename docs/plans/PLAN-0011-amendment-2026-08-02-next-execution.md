# PLAN-0011 Amendment: Immediate Execution Scope After PLAN-0016 Merge

- **Status:** Completed (amended Phase 1 + Phase 2; draft PR awaiting owner)
- **Effective:** 2026-08-02
- **Parent plan:** [`PLAN-0011`](PLAN-0011-implement-entry-and-contextual-home.md)
- **Supersedes:** Parent-plan dependency, branch-state, execution-state, and exact-next-action text that predates PR #25 merge
- **Current main baseline:** `444969ccd95526cb19730cfed8d016c9f299a7b7` (PLAN-0019 merge via PR #33)
- **Required branch:** `agent/plan-0011-contextual-home`
- **Draft PR:** [#34](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/34)

## Current truth

PLAN-0016 is merged through PR #25 at `e35c453acccd79f01398e51b7fe8ee4cb94f44a3`. Production session and authenticated inventory routes are on `main`. PR #32 subsequently added the host-specific GitHub App workflow to `AGENTS.md`. PLAN-0019 reconciled the roadmap and merged via PR #33 at `444969ccd95526cb19730cfed8d016c9f299a7b7`.

PLAN-0011 therefore has no blocker for its public-entry and mock-backed presentation scope. Live source contracts remain PLAN-0021.

## Binding execution boundary

The next PLAN-0011 execution delivers **Phase 1 and Phase 2 only** as one substantial outcome:

1. signed-out public entry;
2. mock-backed authenticated contextual home;
3. all required states, source ordering, localization, accessibility, responsive behavior, production isolation, and tests for those two phases.

Do not design or invent live backend DTOs, endpoints, menu state, recommendation orchestration, or AI Gateway calls inside this execution.

The parent plan's Phase 3 and Phase 4 are transferred to [`PLAN-0021`](PLAN-0021-implement-contextual-home-live-sources.md). PLAN-0021 will consume the stable presentation boundary produced here and accepted backend contracts.

## Required preservation

- Keep `apps/frontend` as the official monorepo source under ADR-0007.
- Preserve production inventory routes and the BFF session boundary.
- Do not regress generated-client drift, production isolation, Firefox zoom/pointer behavior, CSRF, ETag, idempotency, or absence of OIDC tokens in JavaScript storage.
- Do not replace the existing frontend wholesale or restart from another generated repository.
- Prototype fixtures and scenario controls remain excluded from production builds.
- Public rendering contains no authenticated API call or personal data.
- Mock home data is synthetic and clearly development/test scoped.

## Immediate run target

Deliver a complete reviewable frontend slice containing:

- public landing content and authentication CTA through the backend redirect;
- static demonstration/fallback content without requiring video;
- adult-only and policy-link placeholders without fabricated legal copy;
- authenticated greeting and local-daypart presentation;
- the stable “What shall we cook today?” orientation;
- four source tiers with visible source labels and deterministic ordering;
- quick chooser with one or two questions, cancellation, skip, retry, and no profile mutation;
- no-menu, empty-inventory, incomplete-profile, AI-unavailable, source-failure, stale, and no-candidate scenarios;
- complete `en`, `pt-BR`, and `es` resources;
- 360/768/1280/intermediate-width and 200% zoom behavior;
- keyboard, focus, reduced-motion, and screen-reader semantics;
- privacy-safe telemetry interfaces or explicit no-op boundary, without private payloads;
- unit/component/browser tests and production-isolation proof;
- durable frontend documentation and TSDoc/JSDoc where required.

## Host-specific publication rule

Before any remote Git or GitHub operation, read the final section of `AGENTS.md` in full and verify the exact hostname.

When the hostname is `NOTEBOOK-DEB-RODRIGO`:

- use `github-app-run git ...` or the documented `agent-git-remote` wrappers for fetch/pull/push;
- use `github-app-run gh ...` or `agent-gh` for GitHub CLI operations;
- use an `agent/` branch;
- open or update a pull request;
- request `RodrigoWantuk` as reviewer;
- never push directly to `main`;
- never run `gh pr merge`, `gh auth login`, or `gh auth logout`;
- never expose tokens, JWTs, or the GitHub App private key.

When the hostname differs, do not imitate, recreate, or access the host-specific GitHub App setup.

## Merge order and concurrency

PLAN-0011 should execute before PLAN-0020 if one developer owns both, because both may touch shared app shell, session, routing, and localization files. Concurrent execution requires an explicit file/contract coordination note and merge order.

PLAN-0021 must not start until the PLAN-0011 presentation models and states are stable.

## Acceptance criteria for this amendment

- [x] Phase 1 and Phase 2 are completed together or a real blocker is recorded.
- [x] No hand-written live home contract is introduced.
- [x] Existing production inventory/session behavior is preserved.
- [x] Public and mock home behavior is truthful, accessible, localized, and isolated.
- [x] Full frontend gates pass on the final head (Frontend + PLAN-0005 green on `c895b4c`).
- [x] Plan and registry are updated before every developer commit.
- [x] A draft PR requests `RodrigoWantuk` review.
- [x] The agent does not approve, auto-merge, or merge.

## Exact next action

Owner reviews draft PR #34; agent must not approve/merge. Next frontend: PLAN-0020. Live home: PLAN-0021.
