#!/usr/bin/env bash
# Focused recipe AI contract validation (deterministic only).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/packages/contracts/ai/recipe"
if [[ ! -d node_modules ]]; then
  npm install
fi
npm test
npm run check:drift
