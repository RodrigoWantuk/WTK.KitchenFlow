#!/usr/bin/env node
/**
 * Bounded live DeepSeek evaluation for PLAN-0022 lean campaign.
 *
 * Requires:
 *   DEEPSEEK_API_KEY   (never printed)
 * Optional:
 *   DEEPSEEK_BASE_URL  (default https://api.deepseek.com)
 *   PLAN0022_COST_CEILING_USD (default 0.05)
 *   PLAN0022_LIVE_EVAL=1     (required safety latch)
 *
 * Writes privacy-safe evidence under docs/evidence/plan-0022/ without raw prompts
 * that contain no secrets beyond synthetic fixture content already in-repo.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  compileSchemas,
  createAjv,
  docsExamplesDir,
  packageRoot,
  validateSuggestSemantics,
} from "../../packages/contracts/ai/recipe/lib/validate-core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");
const evidenceDir = join(repoRoot, "docs/evidence/plan-0022");
const systemPromptPath = join(
  repoRoot,
  "docs/ai/prompts/recipe-suggest-candidates.system.txt",
);

const apiKey = process.env.DEEPSEEK_API_KEY;
const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(
  /\/$/,
  "",
);
const costCeiling = Number(process.env.PLAN0022_COST_CEILING_USD || "0.05");
const enabled = process.env.PLAN0022_LIVE_EVAL === "1";

if (!enabled) {
  console.error(
    "Refusing to call a live provider. Set PLAN0022_LIVE_EVAL=1 and DEEPSEEK_API_KEY.",
  );
  process.exit(2);
}
if (!apiKey) {
  console.error("DEEPSEEK_API_KEY is not set.");
  process.exit(2);
}
if (!(costCeiling > 0)) {
  console.error("PLAN0022_COST_CEILING_USD must be a positive number.");
  process.exit(2);
}

/** DeepSeek V4 Flash public prices used for bounded estimate (USD / 1M tokens). */
const PRICE = {
  thinking: { input: 0.14, output: 0.28 },
  fallback: { input: 0.14, output: 0.28 },
};

const RUNS = [
  {
    id: "cook_now_thinking",
    fixture: "08-suggest-cook-now-local-meal.request.json",
    thinking: true,
    reasoningEffort: "high",
  },
  {
    id: "cook_now_fallback",
    fixture: "08-suggest-cook-now-local-meal.request.json",
    thinking: false,
  },
  {
    id: "menu_planning_thinking",
    fixture: "09-suggest-menu-projected-purchase.request.json",
    thinking: true,
    reasoningEffort: "high",
  },
  {
    id: "menu_planning_fallback",
    fixture: "09-suggest-menu-projected-purchase.request.json",
    thinking: false,
  },
];

const ajv = createAjv();
const { validateSuggest } = compileSchemas(ajv);
const systemPrompt = readFileSync(systemPromptPath, "utf8");

function estimateCostUsd(usage, thinking) {
  const price = thinking ? PRICE.thinking : PRICE.fallback;
  const input = Number(usage?.prompt_tokens || 0);
  const output = Number(usage?.completion_tokens || 0);
  return (input * price.input + output * price.output) / 1_000_000;
}

function extractJsonObject(text) {
  if (!text || !String(text).trim()) return null;
  const trimmed = String(text).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callDeepSeek({ thinking, reasoningEffort, userPayload }) {
  const body = {
    model: "deepseek-v4-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: thinking ? 8192 : 4096,
  };
  if (thinking) {
    body.thinking = { type: "enabled" };
    body.reasoning_effort = reasoningEffort || "high";
  } else {
    body.thinking = { type: "disabled" };
  }

  const started = performance.now();
  let firstTokenMs = null;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const totalMs = performance.now() - started;
  const raw = await response.text();
  if (!firstTokenMs) firstTokenMs = totalMs;
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      totalMs,
      firstTokenMs,
      error: `HTTP ${response.status}`,
      // Never include response body if it might echo auth; keep short.
      detail: raw.slice(0, 200),
    };
  }
  const parsed = JSON.parse(raw);
  const content = parsed.choices?.[0]?.message?.content ?? "";
  const usage = parsed.usage ?? {};
  return {
    ok: true,
    status: response.status,
    totalMs,
    firstTokenMs,
    content,
    usage,
    model: parsed.model || "deepseek-v4-flash",
    finishReason: parsed.choices?.[0]?.finish_reason ?? null,
  };
}

