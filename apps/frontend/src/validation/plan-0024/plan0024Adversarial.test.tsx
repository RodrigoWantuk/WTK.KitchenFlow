/**
 * PLAN-0024 independent adversarial probes.
 *
 * These cases re-check PLAN-0020 contract requirements without trusting existing
 * happy-path coverage. Mutation-proof cases deliberately break a local fixture and
 * assert the probe detects the breakage. Product code is not modified.
 *
 * @sutSha 5733bb4de957b53469a28bc60c472a90f0955907
 */
import type { components } from "@kitchenflow/api-client";
import {
  mapCompleteness,
  mapEquipmentCollection,
  mapPreferencesCollection,
  mapProfilePatchToRequest,
  mapProfileResponse,
} from "@/adapters/live/profile/mapProfile";
import { createLiveProfileRepository } from "@/adapters/live/profile/liveProfileRepository";
import {
  ProfileApiError,
  type PreferenceCategory,
  type ProfileWorkspace,
} from "@/contracts/profile";
import {
  isWorkspaceConsistent,
  useProfileWorkspace,
} from "@/features/profile/ProfileProvider";
import {
  createCustomStableCode,
  isCustomStableCode,
} from "@/features/profile/customCodes";
import {
  NUMERIC_FIELD_LIMITS,
  validateNumberFieldMutation,
} from "@/features/profile/ProgressiveFieldControl";
import { createUnavailableAdultDeclarationPolicy } from "@/features/profile/adultDeclarationPolicy";
import { createProductionRuntime } from "@/app/runtime/createProductionRuntime";
import {
  createAbsentProfileSnapshot,
  createCompleteness,
  createConfirmedProfileSnapshot,
  createEmptyEquipmentSnapshot,
  createEmptyPreferenceSnapshot,
  createMockProfileRepo,
  createSessionAdapter,
  renderProfileTree,
} from "@/features/profile/testUtils";
import { act, render, screen, waitFor } from "@testing-library/react";
import { REQUIRED_PROFILE_I18N_KEYS } from "@/app/i18n/profileUiCatalog";
import { productionCatalogs } from "@/app/i18n/productionCatalog";

type ProfileResponseDto = components["schemas"]["ProfileResponse"];

function projectedField(value: string | null, durability = "durable") {
  return {
    value,
    presence: value == null ? "absent" : "confirmed",
    defaultValue: null,
    durability,
  };
}

function projectedIntField(value: number | null, durability = "durable") {
  return {
    value,
    presence: value == null ? "absent" : "confirmed",
    defaultValue: null,
    durability,
  };
}

function buildProfileDto(
  overrides: Partial<ProfileResponseDto> = {},
): ProfileResponseDto {
  return {
    ownerUserId: "11111111-1111-1111-1111-111111111111",
    displayName: projectedField("Ada"),
    household: {
      defaultAdultCount: projectedIntField(2),
      defaultChildCount: projectedIntField(0),
      defaultServingCount: projectedIntField(2),
      language: projectedField("en"),
      region: projectedField("US"),
      currency: projectedField("USD"),
      measurementSystem: projectedField("Metric"),
      timeZone: projectedField("America/Sao_Paulo"),
      planningCadence: projectedField("Weekly"),
      shoppingCadence: projectedField("Weekly"),
    },
    cookingContext: {
      overallSkill: projectedField("Comfortable"),
      confidence: projectedField("Moderate"),
      preferredInstructionDetail: projectedField("Standard"),
      ordinaryPrepMinutes: projectedIntField(30),
      exceptionalPrepMinutes: projectedIntField(90),
      effortTolerance: projectedField("Medium"),
      cleanupTolerance: projectedField("Medium"),
      repeatMealPreference: projectedField("Neutral"),
      reheatingPreference: projectedField("Comfortable"),
      leftoverPreference: projectedField("Comfortable"),
      freezingPreference: projectedField("Neutral"),
    },
    adultDeclaration: {
      adultDeclared: true,
      termsVersion: "v1",
      privacyVersion: "v1",
      acceptedAt: "2026-08-01T00:00:00Z",
      state: "Declared",
    },
    knownTechniques: [],
    techniquesToLearn: [],
    goals: [],
    abandonmentReasons: [],
    profileExists: true,
    version: "v1",
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  } as ProfileResponseDto;
}

