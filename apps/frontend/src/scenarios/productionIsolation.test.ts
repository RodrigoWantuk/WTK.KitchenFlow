describe("production isolation", () => {
  it("does not depend on Emergent visual-edits package in production config", () => {
    // CRA Jest resolves package.json relative to the test file.
    // eslint-disable-next-line no-undef
    const pkg = require("../../package.json");
    expect(pkg.dependencies?.["@emergentbase/visual-edits"]).toBeUndefined();
    expect(pkg.devDependencies?.["@emergentbase/visual-edits"]).toBeUndefined();
  });
});
