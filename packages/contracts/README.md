# Shared Contracts

This directory will contain implementation-neutral contracts shared across KitchenFlow boundaries.

## Intended contents

- API schemas;
- structured AI input and output schemas;
- event and message schemas;
- shared identifiers, units, enums, and validation metadata;
- contract compatibility fixtures;
- generated client or server artifacts when generation is reproducible and approved.

## Rules

- Contracts are versioned products, not incidental implementation details.
- Contracts must not expose persistence models or provider-specific SDK types.
- Shared contracts must not become a location for cross-application business logic.
- Breaking changes require an explicit compatibility and migration plan.
- Schemas must define required fields, nullability, units, ranges, identifiers, and version behavior.
- AI response schemas require both structural and domain validation.
- Generated artifacts must have a documented source and reproducible generation command.
- User-facing text should be represented by stable codes or localization keys when appropriate, not embedded English messages that prevent localization.

## Current status

The contract format and generation toolchain have not been selected. They require an accepted Architecture Decision Record.
