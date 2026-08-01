#!/usr/bin/env node
/**
 * Inspect the production build output for prototype leakage.
 * Run after `yarn build` or `yarn build:production`.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const buildJs = path.join(root, "build", "static", "js");
const reportPath = path.join(root, "build", "production-bundle-report.json");

const FORBIDDEN = [
  "scenario-open",
  "marina@cocinaris.dev",
  "demo-only",
  "filledPantry",
  "SEED_PANTRY",
  "SEED_PLAN",
  "SEED_SHOPPING",
  "MOCK_PREPARATION_ROUTE_TASKS",
  "MOCK_SHOPPING_REQUIREMENTS",
  "cocinaris_state_v1",
  "sharedMockPreparationRouteRepository",
];

if (!fs.existsSync(buildJs)) {
  console.error(
    "inspect:production-bundle: missing build/static/js. Run yarn build or yarn build:production first.",
  );
  process.exit(1);
}

const jsFiles = fs
  .readdirSync(buildJs)
  .filter((f) => f.endsWith(".js") && !f.endsWith(".map.js"))
  .map((f) => path.join(buildJs, f));

if (jsFiles.length === 0) {
  console.error(
    "inspect:production-bundle: no JS assets found under build/static/js",
  );
  process.exit(1);
}

const hits = [];
const sizes = [];

for (const file of jsFiles) {
  const buf = fs.readFileSync(file);
  const text = buf.toString("utf8");
  sizes.push({
    file: path.relative(root, file),
    bytes: buf.length,
    gzipEstimateNote:
      "raw uncompressed size; gzip reported separately by CRA build log",
  });
  for (const token of FORBIDDEN) {
    if (text.includes(token)) {
      hits.push({ file: path.relative(root, file), token });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: "production-bundle-inspect",
  files: sizes,
  forbiddenHits: hits,
  forbiddenTokens: FORBIDDEN,
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

if (hits.length) {
  console.error("Production bundle isolation failed:");
  for (const h of hits) {
    console.error(` - ${h.token} in ${h.file}`);
  }
  console.error(`Report: ${path.relative(root, reportPath)}`);
  process.exit(1);
}

console.log("Production bundle isolation passed.");
for (const s of sizes) {
  console.log(` - ${s.file}: ${s.bytes} bytes`);
}
console.log(`Report: ${path.relative(root, reportPath)}`);
