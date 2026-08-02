#!/usr/bin/env node
/**
 * Diagnostic-only harness for PLAN-0016 #21/#22.
 * Headed Firefox + native Ctrl+0/Ctrl+Plus; captures elementFromPoint / interceptors.
 */
const { firefox } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { execSync } = require("node:child_process");

const root = path.resolve(__dirname, "../../..");
const outDir = path.join(root, "docs/evidence/plan-0016/remediation-after-plan-0018/diagnostics");
const prototypeDir = path.join(root, "apps/frontend/build-prototype");
const port = Number(process.env.DIAG_ZOOM_PORT || 4187);
const WINDOW = { width: 1280, height: 720 };
const WIDTH_RATIO_MIN = 1.9;
const WIDTH_RATIO_MAX = 2.1;

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
  }
}

async function applyNativeFirefoxZoom200(page) {
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
      await wait(350);
      zoomedInnerWidth = await page.evaluate(() => window.innerWidth);
      break;
    }
  }
  const widthRatio = baselineInnerWidthAt100 / zoomedInnerWidth;
  if (!(widthRatio >= WIDTH_RATIO_MIN && widthRatio <= WIDTH_RATIO_MAX)) {
    throw new Error(`Native zoom not confirmed widthRatio=${widthRatio}`);
  }
  return {
    baselineInnerWidthAt100,
    zoomedInnerWidth,
    widthRatio: Number(widthRatio.toFixed(4)),
    numberOfZoomInActions,
  };
}

async function captureHitTest(page, locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest" }));
  await wait(300);
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { missing: true };
    const r = el.getBoundingClientRect();
    const points = [
      ["center", r.left + r.width / 2, r.top + r.height / 2],
      ["tl", r.left + 4, r.top + 4],
      ["tr", r.right - 4, r.top + 4],
      ["bl", r.left + 4, r.bottom - 4],
      ["br", r.right - 4, r.bottom - 4],
      ["mid-left", r.left + 8, r.top + r.height / 2],
      ["mid-right", r.right - 8, r.top + r.height / 2],
    ];
    const describe = (node) => {
      if (!node || node.nodeType !== 1) return null;
      const cs = getComputedStyle(node);
      return {
        tag: node.tagName,
        id: node.id || null,
        testId: node.getAttribute("data-testid"),
        className: String(node.className || "").slice(0, 160),
        pointerEvents: cs.pointerEvents,
        position: cs.position,
        zIndex: cs.zIndex,
        opacity: cs.opacity,
        overflow: cs.overflow,
        transform: cs.transform,
      };
    };
    const samples = points.map(([name, x, y]) => {
      const top = document.elementFromPoint(x, y);
      let stack = [];
      if (document.elementsFromPoint) {
        stack = document.elementsFromPoint(x, y).slice(0, 8).map(describe);
      }
      const hitsTarget = !!(top && (top === el || el.contains(top)));
      return { name, x, y, hitsTarget, top: describe(top), stack };
    });
    const ancestors = [];
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const cs = getComputedStyle(cur);
      ancestors.push({
        tag: cur.tagName,
        testId: cur.getAttribute("data-testid"),
        className: String(cur.className || "").slice(0, 120),
        overflow: cs.overflow,
        overflowY: cs.overflowY,
        position: cs.position,
        zIndex: cs.zIndex,
        transform: cs.transform,
        pointerEvents: cs.pointerEvents,
      });
      cur = cur.parentElement;
    }
    const fixedOrSticky = [...document.querySelectorAll("body *")].filter((n) => {
      const p = getComputedStyle(n).position;
      return p === "fixed" || p === "sticky";
    }).map((n) => {
      const br = n.getBoundingClientRect();
      const cs = getComputedStyle(n);
      return {
        tag: n.tagName,
        testId: n.getAttribute("data-testid"),
        className: String(n.className || "").slice(0, 120),
        position: cs.position,
        zIndex: cs.zIndex,
        pointerEvents: cs.pointerEvents,
        rect: { top: br.top, left: br.left, bottom: br.bottom, right: br.right, width: br.width, height: br.height },
        overlapsCenter: br.left <= r.left + r.width / 2 && br.right >= r.left + r.width / 2 && br.top <= r.top + r.height / 2 && br.bottom >= r.top + r.height / 2,
      };
    });
    const bottomNav = document.querySelector("nav.fixed");
    const scenarioFab = document.querySelector('[class*="fixed"][class*="bottom-24"], button[class*="fixed"]');
    return {
      viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight, scrollX: window.scrollX, scrollY: window.scrollY, devicePixelRatio: window.devicePixelRatio },
      targetRect: { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height },
      targetStyle: describe(el),
      samples,
      ancestors: ancestors.slice(0, 12),
      fixedOrStickyOverlapping: fixedOrSticky.filter((f) => f.overlapsCenter),
      fixedOrStickyAll: fixedOrSticky,
      mobileBreakpointLikely: window.innerWidth < 768,
      bottomNavPresent: !!bottomNav,
      bottomNavRect: bottomNav ? (() => { const br = bottomNav.getBoundingClientRect(); return { top: br.top, bottom: br.bottom, height: br.height }; })() : null,
      scenarioFabPresent: !!document.querySelector('[data-testid="scenario-toggle"], .fixed.bottom-24'),
    };
  }, await locator.evaluate((el) => {
    const tid = el.getAttribute("data-testid");
    return tid ? `[data-testid="${tid}"]` : el.tagName.toLowerCase();
  }));
}