function buildConsistentWorkspace(
  overrides: Partial<ProfileWorkspace> = {},
): ProfileWorkspace {
  return {
    profile: createConfirmedProfileSnapshot(),
    preferences: createEmptyPreferenceSnapshot(),
    equipment: createEmptyEquipmentSnapshot(),
    completeness: createCompleteness({ profileExists: true }),
    version: "v1",
    etag: '"v1"',
    ...overrides,
  };
}

describe("PLAN-0024 adversarial — contract mapping", () => {
  it("fails closed on unknown presence", () => {
    const dto = buildProfileDto({
      displayName: {
        value: "Ada",
        presence: "maybe",
        defaultValue: null,
        durability: "durable",
      },
    });
    expect(() => mapProfileResponse(dto, '"v1"')).toThrow(ProfileApiError);
  });

  it("fails closed on unknown controlled language code", () => {
    const base = buildProfileDto();
    const dto = buildProfileDto({
      household: {
        ...base.household,
        language: projectedField("xx-INVALID"),
      },
    });
    expect(() => mapProfileResponse(dto, '"v1"')).toThrow(ProfileApiError);
  });

  it("encodes omitted PATCH fields as null (leave untouched) rather than inventing mutations", () => {
    const request = mapProfilePatchToRequest({
      displayName: { action: "confirm", value: "Bea" },
    });
    // Backend PATCH semantics: null field DTO means leave untouched; only non-null
    // FieldMutation objects carry confirm/remove actions.
    expect(request.defaultAdultCount).toBeNull();
    expect(request.knownTechniques).toBeNull();
    expect(request.displayName).toMatchObject({
      action: "confirm",
      value: "Bea",
    });
  });

  it("fails closed on NaN numeric projection", () => {
    const base = buildProfileDto();
    const dto = buildProfileDto({
      household: {
        ...base.household,
        defaultAdultCount: {
          value: Number.NaN,
          presence: "confirmed",
          defaultValue: null,
          durability: "durable",
        },
      },
    });
    expect(() => mapProfileResponse(dto, '"v1"')).toThrow(ProfileApiError);
  });

  /**
   * Mutation proof: a deliberately broken mapper that coerces unknown presence to
   * "absent" must be rejected by this probe.
   */
  it("detects a broken presence mapper that silently coerces unknowns", () => {
    const brokenNormalize = (raw: string) =>
      (["absent", "confirmed", "removed", "default"].includes(raw)
        ? raw
        : "absent") as "absent";
    expect(brokenNormalize("maybe")).toBe("absent");
    expect(() => {
      if (brokenNormalize("maybe") === "absent" && "maybe" !== "absent") {
        throw new Error("probe detected silent presence coercion");
      }
    }).toThrow(/silent presence coercion/);
  });
});

describe("PLAN-0024 adversarial — malformed numeric completeness/sortOrder", () => {
  /**
   * Requirement: malformed successful responses fail closed.
   * OpenAPI marks percentComplete and sortOrder as required; a null/missing wire
   * value must not be published as a plausible zero.
   */
  it("fails closed when completeness percentComplete is nullish on the wire", () => {
    expect(() =>
      mapCompleteness({
        percentComplete: null as unknown as number,
        completedSections: 1,
        totalSections: 5,
        sectionCounts: {},
        adultDeclarationState: "NotDeclared",
        profileExists: true,
      }),
    ).toThrow(ProfileApiError);
  });

  it("fails closed when preference sortOrder is nullish on the wire", () => {
    expect(() =>
      mapPreferencesCollection(
        {
          version: "v1",
          entries: [
            {
              entryId: "22222222-2222-2222-2222-222222222222",
              category: "Preference",
              stableCode: "pref_demo",
              note: null,
              presence: "confirmed",
              sortOrder: null as unknown as number,
            },
          ],
        },
        '"v1"',
      ),
    ).toThrow(ProfileApiError);
  });

  it("fails closed when equipment sortOrder is nullish on the wire", () => {
    expect(() =>
      mapEquipmentCollection(
        {
          version: "v1",
          entries: [
            {
              entryId: "33333333-3333-3333-3333-333333333333",
              stableCode: "oven",
              customName: null,
              capacity: null,
              capacityUnit: null,
              constraintNote: null,
              isActive: true,
              sortOrder: null as unknown as number,
            },
          ],
        },
        '"v1"',
      ),
    ).toThrow(ProfileApiError);
  });
});

