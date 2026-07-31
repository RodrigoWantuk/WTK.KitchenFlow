import type { ReactElement } from "react";

export interface FeatureUnavailableProps {
  /** Stable test id suffix. */
  feature: string;
  title?: string;
  detail?: string;
}

/**
 * Controlled unavailable state when a live adapter is not wired.
 * Must be used instead of silent mock fallbacks in production.
 */
export function FeatureUnavailable({
  feature,
  title = "Feature unavailable",
  detail = "Integration pending",
}: FeatureUnavailableProps): ReactElement {
  return (
    <div
      data-testid={`feature-unavailable-${feature}`}
      role="status"
      className="rounded-2xl border border-border bg-secondary/40 p-6 text-center"
    >
      <p className="font-display text-xl">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
