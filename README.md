# KitchenFlow

KitchenFlow is an AI-assisted web application designed to help people cook more often at home and rely less on delivery services.

The product aims to manage the full home-cooking journey: understanding the household, organizing pantry inventory, planning purchases, preparing reusable components, selecting meals, guiding cooking, and helping users recover when something goes wrong.

> Repository name: `WTK.KitchenFlow`  
> Product name: **KitchenFlow**

## Project status

KitchenFlow is currently in its foundation and discovery phase. Product requirements, architectural decisions, technology choices, and delivery milestones will be documented before implementation is expanded.

## Product goals

- Reduce the effort required to decide what to cook.
- Adapt recommendations to each household's routine, preferences, skills, equipment, budget, and available ingredients.
- Coordinate pantry management, shopping, meal planning, preparation, cooking, and learning.
- Use structured AI workflows rather than isolated free-form prompts.
- Provide clear, practical, and safe cooking guidance.
- Support multiple interface languages without mixing localization concerns into the technical foundation.

## Engineering principles

- Documentation is part of the product.
- Architecture must support independent frontend and backend evolution.
- Cloud and self-hosted VPS deployments must remain viable.
- AI-generated output must be structured, validated, observable, and recoverable.
- Security, privacy, food safety, accessibility, localization, and cost control are first-class concerns.
- Every meaningful behavior must have an appropriate automated test strategy.
- Significant technical decisions must be recorded as Architecture Decision Records.

## Repository structure

```text
apps/                 Deployable applications
  backend/            Backend application
  frontend/           Web frontend
packages/             Shared contracts and reusable packages
docs/                 Product, architecture, AI, testing, and operational documentation
infrastructure/       Deployment and infrastructure assets
scripts/              Repository automation and maintenance scripts
.github/              GitHub workflows and contribution templates
```

The structure is intentionally technology-neutral until the relevant Architecture Decision Records are approved.

## Documentation

Start with [`docs/README.md`](docs/README.md). Future contributors and coding agents must also read [`AGENTS.md`](AGENTS.md) before changing the repository.

All source code, technical documentation, commit messages, issue content, and pull request content must be written in English. User-facing text must be localization-ready and must not be embedded directly in application logic.

## License

KitchenFlow is source-available under the **PolyForm Noncommercial License 1.0.0**. Noncommercial use is permitted under the license terms. Commercial use is not permitted without a separate written commercial license from the copyright holder.

See [`LICENSE`](LICENSE) for the complete terms.
