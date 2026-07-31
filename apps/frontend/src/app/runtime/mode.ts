/**
 * Build-time frontend mode. CRA inlines `REACT_APP_*` at compile time;
 * do not treat this as a runtime browser toggle.
 */
export type FrontendMode = "prototype" | "production" | "test";

const ALLOWED: ReadonlySet<string> = new Set([
  "prototype",
  "production",
  "test",
]);

/**
 * Resolves and validates `REACT_APP_FRONTEND_MODE`.
 * Defaults to `prototype` for local UX continuity; production builds must set the env explicitly in CI.
 */
export function resolveFrontendMode(
  raw: string | undefined = process.env.REACT_APP_FRONTEND_MODE,
): FrontendMode {
  const value = (raw ?? "prototype").trim().toLowerCase();
  if (!ALLOWED.has(value)) {
    throw new Error(
      `Invalid REACT_APP_FRONTEND_MODE="${raw ?? ""}". Expected prototype|production|test.`,
    );
  }
  return value as FrontendMode;
}

/** Validated mode for the current bundle. */
export const FRONTEND_MODE: FrontendMode = resolveFrontendMode();

/** True when ScenarioBar, fixtures, and mock session are allowed. */
export function isPrototypeMode(mode: FrontendMode = FRONTEND_MODE): boolean {
  return mode === "prototype" || mode === "test";
}
