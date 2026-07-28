# KitchenFlow Frontend

This directory will contain the independently deployable KitchenFlow web frontend.

## Intended responsibilities

- multilingual and accessible user experience;
- household onboarding and profile management;
- pantry, shopping, planning, preparation, and cooking workflows;
- clear presentation of AI suggestions, uncertainty, validation errors, and recovery options;
- secure communication with backend APIs;
- responsive behavior across supported devices.

## Lovable workflow

Lovable is expected to support interface design and initial frontend generation. Generated output is not exempt from project standards.

Before generated code is accepted, it must be reviewed for:

- architecture and component boundaries;
- accessibility and keyboard operation;
- localization readiness;
- responsive behavior;
- security and privacy;
- maintainability and testability;
- contract compatibility;
- unnecessary dependencies or duplicated logic.

The repository remains the source of truth. Design-generation tools must not create a parallel undocumented architecture.

## Current status

No frontend framework or Lovable integration workflow has been selected. Do not introduce a framework, state-management library, design system, or localization library until the relevant Architecture Decision Records are accepted.

## Required properties

The frontend must be:

- independently buildable, testable, and deployable;
- localization-ready from the first user-facing implementation;
- accessible by design rather than by later remediation;
- unable to access AI or infrastructure credentials directly;
- based on versioned backend contracts;
- resilient to slow, unavailable, or invalid AI responses;
- explicit when a recommendation is editable, uncertain, or safety-sensitive.

See:

- [`../../docs/product/vision.md`](../../docs/product/vision.md)
- [`../../docs/architecture/overview.md`](../../docs/architecture/overview.md)
- [`../../docs/architecture/principles.md`](../../docs/architecture/principles.md)
- [`../../docs/testing/strategy.md`](../../docs/testing/strategy.md)
