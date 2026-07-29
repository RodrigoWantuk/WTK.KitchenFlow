# Development Documentation

This directory defines the supported local development baseline and repository execution conventions.

## Required reading

- [`environment.md`](environment.md) — complete Windows and Linux host requirements, containerized services, versions, ports, resource guidance, verification commands, and agent bootstrap checklist.

## Rules

- Use Linux containers for local infrastructure on both Windows and Linux hosts.
- Do not install PostgreSQL, Keycloak, RabbitMQ, Redis, or object-storage servers natively unless an accepted plan explicitly requires an exception.
- Pin project tools and dependencies in repository files instead of relying on undocumented global installations.
- Do not mix build outputs or dependency directories between native Windows and WSL2 environments.
- Keep local secrets outside source control.
- Update this directory whenever a required tool, runtime, service, port, or bootstrap command changes.
