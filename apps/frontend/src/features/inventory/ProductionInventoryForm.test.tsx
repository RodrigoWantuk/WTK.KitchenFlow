import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductionInventoryForm } from "./ProductionInventoryForm";
import { InventoryApiError } from "@/adapters/live/inventoryTypes";
import {
  createMockInventoryRepo,
  createSessionAdapter,
  sampleLot,
} from "./testUtils";
import { ProductionI18nProvider } from "@/app/i18n/ProductionI18nProvider";
import { SessionProvider } from "@/app/session/SessionProvider";
import { InventoryProvider } from "./InventoryProvider";
import { MemoryRouter, Route, Routes } from "react-router-dom";

function renderForm(
  mode: "create" | "edit",
  repo = createMockInventoryRepo(),
  locale: "en" | "pt-BR" | "es" = "en",
) {
  return render(
    <ProductionI18nProvider initialLocale={locale}>
      <SessionProvider adapter={createSessionAdapter()}>
        <InventoryProvider repository={repo}>
          <MemoryRouter
            initialEntries={[
              mode === "create"
                ? "/app/despensa/novo"
                : `/app/despensa/${sampleLot.lotId}/editar`,
            ]}
          >
            <Routes>
              <Route
                path="/app/despensa/novo"
                element={<ProductionInventoryForm mode="create" />}
              />
              <Route
                path="/app/despensa/:lotId/editar"
                element={<ProductionInventoryForm mode="edit" />}
              />
              <Route path="/app/despensa/:lotId" element={<div>detail</div>} />
            </Routes>
          </MemoryRouter>
        </InventoryProvider>
      </SessionProvider>
    </ProductionI18nProvider>,
  );
}

describe("ProductionInventoryForm", () => {
  it("creates measured lots with locale decimals and idempotency key", async () => {
    const user = userEvent.setup();
    const createLot = jest.fn(async (_input, options) => {
      expect(options.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
      return sampleLot;
    });
    const repo = createMockInventoryRepo({ createLot });
    renderForm("create", repo, "pt-BR");

    await user.type(screen.getByTestId("inventory-product-name"), "Arroz");
    await user.type(screen.getByTestId("inventory-amount"), "1.250,5");
    await user.click(screen.getByTestId("inventory-save"));

    await waitFor(() => expect(createLot).toHaveBeenCalled());
    expect(createLot).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: "Arroz",
        quantity: { kind: "measured", value: 1250.5, unit: "Gram" },
        customLocation: null,
      }),
      expect.objectContaining({ csrfToken: "csrf-test" }),
    );
  });

  it("requires custom location for Other and sends it on create", async () => {
    const user = userEvent.setup();
    const createLot = jest.fn(async () => sampleLot);
    const repo = createMockInventoryRepo({ createLot });
    renderForm("create", repo);

    await user.type(screen.getByTestId("inventory-product-name"), "Herbs");
    await user.type(screen.getByTestId("inventory-amount"), "1");
    await user.selectOptions(screen.getByTestId("inventory-location"), "Other");
    await user.click(screen.getByTestId("inventory-save"));
    expect(await screen.findByTestId("inventory-form-error")).toHaveTextContent(
      /custom location/i,
    );

    await user.type(
      screen.getByTestId("inventory-custom-location"),
      "Garage shelf",
    );
    await user.click(screen.getByTestId("inventory-save"));
    await waitFor(() =>
      expect(createLot).toHaveBeenCalledWith(
        expect.objectContaining({
          storageLocation: "Other",
          customLocation: "Garage shelf",
        }),
        expect.any(Object),
      ),
    );
  });

  it("edits metadata with ETag and surfaces 412 without silent retry", async () => {
    const user = userEvent.setup();
    const updateLot = jest
      .fn()
      .mockRejectedValueOnce(
        new InventoryApiError("precondition_failed", "stale", 412),
      );
    const repo = createMockInventoryRepo({
      getLot: jest.fn(async () => sampleLot),
      updateLot,
    });
    renderForm("edit", repo);
    expect(await screen.findByDisplayValue("Rice")).toBeInTheDocument();
    await user.clear(screen.getByTestId("inventory-product-name"));
    await user.type(screen.getByTestId("inventory-product-name"), "Brown rice");
    await user.click(screen.getByTestId("inventory-save"));
    expect(
      await screen.findByTestId("inventory-form-conflict"),
    ).toBeInTheDocument();
    expect(updateLot).toHaveBeenCalledTimes(1);
    expect(updateLot).toHaveBeenCalledWith(
      sampleLot.lotId,
      expect.any(Object),
      expect.objectContaining({ etag: '"v1"' }),
    );
  });

  it("maps customLocation field errors from the backend", async () => {
    const user = userEvent.setup();
    const createLot = jest.fn(async () => {
      throw new InventoryApiError("validation_failed", "invalid", 400, {
        customLocation: ["Custom location is invalid."],
      });
    });
    const repo = createMockInventoryRepo({ createLot });
    renderForm("create", repo);
    await user.type(screen.getByTestId("inventory-product-name"), "X");
    await user.type(screen.getByTestId("inventory-amount"), "1");
    await user.selectOptions(screen.getByTestId("inventory-location"), "Other");
    await user.type(screen.getByTestId("inventory-custom-location"), "bad");
    await user.click(screen.getByTestId("inventory-save"));
    expect(await screen.findByTestId("inventory-form-error")).toHaveTextContent(
      /Custom location is invalid/,
    );
    expect(screen.getByTestId("inventory-custom-location")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
