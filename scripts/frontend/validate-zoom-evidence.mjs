#!/usr/bin/env node
/**
 * Fail-closed validator for PLAN-0015 automated zoom evidence JSON.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../..");
const EVIDENCE = path.join(REPO, "docs/evidence/plan-0015/browser-zoom-200-validation.json");

const WIDTH_RATIO_MIN = 1.9;
const WIDTH_RATIO_MAX = 2.1;

const DEFAULT_REQUIRED = [
  "chrome/production/Landing",
  "chrome/production/Access",
  "chrome/production/FeatureUnavailable",
  "chrome/production/Language_selector",
  "chrome/prototype/Home",
  "chrome/prototype/Pantry",
  "chrome/prototype/Planning_dialog",
  "chrome/prototype/Shopping",
  "chrome/prototype/Carousel_home",
  "chrome/prototype/Cook_CTA",
  "chrome/prototype/Item_detail_navigation",
  "firefox/production/Landing",
  "firefox/production/Access",
  "firefox/production/FeatureUnavailable",
  "firefox/production/Language_selector",
  "firefox/prototype/Home",
  "firefox/prototype/Pantry",
  "firefox/prototype/Planning_dialog",
  "firefox/prototype/Shopping",
  "firefox/prototype/Carousel_home",
  "firefox/prototype/Cook_CTA",
  "firefox/prototype/Item_detail_navigation",
];

function fail(msg, errors) {
  errors.push(msg);
}

function validateZoomBlock(block, label, errors, { allowUnsupported }) {
  if (!block) {
    fail(`missing ${label}`, errors);
    return;
  }
  const { widthRatio, calculatedZoomPercent, zoomConfirmed200, status } = block;
  if (status === "Unsupported") {
    if (!allowUnsupported) fail(`${label}: Unsupported not allowed`, errors);
    if (zoomConfirmed200 === true) fail(`${label}: Unsupported with zoomConfirmed200=true`, errors);
    return;
  }
  if (zoomConfirmed200 === true) {
    if (typeof widthRatio !== "number" || widthRatio < WIDTH_RATIO_MIN || widthRatio > WIDTH_RATIO_MAX) {
      fail(`${label}: zoomConfirmed200=true but widthRatio=${widthRatio}`, errors);
    }
    if (calculatedZoomPercent == null) fail(`${label}: missing calculatedZoomPercent`, errors);
    else if (Math.abs(calculatedZoomPercent - Math.round(widthRatio * 100)) > 2) {
      fail(`${label}: calculatedZoomPercent contradicts widthRatio`, errors);
    }
    if (block.approxZoomPercent != null && Math.abs(block.approxZoomPercent - calculatedZoomPercent) > 5) {
      fail(`${label}: approxZoomPercent contradicts calculatedZoomPercent`, errors);
    }
    if (status !== "Passed") fail(`${label}: confirmed zoom requires status=Passed`, errors);
  }
}

function recomputeDisposition(report) {
  const required = report.requiredScenarioIds || DEFAULT_REQUIRED;
  const byId = Object.fromEntries((report.scenarios || []).map((s) => [s.id, s]));
  const missing = required.filter((id) => !byId[id]);
  const statuses = required.map((id) => byId[id]?.status || "missing");
  let zoomDisposition = "Passed";
  if (report.chromeNativeZoom?.status !== "Passed") zoomDisposition = "Failed";
  else if (!["Passed", "Unsupported"].includes(report.firefoxNativeZoom?.status)) zoomDisposition = "Failed";

  let disposition = "Passed";
  if (missing.length) disposition = "Incomplete";
  else if (statuses.some((s) => s === "Failed")) disposition = "Failed";
  else if (statuses.some((s) => s === "Blocked")) disposition = "Blocked";
  else if (statuses.some((s) => s === "Not applicable" || s === "Unsupported" || s === "missing"))
    disposition = "Incomplete";
  else if (zoomDisposition === "Failed") disposition = "Failed";
  else if (!statuses.every((s) => s === "Passed")) disposition = "Incomplete";
  return { disposition, zoomDisposition, missing, statuses };
}

function main() {
  const errors = [];
  if (!fs.existsSync(EVIDENCE)) {
    console.error(`validate-zoom-evidence: FAIL — missing ${EVIDENCE}`);
    process.exit(1);
  }
  let report;
  try {
    report = JSON.parse(fs.readFileSync(EVIDENCE, "utf8"));
  } catch (err) {
    console.error(`validate-zoom-evidence: FAIL — JSON invalid: ${err.message}`);
    process.exit(1);
  }

  if (report.classification !== "automated headed native-browser-zoom smoke") {
    fail(`unexpected classification: ${report.classification}`, errors);
  }
  if (!report.testedMainSha || !report.evidenceBranchHead || !report.frontendImplementationSha) {
    fail("missing testedMainSha / evidenceBranchHead / frontendImplementationSha", errors);
  }
  if (report.testedMainSha === report.evidenceBranchHead) {
    // Allowed only if docs committed on main tip; warn via fail if equal while branch name suggests docs?
    // Not an error by itself.
  }

  const executed = report.executed || {};
  if (executed.manualVisualReview && !/deferred/i.test(String(executed.manualVisualReview))) {
    fail("manualVisualReview must remain Deferred", errors);
  }
  if (executed.fullNvdaVoiceOverAudit && !/deferred/i.test(String(executed.fullNvdaVoiceOverAudit))) {
    fail("fullNvdaVoiceOverAudit must remain Deferred", errors);
  }

  validateZoomBlock(report.chromeNativeZoom, "chromeNativeZoom", errors, { allowUnsupported: false });
  validateZoomBlock(report.firefoxNativeZoom, "firefoxNativeZoom", errors, { allowUnsupported: true });

  const required = report.requiredScenarioIds || DEFAULT_REQUIRED;
  const scenarios = Array.isArray(report.scenarios) ? report.scenarios : [];
  const ids = scenarios.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) fail(`duplicate scenario ids: ${[...new Set(dupes)].join(", ")}`, errors);

  for (const id of required) {
    if (!ids.includes(id)) fail(`missing required scenario: ${id}`, errors);
  }

  const byId = Object.fromEntries(scenarios.map((s) => [s.id, s]));
  for (const id of required) {
    const s = byId[id];
    if (!s) continue;
    if (s.status !== "Passed") {
      fail(`required scenario ${id} status=${s.status} (must be Passed)`, errors);
    }
    if (!s.assertion || String(s.assertion).trim().length < 3) {
      fail(`required scenario ${id} missing assertion`, errors);
    }
  }

  // Cook CTA
  for (const browser of ["chrome", "firefox"]) {
    const s = byId[`${browser}/prototype/Cook_CTA`];
    if (!s) continue;
    const st = s.actualState || {};
    if (s.status === "Passed") {
      if (st.navigated === false && !st.pathOk && !st.dialogAppeared) {
        fail(`${s.id}: Passed with navigated=false without destination proof`, errors);
      }
      if (st.clickMode === "force") {
        fail(`${s.id}: Passed must not use force click`, errors);
      }
      if (s.expectedPath && s.actualPath && st.pathOk === false && !st.dialogAppeared) {
        fail(`${s.id}: actualPath does not satisfy expected navigation`, errors);
      }
    }
  }

  // Item detail — no goto fallback
  for (const browser of ["chrome", "firefox"]) {
    const s = byId[`${browser}/prototype/Item_detail_navigation`];
    if (!s) continue;
    const st = s.actualState || {};
    if (s.status === "Passed") {
      if (st.linkClickNavigation !== true) {
        fail(`${s.id}: Passed requires linkClickNavigation=true`, errors);
      }
      if (st.directRouteReachability && st.directRouteReachability !== "not_used") {
        fail(`${s.id}: must not pass via page.goto fallback`, errors);
      }
      if (s.expectedPath && s.actualPath !== s.expectedPath) {
        fail(`${s.id}: actualPath ${s.actualPath} !== expectedPath ${s.expectedPath}`, errors);
      }
    }
  }

  // Dialog
  for (const browser of ["chrome", "firefox"]) {
    const s = byId[`${browser}/prototype/Planning_dialog`];
    if (!s) continue;
    const st = s.actualState || {};
    if (s.status === "Passed") {
      if (st.opened !== true || st.closed !== true) {
        fail(`${s.id}: Passed requires opened=true and closed=true`, errors);
      }
      if (st.focusReturned !== true) {
        fail(`${s.id}: Passed requires focusReturned=true`, errors);
      }
    }
  }

  // Carousel
  for (const browser of ["chrome", "firefox"]) {
    const s = byId[`${browser}/prototype/Carousel_home`];
    if (!s) continue;
    const st = s.actualState || {};
    if (s.status === "Passed" && st.changed !== true) {
      fail(`${s.id}: Passed requires carousel item/index change`, errors);
    }
  }

  // Language selector
  for (const browser of ["chrome", "firefox"]) {
    const s = byId[`${browser}/production/Language_selector`];
    if (!s) continue;
    const st = s.actualState || {};
    if (s.status === "Passed" && st.stringChanged !== true) {
      fail(`${s.id}: Passed requires locale string change`, errors);
    }
  }

  // Summary counts
  const counts = { Passed: 0, Failed: 0, Blocked: 0, "Not applicable": 0, Unsupported: 0 };
  for (const s of scenarios) counts[s.status] = (counts[s.status] || 0) + 1;
  const summary = report.summary || {};
  if (summary.passed !== (counts.Passed || 0)) fail(`summary.passed mismatch`, errors);
  if (summary.failed !== (counts.Failed || 0)) fail(`summary.failed mismatch`, errors);
  if (summary.blocked !== (counts.Blocked || 0)) fail(`summary.blocked mismatch`, errors);
  if (summary.total !== scenarios.length) fail(`summary.total mismatch`, errors);

  const recomputed = recomputeDisposition(report);
  if (summary.disposition !== recomputed.disposition) {
    fail(
      `summary.disposition=${summary.disposition} but recomputed=${recomputed.disposition}`,
      errors,
    );
  }
  if ((report.zoomDisposition || summary.zoomDisposition) !== recomputed.zoomDisposition) {
    fail(
      `zoomDisposition incoherent (report=${report.zoomDisposition}, summary=${summary.zoomDisposition}, recomputed=${recomputed.zoomDisposition})`,
      errors,
    );
  }

  const blob = JSON.stringify(report);
  if (/manual visual review[^\n]{0,40}(passed|executed)/i.test(blob)) {
    fail("report claims manual review executed/passed", errors);
  }

  if (errors.length) {
    for (const e of errors) console.error(`validate-zoom-evidence: FAIL — ${e}`);
    process.exit(1);
  }
  console.log(
    `validate-zoom-evidence: OK — ${required.length} required Passed; Chrome zoom ${report.chromeNativeZoom.status}; Firefox zoom ${report.firefoxNativeZoom.status}; disposition ${summary.disposition}`,
  );
}

main();
