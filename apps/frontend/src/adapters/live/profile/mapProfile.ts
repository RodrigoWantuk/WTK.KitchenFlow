import type { components } from "@kitchenflow/api-client";
import {
  ProfileApiError,
  type AdultDeclarationSnapshot,
  type CookingContextSnapshot,
  type EquipmentEntry,
  type EquipmentInput,
  type EquipmentSnapshot,
  type HouseholdSnapshot,
  type PreferenceCategory,
  type PreferenceCommand,
  type PreferenceEntry,
  type PreferenceSnapshot,
  type ProfileCompleteness,
  type ProfileFieldDurability,
  type ProfileFieldMutation,
  type ProfileFieldPresence,
  type ProfilePatch,
  type ProgressiveProfileField,
  type ProfileSnapshot,
} from "@/contracts/profile";

type ProfileResponseDto = components["schemas"]["ProfileResponse"];
type HouseholdDto = components["schemas"]["HouseholdDto"];
type CookingContextDto = components["schemas"]["CookingContextDto"];
type AdultDeclarationDto = components["schemas"]["AdultDeclarationDto"];
type FieldDtoOfString = components["schemas"]["ProfileFieldDtoOfstring"];
type FieldDtoOfInt = components["schemas"]["ProfileFieldDtoOfint"];
type PreferencesCollectionResponseDto =
  components["schemas"]["PreferencesCollectionResponse"];
type PreferenceResponseDto = components["schemas"]["PreferenceResponse"];
type EquipmentCollectionResponseDto =
  components["schemas"]["EquipmentCollectionResponse"];
type EquipmentResponseDto = components["schemas"]["EquipmentResponse"];
type ProfileCompletenessResponseDto =
  components["schemas"]["ProfileCompletenessResponse"];
type ProfileMutationRequestDto =
  components["schemas"]["ProfileMutationRequest"];
type FieldMutationDtoOfString =
  components["schemas"]["FieldMutationDtoOfstring"];
type FieldMutationDtoOfInt = components["schemas"]["FieldMutationDtoOfint"];
type PreferencesRequestDto = components["schemas"]["PreferencesRequest"];
type EquipmentRequestDto = components["schemas"]["EquipmentRequest"];

const KNOWN_PRESENCE = new Set<ProfileFieldPresence>([
  "absent",
  "confirmed",
  "removed",
  "default",
]);

const KNOWN_DURABILITY = new Set<ProfileFieldDurability>([
  "durable",
  "temporary",
]);

const KNOWN_CATEGORIES = new Set<PreferenceCategory>([
  "Preference",
  "Dislike",
  "DietaryPattern",
  "Intolerance",
  "Allergy",
  "ReligiousRestriction",
  "EthicalRestriction",
  "MedicalRestriction",
]);

function malformed(detail: string): never {
  throw new ProfileApiError("malformed", detail, 502);
}

/**
 * Normalizes a presence value from the wire. The backend emits lowercase presence
 * strings (`absent`, `confirmed`, `removed`, `default`); this also tolerates
 * unexpected casing defensively but fails closed for anything else.
 */
function normalizePresence(raw: string): ProfileFieldPresence {
  const lowered = raw.toLowerCase() as ProfileFieldPresence;
  if (!KNOWN_PRESENCE.has(lowered)) {
    malformed(`Unknown profile field presence "${raw}".`);
  }
  return lowered;
}

/**
 * Normalizes a durability value from the wire. The backend currently emits the
 * literal string `durable`; both `Durable` and `durable` casings are tolerated,
 * but any other value fails closed rather than being silently coerced.
 */
function normalizeDurability(raw: string): ProfileFieldDurability {
  const lowered = raw.toLowerCase() as ProfileFieldDurability;
  if (!KNOWN_DURABILITY.has(lowered)) {
    malformed(`Unknown profile field durability "${raw}".`);
  }
  return lowered;
}

function normalizeCategory(raw: string): PreferenceCategory {
  if (!KNOWN_CATEGORIES.has(raw as PreferenceCategory)) {
    malformed(`Unknown preference category "${raw}".`);
  }
  return raw as PreferenceCategory;
}

/**
 * Coerces a `number | string | null` wire value to a finite number or `null`.
 * The generated schema types several decimal/int fields as `number | string`
 * because of upstream OpenAPI decimal handling; this normalizes both shapes.
 */
function coerceNumber(raw: number | string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(value)) {
    malformed(`Non-finite numeric projection value "${String(raw)}".`);
  }
  return value;
}

function mapField<T>(dto: {
  value: T | null;
  presence: string;
  defaultValue: T | null;
  durability: string;
}): ProgressiveProfileField<T> {
  return {
    value: dto.value ?? null,
    presence: normalizePresence(dto.presence),
    defaultValue: dto.defaultValue ?? null,
    durability: normalizeDurability(dto.durability),
  };
}

function mapIntField(dto: FieldDtoOfInt): ProgressiveProfileField<number> {
  return {
    value: coerceNumber(dto.value),
    presence: normalizePresence(dto.presence),
    defaultValue: coerceNumber(dto.defaultValue),
    durability: normalizeDurability(dto.durability),
  };
}

