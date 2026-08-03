/**
 * PLAN-0025 independent adversarial retest for the immutable PLAN-0020 candidate.
 *
 * These probes are deliberately separate from the historical PLAN-0024 suite. They
 * exercise public mapper boundaries with hostile successful-response values, rather
 * than relying on implementation-agent happy-path coverage.
 */
import {
  mapCompleteness,
  mapEquipmentCollection,
  mapPreferencesCollection,
} from "@/adapters/live/profile/mapProfile";
import { ProfileApiError } from "@/contracts/profile";
import {
  createCustomStableCode,
  isCustomStableCode,
} from "@/features/profile/customCodes";

type CompletenessDto = Parameters<typeof mapCompleteness>[0];
type PreferencesDto = Parameters<typeof mapPreferencesCollection>[0];
type EquipmentDto = Parameters<typeof mapEquipmentCollection>[0];

function expectMalformed(action: () => unknown) {
  expect(action).toThrow(ProfileApiError);
  try {
    action();
  } catch (error) {
    expect(error).toMatchObject({ code: "malformed" });
    expect(String(error)).not.toContain("private profile value");
  }
}

function completeness(
  overrides: Partial<CompletenessDto> = {},
): CompletenessDto {
  return {
    percentComplete: 25,
    completedSections: 1,
    totalSections: 4,
    sectionCounts: { household: 1 },
    adultDeclarationState: "NotDeclared",
    profileExists: true,
    ...overrides,
  } as CompletenessDto;
}

function preferences(sortOrder: unknown): PreferencesDto {
  return {
    version: "v1",
    entries: [
      {
        entryId: "11111111-1111-1111-1111-111111111111",
        category: "Preference",
        stableCode: "spicy_food",
        note: null,
        presence: "confirmed",
        sortOrder,
      },
    ],
  } as PreferencesDto;
}

function equipment(capacity: unknown, sortOrder: unknown): EquipmentDto {
  return {
    version: "v1",
    entries: [
      {
        entryId: "22222222-2222-2222-2222-222222222222",
        stableCode: "oven",
        customName: null,
        capacity,
        capacityUnit: "L",
        constraintNote: null,
        isActive: true,
        sortOrder,
      },
    ],
  } as EquipmentDto;
}

describe("PLAN-0025 F-0024-01 — fail-closed numeric response mapping", () => {
  it.each([
    null,
    undefined,
    "",
    " \t ",
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    "not-a-number",
    1.5,
    2147483648,
  ])("rejects malformed completeness percent value %#", (value) => {
    expectMalformed(() =>
      mapCompleteness(
        completeness({
          percentComplete: value,
        } as unknown as Partial<CompletenessDto>),
      ),
    );
  });

  it("rejects negative and malformed required order values without zero fallback", () => {
    for (const value of [-1, null, undefined, "", "2.5", "not-a-number"]) {
      expectMalformed(() =>
        mapPreferencesCollection(preferences(value), '"v1"'),
      );
      expectMalformed(() =>
        mapEquipmentCollection(equipment(12.5, value), '"v1"'),
      );
    }
  });

  it("preserves valid integer strings and nullable, decimal optional capacity", () => {
    expect(
      mapCompleteness(
        completeness({
          percentComplete: "100",
          completedSections: "0",
          totalSections: "4",
          sectionCounts: { household: "0" },
        }),
      ),
    ).toMatchObject({ percentComplete: 100, completedSections: 0 });
    expect(
      mapEquipmentCollection(equipment(null, "0"), '"v1"').entries[0],
    ).toMatchObject({ capacity: null, sortOrder: 0 });
    expect(
      mapEquipmentCollection(equipment("12.5", 1), '"v1"').entries[0],
    ).toMatchObject({ capacity: 12.5, sortOrder: 1 });
    expectMalformed(() => mapEquipmentCollection(equipment(" ", 0), '"v1"'));
  });
});

describe("PLAN-0025 F-0024-05 — exact opaque custom stable-code recognition", () => {
  it("accepts generated RFC 4122 UUID-v4 codes without user text", () => {
    const code = createCustomStableCode();
    expect(code).toMatch(
      /^custom_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(code).toHaveLength(43);
    expect(isCustomStableCode(code)).toBe(true);
    expect(code).not.toContain("user-entered-label");
  });

  it.each([
    "custom_",
    "custom_invalid",
    "custom_123",
    "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    "custom_aaaaaaaa-bbbb-5ccc-8ddd-eeeeeeeeeeee",
    "custom_aaaaaaaa-bbbb-4ccc-cddd-eeeeeeeeeeee",
    " custom_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee ",
    `custom_${"a".repeat(80)}-bbbb-4ccc-8ddd-eeeeeeeeeeee`,
    "custom_my private label",
  ])("rejects non-minted input %s", (code) => {
    expect(isCustomStableCode(code)).toBe(false);
  });
});
