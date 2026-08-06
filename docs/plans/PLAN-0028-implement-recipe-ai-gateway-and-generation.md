# PLAN-0028: Implement Recipe AI Gateway and Cook-Now Generation Vertical Slice

- **Status:** In Progress
- **Type:** Implementation
- **Priority:** Critical
- **Owner:** Cursor backend/frontend vertical-slice agent
- **Created:** 2026-08-05
- **Last updated:** 2026-08-05
- **Branch:** `agent/plan-0028-recipe-ai-gateway`
- **Pull request:** Not opened
- **Predecessor:** PLAN-0022 (protocol `0.3` Revised, merged via PR #43)
- **Related ADR:** ADR-0005
- **Related contracts:** `packages/contracts/ai/recipe/`

## Objective

Reconcile the remaining initial-release roadmap after PLAN-0022 and deliver the first production cook-now recipe AI vertical slice:

```text
current inventory and profile
→ request cook-now candidates
→ display three validated candidates
→ select one candidate
→ expand into a normalized recipe
→ persist a user-owned recipe revision
→ open the saved recipe in the production frontend
```

## Included scope

- roadmap reconciliation and initial-release delivery map;
- AI Gateway foundation (`KitchenFlow.Modules.Ai`);
- DeepSeek provider adapter (replaceable, server-side secrets only);
- usage reservation and settlement ledger (no billing UI);
- Recipes module with generation sessions, candidate snapshots, and immutable revisions;
- protocol `0.3` schema/semantic validation in .NET with fixture parity;
- authenticated cook-now API with idempotency and owner isolation;
- OpenAPI and generated TypeScript clients;
- production Recipes frontend routes `/app/receitas`, `/app/receitas/gerar`, `/app/receitas/:recipeId`;
- degraded AI-unavailable behavior;
- Draft placeholders for PLAN-0029 and PLAN-0030;
- lean targeted tests and one final CI execution.

## Excluded scope

- sequential planning, accepted menus, shopping projection (PLAN-0029);
- recipe thumbnail generation (PLAN-0030);
- contextual-home live menu sources (PLAN-0021);
- subscriptions, paid credits, billing UI;
- live DeepSeek calls in CI / rerunning PLAN-0022 campaign;
- independent validation plan or PR;
- guided cooking, import, sharing, notifications.

## Acceptance criteria

- [ ] Roadmap delivery map and stale plan reconciliation committed.
- [ ] AI Gateway registers `recipe.suggest_candidates.v1` and `recipe.expand_selected.v1`.
- [ ] DeepSeek adapter is replaceable; secrets absent from repository defaults.
- [ ] Usage ledger reserves, settles, and releases; ceilings and disablement enforced.
- [ ] Cook-now flow returns exactly three validated candidates or fails safely after one repair.
- [ ] Selected expansion persists one owner-isolated immutable recipe revision.
- [ ] Frontend production routes support generate → select → open saved recipe with localized unavailable states.
- [ ] OpenAPI drift, migration, focused backend/frontend tests, and recipe contract validators pass.
- [ ] Draft PR open; no approval/auto-merge/merge by the agent.

## Execution state

- **Current checkpoint:** Roadmap reconciled; Draft PR #44 open; AI/Recipes modules scaffolding and protocol validators in progress.
- **Run target:** Complete the cook-now vertical slice through focused validation and a Draft PR.
- **Blockers:** None.
- **Exact next action:** Complete Recipes application/persistence/API, OpenAPI clients, production frontend, focused tests, and final CI.

## Progress log

### 2026-08-05 — Claim

- Created branch `agent/plan-0028-recipe-ai-gateway` from main `cfec79546fcd5e476f7198cdc788a6ce251d35c5`.
- Registered PLAN-0028 as In Progress.

### 2026-08-05 — Roadmap reconciliation

- Added `docs/roadmap/initial-release-delivery-map.md`.
- Reconciled PLAN-0022 as merged through PR #43.
- Set PLAN-0021 to Blocked on PLAN-0029 accepted-menu read contract.
- Updated PLAN-0008 thumbnail amendment delivery (docs merged; implementation pending PLAN-0030).
- Created Draft PLAN-0029 and PLAN-0030 placeholders.
- Updated root README production capability list.

### 2026-08-05 — Backend scaffold in progress

- Added KitchenFlow.Modules.Ai (provider abstractions, Fake/DeepSeek providers, usage governor).
- Added KitchenFlow.Modules.Recipes protocol validators with fixture-parity unit tests and RecipeGenerationSession domain.
- Draft PR #44 opened for documentation reconciliation; implementation continues.
