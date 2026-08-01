#!/usr/bin/env node
/**
 * Honest dependency audit gate (allowlist-aware).
 * Parsing/policy is exported for fixture-based unit tests.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REQUIRED_EXCEPTION_FIELDS = [
  "id",
  "module",
  "severity",
  "patched_versions",
  "residual_risk",
];

function hasRationale(exception) {
  return Boolean(
    (exception.rationale && String(exception.rationale).trim()) ||
      (exception.action && String(exception.action).trim()),
  );
}

function hasFollowUp(exception) {
  return Boolean(
    (exception.remove_by && String(exception.remove_by).trim()) ||
      (exception.follow_up_plan && String(exception.follow_up_plan).trim()),
  );
}

/**
 * Validate allowlist document shape.
 * @returns {string[]} error messages
 */
function validateAllowlist(allowlist, now = new Date()) {
  const errors = [];
  if (!allowlist || typeof allowlist !== "object") {
    return ["Allowlist must be a JSON object"];
  }
  const exceptions = allowlist.exceptions;
  if (!Array.isArray(exceptions)) {
    return ["Allowlist.exceptions must be an array"];
  }
  for (const [index, exception] of exceptions.entries()) {
    const label = `exceptions[${index}]`;
    for (const field of REQUIRED_EXCEPTION_FIELDS) {
      if (!exception?.[field] || !String(exception[field]).trim()) {
        errors.push(`${label} missing required field "${field}"`);
      }
    }
    if (!hasRationale(exception)) {
      errors.push(`${label} must include rationale or action`);
    }
    if (!hasFollowUp(exception)) {
      errors.push(`${label} must include remove_by or follow_up_plan`);
    }
    if (exception?.remove_by) {
      const until = new Date(exception.remove_by);
      if (Number.isNaN(until.getTime())) {
        errors.push(
          `${label} remove_by is not a valid date: ${exception.remove_by}`,
        );
      } else if (until.getTime() < now.getTime()) {
        errors.push(
          `${label} expired remove_by=${exception.remove_by} (id=${exception.id})`,
        );
      }
    }
  }
  return errors;
}

/**
 * Parse yarn audit --json NDJSON stdout into advisory map.
 */
function parseAuditStdout(stdout) {
  const advisories = new Map();
  const lines = String(stdout || "")
    .split("\n")
    .filter(Boolean);
  let parsedAny = false;
  const parseErrors = [];

  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
      parsedAny = true;
    } catch {
      parseErrors.push(line.slice(0, 120));
      continue;
    }
    if (row.type === "auditAdvisory" && row.data?.advisory) {
      const adv = row.data.advisory;
      advisories.set(String(adv.id), {
        id: String(adv.id),
        module: adv.module_name,
        severity: adv.severity,
        title: adv.title,
        vulnerable_versions: adv.vulnerable_versions,
        patched_versions: adv.patched_versions,
      });
    }
  }

  return { advisories, parsedAny, parseErrors, lineCount: lines.length };
}

/**
 * Evaluate audit process result against allowlist.
 * @returns {{ ok: boolean, errors: string[], warnings: string[], advisories: Map }}
 */
