import { createRequire } from "module";

const require = createRequire(__filename);
const {
  hasPerceptibleFocusIndicator,
  evaluateReducedMotionDurations,
  parseCssTimeSeconds,
} = require("../../scripts/browser-smoke-assertions") as {
  hasPerceptibleFocusIndicator: (sample: {
    matchesFocusVisible: boolean;
    baseline: {
      outlineStyle: string;
      outlineWidth: string;
      outlineColor: string;
      boxShadow: string;
      borderColor: string;
      borderWidth: string;
      backgroundColor: string;
    };
    focused: {
      outlineStyle: string;
      outlineWidth: string;
      outlineColor: string;
      boxShadow: string;
      borderColor: string;
      borderWidth: string;
      backgroundColor: string;
    };
  }) => boolean;
  evaluateReducedMotionDurations: (
    samples: Array<{
      id?: string;
      transitionDuration: number;
      animationDuration: number;
    }>,
    options?: { maxSeconds?: number },
  ) => { ok: boolean; violations: unknown[]; maxSeconds: number };
  parseCssTimeSeconds: (value: string | null | undefined) => number;
};

const base = {
  outlineStyle: "none",
  outlineWidth: "0px",
  outlineColor: "rgba(0, 0, 0, 0)",
  boxShadow: "none",
  borderColor: "rgb(0, 0, 0)",
  borderWidth: "1px",
  backgroundColor: "rgb(255, 255, 255)",
};

describe("browser-smoke-assertions focus comparison", () => {
  it("parses CSS time lists to the max seconds", () => {
    expect(parseCssTimeSeconds("0.5s")).toBe(0.5);
    expect(parseCssTimeSeconds("200ms, 1s")).toBe(1);
  });

  it("fails when the same decorative shadow is present before and after focus", () => {
    const shadow = "0 1px 2px rgba(0,0,0,0.1)";
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        baseline: { ...base, boxShadow: shadow },
        focused: { ...base, boxShadow: shadow },
      }),
    ).toBe(false);
  });

  it("passes when a decorative baseline shadow gains a focus ring", () => {
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        baseline: {
          ...base,
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        },
        focused: {
          ...base,
          boxShadow: "0 1px 2px rgba(0,0,0,0.1), 0 0 0 1px rgb(34, 84, 61)",
        },
      }),
    ).toBe(true);
  });

  it("passes when outline appears from none to 2px", () => {
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        baseline: base,
        focused: {
          ...base,
          outlineStyle: "solid",
          outlineWidth: "2px",
          outlineColor: "rgb(0, 0, 0)",
        },
      }),
    ).toBe(true);
  });

  it("fails when the element is focused without :focus-visible", () => {
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: false,
        baseline: base,
        focused: {
          ...base,
          outlineStyle: "solid",
          outlineWidth: "2px",
          outlineColor: "rgb(0, 0, 0)",
        },
      }),
    ).toBe(false);
  });

  it("fails when border is unchanged and no other indicator appears", () => {
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        baseline: base,
        focused: { ...base },
      }),
    ).toBe(false);
  });

  it("passes when border changes specifically on focus", () => {
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        baseline: base,
        focused: {
          ...base,
          borderColor: "rgb(34, 84, 61)",
          borderWidth: "2px",
        },
      }),
    ).toBe(true);
  });

  it("does not pass on background-only changes", () => {
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        baseline: base,
        focused: {
          ...base,
          backgroundColor: "rgb(240, 240, 240)",
        },
      }),
    ).toBe(false);
  });

  it("fails transparent or zero-width outline indicators", () => {
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        baseline: base,
        focused: {
          ...base,
          outlineStyle: "solid",
          outlineWidth: "0px",
          outlineColor: "rgb(0, 0, 0)",
        },
      }),
    ).toBe(false);
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        baseline: base,
        focused: {
          ...base,
          outlineStyle: "solid",
          outlineWidth: "2px",
          outlineColor: "rgba(0, 0, 0, 0)",
        },
      }),
    ).toBe(false);
  });

  it("rejects undue transition/animation durations under reduced-motion", () => {
    expect(
      evaluateReducedMotionDurations([
        { id: "a", transitionDuration: 0.01, animationDuration: 0 },
      ]).ok,
    ).toBe(true);
    const bad = evaluateReducedMotionDurations([
      { id: "carousel", transitionDuration: 0.01, animationDuration: 0.75 },
    ]);
    expect(bad.ok).toBe(false);
  });
});
