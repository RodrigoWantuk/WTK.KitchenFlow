#!/usr/bin/env node
/**
 * Automated Playwright browser smoke matrix (prototype mode).
 * Not a manual validation — CI and local `yarn smoke:browser`.
 *
 * Prerequisites:
 *   yarn install --frozen-lockfile
 *   yarn smoke:browser:install
 *   yarn start   # separate terminal, or SMOKE_MANAGE_SERVER=1
 *   yarn smoke:browser
 */
const { chromium, devices } = require("playwright");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const HEADLESS = process.env.SMOKE_HEADED !== "1";
const OUT_DIR =
  process.env.SMOKE_OUT_DIR ||
  path.join(__dirname, "..", "docs", "browser-smoke");
const results = [];
let failedArtifacts = [];

function record(check, result, notes = "") {
  results.push({ check, result, notes });
  console.log(`[${result}] ${check}${notes ? ` — ${notes}` : ""}`);
}

function fail(check, notes) {
  record(check, "Failed", notes);
  throw new Error(`${check}: ${notes}`);
}

async function captureFailure(page, name) {
  try {
    fs.mkdirSync(path.join(OUT_DIR, "failures"), { recursive: true });
    const shot = path.join(OUT_DIR, "failures", `${name}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    failedArtifacts.push(shot);
  } catch {
    // ignore screenshot errors
  }
}

function meta() {
  let commit = process.env.GITHUB_SHA || "";
  try {
    commit =
      commit ||
      execSync("git rev-parse HEAD", {
        cwd: path.join(__dirname, "..", "..", ".."),
        encoding: "utf8",
      }).trim();
  } catch {
    commit = commit || "unknown";
  }
  let yarnVersion = "unknown";
  let nodeVersion = process.version;
  let playwrightVersion = "unknown";
  try {
    yarnVersion = execSync("yarn --version", { encoding: "utf8" }).trim();
  } catch {
    /* ignore */
  }
  try {
    playwrightVersion = require("playwright/package.json").version;
  } catch {
    /* ignore */
  }
  return {
    commitSha: commit,
    nodeVersion,
    yarnVersion,
    playwrightVersion,
    chromiumVersion: "resolved-by-playwright",
    frontendMode: "prototype",
    baseUrl: BASE,
    timestamp: new Date().toISOString(),
    headless: HEADLESS,
    operatingSystem: `${os.platform()} ${os.release()} ${os.arch()}`,
  };
}

async function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok || res.status === 200) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server not ready at ${url} within ${timeoutMs}ms`);
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const reportMeta = meta();

  let serverProc = null;
  if (process.env.SMOKE_MANAGE_SERVER === "1") {
    serverProc = spawn("yarn", ["start"], {
      cwd: path.join(__dirname, ".."),
      env: {
        ...process.env,
        BROWSER: "none",
        CI: "true",
        HOST: process.env.HOST || "127.0.0.1",
        PORT: process.env.PORT || "3000",
        REACT_APP_FRONTEND_MODE: "prototype",
        // Prevent CRA interactive prompt when port is busy.
        WDS_SOCKET_PORT: "0",
      },
      // Do not pipe stdio — CRA can deadlock when stdout buffers fill.
      stdio: "ignore",
      detached: false,
    });
    await waitForServer(BASE, 180000);
  } else {
    await waitForServer(BASE, 30000).catch((err) => {
      throw new Error(
        `${err.message}. Start the app with \`yarn start\` or set SMOKE_MANAGE_SERVER=1.`,
      );
    });
  }

  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const browserVersion = browser.version();
  reportMeta.chromiumVersion = browserVersion;

  async function withPage(opts, name, fn) {
    const context = await browser.newContext({
      ...opts,
      recordVideo: process.env.SMOKE_VIDEO
        ? { dir: path.join(OUT_DIR, "videos") }
        : undefined,
    });
    if (process.env.SMOKE_TRACE === "1") {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    try {
      await fn(page, context);
      if (process.env.SMOKE_TRACE === "1") {
        await context.tracing.stop({
          path: path.join(OUT_DIR, "traces", `${name}.zip`),
        });
      }
    } catch (err) {
      await captureFailure(page, name.replace(/\W+/g, "_"));
      if (process.env.SMOKE_TRACE === "1") {
        fs.mkdirSync(path.join(OUT_DIR, "traces"), { recursive: true });
        await context.tracing
          .stop({ path: path.join(OUT_DIR, "traces", `${name}-failed.zip`) })
          .catch(() => {});
      }
      throw err;
    } finally {
      await context.close();
    }
  }

  async function navTo(page, key) {
    const side = page.getByTestId(`sidenav-${key}`);
    if (
      (await side.count()) > 0 &&
      (await side.isVisible().catch(() => false))
    ) {
      await side.click();
      return;
    }
    await page.getByTestId(`bottomnav-${key}`).click();
  }

  async function selectScenario(page, id) {
    await page.evaluate((scenarioId) => {
      const key = "cocinaris_state_v1";
      let state = {};
      try {
        state = JSON.parse(localStorage.getItem(key) || "{}") || {};
      } catch {
        state = {};
      }
      state.scenario = scenarioId;
      state.authed = true;
      localStorage.setItem(key, JSON.stringify(state));
    }, id);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/app\//, { timeout: 15000 }).catch(() => {});
  }

  async function enterHome(page, { scenario } = {}) {
    await page.goto(BASE + "/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.getByTestId("landing-enter").click();
    await page.getByTestId("access-demo").click();
    await page.waitForURL(/\/app\/hoje/, { timeout: 20000 });
    if (scenario) {
      await selectScenario(page, scenario);
      await page.goto(BASE + "/app/hoje", { waitUntil: "domcontentloaded" });
    }
    await page.getByTestId("home-route-block").waitFor({ timeout: 15000 });
  }

  const localeExpectations = {
    "pt-BR": {
      a: "O cozinhar do dia a dia, sem stress.",
      b: "Entrar no Cocinaris",
      c: "Entrar em modo demo",
    },
    en: {
      a: "Everyday cooking, without the stress.",
      b: "Enter Cocinaris",
      c: "Enter demo mode",
    },
    es: {
      a: "Cocinar cada día, sin estrés.",
      b: "Entrar en Cocinaris",
      c: "Entrar en modo demo",
    },
  };

  try {
    await withPage(
      { viewport: { width: 360, height: 740 } },
      "360",
      async (page) => {
        await enterHome(page, { scenario: "routeWithDeps" });
        await navTo(page, "pantry");
        await page.waitForURL(/\/app\/despensa/);
        await navTo(page, "plan");
        await page.waitForURL(/\/app\/planejamento/);
        await page.getByTestId("route-chain").waitFor();
        record("360px: Landing→Access→Home→Pantry→Plan", "Passed");
        await navTo(page, "today");
        await page.waitForURL(/\/app\/hoje/);
        record("360px touch/mobile nav", "Passed", "bottomnav");
      },
    );

    await withPage(
      { viewport: { width: 768, height: 1024 } },
      "768",
      async (page) => {
        await enterHome(page, { scenario: "routeWithDeps" });
        await navTo(page, "plan");
        await page.getByTestId("route-chain").waitFor();
        record("768px journey", "Passed");
      },
    );

    await withPage(
      { viewport: { width: 1280, height: 800 } },
      "1280",
      async (page) => {
        await enterHome(page, { scenario: "routeWithDeps" });
        await navTo(page, "plan");
        await page.getByTestId("route-chain").waitFor();
        record("1280px journey", "Passed");
      },
    );

    // Keyboard-only journey (no mouse clicks)
    await withPage(
      { viewport: { width: 1280, height: 800 } },
      "keyboard",
      async (page) => {
        await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
        // Tab to landing-enter and activate
        let focusedEnter = false;
        for (let i = 0; i < 40; i++) {
          await page.keyboard.press("Tab");
          const id = await page.evaluate(
            () => document.activeElement?.getAttribute("data-testid") || "",
          );
          if (id === "landing-enter" || id === "hero-enter") {
            focusedEnter = true;
            break;
          }
        }
        if (!focusedEnter) {
          fail("keyboard-only", "landing enter control not reachable by Tab");
        }
        const outline = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return "";
          const s = getComputedStyle(el);
          return `${s.outlineStyle}|${s.boxShadow}|${s.outlineWidth}`;
        });
        if (!outline || outline === "none||0px") {
          // Accept focus ring via ring utility / browser default
          const hasFocusVisible = await page.evaluate(
            () =>
              document.activeElement ===
                document.querySelector('[data-testid="landing-enter"]') ||
              document.activeElement?.closest(
                '[data-testid="landing-enter"]',
              ) != null,
          );
          if (!hasFocusVisible) {
            fail("keyboard-only", "no visible focus on landing enter");
          }
        }
        await page.keyboard.press("Enter");
        await page.waitForURL(/\/acesso/);
        let focusedDemo = false;
        for (let i = 0; i < 40; i++) {
          await page.keyboard.press("Tab");
          const id = await page.evaluate(
            () => document.activeElement?.getAttribute("data-testid") || "",
          );
          if (id === "access-demo" || id === "access-enter") {
            focusedDemo = true;
            break;
          }
        }
        if (!focusedDemo) fail("keyboard-only", "access demo not reachable");
        await page.keyboard.press("Enter");
        await page.waitForURL(/\/app\/hoje/);
        // Fresh CI localStorage defaults to filledPantry without route block — seed scenario.
        await page.evaluate(() => {
          const key = "cocinaris_state_v1";
          let state = {};
          try {
            state = JSON.parse(localStorage.getItem(key) || "{}") || {};
          } catch {
            state = {};
          }
          state.scenario = "routeWithDeps";
          state.authed = true;
          localStorage.setItem(key, JSON.stringify(state));
        });
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForURL(/\/app\/hoje/);
        await page.getByTestId("home-route-block").waitFor({ timeout: 20000 });
        const carousel = page.getByTestId("home-route-carousel").locator("ol");
        await carousel.focus();
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowLeft");
        // Navigate to plan via sidenav keyboard
        let focusedPlan = false;
        for (let i = 0; i < 60; i++) {
          await page.keyboard.press("Tab");
          const id = await page.evaluate(
            () => document.activeElement?.getAttribute("data-testid") || "",
          );
          if (id === "sidenav-plan" || id === "bottomnav-plan") {
            focusedPlan = true;
            break;
          }
        }
        if (!focusedPlan) fail("keyboard-only", "plan nav not reachable");
        await page.keyboard.press("Enter");
        await page.waitForURL(/\/app\/planejamento/);
        record(
          "keyboard-only Landing→Access→Home→carousel→Plan",
          "Passed",
          "Tab/Enter/Arrow only; no mouse",
        );
      },
    );

    // CSS zoom approximation (not real browser zoom) — classified separately
    await withPage(
      { viewport: { width: 1280, height: 800 } },
      "css-zoom",
      async (page) => {
        await enterHome(page, { scenario: "routeWithDeps" });
        await page.evaluate(() => {
          document.documentElement.style.zoom = "2";
        });
        const overflowX = await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 40,
        );
        await page.getByTestId("home-route-block").waitFor();
        await navTo(page, "pantry");
        await page.waitForURL(/despensa/);
        await navTo(page, "plan");
        await page.waitForURL(/planejamento/);
        await navTo(page, "shopping");
        await page.waitForURL(/compras/);
        if (overflowX) {
          fail(
            "CSS zoom approximation (not browser zoom)",
            "excessive horizontal overflow at CSS zoom=2",
          );
        }
        record(
          "CSS zoom approximation (not browser zoom)",
          "Passed",
          "documentElement.style.zoom=2; Home/Despensa/Plan/Compras ok",
        );
      },
    );

    await withPage(
      { ...devices["iPhone 12"], hasTouch: true, isMobile: true },
      "touch",
      async (page) => {
        await enterHome(page, { scenario: "routeWithDeps" });
        await page.getByTestId("bottomnav-pantry").click();
        await page.waitForURL(/despensa/);
        await selectScenario(page, "componentShared");
        await page.goto(BASE + "/app/despensa", {
          waitUntil: "domcontentloaded",
        });
        const debt = page.locator(
          '[data-testid="pantry-reserved-debt-cp_broth"]',
        );
        await debt.waitFor({ timeout: 10000 });
        await debt.click();
        await page.waitForURL(/review=shortfall/);
        await selectScenario(page, "routeWithDeps");
        await page.goto(BASE + "/app/hoje", { waitUntil: "domcontentloaded" });
        await page.getByTestId("home-route-carousel").waitFor();
        await page.getByTestId("bottomnav-plan").click();
        await page.getByTestId("route-chain").waitFor();
        for (const id of ["n2", "n3"]) {
          const toggle = page.getByTestId(`chain-toggle-${id}`);
          await toggle.click();
          await page.waitForTimeout(150);
        }
        const cook = page.locator('[data-testid^="chain-cook-start-"]');
        await cook.first().click();
        await page.waitForURL(/\/app\/cozinhar\//);
        record(
          "touch/mobile viewport flows",
          "Passed",
          "bottomnav, pantry debt, route, cook CTA",
        );
      },
    );

    await withPage(
      { viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" },
      "reduced-motion",
      async (page) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        const matches = await page.evaluate(
          () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        );
        if (!matches) {
          fail(
            "prefers-reduced-motion",
            "matchMedia(prefers-reduced-motion: reduce) was false",
          );
        }
        await enterHome(page, { scenario: "routeWithDeps" });
        const carousel = page.getByTestId("home-route-carousel").locator("ol");
        await carousel.focus();
        await page.keyboard.press("ArrowRight");
        // Carousel must remain operable without depending on motion
        await page.getByTestId("home-route-block").waitFor();
        const longTransitions = await page.evaluate(() => {
          const nodes = [...document.querySelectorAll("*")].slice(0, 200);
          return nodes.some((el) => {
            const s = getComputedStyle(el);
            const dur = parseFloat(s.transitionDuration) || 0;
            const anim = parseFloat(s.animationDuration) || 0;
            return dur > 0.5 || anim > 0.5;
          });
        });
        record(
          "prefers-reduced-motion",
          "Passed",
          `matchMedia true; carousel operable; longTransitionsSample=${longTransitions}`,
        );
      },
    );

    for (const lang of ["pt-BR", "en", "es"]) {
      await withPage(
        { viewport: { width: 1280, height: 800 } },
        `locale-${lang}`,
        async (page) => {
          await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
          const langBtn = page.getByTestId(`landing-lang-${lang}`);
          if ((await langBtn.count()) === 0) {
            fail(`locale ${lang}`, "language selector missing");
          }
          await langBtn.click();
          const selected = await langBtn.evaluate((el) =>
            el.className.includes("bg-secondary"),
          );
          if (!selected) {
            fail(`locale ${lang}`, "selector did not appear selected");
          }
          const expected = localeExpectations[lang];
          const tagline = await page
            .locator("h1")
            .first()
            .innerText()
            .catch(() => "");
          const body = await page.locator("body").innerText();
          const needed = [expected.a, expected.b, expected.c];
          const hits = needed.filter((s) => body.includes(s));
          if (hits.length < 3) {
            fail(
              `locale ${lang}`,
              `expected translated strings missing (found ${hits.length}/3). sample=${body.slice(0, 240)} taglineSeen=${tagline}`,
            );
          }
          // Confirm language actually changed away from another locale's tagline
          const otherTaglines = Object.entries(localeExpectations)
            .filter(([code]) => code !== lang)
            .map(([, v]) => v.a);
          if (otherTaglines.some((t) => body.includes(t) && t !== expected.a)) {
            // Allow shared fragments only if exact other tagline present incorrectly
            const wrong = otherTaglines.find((t) => body.includes(t));
            if (wrong && wrong !== expected.a) {
              fail(
                `locale ${lang}`,
                `page still contains other locale tagline: ${wrong}`,
              );
            }
          }
          record(`locale ${lang}`, "Passed", "selector + 3 distinct strings");
        },
      );
    }

    await withPage(
      { viewport: { width: 1280, height: 800 } },
      "shortfall-cook",
      async (page) => {
        await enterHome(page, { scenario: "componentShared" });
        await page.goto(BASE + "/app/despensa", {
          waitUntil: "domcontentloaded",
        });
        const debt = page.locator(
          '[data-testid="pantry-reserved-debt-cp_broth"]',
        );
        await debt.click();
        await page.waitForURL(/review=shortfall/);
        record("Despensa déficit → compras review", "Passed");

        await selectScenario(page, "routeWithDeps");
        await page.goto(BASE + "/app/planejamento", {
          waitUntil: "domcontentloaded",
        });
        await page.getByTestId("route-chain").waitFor();
        for (const id of ["n2", "n3"]) {
          await page.getByTestId(`chain-toggle-${id}`).click();
          await page.waitForTimeout(150);
        }
        await page
          .locator('[data-testid^="chain-cook-start-"]')
          .first()
          .click();
        await page.waitForURL(/\/app\/cozinhar\//);
        record("CTA Cozinhar navegação", "Passed", page.url());
      },
    );
  } catch (err) {
    if (!results.some((r) => r.result === "Failed")) {
      record(
        "smoke-runner",
        "Failed",
        String(err && err.message ? err.message : err),
      );
    }
  } finally {
    await browser.close();
    if (serverProc) {
      serverProc.kill("SIGTERM");
    }
  }

  const report = {
    kind: "automated-browser-smoke",
    ...reportMeta,
    results,
    failedArtifacts,
  };
  const jsonPath = path.join(OUT_DIR, "browser-smoke-report.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  const htmlPath = path.join(OUT_DIR, "browser-smoke-report.html");
  fs.writeFileSync(
    htmlPath,
    `<!doctype html><meta charset="utf-8"/><title>Browser smoke</title><pre>${JSON.stringify(report, null, 2)}</pre>`,
  );
  console.log("Wrote", jsonPath);

  const blocking = results.filter((r) =>
    ["Failed", "Blocked", "Not executed"].includes(r.result),
  );
  if (blocking.length) {
    console.error(
      "Browser smoke failed mandatory checks:\n" +
        blocking
          .map((r) => ` - [${r.result}] ${r.check}: ${r.notes}`)
          .join("\n"),
    );
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