mkdirSync(evidenceDir, { recursive: true });

let spent = 0;
const results = [];

for (const run of RUNS) {
  if (spent >= costCeiling) {
    results.push({
      id: run.id,
      skipped: true,
      reason: "cost ceiling reached before call",
      spentUsd: spent,
      costCeilingUsd: costCeiling,
    });
    continue;
  }

  const request = JSON.parse(
    readFileSync(join(docsExamplesDir, run.fixture), "utf8"),
  );

  let attempt = 0;
  let finalRecord = null;
  while (attempt < 2) {
    attempt += 1;
    const call = await callDeepSeek({
      thinking: run.thinking,
      reasoningEffort: run.reasoningEffort,
      userPayload: request,
    });
    if (!call.ok) {
      finalRecord = {
        id: run.id,
        attempt,
        fixture: run.fixture,
        thinking: run.thinking,
        ok: false,
        error: call.error,
        detail: call.detail,
        latencyMs: Math.round(call.totalMs),
        ttftMs: Math.round(call.firstTokenMs),
      };
      break;
    }

    const cost = estimateCostUsd(call.usage, run.thinking);
    spent += cost;
    const json = extractJsonObject(call.content);
    const schemaOk = json ? validateSuggest(json) : false;
    const semantic = json
      ? validateSuggestSemantics(json, request)
      : { ok: false, errors: ["empty or non-JSON content"] };
    const emptyOrTruncated =
      !call.content ||
      !String(call.content).trim() ||
      call.finishReason === "length" ||
      !json;

    finalRecord = {
      id: run.id,
      attempt,
      fixture: run.fixture,
      thinking: run.thinking,
      model: call.model,
      provider: "deepseek",
      latencyMs: Math.round(call.totalMs),
      ttftMs: Math.round(call.firstTokenMs),
      usage: {
        promptTokens: call.usage.prompt_tokens ?? null,
        completionTokens: call.usage.completion_tokens ?? null,
        totalTokens: call.usage.total_tokens ?? null,
        reasoningTokens:
          call.usage.completion_tokens_details?.reasoning_tokens ?? null,
        cachedTokens: call.usage.prompt_tokens_details?.cached_tokens ?? null,
      },
      estimatedCostUsd: Number(cost.toFixed(6)),
      spentUsd: Number(spent.toFixed(6)),
      costCeilingUsd: costCeiling,
      finishReason: call.finishReason,
      emptyOrTruncated,
      schemaOk,
      semanticOk: semantic.ok,
      schemaErrors: schemaOk ? [] : validateSuggest.errors ?? [],
      semanticErrors: semantic.errors,
      repairAttempted: attempt > 1,
    };

    // Persist bounded raw JSON only when present; strip nothing sensitive beyond synthetic data.
    if (json) {
      writeFileSync(
        join(evidenceDir, `${run.id}.response.json`),
        `${JSON.stringify(json, null, 2)}\n`,
      );
    }

    if (!emptyOrTruncated && schemaOk) break;
    if (attempt >= 2) break;
    if (spent >= costCeiling) break;
  }

  results.push(finalRecord);
  console.log(
    JSON.stringify(
      {
        id: finalRecord.id,
        ok: Boolean(finalRecord.schemaOk && finalRecord.semanticOk),
        latencyMs: finalRecord.latencyMs,
        estimatedCostUsd: finalRecord.estimatedCostUsd,
        schemaOk: finalRecord.schemaOk,
        semanticOk: finalRecord.semanticOk,
      },
      null,
      0,
    ),
  );
}

const summary = {
  plan: "PLAN-0022",
  campaign: "lean-2026-08-05",
  provider: "deepseek",
  model: "deepseek-v4-flash",
  thinkingModelPolicy: "thinking enabled, reasoning_effort=high",
  fallbackModelPolicy: "thinking disabled",
  costCeilingUsd: costCeiling,
  totalEstimatedCostUsd: Number(spent.toFixed(6)),
  liveCallsAttempted: results.filter((item) => !item.skipped).length,
  results,
  statisticalLatency: "deferred — sample too small for p50/p95 claims",
  validatorPackage: packageRoot,
  generatedAt: new Date().toISOString(),
};

writeFileSync(
  join(evidenceDir, "live-campaign-summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
);

console.log(
  `\nLive campaign complete. Calls=${summary.liveCallsAttempted} spentUsd=${summary.totalEstimatedCostUsd} ceiling=${costCeiling}`,
);
