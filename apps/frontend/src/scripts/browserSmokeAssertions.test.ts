import { createRequire } from "module";

const require = createRequire(__filename);
const {
  hasPerceptibleFocusIndicator,
  evaluateReducedMotionDurations,
  parseCssTimeSeconds,
} = require("../../scripts/browser-smoke-assertions") as {
  hasPerceptibleFocusIndicator: (sample: {
    matchesFocusVisible: boolean;
    outlineStyle?: string;
    outlineWidth?: string;
    boxShadow?: string;
    borderColor?: string;
    borderWidth?: string;
    baselineBorderColor?: string;
    baselineBorderWidth?: string;
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

describe("browser-smoke-assertions", () => {
  it("parses CSS time lists to the max seconds", () => {
    expect(parseCssTimeSeconds("0.5s")).toBe(0.5);
    expect(parseCssTimeSeconds("200ms, 1s")).toBe(1);
    expect(parseCssTimeSeconds("none")).toBe(0);
  });

  it("requires :focus-visible plus a perceptible indicator", () => {
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        outlineStyle: "none",
        outlineWidth: "0px",
        boxShadow: "0 0 0 1px rgb(0,0,0)",
      }),
    ).toBe(true);
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        outlineStyle: "solid",
        outlineWidth: "2px",
        boxShadow: "none",
      }),
    ).toBe(true);
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        outlineStyle: "none",
        outlineWidth: "0px",
        boxShadow: "none",
        borderColor: "rgb(1,2,3)",
        borderWidth: "2px",
        baselineBorderColor: "rgb(0,0,0)",
        baselineBorderWidth: "1px",
      }),
    ).toBe(true);
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: false,
        outlineStyle: "solid",
        outlineWidth: "2px",
      }),
    ).toBe(false);
    expect(
      hasPerceptibleFocusIndicator({
        matchesFocusVisible: true,
        outlineStyle: "none",
        outlineWidth: "0px",
        boxShadow: "none",
      }),
    ).toBe(false);
  });

  it("rejects undue transition/animation durations under reduced-motion", () => {
    const ok = evaluateReducedMotionDurations([
      { id: "a", transitionDuration: 0.01, animationDuration: 0 },
    ]);
    expect(ok.ok).toBe(true);

    const bad = evaluateReducedMotionDurations([
      { id: "sheet", transitionDuration: 0.5, animationDuration: 0 },
      { id: "carousel", transitionDuration: 0.01, animationDuration: 0.75 },
    ]);
    expect(bad.ok).toBe(false);
    expect(bad.violations).toHaveLength(1);
    expect((bad.violations[0] as { id?: string }).id).toBe("carousel");
  });
});
