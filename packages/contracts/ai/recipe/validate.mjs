#!/usr/bin/env node
/**
 * CLI entry for validating one recipe AI response JSON file.
 *
 * Usage:
 *   node validate.mjs suggest path/to/response.json [path/to/request.json]
 *   node validate.mjs expand path/to/response.json [path/to/request.json]
 */
import { readFileSync } from "node:fs";
import {
  compileSchemas,
  createAjv,
  validateExpandSemantics,
  validateSuggestSemantics,
} from "./lib/validate-core.mjs";

const [mode, responsePath, requestPath] = process.argv.slice(2);
if (!mode || !responsePath || !["suggest", "expand"].includes(mode)) {
  console.error(
    "Usage: node validate.mjs <suggest|expand> <response.json> [request.json]",
  );
  process.exit(2);
}

const ajv = createAjv();
const { validateSuggest, validateExpand } = compileSchemas(ajv);
const response = JSON.parse(readFileSync(responsePath, "utf8"));
const request = requestPath
  ? JSON.parse(readFileSync(requestPath, "utf8"))
  : null;

const schemaOk =
  mode === "suggest" ? validateSuggest(response) : validateExpand(response);
if (!schemaOk) {
  const errors =
    mode === "suggest" ? validateSuggest.errors : validateExpand.errors;
  console.error(JSON.stringify({ ok: false, stage: "schema", errors }, null, 2));
  process.exit(1);
}

const semantic =
  mode === "suggest"
    ? validateSuggestSemantics(response, request)
    : validateExpandSemantics(response, request);

if (!semantic.ok) {
  console.error(
    JSON.stringify({ ok: false, stage: "semantic", errors: semantic.errors }, null, 2),
  );
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, stage: "schema+semantic" }, null, 2));
