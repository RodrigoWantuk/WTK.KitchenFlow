# KitchenFlow Frontend

This directory contains the independently deployable KitchenFlow responsive web frontend.

## Accepted platform

- React;
- TypeScript;
- interface design and code generation through Lovable;
- generated backend client and types from OpenAPI contracts.

React and Lovable are fixed stakeholder decisions. The exact Lovable-generated runtime, router, build system, component library, state library, localization library, and test tools are selected after the actual generated project is inspected and require a plan or ADR where they establish durable precedent.

See [`ADR-0001`](../../docs/architecture/decisions/0001-frontend-platform-and-boundary.md).

## Responsibilities

- responsive, multilingual, and accessible user experience;
- account onboarding and progressive profile management;
- inventory, attention, shopping, planning, recipe, cooking, history, notification, quota, and privacy workflows;
- temporary UI state and optimistic presentation where safe;
- upload initiation and job progress;
- clear presentation of provenance, uncertainty, safety, quota, validation, and failure;
- secure communication with backend/BFF endpoints.

## Prohibited ownership

The frontend does not:

- access PostgreSQL directly;
- call AI providers directly;
- store provider credentials or long-lived access and refresh tokens;
- calculate official quota or subscription entitlement;
- own inventory arithmetic, shelf-life authority, authorization, privacy deletion, or food-safety enforcement;
- bypass generated contracts with duplicated hand-maintained API models.

## Lovable workflow

Lovable output is reviewed as normal production code for:

- component and feature boundaries;
- accessibility and keyboard operation;
- localization readiness;
- responsive behavior;
- secure session and CSRF interaction;
- privacy and sensitive-data exposure;
- maintainability and testability;
- generated contract compatibility;
- unnecessary dependencies and duplicated backend logic.

The Git repository remains the source of truth. Lovable must not create a parallel backend or undocumented architecture.

## Required reading

- [`../../docs/README.md`](../../docs/README.md)
- [`../../docs/product/user-journeys.md`](../../docs/product/user-journeys.md)
- [`../../docs/product/initial-release.md`](../../docs/product/initial-release.md)
- [`../../docs/domain/README.md`](../../docs/domain/README.md)
- [`../../docs/architecture/overview.md`](../../docs/architecture/overview.md)
- [`../../docs/security/privacy-and-data-protection.md`](../../docs/security/privacy-and-data-protection.md)
- [`../../docs/testing/product-foundation-gates.md`](../../docs/testing/product-foundation-gates.md)
