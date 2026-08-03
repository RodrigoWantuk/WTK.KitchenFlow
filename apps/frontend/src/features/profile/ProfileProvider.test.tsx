import { render, screen, waitFor } from "@testing-library/react";
import { useProfileWorkspace } from "./ProfileProvider";
import {
  ProfileApiError,
  type ProfileMutationContext,
  type ProfilePatch,
  type ProfileSnapshot,
} from "@/contracts/profile";
import {
  createConfirmedProfileSnapshot,
  createEmptyEquipmentSnapshot,
  createEmptyPreferenceSnapshot,
  createCompleteness,
  createMockProfileRepo,
  createSessionAdapter,
  renderProfileTree,
} from "./testUtils";

function StatusProbe() {
  const { status, workspace, isMutating, lastMutationError } =
    useProfileWorkspace();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="profile-version">
        {workspace?.profile.version ?? ""}
      </span>
      <span data-testid="is-mutating">{String(isMutating)}</span>
      <span data-testid="last-error-code">{lastMutationError?.code ?? ""}</span>
    </div>
  );
}

describe("ProfileProvider workspace coordination", () => {
  it("loads profile, preferences, equipment, and completeness in parallel and reports ready", async () => {
    const repo = createMockProfileRepo();
    render(renderProfileTree({ repository: repo, children: <StatusProbe /> }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );
    expect(repo.getProfile).toHaveBeenCalledTimes(1);
    expect(repo.getPreferences).toHaveBeenCalledTimes(1);
    expect(repo.getEquipment).toHaveBeenCalledTimes(1);
    expect(repo.getCompleteness).toHaveBeenCalledTimes(1);
  });

  it("retries once on a version mismatch across collections and reports ready once consistent", async () => {
    const getPreferences = jest
      .fn()
      .mockResolvedValueOnce(
        createEmptyPreferenceSnapshot({ version: "stale", etag: '"stale"' }),
      )
      .mockResolvedValue(createEmptyPreferenceSnapshot());
    const repo = createMockProfileRepo({ getPreferences });

    render(renderProfileTree({ repository: repo, children: <StatusProbe /> }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );
    expect(getPreferences).toHaveBeenCalledTimes(2);
  });

  it("reports version_conflict and blocks reads from stale data when still inconsistent after one retry", async () => {
    const getPreferences = jest
      .fn()
      .mockResolvedValue(
        createEmptyPreferenceSnapshot({ version: "stale", etag: '"stale"' }),
      );
    const repo = createMockProfileRepo({ getPreferences });

    render(renderProfileTree({ repository: repo, children: <StatusProbe /> }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent(
        "version_conflict",
      ),
    );
    // Exactly one retry: two attempts total, not unbounded retrying.
    expect(getPreferences).toHaveBeenCalledTimes(2);
  });

  it("treats an absent profile (all null versions) as consistent without retrying", async () => {
    const repo = createMockProfileRepo({
      getProfile: jest.fn(async () => ({
        ...createConfirmedProfileSnapshot(),
        profileExists: false,
        version: null,
        etag: null,
      })),
      getPreferences: jest.fn(async () =>
        createEmptyPreferenceSnapshot({ version: null, etag: null }),
      ),
      getEquipment: jest.fn(async () =>
        createEmptyEquipmentSnapshot({ version: null, etag: null }),
      ),
      getCompleteness: jest.fn(async () =>
        createCompleteness({ profileExists: false, percentComplete: 0 }),
      ),
    });

    render(renderProfileTree({ repository: repo, children: <StatusProbe /> }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );
    expect(repo.getPreferences).toHaveBeenCalledTimes(1);
  });

  it("sends the session CSRF token and current etag on patchProfile, then reloads and refreshes the session", async () => {
    const patchProfile = jest.fn<
      Promise<ProfileSnapshot>,
      [ProfilePatch, ProfileMutationContext]
    >(async () => createConfirmedProfileSnapshot());
    const repo = createMockProfileRepo({ patchProfile });
    const sessionAdapter = createSessionAdapter();

    function Trigger() {
      const { patchProfile: patch, status } = useProfileWorkspace();
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button
            type="button"
            data-testid="save"
            onClick={() =>
              void patch({ displayName: { action: "confirm", value: "Bea" } })
            }
          >
            save
          </button>
        </div>
      );
    }

    render(
      renderProfileTree({
        repository: repo,
        sessionAdapter,
        children: <Trigger />,
      }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );

    const initialSessionCalls = (sessionAdapter.getSession as jest.Mock).mock
      .calls.length;
    screen.getByTestId("save").click();

    await waitFor(() => expect(patchProfile).toHaveBeenCalledTimes(1));
    expect(patchProfile.mock.calls[0][1]).toMatchObject({
      csrfToken: "csrf-test",
      etag: '"v1"',
    });
    await waitFor(() =>
      expect(
        (sessionAdapter.getSession as jest.Mock).mock.calls.length,
      ).toBeGreaterThan(initialSessionCalls),
    );
    // Reload after a successful mutation re-fetches all four resources again.
    expect(repo.getProfile).toHaveBeenCalledTimes(2);
  });

  it("serializes concurrent mutations so only one is in flight at a time", async () => {
    let active = 0;
    let maxActive = 0;
    const patchProfile = jest.fn<
      Promise<ProfileSnapshot>,
      [ProfilePatch, ProfileMutationContext]
    >(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active -= 1;
      return createConfirmedProfileSnapshot();
    });
    const repo = createMockProfileRepo({ patchProfile });

    function Trigger() {
      const { patchProfile: patch, status } = useProfileWorkspace();
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button
            type="button"
            data-testid="save-a"
            onClick={() =>
              void patch({ displayName: { action: "confirm", value: "A" } })
            }
          >
            a
          </button>
          <button
            type="button"
            data-testid="save-b"
            onClick={() =>
              void patch({ displayName: { action: "confirm", value: "B" } })
            }
          >
            b
          </button>
        </div>
      );
    }

    render(renderProfileTree({ repository: repo, children: <Trigger /> }));
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );

    screen.getByTestId("save-a").click();
    screen.getByTestId("save-b").click();

    await waitFor(() => expect(patchProfile).toHaveBeenCalledTimes(2));
    expect(maxActive).toBe(1);
  });

  it("on precondition_failed (412), re-syncs the workspace and exposes the error code without retrying the mutation", async () => {
    const patchProfile = jest.fn<
      Promise<ProfileSnapshot>,
      [ProfilePatch, ProfileMutationContext]
    >(async () => {
      throw new ProfileApiError("precondition_failed", "stale version", 412);
    });
    const repo = createMockProfileRepo({ patchProfile });

    function Trigger() {
      const {
        patchProfile: patch,
        status,
        lastMutationError,
      } = useProfileWorkspace();
      return (
        <div>
          <span data-testid="status">{status}</span>
          <span data-testid="last-error-code">
            {lastMutationError?.code ?? ""}
          </span>
          <button
            type="button"
            data-testid="save"
            onClick={() => {
              patch({
                displayName: { action: "confirm", value: "Bea" },
              }).catch(() => {
                // Surfaced via lastMutationError; the caller's draft is untouched here.
              });
            }}
          >
            save
          </button>
        </div>
      );
    }

    render(renderProfileTree({ repository: repo, children: <Trigger /> }));
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );

    screen.getByTestId("save").click();

    await waitFor(() => expect(patchProfile).toHaveBeenCalledTimes(1));
    // Exactly one attempt: 412 must never be auto-retried.
    expect(patchProfile).toHaveBeenCalledTimes(1);
    // Re-sync reload after the failed mutation.
    await waitFor(() => expect(repo.getProfile).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByTestId("last-error-code")).toHaveTextContent(
        "precondition_failed",
      ),
    );
  });
});
