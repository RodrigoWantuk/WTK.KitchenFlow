import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type {
  CookHandoffPayload,
  CookReadyTarget,
  PreparationRouteProjection,
  PreparationRouteRepository,
} from "../../contracts/preparation";
import { sharedMockPreparationRouteRepository } from "../../adapters/mock/preparationRouteRepository";
import {
  cookHandoffSearchParams,
  derivePreparationRouteProjection,
  toCookHandoff,
} from "./derivePreparationRoute";

interface PreparationRouteContextValue {
  projection: PreparationRouteProjection;
  markDone: (taskId: string) => void;
  startNow: (taskId: string) => void;
  dismissCookCta: (targetRecipeId: string) => void;
  getActiveCookTarget: () => CookReadyTarget | null;
  buildCookHandoff: (target: CookReadyTarget) => CookHandoffPayload;
  buildCookPath: (target: CookReadyTarget) => string;
}

const PreparationRouteContext = createContext<PreparationRouteContextValue | null>(null);

export interface PreparationRouteProviderProps {
  children: ReactNode;
  /** Override repository for tests. Defaults to the shared mock singleton. */
  repository?: PreparationRouteRepository;
}

/**
 * Provides a single preparation-route progress boundary to Home, Plan, and cook handoff.
 */
export function PreparationRouteProvider({
  children,
  repository = sharedMockPreparationRouteRepository,
}: PreparationRouteProviderProps) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => repository.subscribe(onStoreChange),
    [repository],
  );
  const getSnapshot = useCallback(
    () => derivePreparationRouteProjection(repository),
    [repository],
  );
  const projection = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const value = useMemo<PreparationRouteContextValue>(
    () => ({
      projection,
      markDone: (taskId: string) => repository.markDone(taskId),
      startNow: (taskId: string) => repository.markInProgress(taskId),
      dismissCookCta: (targetRecipeId: string) => repository.dismissCookCta(targetRecipeId),
      getActiveCookTarget: () =>
        projection.readyTargets.find((t) => !t.dismissed) ?? null,
      buildCookHandoff: toCookHandoff,
      buildCookPath: (target: CookReadyTarget) => {
        const payload = toCookHandoff(target);
        const qs = cookHandoffSearchParams(payload);
        return `/app/cozinhar/${payload.targetRecipeId}?${qs}`;
      },
    }),
    [projection, repository],
  );

  return createElement(PreparationRouteContext.Provider, { value }, children);
}

/**
 * Access shared preparation-route state. Must be used under PreparationRouteProvider.
 */
export function usePreparationRoute(): PreparationRouteContextValue {
  const ctx = useContext(PreparationRouteContext);
  if (!ctx) {
    throw new Error("usePreparationRoute must be used within PreparationRouteProvider");
  }
  return ctx;
}
