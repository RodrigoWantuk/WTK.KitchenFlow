import { useMemo, useState } from "react";
import {
  createMockContextualHomeAdapter,
  MOCK_HOME_SCENARIO_IDS,
  type MockHomeScenarioId,
} from "@/adapters/mock/contextual-home/mockContextualHomeAdapter";
import { ContextualHomePage } from "./ContextualHomePage";
import { ContextualHomeProvider } from "./ContextualHomeProvider";

/**
 * Prototype-only home route that wires mock scenarios.
 * Must not be imported from ProductionApp.
 *
 * Scenario switching recreates an immutable adapter synchronously before
 * updating React state so correctness does not depend on effect ordering.
 */
export function PrototypeContextualHomeRoute() {
  const [scenarioId, setScenarioId] = useState<MockHomeScenarioId>("default");
  const adapter = useMemo(
    () => createMockContextualHomeAdapter({ scenario: scenarioId }),
    [scenarioId],
  );

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
