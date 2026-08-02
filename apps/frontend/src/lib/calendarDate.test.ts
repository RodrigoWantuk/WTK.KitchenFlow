import {
  formatCalendarDateForDisplay,
  isCalendarDateString,
} from "./calendarDate";

describe("calendarDate", () => {
  it("accepts strict YYYY-MM-DD calendar dates", () => {
    expect(isCalendarDateString("2026-12-31")).toBe(true);
    expect(isCalendarDateString("2026-02-30")).toBe(false);
    expect(isCalendarDateString("12/31/2026")).toBe(false);
  });

  it("formats without shifting the civil day across timezones", () => {
    // Using UTC formatter; civil day must remain 31 Dec 2026.
    const label = formatCalendarDateForDisplay("2026-12-31", "en");
    expect(label).toMatch(/31/);
    expect(label).toMatch(/2026/);
  });
});
