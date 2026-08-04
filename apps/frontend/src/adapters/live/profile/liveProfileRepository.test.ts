import { createLiveProfileRepository } from "./liveProfileRepository";
import { ProfileApiError } from "@/contracts/profile";

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function problemResponse(
  errorCode: string,
  status: number,
  extra: Record<string, unknown> = {},
) {
  return new Response(
    JSON.stringify({
      errorCode,
      title: errorCode,
      detail: `Problem: ${errorCode}`,
      traceId: "trace-1",
      ...extra,
    }),
    { status, headers: { "content-type": "application/problem+json" } },
  );
}

const ABSENT_PROFILE_BODY = {
  ownerUserId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  displayName: {
    value: null,
    presence: "absent",
    defaultValue: null,
    durability: "durable",
  },
  household: {
    defaultAdultCount: {
      value: null,
      presence: "default",
      defaultValue: 1,
      durability: "durable",
    },
    defaultChildCount: {
      value: null,
      presence: "default",
      defaultValue: 0,
      durability: "durable",
    },
    defaultServingCount: {
      value: null,
      presence: "default",
      defaultValue: 1,
      durability: "durable",
    },
    language: {
      value: null,
      presence: "default",
      defaultValue: "en",
      durability: "durable",
    },
    region: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    currency: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    measurementSystem: {
      value: null,
      presence: "default",
      defaultValue: "Metric",
      durability: "durable",
    },
    timeZone: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    planningCadence: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    shoppingCadence: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
  },
  cookingContext: {
    overallSkill: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    confidence: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    preferredInstructionDetail: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    ordinaryPrepMinutes: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    exceptionalPrepMinutes: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    effortTolerance: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    cleanupTolerance: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    repeatMealPreference: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    reheatingPreference: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    leftoverPreference: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
    freezingPreference: {
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    },
  },
  adultDeclaration: {
    adultDeclared: null,
    termsVersion: null,
    privacyVersion: null,
    acceptedAt: null,
    state: "NotDeclared",
  },
  knownTechniques: [],
  techniquesToLearn: [],
  goals: [],
  abandonmentReasons: [],
  profileExists: false,
  version: null,
  createdAt: null,
  updatedAt: null,
};

describe("createLiveProfileRepository — getProfile", () => {
  it("returns an absent-profile scaffold with no etag when profileExists is false", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        jsonResponse(ABSENT_PROFILE_BODY)) as typeof fetch,
    });

    const profile = await repo.getProfile();

    expect(profile.profileExists).toBe(false);
    expect(profile.version).toBeNull();
    expect(profile.etag).toBeNull();
    expect(profile.displayName).toEqual({
      value: null,
      presence: "absent",
      defaultValue: null,
      durability: "durable",
    });
  });

  it("maps progressive default presence and value distinctly from confirmed", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        jsonResponse(ABSENT_PROFILE_BODY)) as typeof fetch,
    });

    const profile = await repo.getProfile();

    expect(profile.household.defaultAdultCount).toEqual({
      value: null,
      presence: "default",
      defaultValue: 1,
      durability: "durable",
    });
    expect(profile.household.language).toEqual({
      value: null,
      presence: "default",
      defaultValue: "en",
      durability: "durable",
    });
  });

  it("maps a confirmed profile and reads the ETag header, preferring it over the body version", async () => {
    const confirmed = {
      ...ABSENT_PROFILE_BODY,
      displayName: {
        value: "Alex",
        presence: "confirmed",
        defaultValue: null,
        durability: "durable",
      },
      profileExists: true,
      version: "body-version",
      createdAt: "2026-08-01T00:00:00Z",
      updatedAt: "2026-08-01T00:00:00Z",
    };
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        jsonResponse(confirmed, 200, {
          ETag: '"header-etag"',
        })) as typeof fetch,
    });

    const profile = await repo.getProfile();

    expect(profile.profileExists).toBe(true);
    expect(profile.etag).toBe('"header-etag"');
    expect(profile.displayName.value).toBe("Alex");
    expect(profile.displayName.presence).toBe("confirmed");
  });

  it("fails closed with a malformed error on an unknown presence value", async () => {
    const malformedBody = {
      ...ABSENT_PROFILE_BODY,
      displayName: {
        value: "Alex",
        presence: "mystery",
        defaultValue: null,
        durability: "durable",
      },
    };
    const repo = createLiveProfileRepository({
      fetchImpl: (async () => jsonResponse(malformedBody)) as typeof fetch,
    });

    await expect(repo.getProfile()).rejects.toMatchObject({
      code: "malformed",
    } satisfies Partial<ProfileApiError>);
  });

  it("fails closed with a malformed error on an unknown durability value", async () => {
    const malformedBody = {
      ...ABSENT_PROFILE_BODY,
      displayName: {
        value: "Alex",
        presence: "confirmed",
        defaultValue: null,
        durability: "eternal",
      },
    };
    const repo = createLiveProfileRepository({
      fetchImpl: (async () => jsonResponse(malformedBody)) as typeof fetch,
    });

    await expect(repo.getProfile()).rejects.toMatchObject({
      code: "malformed",
    });
  });

  it("maps an empty success payload to malformed rather than throwing an unhandled error", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        new Response(null, { status: 200 })) as typeof fetch,
    });

    await expect(repo.getProfile()).rejects.toMatchObject({
      code: "malformed",
    });
  });
});

