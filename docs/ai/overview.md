# AI Architecture Overview

- **Status:** Draft
- **Last updated:** 2026-07-28

## Purpose

AI is a core KitchenFlow capability, but not the owner of application state or business correctness. This document defines the initial rules for model-assisted workflows before providers and implementation technologies are selected.

## Intended AI responsibilities

AI may support capabilities such as:

- guided onboarding and profile clarification;
- contextual meal and preparation suggestions;
- recipe generation and adaptation;
- shopping and preparation-plan proposals;
- natural-language cooking guidance;
- troubleshooting based on user observations;
- explanation of substitutions and techniques;
- summarization of household preferences and history;
- extraction of structured information from user-provided text.

Each capability requires its own documented workflow, contracts, evaluation criteria, safety boundaries, and fallback behavior.

## Responsibilities that remain deterministic

The application must use deterministic systems for:

- authentication and authorization;
- persistence and transactional state changes;
- inventory arithmetic and reconciliation;
- unit conversion after ingredient and unit identity are resolved;
- schema and domain validation;
- allergy and restriction enforcement rules;
- rate limiting, quotas, and entitlements;
- cost accounting and provider limits;
- audit events and retention policies;
- migrations and compatibility decisions.

A model may propose a state change, but application code must validate and execute it.

## AI workflow model

A model-assisted operation should follow an explicit pipeline:

```text
User or system context
        |
        v
Context selection and redaction
        |
        v
Versioned workflow and prompt
        |
        v
Provider adapter and model request
        |
        v
Structured response parsing
        |
        v
Schema, domain, safety, and authorization validation
        |
        +------ invalid ------> repair, fallback, or safe failure
        |
        v
Application-owned command or presentation model
        |
        v
User confirmation or authorized state change
```

## Structured outputs

Use structured outputs whenever the response will be stored, compared, calculated, rendered as a workflow, or used to change state.

Examples include:

- recipes and ingredient quantities;
- shopping-list items;
- weekly meal plans;
- pantry changes;
- preparation batches;
- cooking steps and timers;
- substitution proposals;
- identified risks and required confirmations.

Schemas must be versioned under application ownership. A provider-specific schema feature may help enforce formatting, but it does not replace application validation.

## Prompt and workflow management

- Prompts must be stored as versioned project assets or controlled configuration.
- Prompt identifiers and versions must be included in relevant telemetry.
- Prompt templates must not be scattered through controllers, UI components, or provider adapters.
- Product rules must not exist only as natural-language prompt instructions when deterministic enforcement is possible.
- Changes to important prompts require tests or evaluations and a documented rollout strategy.
- Prompt content sent to providers must be minimized and redacted according to privacy rules.

## Provider abstraction

The product must own interfaces for capabilities rather than exposing vendor SDK concepts throughout the codebase.

Provider adapters should translate between application contracts and provider APIs. The abstraction must still allow intentional use of provider-specific features when their benefits and migration costs are documented.

At minimum, the boundary should expose:

- model capability and configuration;
- request and response identifiers;
- timeout and cancellation;
- token or usage information;
- provider error classification;
- structured-output support;
- safety or moderation signals when available;
- streaming behavior where required.

## Context management

Context must be assembled for a documented purpose. More context is not automatically better.

- Include only data relevant to the current workflow.
- Separate durable household facts from temporary conversation state.
- Record the source and confidence of inferred facts.
- Require confirmation before persisting sensitive or uncertain inferences.
- Avoid sending raw history when a minimal structured summary is sufficient.
- Define retention and deletion rules for prompts, responses, and derived data.

## Validation and repair

Validation should occur in layers:

1. transport and parsing validation;
2. schema validation;
3. domain validation;
4. household preference and restriction validation;
5. food-safety validation;
6. authorization validation;
7. consistency checks against current state.

Invalid output must not silently enter the system. Depending on the workflow, the application may:

- reject the response;
- retry with bounded repair instructions;
- select another model or provider;
- use a deterministic fallback;
- ask the user for clarification;
- fail safely and preserve the previous state.

## Evaluation strategy

Each AI capability needs an evaluation set representing realistic users, locales, skills, equipment, restrictions, inventory states, and failure scenarios.

Evaluation categories should include:

- schema validity;
- instruction completeness;
- factual and contextual consistency;
- allergy and restriction compliance;
- food-safety behavior;
- unit and quantity consistency;
- usefulness and actionability;
- localization quality;
- refusal and uncertainty behavior;
- latency and cost;
- regression against accepted behavior.

Model upgrades, prompt changes, and provider changes must pass defined evaluation gates before broad rollout.

## Observability

Where privacy rules permit, record:

- workflow identifier and version;
- provider and model identifier;
- request correlation identifier;
- latency and retry count;
- usage and estimated cost;
- schema and domain validation results;
- fallback or repair path;
- failure category;
- user correction, rejection, or acceptance signals.

Do not log secrets, full personal profiles, allergy data, or complete prompts and responses by default. Logging and evaluation datasets require explicit redaction and access controls.

## Resilience and cost control

Every workflow must define:

- maximum execution time;
- maximum retry or repair attempts;
- maximum context and output size;
- model selection rules;
- caching eligibility and privacy implications;
- concurrency and rate limits;
- degraded behavior when providers are unavailable;
- a cost ceiling or alerting threshold appropriate to the workflow.

## Safety boundary

AI-generated cooking advice can have real-world consequences. Allergy, contamination, storage, temperature, doneness, reheating, and equipment-safety behavior require deterministic guardrails, curated rules, validation, and clear user communication in addition to model prompting.

The application must distinguish normal cooking preference advice from safety-critical guidance and must surface uncertainty rather than inventing guarantees.

## Decisions still required

ADRs and detailed designs are required for:

- supported AI providers and model classes;
- provider routing and fallback policy;
- prompt storage and release process;
- structured-output schema tooling;
- conversation and memory model;
- evaluation framework and datasets;
- privacy and retention policy for AI interactions;
- safety-rule ownership and validation;
- streaming response requirements;
- usage accounting and cost controls.
