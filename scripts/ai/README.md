# Recipe AI live evaluation scripts

These scripts call external providers and are **not** part of the default repository test suite.

## PLAN-0022 lean campaign

```bash
export DEEPSEEK_API_KEY='...'          # ignored local secret; never commit
export PLAN0022_LIVE_EVAL=1
export PLAN0022_COST_CEILING_USD=0.05  # optional; default 0.05
node scripts/ai/recipe-live-eval.mjs
```

Rules:

- synthetic fixtures only;
- never print the API key;
- stop when the cost ceiling is reached;
- at most one repair retry for empty/truncated/invalid JSON;
- evidence is written under `docs/evidence/plan-0022/`.
