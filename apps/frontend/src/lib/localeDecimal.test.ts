import { formatLocaleDecimal, parseLocaleDecimal } from "./localeDecimal";

describe("parseLocaleDecimal", () => {
  it("parses English decimals and optional thousands", () => {
    expect(parseLocaleDecimal("1,234.5", "en")).toEqual({
      ok: true,
      value: 1234.5,
      canonical: "1234.5",
    });
    expect(parseLocaleDecimal("0.75", "en")).toMatchObject({
      ok: true,
      value: 0.75,
    });
  });

  it("parses pt-BR and es decimals with comma separator", () => {
    expect(parseLocaleDecimal("1.234,5", "pt-BR")).toEqual({
      ok: true,
      value: 1234.5,
      canonical: "1234.5",
    });
    expect(parseLocaleDecimal("12,25", "es")).toEqual({
      ok: true,
      value: 12.25,
      canonical: "12.25",
    });
  });

  it("rejects mismatched separators per locale", () => {
    expect(parseLocaleDecimal("12,5", "en").ok).toBe(false);
    expect(parseLocaleDecimal("12.5", "pt-BR").ok).toBe(false);
    expect(parseLocaleDecimal("12.5", "es").ok).toBe(false);
  });

  it("formats with locale grouping", () => {
    expect(formatLocaleDecimal(1234.5, "en")).toMatch(/1,234/);
    expect(formatLocaleDecimal(1234.5, "pt-BR")).toMatch(/1\.234/);
  });
});
