#!/usr/bin/env node
/**
 * Honest dependency audit gate.
 * High/critical findings fail unless listed in audit-allowlist.json with justification.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const allowlistPath = path.join(root, "audit-allowlist.json");
const allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));

const result = spawnSync("yarn", ["audit", "--json", "--level", "moderate"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

const lines = (result.stdout || "").split("\n").filter(Boolean);
const advisories = new Map();

for (const line of lines) {
  try {
    const row = JSON.parse(line);
    if (row.type === "auditAdvisory" && row.data?.advisory) {
      const adv = row.data.advisory;
      advisories.set(String(adv.id), {
        id: String(adv.id),
        module: adv.module_name,
        severity: adv.severity,
        title: adv.title,
        vulnerable_versions: adv.vulnerable_versions,
        patched_versions: adv.patched_versions,
        findings: row.data.resolution?.path || row.data.resolution?.id,
      });
    }
  } catch {
    // ignore non-JSON summary lines
  }
}

const allowedIds = new Set((allowlist.exceptions || []).map((e) => String(e.id)));
const unexplained = [];

for (const [id, adv] of advisories) {
  if (adv.severity !== "high" && adv.severity !== "critical" && adv.severity !== "moderate") {
    continue;
  }
  if (!allowedIds.has(id)) {
    unexplained.push(adv);
  }
}

const stale = (allowlist.exceptions || []).filter((e) => !advisories.has(String(e.id)));

console.log(`Audit advisories considered: ${advisories.size}`);
console.log(`Allowlisted exceptions: ${(allowlist.exceptions || []).length}`);

if (stale.length) {
  console.warn(
    "Allowlist entries with no matching advisory (review for removal):\n" +
      stale.map((e) => ` - ${e.id} ${e.module}`).join("\n"),
  );
}

if (unexplained.length) {
  console.error(
    "Unapproved vulnerabilities:\n" +
      unexplained
        .map(
          (a) =>
            ` - [${a.severity}] ${a.module} (${a.id}): ${a.title} patched=${a.patched_versions}`,
        )
        .join("\n"),
  );
  process.exit(1);
}

console.log("Dependency audit policy passed (allowlist-aware).");
