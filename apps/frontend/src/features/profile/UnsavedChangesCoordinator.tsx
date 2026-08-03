import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useBlocker, useLocation } from "react-router-dom";
import { UnsavedChangesDialog } from "./useUnsavedChangesGuard";
import { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";

/**
 * One editor section's dirty-state contract with the profile-route coordinator.
 * `discard` must restore the page to the last-loaded server snapshot without navigating.
 */
export interface UnsavedChangesRegistration {
  isDirty: boolean;
  discard: () => void;
}

export interface UnsavedChangesCoordinator {
  /** Registers an editor; returns an unregister function for effect cleanup. */
  register: (source: UnsavedChangesRegistration) => () => void;
  /**
   * Runs `action` immediately when no registered editor is dirty; otherwise opens the
   * accessible confirmation and runs `action` only after Discard (after calling every
   * registered `discard`). Prefer ordinary React Router `<Link>` / `navigate` when
   * possible — {@link useBlocker} already intercepts those while dirty.
   */
  requestNavigation: (action: () => void) => void;
  /** True when any registered editor currently reports dirty local state. */
  isDirty: boolean;
}

const UnsavedChangesCoordinatorContext =
  createContext<UnsavedChangesCoordinator | null>(null);

/**
 * Profile-route-level unsaved-changes boundary.
 *
 * Mount once under the `/app/perfil*` layout (inside a data router so
 * {@link useBlocker} is available). Active editors register their dirty state; shell
 * and in-profile navigations, browser Back/Forward, and `navigate()` calls are then
 * blocked while dirty.
 *
 * Modified clicks (Ctrl/Cmd/Shift/middle button, `target=_blank`) are not intercepted
 * by the router: the new browsing context opens, and the original tab keeps its draft
 * until the user saves, cancels, or confirms leave there.
 *
 * Requires `createBrowserRouter` / `createMemoryRouter` (not legacy `BrowserRouter`).
 */
export function UnsavedChangesCoordinatorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { t } = useProductionI18n();
  const location = useLocation();
  const registrationsRef = useRef(
    new Map<number, UnsavedChangesRegistration>(),
  );
  const nextIdRef = useRef(0);
  const [dirtyEpoch, setDirtyEpoch] = useState(0);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  /**
   * Allows navigations to proceed after the user confirms Discard, even if React
   * has not yet re-rendered registered editors as clean. Cleared on the next
   * settled location change — not merely when the blocker returns to unblocked —
   * so a confirmed Back cannot immediately re-open the prompt.
   */
  const allowNextNavigationRef = useRef(false);

  const recomputeDirty = useCallback(() => {
    setDirtyEpoch((value) => value + 1);
  }, []);

  const isDirty = useMemo(() => {
    void dirtyEpoch;
    for (const entry of registrationsRef.current.values()) {
      if (entry.isDirty) return true;
    }
    return false;
  }, [dirtyEpoch]);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const register = useCallback(
    (source: UnsavedChangesRegistration) => {
      const id = ++nextIdRef.current;
      registrationsRef.current.set(id, source);
      recomputeDirty();
      return () => {
        registrationsRef.current.delete(id);
        recomputeDirty();
      };
    },
    [recomputeDirty],
  );

  const discardAll = useCallback(() => {
    for (const entry of registrationsRef.current.values()) {
      // Mark clean synchronously so useBlocker/`isDirtyRef` stop seeing dirty state
      // before React applies the editors' setState from `discard()`.
      entry.isDirty = false;
      entry.discard();
    }
    isDirtyRef.current = false;
    recomputeDirty();
  }, [recomputeDirty]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (allowNextNavigationRef.current) return false;
    if (!isDirtyRef.current) return false;
    return (
      currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search ||
      currentLocation.hash !== nextLocation.hash
    );
  });

  useEffect(() => {
    // After a confirmed navigation settles on a new location, drop the bypass.
    // Clearing when `isDirty` flips false is too early: that can happen in the same
    // turn as `discardAll()` before `blocker.proceed()` finishes.
    if (!allowNextNavigationRef.current) return undefined;
    const timer = window.setTimeout(() => {
      allowNextNavigationRef.current = false;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.key]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const requestNavigation = useCallback(
    (action: () => void) => {
      if (!isDirtyRef.current) {
        action();
        return;
      }
      setPendingAction(() => () => {
        allowNextNavigationRef.current = true;
        discardAll();
        action();
      });
    },
    [discardAll],
  );

  function confirmDiscard() {
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      action();
      return;
    }
    if (blocker.state === "blocked") {
      allowNextNavigationRef.current = true;
      discardAll();
      blocker.proceed();
    }
  }

  function cancelNavigation() {
    setPendingAction(null);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }

  const isPromptOpen = pendingAction !== null || blocker.state === "blocked";

  const value = useMemo<UnsavedChangesCoordinator>(
    () => ({
      register,
      requestNavigation,
      isDirty,
    }),
    [register, requestNavigation, isDirty],
  );

  return (
    <UnsavedChangesCoordinatorContext.Provider value={value}>
      <UnsavedChangesDialog
        open={isPromptOpen}
        onConfirm={confirmDiscard}
        onCancel={cancelNavigation}
        t={t}
        testIdPrefix="profile"
      />
      {children}
    </UnsavedChangesCoordinatorContext.Provider>
  );
}

/** Access the profile-route unsaved-changes coordinator; throws outside the provider. */
export function useUnsavedChangesCoordinator(): UnsavedChangesCoordinator {
  const ctx = useContext(UnsavedChangesCoordinatorContext);
  if (!ctx) {
    throw new Error(
      "useUnsavedChangesCoordinator requires UnsavedChangesCoordinatorProvider",
    );
  }
  return ctx;
}

/** Optional access for shell chrome that may render outside profile routes. */
export function useOptionalUnsavedChangesCoordinator(): UnsavedChangesCoordinator | null {
  return useContext(UnsavedChangesCoordinatorContext);
}

/**
 * Registers the active editor's dirty state with the profile-route coordinator.
 * Re-registers whenever `isDirty` or `discard` identity changes so the coordinator
 * always sees the latest draft contract.
 */
export function useRegisterUnsavedChanges(
  isDirty: boolean,
  discard: () => void,
): void {
  const { register } = useUnsavedChangesCoordinator();
  useEffect(() => register({ isDirty, discard }), [register, isDirty, discard]);
}
