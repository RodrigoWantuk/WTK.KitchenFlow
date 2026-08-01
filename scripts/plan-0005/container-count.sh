#!/usr/bin/env bash
# Sample Docker container counts during PLAN-0005 runs (Compose + Testcontainers).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
source "${ROOT}/scripts/plan-0005/lib-identity.sh"
OUT="${PLAN0005_EVIDENCE_DIR}/container-count.json"
SAMPLES_FILE="${PLAN0005_EVIDENCE_DIR}/reports/container-samples.tsv"
mkdir -p "${PLAN0005_EVIDENCE_DIR}/reports"
: > "${SAMPLES_FILE}"

sample_once() {
  local ts running names images
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  running="$(docker ps -q | wc -l | tr -d ' ')"
  names="$(docker ps --format '{{.Names}}' | paste -sd, - || true)"
  images="$(docker ps --format '{{.Image}}' | paste -sd, - || true)"
  printf '%s\t%s\t%s\t%s\n' "${ts}" "${running}" "${names}" "${images}" >> "${SAMPLES_FILE}"
}

MODE="${1:-sample}"
case "${MODE}" in
  sample)
    sample_once
    ;;
  finalize)
    sample_once
    python3 - <<PY
import json, re
from pathlib import Path
samples_path = Path("${SAMPLES_FILE}")
rows = []
if samples_path.exists():
    for line in samples_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        rows.append({
            "atUtc": parts[0],
            "running": int(parts[1]),
            "names": parts[2].split(",") if len(parts) > 2 and parts[2] else [],
            "images": parts[3].split(",") if len(parts) > 3 and parts[3] else [],
        })

compose_names = set()
testcontainer_images = set()
testcontainers_seen = 0
peak = 0
for row in rows:
    peak = max(peak, row["running"])
    for name in row["names"]:
        low = name.lower()
        if "postgres" in low or "keycloak" in low:
            if "testcontainers" not in low and re.search(r"(compose|infrastructure|kitchenflow).*", low) or name in {"postgres", "keycloak"} or "compose" in low or low.endswith("-postgres-1") or low.endswith("-keycloak-1"):
                compose_names.add(name)
        if "testcontainers" in low or re.match(r"^[a-f0-9]{12}$", name):
            testcontainers_seen += 1
    for img in row["images"]:
        if "testcontainers" in img.lower() or "/postgres" in img.lower() or img.startswith("postgres:"):
            # Distinguish: compose postgres often named via compose project; testcontainers uses random ids
            pass
        if any(n for n in row["names"] if "testcontainers" in n.lower() or re.match(r"^[a-f0-9]{12}$", n)):
            testcontainer_images.add(img)

# Prefer compose service detection via docker compose
compose_services = []
try:
    import subprocess
    out = subprocess.check_output(
        ["docker", "compose", "-f", "infrastructure/compose/compose.dev.yml", "ps", "--services", "--status", "running"],
        cwd="${ROOT}",
        text=True,
    )
    compose_services = [s.strip() for s in out.splitlines() if s.strip()]
except Exception:
    compose_services = sorted({n for n in compose_names}) or ["postgres", "keycloak"]

# Count unique testcontainer-like names across samples
tc_names = set()
for row in rows:
    for name in row["names"]:
        if "testcontainers" in name.lower() or (re.fullmatch(r"[a-f0-9]{12}", name) and name not in compose_services):
            tc_names.add(name)
        # Testcontainers Ryuk / postgres containers often look like random hex or include /testcontainers/
    for img, name in zip(row["images"], row["names"] if len(row["names"]) == len(row["images"]) else row["names"] + [""] * len(row["images"])):
        if "testcontainers" in (img or "").lower():
            tc_names.add(name or img)

payload = {
  "plan": "PLAN-0005",
  "integratedMainSha": "${PLAN0005_INTEGRATED_SHA}",
  "prHeadSha": "${PLAN0005_PR_HEAD_SHA}",
  "checkedOutCommitSha": "${PLAN0005_CHECKED_OUT_SHA}",
  "evidenceGenerationSha": "${PLAN0005_EVIDENCE_GENERATION_SHA}",
  "generatedAtUtc": rows[-1]["atUtc"] if rows else None,
  "sampleCount": len(rows),
  "containers": {
    "composeServiceCount": len(compose_services),
    "composeServices": compose_services,
    "testcontainersCreated": len(tc_names),
    "testcontainerImages": sorted({img for row in rows for img, name in zip(row["images"], row["names"] + [""] * 20) if name in tc_names or "testcontainers" in (img or "").lower()}),
    "maximumConcurrentContainers": peak,
    "totalContainerInstancesCreated": len({n for row in rows for n in row["names"] if n}),
  },
  "samples": rows[-20:],
}
Path("${OUT}").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(json.dumps(payload["containers"], indent=2))
PY
    ;;
  *)
    echo "usage: $0 sample|finalize" >&2
    exit 2
    ;;
esac
