import { UnavailablePreparationRouteRepository } from "@/adapters/live/unavailablePreparationRouteRepository";
import { createLiveInventoryRepository } from "@/adapters/live/liveInventoryRepository";
import { createBffSessionAdapter } from "@/app/session/bffSessionAdapter";
import type { FrontendRuntime } from "./types";

/**
 * Production composition root: scenario tooling off, no synthetic seeds, no mock prep repo.
 * Session and inventory use live BFF adapters; missing prep routes remain unavailable.
 */
export function createProductionRuntime(): FrontendRuntime {
  return {
    mode: "production",
    sessionAdapter: createBffSessionAdapter(),
    inventoryRepository: createLiveInventoryRepository(),
    preparationRouteRepository: new UnavailablePreparationRouteRepository(),
    enableScenarioBar: false,
    enablePrototypeFixtures: false,
    persistPrototypeAuth: false,
    shoppingRequirementProjections: [],
    prototypeBanner: false,
  };
}
