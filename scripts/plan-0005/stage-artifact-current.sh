#!/usr/bin/env bash
# Stage a clean PLAN-0005 raw-run artifact directory (generated evidence only).
# Do NOT include repository documentation or historical supersession files.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
source "${ROOT}/scripts/plan-0005/lib-identity.sh"
ROUND="${1:?usage: stage-artifact-current.sh p0|p1}"
EVIDENCE="${PLAN0005_EVIDENCE_DIR}"
STAGE="${EVIDENCE}/artifact-current"
rm -rf "${STAGE}"
mkdir -p "${STAGE}"

copy_if() {
  local src="${EVIDENCE}/$1"
  if [[ -f "${src}" ]]; then
    cp -a "${src}" "${STAGE}/"
  fi
}

# Run identity + container metrics (always generated this run)
copy_if "run-identity.json"
copy_if "container-count.json"

case "${ROUND}" in
  p0)
    for f in \
      p0-round1-timing.json \
      p0-round1-summary.json \
      firefox-zoom-pointer-keyboard.json \
      frontend-production-inventory.json \
      keycloak-p0-auth.json \
      environment-timing.json
    do
      copy_if "${f}"
    done
    if [[ -d "${EVIDENCE}/reports/trx" ]]; then
      mkdir -p "${STAGE}/reports"
      cp -a "${EVIDENCE}/reports/trx" "${STAGE}/reports/" 2>/dev/null || true
    fi
    ;;
  p1)
    for f in \
      p1-round-timing.json \
      openapi-p1.json \
      i18n-production-catalog.json \
      axe-production-surfaces.json \
      observability-performance-p1.json \
      readiness-postgres-outage.json \
      outage-mutation-recovery.json \
      performance-smoke.json \
      performance-concurrent-creates.json
    do
      copy_if "${f}"
    done
    if [[ -d "${EVIDENCE}/reports/trx-p1" ]]; then
      mkdir -p "${STAGE}/reports"
      cp -a "${EVIDENCE}/reports/trx-p1" "${STAGE}/reports/" 2>/dev/null || true
    fi
    if [[ -d "${EVIDENCE}/reports/trx-outage" ]]; then
      mkdir -p "${STAGE}/reports"
      cp -a "${EVIDENCE}/reports/trx-outage" "${STAGE}/reports/" 2>/dev/null || true
    fi
    if [[ -d "${EVIDENCE}/reports/trx-perf" ]]; then
      mkdir -p "${STAGE}/reports"
      cp -a "${EVIDENCE}/reports/trx-perf" "${STAGE}/reports/" 2>/dev/null || true
    fi
    if [[ -d "${EVIDENCE}/reports/trx-obs" ]]; then
      mkdir -p "${STAGE}/reports"
      cp -a "${EVIDENCE}/reports/trx-obs" "${STAGE}/reports/" 2>/dev/null || true
    fi
    ;;
  *)
    echo "usage: $0 p0|p1" >&2
    exit 2
    ;;
esac

# Stamp current identity onto every staged JSON that lacks prHeadSha (raw-run contract).
python3 - <<PY
import json, os
from pathlib import Path
stage = Path("${STAGE}")
pr = os.environ.get("PLAN0005_PR_HEAD_SHA", "${PLAN0005_PR_HEAD_SHA}")
checked = os.environ.get("PLAN0005_CHECKED_OUT_SHA", "${PLAN0005_CHECKED_OUT_SHA}")
integrated = os.environ.get("PLAN0005_INTEGRATED_SHA", "${PLAN0005_INTEGRATED_SHA}")
egen = os.environ.get("PLAN0005_EVIDENCE_GENERATION_SHA", pr)
for path in stage.rglob("*.json"):
    if "trx" in path.parts:
        continue
    try:
        obj = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        continue
    if not isinstance(obj, dict):
        continue
    changed = False
    if obj.get("prHeadSha") != pr:
        obj["prHeadSha"] = pr
        changed = True
    if not obj.get("checkedOutCommitSha"):
        obj["checkedOutCommitSha"] = checked
        changed = True
    if not obj.get("integratedMainSha"):
        obj["integratedMainSha"] = integrated
        changed = True
    if not obj.get("evidenceGenerationSha"):
        obj["evidenceGenerationSha"] = egen
        changed = True
    if changed:
        path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
PY

# Refuse static repository documentation in raw artifacts
for banned in final-quality-assessment.json environment-manifest.json requirements-traceability.md; do
  if [[ -f "${STAGE}/${banned}" ]]; then
    echo "Refusing to stage repository documentation file: ${banned}" >&2
    exit 1
  fi
done

# Refuse historical supersession evidence in raw artifacts
for banned in \
  p0-initial-summary.json \
  p0-initial-summary.README.md \
  p0-initial-failed-timing.json \
  p0-initial-failed-timing.README.md \
  p0-round1-initial-failed-console.txt \
  p0-round1-initial-failed-console.README.md \
  p1-initial-failed-console.txt \
  p1-initial-failed-console.README.md
do
  if [[ -f "${STAGE}/${banned}" ]]; then
    echo "Refusing to stage historical evidence file: ${banned}" >&2
    exit 1
  fi
done

# Refuse to stage unmarked Failed current timing/summary names
if [[ -f "${STAGE}/p0-round1-timing.json" ]]; then
  if python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); sys.exit(0 if d.get("overall")=="Failed" else 1)' "${STAGE}/p0-round1-timing.json"; then
    echo "Refusing to stage p0-round1-timing.json with overall Failed" >&2
    exit 1
  fi
fi
if [[ -f "${STAGE}/p0-round1-summary.json" ]]; then
  if python3 -c 'import json,sys,re; d=json.load(open(sys.argv[1])); tech=str(d.get("zoomTechnique") or ""); sys.exit(0 if ("css" in tech.lower() or "approx-200pct-css" in open(sys.argv[1]).read().lower()) else 1)' "${STAGE}/p0-round1-summary.json"; then
    echo "Refusing to stage p0-round1-summary.json containing CSS zoom technique" >&2
    exit 1
  fi
fi

echo "Staged ${ROUND} raw-run artifact-current files:"
find "${STAGE}" -type f | sed "s|^${STAGE}/||" | sort
