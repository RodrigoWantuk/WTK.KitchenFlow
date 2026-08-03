/**
 * PLAN-0024 adversarial: logout must not discard dirty profile drafts silently.
 * @sutSha 5733bb4de957b53469a28bc60c472a90f0955907
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductionApp from "@/app/ProductionApp";
import { PRODUCTION_LOCALE_STORAGE_KEY } from "@/app/i18n/productionCatalog";

function absentField(defaultValue: unknown = null, presence = "absent") {
  return { value: null, presence, defaultValue, durability: "durable" };
}

const PROFILE_BODY = {
  ownerUserId: "11111111-1111-1111-1111-111111111111",
  displayName: {
    value: "Ada",
    presence: "confirmed",
    defaultValue: null,
    durability: "durable",
  },
  household: {
    defaultAdultCount: absentField(1, "default"),
    defaultChildCount: absentField(0, "default"),
    defaultServingCount: absentField(1, "default"),
    language: absentField("en", "default"),
    region: absentField(),
    currency: absentField(),
    measurementSystem: absentField("Metric", "default"),
    timeZone: absentField(),
    planningCadence: absentField(),
    shoppingCadence: absentField(),
  },
  cookingContext: {
    overallSkill: absentField(),
    confidence: absentField(),
    preferredInstructionDetail: absentField(),
    ordinaryPrepMinutes: absentField(),
    exceptionalPrepMinutes: absentField(),
    effortTolerance: absentField(),
    cleanupTolerance: absentField(),
    repeatMealPreference: absentField(),
    reheatingPreference: absentField(),
    leftoverPreference: absentField(),
    freezingPreference: absentField(),
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
  profileExists: true,
  version: "v1",
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
};

describe("PLAN-0024 adversarial — unsaved navigation via logout", () => {
  beforeEach(() => {
    window.localStorage.setItem(PRODUCTION_LOCALE_STORAGE_KEY, "en");
    window.history.pushState({}, "", "/app/perfil/dados");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("prompts before logout discards a dirty profile draft", async () => {
    const user = userEvent.setup();
    const logoutCalls: string[] = [];
    jest.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);
      const method =
        (init && "method" in init && init.method) ||
        (input instanceof Request ? input.method : "GET");
      if (url.includes("/api/v1/auth/logout")) {
        logoutCalls.push("logout");
        return new Response(null, { status: 204 });
      }
      if (url.includes("/api/v1/session")) {
        return new Response(
          JSON.stringify({
            userId: "11111111-1111-1111-1111-111111111111",
            csrfToken: "csrf-route",
            supportedLocales: ["en", "pt-BR", "es"],
            displayName: "Ada",
            language: "en",
            timeZone: "UTC",
            measurementSystem: "Metric",
            profileExists: true,
            profilePercentComplete: 20,
            adultDeclarationState: "NotDeclared",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (url.includes("/api/v1/profile/preferences")) {
        return new Response(JSON.stringify({ version: "v1", entries: [] }), {
          status: 200,
          headers: { "content-type": "application/json", ETag: '"v1"' },
        });
      }
      if (url.includes("/api/v1/profile/equipment")) {
        return new Response(JSON.stringify({ version: "v1", entries: [] }), {
          status: 200,
          headers: { "content-type": "application/json", ETag: '"v1"' },
        });
      }
      if (url.includes("/api/v1/profile/completeness")) {
        return new Response(
          JSON.stringify({
            percentComplete: 20,
            completedSections: 1,
            totalSections: 5,
            sectionCounts: { household: 1 },
            adultDeclarationState: "NotDeclared",
            profileExists: true,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (url.includes("/api/v1/profile") && method === "GET") {
        return new Response(JSON.stringify(PROFILE_BODY), {
          status: 200,
          headers: { "content-type": "application/json", ETag: '"v1"' },
        });
      }
      return new Response("not found", { status: 404 });
    });

    render(<ProductionApp />);
    await waitFor(() =>
      expect(
        screen.getByTestId("profile-data-input-displayName"),
      ).toBeInTheDocument(),
    );

    await user.clear(screen.getByTestId("profile-data-input-displayName"));
    await user.type(
      screen.getByTestId("profile-data-input-displayName"),
      "Beatrice",
    );

    await user.click(screen.getByTestId("production-logout"));

    // Required: unsaved-change confirmation must appear; logout must not fire yet.
    expect(
      await screen.findByRole("alertdialog", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(logoutCalls).toHaveLength(0);
  });
});
