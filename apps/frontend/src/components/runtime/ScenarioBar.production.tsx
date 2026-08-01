import type { ReactElement } from "react";

/**
 * Production stub: scenario tooling must not render in production mode.
 * Webpack replaces the prototype ScenarioBar module with this file when
 * `REACT_APP_FRONTEND_MODE=production`.
 */
export default function ScenarioBar(): ReactElement | null {
  return null;
}
