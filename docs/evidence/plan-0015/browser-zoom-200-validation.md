# PLAN-0015 — Automated headed native-browser-zoom smoke

## Final disposition

**Passed** (`zoomDisposition: Passed`) — fail-closed required scenario set (22/22 Passed).

| Gate | Result |
|---|---|
| Automated headed native zoom | **Executed** |
| Chromium native zoom ~200% | **Passed** (`widthRatio=2.0`, `calculatedZoomPercent=200`) |
| Firefox native zoom ~200% | **Passed** (`widthRatio=2.0`, `calculatedZoomPercent=200`) |
| Firefox browser/responsive smoke | **Passed** (layout + asserted interactions; see Firefox pointer/keyboard note) |
| Manual visual review | **Deferred — non-blocking** (owner decision) |
| Full NVDA/VoiceOver manual audit | **Deferred — non-blocking** (owner decision) |

Headed mode does **not** mean human review. This is automated Playwright + OS-level Ctrl+Plus zoom.

## Baselines

| Field | Value |
|---|---|
| `testedMainSha` | `da295932cd678eef5b8559c39217e19f101d7a80` |
| `evidenceBranchHead` | `25aa10c39dff3fbdc6ab978a64adc941b3246040` |
| `frontendImplementationSha` | `e248126346d60c99df82e9c1e9f1954a07e68da2` (PR #16) |
| Test finished (UTC) | see JSON `finishedAt` |
| OS | Linux 6.12.96+deb13-amd64 (x64) |
| Window target | 1280 × 720 (Firefox may report a different internal baseline width) |
| Modes | `production` (`build-production/`), `prototype` (`build-prototype/`) |

`evidenceBranchHead` is the commit on which the headed smoke run generated the versioned JSON. Later PR #18 commits are workflow integration, documentation reconciliation, and plan-state updates only — the JSON was **not** regenerated solely to chase the documentary tip.

Current PR tip and latest exact-head Frontend workflow: see [PR #18](https://github.com/RodrigoWantuk/WTK.KitchenFlow/pull/18) metadata/body (not duplicated here to avoid self-SHA commit loops).

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

Exactly **22** required IDs (11 × Chrome + 11 × Firefox).

```text
Result:
22 Passed
0 Failed
0 Blocked
0 Not applicable
0 Unsupported
```

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

### Key scenario results

```text
Planning_dialog: Passed on Chrome and Firefox
Carousel_home: Passed on Chrome and Firefox
Cook_CTA: Passed on Chrome and Firefox
Item_detail_navigation: Passed on Chrome and Firefox
Language_selector: Passed on Chrome and Firefox
```

### Scenario honesty notes

- **Cook_CTA:** requires `actualPath === href` (or documented cook route / new destination dialog). Body keyword match alone is rejected. Primary activation is normal `click()`; `force: true` is not accepted as proof.
- **Planning_dialog:** `open-reality-changed` → `role=dialog` with name; Escape closes; `focusReturned=true` required (`RealityChangedDialog.returnFocusSelector` / `onCloseAutoFocus` preserved).
- **Carousel_home:** scenario `routeWithDeps`; control must change active item/index (`changed=true`).
- **Item_detail_navigation:** link activation must navigate (`linkClickNavigation=true`); `page.goto` fallback does not pass the interaction scenario.
- **Language_selector:** separate from FeatureUnavailable; requires accessible control + known string change + restore.
- **FeatureUnavailable:** message/readable/no overflow/no mock data only.

### Non-blocking limitation — Firefox pointer vs keyboard at ~200% zoom

At native browser zoom ~200%:

```text
Chrome:
- Cook CTA pointer click passed
- Pantry item pointer click passed

Firefox:
- Playwright pointer hit-test was blocked for Cook CTA and pantry item
- Keyboard Enter activation succeeded (recorded as enter-after-click-blocked)
- Expected route navigation was confirmed
```

This is **not** a zoom-gate failure: the journey remained keyboard-operable, and earlier touch/mobile smoke coverage remains. It is **not** a claim that Firefox pointer activation was validated successfully.

Deferred to **PLAN-0005** automated scope (do not start here):

```text
Repeat Firefox Cook CTA and pantry item interactions at 200%,
with separate assertions for pointer activation and keyboard activation.
```

Do not open an issue unless PLAN-0005 automation confirms a reproducible pointer-click failure.

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
Firefox pointer activation at 200% (separate from keyboard): PLAN-0005 automated follow-up
```

## Plan impact

- PLAN-0015 → **Completed** (implementation Merged via PR #16; fail-closed zoom smoke Passed; PR #18 awaits owner merge)
- PLAN-0005 → **Ready** (not started in this PR)
- PLAN-0011 → **Blocked** by PLAN-0005
