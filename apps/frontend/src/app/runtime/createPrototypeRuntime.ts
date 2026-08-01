import { sharedMockPreparationRouteRepository } from "@/adapters/mock/preparationRouteRepository";
import { MOCK_SHOPPING_REQUIREMENTS } from "@/adapters/mock/shoppingRequirementFixtures";
import { createMockSessionAdapter } from "@/app/session/mockSessionAdapter";
import type { FrontendRuntime } from "./types";

/**
 * Prototype composition root: fixtures, ScenarioBar, and mock session are explicit.
 */
export function createPrototypeRuntime(): FrontendRuntime {
  return {
    mode: "prototype",
    sessionAdapter: createMockSessionAdapter({ initiallyAuthenticated: false }),
    preparationRouteRepository: sharedMockPreparationRouteRepository,
    enableScenarioBar: true,
    enablePrototypeFixtures: true,
    persistPrototypeAuth: true,
    shoppingRequirementProjections: MOCK_SHOPPING_REQUIREMENTS,
    prototypeBanner: true,
  };
}
