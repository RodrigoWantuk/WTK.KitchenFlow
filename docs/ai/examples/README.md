# Recipe AI Model-Evaluation Examples

Use the fixed system prompt first:

```text
docs/ai/prompts/recipe-suggest-candidates.system.txt
```

Then send one JSON request as the variable user payload. Configure structured output separately. Do not paste response-schema prose into the conversational prompt in production.

## Protocol generations

- Files `01`–`05` remain protocol `0.2-draft` regression fixtures.
- Files `06`–`07` are selected-recipe expansion fixtures migrated to protocol `0.3-draft` for the visual descriptor.
- Files `08`–`10` are canonical protocol `0.3-draft` product-flow fixtures.
- Protocol `0.3` returns exactly three compact candidates.
- Selected-recipe expansion must also emit the bounded, versioned `thumbnailVisual` object defined by PLAN-0017.

## Files

| File | Purpose |
|---|---|
| `01`–`05` | Legacy suggestion regression cases |
| `06`–`07` | Selected-recipe expansion, multi-day preparation and visual-descriptor validation |
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

## Expanded-recipe visual expectations

The selected-recipe expansion returns `thumbnailVisual` with:

- schema version and concise appearance description;
- visible components only;
- dish format and plating;
- material cooked state, sauce/texture cues and garnish;
- dominant colors and explicitly excluded elements.

Reject or repair the visual descriptor when it invents an ingredient, garnish, side, brand or tableware; changes a material prepared state; includes private pantry/profile context; makes safety, nutrition, freshness or authenticity claims; or cannot be deterministically canonicalized.

The backend, not the model, validates and canonicalizes this object and computes the visual identity used by the PLAN-0008 thumbnail cache. Provider/model/style/render policy must not appear inside the recipe artifact.

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
- claims mutations or emits concrete timestamps during expansion;
- emits an invalid, private or visually inconsistent `thumbnailVisual` descriptor.

## Benchmark record

Capture provider/model/backend fingerprint, prompt/protocol version, thinking level, max tokens, structured-output mode, prompt/cache-hit/cache-miss tokens, reasoning/final tokens, time to first token, total latency, raw response, schema/semantic validation, diversity, plausibility, visual-descriptor fidelity, canonicalization result, repair count and estimated cost.

Run at least three repetitions per canonical scenario before approving a production default.
