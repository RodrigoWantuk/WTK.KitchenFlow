# AGENTS.md

This file defines mandatory working rules for AI coding, testing, documentation, research, security, and operations agents in this repository.

## 1. Project identity

- Product: **KitchenFlow**.
- Repository and technical namespace: **WTK.KitchenFlow**.
- Product purpose: help adults transform available, planned, or purchasable food into useful meals with less effort, waste, and delivery dependence.
- Platform: responsive multilingual web application.
- Frontend: React and TypeScript generated and evolved through Lovable.
- Backend: .NET 10 / ASP.NET Core modular monolith with independently scalable workers.

## 2. Language policy

All technical work is written in English, including code, identifiers, comments, logs, documentation, ADRs, plans, branches, commits, issues, pull requests, tests, and test data descriptions.

User-facing content must be localization-ready. Do not hard-code interface copy in application logic or reusable components.

## 3. Mandatory reading

Before modifying the repository, read the complete required path in [`docs/README.md`](docs/README.md), including:

1. repository and agent rules;
2. plan registry and active plan;
3. accepted product vision;
4. the 2026-07-28 stakeholder discovery record;
5. architecture principles and applicable ADRs;
6. every product, domain, AI, security, testing, or operations document relevant to the change.

A future agent must be able to work from repository state without access to earlier conversations.

Do not infer that an undocumented requirement, technology, pattern, exception, or work status is approved.

## 4. Foundation behavior that must not be silently changed

- The central decision problem is how to transform available, usable food into useful meals under user intent and constraints.
- KitchenFlow is not reduced to a recipe generator or recipe catalog.
- Inventory uses products and lots with quantity, state, shelf-life evidence, source, confidence, and lifecycle history.
- Shelf-life behavior is advisory and explainable; it does not arbitrarily force or block a user's choice.
- Optional modules and context sources must degrade gracefully.
- Menu planning is optional and flexible.
- User decisions, accepted plans, permanent recipes, and authoritative inventory are not rewritten silently.
- Recipe execution completion and inventory reconciliation are atomic or explicitly pending reconciliation.
- Recipes are privately owned; cross-user sharing creates an independent copy from an immutable snapshot.
- AI is untrusted and never directly mutates authoritative state.
- Deterministic code owns authorization, arithmetic, transitions, validation, quotas, cost accounting, retention, and safety guardrails.
- Frontend and backend remain independently buildable, testable, deployable, and observable.
- The accepted first release is substantial. Do not substitute a smaller undocumented MVP.

Changing one of these decisions requires an explicit stakeholder-approved product document or superseding ADR and a migration plan where implementation exists.

## 5. Plan-driven execution

Every nontrivial agent change uses a plan under `docs/plans/` and a matching row in `docs/plan-status.md`.

Before implementation, testing, infrastructure, contract, or durable documentation work:

1. create or claim a plan;
2. confirm scope, requirements, acceptance criteria, dependencies, and validation;
3. register or update it in `docs/plan-status.md`;
4. identify owner, branch, checkpoint, and exact next action;
5. declare the substantial outcome targeted for the current execution run;
6. use a branch containing the plan ID when practical.

### Substantial delivery per execution run

Each agent run must aim to deliver the largest coherent plan phase, vertical slice, or decision-ready outcome that can be safely implemented, documented, tested, and validated within the active plan.

Unless a real blocker exists, do not stop after only:

- reading or restating documentation;
- creating a plan without beginning an already authorized execution phase;
- scaffolding projects or folders;
- adding one isolated DTO, entity, endpoint, component, migration, test placeholder, or configuration stub;
- producing status-only or comment-only changes;
- completing a narrow checkpoint when adjacent in-scope checkpoints can be safely finished and validated in the same run.

A substantial run normally includes the applicable combination of implementation, tests, documentation, generated contracts, migrations, validation, and handoff evidence. Measure delivery size by coherent outcome and completed acceptance criteria, not line count, file count, commit count, or elapsed time.

Large delivery does **not** authorize:

- unplanned scope expansion;
- unrelated changes bundled together;
- giant unreviewable commits;
- bypassing architecture, security, tests, or documentation;
- concealing failures or unfinished behavior;
- claiming completion because a large diff exists.