async function diagnose(page, base, route, selector, label) {
  await ensurePrototypeDemo(page, base);
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  const zoom = await applyNativeFirefoxZoom200(page);
  const locator = page.locator(selector).first();
  const before = await captureHitTest(page, locator);
  let clickError = null;
  try {
    await locator.click({ trial: true, timeout: 2500 });
    await locator.click({ timeout: 2500, force: false });
  } catch (e) {
    clickError = String(e.message || e).slice(0, 800);
  }
  await page.screenshot({ path: path.join(outDir, `${label}-before-nudge.png`), fullPage: false });
  // Small scroll nudge experiment
  await page.evaluate(() => window.scrollBy(0, 40));
  await wait(200);
  const afterNudge = await captureHitTest(page, locator);
  let clickAfterNudge = null;
  try {
    await locator.click({ trial: true, timeout: 2500 });
    await locator.click({ timeout: 2500, force: false });
    clickAfterNudge = "Passed";
  } catch (e) {
    clickAfterNudge = String(e.message || e).slice(0, 500);
  }
  await page.screenshot({ path: path.join(outDir, `${label}-after-nudge.png`), fullPage: false });
  return { label, route, selector, zoom, before, clickError, afterNudge, clickAfterNudge };
}

async function main() {
  if (!process.env.DISPLAY) throw new Error("DISPLAY unset");
  fs.mkdirSync(outDir, { recursive: true });
  const server = await startStaticServer(prototypeDir, port);
  const base = `http://127.0.0.1:${port}`;
  const browser = await firefox.launch({
    headless: false,
    args: [`--width=${WINDOW.width}`, `--height=${WINDOW.height}`],
    env: { ...process.env, HOME: process.env.HOME || "/root", DISPLAY: process.env.DISPLAY },
  });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  const reports = [];
  try {
    reports.push(await diagnose(page, base, "/app/hoje", '[data-testid="home-nav-pantry"]', "home-pantry-cta"));
    reports.push(await diagnose(page, base, "/app/despensa", "[data-testid^=pantry-item-link-]", "pantry-item"));
  } finally {
    await browser.close();
    server.close();
  }
  const out = path.join(outDir, "hit-test-report.json");
  fs.writeFileSync(out, JSON.stringify({ generatedAtUtc: new Date().toISOString(), reports }, null, 2));
  console.log(out);
  for (const r of reports) {
    console.log("\n===", r.label, "===");
    console.log("zoom", r.zoom);
    console.log("mobileBreakpointLikely", r.before.mobileBreakpointLikely);
    console.log("bottomNavPresent", r.before.bottomNavPresent, r.before.bottomNavRect);
    console.log("clickError", r.clickError);
    console.log("center hit", r.before.samples?.find((s) => s.name === "center"));
    console.log("overlapping fixed/sticky", r.before.fixedOrStickyOverlapping);
    console.log("clickAfterNudge", r.clickAfterNudge);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
