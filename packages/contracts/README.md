# Shared Contracts

This directory contains versioned contracts shared across KitchenFlow boundaries.

## Accepted contract direction

- REST API contract expressed as OpenAPI 3.1 from the ASP.NET Core backend;
- reproducibly generated TypeScript frontend client and types;
- versioned event and message schemas;
- versioned structured AI request and response schemas;
- shared stable identifiers, units, enums, error codes, provenance, confidence, and validation metadata;
- compatibility fixtures and migration tests.

The exact generator and generated-file commit policy require an implementation plan after the initial solution exists.

## Rules

- Contracts are products with owners, versions, tests, and compatibility policies.
- Do not expose EF entities, database models, Keycloak types, RabbitMQ client types, or AI provider SDK types.
- Do not put cross-application business logic in contracts.
- Required fields, nullability, units, ranges, identifiers, collection limits, and version behavior are explicit.
- State-changing operations define idempotency and concurrency behavior when relevant.
- Errors use stable machine-readable codes and localization-ready parameters rather than hard-coded English as the only representation.
- AI schemas define maximum object counts and string lengths and receive structural and domain validation.
- Event schemas support at-least-once delivery and idempotent consumers.
- Breaking changes require migration, compatibility, rollout, and rollback plans.
- Generated artifacts have a canonical source and reproducible command.

## Domain sensitivity

Contracts must preserve accepted distinctions, including:

- product versus culinary classification;
- inventory lot versus aggregate availability;
- physical quantity versus reservation;
- source and confidence;
- recipe identity versus revision and derivation;
- execution-local adaptation versus permanent revision;
- execution completion versus pending reconciliation;
- advisory attention versus forced safety claim.

See [`../../docs/domain/README.md`](../../docs/domain/README.md) and [`ADR-0002`](../../docs/architecture/decisions/0002-backend-platform-and-modular-monolith.md).
