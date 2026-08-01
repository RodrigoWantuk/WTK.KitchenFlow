#!/usr/bin/env node
/**
 * PLAN-0005 P1: axe-core accessibility automation on production surfaces that exist today.
 * Authenticated inventory routes remain Blocked (FeatureUnavailable / issue #20).
 */
const { chromium } = require("../../apps/frontend/node_modules/playwright");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { execSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const evidenceDir = process.env.PLAN0005_EVIDENCE_DIR
  ? path.resolve(process.env.PLAN0005_EVIDENCE_DIR)
  : path.join(root, "docs/evidence/plan-0005");
const productionDir = path.join(root, "apps/frontend/build-production");
const port = Number(process.env.PLAN0005_AXE_PORT || 4181);

function ensureAxeSource() {
  const candidate = path.join(root, "apps/frontend/node_modules/axe-core/axe.min.js");
  if (fs.existsSync(candidate)) return candidate;
  execSync("yarn add -D axe-core@4.10.3", { cwd: path.join(root, "apps/frontend"), stdio: "inherit" });
  if (!fs.existsSync(candidate)) throw new Error("axe-core install failed");
  return candidate;
}

function startStaticServer(dir, listenPort) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    let filePath = path.join(dir, urlPath === "/" ? "index.html" : urlPath);
    if (!filePath.startsWith(dir)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(dir, "index.html");
    }
    const ext = path.extname(filePath).toLowerCase();
    const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => server.listen(listenPort, "127.0.0.1", () => resolve(server)));
}

async function scan(page, axeSource, route) {
  await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: "networkidle" });
  await page.addScriptTag({ path: axeSource });
  const result = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const axeResult = await axe.run(document, { resultTypes: ["violations"] });
    return {
      violations: axeResult.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length
      }))
    };
  });
  const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  return {
    route,
    status: serious.length === 0 ? "Passed" : "Failed",
    seriousOrCritical: serious,
    allViolations: result.violations
  };
}

async function main() {
  if (!fs.existsSync(path.join(productionDir, "index.html"))) {
    throw new Error("Missing build-production. Run BUILD_PATH=build-production yarn build:production first.");
  }
  const axeSource = ensureAxeSource();
  fs.mkdirSync(evidenceDir, { recursive: true });
  const server = await startStaticServer(productionDir, port);
  const browser = await chromium.launch({
    headless: true,
    env: { ...process.env, HOME: process.env.PLAYWRIGHT_HOME || "/root", XAUTHORITY: "", DISPLAY: "" }
  });
  const page = await browser.newPage();
  const results = [];
  try {
    results.push(await scan(page, axeSource, "/"));
    results.push(await scan(page, axeSource, "/acesso"));
    results.push({
      route: "/app/* authenticated inventory",
      status: "Blocked",
      reason: "Production inventory/session adapters unavailable (issue #20); axe not claimed on FeatureUnavailable-only placeholders as inventory coverage",
      issue: 20
    });
  } finally {
    await browser.close();
    server.close();
  }

  const payload = {
    plan: "PLAN-0005",
    testId: "TEST-0005-108",
    integratedMainSha: process.env.PLAN0005_INTEGRATED_SHA || "b94abd9a83fe29d88b095e3e9a42f10d01c05414",
    generatedAtUtc: new Date().toISOString(),
    results,
    summary: {
      passed: results.filter((r) => r.status === "Passed").length,
      failed: results.filter((r) => r.status === "Failed").length,
      blocked: results.filter((r) => r.status === "Blocked").length
    }
  };
  fs.writeFileSync(path.join(evidenceDir, "axe-production-surfaces.json"), `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify(payload.summary, null, 2));
  if (payload.summary.failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
