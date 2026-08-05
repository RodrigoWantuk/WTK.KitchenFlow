# PLAN-0022 Lean Live Campaign Evidence

- **Plan:** PLAN-0022
- **Campaign:** lean-2026-08-05
- **Status:** Pending live execution (`DEEPSEEK_API_KEY` not available in the agent environment at deterministic checkpoint)

## Commands

```bash
export DEEPSEEK_API_KEY='...'   # never commit
export PLAN0022_LIVE_EVAL=1
export PLAN0022_COST_CEILING_USD=0.05
node scripts/ai/recipe-live-eval.mjs
```

Expected artifacts after a successful run:

- `live-campaign-summary.json`
- `cook_now_thinking.response.json`
- `cook_now_fallback.response.json`
- `menu_planning_thinking.response.json`
- `menu_planning_fallback.response.json`

## Deferred

Statistical p50/p95 latency characterization is deferred. Point samples only.
