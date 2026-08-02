# PLAN-0011 evidence — Phase 1 + Phase 2

## Scope

Public entry (Phase 1) and mock-backed authenticated contextual home (Phase 2).
Live source contracts remain PLAN-0021.

## Public composition note

Production `/` renders outside `SessionProvider`. Session bootstrap occurs only for `/acesso` and authenticated `/app/*` subtrees. Automated tests assert that rendering `/` does not call `fetch` / `/api/v1/session`.

## Functional tip

`f7d516089a077b39bd9c95c7cc157f44443eaa7d`

## Local validation (commands)

```bash
cd apps/frontend
yarn typecheck
yarn lint
yarn format:check
yarn test
yarn guard:ts-only
yarn guard:interactive-nesting
yarn guard:build-mode
yarn guard:production-isolation
yarn build
yarn inspect:production-bundle
yarn build:prototype
yarn build:production
yarn inspect:production-bundle
yarn audit:policy
yarn check:api-client-drift
yarn typecheck:api-client
yarn format:check:api-client
yarn smoke:browser:ci
```

Results: all Passed (188 Jest tests). Browser smoke: 14/14 Passed.

Local `yarn validate:firefox-native-zoom` could not launch Firefox as root (`XAUTHORITY` owned by another user). Rely on PLAN-0005 CI for native zoom/pointer gates.

## Tooling versions (execution host)

- Hostname: `NOTEBOOK-DEB-RODRIGO`
- git 2.47.3
- Docker 29.6.2 / Compose v5.3.1
- .NET SDK 10.0.302
- Node v24.18.0
- Yarn 1.22.22

## Production isolation

- Production wires `createUnavailableContextualHomeAdapter`
- Guard + bundle inspect Passed (no mock fixtures in production bundle)

## Handoff

```text
Next frontend plan: PLAN-0020
Future live contextual-home integration: PLAN-0021
```

PR remains **draft**. Owner-only merge. Agents must not approve, enable auto-merge, or merge.
