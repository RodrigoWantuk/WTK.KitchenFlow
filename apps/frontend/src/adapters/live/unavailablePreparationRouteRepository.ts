import type {
  PreparationRouteProjection,
  PreparationRouteRepository,
  PreparationRouteTask,
} from "../../contracts/preparation";

const EMPTY_PROJECTION: PreparationRouteProjection = {
  routeId: "unavailable",
  tasks: [],
  readyTargets: [],
  highlightedTaskId: null,
};

/**
 * Production stand-in when a live preparation-route adapter is not yet wired.
 * Never falls back to the shared mock repository.
 */
export class UnavailablePreparationRouteRepository
  implements PreparationRouteRepository
{
  private readonly listeners = new Set<() => void>();
  private readonly snapshot: PreparationRouteProjection = EMPTY_PROJECTION;

  getRouteId(): string {
    return "unavailable";
  }

  getTasks(): PreparationRouteTask[] {
    return [];
  }

  getCompletedIds(): ReadonlySet<string> {
    return new Set();
  }

  getInProgressIds(): ReadonlySet<string> {
    return new Set();
  }

  getDismissedTargetIds(): ReadonlySet<string> {
    return new Set();
  }

  getProjectionSnapshot(): PreparationRouteProjection {
    return this.snapshot;
  }

  markDone(): void {
    // No-op: live mutations are not available.
  }

  markInProgress(): void {
    // No-op: live mutations are not available.
  }

  dismissCookCta(): void {
    // No-op: live mutations are not available.
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
