#!/usr/bin/env node
/**
 * PLAN-0016 fail-closed Firefox native ~200% zoom — pointer vs keyboard.
 *
 * - Headed Firefox under Xvfb + real Ctrl+0 / Ctrl+Plus (xdotool)
 * - No CSS zoom, no viewport-resize substitute, no Playwright force, no JS .click()
 * - Pointer and keyboard scored independently (keyboard never upgrades pointer)
 * - Unsupported / incomplete environment → non-zero exit (never reported as Passed)
 *
 * Firefox full-page zoom elevates devicePixelRatio (1 → ~2 at 200%). Playwright's
 * locator.click maps points incorrectly in that state. Pointer activation therefore:
 *   1) scrollIntoView(center)
 *   2) require document.elementFromPoint(center) to hit the target (real overlay → Fail)
 *   3) page.mouse click at CSS_center * devicePixelRatio (lands on the target)
 */
const { firefox } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { execSync } = require("node:child_process");

const root = path.resolve(__dirname, "../../..");
const evidenceDir = process.env.PLAN0016_FIREFOX_EVIDENCE_DIR
  ? path.resolve(process.env.PLAN0016_FIREFOX_EVIDENCE_DIR)
  : path.join(root, "docs/evidence/plan-0016/remediation-after-plan-0018");
const reportPath = path.join(evidenceDir, "firefox-zoom-pointer-keyboard.json");
const prototypeDir = path.join(root, "apps/frontend/build-prototype");
const port = Number(process.env.PLAN0016_ZOOM_PORT || 4180);
const WINDOW = { width: 1280, height: 720 };
const WIDTH_RATIO_MIN = 1.9;
const WIDTH_RATIO_MAX = 2.1;

function ensureBuild(dir, label) {
  if (!fs.existsSync(path.join(dir, "index.html"))) {
    throw new Error(`${label} build missing at ${dir}. Run yarn build:prototype first.`);
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
      /* keep */
    }
  }
  if (!ids.length) throw new Error(`No visible window matching ${classPattern}`);
  const id = ids[ids.length - 1];
  try {
    xdotool(`windowactivate --sync ${id}`);
  } catch {
    try {
      xdotool(`windowfocus --sync ${id}`);
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
      ".woff2": "font/woff2",
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
  await page.goto(`${base}/acesso`, { waitUntil: "domcontentloaded" });
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
  }
}

async function applyNativeFirefoxZoom200(page) {
  const cssZoom = await page.evaluate(() => ({
    html: document.documentElement.style.zoom || "",
    body: document.body.style.zoom || "",
  }));
  if (cssZoom.html || cssZoom.body) {
    throw new Error(`CSS zoom present (html=${cssZoom.html}, body=${cssZoom.body}); native zoom required`);
  }

  await page.bringToFront();
  await page.mouse.click(40, 40);
  await wait(300);
  const windowId = activateBrowserWindow("firefox|Navigator", "127.0.0.1");
  await wait(200);
  sendKeysToWindow(windowId, "ctrl+0");
  await wait(400);
  const baselineInnerWidthAt100 = await page.evaluate(() => window.innerWidth);
  const baselineDpr = await page.evaluate(() => window.devicePixelRatio);
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
      sendKeysToWindow(wid, "ctrl+minus");
      numberOfZoomOutActions += 1;
      await wait(350);
      zoomedInnerWidth = await page.evaluate(() => window.innerWidth);
      break;
    }
  }
  zoomedInnerWidth = await page.evaluate(() => window.innerWidth);
  const zoomedDpr = await page.evaluate(() => window.devicePixelRatio);
  const widthRatio = zoomedInnerWidth > 0 ? baselineInnerWidthAt100 / zoomedInnerWidth : null;
  const ratioOk =
    typeof widthRatio === "number" && widthRatio >= WIDTH_RATIO_MIN && widthRatio <= WIDTH_RATIO_MAX;
  if (!ratioOk) {
    throw new Error(
      `Native Firefox zoom not confirmed (widthRatio=${widthRatio}; require ${WIDTH_RATIO_MIN}–${WIDTH_RATIO_MAX})`,
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
    baselineDevicePixelRatio: baselineDpr,
    zoomedDevicePixelRatio: zoomedDpr,
    viewport: WINDOW,
  };
}

/**
 * Real pointer activation that lands on the target under Firefox zoom-elevated DPR.
 */
async function pointerAttempt(page, locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest" }));
  await wait(250);

  const probe = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy);
    const hitsTarget = !!(top && (top === el || el.contains(top)));
    const describe = (node) => {
      if (!node || node.nodeType !== 1) return null;
      return {
        tag: node.tagName,
        testId: node.getAttribute("data-testid"),
        className: String(node.className || "").slice(0, 120),
      };
    };
    return {
      cx,
      cy,
      dpr: window.devicePixelRatio,
      hitsTarget,
      top: describe(top),
      rect: { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right },
      viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
    };
  });

  if (!probe.hitsTarget) {
    return {
      status: "Failed",
      detail: "elementFromPoint(center) does not hit target — real overlay or geometry defect",
      interceptor: probe.top,
      probe,
    };
  }

  // Firefox native zoom raises devicePixelRatio; Playwright mouse coordinates must be scaled.
  await page.mouse.click(probe.cx * probe.dpr, probe.cy * probe.dpr);
  return {
    status: "Passed",
    detail: `pointer mouse click at CSS center × dpr (${probe.dpr}) after elementFromPoint hit`,
    interceptor: null,
    probe,
  };
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

