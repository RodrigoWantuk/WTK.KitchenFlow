import type {
  EquipmentInput,
  EquipmentSnapshot,
  PreferenceCommand,
  PreferenceSnapshot,
  ProfileCompleteness,
  ProfileMutationContext,
  ProfilePatch,
  ProfileSnapshot,
} from "./types";

/**
 * Application-owned boundary over the profile, preferences, equipment, and
 * completeness backend endpoints. Implementations must never expose generated
 * OpenAPI DTOs and must translate every failure into a {@link ProfileApiError}.
 */
export interface ProfileRepository {
  /** `GET /api/v1/profile`. Returns an absent-profile scaffold when `profileExists` is false. */
  getProfile(signal?: AbortSignal): Promise<ProfileSnapshot>;

  /**
   * `PATCH /api/v1/profile`. Partial update: omitted fields are left untouched.
   * This is the mutation UI code must call for normal profile editing.
   */
  patchProfile(
    patch: ProfilePatch,
    context: ProfileMutationContext,
  ): Promise<ProfileSnapshot>;

  /**
   * `PUT /api/v1/profile`. Full replace: omitted fields become `absent` and
   * omitted ordered lists are cleared.
   *
   * @remarks Full-replace semantics silently clear any durable field or ordered
   * list the caller does not explicitly resend. UI code must not call this method
   * for normal editing; it exists for repository-level and contract tests only.
   * Use {@link ProfileRepository.patchProfile} instead.
   */
  replaceProfile(
    patch: ProfilePatch,
    context: ProfileMutationContext,
  ): Promise<ProfileSnapshot>;

  /** `GET /api/v1/profile/preferences`. Returns only `confirmed` entries. */
  getPreferences(signal?: AbortSignal): Promise<PreferenceSnapshot>;

  /**
   * `PUT /api/v1/profile/preferences`. Explicit add/remove/update commands only;
   * never a silent full-list replace.
   */
  mutatePreferences(
    commands: PreferenceCommand[],
    context: ProfileMutationContext,
  ): Promise<PreferenceSnapshot>;

  /** `GET /api/v1/profile/equipment`. Returns active equipment entries in canonical order. */
  getEquipment(signal?: AbortSignal): Promise<EquipmentSnapshot>;

  /** `PUT /api/v1/profile/equipment`. Full replace; array order is canonical. */
  replaceEquipment(
    entries: EquipmentInput[],
    context: ProfileMutationContext,
  ): Promise<EquipmentSnapshot>;

  /** `GET /api/v1/profile/completeness`. Never blocks inventory or home use. */
  getCompleteness(signal?: AbortSignal): Promise<ProfileCompleteness>;
}
