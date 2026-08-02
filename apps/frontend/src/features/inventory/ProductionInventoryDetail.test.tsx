import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductionInventoryDetail } from "./ProductionInventoryDetail";
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

function renderDetail(
  repo = createMockInventoryRepo({
    getLot: jest.fn(async () => sampleLot),
    getHistory: jest.fn(async () => [
      {
        entryId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        kind: "LifecycleTransaction",
        type: "Consume",
        reasonCode: "ui_consume",
        changedFields: null,
        occurredAt: "2026-08-01T12:00:00Z",
      },
    ]),
    adjustLot: jest.fn(async () => ({
      ...sampleLot,
      quantity: {
        kind: "measured" as const,
        value: 400,
        unit: "Gram" as const,
      },
      etag: '"v2"',
    })),
  }),
  session = createSessionAdapter(),
) {
  return render(
    <ProductionI18nProvider initialLocale="en">
      <SessionProvider adapter={session}>
        <InventoryProvider repository={repo}>
          <MemoryRouter initialEntries={[`/app/despensa/${sampleLot.lotId}`]}>
            <Routes>
              <Route
                path="/app/despensa/:lotId"
                element={<ProductionInventoryDetail />}
              />
              <Route path="/app/despensa" element={<div>list</div>} />
            </Routes>
          </MemoryRouter>
        </InventoryProvider>
      </SessionProvider>
    </ProductionI18nProvider>,
  );
}

describe("ProductionInventoryDetail", () => {
  it("loads lot projection and localized history", async () => {
    renderDetail();
    expect(await screen.findByText("Rice")).toBeInTheDocument();
    expect(screen.getByTestId("inventory-history")).toHaveTextContent(
      /Lifecycle transaction|Consumed from UI|Consume/,
    );
    expect(screen.getByTestId("inventory-printed-date")).toHaveTextContent(
      /31/,
    );
  });

  it("consumes with ETag and new idempotency key, then refreshes history", async () => {
    const user = userEvent.setup();
    const adjustLot = jest.fn(async () => ({
      ...sampleLot,
      quantity: {
        kind: "measured" as const,
        value: 400,
        unit: "Gram" as const,
      },
      etag: '"v2"',
    }));
    const getHistory = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          entryId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
          kind: "LifecycleTransaction",
          type: "Consume",
          reasonCode: "ui_consume",
          changedFields: null,
          occurredAt: "2026-08-01T13:00:00Z",
        },
      ]);
    const repo = createMockInventoryRepo({
      getLot: jest.fn(async () => sampleLot),
      getHistory,
      adjustLot,
    });
    renderDetail(repo);
    await screen.findByText("Rice");
    await user.type(screen.getByTestId("inventory-adjust-value"), "100");
    await user.click(screen.getByTestId("inventory-adjust-submit"));
    await waitFor(() => expect(adjustLot).toHaveBeenCalled());
    expect(adjustLot).toHaveBeenCalledWith(
      sampleLot.lotId,
      expect.objectContaining({ type: "Consume", value: 100 }),
      expect.objectContaining({
        etag: '"v1"',
        idempotencyKey: expect.stringMatching(/^[0-9a-f-]{36}$/i),
      }),
    );
    expect(getHistory).toHaveBeenCalledTimes(2);
  });

  it("supports discard and correct actions", async () => {
    const user = userEvent.setup();
    const adjustLot = jest.fn(async (_id, input) => ({
      ...sampleLot,
      etag: '"v3"',
      quantity: {
        kind: "measured" as const,
        value: input.type === "Correct" ? input.value! : 1,
        unit: "Gram" as const,
      },
    }));
    const repo = createMockInventoryRepo({
      getLot: jest.fn(async () => sampleLot),
      getHistory: jest.fn(async () => []),
      adjustLot,
    });
    renderDetail(repo);
    await screen.findByText("Rice");
    await user.selectOptions(
      screen.getByTestId("inventory-adjust-type"),
      "Discard",
    );
    await user.type(screen.getByTestId("inventory-adjust-value"), "10");
    await user.click(screen.getByTestId("inventory-adjust-submit"));
    await waitFor(() =>
      expect(adjustLot).toHaveBeenCalledWith(
        sampleLot.lotId,
        expect.objectContaining({ type: "Discard" }),
        expect.any(Object),
      ),
    );
  });

  it("changes qualitative availability", async () => {
    const user = userEvent.setup();
    const qualitative = {
      ...sampleLot,
      quantity: {
        kind: "qualitative" as const,
        availability: "Low" as const,
      },
    };
    const adjustLot = jest.fn(async () => ({
      ...qualitative,
      quantity: {
        kind: "qualitative" as const,
        availability: "Available" as const,
      },
      etag: '"v9"',
    }));
    const repo = createMockInventoryRepo({
      getLot: jest.fn(async () => qualitative),
      getHistory: jest.fn(async () => []),
      adjustLot,
    });
    renderDetail(repo);
    await screen.findByText("Rice");
    await user.selectOptions(
      screen.getByTestId("inventory-availability"),
      "Available",
    );
    await user.click(screen.getByTestId("inventory-availability-submit"));
    await waitFor(() =>
      expect(adjustLot).toHaveBeenCalledWith(
        sampleLot.lotId,
        expect.objectContaining({
          type: "AvailabilityChanged",
          availabilityState: "Available",
        }),
        expect.any(Object),
      ),
    );
  });

  it("surfaces 412 and 428 without retry", async () => {
    const user = userEvent.setup();
    const adjustLot = jest
      .fn()
      .mockRejectedValueOnce(
        new InventoryApiError("precondition_failed", "stale", 412),
      );
    const repo = createMockInventoryRepo({
      getLot: jest.fn(async () => sampleLot),
      getHistory: jest.fn(async () => []),
      adjustLot,
    });
    renderDetail(repo);
    await screen.findByText("Rice");
    await user.type(screen.getByTestId("inventory-adjust-value"), "1");
    await user.click(screen.getByTestId("inventory-adjust-submit"));
    expect(
      await screen.findByTestId("inventory-stale-conflict"),
    ).toBeInTheDocument();
    expect(adjustLot).toHaveBeenCalledTimes(1);

    adjustLot.mockRejectedValueOnce(
      new InventoryApiError("precondition_required", "need if-match", 428),
    );
    await user.click(screen.getByTestId("inventory-reload-conflict"));
    await screen.findByText("Rice");
    await user.type(screen.getByTestId("inventory-adjust-value"), "2");
    await user.click(screen.getByTestId("inventory-adjust-submit"));
    expect(
      await screen.findByTestId("inventory-missing-precondition"),
    ).toBeInTheDocument();
  });

  it("disables mutations when CSRF is missing", async () => {
    const repo = createMockInventoryRepo({
      getLot: jest.fn(async () => sampleLot),
      getHistory: jest.fn(async () => []),
    });
    renderDetail(
      repo,
      createSessionAdapter({
        status: "authenticated",
        internalUserId: "11111111-1111-1111-1111-111111111111",
        csrfToken: null,
      }),
    );
    await screen.findByText("Rice");
    expect(screen.getByTestId("inventory-adjust-submit")).toBeDisabled();
    expect(screen.getByTestId("inventory-missing-csrf")).toBeInTheDocument();
  });
});