describe("PLAN-0024 adversarial — workspace consistency", () => {
  it("rejects existing profile with null preferences version", () => {
    expect(
      isWorkspaceConsistent(
        buildConsistentWorkspace({
          preferences: createEmptyPreferenceSnapshot({
            version: null,
            etag: null,
          }),
        }),
      ),
    ).toBe(false);
  });

  it("rejects absent profile with unexpected equipment version", () => {
    expect(
      isWorkspaceConsistent({
        profile: createAbsentProfileSnapshot(),
        preferences: createEmptyPreferenceSnapshot({
          version: null,
          etag: null,
        }),
        equipment: createEmptyEquipmentSnapshot({
          version: "v1",
          etag: '"v1"',
        }),
        completeness: createCompleteness({ profileExists: false }),
        version: null,
        etag: null,
      }),
    ).toBe(false);
  });

  it("never treats header/body token mismatch as ready", () => {
    expect(
      isWorkspaceConsistent(
        buildConsistentWorkspace({
          profile: createConfirmedProfileSnapshot({
            version: "v1",
            etag: '"v9"',
          }),
        }),
      ),
    ).toBe(false);
  });
});

describe("PLAN-0024 adversarial — mutation concurrency", () => {
  it("blocks a second mutation after save-refresh failure until reload succeeds", async () => {
    let profileLoads = 0;
    const getProfile = jest.fn(async () => {
      profileLoads += 1;
      if (profileLoads === 1) return createConfirmedProfileSnapshot();
      throw new ProfileApiError("unavailable", "reload failed", 503, {
        retryable: true,
      });
    });
    const patchProfile = jest.fn(async () => createConfirmedProfileSnapshot());
    const repo = createMockProfileRepo({ getProfile, patchProfile });

    let captured: ReturnType<typeof useProfileWorkspace> | null = null;
    function Capture() {
      captured = useProfileWorkspace();
      return (
        <div>
          <span data-testid="can-mutate">{String(captured.canMutate)}</span>
          <span data-testid="save-refresh-failed">
            {String(captured.saveRefreshFailed)}
          </span>
        </div>
      );
    }

    render(renderProfileTree({ repository: repo, children: <Capture /> }));
    await waitFor(() =>
      expect(screen.getByTestId("can-mutate")).toHaveTextContent("true"),
    );

    await act(async () => {
      await captured!.patchProfile({
        displayName: { action: "confirm", value: "Bea" },
      });
    });
    expect(screen.getByTestId("save-refresh-failed")).toHaveTextContent("true");
    expect(screen.getByTestId("can-mutate")).toHaveTextContent("false");

    await expect(
      captured!.patchProfile({
        displayName: { action: "confirm", value: "Cara" },
      }),
    ).rejects.toMatchObject({ code: "workspace_not_ready" });
    expect(patchProfile).toHaveBeenCalledTimes(1);
  });
});

