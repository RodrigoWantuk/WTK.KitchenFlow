# Initial Release Definition

- **Status:** Accepted
- **Last updated:** 2026-07-28

## Release intent

The first release is intentionally substantial. It must demonstrate the closed KitchenFlow cycle rather than ship only a generic recipe generator.

Development may require multiple implementation plans before public launch. The release definition is not permission to reduce accepted behavior into a smaller undocumented MVP.

## Required platform

- responsive web application;
- React and TypeScript frontend generated and evolved through Lovable;
- independent backend API and workers;
- account required before use;
- adults aged 18 or older;
- Portuguese, English, and Spanish interfaces;
- metric and imperial measurement configuration;
- Brazil-first content maturity with international architecture.

There is no native Android or iOS application in this release.

## Required capabilities

### Account and profile

- external identity-provider authentication;
- short account creation;
- progressive cooking and household profile;
- editable restrictions, preferences, goals, equipment, skill, time, effort, and cleanup context;
- notification and privacy preferences.

### Inventory and lifecycle

- product and lot identity;
- mandatory quantity or availability state;
- mass, volume, and count normalization;
- storage locations and states;
- sealed, opened, frozen, thawing, thawed, prepared, leftover, consumed, and discarded transitions as applicable;
- manufacturer, user, curated, regional, AI-estimated, or unknown shelf-life evidence;
- attention dashboard;
- flexible reservations and locked quantities;
- provenance, confidence, correction, history, and atomic reconciliation.

### Inventory input

- manual single-item entry;
- manual list entry;
- AI parsing of a manual list;
- receipt-photo parsing;
- immediate source-image deletion after success or reported failure;
- no automatic retry retaining the source image.

Barcode and general package-image databases are deferred.

### Recipes

- AI generation;
- URL parsing;
- recipe-image parsing;
- consistency and safety warnings;
- normalized structured storage only;
- manual editing;
- revisions and derived recipes;
- favorites;
- private sharing by immutable snapshot and copy;
- optional user photos attached permanently only by explicit action.

### Planning and shopping

- optional menu planning;
- fixed and flexible entries;
- simulation, draft, and accepted states;
- recipe selection from multiple suggestions;
- portion changes and localized regeneration;
- flexible inventory reservations;
- preparation and thawing actions;
- readiness and missing-product warnings;
- required, recommended, optional, available, and expected-to-run-out shopping items;
- package-size remainder and future-use reasoning;
- comparison of planned and actual purchases;
- local adaptation without silent full-plan replacement.

### Guided cooking

- mise en place review;
- explicit execution start;
- stage-based instructions;
- user-profile default detail;
- additional detail per stage;
- text troubleshooting;
- logged active-instruction adaptation;
- execution-local changes;
- final choice to discard, revise, or derive the recipe.

### Completion and history

- proposed and editable product consumption;
- substitutions and omitted products;
- produced, consumed, stored, and frozen portions;
- leftover lots and waste events;
- atomic inventory reconciliation;
- rating, difficulty, notes, and optional photos;
- user-confirmed learning.

### Notifications

- in-product attention dashboard;
- web push;
- email;
- reminder postponement;
- shelf-life, preparation, missing-item, and planned-cooking notifications;
- anti-spam and preference controls.

### Privacy and user rights

- access and correction;
- readable export;
- item-level deletion where applicable;
- photo deletion;
- account-deletion workflow;
- permission and consent management;
- processor and transfer transparency;
- retention rules by category.

## AI-unavailable behavior

The following remain available:

- authentication and account access;
- profile and inventory management;
- saved recipes and instructions;
- favorites and history;
- menu and shopping list;
- active cooking continuation;
- execution completion and inventory reconciliation;
- privacy, export, and deletion workflows.

AI-only generation, parsing, adaptation, contextual recommendation, and troubleshooting may fail safely and transparently.

## Commercial direction

- highly limited free plan;
- possible advertising on the free plan;
- paid subscription without ads and with higher AI allowance;
- visible usage and reset timing;
- centralized quotas and anti-abuse controls.

Exact prices, allowance, credits, ads, and billing provider require a later accepted plan and ADR where applicable.

## Deferred beyond the first release

- native mobile applications;
- collaborative household member accounts;
- searchable public community catalog;
- public creator profiles;
- ranking implementation;
- clinical diet and medical nutrition management;
- nutritionist workspace;
- broad retailer integration and autonomous purchasing;
- exact real-time market pricing;
- barcode and comprehensive product databases;
- semantic or vector search;
- advanced financial dashboards;
- self-hosted distribution as a supported product;
- multi-region active-active deployment.

## Release quality gates

The first public release requires:

- verified critical journeys;
- deterministic inventory and reconciliation tests;
- AI workflow evaluations;
- food-safety and allergy test coverage;
- authorization and data-isolation tests;
- privacy export and deletion validation;
- accessible and localized critical interfaces;
- load and cost tests against the launch envelope;
- backup and restore rehearsal;
- queue recovery and idempotency tests;
- observable AI cost and failure behavior;
- legal review for terms, privacy, age policy, international transfers, advertising, and available countries.
