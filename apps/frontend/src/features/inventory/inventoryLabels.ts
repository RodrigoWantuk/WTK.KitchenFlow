/**
 * Localized labels for inventory wire enums and history timestamps.
 */

export function localizeInventoryKey(
  t: (key: string) => string,
  prefix: string,
  value: string | null | undefined,
): string {
  if (!value) {
    return t("inventory.fields.none");
  }
  const key = `${prefix}.${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

/**
 * Formats an RFC3339 / ISO timestamp using the selected locale and an explicit timezone.
 * Printed package dates must not use this helper.
 */
export function formatHistoryTimestamp(
  iso: string,
  locale: string,
  timeZone: string,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}
