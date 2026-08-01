#!/usr/bin/env bash
# PLAN-0005 shared identity + evidence path helpers. Source from harness scripts.
# shellcheck disable=SC2034

PLAN0005_INTEGRATED_SHA="${PLAN0005_INTEGRATED_SHA:-b94abd9a83fe29d88b095e3e9a42f10d01c05414}"
PLAN0005_CHECKED_OUT_SHA="$(git rev-parse HEAD)"
# Real PR branch head when provided by Actions; otherwise checked-out SHA (local / push).
PLAN0005_PR_HEAD_SHA="${PLAN0005_PR_HEAD_SHA:-${PLAN0005_CHECKED_OUT_SHA}}"
PLAN0005_EVIDENCE_GENERATION_SHA="${PLAN0005_EVIDENCE_GENERATION_SHA:-${PLAN0005_PR_HEAD_SHA}}"

if [[ -z "${PLAN0005_EVIDENCE_DIR:-}" ]]; then
  PLAN0005_EVIDENCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/docs/evidence/plan-0005"
fi
# Normalize to absolute path for testhost / nested cd.
PLAN0005_EVIDENCE_DIR="$(mkdir -p "${PLAN0005_EVIDENCE_DIR}" && cd "${PLAN0005_EVIDENCE_DIR}" && pwd)"
export PLAN0005_INTEGRATED_SHA PLAN0005_CHECKED_OUT_SHA PLAN0005_PR_HEAD_SHA PLAN0005_EVIDENCE_GENERATION_SHA PLAN0005_EVIDENCE_DIR

plan0005_write_identity_json() {
  local out="${1:-${PLAN0005_EVIDENCE_DIR}/run-identity.json}"
  python3 - <<PY
import json
from pathlib import Path
Path("${out}").write_text(json.dumps({
  "plan": "PLAN-0005",
  "integratedMainSha": "${PLAN0005_INTEGRATED_SHA}",
  "prHeadSha": "${PLAN0005_PR_HEAD_SHA}",
  "checkedOutCommitSha": "${PLAN0005_CHECKED_OUT_SHA}",
  "evidenceGenerationSha": "${PLAN0005_EVIDENCE_GENERATION_SHA}",
  "workflowRunId": "${GITHUB_RUN_ID:-}",
  "workflowStartedAtUtc": "${PLAN0005_WORKFLOW_STARTED_AT_UTC:-}",
}, indent=2) + "\n", encoding="utf-8")
PY
}
