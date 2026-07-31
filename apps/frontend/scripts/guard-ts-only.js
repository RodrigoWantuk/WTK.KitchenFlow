#!/usr/bin/env node
/**
 * Fails when application sources under src/ still use .js/.jsx.
 * Used by CI after PLAN-0014 Phase 8f; also runnable locally via yarn guard:ts-only.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");
const offenders = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (/\.(js|jsx)$/.test(entry.name)) {
      offenders.push(path.relative(path.join(__dirname, ".."), full));
    }
  }
}

walk(root);

if (offenders.length > 0) {
  console.error(
    "TypeScript-only guard failed. Remaining JavaScript under src/:\n" +
      offenders.map((f) => ` - ${f}`).join("\n"),
  );
  process.exit(1);
}

console.log("TypeScript-only guard passed: no .js/.jsx under src/.");
