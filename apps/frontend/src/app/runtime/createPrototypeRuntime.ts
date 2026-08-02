import { sharedMockPreparationRouteRepository } from "@/adapters/mock/preparationRouteRepository";
import { MOCK_SHOPPING_REQUIREMENTS } from "@/adapters/mock/shoppingRequirementFixtures";
import { createMockContextualHomeAdapter } from "@/adapters/mock/contextual-home/mockContextualHomeAdapter";
import { createLiveInventoryRepository } from "@/adapters/live/liveInventoryRepository";
import { createMockSessionAdapter } from "@/app/session/mockSessionAdapter";
import type { FrontendRuntime } from "./types";

/**
 * Prototype composition root: fixtures, ScenarioBar, and mock session are explicit.
 * Inventory repository is the live adapter shape; prototype UX still uses StoreProvider pantry.
 * Contextual home uses synthetic mocks — never wired into production.
 */
export function createPrototypeRuntime(): FrontendRuntime {
  return {
    mode: "prototype",
    sessionAdapter: createMockSessionAdapter({
      initiallyAuthenticated: false,
      displayName: "Ana",
      timeZone: "America/Sao_Paulo",
    }),
    inventoryRepository: createLiveInventoryRepository(),
    preparationRouteRepository: sharedMockPreparationRouteRepository,
    contextualHomeAdapter: createMockContextualHomeAdapter({
      scenario: "default",
    }),
    enableScenarioBar: true,
    enablePrototypeFixtures: true,
    persistPrototypeAuth: true,
    shoppingRequirementProjections: MOCK_SHOPPING_REQUIREMENTS,
    prototypeBanner: true,
  };
}
