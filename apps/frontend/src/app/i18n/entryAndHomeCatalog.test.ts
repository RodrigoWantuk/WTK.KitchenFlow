import {
  REQUIRED_ENTRY_I18N_KEYS,
  entryCatalogs,
} from "@/app/i18n/entryCatalog";
import { REQUIRED_HOME_I18N_KEYS, homeCatalogs } from "@/app/i18n/homeCatalog";
import { PRODUCTION_LOCALES } from "@/app/i18n/productionCatalog";

describe("entry and home localization catalogs", () => {
  it.each([...PRODUCTION_LOCALES])(
    "provides every required entry key for %s",
    (locale) => {
      for (const key of REQUIRED_ENTRY_I18N_KEYS) {
        expect(entryCatalogs[locale][key]?.length ?? 0).toBeGreaterThan(0);
      }
    },
  );

  it.each([...PRODUCTION_LOCALES])(
    "provides every required home key for %s",
    (locale) => {
      for (const key of REQUIRED_HOME_I18N_KEYS) {
        expect(homeCatalogs[locale][key]?.length ?? 0).toBeGreaterThan(0);
      }
    },
  );

  it("keeps the same entry and home key sets across locales", () => {
    const entryEn = Object.keys(entryCatalogs.en).sort();
    const homeEn = Object.keys(homeCatalogs.en).sort();
    expect(Object.keys(entryCatalogs["pt-BR"]).sort()).toEqual(entryEn);
    expect(Object.keys(entryCatalogs.es).sort()).toEqual(entryEn);
    expect(Object.keys(homeCatalogs["pt-BR"]).sort()).toEqual(homeEn);
    expect(Object.keys(homeCatalogs.es).sort()).toEqual(homeEn);
  });
});
