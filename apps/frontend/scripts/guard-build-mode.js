#!/usr/bin/env node
/**
 * Guard: package.json build scripts must not silently produce prototype.
 */
const fs = require("fs");
const path = require("path");

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
);

const failures = [];
const build = pkg.scripts?.build || "";
const buildProto =
  pkg.scripts?.build_prototype || pkg.scripts?.["build:prototype"] || "";
const buildProd = pkg.scripts?.["build:production"] || "";

if (
  /FRONTEND_MODE=prototype/.test(build) &&
  !/FRONTEND_MODE=production/.test(build)
) {
  failures.push(
    "scripts.build must not default to REACT_APP_FRONTEND_MODE=prototype",
  );
}
if (
  !/FRONTEND_MODE=production/.test(build) &&
  !/fail|required|explicit/.test(build)
) {
  // Prefer production default
  if (!/FRONTEND_MODE=production/.test(build)) {
    failures.push(
      "scripts.build must set REACT_APP_FRONTEND_MODE=production (fail-closed default)",
    );
  }
}
if (!/FRONTEND_MODE=prototype/.test(buildProto)) {
  failures.push(
    "scripts.build:prototype must set REACT_APP_FRONTEND_MODE=prototype",
  );
}
if (!/FRONTEND_MODE=production/.test(buildProd)) {
  failures.push(
    "scripts.build:production must set REACT_APP_FRONTEND_MODE=production",
  );
}

if (failures.length) {
  console.error(
    "Build mode guard failed:\n" + failures.map((f) => ` - ${f}`).join("\n"),
  );
  process.exit(1);
}

console.log("Build mode guard passed.");
