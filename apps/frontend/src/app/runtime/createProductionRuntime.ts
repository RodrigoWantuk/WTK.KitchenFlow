import { UnavailablePreparationRouteRepository } from "@/adapters/live/unavailablePreparationRouteRepository";
import { createUnavailableContextualHomeAdapter } from "@/adapters/live/unavailableContextualHomeAdapter";
import { createLiveInventoryRepository } from "@/adapters/live/liveInventoryRepository";
import { createBffSessionAdapter } from "@/app/session/bffSessionAdapter";
import type { FrontendRuntime } from "./types";

/**
 * Production composition root: scenario tooling off, no synthetic seeds, no mock prep repo.
 * Session and inventory use live BFF adapters; missing prep/home routes remain unavailable.
 */
export function createProductionRuntime(): FrontendRuntime {
  return {
    mode: "production",
    sessionAdapter: createBffSessionAdapter(),
    inventoryRepository: createLiveInventoryRepository(),
    preparationRouteRepository: new UnavailablePreparationRouteRepository(),
    contextualHomeAdapter: createUnavailableContextualHomeAdapter(),
    enableScenarioBar: false,
    enablePrototypeFixtures: false,
    persistPrototypeAuth: false,
    shoppingRequirementProjections: [],
    prototypeBanner: false,
  };
}
