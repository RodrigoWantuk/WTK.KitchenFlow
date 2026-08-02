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

  it("maps local minutes to dayparts", () => {
    expect(resolveDayPart(8 * 60)).toBe("morning");
    expect(resolveDayPart(13 * 60)).toBe("afternoon");
    expect(resolveDayPart(19 * 60)).toBe("evening");
    expect(resolveDayPart(23 * 60)).toBe("night");
    expect(resolveDayPart(null)).toBe("neutral");
  });

  it("computes local minutes in an IANA zone", () => {
    const noonUtc = new Date("2026-06-15T15:00:00.000Z");
    const minutes = localMinutesSinceMidnight(noonUtc, "America/Sao_Paulo");
    expect(minutes).toBe(12 * 60);
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
