# DeepSeek V4 Flash — PLAN-0022 Lean Campaign Addendum

- **Plan:** PLAN-0022
- **Date:** 2026-08-05
- **Parent provisional note:** [`deepseek-v4-flash-2026-08-01.md`](deepseek-v4-flash-2026-08-01.md)
- **Evidence:** [`../../evidence/plan-0022/`](../../evidence/plan-0022/)

## Campaign

Four representative scenarios under cost ceiling US$ 0.05 (spent ≈ US$ 0.012867):

1. `cook_now` thinking-high
2. `cook_now` non-thinking fallback
3. `menu_planning` thinking-high
4. `menu_planning` non-thinking fallback

Each scenario reached attempt 2 (one repair). **Actual provider calls: 8.** Do not describe four scenarios as four provider calls.

## Latency accounting

Historical `460–518 ms` values are preserved as **response-header timing** only. Total response latency and TTFT are unavailable for that historical run (non-streaming calls; the original timer stopped before the response body was fully read). Statistical latency characterization remains deferred. Future script runs record `responseHeadersMs`, `totalLatencyMs`, and `ttftMs: null` with `ttftMeasurement: unavailable_without_streaming`.

## Outcome

- Thinking-high exhausted the completion budget on reasoning and returned empty/truncated JSON in this sample.
- Fallback returned JSON that was semantically useful against fixtures but failed strict protocol `0.3` schema validation.
- Reinforces: non-thinking default for synchronous `cook_now`; thinking-high only with progressive UI; deterministic schema validation and one repair before accept; statistical latency deferred.

Historical PLAN-0017 provisional timings remain immutable and are not rewritten.
