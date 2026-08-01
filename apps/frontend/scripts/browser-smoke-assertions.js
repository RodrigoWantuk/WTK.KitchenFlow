/**
 * Pure assertion helpers for browser smoke (unit-testable).
 */

/**
 * Parse CSS time list (`0.5s, 200ms`) into the maximum duration in seconds.
 * @param {string|null|undefined} value
 * @returns {number}
 */
function parseCssTimeSeconds(value) {
  if (!value || value === "none") return 0;
  return String(value)
    .split(",")
    .map((part) => {
      const t = part.trim().toLowerCase();
      if (!t || t === "none") return 0;
      if (t.endsWith("ms")) return (parseFloat(t) || 0) / 1000;
      if (t.endsWith("s")) return parseFloat(t) || 0;
      return parseFloat(t) || 0;
    })
    .reduce((max, n) => Math.max(max, n), 0);
}

/**
 * @typedef {{
 *   outlineStyle: string,
 *   outlineWidth: string,
 *   outlineColor: string,
 *   boxShadow: string,
 *   borderColor: string,
 *   borderWidth: string,
 *   backgroundColor: string,
 * }} FocusStyleSample
 */

/**
 * @param {string|null|undefined} color
 */
function isTransparentColor(color) {
  const c = String(color || "")
    .trim()
    .toLowerCase();
  if (!c || c === "transparent") return true;
  const rgba = c.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
  if (rgba) {
    const alpha = rgba[4] === undefined ? 1 : Number(rgba[4]);
    return alpha === 0;
  }
  return false;
}

/**
 * @param {FocusStyleSample} styles
 */
function hasVisibleOutline(styles) {
  if (!styles) return false;
  const width = parseFloat(styles.outlineWidth || "0");
  return (
    Boolean(styles.outlineStyle) &&
    styles.outlineStyle !== "none" &&
    width > 0 &&
    !isTransparentColor(styles.outlineColor)
  );
}

/**
 * Normalize box-shadow for equality checks.
 * @param {string|null|undefined} shadow
 */
function normalizeBoxShadow(shadow) {
  const s = String(shadow || "")
    .trim()
    .toLowerCase();
  if (!s || s === "none") return "none";
  return s.replace(/\s+/g, " ");
}

/**
 * Whether focus styles are perceptibly different from baseline.
 * Decorative shadows present before and after focus do not count.
 *
 * @param {{
 *   matchesFocusVisible: boolean,
 *   baseline: FocusStyleSample,
 *   focused: FocusStyleSample,
 * }} sample
 */
function hasPerceptibleFocusIndicator(sample) {
  if (!sample || !sample.matchesFocusVisible) return false;
  const baseline = sample.baseline;
  const focused = sample.focused;
  if (!baseline || !focused) return false;

  const baseOutline = hasVisibleOutline(baseline);
  const focusOutline = hasVisibleOutline(focused);
  if (!baseOutline && focusOutline) return true;
  if (
    focusOutline &&
    (focused.outlineStyle !== baseline.outlineStyle ||
      focused.outlineWidth !== baseline.outlineWidth ||
      focused.outlineColor !== baseline.outlineColor)
  ) {
    return true;
  }

  const baseShadow = normalizeBoxShadow(baseline.boxShadow);
  const focusShadow = normalizeBoxShadow(focused.boxShadow);
  if (baseShadow !== focusShadow && focusShadow !== "none") {
    return true;
  }

  if (
    focused.borderColor !== baseline.borderColor ||
    focused.borderWidth !== baseline.borderWidth
  ) {
    return true;
  }

  // Background-only changes are insufficient.
  return false;
}

/**
 * Evaluate motion-relevant duration samples under reduced-motion.
 * @param {Array<{ id?: string, transitionDuration: number, animationDuration: number }>} samples
 * @param {{ maxSeconds?: number }} [options]
 */
function evaluateReducedMotionDurations(samples, options = {}) {
  const maxSeconds =
    typeof options.maxSeconds === "number" ? options.maxSeconds : 0.5;
  const violations = (samples || []).filter(
    (s) =>
      Number(s.transitionDuration) > maxSeconds ||
      Number(s.animationDuration) > maxSeconds,
  );
  return {
    ok: violations.length === 0,
    violations,
    maxSeconds,
  };
}

/**
 * CSS selectors used to collect motion-relevant nodes in the smoke page.
 * Prefer elements actually rendered by the smoke journey.
 * @returns {string[]}
 */
function motionRelevantSelectors() {
  return [
    "[data-testid='home-route-carousel']",
    "[data-testid='home-route-carousel'] *",
    "[data-testid='home-route-carousel-list']",
    "[data-testid='route-chain']",
    "[data-testid='route-chain'] *",
    "[data-testid='scenario-bar']",
    "[data-testid='scenario-bar'] *",
    "[data-radix-dialog-content]",
    "[data-radix-dialog-overlay]",
    "[role='dialog']",
    "[data-state='open']",
    "[class*='animate-']",
    "[class*='transition']",
    "[class*='motion']",
    "[class*='duration-']",
    ".fixed",
  ];
}

module.exports = {
  parseCssTimeSeconds,
  hasPerceptibleFocusIndicator,
  hasVisibleOutline,
  isTransparentColor,
  normalizeBoxShadow,
  evaluateReducedMotionDurations,
  motionRelevantSelectors,
};
