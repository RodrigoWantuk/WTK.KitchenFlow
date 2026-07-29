# ADR-0006 — Deployment and Observability

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

The project will test on an owner-operated VPS in Texas and initially deploy production in a Virginia cloud region. It must launch economically, allow load balancing and redundancy, and diagnose AI cost, jobs, inventory failures, and privacy workflows.

## Decision

- Package frontend, API, workers, and self-operated dependencies as containers where applicable.
- Use Docker Compose for local development and the Texas VPS integration environment.
- Use a load-balancer-ready container deployment for Virginia production.
- Do not require Kubernetes initially.
- Prefer stateless API instances and persistent external state.
- Instrument application code with OpenTelemetry logs, metrics, and traces.
- Correlate HTTP requests, jobs, messages, provider calls, and domain operations.
- Redact personal and sensitive data from telemetry by default.
- Support health, readiness, and startup checks.
- Use feature flags, backward-compatible migrations, low-usage deployment windows, image rollback, and post-deploy verification.
- Target primary-data RPO in minutes and severe-failure RTO in hours, subject to infrastructure testing.

## Alternatives considered

- Kubernetes from the start: rejected as unnecessary operational cost.
- One manually updated VPS as production architecture: rejected because the product must support redundancy and horizontal growth.
- Vendor-specific observability APIs throughout the code: rejected in favor of OpenTelemetry portability.
- Multi-region active-active launch: rejected due consistency, privacy, cost, and operational complexity.

## Consequences

- Production vendor selection remains open.
- Backup and restore tests, queue recovery, and telemetry become release requirements.
- International transfer and data-residency analysis is required before global production use.
- Migration to an orchestrator remains possible because components use containers, health checks, and externalized configuration.

## References

- OpenTelemetry .NET: https://opentelemetry.io/docs/languages/dotnet/
