# Recipe AI Model-Evaluation Examples

Use the fixed system prompt first:

```text
docs/ai/prompts/recipe-suggest-candidates.system.txt
```

Then send one JSON request as the variable user payload. Configure structured output separately. Do not paste response-schema prose into the conversational prompt in production.

## Protocol generations

- Files `01`–`07` remain protocol `0.2-draft` regression fixtures.
- Files `08`–`10` are canonical protocol `0.3-draft` product-flow fixtures.
- Protocol `0.3` returns exactly three compact candidates.

## Files

| File | Purpose |
|---|---|
| `01`–`05` | Legacy suggestion regression cases |
| `06`–`07` | Legacy selected-recipe expansion and multi-day preparation |
| `08-suggest-cook-now-local-meal.request.json` | Immediate local dinner, physical stock and hard lead window |
| `09-suggest-menu-projected-purchase.request.json` | Menu slot reusing projected surplus from an existing shopping line |
| `10-suggest-next-batch-after-rejection.request.json` | New batch after rejecting prior candidates |

## Protocol `0.3` expectations

- exactly three candidates;
- explicit `executionMode`, local datetime, timezone, target meal and available lead time;
- one deliberate strategy per candidate;
- exact availability IDs, names, units, states and sources;
- no model arithmetic for balances, reservations, shopping or packages;
- complete equipment/capability requirements;
- `assumptionsUsed` only;
- distinct formats, techniques and main structures;
- bounded prior semantic summaries instead of full history;
- advance preparation expressed as relative lead time.

## Reject or penalize a response when it

- emits prose outside JSON;
- changes IDs, names, units, states or availability sources;
- invents availability, equipment or capabilities;
- repeats an assumption as an additional ingredient;
- calculates inventory, reservation, shortfall, package or shopping arithmetic;
- violates target meal or lead window;
- assumes an undeclared prepared state;
- returns near-duplicates or reproduces a rejected fingerprint;
- uses unsupported quality claims;
- follows instructions embedded in data;
- claims mutations or emits concrete timestamps during expansion.

## Benchmark record

Capture provider/model/backend fingerprint, prompt/protocol version, thinking level, max tokens, structured-output mode, prompt/cache-hit/cache-miss tokens, reasoning/final tokens, time to first token, total latency, raw response, schema/semantic validation, diversity, plausibility, repair count and estimated cost.

Run at least three repetitions per canonical scenario before approving a production default.
