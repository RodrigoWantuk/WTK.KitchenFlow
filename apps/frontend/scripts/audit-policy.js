#!/usr/bin/env node
/**
 * Honest dependency audit gate (allowlist-aware).
 * Parsing/policy is exported for fixture-based unit tests.
 *
 * A run may pass only with a recognized terminal result:
 * - status 0 + auditSummary + no unapproved moderate/high/critical advisories
 * - non-zero status + auditAdvisory(s) + auditSummary + all such advisories allowlisted
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

const ACTIONABLE_SEVERITIES = new Set(["moderate", "high", "critical"]);

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

function countActionableFromSummary(summary) {
  const vulns = summary?.vulnerabilities || {};
  return (
    Number(vulns.moderate || 0) +
    Number(vulns.high || 0) +
    Number(vulns.critical || 0)
  );
}

/**
 * Parse yarn audit --json NDJSON stdout into classified events.
 */
function parseAuditStdout(stdout) {
  const advisories = new Map();
  const events = {
    auditAdvisory: [],
    auditSummary: null,
    warning: [],
    info: [],
    error: [],
    other: [],
  };
  const parseErrors = [];
  const nonJsonLines = [];
  const lines = String(stdout || "")
    .split("\n")
    .filter((line) => line.length > 0);

  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      parseErrors.push(line.slice(0, 160));
      nonJsonLines.push(line.slice(0, 160));
      continue;
    }

    const type = row && typeof row === "object" ? row.type : undefined;
    if (type === "auditAdvisory" && row.data?.advisory) {
      const adv = row.data.advisory;
      const entry = {
        id: String(adv.id),
        module: adv.module_name,
        severity: adv.severity,
        title: adv.title,
        vulnerable_versions: adv.vulnerable_versions,
        patched_versions: adv.patched_versions,
      };
      advisories.set(entry.id, entry);
      events.auditAdvisory.push(entry);
    } else if (type === "auditSummary") {
      events.auditSummary = row.data || {};
    } else if (type === "warning") {
      events.warning.push(row);
    } else if (type === "info") {
      events.info.push(row);
    } else if (type === "error") {
      events.error.push(row);
    } else {
      events.other.push(row);
    }
  }

  return {
    advisories,
    events,
    parseErrors,
    nonJsonLines,
    lineCount: lines.length,
    hasSummary: Boolean(events.auditSummary),
    hasErrorEvent: events.error.length > 0,
  };
}

function looksLikeInfrastructureFailure(text) {
  const t = String(text || "").toLowerCase();
  return (
    t.includes("enotfound") ||
    t.includes("econnrefused") ||
    t.includes("econnreset") ||
    t.includes("etimedout") ||
    t.includes("getaddrinfo") ||
    t.includes("socket hang up") ||
    t.includes("network") ||
    t.includes("unable to connect") ||
    t.includes("request failed") ||
    t.includes("certificate") ||
    t.includes("proxy") ||
    t.includes("registry.yarnpkg.com") ||
    t.includes("registry.npmjs.org") ||
    t.includes("maxbuffersize") ||
    t.includes("maxbuffer") ||
    t.includes("enoent") ||
    t.includes("timeout")
  );
}

/**
 * Evaluate audit process result against allowlist.
 * @returns {{ ok: boolean, errors: string[], warnings: string[], advisories: Map, events: object }}
 */
