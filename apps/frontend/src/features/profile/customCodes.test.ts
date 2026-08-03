import { createCustomStableCode, isCustomStableCode } from "./customCodes";

describe("customCodes", () => {
  it("mints an opaque code that never embeds the caller's text, since it takes no input", () => {
    // createCustomStableCode() intentionally accepts no arguments: there is no way
    // for user-entered text to leak into the generated code.
    const code = createCustomStableCode();
    expect(code).toMatch(/^custom_[0-9a-f-]+$/i);
    expect(code.length).toBeGreaterThanOrEqual(2);
    expect(code.length).toBeLessThanOrEqual(64);
    expect(/\s/.test(code)).toBe(false);
  });

  it("generates a distinct code on every call", () => {
    const codes = new Set(
      Array.from({ length: 20 }, () => createCustomStableCode()),
    );
    expect(codes.size).toBe(20);
  });

  it("round-trips through isCustomStableCode", () => {
    const code = createCustomStableCode();
    expect(isCustomStableCode(code)).toBe(true);
  });

  it("does not recognize catalog or arbitrary codes as custom", () => {
    expect(isCustomStableCode("oven")).toBe(false);
    expect(isCustomStableCode("spicy_food")).toBe(false);
    expect(isCustomStableCode("custom")).toBe(false);
    expect(isCustomStableCode("custom_")).toBe(true);
  });

  it("rejects codes containing whitespace even if prefixed correctly", () => {
    expect(isCustomStableCode("custom_ has space")).toBe(false);
  });
});
