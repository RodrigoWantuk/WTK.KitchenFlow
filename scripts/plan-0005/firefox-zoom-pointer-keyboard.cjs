#!/usr/bin/env node
/**
 * PLAN-0005 TEST-0005-109: Firefox native ~200% zoom — pointer vs keyboard.
 * Uses headed Firefox under Xvfb with real Ctrl+0 / Ctrl+Plus (xdotool).
 * Does NOT use CSS zoom, transform, or reduced viewport as a zoom substitute.
 * Keyboard success never upgrades pointer status.
 */
const { firefox } = require("../../apps/frontend/node_modules/playwright");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { execSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const evidenceDir = process.env.PLAN0005_EVIDENCE_DIR
  ? path.resolve(process.env.PLAN0005_EVIDENCE_DIR)
  : path.join(root, "docs/evidence/plan-0005");
const reportPath = path.join(evidenceDir, "reports", "firefox-zoom-pointer-keyboard.json");
const prototypeDir = path.join(root, "apps/frontend/build-prototype");
const productionDir = path.join(root, "apps/frontend/build-production");
const port = Number(process.env.PLAN0005_ZOOM_PORT || 4180);
const WINDOW = { width: 1280, height: 720 };
const WIDTH_RATIO_MIN = 1.9;
const WIDTH_RATIO_MAX = 2.1;

function ensureBuild(dir, label) {
  if (!fs.existsSync(path.join(dir, "index.html"))) {
    throw new Error(`${label} build missing at ${dir}.`);
  }
}

function xdotool(args) {
  return execSync(`xdotool ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function activateBrowserWindow(classPattern, titleHint) {
  let ids = [];
  try {
    ids = xdotool(`search --onlyvisible --class "${classPattern}"`)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    ids = [];
  }
  if (titleHint) {
    try {
      const byTitle = xdotool(`search --onlyvisible --name "${titleHint}"`)
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const overlap = ids.filter((id) => byTitle.includes(id));
      if (overlap.length) ids = overlap;
      else if (byTitle.length) ids = byTitle;
    } catch {
      /* keep class ids */
    }
  }
  if (!ids.length) throw new Error(`No visible window matching ${classPattern}`);
  const id = ids[ids.length - 1];
  // Soft-activate: bare Xvfb often lacks _NET_ACTIVE_WINDOW (no EWMH WM).
  try {
    xdotool(`windowactivate --sync ${id}`);
  } catch {
    try {
      xdotool(`windowmap ${id}`);
    } catch {
      /* ignore */
    }
    try {
      xdotool(`windowfocus --sync ${id}`);
    } catch {
      try {
        xdotool(`windowfocus ${id}`);
      } catch {
        /* last resort: send keys to window id directly */
      }
    }
    try {
      xdotool(`windowraise ${id}`);
    } catch {
      /* ignore */
    }
  }
  return id;
}

function sendKeysToWindow(windowId, keys) {
  try {
    xdotool(`key --window ${windowId} --clearmodifiers ${keys}`);
  } catch {
    xdotool(`key --clearmodifiers ${keys}`);
  }
}

async function wait(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

function startStaticServer(dir, listenPort) {
  const handler = (req, res) => {
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
    const types = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".woff2": "font/woff2"
    };
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  };
  const server = http.createServer(handler);
  return new Promise((resolve) => {
    server.listen(listenPort, "127.0.0.1", () => resolve(server));
  });
}

async function ensurePrototypeDemo(page, base) {
  await page.goto(`${base}/acesso`, { waitUntil: "load" });
  await page.evaluate(() => {
    const key = "cocinaris_state_v1";
    let state = {};
    try {
      state = JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch {
      state = {};
    }
    state.authed = true;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.goto(`${base}/app/hoje`, { waitUntil: "load" });
  if ((await page.getByTestId("access-demo").count()) > 0) {
    await page.getByTestId("access-demo").evaluate((el) => el.click());
    await wait(600);
    await page.goto(`${base}/app/hoje`, { waitUntil: "load" });
  }
}

/**
 * Applies native browser zoom via OS key events. Rejects CSS zoom substitutes.
 */
async function applyNativeFirefoxZoom200(page) {
  // Fail closed if CSS zoom was previously applied by a broken harness.
  const cssZoom = await page.evaluate(() => ({
    html: document.documentElement.style.zoom || "",
    body: document.body.style.zoom || ""
  }));
  if (cssZoom.html || cssZoom.body) {
    throw new Error(`CSS zoom present (html=${cssZoom.html}, body=${cssZoom.body}); native zoom required`);
  }

  // Do not call setViewportSize — a fixed Playwright viewport masks native browser zoom
  // (window.innerWidth stays constant). Use viewport:null context like PLAN-0015.
  await page.bringToFront();
  await page.mouse.click(40, 40);
  await wait(300);
  const windowId = activateBrowserWindow("firefox|Navigator", "127.0.0.1");
  await wait(200);
  sendKeysToWindow(windowId, "ctrl+0");
  await wait(400);
  const baselineInnerWidthAt100 = await page.evaluate(() => window.innerWidth);
  let zoomedInnerWidth = baselineInnerWidthAt100;
  let numberOfZoomInActions = 0;
  let numberOfZoomOutActions = 0;
  for (let i = 0; i < 12; i++) {
    const wid = activateBrowserWindow("firefox|Navigator", "127.0.0.1");
    sendKeysToWindow(wid, "ctrl+plus");
    numberOfZoomInActions += 1;
    await wait(350);
    zoomedInnerWidth = await page.evaluate(() => window.innerWidth);
    const ratio = baselineInnerWidthAt100 / zoomedInnerWidth;
    if (ratio >= WIDTH_RATIO_MIN && ratio <= WIDTH_RATIO_MAX) break;
    if (ratio > WIDTH_RATIO_MAX) {
      const wid2 = activateBrowserWindow("firefox|Navigator", "127.0.0.1");
      sendKeysToWindow(wid2, "ctrl+minus");
      numberOfZoomOutActions += 1;
      await wait(350);
      zoomedInnerWidth = await page.evaluate(() => window.innerWidth);
      break;
    }
  }
  zoomedInnerWidth = await page.evaluate(() => window.innerWidth);
  const widthRatio = zoomedInnerWidth > 0 ? baselineInnerWidthAt100 / zoomedInnerWidth : null;
  const ratioOk =
    typeof widthRatio === "number" && widthRatio >= WIDTH_RATIO_MIN && widthRatio <= WIDTH_RATIO_MAX;
  if (!ratioOk) {
    throw new Error(
      `Native Firefox zoom not confirmed (widthRatio=${widthRatio}; require ${WIDTH_RATIO_MIN}–${WIDTH_RATIO_MAX})`
    );
  }
  return {
    method: "native-ctrl-plus",
    baselineInnerWidthAt100,
    zoomedInnerWidth,
    widthRatio: Number(widthRatio.toFixed(4)),
    calculatedZoomPercent: Math.round(widthRatio * 100),
    numberOfZoomInActions,
    numberOfZoomOutActions,
    viewport: WINDOW
  };
}

async function pointerAttempt(locator) {
  try {
    await locator.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest" }));
    await wait(200);
    await locator.click({ trial: true, timeout: 2500 });
    await locator.click({ timeout: 2500, force: false });
    return { status: "Passed", detail: "pointer click succeeded", interceptor: null };
  } catch (error) {
    const msg = String(error.message || error);
    return { status: "Failed", detail: msg.slice(0, 500), interceptor: msg.slice(0, 500) };
  }
}

async function keyboardAttempt(locator, page) {
  try {
    await locator.focus();
    await page.keyboard.press("Enter");
    return { status: "Passed", detail: "keyboard Enter succeeded" };
  } catch (error) {
    return { status: "Failed", detail: String(error.message || error).slice(0, 300) };
  }
}

async function runCook(page, base, zoomMeasurement, browserVersion) {
  await ensurePrototypeDemo(page, base);
  await page.goto(`${base}/app/hoje`, { waitUntil: "networkidle" });
  const zoom = await applyNativeFirefoxZoom200(page);
  Object.assign(zoomMeasurement, zoom);
  const selector = '[data-testid="sugg-open-r2"]';
  const cta = page.locator(selector).first();
  if (!(await cta.count())) {
    return {
      scenario: "Cook_CTA",
      label: "Firefox native 200% — Cook CTA",
      browser: "firefox",
      browserVersion,
      zoom: "native-approx-200pct",
      zoomMeasurement: { ...zoomMeasurement },
      pointer: { status: "Blocked", detail: "sugg-open-r2 missing on /app/hoje" },
      keyboard: { status: "Blocked", detail: "sugg-open-r2 missing on /app/hoje" }
    };
  }

  const beforeUrl = page.url();
  const pointer = await pointerAttempt(cta);
  await wait(700);
  const afterPointerUrl = page.url();
  const pointerStatus =
    pointer.status === "Passed" && afterPointerUrl !== beforeUrl ? "Passed" : "Failed";

  await ensurePrototypeDemo(page, base);
  await page.goto(`${base}/app/hoje`, { waitUntil: "networkidle" });
  Object.assign(zoomMeasurement, await applyNativeFirefoxZoom200(page));
  const cta2 = page.locator(selector).first();
  const beforeKeyboardUrl = page.url();
  const keyboard = await keyboardAttempt(cta2, page);
  await wait(700);
  const afterKeyboardUrl = page.url();
  const keyboardStatus =
    keyboard.status === "Passed" && afterKeyboardUrl !== beforeKeyboardUrl ? "Passed" : "Failed";

  return {
    scenario: "Cook_CTA",
    label: "Firefox native 200% — Cook CTA",
    browser: "firefox",
    browserVersion,
    zoom: "native-approx-200pct",
    zoomMeasurement: { ...zoomMeasurement },
    pointer: {
      status: pointerStatus,
      detail: pointer.detail,
      interceptor: pointer.interceptor,
      beforeUrl,
      afterUrl: afterPointerUrl
    },
    keyboard: {
      status: keyboardStatus,
      detail: keyboard.detail,
      beforeUrl: beforeKeyboardUrl,
      afterUrl: afterKeyboardUrl
    }
  };
}

async function runPantry(page, base, zoomMeasurement, browserVersion) {
  await ensurePrototypeDemo(page, base);
  await page.goto(`${base}/app/despensa`, { waitUntil: "networkidle" });
  Object.assign(zoomMeasurement, await applyNativeFirefoxZoom200(page));
  const selector = "[data-testid^=pantry-item-link-]";
  const link = page.locator(selector).first();
  if (!(await link.count())) {
    return {
      scenario: "Pantry_item",
      label: "Firefox native 200% — Pantry item",
      browser: "firefox",
      browserVersion,
      zoom: "native-approx-200pct",
      zoomMeasurement: { ...zoomMeasurement },
      pointer: { status: "Blocked", detail: "pantry-item-link missing on /app/despensa" },
      keyboard: { status: "Blocked", detail: "pantry-item-link missing on /app/despensa" }
    };
  }

  const beforeUrl = page.url();
  const pointer = await pointerAttempt(link);
  await wait(700);
  const afterPointerUrl = page.url();
  const pointerStatus =
    pointer.status === "Passed" && afterPointerUrl !== beforeUrl ? "Passed" : "Failed";

  await ensurePrototypeDemo(page, base);
  await page.goto(`${base}/app/despensa`, { waitUntil: "networkidle" });
  Object.assign(zoomMeasurement, await applyNativeFirefoxZoom200(page));
  const link2 = page.locator(selector).first();
  const beforeKeyboardUrl = page.url();
  const keyboard = await keyboardAttempt(link2, page);
  await wait(700);
  const afterKeyboardUrl = page.url();
  const keyboardStatus =
    keyboard.status === "Passed" && afterKeyboardUrl !== beforeKeyboardUrl ? "Passed" : "Failed";

  return {
    scenario: "Pantry_item",
    label: "Firefox native 200% — Pantry item",
    browser: "firefox",
    browserVersion,
    zoom: "native-approx-200pct",
    zoomMeasurement: { ...zoomMeasurement },
    pointer: {
      status: pointerStatus,
      detail: pointer.detail,
      interceptor: pointer.interceptor,
      beforeUrl,
      afterUrl: afterPointerUrl
    },
    keyboard: {
      status: keyboardStatus,
      detail: keyboard.detail,
      beforeUrl: beforeKeyboardUrl,
      afterUrl: afterKeyboardUrl
    }
  };
}

async function main() {
  if (!process.env.DISPLAY) {
    throw new Error("DISPLAY is unset. Run under Xvfb (headed Firefox + xdotool).");
  }
  try {
    execSync("xdotool --version", { stdio: "ignore" });
  } catch {
    throw new Error("xdotool is required for native Ctrl+0 / Ctrl+Plus zoom");
  }

  ensureBuild(prototypeDir, "prototype");
  ensureBuild(productionDir, "production");
  fs.mkdirSync(path.join(evidenceDir, "reports"), { recursive: true });

  const server = await startStaticServer(prototypeDir, port);
  const base = `http://127.0.0.1:${port}`;
  const browser = await firefox.launch({
    headless: false,
    args: [`--width=${WINDOW.width}`, `--height=${WINDOW.height}`],
    env: {
      ...process.env,
      HOME: process.env.PLAYWRIGHT_HOME || process.env.HOME || "/root",
      XAUTHORITY: process.env.XAUTHORITY || "",
      DISPLAY: process.env.DISPLAY
    }
  });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  const browserVersion = browser.version();
  const zoomMeasurement = {};
  const results = [];
  try {
    results.push(await runCook(page, base, zoomMeasurement, browserVersion));
    results.push(await runPantry(page, base, zoomMeasurement, browserVersion));
  } finally {
    await browser.close();
    server.close();
  }

  const payload = {
    plan: "PLAN-0005",
    testId: "TEST-0005-109",
    zoomTechnique: "native-ctrl-plus-xdotool",
    cssZoomForbidden: true,
    integratedMainSha: process.env.PLAN0005_INTEGRATED_SHA || "b94abd9a83fe29d88b095e3e9a42f10d01c05414",
    prHeadSha: process.env.PLAN0005_PR_HEAD_SHA || null,
    checkedOutCommitSha: process.env.PLAN0005_CHECKED_OUT_SHA || execSync("git rev-parse HEAD", { cwd: root, encoding: "utf8" }).trim(),
    evidenceGenerationSha: process.env.PLAN0005_EVIDENCE_GENERATION_SHA || process.env.PLAN0005_PR_HEAD_SHA || null,
    countingUnit: {
      testId: "TEST-0005-109",
      independentSubScenarios: ["Cook_pointer", "Cook_keyboard", "Pantry_pointer", "Pantry_keyboard"],
      note: "Each surface×modality is an independent sub-scenario; keyboard success does not upgrade pointer."
    },
    note: "Pointer and keyboard scored independently. Keyboard success does not upgrade pointer status. Native zoom only (no CSS zoom).",
    generatedAtUtc: new Date().toISOString(),
    zoomMeasurement,
    results
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(evidenceDir, "firefox-zoom-pointer-keyboard.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Firefox native zoom pointer/keyboard report → ${reportPath}`);

  const keyboardFail = results.some((r) => r.keyboard?.status === "Failed");
  const pointerFail = results.some((r) => r.pointer?.status === "Failed");
  if (keyboardFail) {
    console.error("Firefox keyboard operability Failed — hard gate.");
    process.exit(1);
  }
  // Pointer failure is recorded; issue disposition happens after evidence review.
  if (pointerFail) {
    console.warn("Firefox native-zoom pointer Failed with keyboard Passed — see evidence for #21/#22 disposition.");
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