function mapStringField(
  dto: FieldDtoOfString,
): ProgressiveProfileField<string> {
  return mapField(dto);
}

function mapHousehold(dto: HouseholdDto): HouseholdSnapshot {
  return {
    defaultAdultCount: mapIntField(dto.defaultAdultCount),
    defaultChildCount: mapIntField(dto.defaultChildCount),
    defaultServingCount: mapIntField(dto.defaultServingCount),
    language: mapStringField(dto.language),
    region: mapStringField(dto.region),
    currency: mapStringField(dto.currency),
    measurementSystem: mapStringField(dto.measurementSystem),
    timeZone: mapStringField(dto.timeZone),
    planningCadence: mapStringField(dto.planningCadence),
    shoppingCadence: mapStringField(dto.shoppingCadence),
  };
}

function mapCookingContext(dto: CookingContextDto): CookingContextSnapshot {
  return {
    overallSkill: mapStringField(dto.overallSkill),
    confidence: mapStringField(dto.confidence),
    preferredInstructionDetail: mapStringField(dto.preferredInstructionDetail),
    ordinaryPrepMinutes: mapIntField(dto.ordinaryPrepMinutes),
    exceptionalPrepMinutes: mapIntField(dto.exceptionalPrepMinutes),
    effortTolerance: mapStringField(dto.effortTolerance),
    cleanupTolerance: mapStringField(dto.cleanupTolerance),
    repeatMealPreference: mapStringField(dto.repeatMealPreference),
    reheatingPreference: mapStringField(dto.reheatingPreference),
    leftoverPreference: mapStringField(dto.leftoverPreference),
    freezingPreference: mapStringField(dto.freezingPreference),
  };
}

function mapAdultDeclaration(
  dto: AdultDeclarationDto,
): AdultDeclarationSnapshot {
  return {
    adultDeclared: dto.adultDeclared ?? null,
    termsVersion: dto.termsVersion ?? null,
    privacyVersion: dto.privacyVersion ?? null,
    acceptedAt: dto.acceptedAt ?? null,
    state: dto.state,
  };
}

/**
 * Maps a full profile response. Fails closed (throws {@link ProfileApiError} with
 * code `malformed`) on any unrecognized presence or durability value rather than
 * silently guessing a safe default.
 */
export function mapProfileResponse(
  dto: ProfileResponseDto,
  etag: string | null,
): ProfileSnapshot {
  return {
    ownerUserId: dto.ownerUserId,
    displayName: mapStringField(dto.displayName),
    household: mapHousehold(dto.household),
    cookingContext: mapCookingContext(dto.cookingContext),
    adultDeclaration: mapAdultDeclaration(dto.adultDeclaration),
    knownTechniques: [...dto.knownTechniques],
    techniquesToLearn: [...dto.techniquesToLearn],
    goals: [...dto.goals],
    abandonmentReasons: [...dto.abandonmentReasons],
    profileExists: dto.profileExists,
    version: dto.version ?? null,
    etag: dto.profileExists ? (etag ?? dto.version ?? null) : null,
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
  };
}

function mapPreferenceEntry(dto: PreferenceResponseDto): PreferenceEntry {
  return {
    entryId: dto.entryId,
    category: normalizeCategory(dto.category),
    stableCode: dto.stableCode,
    note: dto.note ?? null,
    presence: normalizePresence(dto.presence),
    sortOrder: coerceNumber(dto.sortOrder) ?? 0,
  };
}

/** Maps a versioned preferences collection. `version`/`etag` are `null` when no profile exists yet. */
export function mapPreferencesCollection(
  dto: PreferencesCollectionResponseDto,
  etag: string | null,
): PreferenceSnapshot {
  const version = dto.version ?? null;
  return {
    version,
    etag: version === null ? null : (etag ?? version),
    entries: dto.entries.map(mapPreferenceEntry),
  };
}

function mapEquipmentEntry(dto: EquipmentResponseDto): EquipmentEntry {
  return {
    entryId: dto.entryId,
    stableCode: dto.stableCode,
    customName: dto.customName ?? null,
    capacity: coerceNumber(dto.capacity),
    capacityUnit: dto.capacityUnit ?? null,
    constraintNote: dto.constraintNote ?? null,
    isActive: dto.isActive,
    sortOrder: coerceNumber(dto.sortOrder) ?? 0,
  };
}

/** Maps a versioned equipment collection. `version`/`etag` are `null` when no profile exists yet. */
export function mapEquipmentCollection(
  dto: EquipmentCollectionResponseDto,
  etag: string | null,
): EquipmentSnapshot {
  const version = dto.version ?? null;
  return {
    version,
    etag: version === null ? null : (etag ?? version),
    entries: dto.entries.map(mapEquipmentEntry),
  };
}