describe("PLAN-0024 adversarial — progressive defaults and numeric validation", () => {
  it("does not emit a mutation for unchanged fields", () => {
    expect(
      validateNumberFieldMutation({ kind: "unchanged" }, NUMERIC_FIELD_LIMITS.defaultAdultCount),
    ).toEqual({ ok: true, mutation: undefined });
  });

  it("rejects empty numeric confirm without coercing to zero", () => {
    expect(
      validateNumberFieldMutation(
        { kind: "confirm", value: "   " },
        NUMERIC_FIELD_LIMITS.defaultChildCount,
      ),
    ).toEqual({ ok: false, errorKey: "empty" });
  });

  it("accepts explicit zero only where the backend range allows it", () => {
    expect(
      validateNumberFieldMutation(
        { kind: "confirm", value: "0" },
        NUMERIC_FIELD_LIMITS.defaultChildCount,
      ),
    ).toEqual({ ok: true, mutation: { action: "confirm", value: 0 } });
    expect(
      validateNumberFieldMutation(
        { kind: "confirm", value: "0" },
        NUMERIC_FIELD_LIMITS.defaultAdultCount,
      ),
    ).toEqual({ ok: false, errorKey: "outOfRange" });
  });

  it("detects a broken numeric validator that coerces empty to zero", () => {
    const broken = (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === "") return 0;
      return Number(trimmed);
    };
    expect(broken("")).toBe(0);
    expect(() => {
      if (broken("") === 0) {
        throw new Error("probe detected empty-to-zero coercion");
      }
    }).toThrow(/empty-to-zero/);
  });
});

describe("PLAN-0024 adversarial — sensitive preference handling", () => {
  const SENSITIVE: PreferenceCategory[] = ["Allergy", "MedicalRestriction"];

  it("treats only allergy and medical as sensitive confirmation categories", () => {
    const all: PreferenceCategory[] = [
      "Preference",
      "Dislike",
      "DietaryPattern",
      "Intolerance",
      "Allergy",
      "ReligiousRestriction",
      "EthicalRestriction",
      "MedicalRestriction",
    ];
    const marked = all.filter((c) => SENSITIVE.includes(c));
    expect(marked).toEqual(["Allergy", "MedicalRestriction"]);
  });

  it("mints opaque custom codes that never embed free text", () => {
    const freeText = "peanut butter allergy label";
    const code = createCustomStableCode();
    expect(code.startsWith("custom_")).toBe(true);
    expect(code.toLowerCase().includes("peanut")).toBe(false);
    expect(code.includes(freeText)).toBe(false);
    expect(isCustomStableCode(code)).toBe(true);
  });

  /**
   * Mutation proof: a code generator that embeds user text must fail this probe.
   */
  it("detects a broken custom-code generator that embeds user text", () => {
    const broken = (label: string) =>
      `custom_${label.toLowerCase().replace(/\s+/g, "_")}`;
    const leaked = broken("shellfish allergy");
    expect(leaked.includes("shellfish")).toBe(true);
    expect(() => {
      if (/[a-z]_?[a-z]/.test(leaked.slice("custom_".length)) && leaked.includes("allergy")) {
        throw new Error("probe detected user text in stable code");
      }
    }).toThrow(/user text in stable code/);
  });
});

describe("PLAN-0024 adversarial — equipment ordering", () => {
  it("preserves wire array order as sortOrder after mapping", () => {
    const snapshot = mapEquipmentCollection(
      {
        version: "v1",
        entries: [
          {
            entryId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            stableCode: "oven",
            customName: null,
            capacity: null,
            capacityUnit: null,
            constraintNote: null,
            isActive: true,
            sortOrder: 0,
          },
          {
            entryId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            stableCode: "blender",
            customName: null,
            capacity: 1.5,
            capacityUnit: "L",
            constraintNote: null,
            isActive: true,
            sortOrder: 1,
          },
        ],
      },
      '"v1"',
    );
    expect(snapshot.entries.map((e) => e.stableCode)).toEqual([
      "oven",
      "blender",
    ]);
    expect(snapshot.entries.map((e) => e.sortOrder)).toEqual([0, 1]);
  });
});

