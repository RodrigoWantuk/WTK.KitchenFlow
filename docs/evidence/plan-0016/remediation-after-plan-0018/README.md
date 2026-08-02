# PLAN-0016 remediation after PLAN-0018 Fail

## Distinguishes from PLAN-0018

| Field | PLAN-0018 (immutable Fail) | This remediation (implementation evidence) |
| --- | --- | --- |
| Candidate SHA | `814af253814d0ec7f8b0adbbca9c50040b5bab07` | CI-green code tip `68c04fc` (see `workflow-ids.md`); Validating docs tip may be later |
| Outcome | **Fail** | Implementation-agent remediations only — **not** independent Pass |
| Evidence | `docs/evidence/plan-0018/` | this directory |

PLAN-0018’s Fail assessment must not be rewritten.

## Blocking findings addressed

1. **#26** — foreign inventory adjustment returned **412** instead of nondisclosing **404**.
2. **#21** — Firefox native ~200% Cook CTA pointer Failed (keyboard Passed).
3. **#22** — Firefox native ~200% pantry item pointer Failed (keyboard Passed).

Issues remain **open** pending independent verification. #20/#24 remain owner-controlled.

## #26 root cause and fix

- **Root cause:** `InventoryLotApplicationWorkflow.MutateAsync` evaluated `If-Match` presence/validity **before** owner-scoped `LoadActiveAsync`. A fabricated ETag (`"v1"`) produced `precondition_failed` (412) for foreign lots.
- **Fix:** Owner-scoped active load first; missing/foreign → `resource_not_found`; only then evaluate 428/412. `FailIfNotOwnedActiveAsync` also gates update/adjust/delete before body validation.
- **Owner concurrency preserved:** owner missing `If-Match` → 428; stale → 412; current → 200.
- **Tests:** `ForeignAndNonexistentLotMutationsAreNondisclosingForPreconditionVariants` (foreign ≡ nonexistent across adjust/update/delete/history/precondition variants).

## #21 / #22 root causes and fixes

### Diagnosis (headed Firefox, native zoom, `widthRatio=2.0`)

- At ~200% Firefox full-page zoom, `devicePixelRatio` rises **1 → 2** while `innerWidth` halves (~1162 → 581), inducing the mobile layout (`md` breakpoint) including fixed bottom nav.
- `document.elementFromPoint(CSS center)` hit the Cook CTA and pantry link (product geometry OK at CSS centers).
- Playwright `locator.click` / unscaled `mouse.click(CSS)` landed at approximately `client = CSS / dpr`, missing the target (Cook → nearby image; Pantry → tab chrome such as `tab-attention`).
- Prototype `ScenarioBar` fixed FAB (`z-50`, `bottom-24 right-4`) overlapped pantry card hit boxes under the zoom-induced mobile width.

### Product fixes

- Move `ScenarioBar` into the sticky header (no fixed FAB over content).
- Keep no hover `transform` on `.card-hover`.
- Strengthen `scroll-margin-top` / `scroll-margin-bottom` for sticky header + bottom nav.

### Harness fixes (fail-closed)

- `apps/frontend/scripts/firefox-native-zoom-pointer-keyboard.cjs` (`yarn validate:firefox-native-zoom`)
- Updated `scripts/plan-0005/firefox-zoom-pointer-keyboard.cjs`
- Pointer path: `elementFromPoint` must hit target, then real `page.mouse.click(cx * dpr, cy * dpr)`.
- Pointer Fail or missing native zoom measurement → non-zero exit (never Passed via Unsupported/Skipped/keyboard substitution).

## Local validation matrix (implementation agent)

| Scenario | Pointer | Keyboard |
| --- | ---: | ---: |
| Cook CTA | Passed | Passed |
| Pantry item | Passed | Passed |

Machine-readable: `firefox-zoom-pointer-keyboard.json`  
Diagnostics: `diagnostics/` (pre-fix hit-test report + screenshots)

### Backend (`dotnet test apps/backend/KitchenFlow.slnx -c Release`)

| Assembly | Passed |
| --- | ---: |
| KitchenFlow.UnitTests | 46 |
| KitchenFlow.ArchitectureTests | 14 |
| KitchenFlow.IntegrationTests | 144 |
| **Total** | **204** |

### Frontend gates

All listed PLAN-0016 frontend commands exited 0, including `yarn smoke:browser:ci` and `yarn validate:firefox-native-zoom` (headed Firefox under Xvfb; browser 141.0; `widthRatio=2.0`).

### API client

Double `yarn generate` introduced no tracked drift.

## Known limitations

- Implementation evidence is **not** independent Pass.
- PLAN-0005 remains Conditional Pass; PLAN-0011 remains Blocked.
- PR #25 remains Draft; no merge/auto-merge/approval by this agent.
- GitHub Actions workflow IDs for the exact final tip are recorded in the Validating handoff once green.
