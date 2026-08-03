import {
  createContext,
  createElement,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "@/app/session/SessionProvider";
import {
  ProfileApiError,
  type EquipmentInput,
  type EquipmentSnapshot,
  type PreferenceCommand,
  type PreferenceSnapshot,
  type ProfilePatch,
  type ProfileRepository,
  type ProfileSnapshot,
  type ProfileWorkspace,
} from "@/contracts/profile";
import type { AdultDeclarationPolicy } from "./adultDeclarationPolicy";

/**
 * Coordinated load status for the shared profile workspace.
 *
 * - `idle`: session status is not yet known; the provider has not attempted a load.
 * - `loading`: an initial or reload fetch is in flight. Pages should only show a
 *   full-page loading state while `workspace` is still `null`; a reload after a
 *   successful mutation also passes through `loading` and pages should keep
 *   rendering the previous workspace snapshot during that brief window.
 * - `ready`: `workspace` reflects a consistent snapshot; mutations are allowed.
 * - `version_conflict`: the profile/preferences/equipment version tokens disagreed
 *   even after one retry (a concurrent edit elsewhere). Mutations are blocked until
 *   an explicit `reload()`.
 * - `session`: the session is not authenticated, or the profile endpoints reported
 *   `authentication_required`/`forbidden`.
 * - `error`: an unexpected or transport failure occurred loading the workspace.
 */
export type ProfileWorkspaceStatus =
  | "idle"
  | "loading"
  | "ready"
  | "version_conflict"
  | "session"
  | "error";

/**
 * Error codes that require re-syncing the shared workspace with the server before
 * the caller can meaningfully retry: a stale precondition, a missing precondition,
 * or a profile that was created concurrently elsewhere.
 */
const RESYNC_ON_ERROR_CODES: ReadonlySet<ProfileApiError["code"]> = new Set([
  "precondition_failed",
  "precondition_required",
  "profile_already_exists",
]);

export interface ProfileWorkspaceContextValue {
  status: ProfileWorkspaceStatus;
  workspace: ProfileWorkspace | null;
  /** Human-readable summary for `status` `"error"` or `"session"`; `null` otherwise. */
  error: string | null;
  /** True while a mutation is in flight; callers should disable submit controls. */
  isMutating: boolean;
  /**
   * Most recent mutation failure. Pages branch on `.code` (for example
   * `precondition_failed`, `precondition_required`, `profile_already_exists`,
   * `validation_failed`) to decide how to react without losing their own draft
   * state, which this provider intentionally does not own.
   */
  lastMutationError: ProfileApiError | null;
  clearMutationError: () => void;
  adultPolicy: AdultDeclarationPolicy;
  /** Re-fetches profile, preferences, equipment, and completeness as one unit. */
  reload: () => Promise<void>;
  patchProfile: (patch: ProfilePatch) => Promise<ProfileSnapshot>;
  mutatePreferences: (
    commands: PreferenceCommand[],
  ) => Promise<PreferenceSnapshot>;
  replaceEquipment: (entries: EquipmentInput[]) => Promise<EquipmentSnapshot>;
}

const ProfileWorkspaceContext =
  createContext<ProfileWorkspaceContextValue | null>(null);

async function fetchWorkspaceOnce(
  repository: ProfileRepository,
  signal: AbortSignal,
): Promise<ProfileWorkspace> {
  const [profile, preferences, equipment, completeness] = await Promise.all([
    repository.getProfile(signal),
    repository.getPreferences(signal),
    repository.getEquipment(signal),
    repository.getCompleteness(signal),
  ]);
  return {
    profile,
    preferences,
    equipment,
    completeness,
    version: profile.version,
    etag: profile.etag,
  };
}

/**
 * True when the profile, preferences, and equipment version tokens agree (or the
 * profile does not exist yet, in which case all three are expected `null`).
 */
function hasConsistentVersions(workspace: ProfileWorkspace): boolean {
  if (!workspace.profile.profileExists) return true;
  const versions = [
    workspace.profile.version,
    workspace.preferences.version,
    workspace.equipment.version,
  ].filter((value): value is string => value != null);
  return versions.every((value) => value === versions[0]);
}

/**
 * Loads the profile/preferences/equipment/completeness workspace as one coordinated
 * unit, serializes mutations through a single queue, and keeps the shared
 * version/etag consistent across the four collections.
 *
 * Must mount under `SessionProvider`: it reads the authenticated CSRF token for
 * mutations and calls `session.refresh()` after every successful mutation so
 * session-derived profile fields (language, display name, completeness) stay
 * current for the rest of the app.
 */
export function ProfileProvider({
  repository,
  adultPolicy,
  children,
}: {
  repository: ProfileRepository;
  adultPolicy: AdultDeclarationPolicy;
  children: ReactNode;
}) {
  const { session, refresh: refreshSession } = useSession();
  const [status, setStatus] = useState<ProfileWorkspaceStatus>("idle");
  const [workspace, setWorkspace] = useState<ProfileWorkspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [lastMutationError, setLastMutationError] =
    useState<ProfileApiError | null>(null);

  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const mutationQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const workspaceRef = useRef<ProfileWorkspace | null>(null);
  workspaceRef.current = workspace;

  const load = useCallback(async () => {
    const generation = ++generationRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setError(null);
    try {
      let next = await fetchWorkspaceOnce(repository, controller.signal);
      if (!hasConsistentVersions(next)) {
        // A concurrent mutation elsewhere raced our four parallel GETs. Retry once
        // before surfacing a conflict so an ordinary transient race does not block
        // the whole workspace.
        next = await fetchWorkspaceOnce(repository, controller.signal);
      }
      if (generation !== generationRef.current) return;
      setWorkspace(next);
      setStatus(hasConsistentVersions(next) ? "ready" : "version_conflict");
    } catch (err) {
      if (controller.signal.aborted) return;
      if (generation !== generationRef.current) return;
      if (err instanceof ProfileApiError) {
        if (err.code === "cancelled") return;
        if (
          err.code === "authentication_required" ||
          err.code === "forbidden"
        ) {
          setStatus("session");
          setError(err.message);
          return;
        }
      }
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Unexpected profile error.",
      );
    }
  }, [repository]);

  useEffect(() => {
    if (session.status === "authenticated") {
      void load();
      return () => abortRef.current?.abort();
    }
    if (session.status === "loading") {
      setStatus("idle");
      return undefined;
    }
    // signedOut/expired/unavailable: never fetch profile data without a session.
    generationRef.current += 1;
    abortRef.current?.abort();
    setStatus("session");
    setWorkspace(null);
    setError(null);
    return undefined;
  }, [session.status, load]);

  const runMutation = useCallback(
    <T,>(fn: (csrfToken: string) => Promise<T>): Promise<T> => {
      const chained = mutationQueueRef.current.then(async () => {
        if (!session.csrfToken) {
          const missingCsrf = new ProfileApiError(
            "authentication_required",
            "Your session CSRF token is missing. Sign in again.",
            401,
          );
          setLastMutationError(missingCsrf);
          throw missingCsrf;
        }
        setIsMutating(true);
        setLastMutationError(null);
        try {
          const result = await fn(session.csrfToken);
          await load();
          await refreshSession();
          return result;
        } catch (err) {
          if (
            err instanceof ProfileApiError &&
            RESYNC_ON_ERROR_CODES.has(err.code)
          ) {
            // Do not auto-retry the mutation: re-sync the workspace so the caller's
            // next attempt (or explicit reload) has a current version/etag, while
            // the caller's own draft state is left untouched here.
            await load();
          }
          if (err instanceof ProfileApiError) {
            setLastMutationError(err);
          }
          throw err;
        } finally {
          setIsMutating(false);
        }
      });
      // Keep the queue itself always-resolved so one failed mutation does not wedge
      // subsequent queued mutations; the caller still observes the rejection below.
      mutationQueueRef.current = chained.then(
        () => undefined,
        () => undefined,
      );
      return chained;
    },
    [session.csrfToken, load, refreshSession],
  );

  const patchProfile = useCallback(
    (patch: ProfilePatch) =>
      runMutation((csrfToken) =>
        repository.patchProfile(patch, {
          csrfToken,
          etag: workspaceRef.current?.profile.etag ?? null,
        }),
      ),
    [repository, runMutation],
  );

  const mutatePreferences = useCallback(
    (commands: PreferenceCommand[]) =>
      runMutation((csrfToken) =>
        repository.mutatePreferences(commands, {
          csrfToken,
          etag: workspaceRef.current?.preferences.etag ?? null,
        }),
      ),
    [repository, runMutation],
  );

  const replaceEquipment = useCallback(
    (entries: EquipmentInput[]) =>
      runMutation((csrfToken) =>
        repository.replaceEquipment(entries, {
          csrfToken,
          etag: workspaceRef.current?.equipment.etag ?? null,
        }),
      ),
    [repository, runMutation],
  );

  const clearMutationError = useCallback(() => setLastMutationError(null), []);

  const value = useMemo<ProfileWorkspaceContextValue>(
    () => ({
      status,
      workspace,
      error,
      isMutating,
      lastMutationError,
      clearMutationError,
      adultPolicy,
      reload: load,
      patchProfile,
      mutatePreferences,
      replaceEquipment,
    }),
    [
      status,
      workspace,
      error,
      isMutating,
      lastMutationError,
      clearMutationError,
      adultPolicy,
      load,
      patchProfile,
      mutatePreferences,
      replaceEquipment,
    ],
  );

  return createElement(ProfileWorkspaceContext.Provider, { value }, children);
}

/** Access the shared profile workspace; throws outside `ProfileProvider`. */
export function useProfileWorkspace(): ProfileWorkspaceContextValue {
  const ctx = useContext(ProfileWorkspaceContext);
  if (!ctx) {
    throw new Error("useProfileWorkspace requires ProfileProvider");
  }
  return ctx;
}