function evaluateAuditPolicy({
  allowlist,
  stdout,
  stderr = "",
  status,
  error = null,
  now = new Date(),
}) {
  const errors = [];
  const warnings = [];

  if (error) {
    errors.push(
      `yarn audit failed to start: ${error.message || String(error)}`,
    );
    return { ok: false, errors, warnings, advisories: new Map() };
  }

  const combined = `${stdout || ""}\n${stderr || ""}`.toLowerCase();
  if (
    combined.includes("getaddrinfo") ||
    combined.includes("enotfound") ||
    combined.includes("econnrefused") ||
    combined.includes("network") ||
    (combined.includes("registry.yarnpkg.com") && combined.includes("error"))
  ) {
    // Only treat as registry failure when process also failed or produced no advisories later
  }

  const allowlistErrors = validateAllowlist(allowlist, now);
  errors.push(...allowlistErrors);

  if (status === null || typeof status === "undefined") {
    errors.push("yarn audit exited without a status code");
  }

  const { advisories, parsedAny, parseErrors, lineCount } =
    parseAuditStdout(stdout);

  if (lineCount === 0 && !String(stderr || "").trim()) {
    errors.push("yarn audit produced empty output");
  }

  if (lineCount > 0 && !parsedAny) {
    errors.push("yarn audit output contained no valid JSON events");
  }

  if (parseErrors.length > 0 && advisories.size === 0 && !parsedAny) {
    errors.push("yarn audit output was invalid JSON");
  }

  if (
    status !== 0 &&
    advisories.size === 0 &&
    (combined.includes("enotfound") ||
      combined.includes("econnrefused") ||
      combined.includes("getaddrinfo") ||
      combined.includes("unable to connect") ||
      combined.includes("request failed"))
  ) {
    errors.push("yarn audit registry/network failure");
  }

  // Yarn audit exits non-zero when vulns exist; that alone is not a process failure.
  // Incompatible: claimed success with unreadable output already covered; fail if
  // status is non-zero AND we have neither advisories nor a known audit summary.
  if (
    status !== 0 &&
    advisories.size === 0 &&
    !String(stdout || "").includes("vulnerabilities") &&
    !parsedAny
  ) {
    errors.push(
      `yarn audit exit status ${status} with no recognizable advisory summary`,
    );
  }

  const exceptions = allowlist?.exceptions || [];
  const byId = new Map(exceptions.map((e) => [String(e.id), e]));

  for (const [id, adv] of advisories) {
    if (
      adv.severity !== "high" &&
      adv.severity !== "critical" &&
      adv.severity !== "moderate"
    ) {
      continue;
    }
    const exception = byId.get(id);
    if (!exception) {
      errors.push(
        `Unapproved vulnerability: [${adv.severity}] ${adv.module} (${id}): ${adv.title}`,
      );
      continue;
    }
    if (exception.module && exception.module !== adv.module) {
      errors.push(
        `Allowlist module mismatch for ${id}: expected ${exception.module}, got ${adv.module}`,
      );
    }
    if (exception.severity && exception.severity !== adv.severity) {
      errors.push(
        `Allowlist severity mismatch for ${id}: expected ${exception.severity}, got ${adv.severity}`,
      );
    }
  }

  for (const exception of exceptions) {
    if (!advisories.has(String(exception.id))) {
      warnings.push(
        `Allowlist entry ${exception.id} (${exception.module}) has no matching advisory`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    advisories,
  };
}

function main() {
  const root = path.join(__dirname, "..");
  const allowlistPath = path.join(root, "audit-allowlist.json");
  let allowlist;
  try {
    allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
  } catch (err) {
    console.error(`Failed to read allowlist: ${err.message}`);
    process.exit(1);
  }

  const result = spawnSync("yarn", ["audit", "--json", "--level", "moderate"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });

  const evaluation = evaluateAuditPolicy({
    allowlist,
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
    error: result.error,
  });

  console.log(`Audit advisories considered: ${evaluation.advisories.size}`);
  console.log(`Allowlisted exceptions: ${(allowlist.exceptions || []).length}`);

  for (const warning of evaluation.warnings) {
    console.warn(warning);
  }

  if (!evaluation.ok) {
    console.error("Dependency audit policy failed:");
    for (const err of evaluation.errors) {
      console.error(` - ${err}`);
    }
    process.exit(1);
  }

  console.log("Dependency audit policy passed (allowlist-aware).");
}

module.exports = {
  validateAllowlist,
  parseAuditStdout,
  evaluateAuditPolicy,
  REQUIRED_EXCEPTION_FIELDS,
};

if (require.main === module) {
  main();
}
