# Repository Scripts

This directory will contain repeatable repository automation that is not owned by a specific application.

Candidate responsibilities include:

- local environment setup;
- formatting and validation entry points;
- contract generation and compatibility checks;
- documentation validation;
- test orchestration;
- database and fixture utilities;
- release and deployment support.

## Rules

- Scripts must be documented, idempotent where practical, and safe by default.
- Destructive operations must require explicit confirmation or an explicit noninteractive flag.
- Scripts must return meaningful exit codes and avoid hiding failures.
- Secrets must be provided through approved environment or secret-management mechanisms.
- CI and local development should call the same underlying commands when practical.
- Platform-specific scripts must have a documented reason and supported environment.
