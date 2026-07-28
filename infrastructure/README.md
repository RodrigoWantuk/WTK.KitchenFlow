# Infrastructure

This directory will contain versioned infrastructure and deployment assets for KitchenFlow.

## Intended scope

- local development environment definitions;
- container and service packaging;
- cloud deployment definitions;
- VPS deployment definitions;
- environment configuration templates;
- database migration execution support;
- backup, restore, and operational automation;
- observability configuration.

## Rules

- Cloud and VPS deployments must use the same application code.
- Secrets and environment credentials must never be committed.
- Every required environment variable must be documented and represented safely in an example file.
- Infrastructure changes require validation and a rollback strategy.
- Production resources must use least privilege, encryption, backups, and controlled network exposure.
- Deployment assets must clearly distinguish local development, testing, staging, and production behavior.
- Provider-specific infrastructure decisions require Architecture Decision Records.

## Current status

No deployment platform, container strategy, infrastructure-as-code tool, or secret-management system has been selected.
