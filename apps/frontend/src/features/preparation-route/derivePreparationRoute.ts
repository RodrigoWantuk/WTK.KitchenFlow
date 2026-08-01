import type {
  PreparationRouteProjection,
  PreparationRouteRepository,
  CookHandoffPayload,
  CookReadyTarget,
} from "../../contracts/preparation";
import { projectPreparationRoute } from "./projectPreparationRoute";

/**
 * Derives presentation state for each task from shared completion/progress sets.
 * Unlocking follows dependsOn; blocked tasks are never highlighted.
 */
export function derivePreparationRouteProjection(
  repository: PreparationRouteRepository,
): PreparationRouteProjection {
  return projectPreparationRoute(repository);
}

/**
 * Builds the cook-mode handoff payload from a ready target.
 */
export function toCookHandoff(target: CookReadyTarget): CookHandoffPayload {
  return {
    targetRecipeId: target.targetRecipeId,
    sourcePreparationRouteId: target.sourcePreparationRouteId,
    relatedPlanEntryId: target.relatedPlanEntryId ?? null,
  };
}

/**
 * Serializes handoff into cook route search params for the mock experience.
 */
export function cookHandoffSearchParams(payload: CookHandoffPayload): string {
  const params = new URLSearchParams();
  params.set("sourcePreparationRouteId", payload.sourcePreparationRouteId);
  if (payload.relatedPlanEntryId) {
    params.set("relatedPlanEntryId", payload.relatedPlanEntryId);
  }
  return params.toString();
}
