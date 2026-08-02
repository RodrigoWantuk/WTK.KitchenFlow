#!/usr/bin/env node
/**
 * PLAN-0018 test-only same-origin reverse proxy (CommonJS, Node built-ins + optional https).
 * Serves apps/frontend/build-production and proxies API/OIDC/health to the backend.
 */
const http = require("node:http");
const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const root = path.resolve(__dirname, "../..");
const buildDir =
  process.env.PLAN0018_FE_BUILD ||
  path.join(root, "apps/frontend/build-production");
const listenHost = process.env.PLAN0018_PROXY_HOST || "127.0.0.1";
const listenPort = Number(process.env.PLAN0018_PROXY_PORT || 9443);
const apiTarget = new URL(
  process.env.PLAN0018_API_TARGET || "https://127.0.0.1:7443",
);
const insecure = process.env.PLAN0018_PROXY_INSECURE_TLS !== "0";

const PROXY_PREFIXES = [
  "/api",
  "/signin-oidc",
  "/signout-callback-oidc",
  "/health",
  "/openapi",
];

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return (
    {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".ico": "image/x-icon",
      ".map": "application/json",
      ".txt": "text/plain; charset=utf-8",
      ".woff2": "font/woff2",
    }[ext] || "application/octet-stream"
  );
}

function shouldProxy(pathname) {
  return PROXY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function proxyRequest(req, res) {
  const headers = { ...req.headers, host: apiTarget.host };
  const options = {
    protocol: apiTarget.protocol,
    hostname: apiTarget.hostname,
    port: apiTarget.port || (apiTarget.protocol === "https:" ? 443 : 80),
    path: req.url,
    method: req.method,
    headers,
    rejectUnauthorized: !insecure,
  };
  const transporter = apiTarget.protocol === "https:" ? https : http;
  const upstream = transporter.request(options, (upRes) => {
    res.writeHead(upRes.statusCode || 502, upRes.headers);
    upRes.pipe(res);
  });
  upstream.on("error", (err) => {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end(`proxy error: ${err.message}`);
  });
  req.pipe(upstream);
}

function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://${listenHost}`);
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith("/")) rel += "index.html";
  if (rel === "/") rel = "/index.html";
  const candidate = path.normalize(path.join(buildDir, rel));
  if (!candidate.startsWith(buildDir)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  const filePath = fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(buildDir, "index.html");
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": contentType(filePath) });
    res.end(data);
  });
}

if (!fs.existsSync(path.join(buildDir, "index.html"))) {
  console.error(`[plan-0018-proxy] missing production build at ${buildDir}`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url || "/", `http://${listenHost}`).pathname;
  if (shouldProxy(pathname)) {
    proxyRequest(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(listenPort, listenHost, () => {
  console.log(
    `[plan-0018-proxy] http://${listenHost}:${listenPort} → ${apiTarget.href} static=${buildDir}`,
  );
});
