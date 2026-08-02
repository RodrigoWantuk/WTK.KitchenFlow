import { sharedMockPreparationRouteRepository } from "@/adapters/mock/preparationRouteRepository";
import { MOCK_SHOPPING_REQUIREMENTS } from "@/adapters/mock/shoppingRequirementFixtures";
import { createLiveInventoryRepository } from "@/adapters/live/liveInventoryRepository";
import { createMockSessionAdapter } from "@/app/session/mockSessionAdapter";
import type { FrontendRuntime } from "./types";

/**
 * Prototype composition root: fixtures, ScenarioBar, and mock session are explicit.
 * Inventory repository is the live adapter shape; prototype UX still uses StoreProvider pantry.
 */
export function createPrototypeRuntime(): FrontendRuntime {
  return {
    mode: "prototype",
    sessionAdapter: createMockSessionAdapter({ initiallyAuthenticated: false }),
    inventoryRepository: createLiveInventoryRepository(),
    preparationRouteRepository: sharedMockPreparationRouteRepository,
    enableScenarioBar: true,
    enablePrototypeFixtures: true,
    persistPrototypeAuth: true,
    shoppingRequirementProjections: MOCK_SHOPPING_REQUIREMENTS,
    prototypeBanner: true,
  };
}
