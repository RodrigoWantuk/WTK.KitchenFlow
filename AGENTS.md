# AGENTS.md

This file defines mandatory working rules for AI coding agents and human contributors operating in this repository.

## 1. Project identity

- Product name: **KitchenFlow**.
- Repository and technical namespace: **WTK.KitchenFlow**.
- Product purpose: help individuals and households cook more often at home by coordinating planning, pantry management, shopping, preparation, cooking guidance, and troubleshooting.
- The project is a multilingual web product with independently deployable frontend and backend components.

## 2. Language policy

All technical work must be written in English, including:

- source code and identifiers;
- comments and logs;
- documentation and Architecture Decision Records;
- commit messages;
- branch names;
- issues and pull requests;
- test names and test data descriptions.

User-facing content must be localization-ready. Do not hard-code interface copy inside application logic or reusable components. English may be used as the source locale, but the architecture must support additional languages.

## 3. Required reading before changes

Before modifying the repository, read:

1. `README.md`;
2. `docs/README.md`;
3. `docs/product/vision.md`;
4. `docs/architecture/overview.md`;
5. `docs/architecture/principles.md`;
6. every Architecture Decision Record relevant to the requested change.

Do not infer that an undocumented technology or pattern has already been approved.

## 4. Working method

- Understand the user and product outcome before writing code.
- Keep changes small, cohesive, reviewable, and reversible.
- Do not silently broaden scope.
- Do not replace explicit requirements with a smaller "MVP" interpretation unless the product documentation explicitly authorizes it.
- Update documentation in the same change whenever behavior, architecture, contracts, configuration, or operational procedures change.
- Record significant technical choices as Architecture Decision Records before or alongside implementation.
- Prefer explicit contracts and deterministic behavior over implicit conventions.
- Never claim a feature, test, migration, or deployment is complete unless it has been verified.

## 5. Architecture boundaries

The initial repository is a technology-neutral monorepo. Preserve these conceptual boundaries:

- `apps/frontend`: user-facing web application;
- `apps/backend`: APIs, application orchestration, authentication, persistence, and integration boundaries;
- `packages/contracts`: versioned schemas and contracts shared across boundaries;
- `docs`: durable product and engineering knowledge;
- `infrastructure`: deployment and environment definitions;
- `scripts`: repository automation.

Frontend and backend must remain independently buildable, testable, deployable, and observable. Shared packages must not create hidden runtime coupling.

## 6. AI engineering rules

AI is a core product capability, but it must not become an unbounded implementation shortcut.

- Use AI where contextual reasoning or natural interaction creates product value.
- Use deterministic code for validation, authorization, calculations, state transitions, inventory consistency, persistence rules, and other logic that must be repeatable.
- Prefer structured model outputs validated against versioned schemas.
- Treat every model response as untrusted external input.
- Validate required fields, ranges, units, identifiers, locale, and safety constraints before accepting model output.
- Design explicit timeout, retry, cancellation, fallback, and error-reporting behavior.
- Keep prompts versioned and testable; do not scatter prompt strings throughout application code.
- Do not expose provider credentials, private prompts, personal data, or internal reasoning to clients.
- Track model provider, model identifier, prompt version, latency, token usage, estimated cost, validation result, and failure category where privacy rules permit.
- Provider-specific implementations must remain behind application-owned interfaces.

## 7. Safety and privacy

KitchenFlow may process food preferences, allergies, household information, budgets, schedules, and behavioral history. Treat these as sensitive user data.

- Collect only data needed for a documented product purpose.
- Never commit credentials, API keys, production data, personal data, or private prompt transcripts.
- Apply least privilege and secure defaults.
- Food allergy, cross-contamination, storage, doneness, and reheating guidance require explicit safety handling.
- Generated cooking guidance must not present uncertain safety-critical claims as guaranteed facts.
- Security and privacy failures must be visible, logged appropriately, and covered by incident procedures.

## 8. Testing expectations

Every meaningful change must include the appropriate level of automated verification.

Expected layers include:

- unit tests for deterministic domain behavior;
- contract tests for schemas and APIs;
- integration tests for persistence and external boundaries;
- end-to-end tests for critical user journeys;
- prompt and model-behavior evaluations for AI-assisted features;
- security, accessibility, localization, and performance checks where relevant.

Tests must be deterministic whenever possible. Model-dependent tests must use controlled fixtures, recorded responses, contract validation, or explicitly versioned evaluation datasets.

## 9. Documentation expectations

Documentation is part of the deliverable, not a later cleanup task.

- Use Markdown unless another format is justified.
- Link related documents instead of duplicating rules.
- Mark assumptions, open questions, risks, and decisions clearly.
- Keep diagrams text-based or reproducible when practical.
- Add an ADR for decisions that affect architecture, technology, data ownership, security, deployment, AI providers, or cross-component contracts.
- Update status markers when a proposal becomes accepted, superseded, or rejected.

## 10. Git and pull requests

- Use descriptive English branch names, preferably `agent/<scope>` for agent-created branches.
- Use concise imperative English commit messages.
- Delete merged working branches after the merge unless an explicit operational reason requires them to remain.
- Do not commit generated artifacts, dependencies, secrets, local configuration, or build output.
- A pull request must explain what changed, why it changed, user/developer impact, risks, and validation performed.
- Do not merge failing checks.
- Avoid mixing refactoring, formatting, dependency upgrades, and product behavior in one change unless they are inseparable.

## 11. Definition of done

A change is complete only when:

- acceptance criteria are satisfied;
- architecture boundaries remain valid;
- relevant tests pass;
- error paths and observability are addressed;
- documentation is current;
- localization implications are handled;
- security, privacy, food-safety, accessibility, and cost implications were considered;
- no credentials or personal data were introduced;
- the implementation does not claim unsupported behavior.

When any item cannot be completed, document the exact limitation and leave the repository in a truthful state.
