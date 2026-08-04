/**
 * Describes whether the adult declaration flow can be presented, and which terms and
 * privacy policy versions it would submit if accepted.
 *
 * `PLAN-0011` (public landing/legal copy) is excluded from this plan's scope, so
 * production composition currently has no accepted terms/privacy version source.
 * Callers must treat `available: false` as "do not offer adult declaration yet",
 * never as an error, and must never invent placeholder terms/privacy versions in
 * production code paths.
 */
export interface AdultDeclarationPolicy {
  /** True when a real terms/privacy version pair is available to submit. */
  available: boolean;
  /** Present only when `available` is true. */
  termsVersion?: string;
  /** Present only when `available` is true. */
  privacyVersion?: string;
}

/**
 * Production-safe default policy while no accepted legal-copy source is wired.
 * Never fabricates terms/privacy versions.
 */
export function createUnavailableAdultDeclarationPolicy(): AdultDeclarationPolicy {
  return { available: false };
}

/**
 * Test-only policy with synthetic terms/privacy versions. Must never be used from
 * production composition; production code must obtain real versions from an accepted
 * legal-copy source once PLAN-0011 is delivered.
 */
export function createSyntheticAdultDeclarationPolicy(
  overrides?: Partial<AdultDeclarationPolicy>,
): AdultDeclarationPolicy {
  return {
    available: true,
    termsVersion: "test-terms-v1",
    privacyVersion: "test-privacy-v1",
    ...overrides,
  };
}
