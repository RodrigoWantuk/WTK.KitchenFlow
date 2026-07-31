#!/usr/bin/env node
/**
 * Static production-isolation guard beyond Emergent package-name greps.
 * Fails when production composition root sources reintroduce mock defaults.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const failures = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assertNotIncludes(rel, patterns, label) {
  const source = read(rel);
  for (const pattern of patterns) {
    if (source.includes(pattern)) {
      failures.push(`${label}: ${rel} must not contain "${pattern}"`);
    }
  }
}

assertNotIncludes(
  "src/app/runtime/createProductionRuntime.ts",
  [
    "adapters/mock",
    "sharedMockPreparationRouteRepository",
    "SEED_PANTRY",
    "SEED_PLAN",
    "createMockSessionAdapter",
    "cocinaris_state_v1",
  ],
  "production composition root",
);

assertNotIncludes(
  "src/features/preparation-route/PreparationRouteProvider.tsx",
  ["sharedMockPreparationRouteRepository", "repository = "],
  "preparation provider",
);

const provider = read("src/features/preparation-route/PreparationRouteProvider.tsx");
if (!provider.includes("repository: PreparationRouteRepository")) {
  failures.push("PreparationRouteProvider must require an injected repository");
}

const appShell = read("src/components/AppShell.tsx");
if (!appShell.includes("enableScenarioBar")) {
  failures.push("AppShell must gate ScenarioBar on runtime.enableScenarioBar");
}

if (failures.length) {
  console.error("Production isolation guard failed:\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}

console.log("Production isolation guard passed.");
