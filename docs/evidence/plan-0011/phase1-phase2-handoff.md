# PLAN-0011 evidence — Phase 1 + Phase 2 (+ PR #34 remediation)

## Scope

Public entry (Phase 1) and mock-backed authenticated contextual home (Phase 2),
including the 2026-08-02 owner-review remediations for PR #34.
Live source contracts remain PLAN-0021.

## Public composition note

Production `/` renders outside `SessionProvider`. Session bootstrap occurs only for `/acesso` and authenticated `/app/*` subtrees. Automated tests assert that rendering `/` does not call `fetch` / `/api/v1/session`.

## SHA distinctions

| Role | Value |
|---|---|
| Review baseline (pre-remediation) | `2bdcd4ff4357167ad2d55284ac30a81a9daaec43` |
| Functional remediation tip | `febbd5eb2642b77ed2e4848db721b77ac5e0caac` |
| Current PR head | advances with packaging tip after this evidence update |
| Exact-head CI | pending until Frontend + PLAN-0005 succeed on the published tip |

Do not treat a packaging-only metadata commit as proof for an older functional SHA.

## Remediation summary

1. Expanded suggestion presentation contract (timing, effort, cleanup, readiness, requirements, prep, shopping, uncertainty, freshness).
2. Radix Dialog quick chooser with focus trap, Escape, focus restore, abort/cancel, stale-attempt ignore.
3. Generation-counter + AbortController stale-response protection per source.
4. Deterministic immutable-per-scenario prototype adapter (`useMemo`).
5. Explicit `retryable` on source/chooser results; production unavailable never offers Retry.
6. Public demo CTA respects `prefers-reduced-motion`; browser smoke asserts `behavior: "auto"`.

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

Results: all Passed (197 Jest tests). Browser smoke Passed (incl. public reduced-motion CTA).

Local `yarn validate:firefox-native-zoom` could not launch Firefox as root (`XAUTHORITY` owned by another user). Rely on PLAN-0005 CI for native zoom/pointer gates.

## Tooling versions (execution host)

- Hostname: `NOTEBOOK-DEB-RODRIGO`
- git 2.47.3
- Docker 29.6.2 / Compose v5.3.1
- .NET SDK 10.0.302
- Node v24.18.0
- Yarn 1.22.22

## Production isolation

- Production wires `createUnavailableContextualHomeAdapter` with `retryable: false`
- Guard + bundle inspect Passed (no mock fixtures in production bundle)

## Handoff

```text
PR #34 remains draft until exact-head CI is green.
Next frontend plan after merge: PLAN-0020.
Future live contextual-home integration: PLAN-0021.
```

Owner-only merge. Agents must not approve, enable auto-merge, or merge.
