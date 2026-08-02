import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RuntimeProvider } from "@/app/runtime/RuntimeProvider";
import { SessionProvider } from "@/app/session/SessionProvider";
import { ProductionI18nProvider } from "@/app/i18n/ProductionI18nProvider";
import { createMockSessionAdapter } from "@/app/session/mockSessionAdapter";
import { createMockContextualHomeAdapter } from "@/adapters/mock/contextual-home/mockContextualHomeAdapter";
import { createUnavailableContextualHomeAdapter } from "@/adapters/live/unavailableContextualHomeAdapter";
import { ContextualHomeProvider } from "./ContextualHomeProvider";
import { ContextualHomePage } from "./ContextualHomePage";
import type { FrontendRuntime } from "@/app/runtime/types";
import { UnavailablePreparationRouteRepository } from "@/adapters/live/unavailablePreparationRouteRepository";

function renderHome(options?: {
  displayName?: string | null;
  timeZone?: string | null;
  scenario?: Parameters<typeof createMockContextualHomeAdapter>[0];
  unavailable?: boolean;
  browserTimeZone?: string | null;
  now?: Date;
}) {
  const homeAdapter = options?.unavailable
    ? createUnavailableContextualHomeAdapter()
    : createMockContextualHomeAdapter(options?.scenario);
  const sessionAdapter = createMockSessionAdapter({
    initiallyAuthenticated: true,
    displayName: options?.displayName ?? null,
    timeZone: options?.timeZone ?? null,
  });
  // Force authenticated immediately for tests.
  sessionAdapter.beginLogin();

  const runtime: FrontendRuntime = {
    mode: "test",
    sessionAdapter,
    inventoryRepository: {
      listLots: async () => ({ items: [], nextCursor: null }),
    } as unknown as FrontendRuntime["inventoryRepository"],
    preparationRouteRepository: new UnavailablePreparationRouteRepository(),
    contextualHomeAdapter: homeAdapter,
    enableScenarioBar: false,
    enablePrototypeFixtures: !options?.unavailable,
    persistPrototypeAuth: false,
    shoppingRequirementProjections: [],
  };

  return render(
    <RuntimeProvider runtime={runtime}>
      <SessionProvider adapter={sessionAdapter}>
        <ProductionI18nProvider initialLocale="en">
          <MemoryRouter>
            <ContextualHomeProvider adapter={homeAdapter}>
              <ContextualHomePage
                now={options?.now ?? new Date("2026-06-15T15:00:00.000Z")}
                browserTimeZone={
                  options?.browserTimeZone === undefined
                    ? "UTC"
                    : options.browserTimeZone
                }
              />
            </ContextualHomeProvider>
          </MemoryRouter>
        </ProductionI18nProvider>
      </SessionProvider>
    </RuntimeProvider>,
  );
}

describe("ContextualHomePage", () => {
  it("greets by name and keeps primary question", async () => {
    renderHome({
      displayName: "Ana",
      timeZone: "America/Sao_Paulo",
      now: new Date("2026-06-15T11:00:00.000-03:00"),
    });
    expect(await screen.findByTestId("home-greeting")).toHaveTextContent(
      /Good morning, Ana/,
    );
    expect(screen.getByTestId("home-primary-question")).toHaveTextContent(
      /What shall we cook today/,
    );
  });

  it("uses neutral greeting when display name is absent", async () => {
    renderHome({
      displayName: null,
      timeZone: null,
      browserTimeZone: null,
    });
    expect(await screen.findByTestId("home-greeting")).toHaveTextContent(
      /Welcome back|Hello|Good/,
    );
    expect(screen.getByTestId("home-timezone-fallback")).toBeInTheDocument();
  });

  it("renders sources in menu → inventory → profile order", async () => {
    renderHome({ scenario: { scenario: "default" } });
    const sources = await screen.findByTestId("home-sources");
    const sections = within(sources).getAllByTestId(/home-source-/);
    expect(sections.map((el) => el.getAttribute("data-testid"))).toEqual([
      "home-source-menu",
      "home-source-inventory",
      "home-source-profile",
      "home-source-quickChooser",
    ]);
  });

  it("keeps inventory when menu fails", async () => {
    renderHome({ scenario: { scenario: "menuFailed" } });
    expect(await screen.findByTestId("home-source-menu")).toHaveAttribute(
      "data-status",
      "failed",
    );
    expect(screen.getByTestId("home-source-inventory")).toHaveAttribute(
      "data-status",
      "ready",
    );
    expect(
      screen.getByTestId("home-candidate-mock-inv-spinach-omelette"),
    ).toBeInTheDocument();
  });

  it("shows production unavailable capability states without fixtures", async () => {
    renderHome({ unavailable: true });
    expect(
      await screen.findByTestId("home-live-unavailable"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("home-source-menu")).toHaveAttribute(
      "data-status",
      "unavailable",
    );
  });

  it("runs quick chooser without mutating answers into profile storage", async () => {
    const user = userEvent.setup();
    renderHome({ scenario: { scenario: "default" } });
    await screen.findByTestId("home-open-chooser");
    await user.click(screen.getByTestId("home-open-chooser"));
    expect(screen.getByTestId("quick-chooser")).toBeInTheDocument();
    await user.click(screen.getByTestId("chooser-option-under_20"));
    await user.click(screen.getByTestId("chooser-next"));
    await user.click(screen.getByTestId("chooser-option-use_what_i_have"));
    await user.click(screen.getByTestId("chooser-next"));
    expect(await screen.findByTestId("chooser-results")).toBeInTheDocument();
    expect(localStorage.getItem("cocinaris_state_v1")).toBeNull();
  });

  it("cancels quick chooser and restores focus path", async () => {
    const user = userEvent.setup();
    renderHome({ scenario: { scenario: "default" } });
    const open = await screen.findByTestId("home-open-chooser");
    open.focus();
    await user.click(open);
    await user.click(screen.getByTestId("chooser-cancel"));
    expect(screen.queryByTestId("quick-chooser")).not.toBeInTheDocument();
  });
});
