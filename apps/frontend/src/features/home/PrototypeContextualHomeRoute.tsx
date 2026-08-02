import { useEffect, useMemo, useState } from "react";
import {
  createMockContextualHomeAdapter,
  isMockContextualHomeAdapter,
  MOCK_HOME_SCENARIO_IDS,
  type MockContextualHomeAdapter,
  type MockHomeScenarioId,
} from "@/adapters/mock/contextual-home/mockContextualHomeAdapter";
import { useRuntime } from "@/app/runtime/RuntimeProvider";
import { ContextualHomePage } from "./ContextualHomePage";
import { ContextualHomeProvider } from "./ContextualHomeProvider";

/**
 * Prototype-only home route that wires mock scenarios.
 * Must not be imported from ProductionApp.
 */
export function PrototypeContextualHomeRoute() {
  const runtime = useRuntime();
  const adapter = useMemo((): MockContextualHomeAdapter => {
    if (isMockContextualHomeAdapter(runtime.contextualHomeAdapter)) {
      return runtime.contextualHomeAdapter;
    }
    return createMockContextualHomeAdapter({ scenario: "default" });
  }, [runtime.contextualHomeAdapter]);

  const [scenarioId, setScenarioId] = useState<MockHomeScenarioId>(() =>
    adapter.getScenario(),
  );

  useEffect(() => {
    adapter.setScenario(scenarioId);
  }, [adapter, scenarioId]);

  return (
    <ContextualHomeProvider
      adapter={adapter}
      scenarioId={scenarioId}
      setScenarioId={(id) => setScenarioId(id as MockHomeScenarioId)}
    >
      <ContextualHomePage scenarioOptions={MOCK_HOME_SCENARIO_IDS} />
    </ContextualHomeProvider>
  );
}
