/**
 * Printed package dates are calendar dates (YYYY-MM-DD), not instants.
 * Never convert through `Date` + timezone for storage or comparison.
 */

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Returns true when the value is a strict YYYY-MM-DD calendar date.
 */
export function isCalendarDateString(value: string): boolean {
  const match = CALENDAR_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  // Reject timezone-shifting by validating against UTC noon of that civil date.
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

/**
 * Formats a calendar date for display without shifting the civil day.
 */
export function formatCalendarDateForDisplay(
  value: string,
  locale: string,
): string {
  if (!isCalendarDateString(value)) {
    return value;
  }
  const [year, month, day] = value.split("-").map(Number);
  // Use UTC components only so local TZ offset cannot change the printed day.
  const utc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(utc);
}
