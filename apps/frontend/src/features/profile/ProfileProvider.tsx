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
 * State machine summary (see {@link ProfileProvider} for the full narrative):
 *
 * - `idle`: session status is not yet known; the provider has not attempted a load.
 * - `loading`: an initial load, an explicit `reload()`, or the automatic reload the
 *   provider runs after a successful mutation is in flight. Pages should only show a
 *   full-page loading state while `workspace` is still `null`; the automatic
 *   post-mutation reload deliberately leaves the previous workspace snapshot in place
 *   while it runs, so pages keep rendering that previous snapshot during the brief
 *   window between a mutation resolving and the reload settling.
 * - `ready`: `workspace` is non-null and passes {@link isWorkspaceConsistent}; mutations
 *   are allowed (subject to `saveRefreshFailed`, see below).
 * - `version_conflict`: the profile/preferences/equipment version tokens (or their
 *   normalized `ETag`s) disagreed even after one retry — a concurrent edit elsewhere.
 *   `workspace` is set to `null` in this state: the provider never exposes the
 *   inconsistent snapshot it just fetched as if it were current. Mutations are
 *   blocked until an explicit `reload()` produces a consistent snapshot.
 * - `session`: the session is not authenticated, or the profile endpoints reported
 *   `authentication_required`/`forbidden`.
 * - `error`: an unexpected or transport failure occurred loading the workspace. The
 *   previously loaded `workspace` (if any) is left in place rather than cleared,
 *   except when the failure happened on the very first load.
 *
 * Independently of `status`, {@link ProfileWorkspaceContextValue.saveRefreshFailed}
 * tracks a narrower case: a mutation that the backend already accepted, but whose
 * mandatory post-mutation reload did not end in `ready`. See `runMutation` in
 * {@link ProfileProvider} for the full handling of that case.
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
  /**
   * True when the most recent mutation was accepted by the backend but the mandatory
   * post-mutation reload of the workspace did not end in `ready` (network failure,
   * a fresh version conflict, or a session problem). The mutation itself must not be
   * reported as failed in this case — the save succeeded — but the provider cannot
   * guarantee the version/`ETag` it holds is current, so further mutations are
   * rejected with `workspace_not_ready` until an explicit {@link reload} clears this
   * flag (successful or not: `reload()` always clears it as a fresh attempt).
   */
  saveRefreshFailed: boolean;
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
 * Strips a well-formed `ETag` header value down to its opaque token so it can be
 * compared against an unquoted body-level version string: removes a leading weak
 * (`W/`) indicator and one surrounding pair of double quotes. Returns the input
 * unchanged if it is not quoted, so a malformed/unexpected shape still participates
 * in the comparison (and therefore fails closed as "inconsistent") rather than being
 * silently normalized away.
 */
function normalizeEtagToken(raw: string | null): string | null {
  if (raw == null) return null;
  let value = raw.trim();
  if (value.startsWith("W/")) {
    value = value.slice(2);
  }
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  return value;
}

/**
 * Full workspace consistency invariant. Exported for direct unit testing.
 *
 * Absent profile (`profile.profileExists === false`): every version and `ETag` across
 * profile, preferences, and equipment must be `null`, and `completeness.profileExists`
 * must be `false`. A profile that does not exist yet cannot have a real version.
 *
 * Existing profile (`profile.profileExists === true`): `completeness.profileExists`
 * must be `true`, and every version/`ETag` across profile, preferences, and equipment
 * must be non-null and identify the same aggregate version once `ETag`s are normalized
 * (surrounding quotes and a leading weak indicator stripped, see
 * {@link normalizeEtagToken}). Body version and header `ETag` are compared on equal
 * footing here — a header that contradicts the body version makes the workspace
 * inconsistent; neither is silently preferred over the other.
 */
