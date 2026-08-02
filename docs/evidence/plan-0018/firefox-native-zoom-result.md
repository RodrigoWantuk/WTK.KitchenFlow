# TEST-0018-008 — Firefox native ~200% zoom (#21 / #22)

- **Exact SHA:** `814af253814d0ec7f8b0adbbca9c50040b5bab07`
- **Technique:** headed Playwright Firefox under Xvfb; `xdotool` `Ctrl+0` / repeated `Ctrl+Plus`
- **CSS zoom:** forbidden / not used
- **Measured ratio:** baseline innerWidth 1162 → zoomed 581 → **widthRatio = 2.0** (6 zoom-in actions)
- **Browser:** Playwright Firefox 141.0 (`HOME=/root` required on this host)

| Scenario | Pointer | Keyboard |
|---|---|---|
| #21 Cook CTA `[data-testid=sugg-open-r2]` | **Failed** (timeout; URL unchanged) | **Passed** (navigated to `/app/receitas/r2`) |
| #22 Pantry item `[data-testid^=pantry-item-link-]` | **Failed** (timeout; URL unchanged) | **Passed** (navigated to detail) |

Machine-readable payload: `firefox-zoom-pointer-keyboard.json`.

**Conclusion:** PLAN-0016 CSS remediation hypothesis is **not** confirmed. Issues #21 and #22 remain open.
