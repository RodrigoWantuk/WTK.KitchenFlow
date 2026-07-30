#!/usr/bin/env node

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const apiUrl = process.env.KITCHENFLOW_SMOKE_API_URL ?? "https://localhost:7443";
const browserPath = process.env.KITCHENFLOW_SMOKE_BROWSER ?? "google-chrome";
const allowUntrustedLocalCertificate = process.env.KITCHENFLOW_SMOKE_ALLOW_UNTRUSTED_LOCAL_CERTIFICATE === "1";
const browserSandboxArguments = process.getuid?.() === 0 ? ["--no-sandbox"] : [];
const users = [
  { username: process.env.KITCHENFLOW_SMOKE_USER_A ?? "inventory-user-a", password: process.env.KITCHENFLOW_SMOKE_PASSWORD_A },
  { username: process.env.KITCHENFLOW_SMOKE_USER_B ?? "inventory-user-b", password: process.env.KITCHENFLOW_SMOKE_PASSWORD_B }
];

if (users.some((user) => !user.password)) {
  process.stderr.write("KITCHENFLOW_SMOKE_PASSWORD_A and KITCHENFLOW_SMOKE_PASSWORD_B are required.\n");
  process.exit(2);
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitFor(check, description, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const result = await check();
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }
    await delay(200);
  }
  throw new Error(`Timed out waiting for ${description}${lastError ? `: ${lastError.message}` : ""}.`);
}

class DevToolsConnection {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    });
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", () => reject(new Error("Could not connect to Chrome DevTools.")), { once: true });
    });
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  async evaluate(expression, awaitPromise = true) {
    const result = await this.send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  }

  close() {
    this.socket.close();
  }
}

async function startBrowser(port) {
  const profile = await mkdtemp(join(tmpdir(), "kitchenflow-keycloak-smoke-"));
  const child = spawn(browserPath, [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    ...browserSandboxArguments,
    ...(allowUntrustedLocalCertificate ? ["--ignore-certificate-errors", "--allow-insecure-localhost"] : []),
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ], { stdio: "ignore" });

  try {
    await waitFor(async () => (await fetch(`http://127.0.0.1:${port}/json/version`)).ok, "Chrome DevTools");
    const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" }).then((response) => response.json());
    const connection = new DevToolsConnection(target.webSocketDebuggerUrl);
    await connection.open();
    await connection.send("Page.enable");
    if (allowUntrustedLocalCertificate) {
      await connection.send("Security.enable");
      await connection.send("Security.setIgnoreCertificateErrors", { ignore: true });
    }
    await connection.send("Page.navigate", { url: `${apiUrl}/health/live` });
    await waitFor(async () => (await connection.evaluate("location.href")).startsWith(apiUrl), "KitchenFlow HTTPS endpoint");
    return { child, connection, profile };
  } catch (error) {
    child.kill();
    await rm(profile, { recursive: true, force: true });
    throw error;
  }
}

async function stopBrowser(browser) {
  browser.connection.close();
  browser.child.kill();
  await Promise.race([
    new Promise((resolve) => browser.child.once("exit", resolve)),
    delay(5000)
  ]);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(browser.profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      return;
    } catch (error) {
      if (attempt === 4) {
        throw error;
      }
      await delay(200);
    }
  }
}

async function currentUrl(browser) {
  return browser.connection.evaluate("location.href");
}

async function currentLocationDescription(browser) {
  return browser.connection.evaluate("JSON.stringify({ url: `${location.protocol}//${location.host}${location.pathname}`, title: document.title, errorCode: document.body.innerText.match(/ERR_[A-Z_]+/)?.[0] ?? null })");
}

