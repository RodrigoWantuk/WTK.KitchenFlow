import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfilePreferencesPage } from "./ProfilePreferencesPage";
import type {
  PreferenceCommand,
  PreferenceSnapshot,
  ProfileMutationContext,
} from "@/contracts/profile";
import {
  createEmptyPreferenceSnapshot,
  createMockProfileRepo,
  renderProfileTree,
} from "./testUtils";

function mockMutatePreferences() {
  return jest.fn<
    Promise<PreferenceSnapshot>,
    [PreferenceCommand[], ProfileMutationContext]
  >(async () => createEmptyPreferenceSnapshot());
}

describe("ProfilePreferencesPage", () => {
  it("adds a non-sensitive catalog preference immediately, without a confirmation step", async () => {
    const mutatePreferences = jest.fn<
      Promise<PreferenceSnapshot>,
      [PreferenceCommand[], ProfileMutationContext]
    >(async () =>
      createEmptyPreferenceSnapshot({
        entries: [
          {
            entryId: "e1",
            category: "Preference",
            stableCode: "spicy_food",
            note: null,
            presence: "confirmed",
            sortOrder: 0,
          },
        ],
      }),
    );
    const repo = createMockProfileRepo({ mutatePreferences });
    const user = userEvent.setup();

    render(
      renderProfileTree({
        repository: repo,
        children: <ProfilePreferencesPage />,
      }),
    );
    expect(
      await screen.findByTestId("profile-preferences"),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByTestId("profile-preferences-catalog-select"),
      "spicy_food",
    );
    await user.click(screen.getByTestId("profile-preferences-catalog-submit"));

    await waitFor(() => expect(mutatePreferences).toHaveBeenCalledTimes(1));
    expect(mutatePreferences.mock.calls[0][0]).toEqual([
      {
        action: "add",
        category: "Preference",
        stableCode: "spicy_food",
        note: null,
      },
    ]);
    expect(
      screen.queryByTestId("profile-preferences-sensitive-confirm"),
    ).not.toBeInTheDocument();
  });

  it("requires explicit sensitive confirmation before adding an Allergy entry, and does not mutate until confirmed", async () => {
    const mutatePreferences = mockMutatePreferences();
    const repo = createMockProfileRepo({ mutatePreferences });
    const user = userEvent.setup();

    render(
      renderProfileTree({
        repository: repo,
        children: <ProfilePreferencesPage />,
      }),
    );
    expect(
      await screen.findByTestId("profile-preferences"),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("profile-preferences-tab-Allergy"));
    await user.selectOptions(
      screen.getByTestId("profile-preferences-catalog-select"),
      "peanut_allergy",
    );
    await user.click(screen.getByTestId("profile-preferences-catalog-submit"));

    const confirmDialog = await screen.findByTestId(
      "profile-preferences-sensitive-confirm",
    );
    expect(confirmDialog).toHaveTextContent(/not.*medical advice/i);
    // No mutation is sent while the confirmation is pending.
    expect(mutatePreferences).not.toHaveBeenCalled();

    await user.click(
      within(confirmDialog).getByTestId(
        "profile-preferences-sensitive-confirm-add",
      ),
    );

    await waitFor(() => expect(mutatePreferences).toHaveBeenCalledTimes(1));
    expect(mutatePreferences.mock.calls[0][0]).toEqual([
      {
        action: "add",
        category: "Allergy",
        stableCode: "peanut_allergy",
        note: null,
      },
    ]);
    expect(
      screen.queryByTestId("profile-preferences-sensitive-confirm"),
    ).not.toBeInTheDocument();
  });

  it("cancelling the sensitive confirmation discards the pending add without mutating", async () => {
    const mutatePreferences = mockMutatePreferences();
    const repo = createMockProfileRepo({ mutatePreferences });
    const user = userEvent.setup();

    render(
      renderProfileTree({
        repository: repo,
        children: <ProfilePreferencesPage />,
      }),
    );
    expect(
      await screen.findByTestId("profile-preferences"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByTestId("profile-preferences-tab-MedicalRestriction"),
    );
    await user.selectOptions(
      screen.getByTestId("profile-preferences-catalog-select"),
      "low_sodium_diet",
    );
    await user.click(screen.getByTestId("profile-preferences-catalog-submit"));

    await screen.findByTestId("profile-preferences-sensitive-confirm");
    await user.click(
      screen.getByTestId("profile-preferences-sensitive-cancel"),
    );

    expect(
      screen.queryByTestId("profile-preferences-sensitive-confirm"),
    ).not.toBeInTheDocument();
    expect(mutatePreferences).not.toHaveBeenCalled();
  });

  it("mints an opaque custom stable code and stores the typed label as the note", async () => {
    const mutatePreferences = mockMutatePreferences();
    const repo = createMockProfileRepo({ mutatePreferences });
    const user = userEvent.setup();

    render(
      renderProfileTree({
        repository: repo,
        children: <ProfilePreferencesPage />,
      }),
    );
    expect(
      await screen.findByTestId("profile-preferences"),
    ).toBeInTheDocument();

    await user.type(
      screen.getByTestId("profile-preferences-custom-label"),
      "Grandma's stew",
    );
    await user.click(screen.getByTestId("profile-preferences-custom-submit"));

    await waitFor(() => expect(mutatePreferences).toHaveBeenCalledTimes(1));
    const [commands] = mutatePreferences.mock.calls[0];
    const [command] = commands;
    expect(command.action).toBe("add");
    expect(command.note).toBe("Grandma's stew");
    expect(command.stableCode).not.toContain("Grandma");
    expect(command.stableCode).toMatch(/^custom_/);
  });
});