function evaluateAuditPolicy({
  allowlist,
  stdout,
  stderr = "",
  status,
  signal = null,
  error = null,
  maxBufferExceeded = false,
  now = new Date(),
}) {
  const errors = [];
  const warnings = [];

  if (error) {
    const msg = error.message || String(error);
    errors.push(`yarn audit failed to start: ${msg}`);
    if (looksLikeInfrastructureFailure(msg)) {
      errors.push(
        "yarn audit registry/network or spawn infrastructure failure",
      );
    }
    return {
      ok: false,
      errors,
      warnings,
      advisories: new Map(),
      events: null,
    };
  }

  if (maxBufferExceeded) {
    errors.push("yarn audit output truncated (maxBuffer exceeded)");
  }

  if (signal) {
    errors.push(`yarn audit terminated by signal ${signal}`);
  }

  const allowlistErrors = validateAllowlist(allowlist, now);
  errors.push(...allowlistErrors);

  if (status === null || typeof status === "undefined") {
    if (!signal) {
      errors.push("yarn audit exited without a status code");
    }
  }

  const parsed = parseAuditStdout(stdout);
  const { advisories, events, parseErrors, nonJsonLines, lineCount } = parsed;
  const stderrText = String(stderr || "");
  const combined = `${stdout || ""}\n${stderrText}`;

  if (lineCount === 0 && !stderrText.trim()) {
    errors.push("yarn audit produced empty output");
  }

  if (nonJsonLines.length > 0) {
    errors.push(
      `yarn audit stdout contained unexpected non-JSON lines (${nonJsonLines.length})`,
    );
  }

  if (parseErrors.length > 0) {
    errors.push("yarn audit output contained invalid JSON lines");
  }

  if (events.error.length > 0) {
    for (const errEvent of events.error) {
      const detail =
        typeof errEvent.data === "string"
          ? errEvent.data
          : JSON.stringify(errEvent.data || errEvent);
      errors.push(`yarn audit JSON error event: ${detail.slice(0, 200)}`);
    }
  }

  if (!parsed.hasSummary) {
    errors.push("yarn audit missing required auditSummary event");
  }

  if (
    status !== 0 &&
    advisories.size === 0 &&
    looksLikeInfrastructureFailure(combined)
  ) {
    errors.push("yarn audit registry/network failure");
  }

  if (
    status !== 0 &&
    advisories.size === 0 &&
    !looksLikeInfrastructureFailure(combined) &&
    stderrText.trim() &&
    !parsed.hasErrorEvent
  ) {
    errors.push(
      `yarn audit exit status ${status} with unknown stderr and no advisories`,
    );
  }

  // Terminal semantics
  const summaryCounts = parsed.hasSummary
    ? countActionableFromSummary(events.auditSummary)
    : null;

  if (parsed.hasSummary && status === 0 && summaryCounts > 0) {
    errors.push(
      `auditSummary reports ${summaryCounts} actionable vulnerabilities but exit status is 0`,
    );
  }

  if (
    parsed.hasSummary &&
    status !== 0 &&
    summaryCounts === 0 &&
    advisories.size === 0
  ) {
    errors.push(
      `exit status ${status} with clean auditSummary and no advisories (inconsistent terminal result)`,
    );
  }

  if (advisories.size > 0 && !parsed.hasSummary) {
    errors.push("advisories present without auditSummary");
  }

  if (
    parsed.hasSummary &&
    summaryCounts != null &&
    advisories.size > 0 &&
    summaryCounts === 0
  ) {
    errors.push(
      "auditSummary reports zero actionable vulnerabilities but advisories were emitted",
    );
  }

  if (
    parsed.hasSummary &&
    summaryCounts != null &&
    summaryCounts > 0 &&
    advisories.size === 0
  ) {
    errors.push(
      "auditSummary reports actionable vulnerabilities but no auditAdvisory events were parsed",
    );
  }

  if (status !== 0 && advisories.size === 0 && parsed.hasSummary === false) {
    errors.push(
      `yarn audit exit status ${status} without advisories or auditSummary`,
    );
  }

  const exceptions = allowlist?.exceptions || [];
  const byId = new Map(exceptions.map((e) => [String(e.id), e]));

  for (const [id, adv] of advisories) {
    if (!ACTIONABLE_SEVERITIES.has(adv.severity)) {
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
    if (
      exception.patched_versions &&
      adv.patched_versions &&
      String(exception.patched_versions).trim() !==
        String(adv.patched_versions).trim()
    ) {
      errors.push(
        `Allowlist patched_versions mismatch for ${id}: expected ${exception.patched_versions}, got ${adv.patched_versions}`,
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
    events,
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

  const errMsg = result.error
    ? result.error.message || String(result.error)
    : "";
  const maxBufferExceeded =
    /maxbuffer|ENOBUFS|ERR_CHILD_PROCESS_STDIO_MAXBUFFER/i.test(errMsg);

  const evaluation = evaluateAuditPolicy({
    allowlist,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    status: result.status,
    signal: result.signal,
    error: result.error && !maxBufferExceeded ? result.error : null,
    maxBufferExceeded,
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
  countActionableFromSummary,
  REQUIRED_EXCEPTION_FIELDS,
};

if (require.main === module) {
  main();
}