/** Maps a progressive completeness summary. Section counts are backend-owned, opaque keys. */
export function mapCompleteness(
  dto: ProfileCompletenessResponseDto,
): ProfileCompleteness {
  const sectionCounts: Record<string, number> = {};
  for (const [key, value] of Object.entries(dto.sectionCounts)) {
    sectionCounts[key] = coerceNumber(value) ?? 0;
  }
  return {
    percentComplete: coerceNumber(dto.percentComplete) ?? 0,
    completedSections: coerceNumber(dto.completedSections) ?? 0,
    totalSections: coerceNumber(dto.totalSections) ?? 0,
    sectionCounts,
    adultDeclarationState: dto.adultDeclarationState,
    profileExists: dto.profileExists,
  };
}

/**
 * Converts one presentation field mutation to its wire shape. The generated request
 * type documents `durability` as accepting only `"durable"`, but the backend workflow
 * also recognizes `"temporary"` as a forward-compatible no-op (the field is left
 * untouched); the cast below is the single, contained place that bridges that gap.
 */
function toStringMutationDto(
  mutation: ProfileFieldMutation<string> | undefined,
): FieldMutationDtoOfString | null {
  if (!mutation) {
    return null;
  }
  return {
    action: mutation.action,
    value: mutation.value ?? null,
    durability: mutation.durability as FieldMutationDtoOfString["durability"],
  };
}

function toIntMutationDto(
  mutation: ProfileFieldMutation<number> | undefined,
): FieldMutationDtoOfInt | null {
  if (!mutation) {
    return null;
  }
  return {
    action: mutation.action,
    value: mutation.value ?? null,
    durability: mutation.durability as FieldMutationDtoOfInt["durability"],
  };
}

/**
 * Maps a presentation {@link ProfilePatch} to the wire `ProfileMutationRequest` body
 * shared by both `PATCH` (partial update) and `PUT` (full replace) profile endpoints.
 * An omitted patch field becomes `null` on the wire, which PATCH treats as "leave
 * untouched" and PUT treats as "reset to absent" — the same request shape carries
 * different semantics depending on which endpoint receives it.
 */
export function mapProfilePatchToRequest(
  patch: ProfilePatch,
): ProfileMutationRequestDto {
  return {
    displayName: toStringMutationDto(patch.displayName),
    defaultAdultCount: toIntMutationDto(patch.defaultAdultCount),
    defaultChildCount: toIntMutationDto(patch.defaultChildCount),
    defaultServingCount: toIntMutationDto(patch.defaultServingCount),
    language: toStringMutationDto(patch.language),
    region: toStringMutationDto(patch.region),
    currency: toStringMutationDto(patch.currency),
    measurementSystem: toStringMutationDto(patch.measurementSystem),
    timeZone: toStringMutationDto(patch.timeZone),
    planningCadence: toStringMutationDto(patch.planningCadence),
    shoppingCadence: toStringMutationDto(patch.shoppingCadence),
    overallSkill: toStringMutationDto(patch.overallSkill),
    confidence: toStringMutationDto(patch.confidence),
    preferredInstructionDetail: toStringMutationDto(
      patch.preferredInstructionDetail,
    ),
    ordinaryPrepMinutes: toIntMutationDto(patch.ordinaryPrepMinutes),
    exceptionalPrepMinutes: toIntMutationDto(patch.exceptionalPrepMinutes),
    effortTolerance: toStringMutationDto(patch.effortTolerance),
    cleanupTolerance: toStringMutationDto(patch.cleanupTolerance),
    repeatMealPreference: toStringMutationDto(patch.repeatMealPreference),
    reheatingPreference: toStringMutationDto(patch.reheatingPreference),
    leftoverPreference: toStringMutationDto(patch.leftoverPreference),
    freezingPreference: toStringMutationDto(patch.freezingPreference),
    adultDeclaration: patch.adultDeclaration
      ? {
          adultDeclared: patch.adultDeclaration.adultDeclared,
          termsVersion: patch.adultDeclaration.termsVersion,
          privacyVersion: patch.adultDeclaration.privacyVersion ?? null,
        }
      : null,
    knownTechniques: patch.knownTechniques ?? null,
    techniquesToLearn: patch.techniquesToLearn ?? null,
    goals: patch.goals ?? null,
    abandonmentReasons: patch.abandonmentReasons ?? null,
  };
}

/** Maps explicit preference/restriction commands to the `PreferencesRequest` wire body. */
export function mapPreferenceCommandsToRequest(
  commands: PreferenceCommand[],
): PreferencesRequestDto {
  return {
    entries: commands.map((command) => ({
      action: command.action,
      category: command.category,
      stableCode: command.stableCode,
      note: command.note ?? null,
    })),
  };
}

/** Maps equipment inputs to the `EquipmentRequest` wire body. Array order is canonical. */
export function mapEquipmentInputsToRequest(
  entries: EquipmentInput[],
): EquipmentRequestDto {
  return {
    entries: entries.map((entry) => ({
      stableCode: entry.stableCode,
      customName: entry.customName ?? null,
      capacity: entry.capacity ?? null,
      capacityUnit: entry.capacityUnit ?? null,
      constraintNote: entry.constraintNote ?? null,
    })),
  };
}
