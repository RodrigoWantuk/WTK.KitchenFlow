# Architecture Overview

- **Status:** Draft
- **Last updated:** 2026-07-28

## Purpose

This document defines the initial architectural shape of KitchenPilot without selecting technologies prematurely. Technology choices must be recorded through Architecture Decision Records.

KitchenPilot is planned as a web-based, multilingual product with independently deployable frontend and backend applications. It must support deployment to managed cloud environments or a self-hosted VPS.

## Architectural goals

- Preserve clear product and domain boundaries.
- Allow frontend, backend, workers, and integrations to evolve independently.
- Keep deployment portable across supported environments.
- Make AI behavior observable, testable, replaceable, and cost-controlled.
- Protect household data, credentials, and safety-sensitive information.
- Support horizontal scaling where workloads justify it.
- Avoid distributed-system complexity until a measured requirement demands it.
- Maintain a repository structure that gives human and AI contributors enough context to make consistent changes.

## Initial system context

```text
+-------------------+
| Household members |
+---------+---------+
          |
          v
+-------------------+       +----------------------+
| Web frontend      |------>| Backend application  |
| localized UI      |       | APIs and orchestration|
+-------------------+       +----+-----------+-----+
                                 |           |
                                 v           v
                         +-------------+  +----------------+
                         | Data stores |  | AI gateway     |
                         | and cache   |  | and workflows  |
                         +-------------+  +-------+--------+
                                                   |
                                                   v
                                          +----------------+
                                          | AI providers   |
                                          +----------------+

Additional boundaries may include background workers, notification providers,
object storage, identity providers, and observability systems.
```

## Monorepo boundaries

### `apps/frontend`

Responsibilities:

- localized web experience;
- user interaction and accessibility;
- client-side state appropriate to the selected framework;
- presentation of plans, inventory, recipes, guidance, and troubleshooting;
- secure communication with backend APIs.

The frontend must not own authoritative household state, embed provider credentials, or execute safety-critical validation as its only enforcement layer.

### `apps/backend`

Responsibilities:

- authentication and authorization boundaries;
- application use cases and workflow orchestration;
- authoritative state changes;
- persistence and integration coordination;
- deterministic validation;
- AI request orchestration and response validation;
- observability, auditability, rate control, and cost controls.

The backend should begin as a modular application unless an accepted ADR establishes a need for separately deployed services.

### `packages/contracts`

Responsibilities:

- API schemas;
- event schemas;
- structured AI input and output schemas;
- shared identifiers, units, enums, and validation metadata where appropriate;
- compatibility and versioning rules.

Contracts must remain implementation-neutral. Sharing contracts must not result in sharing business logic or persistence models across application boundaries.

### `infrastructure`

Responsibilities:

- local development environment definitions;
- deployment assets;
- environment configuration templates;
- migrations and operational automation when technology choices are accepted.

Infrastructure must avoid embedding secrets or environment-specific credentials.

## Logical domain areas

The following domain areas are candidates for modular boundaries:

- identity and access;
- households and members;
- preferences, restrictions, and goals;
- kitchens, equipment, and capabilities;
- pantry and inventory;
- ingredients, units, and normalization;
- shopping and replenishment;
- meal planning;
- recipes and preparation plans;
- guided cooking sessions;
- feedback, history, and learning;
- AI workflows, prompts, evaluations, and provider integration;
- notifications and scheduling;
- localization and regionalization;
- subscriptions, entitlements, and billing if introduced later.

These are conceptual boundaries, not a commitment to separate processes or databases.

## AI boundary

AI providers are external dependencies. All provider access must pass through an application-owned AI gateway or equivalent boundary.

The boundary must support:

- provider and model selection;
- versioned prompt and workflow definitions;
- structured request and response contracts;
- deterministic validation and repair policies;
- timeouts, cancellation, retries, fallbacks, and circuit breaking;
- usage, latency, cost, validation, and failure telemetry;
- redaction and privacy controls;
- test doubles and recorded fixtures;
- migration between providers without rewriting product workflows.

AI must not directly mutate authoritative data. A validated application command must mediate every state change proposed by a model.

## Data ownership and consistency

- The backend owns authoritative household and operational state.
- Every state-changing request must be authenticated, authorized, validated, and auditable at an appropriate level.
- Inventory is inherently uncertain; the model must represent confidence, correction, and reconciliation rather than pretending all quantities are exact.
- Units and ingredient identities require normalized internal representation while preserving user-facing locale and wording.
- Personal data and AI transcripts must have explicit retention, deletion, and export rules.
- Analytics and evaluation data must be separated from operational data when their access or retention requirements differ.

## Deployment model

The minimum deployment topology is expected to contain:

- one frontend deployment;
- one backend deployment;
- one primary database;
- optional cache and background worker components;
- external AI providers;
- centralized logs, metrics, and traces.

A single VPS may host several components for smaller installations. Managed cloud services may host the same logical components independently. Environment differences must be represented through configuration and deployment assets, not divergent application code.

## Scalability approach

KitchenPilot should scale through measured evolution:

1. establish modular boundaries and observability;
2. keep request handlers stateless where practical;
3. move long-running or asynchronous work to background processing;
4. cache only when ownership and invalidation are defined;
5. scale application instances horizontally when metrics justify it;
6. separate services or data stores only when a documented bottleneck, security boundary, or ownership need exists.

## Cross-cutting concerns

Every implementation decision must consider:

- security and privacy;
- authentication and authorization;
- food safety and allergy handling;
- localization and regionalization;
- accessibility;
- observability and supportability;
- resilience and degraded operation;
- AI cost and provider availability;
- data retention, export, and deletion;
- testing and reproducibility;
- deployment portability.

## Decisions still required

At minimum, ADRs are required for:

- backend language and framework;
- frontend framework and Lovable integration workflow;
- API style and contract generation;
- primary database and migration strategy;
- authentication and household authorization model;
- background processing and scheduling;
- AI provider abstraction and supported providers;
- prompt and evaluation storage;
- localization framework and translation workflow;
- observability stack;
- deployment packaging and supported topologies;
- secret management;
- testing toolchain and release gates.
