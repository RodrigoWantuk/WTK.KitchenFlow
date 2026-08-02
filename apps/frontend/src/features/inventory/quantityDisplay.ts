import type { InventoryQuantity } from "@/adapters/live/inventoryTypes";
import {
  formatLocaleDecimal,
  type SupportedDecimalLocale,
} from "@/lib/localeDecimal";

export function formatQuantityLabel(
  quantity: InventoryQuantity,
  locale: SupportedDecimalLocale,
  t: (key: string) => string,
): string {
  if (quantity.kind === "measured") {
    return `${formatLocaleDecimal(quantity.value, locale)} ${t(`inventory.unit.${quantity.unit}`)}`;
  }
  return t(`inventory.availability.${quantity.availability}`);
}
