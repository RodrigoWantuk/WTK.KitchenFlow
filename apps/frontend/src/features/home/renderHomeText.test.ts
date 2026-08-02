import { renderHomeText } from "./renderHomeText";
import { homeCatalogText, homeLiteralText } from "@/contracts/contextualHome";

describe("renderHomeText", () => {
  const t = (key: string) => `LOC:${key}`;

  it("resolves catalog keys through localization", () => {
    expect(
      renderHomeText(homeCatalogText("home.fixture.menu.lentilStew"), t),
    ).toBe("LOC:home.fixture.menu.lentilStew");
  });

  it("renders literal text without localization lookup", () => {
    expect(renderHomeText(homeLiteralText("Live Lentil Stew"), t)).toBe(
      "Live Lentil Stew",
    );
  });

  it("keeps a literal equal to a catalog key as literal", () => {
    expect(
      renderHomeText(homeLiteralText("home.fixture.menu.lentilStew"), t),
    ).toBe("home.fixture.menu.lentilStew");
  });
});
