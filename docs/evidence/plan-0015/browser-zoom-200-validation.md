# PLAN-0015 — Automated headed native-browser-zoom smoke

## Final disposition

**Passed** (`zoomDisposition: Passed`) — fail-closed required scenario set (22/22 Passed).

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
| `testedMainSha` | `da295932cd678eef5b8559c39217e19f101d7a80` (`origin/main` / `ZOOM_TESTED_MAIN_SHA`) |
| `evidenceBranchHead` | recorded in JSON (`git rev-parse HEAD` on evidence branch) |
| `frontendImplementationSha` | `e248126346d60c99df82e9c1e9f1954a07e68da2` (PR #16) |
| Test finished (UTC) | see JSON `finishedAt` |
| OS | Linux 6.12.96+deb13-amd64 (x64) |
| Window target | 1280 × 800 (Firefox may report display-native baseline) |
| Modes | `production` (`build-production/`), `prototype` (`build-prototype/`) |

## Commands

```bash
cd apps/frontend
yarn install --frozen-lockfile
yarn build:production
yarn build:prototype
ZOOM_TESTED_MAIN_SHA=da295932cd678eef5b8559c39217e19f101d7a80 \
  node scripts/browser-zoom-200-validation.js
cd ../..
node --check apps/frontend/scripts/browser-zoom-200-validation.js
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
| `widthRatio` | 2.0 |
| `calculatedZoomPercent` | 200 |
| `zoomConfirmed200` | true |
| `status` | Passed |

### Firefox

| Field | Value |
|---|---|
| `widthRatio` | 2.0 |
| `calculatedZoomPercent` | 200 |
| `zoomConfirmed200` | true |
| `status` | Passed |

## Required scenarios (fail-closed)

Exactly **22** required IDs (11 × Chrome + 11 × Firefox). Summary: **22 Passed / 0 Failed / 0 Blocked / 0 Not applicable / 0 Unsupported**.

| Surface | Chromium | Firefox |
|---|---|---|
| Landing | Passed | Passed |
| Access | Passed | Passed |
| FeatureUnavailable | Passed | Passed |
| Language_selector | Passed | Passed |
| Home | Passed | Passed |
| Pantry | Passed | Passed |
| Planning_dialog | Passed | Passed |
| Shopping | Passed | Passed |
| Carousel_home | Passed | Passed |
| Cook_CTA | Passed | Passed |
| Item_detail_navigation | Passed | Passed |

### Scenario honesty notes

- **Cook_CTA:** requires `actualPath === href` (or documented cook route / new destination dialog). Body keyword match alone is rejected. Primary activation is normal `click()`; `force: true` is not accepted as proof. Keyboard Enter after overlay-blocked pointer may be recorded as `enter-after-click-blocked`.
- **Planning_dialog:** `open-reality-changed` → `role=dialog` with name; Escape closes; `focusReturned=true` required.
- **Carousel_home:** scenario `routeWithDeps`; Next/Arrow must change active item/index (`changed=true`).
- **Item_detail_navigation:** link click must navigate (`linkClickNavigation=true`); `page.goto` fallback does not pass the interaction scenario.
- **Language_selector:** separate from FeatureUnavailable; requires accessible control + known string change + restore.
- **FeatureUnavailable:** message/readable/no overflow/no mock data only.

## Evidence validator

```bash
node scripts/frontend/validate-zoom-evidence.mjs
```

Result: **OK** — all required Passed; disposition recomputed; Cook/dialog/carousel/item/language rules enforced; manual claims remain Deferred.

CI (`.github/workflows/frontend.yml` quality job) runs `node --check` on the smoke script and this validator against the versioned JSON.

## Screenshots

Optional, non-gating, gitignored under `docs/evidence/plan-0015/artifacts/`.

## Deferred (non-blocking)

```text
Manual visual review: Deferred — non-blocking in the current phase
NVDA manual audit: Deferred — non-blocking in the current phase
VoiceOver manual audit: Deferred — non-blocking in the current phase
Manual exploratory charters: Deferred — non-blocking
Manual screenshot inspection: Deferred — non-blocking
```

## Plan impact

- PLAN-0015 → **Completed** (implementation Merged via PR #16; fail-closed zoom smoke Passed; Frontend CI green; PR #18 awaits owner merge)
- PLAN-0005 → **Ready** (not started in this PR)
- PLAN-0011 → **Blocked** by PLAN-0005
