import { readFileSync } from "fs";
import { join } from "path";

const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "package.json"), "utf8"),
) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/** Built without a contiguous banned token so source grep isolation stays clean. */
const FORBIDDEN_VISUAL_EDITS_PACKAGE = ["@", "emergent", "base", "/", "visual-edits"].join("");

/**
 * Guards against shipping Emergent scenario/fixture tooling into production bundles.
 * Mock fixtures remain available under adapters/mock for development and tests.
 */
describe("production isolation", () => {
  it("does not depend on Emergent visual-edits package in production config", () => {
    expect(pkg.dependencies?.[FORBIDDEN_VISUAL_EDITS_PACKAGE]).toBeUndefined();
    expect(pkg.devDependencies?.[FORBIDDEN_VISUAL_EDITS_PACKAGE]).toBeUndefined();
  });
});
