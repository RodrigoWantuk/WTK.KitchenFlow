import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RuntimeProvider } from "@/app/runtime/RuntimeProvider";
import { ProductionI18nProvider } from "@/app/i18n/ProductionI18nProvider";
import { createUnavailableContextualHomeAdapter } from "@/adapters/live/unavailableContextualHomeAdapter";
import { UnavailablePreparationRouteRepository } from "@/adapters/live/unavailablePreparationRouteRepository";
import { PublicEntryPage } from "./PublicEntryPage";
import type { FrontendRuntime } from "@/app/runtime/types";
import type { HomeTelemetryEvent } from "@/contracts/contextualHome";
import { PRODUCTION_LOCALE_STORAGE_KEY } from "@/app/i18n/productionCatalog";

function renderEntry() {
  const events: HomeTelemetryEvent[] = [];
  const runtime: FrontendRuntime = {
    mode: "test",
    sessionAdapter: {
      getSession: async () => {
        throw new Error("public entry must not call getSession");
      },
      beginLogin: () => {
        throw new Error("public entry must not begin login");
      },
      logout: async () => undefined,
    },
    inventoryRepository: {
      listLots: async () => ({ items: [], nextCursor: null }),
    } as unknown as FrontendRuntime["inventoryRepository"],
    preparationRouteRepository: new UnavailablePreparationRouteRepository(),
    contextualHomeAdapter: createUnavailableContextualHomeAdapter(),
    enableScenarioBar: false,
    enablePrototypeFixtures: false,
    persistPrototypeAuth: false,
    shoppingRequirementProjections: [],
  };

  render(
    <RuntimeProvider runtime={runtime}>
      <ProductionI18nProvider initialLocale="en">
        <MemoryRouter>
          <PublicEntryPage
            telemetry={{
              track: (event) => events.push(event),
            }}
          />
        </MemoryRouter>
      </ProductionI18nProvider>
    </RuntimeProvider>,
  );
  return { events };
}

describe("PublicEntryPage", () => {
  beforeEach(() => {
    localStorage.removeItem(PRODUCTION_LOCALE_STORAGE_KEY);
  });

  it("explains the product without SessionProvider or authenticated API calls", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");
    const { events } = renderEntry();
    expect(
      await screen.findByTestId("production-landing-title"),
    ).toHaveTextContent(/Turn available food/);
    expect(screen.getByTestId("production-landing-subtitle")).toHaveTextContent(
      /not just a recipe generator/i,
    );
    expect(screen.getByTestId("entry-media-placeholder")).toBeInTheDocument();
    expect(screen.getByTestId("entry-legal-terms").tagName.toLowerCase()).toBe(
      "a",
    );
    expect(
      screen.getByTestId("entry-legal-privacy").tagName.toLowerCase(),
    ).toBe("a");
    expect(screen.getByTestId("hero-enter")).toHaveAttribute("href", "/acesso");
    expect(events.some((e) => e.name === "public_entry_viewed")).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("tracks login CTA without nested interactive controls", async () => {
    const user = userEvent.setup();
    const { events } = renderEntry();
    expect(document.querySelectorAll("a button").length).toBe(0);
    await user.click(screen.getByTestId("hero-enter"));
    expect(events.some((e) => e.name === "login_cta_selected")).toBe(true);
  });
});
