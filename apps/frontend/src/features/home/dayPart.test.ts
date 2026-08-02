import {
  buildHomeGreeting,
  localMinutesSinceMidnight,
  resolveDayPart,
  resolveHomeTimeZone,
} from "./dayPart";

describe("dayPart / timezone helpers", () => {
  it("prefers profile IANA timezone over browser", () => {
    expect(
      resolveHomeTimeZone({
        profileTimeZone: "America/Sao_Paulo",
        browserTimeZone: "Europe/Lisbon",
      }),
    ).toEqual({ timeZone: "America/Sao_Paulo", source: "profile" });
  });

  it("prefers request-scoped override over profile and browser", () => {
    expect(
      resolveHomeTimeZone({
        overrideTimeZone: "America/New_York",
        profileTimeZone: "America/Sao_Paulo",
        browserTimeZone: "Europe/Lisbon",
      }),
    ).toEqual({ timeZone: "America/New_York", source: "override" });
  });

  it("falls back to browser then unavailable", () => {
    expect(
      resolveHomeTimeZone({
        profileTimeZone: null,
        browserTimeZone: "Europe/Lisbon",
      }),
    ).toEqual({ timeZone: "Europe/Lisbon", source: "browser" });
    expect(
      resolveHomeTimeZone({ profileTimeZone: null, browserTimeZone: null }),
    ).toEqual({ timeZone: null, source: "unavailable" });
  });

  it("marks invalid identifiers without using them", () => {
    expect(
      resolveHomeTimeZone({
        profileTimeZone: "Not/A_Zone",
        browserTimeZone: null,
      }).source,
    ).toBe("invalid");
  });

  it("uses browser when saved timezone is invalid", () => {
    expect(
      resolveHomeTimeZone({
        profileTimeZone: "Not/A_Zone",
        browserTimeZone: "UTC",
      }),
    ).toEqual({ timeZone: "UTC", source: "browser" });
  });

  it("maps local minutes to dayparts including exact boundaries", () => {
    expect(resolveDayPart(5 * 60)).toBe("morning");
    expect(resolveDayPart(8 * 60)).toBe("morning");
    expect(resolveDayPart(12 * 60 - 1)).toBe("morning");
    expect(resolveDayPart(12 * 60)).toBe("afternoon");
    expect(resolveDayPart(13 * 60)).toBe("afternoon");
    expect(resolveDayPart(17 * 60)).toBe("evening");
    expect(resolveDayPart(19 * 60)).toBe("evening");
    expect(resolveDayPart(21 * 60)).toBe("night");
    expect(resolveDayPart(23 * 60)).toBe("night");
    expect(resolveDayPart(0)).toBe("night");
    expect(resolveDayPart(4 * 60 + 59)).toBe("night");
    expect(resolveDayPart(null)).toBe("neutral");
  });

  it("computes local minutes across multiple IANA zones", () => {
    const noonUtc = new Date("2026-06-15T15:00:00.000Z");
    expect(localMinutesSinceMidnight(noonUtc, "America/Sao_Paulo")).toBe(
      12 * 60,
    );
    expect(localMinutesSinceMidnight(noonUtc, "Europe/Lisbon")).toBe(16 * 60);
    expect(localMinutesSinceMidnight(noonUtc, "UTC")).toBe(15 * 60);
  });

  it("handles near-midnight and DST spring-forward with injected clock", () => {
    // 2026-03-08 Eastern spring-forward: 02:00 local becomes 03:00.
    // 06:30 UTC = 01:30 EST; 07:30 UTC = 03:30 EDT.
    const beforeGap = new Date("2026-03-08T06:30:00.000Z");
    const afterGap = new Date("2026-03-08T07:30:00.000Z");
    expect(localMinutesSinceMidnight(beforeGap, "America/New_York")).toBe(
      1 * 60 + 30,
    );
    expect(localMinutesSinceMidnight(afterGap, "America/New_York")).toBe(
      3 * 60 + 30,
    );

    const nearMidnight = new Date("2026-06-15T02:59:00.000Z");
    expect(localMinutesSinceMidnight(nearMidnight, "America/Sao_Paulo")).toBe(
      23 * 60 + 59,
    );
    expect(
      resolveDayPart(
        localMinutesSinceMidnight(nearMidnight, "America/Sao_Paulo"),
      ),
    ).toBe("night");
  });

  it("builds greeting with name and without name", () => {
    const named = buildHomeGreeting({
      displayName: "Ana",
      profileTimeZone: "America/Sao_Paulo",
      now: new Date("2026-06-15T08:00:00.000-03:00"),
    });
    expect(named.displayName).toBe("Ana");
    expect(named.dayPart).toBe("morning");

    const anon = buildHomeGreeting({
      displayName: "   ",
      profileTimeZone: null,
      browserTimeZone: null,
      now: new Date("2026-06-15T12:00:00.000Z"),
    });
    expect(anon.displayName).toBeNull();
    expect(anon.dayPart).toBe("neutral");
    expect(anon.timeZoneSource).toBe("unavailable");
  });
});