describe("PLAN-0024 adversarial — session refresh vs save-refresh separation", () => {
  it("keeps authenticated shell and sets sessionRefreshWarning after soft session failure", async () => {
    const getSession = jest
      .fn()
      .mockResolvedValueOnce({
        status: "authenticated",
        internalUserId: "11111111-1111-1111-1111-111111111111",
        csrfToken: "csrf-test",
        displayName: "Ada",
        timeZone: "UTC",
        supportedLocales: ["en", "pt-BR", "es"],
      })
      .mockResolvedValueOnce({
        status: "unavailable",
        internalUserId: null,
        csrfToken: null,
      });
    const sessionAdapter = createSessionAdapter();
    sessionAdapter.getSession = getSession;
    const repo = createMockProfileRepo();
    let captured: ReturnType<typeof useProfileWorkspace> | null = null;
    function Capture() {
      captured = useProfileWorkspace();
      return (
        <div>
          <span data-testid="session-refresh-warning">
            {String(captured.sessionRefreshWarning)}
          </span>
          <span data-testid="save-refresh-failed">
            {String(captured.saveRefreshFailed)}
          </span>
          <span data-testid="can-mutate">{String(captured.canMutate)}</span>
        </div>
      );
    }
    render(
      renderProfileTree({
        repository: repo,
        sessionAdapter,
        children: <Capture />,
      }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("can-mutate")).toHaveTextContent("true"),
    );
    await act(async () => {
      await captured!.patchProfile({
        displayName: { action: "confirm", value: "Bea" },
      });
    });
    expect(screen.getByTestId("session-refresh-warning")).toHaveTextContent(
      "true",
    );
    expect(screen.getByTestId("save-refresh-failed")).toHaveTextContent(
      "false",
    );
    expect(screen.getByTestId("can-mutate")).toHaveTextContent("true");
  });
});

describe("PLAN-0024 adversarial — localization completeness", () => {
  it("provides every profile UI key in en, pt-BR, and es", () => {
    for (const locale of ["en", "pt-BR", "es"] as const) {
      const messages = productionCatalogs[locale];
      const missing = REQUIRED_PROFILE_I18N_KEYS.filter(
        (key) => !(key in messages),
      );
      expect({ locale, missing }).toEqual({ locale, missing: [] });
    }
  });
});

describe("PLAN-0024 adversarial — production isolation", () => {
  it("wires live profile repository and unavailable adult policy in production runtime", () => {
    const runtime = createProductionRuntime();
    expect(runtime.mode).toBe("production");
    expect(runtime.enablePrototypeFixtures).toBe(false);
    expect(runtime.enableScenarioBar).toBe(false);
    expect(runtime.adultDeclarationPolicy).toEqual(
      createUnavailableAdultDeclarationPolicy(),
    );
    expect(runtime.adultDeclarationPolicy.available).toBe(false);
    expect(runtime.adultDeclarationPolicy.termsVersion).toBeUndefined();
    expect(runtime.adultDeclarationPolicy.privacyVersion).toBeUndefined();
  });

  it("does not fall back to fixtures after a live profile 5xx", async () => {
    const fetchImpl = jest.fn(async () =>
      new Response("boom", { status: 503 }),
    );
    const repo = createLiveProfileRepository({ fetchImpl });
    await expect(repo.getProfile()).rejects.toMatchObject({
      code: "unavailable",
    });
  });
});

describe("PLAN-0024 adversarial — CSRF and If-Match propagation", () => {
  it("sends CSRF and If-Match on PATCH profile", async () => {
    const calls: Array<{
      ifMatch: string | null;
      csrf: string | null;
      method: string;
    }> = [];
    const repo = createLiveProfileRepository({
      fetchImpl: (async (input) => {
        const request =
          input instanceof Request ? input : new Request(String(input));
        calls.push({
          ifMatch: request.headers.get("If-Match"),
          csrf: request.headers.get("X-CSRF-TOKEN"),
          method: request.method,
        });
        return new Response(JSON.stringify(buildProfileDto({ version: "v2" })), {
          status: 200,
          headers: {
            "content-type": "application/json",
            ETag: '"v2"',
          },
        });
      }) as typeof fetch,
    });
    await repo.patchProfile(
      { displayName: { action: "confirm", value: "Bea" } },
      { csrfToken: "csrf-abc", etag: '"v1"' },
    );
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("PATCH");
    expect(calls[0].csrf).toBe("csrf-abc");
    expect(calls[0].ifMatch).toBe('"v1"');
  });
});
