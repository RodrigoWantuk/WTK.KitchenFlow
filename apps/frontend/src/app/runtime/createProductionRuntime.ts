import { UnavailablePreparationRouteRepository } from "@/adapters/live/unavailablePreparationRouteRepository";
import { createUnavailableSessionAdapter } from "@/app/session/unavailableSessionAdapter";
import type { FrontendRuntime } from "./types";

/**
 * Production composition root: scenario tooling off, no synthetic seeds, no mock prep repo.
 * Missing live adapters surface as controlled unavailable states.
 */
export function createProductionRuntime(): FrontendRuntime {
  return {
    mode: "production",
    sessionAdapter: createUnavailableSessionAdapter(),
    preparationRouteRepository: new UnavailablePreparationRouteRepository(),
    enableScenarioBar: false,
    enablePrototypeFixtures: false,
    persistPrototypeAuth: false,
    shoppingRequirementProjections: [],
    prototypeBanner: false,
  };
}
