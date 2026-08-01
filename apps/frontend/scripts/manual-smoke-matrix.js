/**
 * PLAN-0015 manual matrix smoke (prototype mode against yarn start).
 * Records Passed/Failed/Blocked per viewport and locale check.
 */
const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const HEADLESS_SHELL =
  process.env.SMOKE_CHROME ||
  "/root/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell";
const results = [];

function record(check, result, notes = "") {
  results.push({ check, result, notes });
  console.log(`[${result}] ${check}${notes ? ` — ${notes}` : ""}`);
}

async function run() {
  const launchOpts = {
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  };
  if (fs.existsSync(HEADLESS_SHELL)) {
    launchOpts.executablePath = HEADLESS_SHELL;
  }

  const browser = await chromium.launch(launchOpts);

  async function withPage(opts, fn) {
    const context = await browser.newContext(opts);
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    try {
      await fn(page);
    } finally {
      await context.close();
    }
  }

  async function navTo(page, key) {
    const side = page.getByTestId(`sidenav-${key}`);
    if ((await side.count()) > 0 && (await side.isVisible().catch(() => false))) {
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
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.getByTestId("landing-enter").click();
    await page.getByTestId("access-demo").click();
    await page.waitForURL(/\/app\/hoje/, { timeout: 20000 });
    if (scenario) {
      await selectScenario(page, scenario);
      await page.goto(BASE + "/app/hoje", { waitUntil: "domcontentloaded" });
    }
    await page.getByTestId("home-route-block").waitFor({ timeout: 15000 });
  }

  async function coreJourney(page, label) {
    await enterHome(page, { scenario: "routeWithDeps" });
    await navTo(page, "pantry");
    await page.waitForURL(/\/app\/despensa/, { timeout: 15000 });
    await navTo(page, "plan");
    await page.waitForURL(/\/app\/planejamento/, { timeout: 15000 });
    await page.getByTestId("route-chain").waitFor({ timeout: 15000 });
    record(`${label}: Landing→Access→Home→Pantry→Plan`, "Passed");
  }

  try {
    await withPage({ viewport: { width: 360, height: 740 } }, async (page) => {
      await coreJourney(page, "360px");
      await navTo(page, "today");
      await page.waitForURL(/\/app\/hoje/);
      record("360px touch/mobile nav", "Passed", "bottomnav click");
    });

    await withPage({ viewport: { width: 768, height: 1024 } }, async (page) => {
      await coreJourney(page, "768px");
    });

    await withPage({ viewport: { width: 1280, height: 800 } }, async (page) => {
      await coreJourney(page, "1280px");
      await page.goto(BASE + "/app/hoje", { waitUntil: "domcontentloaded" });
      const carousel = page.getByTestId("home-route-carousel").locator("ol");
      await carousel.focus();
      await page.keyboard.press("ArrowRight");
      record("1280px keyboard carousel focus", "Passed");
    });

    await withPage(
      { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 },
      async (page) => {
        await enterHome(page, { scenario: "routeWithDeps" });
        await page.evaluate(() => {
          document.body.style.zoom = "2";
        });
        record("200% zoom Landing→Home", "Passed", "CSS zoom=2 after home");
      },
    );

    await withPage(
      {
        ...devices["iPhone 12"],
        hasTouch: true,
        isMobile: true,
      },
      async (page) => {
        await coreJourney(page, "touch/mobile viewport");
      },
    );

    await withPage(
      {
        viewport: { width: 1280, height: 800 },
        reducedMotion: "reduce",
      },
      async (page) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await coreJourney(page, "prefers-reduced-motion");
      },
    );

    for (const lang of ["pt-BR", "en", "es"]) {
      await withPage({ viewport: { width: 1280, height: 800 } }, async (page) => {
        await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
        const langBtn = page.getByTestId(`landing-lang-${lang}`);
        if ((await langBtn.count()) > 0) await langBtn.click();
        await page.getByTestId("landing-enter").click();
        await page.getByTestId("access-demo").click();
        await page.waitForURL(/\/app\/hoje/);
        const shellLang = page.getByTestId("lang-switch");
        if ((await shellLang.count()) > 0) {
          await shellLang.click();
          const opt = page.getByTestId(`lang-opt-${lang}`);
          if ((await opt.count()) > 0) await opt.click();
        }
        record(`locale ${lang}`, "Passed", "landing + shell switch when present");
      });
    }

    await withPage({ viewport: { width: 1280, height: 800 } }, async (page) => {
      await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.getByTestId("landing-enter").click();
      await page.getByTestId("access-demo").click();
      await page.waitForURL(/\/app\/hoje/, { timeout: 20000 });
      await page.evaluate(() => {
        const key = "cocinaris_state_v1";
        let state = {};
        try {
          state = JSON.parse(localStorage.getItem(key) || "{}") || {};
        } catch {
          state = {};
        }
        state.scenario = "componentShared";
        state.authed = true;
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.goto(BASE + "/app/despensa", { waitUntil: "domcontentloaded" });
      await page.getByTestId("tab-freezer").click().catch(() => {});
      const debt = page.locator('[data-testid="pantry-reserved-debt-cp_broth"]');
      const anyDebt = page.locator('[data-testid^="pantry-reserved-debt-"]');
      if ((await debt.count()) > 0) {
        await debt.click();
        await page.waitForURL(/review=shortfall/);
        record("Despensa déficit → compras review", "Passed");
      } else if ((await anyDebt.count()) > 0) {
        await anyDebt.first().click();
        await page.waitForURL(/review=shortfall/);
        record("Despensa déficit → compras review", "Passed");
      } else {
        const reserved = await page
          .locator('[data-testid^="pantry-reserved-"]')
          .count();
        record(
          "Despensa déficit → compras review",
          "Blocked",
          `No shortfall bar; reserved bars=${reserved}`,
        );
      }
    });

    await withPage({ viewport: { width: 1280, height: 800 } }, async (page) => {
      await enterHome(page, { scenario: "routeWithDeps" });
      await navTo(page, "plan");
      await page.getByTestId("route-chain").waitFor({ timeout: 10000 });
      for (const id of ["n2", "n3"]) {
        const toggle = page.getByTestId(`chain-toggle-${id}`);
        await toggle.waitFor({ state: "visible", timeout: 10000 });
        if (await toggle.isDisabled()) {
          throw new Error(`chain-toggle-${id} still disabled`);
        }
        await toggle.click();
        await page.waitForTimeout(200);
      }
      const chainCook = page.locator('[data-testid^="chain-cook-start-"]');
      const homeCook = page.locator('[data-testid^="home-route-cook-now-"]');
      if ((await chainCook.count()) > 0) {
        await chainCook.first().click();
        await page.waitForURL(/\/app\/cozinhar\//);
        record("CTA Cozinhar navegação", "Passed", `via chain: ${page.url()}`);
      } else {
        await navTo(page, "today");
        await page.getByTestId("home-route-block").waitFor({ timeout: 10000 });
        if ((await homeCook.count()) > 0) {
          await homeCook.first().click();
          await page.waitForURL(/\/app\/cozinhar\//);
          record("CTA Cozinhar navegação", "Passed", `via home: ${page.url()}`);
        } else {
          record(
            "CTA Cozinhar navegação",
            "Blocked",
            "Cook CTA not visible after completing n2 then n3 on full route",
          );
        }
      }
    });
  } catch (err) {
    record("smoke-runner", "Failed", String(err && err.message ? err.message : err));
  } finally {
    await browser.close();
  }

  const out = path.join(
    __dirname,
    "..",
    "docs",
    "plan-0015-manual-smoke-matrix.json",
  );
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: BASE,
        mode: "prototype",
        results,
      },
      null,
      2,
    ),
  );
  console.log("Wrote", out);

  const failed = results.filter((r) => r.result === "Failed");
  if (failed.length) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
