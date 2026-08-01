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
 *
 * - Development / test may omit the var and default to `prototype` / `test`.
 * - Production builds (`NODE_ENV=production`) **must** set the mode explicitly;
 *   missing mode never silently becomes prototype.
 */
export function resolveFrontendMode(
  raw: string | undefined = process.env.REACT_APP_FRONTEND_MODE,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): FrontendMode {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (!trimmed) {
    if (nodeEnv === "test") return "test";
    if (nodeEnv === "development") return "prototype";
    throw new Error(
      'REACT_APP_FRONTEND_MODE is required when NODE_ENV is not "development" or "test". ' +
        "Refusing to default to prototype for production builds.",
    );
  }
  if (!ALLOWED.has(trimmed)) {
    throw new Error(
      `Invalid REACT_APP_FRONTEND_MODE="${raw}". Expected prototype|production|test.`,
    );
  }
  return trimmed as FrontendMode;
}

/** Validated mode for the current bundle. */
export const FRONTEND_MODE: FrontendMode = resolveFrontendMode();

/** True when ScenarioBar, fixtures, and mock session are allowed. */
export function isPrototypeMode(mode: FrontendMode = FRONTEND_MODE): boolean {
  return mode === "prototype" || mode === "test";
}
