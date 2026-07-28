# Architecture Principles

- **Status:** Accepted
- **Last updated:** 2026-07-28

When a decision conflicts with a principle, the trade-off must be explicit in an ADR.

## 1. Product behavior before technology

Technology exists to implement the accepted product and domain behavior. Do not reshape inventory, recipes, planning, privacy, or user control merely because a framework makes a smaller model easier.

## 2. Independent frontend and backend lifecycles

React frontend and .NET backend are independent artifacts with explicit API contracts, tests, deployment, and observability. Shared code must not create hidden runtime coupling.

## 3. Modular first, distributed when measured

Begin with a modular monolith and separately scalable workers. Introduce a service only for a measured scaling, isolation, compliance, reliability, or ownership need.

## 4. PostgreSQL is authoritative

Authoritative product state lives in PostgreSQL. Cache, queue, search index, model context, and frontend state are replaceable projections or transport mechanisms.

## 5. Deterministic core, AI-assisted reasoning

Use deterministic code for authorization, quantities, conversions, reservations, state transitions, transactions, quotas, retention, and safety rules. Use AI for extraction, adaptation, explanation, contextual suggestion, and troubleshooting.

## 6. AI output is untrusted input

Every model result passes parsing, schema, domain, restriction, safety, authorization, consistency, and budget checks before presentation or state change.

## 7. Centralize AI access

No frontend or domain module calls an AI provider directly. An application-owned gateway controls context, provider, model, prompts, quotas, fallback, telemetry, and privacy.

## 8. Explicit optional context

Inventory, plans, equipment, history, and manually entered products are optional context sources. The backend selects relevant context under a declared budget. It does not send all available user data by default.

## 9. Advisory, explainable user control

Shelf-life attention, recommendations, substitutions, and plan changes are proposals. Users can inspect source, confidence, consequences, edit, reject, postpone, or choose another action.

## 10. Transactional lifecycle integrity

A completed cooking execution cannot silently disagree with authoritative inventory. Completion and reconciliation are atomic, or the execution is explicitly pending reconciliation.

## 11. Retry safely

Network requests, jobs, and messages may repeat. State-changing operations and consumers are idempotent where duplication would cause harm. Exactly-once processing is not assumed.

## 12. Contracts are versioned products

REST APIs, events, AI schemas, prompts, units, identifiers, and stored formats have owners, compatibility rules, tests, and migrations.

## 13. Privacy and security by default

Minimize data, isolate secrets, enforce least privilege, classify sensitive data, control retention, record consent and provenance, and audit privileged access. Observability must not become an ungoverned copy of user data.

## 14. Safety is multi-layered

Allergy, cross-contamination, storage, temperature, doneness, reheating, and equipment risks require curated data, deterministic validation, AI evaluation, user communication, and incident handling.

## 15. Degraded operation is designed

Saved data, deterministic operations, and active cooking remain useful when AI, cache, notifications, or a worker subsystem is unavailable. Failure does not corrupt state.

## 16. Internationalization is architectural

Language, region, timezone, currency, measurement system, product names, culinary terminology, and availability are separate concepts. Internal identifiers are locale-independent.

## 17. Accessibility is correctness

Responsive cooking workflows, keyboard navigation, focus, screen-reader semantics, readable staged instructions, contrast, error recovery, and alternatives to time-sensitive interaction are required from the first UI.

## 18. Observe cost and reliability from day one

Logs, metrics, traces, job state, queue delay, AI token usage, provider cost, validation, fallback, notification delivery, and privacy workflows must be measurable without exposing unnecessary personal data.

## 19. Measure before caching or extraction

Do not add Redis, denormalization, read replicas, services, or multi-region complexity without a workload and measurable target.

## 20. Backward-compatible evolution

Database and API changes support rolling deployment, low-usage release windows, rollback, feature flags, and safe disablement of integrations.

## 21. Documentation is operational state

Canonical docs, ADRs, plans, tests, and implementation must agree. Documentation drift is a defect.
