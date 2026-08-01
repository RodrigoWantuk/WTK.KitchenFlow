import type { QuantityDisplay } from "./quantity";

/** Lifecycle state of a preparation-route task in presentation projections. */
export type PreparationTaskState =
  | "next"
  | "canStart"
  | "inProgress"
  | "overdue"
  | "done"
  | "blocked";

/**
 * One task in a multi-day preparation dependency route.
 */
export interface PreparationRouteTask {
  id: string;
  groupKey: string;
  time: string;
  task: string;
  forTitle: string;
  /** Target recipe unlocked when required tasks for this id are complete. */
  targetRecipeId: string | null;
  /** Related plan entry when the route is attached to a menu slot. */
  relatedPlanEntryId?: string | null;
  produces: string | null;
  activeMin: number;
  passiveMin: number;
  dependsOn: string | null;
  /** Baseline fixture state before shared runtime mutations. */
  baselineState: PreparationTaskState;
  /**
   * When false, completing the target recipe does not require this task.
   * Optional / future-use tasks must not block cook readiness.
   */
  requiredForTarget: boolean;
}

/**
 * Runtime projection of a preparation route for Home and full-route views.
 */
export interface PreparationRouteProjection {
  routeId: string;
  tasks: PreparationRouteTaskView[];
  readyTargets: CookReadyTarget[];
  /** First overdue or available (not blocked) actionable task. */
  highlightedTaskId: string | null;
}

export interface PreparationRouteTaskView extends PreparationRouteTask {
  state: PreparationTaskState;
  isHighlighted: boolean;
}

/**
 * Payload used when a completed route offers the Cook experience.
 */
export interface CookReadyTarget {
  targetRecipeId: string;
  forTitle: string;
  sourcePreparationRouteId: string;
  relatedPlanEntryId?: string | null;
  dismissed: boolean;
}

/**
 * Navigation payload handed to Cook mode.
 */
export interface CookHandoffPayload {
  targetRecipeId: string;
  sourcePreparationRouteId: string;
  relatedPlanEntryId?: string | null;
}

/**
 * Repository boundary for preparation-route progress.
 * Implementations must keep {@link getProjectionSnapshot} referentially stable
 * between notifications so React `useSyncExternalStore` can cache correctly.
 */
export interface PreparationRouteRepository {
  getRouteId(): string;
  getTasks(): PreparationRouteTask[];
  getCompletedIds(): ReadonlySet<string>;
  getInProgressIds(): ReadonlySet<string>;
  getDismissedTargetIds(): ReadonlySet<string>;
  /**
   * Referentially stable projection until the next mutation notifies subscribers.
   */
  getProjectionSnapshot(): PreparationRouteProjection;
  markDone(taskId: string): void;
  markInProgress(taskId: string): void;
  dismissCookCta(targetRecipeId: string): void;
  subscribe(listener: () => void): () => void;
}

export interface ReservationDisplay {
  recipeId?: string;
  title: string;
  reservedQuantity: QuantityDisplay;
  mealLabel?: string;
  when?: string;
}

/**
 * Presentation model for prepared-component availability.
 * Components must not recalculate authoritative reservation rules from recipes or lots.
 */
export interface PreparedComponentAvailability {
  inventoryItemId: string;
  totalQuantity: QuantityDisplay;
  reservedQuantity: QuantityDisplay;
  freeQuantity: QuantityDisplay;
  shortfallQuantity?: QuantityDisplay;
  status: "available" | "fullyReserved" | "shortfall";
  reservations: ReservationDisplay[];
}

export type ShoppingReasonCode =
  | "notInInventory"
  | "insufficientQuantity"
  | "fullyReserved"
  | "uncertainAvailability";

export interface RequirementSourceDisplay {
  planEntryId?: string;
  recipeId?: string;
  recipeTitle: string;
  mealLabel: string;
}

/**
 * Presentation model for shopping review that already includes reservation-aware shortfall.
 */
export interface ShoppingRequirementProjection {
  requirementId: string;
  productId?: string;
  displayName: string;
  requiredQuantity: QuantityDisplay;
  availableQuantity?: QuantityDisplay;
  reservedQuantity?: QuantityDisplay;
  freeQuantity?: QuantityDisplay;
  shortfallQuantity: QuantityDisplay;
  sourceMeals: RequirementSourceDisplay[];
  reasonCode: ShoppingReasonCode;
}
