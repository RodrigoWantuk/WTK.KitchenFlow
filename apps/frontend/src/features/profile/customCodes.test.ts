import { createCustomStableCode, isCustomStableCode } from "./customCodes";

describe("customCodes", () => {
  it("mints an opaque UUID-v4 code that never embeds caller text", () => {
    const code = createCustomStableCode();
    expect(code).toMatch(
      /^custom_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
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
    expect(isCustomStableCode(createCustomStableCode())).toBe(true);
  });

  it("accepts lowercase and uppercase UUID-v4 custom codes", () => {
    expect(
      isCustomStableCode("custom_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"),
    ).toBe(true);
    expect(
      isCustomStableCode("CUSTOM_AAAAAAAA-BBBB-4CCC-9DDD-EEEEEEEEEEEE"),
    ).toBe(true);
  });

  it("rejects catalog codes and malformed custom prefixes", () => {
    expect(isCustomStableCode("oven")).toBe(false);
    expect(isCustomStableCode("spicy_food")).toBe(false);
    expect(isCustomStableCode("custom")).toBe(false);
    expect(isCustomStableCode("custom_")).toBe(false);
    expect(isCustomStableCode("custom_invalid")).toBe(false);
    expect(isCustomStableCode("custom_123")).toBe(false);
    expect(isCustomStableCode("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee")).toBe(
      false,
    );
    expect(
      isCustomStableCode("custom_aaaaaaaa-bbbb-5ccc-8ddd-eeeeeeeeeeee"),
    ).toBe(false);
    expect(
      isCustomStableCode("custom_aaaaaaaa-bbbb-4ccc-cddd-eeeeeeeeeeee"),
    ).toBe(false);
    expect(isCustomStableCode("custom_ has space")).toBe(false);
    expect(
      isCustomStableCode(
        `custom_${"a".repeat(80)}-bbbb-4ccc-8ddd-eeeeeeeeeeee`,
      ),
    ).toBe(false);
    expect(
      isCustomStableCode("custom_peanut-butter-4aaa-8bbb-cccccccccccc"),
    ).toBe(false);
  });
});
