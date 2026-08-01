# DeepSeek V4 Flash Recipe Evaluation — 2026-08-01

- **Plan:** PLAN-0016
- **Provider:** DeepSeek
- **Selected evaluation model:** `deepseek-v4-flash`
- **Selected mode:** thinking enabled
- **Selected reasoning effort:** `high`
- **Status:** Provisional quality baseline, not unconditional production approval

## Tested configurations

One controlled request was run against Flash/Pro with thinking disabled/high:

| Model/mode | Prompt | Completion | Reasoning | Total | Latency | Estimated cost |
|---|---:|---:|---:|---:|---:|---:|
| Flash disabled | 1,166 | 1,717 | 0 | 2,883 | 10.1 s | US$ 0.000654 |
| Flash high | 1,245 | 11,505 | 9,522 | 12,750 | 108.6 s | US$ 0.003406 |
| Pro disabled | 1,166 | 1,761 | 0 | 2,927 | 13.2 s | US$ 0.002039 |
| Pro high | 1,166 | 7,447 | 5,898 | 8,613 | 83.1 s | US$ 0.006520 |

These are single-run observations, not production benchmarks.

## Qualitative result

Flash thinking-high produced the strongest diversity and culinary coherence in the tested set. Residual failures still require deterministic validation: inconsistent assumptions, implicit ingredient state, optional ingredients described as required, unsupported wording and optimistic time estimates.

## Provider behavior captured

- `/chat/completions` is stateless; Cocinaris resends required state.
- Previous reasoning is not product state and is not replayed.
- Context caching is automatic and best effort for matching prefixes.
- Usage exposes cache hit/miss and reasoning/final token details.
- Effective effort values are `high` and `max`; compatibility `low`/`medium` map to `high`.
- `max` is not justified for recipe generation.
- JSON may be empty/truncated when the generation budget is exhausted.
- Strict tool calling uses the provider Beta surface and does not replace semantic validation.

## Decision

Use Flash thinking-high as the quality baseline for the next controlled benchmark, now with three compact candidates instead of four.

Do not approve it blindly for synchronous `cook_now`. It must meet:

```text
p50 <= 15 seconds
p95 <= 25 seconds
empty/truncated final JSON = 0
maximum automatic repairs = 1
acceptable semantic-validation rate
bounded cost per accepted recipe
```

If it misses the latency gate, use Flash non-thinking for synchronous `cook_now` and retain thinking-high only for menu planning/pre-generation where progressive waiting is acceptable.

Ordinary generation receives no Google/web access. Inventory, projected availability, equipment, profile, meal context and constraints already address the task; search would increase latency, cost, non-determinism and injection exposure.

## Next benchmark

Run three repetitions for:

1. immediate `cook_now` with explicit local dinner and lead window;
2. menu planning reusing projected rice purchase surplus;
3. another batch after rejection with semantic fingerprints.

Capture TTFT, total latency, cache hit/miss, reasoning/final tokens, output, validation failures, repair count and cost.
