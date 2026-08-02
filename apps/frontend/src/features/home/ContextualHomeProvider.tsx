import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ContextualHomeAdapter,
  HomeTelemetry,
} from "@/contracts/contextualHome";
import { createNoOpHomeTelemetry } from "./homeTelemetry";

interface ContextualHomeContextValue {
  adapter: ContextualHomeAdapter;
  telemetry: HomeTelemetry;
  /** Prototype/test scenario id when the mock adapter exposes one. */
  scenarioId: string | null;
  setScenarioId: ((id: string) => void) | null;
}

const ContextualHomeContext = createContext<ContextualHomeContextValue | null>(
  null,
);

/**
 * Injects the contextual-home adapter. Production must pass the unavailable
 * adapter — never a mock.
 */
export function ContextualHomeProvider({
  adapter,
  telemetry = createNoOpHomeTelemetry(),
  scenarioId = null,
  setScenarioId = null,
  children,
}: {
  adapter: ContextualHomeAdapter;
  telemetry?: HomeTelemetry;
  scenarioId?: string | null;
  setScenarioId?: ((id: string) => void) | null;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ adapter, telemetry, scenarioId, setScenarioId }),
    [adapter, telemetry, scenarioId, setScenarioId],
  );
  return createElement(ContextualHomeContext.Provider, { value }, children);
}

export function useContextualHome(): ContextualHomeContextValue {
  const ctx = useContext(ContextualHomeContext);
  if (!ctx) {
    throw new Error("useContextualHome requires ContextualHomeProvider");
  }
  return ctx;
}

/**
 * Prototype helper that keeps mock scenario state outside production paths.
 */
export function useMockHomeScenarioState(initial = "default"): {
  scenarioId: string;
  setScenarioId: (id: string) => void;
} {
  const [scenarioId, setScenarioId] = useState(initial);
  const set = useCallback((id: string) => setScenarioId(id), []);
  return { scenarioId, setScenarioId: set };
}
