# PLAN-0022 Lean Live Campaign — 2026-08-05

- **Plan:** PLAN-0022
- **Campaign:** lean-2026-08-05
- **Provider:** DeepSeek
- **Model:** `deepseek-v4-flash`
- **Thinking policy:** thinking enabled, `reasoning_effort: high`
- **Fallback policy:** thinking disabled
- **Cost ceiling:** US$ 0.05
- **Total estimated cost:** US$ 0.012867
- **Scenarios evaluated:** 4
- **Actual provider calls:** 8 (each scenario reached attempt 2)
- **Maximum repairs per scenario:** 1
- **Artifacts:** `live-campaign-summary.json`, `cook_now_fallback.response.json`, `menu_planning_fallback.response.json`
- **Statistical / total latency:** deferred; historical total latency and TTFT unavailable

## Results

| Scenario | Thinking | Schema | Semantic | Response-header timing (last attempt) | Total latency | TTFT | Notes |
|---|---|---|---|---:|---|---|---|
| `cook_now_thinking` | yes | Fail | Fail | 518 ms | unavailable | unavailable | Truncated: completion budget exhausted on reasoning tokens; empty JSON after repair |
| `cook_now_fallback` | no | Fail | Pass | 460 ms | unavailable | unavailable | JSON produced; missing `schemaVersion`/`clarifications`; difficulty/time/additionalIngredients shape drift |
| `menu_planning_thinking` | yes | Fail | Fail | 478 ms | unavailable | unavailable | Same truncation pattern as cook_now thinking |
| `menu_planning_fallback` | no | Fail | Pass | 463 ms | unavailable | unavailable | JSON produced; same class of strict-schema drift |

The `460–518 ms` values are preserved **response-header** timings from the historical run (elapsed until `fetch()` resolved, before `response.text()` completed). They are **not** total response latency and **not** TTFT. TTFT is unavailable because the calls were non-streaming. Total latency was not measured correctly in that run and is not fabricated.

## Findings

1. Credential and provider reachability are confirmed for synthetic fixtures.
2. Thinking-high with the current max-token budget did not yield usable JSON in this lean sample; retain thinking-high only behind progressive UI / offline pre-generation, not as the default blocking `cook_now` path.
3. Non-thinking fallback produced parseable candidate batches that passed semantic checks against request snapshots but failed the strict `0.3` schema — confirming that production must apply schema validation + one repair, and preferably provider structured-output / tool schema binding in the future AI Gateway.
4. Protocol disposition remains **Revised → `0.3`**. Strict schemas stay authoritative; live model output is untrusted until validated.
5. Four scenarios were evaluated with eight actual provider calls. Do not describe the campaign as four provider calls.
6. Statistical latency characterization remains deferred.

## Decision reinforcement

- Synchronous `cook_now`: prefer non-thinking fallback; max one repair.
- `menu_planning`: thinking-high allowed behind progressive UI; fall back on truncate/schema failure.
- No permanent provider selection from this sample.
- No production AI Gateway/provider adapter in this plan.
