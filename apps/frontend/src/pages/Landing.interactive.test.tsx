import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Landing from "./Landing";
import { StoreProvider } from "@/lib/store";

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="nav-location">{loc.pathname}</div>;
}

describe("Landing interactive CTAs", () => {
  it("renders a single interactive link CTA without nesting button inside anchor", async () => {
    const user = userEvent.setup();
    render(
      <StoreProvider enablePrototypeFixtures persistPrototypeAuth>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/acesso" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </StoreProvider>,
    );

    expect(document.querySelectorAll("a button").length).toBe(0);

    const cta = screen.getByTestId("landing-enter");
    expect(cta.tagName.toLowerCase()).toBe("a");
    expect(cta).toHaveAttribute("href", "/acesso");

    cta.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("nav-location")).toHaveTextContent("/acesso");
  });
});