describe("createLiveProfileRepository — patchProfile", () => {
  it("sends X-CSRF-TOKEN and If-Match when an etag is known", async () => {
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
        return jsonResponse(
          { ...ABSENT_PROFILE_BODY, profileExists: true, version: "v2" },
          200,
          { ETag: '"v2"' },
        );
      }) as typeof fetch,
    });

    await repo.patchProfile(
      { displayName: { action: "confirm", value: "Alex" } },
      { csrfToken: "csrf-token", etag: '"v1"' },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("PATCH");
    expect(calls[0].csrf).toBe("csrf-token");
    expect(calls[0].ifMatch).toBe('"v1"');
  });

  it("omits If-Match on first create when no etag is known", async () => {
    const calls: Array<{ ifMatch: string | null }> = [];
    const repo = createLiveProfileRepository({
      fetchImpl: (async (input) => {
        const request =
          input instanceof Request ? input : new Request(String(input));
        calls.push({ ifMatch: request.headers.get("If-Match") });
        return jsonResponse(
          { ...ABSENT_PROFILE_BODY, profileExists: true, version: "v1" },
          201,
          { ETag: '"v1"' },
        );
      }) as typeof fetch,
    });

    await repo.patchProfile(
      { displayName: { action: "confirm", value: "Alex" } },
      { csrfToken: "csrf-token", etag: null },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].ifMatch).toBeNull();
  });

  it("maps 412 to precondition_failed", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        problemResponse("precondition_failed", 412)) as typeof fetch,
    });

    await expect(
      repo.patchProfile(
        { displayName: { action: "confirm", value: "Alex" } },
        { csrfToken: "csrf", etag: '"stale"' },
      ),
    ).rejects.toMatchObject({ code: "precondition_failed", status: 412 });
  });

  it("maps 428 to precondition_required", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        problemResponse("precondition_required", 428)) as typeof fetch,
    });

    await expect(
      repo.patchProfile(
        { displayName: { action: "confirm", value: "Alex" } },
        { csrfToken: "csrf", etag: '"v1"' },
      ),
    ).rejects.toMatchObject({ code: "precondition_required", status: 428 });
  });

  it("maps 409 profile_already_exists distinctly from a generic conflict", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        problemResponse("profile_already_exists", 409)) as typeof fetch,
    });

    await expect(
      repo.patchProfile(
        { displayName: { action: "confirm", value: "Alex" } },
        { csrfToken: "csrf", etag: null },
      ),
    ).rejects.toMatchObject({ code: "profile_already_exists", status: 409 });
  });

  it("maps a generic 409 without a declared errorCode to conflict", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        new Response(JSON.stringify({ title: "Conflict" }), {
          status: 409,
          headers: { "content-type": "application/problem+json" },
        })) as typeof fetch,
    });

    await expect(
      repo.patchProfile(
        { displayName: { action: "confirm", value: "Alex" } },
        { csrfToken: "csrf", etag: '"v1"' },
      ),
    ).rejects.toMatchObject({ code: "conflict", status: 409 });
  });

  it("maps 400 validation_failed with field errors", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        problemResponse("validation_failed", 400, {
          errors: { displayName: ["Display name is required."] },
        })) as typeof fetch,
    });

    await expect(
      repo.patchProfile(
        { displayName: { action: "confirm", value: "" } },
        { csrfToken: "csrf", etag: '"v1"' },
      ),
    ).rejects.toMatchObject({
      code: "validation_failed",
      status: 400,
      fieldErrors: { displayName: ["Display name is required."] },
    });
  });

  it("maps AbortError to cancelled", async () => {
    const controller = new AbortController();
    const repo = createLiveProfileRepository({
      fetchImpl: (async () => {
        throw new DOMException("Aborted", "AbortError");
      }) as typeof fetch,
    });

    await expect(
      repo.patchProfile(
        { displayName: { action: "confirm", value: "Alex" } },
        { csrfToken: "csrf", etag: '"v1"', signal: controller.signal },
      ),
    ).rejects.toMatchObject({ code: "cancelled" });
  });
});