Use multiple cohesive, reviewable commits inside one run when appropriate. Continue through adjacent plan checkpoints while dependencies are available and the repository remains safe and verifiable.

An agent may stop before the intended run outcome only for a real external blocker, required stakeholder decision, unsafe uncertainty, environment or tool failure, conflicting concurrent work, exhausted execution capacity, or a necessary plan revision. Record the precise cause, completed work, validation, remaining work, and immediately executable next action.

### Mandatory pre-commit update

Before every agent-created commit, update:

- the active plan's `Execution state` and append-only `Progress log`;
- the matching registry row.

The same commit must record the checkpoint it produces, material changes, validation and result, failures or unverified behavior, blockers, and exact next action.

A commit without synchronized plan state is noncompliant.

### Pause and handoff

Before stopping, leave the repository resumable without conversation history. Record status, last verified checkpoint, incomplete areas, commands and results, risks, exact next action, and uncommitted work. Update plan and registry in the pause or handoff commit.

Do not mark a plan completed until acceptance criteria and validation are truthful. Delivery and merge state are separate.

## 6. Architecture boundaries

- `apps/frontend`: React/Lovable user experience and generated API consumption.
- `apps/backend`: ASP.NET Core API, BFF, application modules, workers, persistence, authorization, AI gateway, and integrations.
- `packages/contracts`: OpenAPI, events, AI schemas, identifiers, units, and compatibility fixtures.
- `docs`: durable product and engineering truth.
- `infrastructure`: container, environment, deployment, backup, and observability assets.
- `scripts`: reproducible repository automation.

Frontend code does not directly access PostgreSQL, Keycloak administration, AI providers, authoritative quota, or domain state mutation.

Backend modules do not freely mutate another module's tables. Use explicit application contracts and transactions.

Python may be introduced only as an isolated specialist service through an accepted plan and ADR; it does not own core authorization or the primary domain database.

## 7. AI engineering rules

- Route every model operation through the AI gateway.
- Register operation, workflow version, request and response schema, context budget, model policy, timeout, fallback, quota, privacy, and evaluation.
- Treat URLs, images, receipts, recipe text, and model output as hostile input.
- Assemble minimal structured context in the backend; never give unrestricted data access.
- Use explicit limits for strings, objects, collections, tokens or cost, concurrency, and retries.
- Validate schema, domain, units, restrictions, safety, authorization, and current state.
- Record provider, model, workflow, latency, usage, cost, validation, fallback, and failure where privacy permits.
- Do not expose credentials, private prompts, personal data, hidden context, or internal model reasoning.
- Ensure the defined non-AI degraded behavior remains functional.

## 8. Security, privacy, and food safety

- Apply least privilege and explicit resource authorization.
- Treat allergies, health restrictions, household behavior, photos, and history as sensitive.
- Collect and retain only for documented purposes.
- Never commit secrets, production data, personal data, or private prompts.
- Preserve access, correction, export, deletion, consent, and retention behavior.
- Keep temporary import images transient and permanent photos explicit.
- Apply current OAuth/OIDC, cookie, CSRF, upload, URL-fetching, abuse, and rate-limit controls.
- Food safety requires curated rules, deterministic validation, AI evaluation, clear uncertainty, and incident handling.
- Do not present uncertain safety estimates as guarantees.

## 9. Testing expectations

Every meaningful change includes risk-appropriate verification.

Expected layers include:

- unit tests for deterministic domain invariants;
- contract tests for APIs, events, and AI schemas;
- integration tests for PostgreSQL, Keycloak, RabbitMQ, object storage, and providers;
- idempotency, concurrency, outbox, retry, and dead-letter tests;
- end-to-end tests for critical user journeys;
- AI evaluations for every model-assisted operation;
- authorization and cross-user isolation tests;
- privacy export and deletion tests;
- food-safety and restriction tests;
- accessibility, localization, performance, resilience, backup, and restore checks.

Read [`docs/testing/product-foundation-gates.md`](docs/testing/product-foundation-gates.md). Testing agents use the same plan protocol, substantial-delivery mandate, and independent verification standard.

## 10. Complete documentation and code-documentation expectations

