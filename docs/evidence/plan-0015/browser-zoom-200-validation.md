# PLAN-0015 — Real browser zoom 200% validation

## Final disposition

**Passed**

All required production and prototype surfaces passed at native browser zoom **200%** on headed Google Chrome and Firefox. No High/Critical layout defects were found. Full NVDA/VoiceOver assistive-technology audit was **not** executed in this phase (owner decision: deferred to PLAN-0005).

## Baselines

| Field | Value |
|---|---|
| Tested main SHA | `da295932cd678eef5b8559c39217e19f101d7a80` |
| Frontend implementation SHA (PLAN-0015 / PR #16 merge) | `e248126346d60c99df82e9c1e9f1954a07e68da2` |
| Test date (UTC) | 2026-08-01T14:01:00Z (approx.; see JSON `startedAt`/`finishedAt`) |
| Operating system | Linux 6.12.96+deb13-amd64 (x64), host `NOTEBOOK-DEB-RODRIGO` |
| Physical / OS window target | 1280 × 800 |
| Frontend modes | `production` (`build-production/`) and `prototype` (`build-prototype/`) |

## Commands

```bash
cd apps/frontend
yarn install --frozen-lockfile
yarn build:production
yarn build:prototype
# Static SPA serve (not vite/webpack-dev-server):
#   http://127.0.0.1:4173 → build-production
#   http://127.0.0.1:4174 → build-prototype
```

Machine-readable report: [`browser-zoom-200-validation.json`](./browser-zoom-200-validation.json).

## Browsers

| Browser | Version | Role |
|---|---|---|
| Google Chrome | 150.0.7871.186 | Primary headed validation |
| Firefox (Playwright-managed, headed) | 141.0 | Second required browser |
| System Firefox ESR (reference) | 140.13.0esr | Present on host; validation used Playwright Firefox binary |

## Zoom method (native)

Zoom was applied with the **real browser zoom** controls:

1. Focus the headed browser window.
2. `Ctrl+0` to reset to 100%.
3. Repeated `Ctrl+Plus` via OS input (`xdotool`) until layout CSS width was approximately half the baseline (`innerWidth ≈ baseline/2`).

**Confirmed on Chrome:** `outerWidth=1280`, `innerWidth=640`, `approxZoomPercent=200`, `devicePixelRatio=2`.

**Confirmed on Firefox:** `innerWidth` reduced to ~50% of the pre-zoom baseline after the same native Ctrl+Plus sequence (`devicePixelRatio=2`). Playwright’s Firefox window metrics report `outerWidth ≈ innerWidth`, so percentage derived from outer/inner is not used as the Firefox confirmation signal.

### Explicitly excluded substitutes

- CSS `zoom`
- `transform: scale()`
- Playwright `deviceScaleFactor` as the only evidence
- Artificially reduced Playwright viewport as a zoom substitute
- DevTools device emulation as the only evidence

## Surface results

Summary: **26 Passed / 0 Failed / 0 Blocked**.

### Production (`yarn build:production`)

| Surface | Chrome | Firefox |
|---|---|---|
| Landing `/` | Passed | Passed |
| Access `/acesso` | Passed | Passed |
| Language selector + FeatureUnavailable messaging (`/acesso`) | Passed | Passed |
| FeatureUnavailable authenticated home `/app/hoje` | Passed | Passed |

Production notes: no mock inventory/session data observed; FeatureUnavailable / access messaging remained readable; language controls remained reachable; no global horizontal overflow.

### Prototype (`yarn build:prototype`)

| Surface | Chrome | Firefox |
|---|---|---|
| Landing | Passed | Passed |
| Access | Passed | Passed |
| Home `/app/hoje` | Passed | Passed |
| Pantry `/app/despensa` | Passed | Passed |
| Planning `/app/planejamento` (dialog attempt) | Passed | Passed |
| Shopping `/app/compras` | Passed | Passed |
| Carousel on Home | Passed | Passed |
| Cook CTA on Home | Passed | Passed |
| Item detail via pantry link | Passed | Passed |

Prototype notes: main navigation, carousel controls, Cook CTA, and reachable item/recipe detail paths remained operable at 200%; no essential content loss; no global horizontal overflow; dialogs (when present) could be dismissed.

## Acceptance checks exercised

For each surface:

- Essential content remained visible
- No global horizontal overflow (`scrollWidth − clientWidth ≤ 12px`)
- Text not blank / not missing expected FeatureUnavailable messaging on production auth routes
- Interactive controls remained present and not entirely outside the viewport
- Keyboard Tab still moved focus
- Dialog open/close attempted where applicable
- Carousel / Cook CTA exercised where applicable

## Defects found

None for this gate.

## Screenshots / artifacts

PNG captures were produced under `docs/evidence/plan-0015/artifacts/{chrome,firefox}/` during the headed run (gitignored binary artifacts; not versioned here). Paths are recorded per surface in [`browser-zoom-200-validation.json`](./browser-zoom-200-validation.json). Screenshots may be attached to the documentation PR or published as a CI/workflow artifact if the owner requests visual review.

No personal data, cookies, tokens, or credentials are included.

## Owner decision — assistive technology

```text
Full NVDA/VoiceOver audit:
Deferred to PLAN-0005 by owner decision
Not executed in PLAN-0015 Phase 0
Do not claim complete AT audit for PLAN-0015
```

## Plan impact

Because real browser zoom 200% **Passed**:

- PLAN-0015 may be marked **Completed**
- PLAN-0005 remains **Ready** (not started in this documentation PR)
- PLAN-0011 remains **Blocked** (awaits PLAN-0005 progress after PLAN-0015 completion merge)
