import type { ReactElement } from "react";

/**
 * Discrete indicator that the current build is a prototype composition root.
 */
export function PrototypeModeBanner(): ReactElement {
  return (
    <div
      data-testid="prototype-mode-banner"
      role="status"
      className="border-b border-border bg-warning/10 px-4 py-1.5 text-center text-[11px] text-foreground/70"
    >
      Prototype mode — synthetic data and scenario tooling are active. Not a
      production session.
    </div>
  );
}