Documentation is part of the implementation, not deferred cleanup. Every delivery must update all affected durable documentation in the same pull request as the behavior or decision it describes.

The required documentation package includes, where applicable:

- product and user behavior;
- domain invariants and lifecycle rules;
- architecture, module boundaries, and ADRs;
- API, event, schema, prompt, and generated-contract documentation;
- configuration, environment variables, defaults, examples, and secrets handling;
- database migrations, compatibility, rollback or forward-repair behavior;
- deployment, operations, monitoring, alerts, runbooks, backup, restore, and support procedures;
- security, privacy, food-safety, AI-cost, localization, accessibility, performance, and resilience implications;
- test strategy, fixtures, evaluation datasets, validation commands, results, limitations, and handoff state.

### .NET XML documentation

For new or materially changed project-owned .NET code:

- every public or protected type and member requires accurate XML documentation;
- public APIs, domain types, application commands and queries, options, extension methods, middleware, integration adapters, exceptions, and reusable utilities require XML documentation;
- internal types and members require XML documentation or equivalent durable explanation when they expose non-obvious domain, security, ownership, concurrency, lifecycle, idempotency, performance, or failure semantics;
- use `<summary>`, `<param>`, `<typeparam>`, `<returns>`, `<exception>`, `<remarks>`, `<value>`, and `<inheritdoc/>` where they add truthful contract information;
- document units, nullability, side effects, authorization assumptions, concurrency guarantees, retry behavior, exceptions, and ownership boundaries when relevant;
- generated code is documented at its source schema or generator boundary and is not manually edited solely to add XML comments;
- intentional exceptions must be narrow, justified in the active plan, and visible in review.

New .NET project foundations must enable XML documentation output and add repository-scoped missing-documentation enforcement for project-owned public APIs. Do not suppress missing-documentation diagnostics globally merely to make a build pass.

### TypeScript and frontend documentation

For new or materially changed project-owned TypeScript code:

- exported reusable components, hooks, functions, classes, types, adapters, and utilities require TSDoc/JSDoc when their contract is not completely self-evident;
- document props, returns, side effects, accessibility behavior, security assumptions, cancellation, error states, caching, and ownership where relevant;
- generated OpenAPI types and generated framework code are documented at their generator/schema boundary rather than edited manually;
- Storybook or equivalent examples may supplement but do not replace contract documentation where a reusable API needs it.

### Inline comments

Use inline comments for non-obvious rationale, invariants, hazards, protocol requirements, security boundaries, concurrency, idempotency, parsing decisions, performance tradeoffs, compatibility constraints, and intentionally unusual behavior.

Comments must explain **why**, constraints, or consequences. Do not narrate obvious syntax, duplicate well-named code, add filler comments, or preserve commented-out code. Correct or remove stale, misleading, redundant, or false comments in the same change.

## 11. Git and pull requests

- Use descriptive English branches, preferably `agent/plan-<id>-<scope>`.
- Use concise imperative English commit messages.
- Delete merged working branches unless an explicit operational reason is documented.
- Do not commit generated dependencies, secrets, local configuration, or build output.
- Pull requests link the plan and describe scope, rationale, impact, validation, risks, limitations, documentation completeness, delivery depth, and handoff.
- Do not merge failing checks.
- Keep commits cohesive and reviewable even when the overall execution run is substantial.

## 12. Definition of done

A change is complete only when:

- acceptance criteria are satisfied;
- accepted product and domain behavior is preserved;
- architecture boundaries and ADRs are followed;
- relevant tests and evaluations pass;
- failure, recovery, idempotency, and observability are addressed;
- durable documentation, code comments, XML documentation, TSDoc/JSDoc, and generated contracts are current where applicable;
- configuration, migration, deployment, rollback, and operational guidance is current where applicable;
- localization and accessibility are handled;
- security, privacy, food safety, AI cost, and operation are considered;
- no secrets or personal data were introduced;
- the execution run delivered a substantial coherent outcome or truthfully documented a valid early-stop reason;
- plan and registry are truthful;
- exact continuation exists for unfinished work;
- unsupported behavior is not claimed.

When an item cannot be completed, document the exact limitation and leave a truthful, resumable state.
