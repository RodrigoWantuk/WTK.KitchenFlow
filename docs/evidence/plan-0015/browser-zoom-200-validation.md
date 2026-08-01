# PLAN-0015 — Automated headed native-browser-zoom smoke

## Final disposition

**Passed** (`zoomDisposition: Passed`)

| Gate | Result |
|---|---|
| Automated headed native zoom | **Executed** |
| Chromium native zoom ~200% | **Passed** (`widthRatio=2.0`, `calculatedZoomPercent=200`) |
| Firefox native zoom ~200% | **Passed** (`widthRatio=2.0`, `calculatedZoomPercent=200`) |
| Firefox browser/responsive smoke | **Passed** (layout + asserted interactions) |
| Manual visual review | **Deferred — non-blocking** (owner decision) |
| Full NVDA/VoiceOver manual audit | **Deferred — non-blocking** (owner decision) |

Headed mode does **not** mean human review. This is automated Playwright + OS-level Ctrl+Plus zoom.

## Baselines

| Field | Value |
|---|---|
| Tested main SHA | `da295932cd678eef5b8559c39217e19f101d7a80` (branch docs head may differ) |
| Frontend implementation SHA (PR #16) | `e248126346d60c99df82e9c1e9f1954a07e68da2` |
| Test finished (UTC) | see JSON `finishedAt` |
| OS | Linux 6.12.96+deb13-amd64 (x64) |
| Window target | 1280 × 800 |
| Modes | `production` (`build-production/`), `prototype` (`build-prototype/`) |

## Commands

```bash
cd apps/frontend
yarn install --frozen-lockfile
yarn build:production
yarn build:prototype
# static SPA serve on :4173 (production) and :4174 (prototype)
node apps/frontend/scripts/browser-zoom-200-validation.js
node scripts/frontend/validate-zoom-evidence.mjs
```

Machine-readable report: [`browser-zoom-200-validation.json`](./browser-zoom-200-validation.json).

## Zoom measurement (automated)

Formula:

```text
widthRatio = baselineInnerWidthAt100 / zoomedInnerWidth
calculatedZoomPercent = round(widthRatio * 100)
accept when 1.90 <= widthRatio <= 2.10
```

Mechanism: headed window + OS `Ctrl+0` / `Ctrl+Plus` via `xdotool` (native browser zoom).

Excluded substitutes: CSS `zoom`, `transform:scale()`, `deviceScaleFactor` as sole evidence, artificial Playwright viewport shrink, DevTools device emulation as sole evidence, human visual review.

### Chromium

| Field | Value |
|---|---|
| `baselineInnerWidthAt100` | 1280 |
| `zoomedInnerWidth` | 640 |
| `widthRatio` | 2.0 |
| `calculatedZoomPercent` | 200 |
| `numberOfZoomInActions` | 5 |
| `zoomConfirmed200` | true |
| `status` | Passed |

### Firefox

| Field | Value |
|---|---|
| `baselineInnerWidthAt100` | 1366 |
| `zoomedInnerWidth` | 683 |
| `widthRatio` | 2.0 |
| `calculatedZoomPercent` | 200 |
| `numberOfZoomInActions` | 6 |
| `zoomConfirmed200` | true |
| `status` | Passed |

No contradictory `approxZoomPercent: 100` with `zoomConfirmed200: true`.

## Scenario results

Summary: **22 Passed / 0 Failed / 0 Blocked / 4 Not applicable**.

Each scenario records `startPath`, `action`, `expectedPath`/`expectedState`, `actualPath`/`actualState`, `assertion`, `status`.

`Passed` is used only with an assertion. Interactions that are not present are **Not applicable** (not Passed).

### Production

| Surface | Chromium | Firefox |
|---|---|---|
| Landing | Passed | Passed |
| Access | Passed | Passed |
| Language / FeatureUnavailable (`/acesso`) | Passed | Passed |
| FeatureUnavailable `/app/hoje` | Passed | Passed |

### Prototype (after automated demo-session entry)

| Surface | Chromium | Firefox |
|---|---|---|
| Landing / Access / Home / Pantry / Shopping | Passed | Passed |
| Planning dialog | Not applicable | Not applicable |
| Carousel next | Not applicable | Not applicable |
| Cook CTA navigation | Passed | Passed |
| Item detail route | Passed | Passed |

## Evidence validator

```bash
node scripts/frontend/validate-zoom-evidence.mjs
```

Result: **OK** (no contradictory zoom claims; no Passed without assertion; summary matches scenarios).

## Screenshots

Optional, non-gating, gitignored under `docs/evidence/plan-0015/artifacts/`. Not required for disposition.

## Deferred (non-blocking)

```text
Manual visual review: Deferred — non-blocking in the current phase
NVDA manual audit: Deferred — non-blocking in the current phase
VoiceOver manual audit: Deferred — non-blocking in the current phase
Manual exploratory charters: Deferred — non-blocking
Manual screenshot inspection: Deferred — non-blocking
Candidate for a later pre-release validation plan
```

## Plan impact

- PLAN-0015 → **Completed** (implementation Merged via PR #16; zoom smoke Passed)
- PLAN-0005 → **Ready** (not started in this PR)
- PLAN-0011 → **Blocked** by PLAN-0005 automated validation