describe("createLiveProfileRepository — preferences", () => {
  it("returns a null version/etag empty collection when no profile exists yet", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        jsonResponse({ version: null, entries: [] })) as typeof fetch,
    });

    const preferences = await repo.getPreferences();

    expect(preferences.version).toBeNull();
    expect(preferences.etag).toBeNull();
    expect(preferences.entries).toEqual([]);
  });

  it("maps confirmed preference entries and reads the ETag header", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        jsonResponse(
          {
            version: "v1",
            entries: [
              {
                entryId: "11111111-1111-1111-1111-111111111111",
                category: "Allergy",
                stableCode: "peanut_allergy",
                note: null,
                presence: "confirmed",
                sortOrder: 0,
              },
            ],
          },
          200,
          { ETag: '"v1"' },
        )) as typeof fetch,
    });

    const preferences = await repo.getPreferences();

    expect(preferences.etag).toBe('"v1"');
    expect(preferences.entries).toHaveLength(1);
    expect(preferences.entries[0]).toMatchObject({
      category: "Allergy",
      stableCode: "peanut_allergy",
      presence: "confirmed",
    });
  });

  it("fails closed on an unknown preference category", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        jsonResponse({
          version: "v1",
          entries: [
            {
              entryId: "11111111-1111-1111-1111-111111111111",
              category: "NotACategory",
              stableCode: "x",
              note: null,
              presence: "confirmed",
              sortOrder: 0,
            },
          ],
        })) as typeof fetch,
    });

    await expect(repo.getPreferences()).rejects.toMatchObject({
      code: "malformed",
    });
  });

  it("sends CSRF and If-Match when mutating preferences", async () => {
    const calls: Array<{ ifMatch: string | null; csrf: string | null }> = [];
    const repo = createLiveProfileRepository({
      fetchImpl: (async (input) => {
        const request =
          input instanceof Request ? input : new Request(String(input));
        calls.push({
          ifMatch: request.headers.get("If-Match"),
          csrf: request.headers.get("X-CSRF-TOKEN"),
        });
        return jsonResponse({ version: "v2", entries: [] }, 200, {
          ETag: '"v2"',
        });
      }) as typeof fetch,
    });

    await repo.mutatePreferences(
      [{ action: "add", category: "Allergy", stableCode: "peanut_allergy" }],
      { csrfToken: "csrf-token", etag: '"v1"' },
    );

    expect(calls[0].csrf).toBe("csrf-token");
    expect(calls[0].ifMatch).toBe('"v1"');
  });
});

describe("createLiveProfileRepository — equipment", () => {
  it("returns a null version/etag empty collection when no profile exists yet", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        jsonResponse({ version: null, entries: [] })) as typeof fetch,
    });

    const equipment = await repo.getEquipment();

    expect(equipment.version).toBeNull();
    expect(equipment.etag).toBeNull();
    expect(equipment.entries).toEqual([]);
  });

  it("maps equipment entries, coercing numeric-as-string capacity and sortOrder", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        jsonResponse(
          {
            version: "v1",
            entries: [
              {
                entryId: "22222222-2222-2222-2222-222222222222",
                stableCode: "slow_cooker",
                customName: null,
                capacity: "6",
                capacityUnit: "liter",
                constraintNote: null,
                isActive: true,
                sortOrder: "0",
              },
            ],
          },
          200,
          { ETag: '"v1"' },
        )) as typeof fetch,
    });

    const equipment = await repo.getEquipment();

    expect(equipment.entries[0]).toMatchObject({
      stableCode: "slow_cooker",
      capacity: 6,
      sortOrder: 0,
      isActive: true,
    });
  });

  it("replaces equipment with CSRF and If-Match headers", async () => {
    const calls: Array<{
      ifMatch: string | null;
      csrf: string | null;
      body: unknown;
    }> = [];
    const repo = createLiveProfileRepository({
      fetchImpl: (async (input) => {
        const request =
          input instanceof Request ? input : new Request(String(input));
        calls.push({
          ifMatch: request.headers.get("If-Match"),
          csrf: request.headers.get("X-CSRF-TOKEN"),
          body: await request.clone().json(),
        });
        return jsonResponse({ version: "v2", entries: [] }, 200, {
          ETag: '"v2"',
        });
      }) as typeof fetch,
    });

    await repo.replaceEquipment([{ stableCode: "slow_cooker" }], {
      csrfToken: "csrf-token",
      etag: '"v1"',
    });

    expect(calls[0].csrf).toBe("csrf-token");
    expect(calls[0].ifMatch).toBe('"v1"');
    expect(calls[0].body).toEqual({
      entries: [
        {
          stableCode: "slow_cooker",
          customName: null,
          capacity: null,
          capacityUnit: null,
          constraintNote: null,
        },
      ],
    });
  });
});

describe("createLiveProfileRepository — completeness", () => {
  it("maps a completeness summary for an absent profile", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        jsonResponse({
          percentComplete: 0,
          completedSections: 0,
          totalSections: 5,
          sectionCounts: {},
          adultDeclarationState: "NotDeclared",
          profileExists: false,
        })) as typeof fetch,
    });

    const completeness = await repo.getCompleteness();

    expect(completeness.profileExists).toBe(false);
    expect(completeness.percentComplete).toBe(0);
    expect(completeness.sectionCounts).toEqual({});
  });

  it("maps 401 to authentication_required", async () => {
    const repo = createLiveProfileRepository({
      fetchImpl: (async () =>
        problemResponse("authentication_required", 401)) as typeof fetch,
    });

    await expect(repo.getCompleteness()).rejects.toMatchObject({
      code: "authentication_required",
      status: 401,
    });
  });
});
