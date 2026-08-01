#!/usr/bin/env node
/**
 * PLAN-0005 P1: production i18n catalog completeness for en / pt-BR / es.
 * Detects missing keys across catalogs (TEST-0005-100..103 subset for production surfaces).
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const evidenceDir = process.env.PLAN0005_EVIDENCE_DIR ?? join(root, "docs/evidence/plan-0005");
const catalogPath = join(root, "apps/frontend/src/app/i18n/productionCatalog.ts");

const source = await readFile(catalogPath, "utf8");
const locales = ["pt-BR", "en", "es"];
const catalogs = {};

for (const locale of locales) {
  const blockMatch = source.match(new RegExp(`${locale === "pt-BR" ? '"pt-BR"' : locale}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`));
  if (!blockMatch) {
    throw new Error(`Could not parse catalog block for ${locale}`);
  }
  const keys = [...blockMatch[1].matchAll(/"([^"]+)":/g)].map((m) => m[1]);
  catalogs[locale] = new Set(keys);
}

const allKeys = new Set(locales.flatMap((locale) => [...catalogs[locale]]));
const missing = {};
for (const locale of locales) {
  missing[locale] = [...allKeys].filter((key) => !catalogs[locale].has(key)).sort();
}

const prototypeBlockedReason =
  "Authenticated inventory UI copy lives in prototype mocks; production catalog only covers FeatureUnavailable/landing/access surfaces until live adapters exist (#20).";

const results = [
  {
    testId: "TEST-0005-100",
    locale: "en",
    status: missing.en.length === 0 ? "Passed" : "Failed",
    keyCount: catalogs.en.size,
    missingKeys: missing.en
  },
  {
    testId: "TEST-0005-101",
    locale: "pt-BR",
    status: missing["pt-BR"].length === 0 ? "Passed" : "Failed",
    keyCount: catalogs["pt-BR"].size,
    missingKeys: missing["pt-BR"]
  },
  {
    testId: "TEST-0005-102",
    locale: "es",
    status: missing.es.length === 0 ? "Passed" : "Failed",
    keyCount: catalogs.es.size,
    missingKeys: missing.es
  },
  {
    testId: "TEST-0005-103",
    status: Object.values(missing).every((list) => list.length === 0) ? "Passed" : "Failed",
    note: "Missing-key detector across production catalogs",
    missing
  },
  {
    testId: "TEST-0005-100-INVENTORY-UI",
    status: "Blocked",
    reason: prototypeBlockedReason,
    issue: 20
  }
];

const payload = {
  plan: "PLAN-0005",
  group: "i18n-production-catalog",
  integratedMainSha: process.env.PLAN0005_INTEGRATED_SHA ?? "b94abd9a83fe29d88b095e3e9a42f10d01c05414",
  generatedAtUtc: new Date().toISOString(),
  results,
  summary: {
    passed: results.filter((r) => r.status === "Passed").length,
    failed: results.filter((r) => r.status === "Failed").length,
    blocked: results.filter((r) => r.status === "Blocked").length
  }
};

await mkdir(join(evidenceDir), { recursive: true });
await writeFile(join(evidenceDir, "i18n-production-catalog.json"), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify(payload.summary, null, 2));
if (payload.summary.failed > 0) process.exit(1);
