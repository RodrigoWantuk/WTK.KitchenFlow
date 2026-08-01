#!/usr/bin/env node
/**
 * Validate PLAN-0015 automated headed native-browser-zoom evidence JSON.
 * Fails closed on contradictory or overclaimed results.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../..");
const EVIDENCE = path.join(REPO, "docs/evidence/plan-0015/browser-zoom-200-validation.json");

const WIDTH_RATIO_MIN = 1.9;
const WIDTH_RATIO_MAX = 2.1;
const ALLOWED_STATUS = new Set(["Passed", "Failed", "Blocked", "Not applicable", "Unsupported"]);

function fail(msg) {
  console.error(`validate-zoom-evidence: FAIL — ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`validate-zoom-evidence: ${msg}`);
}

function main() {
  if (!fs.existsSync(EVIDENCE)) {
    fail(`missing evidence file: ${EVIDENCE}`);
    return;
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(EVIDENCE, "utf8"));
  } catch (err) {
    fail(`JSON invalid: ${err.message}`);
    return;
  }

  const errors = [];

  if (report.classification !== "automated headed native-browser-zoom smoke") {
    errors.push(`unexpected classification: ${report.classification}`);
  }

  const executed = report.executed || {};
  const forbiddenManualExecuted = [
    "manualVisualReview",
    "fullNvdaVoiceOverAudit",
    "manualExploratoryCharters",
    "manualScreenshotInspection",
  ];
  for (const key of forbiddenManualExecuted) {
    const value = executed[key] || report.deferred?.[key];
    if (typeof value === "string" && /^executed$/i.test(value.trim())) {
      errors.push(`manual claim marked Executed: ${key}`);
    }
  }
  if (executed.manualVisualReview && !/deferred/i.test(String(executed.manualVisualReview))) {
    errors.push("manualVisualReview must be Deferred, not executed");
  }
  if (executed.fullNvdaVoiceOverAudit && !/deferred/i.test(String(executed.fullNvdaVoiceOverAudit))) {
    errors.push("fullNvdaVoiceOverAudit must be Deferred, not executed");
  }

  const chrome = report.chromeNativeZoom;
  if (!chrome) errors.push("missing chromeNativeZoom");
  else {
    validateZoomBlock(chrome, "chrome", errors, { allowUnsupported: false });
  }

  const firefox = report.firefoxNativeZoom;
  if (!firefox) errors.push("missing firefoxNativeZoom");
  else {
    validateZoomBlock(firefox, "firefox", errors, { allowUnsupported: true });
  }

  const scenarios = Array.isArray(report.scenarios) ? report.scenarios : null;
  if (!scenarios) {
    errors.push("missing scenarios array");
  } else {
    const counts = { Passed: 0, Failed: 0, Blocked: 0, "Not applicable": 0, Unsupported: 0 };
    for (const s of scenarios) {
      if (!ALLOWED_STATUS.has(s.status)) {
        errors.push(`scenario ${s.id || "?"} has invalid status ${s.status}`);
      }
      if (s.status === "Passed" && s.status === "Blocked") {
        errors.push(`scenario ${s.id} is simultaneously Passed and Blocked`);
      }
      // Impossible dual status via single field — also reject contradictory arrays if present
      if (Array.isArray(s.statuses) && s.statuses.includes("Passed") && s.statuses.includes("Blocked")) {
        errors.push(`scenario ${s.id} statuses include both Passed and Blocked`);
      }
      if (s.status === "Passed") {
        if (!s.assertion || String(s.assertion).trim().length < 3) {
          errors.push(`scenario ${s.id || s.surface} Passed without assertion`);
        }
      }
      counts[s.status] = (counts[s.status] || 0) + 1;
    }

    const summary = report.summary || {};
    const expected = {
      passed: counts.Passed || 0,
      failed: counts.Failed || 0,
      blocked: counts.Blocked || 0,
      notApplicable: counts["Not applicable"] || 0,
      total: scenarios.length,
    };
    for (const key of ["passed", "failed", "blocked", "total"]) {
      if (summary[key] !== expected[key]) {
        errors.push(`summary.${key}=${summary[key]} does not match scenarios (${expected[key]})`);
      }
    }
    if (summary.notApplicable != null && summary.notApplicable !== expected.notApplicable) {
      errors.push(`summary.notApplicable=${summary.notApplicable} does not match scenarios (${expected.notApplicable})`);
    }
  }

  // Textual overclaims
  const blob = JSON.stringify(report);
  if (/manual visual review[^\n]{0,40}passed/i.test(blob) || /manual browser validation[^\n]{0,40}passed/i.test(blob)) {
    errors.push("report claims manual review Passed");
  }

  if (errors.length) {
    for (const e of errors) fail(e);
    return;
  }
  ok(`OK — ${scenarios.length} scenarios; Chrome zoom ${chrome.status}; Firefox zoom ${firefox.status}`);
}

function validateZoomBlock(block, label, errors, { allowUnsupported }) {
  const {
    baselineInnerWidthAt100,
    zoomedInnerWidth,
    widthRatio,
    calculatedZoomPercent,
    zoomConfirmed200,
    status,
  } = block;

  if (status === "Unsupported") {
    if (!allowUnsupported) {
      errors.push(`${label}: Unsupported not allowed`);
    }
    if (zoomConfirmed200 === true) {
      errors.push(`${label}: Unsupported must not set zoomConfirmed200=true`);
    }
    if (calculatedZoomPercent != null && zoomConfirmed200 === true) {
      errors.push(`${label}: Unsupported must not claim confirmed percent`);
    }
    // Prefer null percent when unsupported
    if (zoomConfirmed200 === true) {
      errors.push(`${label}: contradictory Unsupported + confirmed`);
    }
    return;
  }

  if (zoomConfirmed200 === true) {
    if (typeof widthRatio !== "number" || widthRatio < WIDTH_RATIO_MIN || widthRatio > WIDTH_RATIO_MAX) {
      errors.push(`${label}: zoomConfirmed200=true but widthRatio=${widthRatio} outside ${WIDTH_RATIO_MIN}-${WIDTH_RATIO_MAX}`);
    }
    if (calculatedZoomPercent == null) {
      errors.push(`${label}: zoomConfirmed200=true requires calculatedZoomPercent`);
    } else {
      const expected = Math.round(widthRatio * 100);
      if (Math.abs(calculatedZoomPercent - expected) > 2) {
        errors.push(
          `${label}: calculatedZoomPercent=${calculatedZoomPercent} contradicts widthRatio=${widthRatio} (expected ~${expected})`,
        );
      }
      // approxZoomPercent legacy field must not contradict
      if (block.approxZoomPercent != null && Math.abs(block.approxZoomPercent - calculatedZoomPercent) > 5) {
        errors.push(
          `${label}: approxZoomPercent=${block.approxZoomPercent} contradicts calculatedZoomPercent=${calculatedZoomPercent}`,
        );
      }
    }
    if (status !== "Passed") {
      errors.push(`${label}: zoomConfirmed200=true requires status=Passed (got ${status})`);
    }
  }

  if (zoomConfirmed200 === false && status === "Passed" && label === "chrome") {
    errors.push(`${label}: status=Passed requires zoomConfirmed200=true`);
  }

  if (label === "firefox" && zoomConfirmed200 === true) {
    if (typeof baselineInnerWidthAt100 !== "number" || typeof zoomedInnerWidth !== "number") {
      errors.push("firefox: declares 200% without baseline/zoomed measurements");
    }
    if (typeof widthRatio !== "number" || widthRatio < WIDTH_RATIO_MIN || widthRatio > WIDTH_RATIO_MAX) {
      errors.push("firefox: declares 200% without sufficient widthRatio measurement");
    }
  }
}

main();
