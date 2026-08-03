import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileDataPage } from "./ProfileDataPage";
import type {
  ProfileMutationContext,
  ProfilePatch,
  ProfileSnapshot,
} from "@/contracts/profile";
import {
  createConfirmedProfileSnapshot,
  createMockProfileRepo,
  renderProfileTree,
} from "./testUtils";

function mockPatchProfile() {
  return jest.fn<
    Promise<ProfileSnapshot>,
    [ProfilePatch, ProfileMutationContext]
  >(async () => createConfirmedProfileSnapshot());
}

describe("ProfileDataPage", () => {
  it("does not send a default-presence field as confirmed when the user saves other unrelated edits", async () => {
    const patchProfile = mockPatchProfile();
    const repo = createMockProfileRepo({ patchProfile });
    const user = userEvent.setup();

    render(
      renderProfileTree({ repository: repo, children: <ProfileDataPage /> }),
    );
    expect(await screen.findByTestId("profile-data")).toBeInTheDocument();

    // defaultChildCount is presence "default" in the fixture; leave it untouched.
    const displayNameInput = screen.getByTestId(
      "profile-data-input-displayName",
    );
    await user.clear(displayNameInput);
    await user.type(displayNameInput, "Bea");

    await user.click(screen.getByTestId("profile-data-household-save"));

    await waitFor(() => expect(patchProfile).toHaveBeenCalledTimes(1));
    const [patch] = patchProfile.mock.calls[0];
    expect(patch.displayName).toEqual({ action: "confirm", value: "Bea" });
    expect(patch.defaultChildCount).toBeUndefined();
  });

  it("sends an explicit confirm mutation with the default value when the user clicks 'use this default'", async () => {
    const patchProfile = mockPatchProfile();
    const repo = createMockProfileRepo({ patchProfile });
    const user = userEvent.setup();

    render(
      renderProfileTree({ repository: repo, children: <ProfileDataPage /> }),
    );
    expect(await screen.findByTestId("profile-data")).toBeInTheDocument();

    expect(
      screen.getByTestId("profile-data-status-defaultChildCount"),
    ).toHaveTextContent("Suggested default");

    await user.click(
      screen.getByTestId("profile-data-use-default-defaultChildCount"),
    );
    expect(
      screen.getByTestId("profile-data-status-defaultChildCount"),
    ).toHaveTextContent("Will be confirmed on save");

    await user.click(screen.getByTestId("profile-data-household-save"));

    await waitFor(() => expect(patchProfile).toHaveBeenCalledTimes(1));
    const [patch] = patchProfile.mock.calls[0];
    expect(patch.defaultChildCount).toEqual({ action: "confirm", value: 0 });
    expect(patch.displayName).toBeUndefined();
  });

  it("PATCHes only the cooking section fields when saving the cooking form", async () => {
    const patchProfile = mockPatchProfile();
    const repo = createMockProfileRepo({ patchProfile });
    const user = userEvent.setup();

    render(
      renderProfileTree({ repository: repo, children: <ProfileDataPage /> }),
    );
    expect(await screen.findByTestId("profile-data")).toBeInTheDocument();

    const prepInput = screen.getByTestId(
      "profile-data-input-ordinaryPrepMinutes",
    );
    await user.clear(prepInput);
    await user.type(prepInput, "45");

    await user.click(screen.getByTestId("profile-data-cooking-save"));

    await waitFor(() => expect(patchProfile).toHaveBeenCalledTimes(1));
    const [patch] = patchProfile.mock.calls[0];
    expect(patch.ordinaryPrepMinutes).toEqual({ action: "confirm", value: 45 });
    expect(patch.displayName).toBeUndefined();
    expect(patch.language).toBeUndefined();
  });

  it("cancel restores the household section to the last-loaded snapshot without submitting", async () => {
    const patchProfile = mockPatchProfile();
    const repo = createMockProfileRepo({ patchProfile });
    const user = userEvent.setup();

    render(
      renderProfileTree({ repository: repo, children: <ProfileDataPage /> }),
    );
    const displayNameInput = await screen.findByTestId(
      "profile-data-input-displayName",
    );
    await user.clear(displayNameInput);
    await user.type(displayNameInput, "Temporary");

    await user.click(screen.getByTestId("profile-data-household-cancel"));

    expect(screen.getByTestId("profile-data-input-displayName")).toHaveValue(
      "Ada",
    );
    expect(patchProfile).not.toHaveBeenCalled();
  });
});