async function runScenario(page, base, { scenario, label, route, selector, expectedPathPrefix }, zoomMeasurement, browserVersion) {
  await ensurePrototypeDemo(page, base);
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  Object.assign(zoomMeasurement, await applyNativeFirefoxZoom200(page));
  const target = page.locator(selector).first();
  if (!(await target.count())) {
    return {
      scenario,
      label,
      browser: "firefox",
      browserVersion,
      zoom: "native-approx-200pct",
      zoomMeasurement: { ...zoomMeasurement },
      pointer: { status: "Failed", detail: `${selector} missing on ${route}` },
      keyboard: { status: "Failed", detail: `${selector} missing on ${route}` },
    };
  }

  const beforePointer = page.url();
  const pointer = await pointerAttempt(page, target);
  await wait(800);
  const afterPointer = page.url();
  const pointerNavigated = afterPointer !== beforePointer && afterPointer.includes(expectedPathPrefix);
  const pointerStatus = pointer.status === "Passed" && pointerNavigated ? "Passed" : "Failed";

  await ensurePrototypeDemo(page, base);
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  Object.assign(zoomMeasurement, await applyNativeFirefoxZoom200(page));
  const target2 = page.locator(selector).first();
  const beforeKeyboard = page.url();
  const keyboard = await keyboardAttempt(target2, page);
  await wait(800);
  const afterKeyboard = page.url();
  const keyboardNavigated = afterKeyboard !== beforeKeyboard && afterKeyboard.includes(expectedPathPrefix);
  const keyboardStatus = keyboard.status === "Passed" && keyboardNavigated ? "Passed" : "Failed";

  return {
    scenario,
    label,
    browser: "firefox",
    browserVersion,
    zoom: "native-approx-200pct",
    zoomMeasurement: { ...zoomMeasurement },
    pointer: {
      status: pointerStatus,
      detail: pointerNavigated ? pointer.detail : `${pointer.detail}; url ${beforePointer} → ${afterPointer}`,
      interceptor: pointer.interceptor,
      beforeUrl: beforePointer,
      afterUrl: afterPointer,
      probe: pointer.probe || null,
    },
    keyboard: {
      status: keyboardStatus,
      detail: keyboard.detail,
      beforeUrl: beforeKeyboard,
      afterUrl: afterKeyboard,
    },
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
  fs.mkdirSync(evidenceDir, { recursive: true });

  const server = await startStaticServer(prototypeDir, port);
  const base = `http://127.0.0.1:${port}`;
  const launchEnv = {
    ...process.env,
    HOME: process.env.PLAYWRIGHT_HOME || process.env.HOME || "/root",
    DISPLAY: process.env.DISPLAY,
  };
  if (Object.prototype.hasOwnProperty.call(process.env, "PLAYWRIGHT_XAUTHORITY")) {
    launchEnv.XAUTHORITY = process.env.PLAYWRIGHT_XAUTHORITY;
  }
  const browser = await firefox.launch({
    headless: false,
    args: [`--width=${WINDOW.width}`, `--height=${WINDOW.height}`],
    firefoxUserPrefs: {
      "security.sandbox.content.level": 0,
    },
    env: launchEnv,
  });
  if (!String(browser.version()).length) {
    throw new Error("Firefox version unavailable — refusing Chromium substitute");
  }
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  const browserVersion = browser.version();
  const zoomMeasurement = {};
  const results = [];
  try {
    results.push(
      await runScenario(
        page,
        base,
        {
          scenario: "Cook_CTA",
          label: "Firefox native 200% — Cook CTA",
          route: "/app/hoje",
          selector: '[data-testid="sugg-open-r2"]',
          expectedPathPrefix: "/app/receitas/",
        },
        zoomMeasurement,
        browserVersion,
      ),
    );
    results.push(
      await runScenario(
        page,
        base,
        {
          scenario: "Pantry_item",
          label: "Firefox native 200% — Pantry item",
          route: "/app/despensa",
          selector: "[data-testid^=pantry-item-link-]",
          expectedPathPrefix: "/app/despensa/",
        },
        zoomMeasurement,
        browserVersion,
      ),
    );
  } finally {
    await browser.close();
    server.close();
  }

  const sha = execSync("git rev-parse HEAD", { cwd: root, encoding: "utf8" }).trim();
  const payload = {
    plan: "PLAN-0016",
    testId: "TEST-0005-109",
    zoomTechnique: "native-ctrl-plus-xdotool",
    cssZoomForbidden: true,
    browserEngineRequired: "firefox",
    exactShaUnderTest: sha,
    countingUnit: {
      testId: "TEST-0005-109",
      independentSubScenarios: ["Cook_pointer", "Cook_keyboard", "Pantry_pointer", "Pantry_keyboard"],
      note: "Each surface×modality is an independent sub-scenario; keyboard success does not upgrade pointer.",
    },
    note: "Pointer uses elementFromPoint gate + DPR-compensated Playwright mouse click (Firefox zoom raises devicePixelRatio). No locator.click, force, or keyboard fallback for pointer.",
    generatedAtUtc: new Date().toISOString(),
    zoomMeasurement,
    results,
    plan0016Interpretation: {
      Cook_pointer: results[0]?.pointer?.status,
      Cook_keyboard: results[0]?.keyboard?.status,
      Pantry_pointer: results[1]?.pointer?.status,
      Pantry_keyboard: results[1]?.keyboard?.status,
    },
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Firefox native zoom pointer/keyboard report → ${reportPath}`);
  console.log(JSON.stringify(payload.plan0016Interpretation, null, 2));

  const pointerFail = results.some((r) => r.pointer?.status !== "Passed");
  const keyboardFail = results.some((r) => r.keyboard?.status !== "Passed");
  if (pointerFail || keyboardFail) {
    console.error("Firefox native-zoom pointer/keyboard gate Failed.");
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
