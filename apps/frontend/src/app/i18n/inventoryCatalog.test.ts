import {
  REQUIRED_INVENTORY_I18N_KEYS,
  inventoryCatalogs,
} from "./inventoryCatalog";
import { PRODUCTION_LOCALES } from "./productionCatalog";

describe("inventory i18n completeness", () => {
  it.each([...PRODUCTION_LOCALES])(
    "provides every required inventory key for %s",
    (locale) => {
      const catalog = inventoryCatalogs[locale];
      for (const key of REQUIRED_INVENTORY_I18N_KEYS) {
        expect(catalog[key]).toBeTruthy();
        expect(catalog[key]).not.toEqual(key);
      }
    },
  );
});