export function isWorkspaceConsistent(workspace: ProfileWorkspace): boolean {
  const { profile, preferences, equipment, completeness } = workspace;

  if (!profile.profileExists) {
    return (
      profile.version === null &&
      profile.etag === null &&
      preferences.version === null &&
      preferences.etag === null &&
      equipment.version === null &&
      equipment.etag === null &&
      completeness.profileExists === false
    );
  }

  if (!completeness.profileExists) return false;
  if (profile.version === null || profile.etag === null) return false;
  if (preferences.version === null || preferences.etag === null) return false;
  if (equipment.version === null || equipment.etag === null) return false;

  const identifiers = [
    profile.version,
    preferences.version,
    equipment.version,
    normalizeEtagToken(profile.etag),
    normalizeEtagToken(preferences.etag),
    normalizeEtagToken(equipment.etag),
  ];
  return identifiers.every((value) => value === identifiers[0]);
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
  const [saveRefreshFailed, setSaveRefreshFailed] = useState(false);

  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const mutationQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const workspaceRef = useRef<ProfileWorkspace | null>(null);
  workspaceRef.current = workspace;
  const statusRef = useRef<ProfileWorkspaceStatus>(status);
  statusRef.current = status;
  const saveRefreshFailedRef = useRef(saveRefreshFailed);
  saveRefreshFailedRef.current = saveRefreshFailed;

  /**
   * Fetches and, on a version race, retries once; never publishes an inconsistent
   * snapshot. Returns whether the load ended in `ready` so callers (in particular the
   * post-mutation resync in `runMutation`) can react without this function ever
   * throwing.
   *
   * - `mode: "initial"` (mount, or an explicit `reload()`): resets `error` and clears
   *   `saveRefreshFailed` up front, since an explicit reload is the documented way to
   *   recover from a prior stuck state.
   * - `mode: "resync"` (only called internally, right after a mutation succeeds):
   *   deliberately leaves the previous workspace/error in place while the fetch is in
   *   flight (status still flows through `loading`) so pages do not flash a blank
   *   state right after a successful save. On failure it also leaves the previous
   *   workspace as-is (except a version conflict, which — like any other load — must
   *   never be published) and lets the caller decide how to expose the failure.
   */
  const load = useCallback(
    async (mode: "initial" | "resync" = "initial"): Promise<boolean> => {
      const generation = ++generationRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");
      if (mode === "initial") {
        setError(null);
        setSaveRefreshFailed(false);
      }
      try {
        let next = await fetchWorkspaceOnce(repository, controller.signal);
        if (!isWorkspaceConsistent(next)) {
          // A concurrent mutation elsewhere raced our four parallel GETs. Retry once
          // before surfacing a conflict so an ordinary transient race does not block
          // the whole workspace.
          next = await fetchWorkspaceOnce(repository, controller.signal);
        }
        if (generation !== generationRef.current) return false;
        if (isWorkspaceConsistent(next)) {
          setWorkspace(next);
          setStatus("ready");
          return true;
        }
        // Still inconsistent after one retry: never expose the racy snapshot as the
        // current workspace, even transiently. Callers must reload explicitly.
        setWorkspace(null);
        setStatus("version_conflict");
        return false;
      } catch (err) {
        if (controller.signal.aborted) return false;
        if (generation !== generationRef.current) return false;
        if (err instanceof ProfileApiError) {
          if (err.code === "cancelled") return false;
          if (
            err.code === "authentication_required" ||
            err.code === "forbidden"
          ) {
            setStatus("session");
            setError(err.message);
            return false;
          }
        }
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Unexpected profile error.",
        );
        return false;
      }
    },
    [repository],
  );

  const reload = useCallback(async () => {
    await load("initial");
  }, [load]);

  useEffect(() => {
    if (session.status === "authenticated") {
      void load("initial");
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
    setSaveRefreshFailed(false);
    return undefined;
  }, [session.status, load]);

  const runMutation = useCallback(
    <T,>(fn: (csrfToken: string) => Promise<T>): Promise<T> => {
      const chained = mutationQueueRef.current.then(async () => {
        // Mutation guard: re-checked here (not just in the UI) using refs so it
        // reflects the state at the moment this queued mutation actually runs, not
        // the state captured when the caller invoked it. The queue already
        // serializes mutations, but a prior queued mutation's post-mutation resync
        // can leave the workspace not-`ready` (version conflict, transport error,
        // session loss) by the time this one is due to run, and that must still be
        // rejected rather than sent with a stale/absent etag.
        if (
          statusRef.current !== "ready" ||
          !workspaceRef.current ||
          !isWorkspaceConsistent(workspaceRef.current) ||
          saveRefreshFailedRef.current
        ) {
          const notReady = new ProfileApiError(
            "workspace_not_ready",
            "The profile workspace is not ready for changes. Reload and try again.",
            409,
          );
          setLastMutationError(notReady);
          throw notReady;
        }
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
          // The backend already accepted this mutation: a failure to resync the
          // workspace from here on must never be reported as if the mutation itself
          // failed. `saveRefreshFailed` records the discrepancy instead so the save
          // is not misreported, while further mutations are rejected by the guard
          // above (via `saveRefreshFailedRef`, and generally also via `statusRef`
          // once `load` moves status away from `ready`) until an explicit reload.
          const refreshed = await load("resync");
          setSaveRefreshFailed(!refreshed);
          try {
            await refreshSession();
          } catch {
            // Session refresh (display name/locale/completeness mirrored on the
            // session) is best-effort and independent of the profile save result;
            // its failure must not be reported as a profile mutation failure either.
          }
          return result;
        } catch (err) {
          if (
            err instanceof ProfileApiError &&
            RESYNC_ON_ERROR_CODES.has(err.code)
          ) {
            // Do not auto-retry the mutation: re-sync the workspace so the caller's
            // next attempt (or explicit reload) has a current version/etag, while
            // the caller's own draft state is left untouched here.
            await load("resync");
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
      saveRefreshFailed,
      adultPolicy,
      reload,
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
      saveRefreshFailed,
      adultPolicy,
      reload,
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