async function login(browser, user) {
  await browser.connection.evaluate(`document.body.innerHTML = '<form id="kitchenflow-login" method="post" action="/api/v1/auth/login"><input name="returnUrl" value="/"></form>'; document.getElementById("kitchenflow-login").submit();`, false);
  try {
    await waitFor(async () => {
      const url = await currentUrl(browser);
      return url.includes("/protocol/openid-connect/auth") || url.includes("/login-actions/authenticate");
    }, "Keycloak authorization page");
  } catch (error) {
    throw new Error(`${error.message} Current browser location: ${await currentLocationDescription(browser)}.`);
  }

  const username = JSON.stringify(user.username);
  const password = JSON.stringify(user.password);
  await waitFor(async () => browser.connection.evaluate("document.getElementById('username') !== null && document.getElementById('password') !== null && document.getElementById('kc-form-login') !== null"), "Keycloak credential form");
  await browser.connection.evaluate(`document.getElementById("username").value = ${username}; document.getElementById("password").value = ${password}; document.getElementById("kc-form-login").submit();`, false);
  try {
    await waitFor(async () => (await currentUrl(browser)).startsWith(apiUrl), "OIDC callback and KitchenFlow session", 45000);
  } catch (error) {
    throw new Error(`${error.message} Current browser location: ${await currentLocationDescription(browser)}.`);
  }

  const session = await browser.connection.evaluate("fetch('/api/v1/session', { credentials: 'include' }).then(async response => ({ status: response.status, body: await response.json() }))");
  if (session.status !== 200 || !session.body?.userId || !session.body?.csrfToken || Object.hasOwn(session.body, "accessToken") || Object.hasOwn(session.body, "refreshToken")) {
    throw new Error("The backend session response did not meet the cookie-session contract.");
  }
  return session.body;
}

async function createLot(browser, csrfToken) {
  const productName = `Keycloak smoke lot ${crypto.randomUUID()}`;
  const request = {
    productName,
    quantity: { measuredValue: 1.25, unit: "Gram", availabilityState: null },
    storageLocation: "Pantry",
    customLocation: null,
    packageState: null,
    printedExpirationDate: null,
    notes: null
  };
  const result = await browser.connection.evaluate(`fetch('/api/v1/inventory/lots', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': ${JSON.stringify(csrfToken)}, 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(${JSON.stringify(request)}) }).then(async response => ({ status: response.status, body: await response.json() }))`);
  if (result.status !== 201 || !result.body?.lotId) {
    throw new Error(`Create-lot request returned ${result.status}.`);
  }
  return result.body.lotId;
}

async function fetchStatus(browser, path) {
  return browser.connection.evaluate(`fetch(${JSON.stringify(path)}, { credentials: 'include' }).then(response => response.status)`);
}

let browsers = [];
try {
  browsers = [await startBrowser(9222), await startBrowser(9223)];
  const readyStatuses = await Promise.all(browsers.map((browser) => fetchStatus(browser, "/health/ready")));
  if (readyStatuses.some((status) => status !== 200)) {
    throw new Error(`KitchenFlow API is not ready at ${apiUrl}. Start Compose, apply migrations, and start the HTTPS API first.`);
  }
  const sessionA = await login(browsers[0], users[0]);
  const sessionB = await login(browsers[1], users[1]);
  if (sessionA.userId === sessionB.userId) {
    throw new Error("Deterministic Keycloak users resolved to the same internal KitchenFlow user.");
  }

  const lotId = await createLot(browsers[0], sessionA.csrfToken);
  const ownerStatus = await fetchStatus(browsers[0], `/api/v1/inventory/lots/${lotId}`);
  const otherUserStatus = await fetchStatus(browsers[1], `/api/v1/inventory/lots/${lotId}`);
  if (ownerStatus !== 200 || otherUserStatus !== 404) {
    throw new Error(`Owner/isolation checks returned ${ownerStatus}/${otherUserStatus}, expected 200/404.`);
  }

  process.stdout.write("Real Keycloak browser session, CSRF create, and two-user isolation smoke passed.\n");
} finally {
  await Promise.all(browsers.map(stopBrowser));
}
