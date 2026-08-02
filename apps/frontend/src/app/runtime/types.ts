import type { ReactNode } from "react";
import type { PreparationRouteRepository } from "@/contracts/preparation";
import type { ContextualHomeAdapter } from "@/contracts/contextualHome";
import type { InventoryRepository } from "@/adapters/live/inventoryTypes";
import type { SessionAdapter } from "@/app/session/types";
import type { FrontendMode } from "./mode";
import type { ShoppingRequirementProjection } from "@/contracts/preparation";

/**
 * Dependencies assembled by an explicit composition root.
 * Providers must not silently default to mock adapters.
 */
export interface FrontendRuntime {
  mode: FrontendMode;
  sessionAdapter: SessionAdapter;
  /** Live inventory repository for production; prototype may inject a stub. */
  inventoryRepository: InventoryRepository;
  preparationRouteRepository: PreparationRouteRepository;
  /**
   * Contextual home sources. Production uses unavailable until PLAN-0021.
   * Prototype/test may inject mocks — never silently in production.
   */
  contextualHomeAdapter: ContextualHomeAdapter;
  /** When false, ScenarioBar and scenario tooling must not render. */
  enableScenarioBar: boolean;
  /** When true, seed fixtures and local mock persistence of personal data are allowed. */
  enablePrototypeFixtures: boolean;
  /** When false, do not persist or trust localStorage `authed`. */
  persistPrototypeAuth: boolean;
  /** Shopping shortfall projections; empty means show controlled unavailable/empty UI. */
  shoppingRequirementProjections: ShoppingRequirementProjection[];
  /** Optional banner copy key for prototype mode. */
  prototypeBanner?: boolean;
}

export interface RuntimeProviderProps {
  runtime: FrontendRuntime;
  children: ReactNode;
}
