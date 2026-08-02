#!/usr/bin/env node
/**
 * Mirrors packages/api-client/src into apps/frontend/src/generated/api-client
 * so CRA can compile the generated client inside its src/ boundary.
 */
import {
  cpSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");
const source = join(repoRoot, "packages/api-client/src");
const target = join(repoRoot, "apps/frontend/src/generated/api-client");

if (!existsSync(source)) {
  console.error(`Missing source: ${source}`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
writeFileSync(
  join(target, "README.md"),
  [
    "# Generated API client mirror",
    "",
    "Do not edit files in this directory.",
    "Canonical source: `packages/api-client`.",
    "Regenerate with `yarn generate:api-client` from `apps/frontend`.",
    "",
  ].join("\n"),
);
console.log(`Synced API client → ${target}`);
