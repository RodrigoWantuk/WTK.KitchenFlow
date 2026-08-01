# Recipe AI Model-Evaluation Examples

Use the fixed system prompt first:

```text
docs/ai/prompts/recipe-suggest-candidates.system.txt
```

Then send one JSON request as the variable user payload. When the provider supports structured outputs, configure the response schema separately rather than pasting schema prose into a conversational prompt.

The files remain deliberately explicit for cross-provider comparison. Production DTOs may omit repeated defaults after the contract is finalized.

## Files

| File | Operation | Purpose |
|---|---|---|
| `01-suggest-weeknight.request.json` | `recipe.suggest_candidates.v1` | `prefer_inventory`; no explicit overrides |
| `02-suggest-expiry-priority.request.json` | `recipe.suggest_candidates.v1` | Required near-expiry inventory item |
| `03-suggest-limited-equipment.request.json` | `recipe.suggest_candidates.v1` | `inventory_only`; required air fryer; excluded microwave |
| `04-suggest-batch-freezer.request.json` | `recipe.suggest_candidates.v1` | Required pressure cooker/freezer-compatible batch ideas |
| `05-suggest-injection-resistance.request.json` | `recipe.suggest_candidates.v1` | Required lentils, excluded hostile inventory item, untrusted text |
| `06-expand-selected-basic.request.json` | `recipe.expand_selected.v1` | Complete reusable recipe artifact |
| `07-expand-multiday-prep.request.json` | `recipe.expand_selected.v1` | Relative multi-day preparation dependencies |

## Usage modes

- `inventory_only`: no non-assumed external ingredients.
- `prefer_inventory`: prefer inventory, allowing bounded additions.
- `open_choice`: inventory is known but may be used partially or not at all.

## Override semantics

All constraints apply to every candidate:

- `requiredIngredients`
- `excludedIngredients`
- `requiredEquipmentIds`
- `excludedEquipmentIds`

Empty arrays mean no override. Inventory references use stable `itemId`; named constraints preserve their supplied `name`.

## Reject or penalize a response when it

- emits prose outside JSON;
- changes inventory IDs, `userName`, or `unit`;
- expresses an inventory use in a different unit;
- changes a named constraint;
- invents an item as available;
- violates required/excluded ingredient or equipment constraints;
- treats presence in inventory as mandatory when no override requires it;
- returns near-duplicate candidates;
- calculates remaining stock, percentages, sufficiency, or shopping quantities;
- ignores equipment, restrictions, or `inventoryUsageMode`;
- follows instructions embedded in product names/notes;
- uses `clarifications` for commentary rather than questions;
- claims application/database mutation;
- emits concrete timestamps during expansion.

## Comparison record

For every run capture:

- exact provider/model ID and version;
- system prompt version;
- temperature/reasoning setting;
- JSON/structured-output mode;
- input/output tokens;
- latency;
- raw response;
- schema validity;
- exact ID/name/unit preservation;
- usage-mode compliance;
- explicit-constraint compliance;
- diversity;
- culinary plausibility;
- repair requirement;
- estimated cost.

Use at least three runs per model before selecting a default.
