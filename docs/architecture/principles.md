# Architecture Principles

- **Status:** Draft
- **Last updated:** 2026-07-28

These principles guide design and implementation decisions across KitchenFlow. When a decision conflicts with a principle, the trade-off must be explicit and documented in an Architecture Decision Record.

## 1. Product behavior before technology

Architecture exists to support user outcomes. Technology choices must be justified by product requirements, operational constraints, maintainability, and measurable risks rather than familiarity or novelty alone.

## 2. Modular first, distributed when justified

Begin with clear modules and contracts inside a small number of deployable applications. Do not introduce separately deployed services unless scaling, isolation, ownership, compliance, or reliability requirements justify the operational cost.

## 3. Independent frontend and backend lifecycles

Frontend and backend must be independently buildable, testable, versionable, deployable, and observable. Their relationship must be expressed through explicit contracts rather than shared implementation details.

## 4. Deterministic core, AI-assisted edges

Use deterministic code for rules that require repeatability, authorization, validation, calculations, state transitions, and data integrity. Use AI for contextual reasoning, language interaction, adaptation, and generation where probabilistic behavior adds product value.

## 5. AI output is untrusted input

Every model response must pass schema validation, domain validation, authorization checks, safety checks, and observability controls before it affects user-visible state or authoritative data.

## 6. Provider independence

Product workflows must depend on application-owned interfaces and contracts, not directly on a model vendor SDK. Provider-specific capabilities may be used, but their impact and fallback behavior must be documented.

## 7. Contracts are versioned products

APIs, events, structured AI outputs, prompts, and stored data formats are contracts. They require ownership, compatibility rules, versioning, tests, and migration strategies.

## 8. Security and privacy by default

Use least privilege, explicit authorization, secure defaults, minimal data collection, controlled retention, encryption where appropriate, secret isolation, and auditable state changes. Sensitive household data must never be treated as ordinary telemetry.

## 9. Safety is a system concern

Food allergies, cross-contamination, storage, temperature, doneness, reheating, substitutions, and equipment hazards cannot be delegated to a single prompt. Safety requires product rules, structured data, validation, user communication, testing, and incident review.

## 10. Internationalization is architectural

The product must support multiple languages, units, ingredient vocabularies, date and number formats, regional availability, and culinary conventions. User-facing strings must be externalized, and internal identifiers must remain locale-independent.

## 11. Accessibility is part of correctness

Keyboard operation, screen-reader semantics, contrast, responsive behavior, readable instructions, clear error states, and alternatives to time-sensitive interactions must be considered from the first interface implementation.

## 12. Observable and supportable behavior

Important workflows must expose structured logs, metrics, traces, correlation identifiers, failure categories, and user-safe diagnostic information. Observability must help answer what happened without exposing secrets or unnecessary personal data.

## 13. Explicit degraded operation

The product must define what remains available when AI providers, networks, background workers, caches, or optional integrations are unavailable. Failure must not silently corrupt pantry, planning, or household state.

## 14. Portability through configuration

Cloud and VPS deployments must use the same application code. Environment-specific behavior belongs in configuration, infrastructure definitions, and adapters. Secrets must never be stored in source control.

## 15. Measure before scaling

Performance work must be based on expected workloads, profiling, service-level objectives, and observed bottlenecks. Avoid premature distribution, caching, denormalization, and vendor-specific infrastructure.

## 16. Documentation is executable responsibility

Architecture documents, ADRs, contracts, tests, and operational procedures must agree with the implementation. Documentation drift is a defect.

## 17. Small, reviewable evolution

Prefer cohesive changes with clear acceptance criteria and validation. Large architectural rewrites require an explicit migration plan, compatibility strategy, rollback approach, and staged verification.

## 18. User control and explainability

Users must be able to inspect, edit, reject, and correct important recommendations. The system should explain the relevant factors behind a plan without exposing private provider reasoning or presenting probabilistic output as certainty.
