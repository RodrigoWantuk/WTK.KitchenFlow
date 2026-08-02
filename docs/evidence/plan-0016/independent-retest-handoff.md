# PLAN-0016 → Independent retest handoff (post–PLAN-0018 remediation)

## Purpose

PLAN-0018 independently tested tip `814af25` and concluded **Fail** (#21/#22 pointer; #26 isolation).
This handoff covers the **new PLAN-0016 remediation candidate**. Implementation-agent evidence is **not** final authority.

## System under test

- Branch: `agent/plan-0016-production-inventory-frontend`
- Draft PR: [#25](https://github.com/RodrigoWantuk/WTK.Cocinaris/pull/25) (keep Draft)
- Base: `main`
- Prior failed candidate: `814af253814d0ec7f8b0adbbca9c50040b5bab07`
- Remediação tip: record exact SHA from `git rev-parse HEAD` on the PR head after CI sync (also `docs/evidence/plan-0016/remediation-after-plan-0018/exact-remediation-sha.txt`)
- Diff since PLAN-0018 tip: `git diff 814af253814d0ec7f8b0adbbca9c50040b5bab07...HEAD`
- PLAN-0018 Fail evidence (immutable): `docs/evidence/plan-0018/`

## Required independent coverage

| Case | Issue | What to verify |
| --- | --- | --- |
| Foreign adjust fabricated If-Match | #26 | User B adjust on A’s lot → **404** (not 412); same as random GUID |
| Foreign/missing across ops | #26 | detail, adjust (fabricated/stale/missing If-Match), update, delete, history, availability — foreign ≡ nonexistent |
| Owner concurrency | #26 regression | Owner missing If-Match → **428**; stale → **412**; current → success |
| Cook CTA pointer @ Firefox native ~200% | #21 | Real pointer Passed; keyboard separate |
| Pantry item pointer @ Firefox native ~200% | #22 | Real pointer Passed; keyboard separate |
| Production inventory journey | #20 | Still live BFF path (do not close without owner) |
| Generated client | #24 | Drift/generate green (do not close without owner) |
| Production isolation | — | No mock/fixture leakage in production bundle |
| Adjacent smoke | — | Frontend CI + browser smoke on exact tip |

## Firefox native zoom procedure (fail-closed)

```bash
cd apps/frontend
BUILD_PATH=build-prototype yarn build:prototype
BUILD_PATH=build-production yarn build:production   # if required by shared scripts
DISPLAY=:99 HOME=/root XAUTHORITY= yarn validate:firefox-native-zoom
# or: node ../../scripts/plan-0005/firefox-zoom-pointer-keyboard.cjs
```

Requirements:

- Headed Firefox (not Chromium)
- Native `Ctrl+0` / `Ctrl+Plus` via xdotool (no CSS zoom, no viewport resize substitute)
- Measured `widthRatio` ≈ 2.0
- Pointer and keyboard independent; keyboard Pass must not upgrade pointer
- Unsupported/Skipped/incomplete → Fail

## Backend isolation reproduction (#26)

Reproduce PLAN-0018 steps:

1. User A creates a lot; capture `lotId` + ETag.
2. User B `GET` lot → 404.
3. User B `POST .../adjustments` with fabricated `If-Match: "v1"` → must be **404** (was 412 on `814af25`).
4. Repeat for missing If-Match, owner ETag, update, delete, history; compare to random GUID.

Automated coverage exists in `ForeignAndNonexistentLotMutationsAreNondisclosingForPreconditionVariants` — still re-run independently.

## Frontend / contracts commands

Same as prior handoff (`yarn` gates under `apps/frontend` and `packages/api-client`, including double generate).

## Outcome recording rules

- Do **not** treat implementation evidence as Pass.
- Keep PLAN-0005 **Conditional Pass** until independent acceptance.
- Keep PLAN-0011 **Blocked**.
- Do not close #21/#22/#26/#20/#24 without owner/independent authority.
- Do not edit PR #23; do not create PLAN-0017; do not rewrite PLAN-0018 Fail → Pass.
- Agents must not approve/merge PR #25 or enable auto-merge.
