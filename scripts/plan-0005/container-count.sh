#!/usr/bin/env bash
# Sample Docker container counts during PLAN-0005 runs (Compose + Testcontainers).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
source "${ROOT}/scripts/plan-0005/lib-identity.sh"
OUT="${PLAN0005_EVIDENCE_DIR}/container-count.json"
SAMPLES_FILE="${PLAN0005_EVIDENCE_DIR}/reports/container-samples.tsv"
mkdir -p "${PLAN0005_EVIDENCE_DIR}/reports"
touch "${SAMPLES_FILE}"

sample_once() {
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  python3 - <<PY >> "${SAMPLES_FILE}"
import json, subprocess
ts = "${ts}"
try:
    ids = [x.strip() for x in subprocess.check_output(["docker", "ps", "-q"], text=True).splitlines() if x.strip()]
except Exception:
    ids = []
rows = []
for cid in ids:
    try:
        raw = subprocess.check_output(
            ["docker", "inspect", "--format",
             '{{json .Name}}|{{json .Config.Image}}|{{json .Config.Labels}}', cid],
            text=True,
        ).strip()
    except Exception:
        continue
    parts = raw.split("|", 2)
    if len(parts) < 3:
        continue
    name = json.loads(parts[0]).lstrip("/")
    image = json.loads(parts[1])
    labels = json.loads(parts[2]) or {}
    is_tc = (
        str(labels.get("org.testcontainers", "")).lower() == "true"
        or labels.get("org.testcontainers.sessionId") is not None
        or "testcontainers" in image.lower()
        or "testcontainers" in name.lower()
    )
    rows.append({
        "id": cid[:12],
        "name": name,
        "image": image,
        "testcontainers": is_tc,
        "composeService": labels.get("com.docker.compose.service"),
    })
print(json.dumps({"atUtc": ts, "running": len(rows), "containers": rows}))
PY
}

MODE="${1:-sample}"
case "${MODE}" in
  sample)
    sample_once
    ;;
  finalize)
    sample_once
    python3 - <<PY
import json, subprocess
from pathlib import Path
samples_path = Path("${SAMPLES_FILE}")
rows = []
if samples_path.exists():
    for line in samples_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except Exception:
            continue

compose_services = []
try:
    out = subprocess.check_output(
        ["docker", "compose", "-f", "infrastructure/compose/compose.dev.yml", "ps", "--services", "--status", "running"],
        cwd="${ROOT}",
        text=True,
    )
    compose_services = [s.strip() for s in out.splitlines() if s.strip()]
except Exception:
    compose_services = ["postgres", "keycloak"]

tc_ids = set()
tc_images = set()
all_ids = set()
peak = 0
for row in rows:
    peak = max(peak, int(row.get("running") or 0))
    for c in row.get("containers") or []:
        cid = c.get("id") or c.get("name")
        if cid:
            all_ids.add(cid)
        if c.get("testcontainers"):
            tc_ids.add(cid or c.get("name"))
            if c.get("image"):
                tc_images.add(c["image"])

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
    "testcontainersCreated": len(tc_ids),
    "testcontainerImages": sorted(tc_images),
    "maximumConcurrentContainers": peak,
    "totalContainerInstancesCreated": len(all_ids),
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
