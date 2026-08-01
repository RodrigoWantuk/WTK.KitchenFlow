import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AppShell from "@/components/AppShell";
import Today from "@/pages/Today";
import Pantry from "@/pages/Pantry";
import { StoreProvider } from "@/lib/store";
import { RuntimeProvider } from "@/app/runtime/RuntimeProvider";
import { createPrototypeRuntime } from "@/app/runtime/createPrototypeRuntime";
import { PreparationRouteProvider } from "@/features/preparation-route/PreparationRouteProvider";
import { MockPreparationRouteRepository } from "@/adapters/mock/preparationRouteRepository";

const runtime = createPrototypeRuntime();

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
});

function renderAuthenticated(path: string) {
  const repo = new MockPreparationRouteRepository();
  return render(
    <RuntimeProvider runtime={runtime}>
      <StoreProvider enablePrototypeFixtures persistPrototypeAuth>
        <MemoryRouter initialEntries={[path]}>
          <PreparationRouteProvider repository={repo}>
            <AppShell>
              <Routes>
                <Route path="/app/hoje" element={<Today />} />
                <Route path="/app/despensa" element={<Pantry />} />
              </Routes>
            </AppShell>
          </PreparationRouteProvider>
        </MemoryRouter>
      </StoreProvider>
    </RuntimeProvider>,
  );
}

describe("authenticated surfaces interactive nesting", () => {
  it("AppShell + Today render without nested interactive controls", () => {
    renderAuthenticated("/app/hoje");
    expect(document.querySelectorAll("a button, button a").length).toBe(0);
  });

  it("AppShell + Pantry render without nested interactive controls", () => {
    renderAuthenticated("/app/despensa");
    expect(document.querySelectorAll("a button, button a").length).toBe(0);
  });
});
