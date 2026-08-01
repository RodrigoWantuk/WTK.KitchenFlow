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
 * Whether focused styles include a perceptible keyboard focus indicator.
 * @param {{
 *   matchesFocusVisible: boolean,
 *   outlineStyle?: string,
 *   outlineWidth?: string,
 *   boxShadow?: string,
 *   borderColor?: string,
 *   borderWidth?: string,
 *   baselineBorderColor?: string,
 *   baselineBorderWidth?: string,
 * }} sample
 */
function hasPerceptibleFocusIndicator(sample) {
  if (!sample || !sample.matchesFocusVisible) return false;
  const outlineOk =
    Boolean(sample.outlineStyle) &&
    sample.outlineStyle !== "none" &&
    parseFloat(sample.outlineWidth || "0") > 0;
  const shadow = String(sample.boxShadow || "").trim();
  const shadowOk = Boolean(shadow) && shadow !== "none";
  const borderChanged =
    (sample.baselineBorderColor != null &&
      sample.borderColor !== sample.baselineBorderColor) ||
    (sample.baselineBorderWidth != null &&
      sample.borderWidth !== sample.baselineBorderWidth);
  return outlineOk || shadowOk || Boolean(borderChanged);
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
 * @returns {string[]}
 */
function motionRelevantSelectors() {
  return [
    "[data-testid='home-route-carousel']",
    "[data-testid='home-route-carousel'] *",
    "[data-testid='route-chain']",
    "[data-testid='route-chain'] *",
    "[class*='animate-']",
    "[class*='transition']",
    "[class*='motion']",
    "[class*='duration-']",
    "[data-state]",
    "[role='dialog']",
    "[data-radix-portal]",
    ".fixed",
    ".absolute.inset-0",
  ];
}

module.exports = {
  parseCssTimeSeconds,
  hasPerceptibleFocusIndicator,
  evaluateReducedMotionDurations,
  motionRelevantSelectors,
};
