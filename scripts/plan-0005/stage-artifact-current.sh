#!/usr/bin/env bash
# Stage a clean PLAN-0005 artifact directory (no ambiguous stale evidence).
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

# Canonical docs (shared)
copy_if "final-quality-assessment.json"
copy_if "environment-manifest.json"
copy_if "requirements-traceability.md"
copy_if "run-identity.json"
copy_if "container-count.json"

# Explicitly historical pairs (README required for Failed/CSS content)
for base in \
  p0-round1-initial-failed-console \
  p0-initial-summary \
  p0-initial-failed-timing \
  p1-initial-failed-console
do
  copy_if "${base}.txt"
  copy_if "${base}.json"
  copy_if "${base}.README.md"
done

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
    # Current TRX / reports that are not ambiguous root duplicates
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
    ;;
  *)
    echo "usage: $0 p0|p1" >&2
    exit 2
    ;;
esac

# Refuse to stage unmarked Failed current timing/summary names
if [[ -f "${STAGE}/p0-round1-timing.json" ]]; then
  if python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); sys.exit(0 if d.get("overall")=="Failed" else 1)' "${STAGE}/p0-round1-timing.json"; then
    echo "Refusing to stage p0-round1-timing.json with overall Failed" >&2
    exit 1
  fi
fi
if [[ -f "${STAGE}/p0-round1-summary.json" ]]; then
  if grep -qiE 'approx-200pct-css|css-zoom|css zoom|"zoom"[[:space:]]*:[[:space:]]*"[^"]*css' "${STAGE}/p0-round1-summary.json"; then
    echo "Refusing to stage p0-round1-summary.json containing CSS zoom" >&2
    exit 1
  fi
fi

echo "Staged ${ROUND} artifact-current files:"
find "${STAGE}" -type f | sed "s|^${STAGE}/||" | sort
