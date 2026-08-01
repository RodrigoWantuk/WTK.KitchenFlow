import type { FrontendRuntime } from "./types";

/**
 * Production stub replacing the prototype composition root at build time.
 * Accidental calls fail loudly instead of silently wiring mocks.
 */
export function createPrototypeRuntime(): FrontendRuntime {
  throw new Error(
    "createPrototypeRuntime is not available in production builds. Use createProductionRuntime.",
  );
}
