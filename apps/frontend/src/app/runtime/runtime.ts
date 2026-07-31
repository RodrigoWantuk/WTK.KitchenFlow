import { FRONTEND_MODE, type FrontendMode } from "./mode";
import type { FrontendRuntime } from "./types";
import { createProductionRuntime } from "./createProductionRuntime";
import { createPrototypeRuntime } from "./createPrototypeRuntime";

/**
 * Selects the composition root for the current build-time mode.
 * Prototype fixtures remain only in {@link createPrototypeRuntime}.
 * Production builds must set `REACT_APP_FRONTEND_MODE=production` and use
 * {@link createProductionRuntime} (verified by isolation tests and guards).
 */
export function createRuntime(
  mode: FrontendMode = FRONTEND_MODE,
): FrontendRuntime {
  if (mode === "production") {
    return createProductionRuntime();
  }
  return createPrototypeRuntime();
}

/**
 * Test helper: build a prototype runtime with optional overrides.
 */
export function createTestRuntime(
  overrides: Partial<FrontendRuntime> = {},
): FrontendRuntime {
  return {
    ...createPrototypeRuntime(),
    mode: "test",
    ...overrides,
  };
}
