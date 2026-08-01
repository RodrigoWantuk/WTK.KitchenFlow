#!/usr/bin/env bash
# PLAN-0005: fail-closed consistency checks across downloaded P0/P1 evidence artifacts.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "${ROOT}/scripts/plan-0005/lib-identity.sh"
ARTIFACT_ROOT="${1:-/tmp/plan-0005-artifacts}"
EVIDENCE_DIR="${PLAN0005_EVIDENCE_DIR}"
mkdir -p "$EVIDENCE_DIR"
PR_HEAD="${PLAN0005_PR_HEAD_SHA}"
CHECKED_OUT="${PLAN0005_CHECKED_OUT_SHA}"
INTEGRATED_SHA="${PLAN0005_INTEGRATED_SHA}"
WORKFLOW_STARTED="${PLAN0005_WORKFLOW_STARTED_AT_UTC:-}"

python3 - <<PY
import json, os, re, tomllib
from datetime import datetime, timezone
from pathlib import Path

artifact_root = Path("${ARTIFACT_ROOT}")
evidence_dir = Path("${EVIDENCE_DIR}")
pr_head = "${PR_HEAD}"
checked_out = "${CHECKED_OUT}"
integrated = "${INTEGRATED_SHA}"
workflow_started = "${WORKFLOW_STARTED}".strip()
checks = []

def add(name, status, note):
    checks.append({"name": name, "status": status, "note": note})

def parse_utc(value):
    if not value:
        return None
    text = value.strip().replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text)
    except Exception:
        return None

workflow_start_dt = parse_utc(workflow_started)

p0_dirs = sorted(artifact_root.glob("plan-0005-p0-evidence-*"))
p1_dirs = sorted(artifact_root.glob("plan-0005-p1-evidence-*"))

def artifact_name_has_pr_head(dirs, label):
    if not dirs:
        add(f"{label}-artifact-present", "Failed", f"No {label} artifact under {artifact_root}")
        return
    name = dirs[-1].name
    if pr_head and pr_head in name:
        add(f"{label}-artifact-present", "Passed", name)
        add(f"{label}-artifact-name-pr-head", "Passed", f"contains prHeadSha {pr_head}")
    else:
        add(f"{label}-artifact-present", "Passed", name)
        add(f"{label}-artifact-name-pr-head", "Failed", f"artifact name {name} missing prHeadSha {pr_head}")

artifact_name_has_pr_head(p0_dirs, "p0")
artifact_name_has_pr_head(p1_dirs, "p1")

required_p0 = [
    "firefox-zoom-pointer-keyboard.json",
    "p0-round1-timing.json",
    "keycloak-p0-auth.json",
    "frontend-production-inventory.json",
    "container-count.json",
    "run-identity.json",
]
required_p1 = [
    "observability-performance-p1.json",
    "performance-smoke.json",
    "performance-concurrent-creates.json",
    "openapi-p1.json",
    "readiness-postgres-outage.json",
    "outage-mutation-recovery.json",
    "container-count.json",
    "run-identity.json",
]

def evidence_base(root: Path) -> Path:
    candidates = [root, root / "docs" / "evidence" / "plan-0005"]
    return next((c for c in candidates if c.exists()), root)

def find_file(root: Path, name: str):
    base = evidence_base(root)
    direct = base / name
    if direct.exists():
        return direct
    found = list(root.rglob(name))
    return found[0] if found else None

def require_files(label, directories, names):
    if not directories:
        return
    root = directories[-1]
    for name in names:
        path = find_file(root, name)
        if path:
            add(f"{label}:{name}", "Passed", str(path))
        else:
            add(f"{label}:{name}", "Failed", f"missing {name}")

require_files("p0", p0_dirs, required_p0)
require_files("p1", p1_dirs, required_p1)

def load_json(path: Path | None):
    if not path:
        return None
    return json.loads(path.read_text(encoding="utf-8"))

def assert_identity(obj, label):
    if not obj:
        add(f"{label}:identity", "Failed", "missing object")
        return
    bad = []
    for key in ("integratedMainSha", "prHeadSha", "checkedOutCommitSha", "evidenceGenerationSha"):
        if key not in obj or not obj.get(key):
            bad.append(f"missing {key}")
    if obj.get("integratedMainSha") and obj.get("integratedMainSha") != integrated:
        bad.append(f"integratedMainSha={obj.get('integratedMainSha')} != {integrated}")
    if obj.get("prHeadSha") and obj.get("prHeadSha") != pr_head:
        bad.append(f"prHeadSha={obj.get('prHeadSha')} != event {pr_head}")
    # checkedOut may be merge ref; must not be claimed as prHead when they differ
    if obj.get("checkedOutCommitSha") == obj.get("prHeadSha") and checked_out and checked_out != pr_head:
        # Allowed when local push; fail only if evidence claims equality incorrectly vs workflow env
        pass
    if obj.get("prHeadSha") and obj.get("checkedOutCommitSha") and obj.get("prHeadSha") == obj.get("checkedOutCommitSha") and checked_out and pr_head and checked_out != pr_head:
        bad.append("evidence conflates prHeadSha with checkedOutCommitSha while workflow merge ref differs")
    # Stale exact-head pins
    stale = {"512102ef3cfc76b213ac83e400c072d6b245ba8b", "45c1d40c738367807619f935ca95c847aacfbb2c", "8884d80394cfe23a8da4c3d44fe14b06820f8fbc"}
    for key in ("prHeadSha", "evidenceGenerationSha", "headSha"):
        val = obj.get(key)
        if val in stale and val != pr_head:
            bad.append(f"{key} points at prior tip {val}")
    add(f"{label}:identity", "Passed" if not bad else "Failed", "; ".join(bad) if bad else "ok")

def assert_fresh_timestamp(obj, label, round_started=None):
    ts = parse_utc(obj.get("generatedAtUtc") if obj else None)
    if not ts:
        add(f"{label}:freshness", "Failed", "missing generatedAtUtc")
        return
    stamp = ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
    # Prefer the producing round start from the same artifact (not the later consistency job clock).
    start = parse_utc(round_started) if round_started else None
    if start is None:
        start = workflow_start_dt
    if start is not None:
        start = start if start.tzinfo else start.replace(tzinfo=timezone.utc)
        if stamp < start:
            add(f"{label}:freshness", "Failed", f"generatedAtUtc {obj.get('generatedAtUtc')} before round start {round_started or workflow_started}")
            return
    add(f"{label}:freshness", "Passed", obj.get("generatedAtUtc"))

# Native zoom technique must not be CSS
p1_round_started = None
p0_round_started = None
if p0_dirs:
    p0_timing = load_json(find_file(p0_dirs[-1], "p0-round1-timing.json")) or {}
    p0_round_started = p0_timing.get("startedAtUtc")
if p1_dirs:
    p1_timing = load_json(find_file(p1_dirs[-1], "p1-round-timing.json")) or {}
    p1_round_started = p1_timing.get("startedAtUtc")

if p0_dirs:
    zoom_path = find_file(p0_dirs[-1], "firefox-zoom-pointer-keyboard.json")
    zoom = load_json(zoom_path)
    if zoom:
        if zoom.get("prHeadSha"):
            assert_identity(zoom, "firefox-zoom")
        technique = zoom.get("zoomTechnique") or zoom.get("results", [{}])[0].get("zoom")
        if zoom.get("cssZoomForbidden") is True and "native" in str(technique).lower():
            add("native-zoom-technique", "Passed", str(technique))
        elif "css" in str(technique).lower():
            add("native-zoom-technique", "Failed", f"CSS zoom still present: {technique}")
        else:
            add("native-zoom-technique", "Failed", f"unexpected technique: {technique}")
        ratios = [zoom.get("zoomMeasurement", {}).get("widthRatio")]
        ratios += [r.get("zoomMeasurement", {}).get("widthRatio") for r in zoom.get("results", [])]
        ok = any(isinstance(r, (int, float)) and 1.9 <= float(r) <= 2.1 for r in ratios if r is not None)
        add("native-zoom-ratio", "Passed" if ok else "Failed", f"ratios={ratios}")

# P0/P1 summaries overall Passed
for label, dirs, fname in (("p0", p0_dirs, "p0-round1-timing.json"), ("p1", p1_dirs, "p1-round-timing.json")):
    if not dirs:
        continue
    timing = load_json(find_file(dirs[-1], fname))
    if not timing:
        add(f"{label}-timing-overall", "Failed", f"missing {fname}")
        continue
    overall = timing.get("overall")
    add(f"{label}-timing-overall", "Passed" if overall == "Passed" else "Failed", f"overall={overall}")
    containers = timing.get("containers") or {}
    if "composeServiceCount" in containers or "containerCount" in timing:
        # Honest container reporting: must not claim total==2 when testcontainers exist without separation
        if timing.get("containerCount") == 2 and not containers:
            add(f"{label}-container-honesty", "Failed", "containerCount=2 without Compose/Testcontainers breakdown")
        else:
            add(f"{label}-container-honesty", "Passed", json.dumps(containers or {"containerCount": timing.get("containerCount")}))
    identity_src = load_json(find_file(dirs[-1], "run-identity.json")) or timing
    assert_identity(identity_src, f"{label}-run")

# Performance regenerated this run
if p1_dirs:
    perf = load_json(find_file(p1_dirs[-1], "performance-smoke.json"))
    if not perf:
        add("performance-metrics", "Failed", "missing performance-smoke.json")
    else:
        assert_identity(perf, "performance-smoke")
        assert_fresh_timestamp(perf, "performance-smoke", p1_round_started)
        needed = ["samples", "p50Ms", "p95Ms", "p99Ms", "errors", "ownerCrossovers", "postgresConnectionsPeak"]
        missing = [k for k in needed if k not in perf]
        metric = perf.get("postgresConnectionsMetric", "")
        if "during" not in str(metric).lower() and "sample" not in str(metric).lower():
            # still accept if sample count present
            if not perf.get("postgresConnectionsSampleCount"):
                missing.append("postgresConnectionsMetric/sampleCount")
        add("performance-metrics", "Passed" if not missing else "Failed", f"missing={missing}")
        if perf.get("status") != "Passed":
            add("performance-status", "Failed", f"status={perf.get('status')}")
        else:
            add("performance-status", "Passed", "Passed")

    creates = load_json(find_file(p1_dirs[-1], "performance-concurrent-creates.json"))
    if creates:
        assert_fresh_timestamp(creates, "performance-creates", p1_round_started)
        ok = creates.get("status") == "Passed" and creates.get("lots") == 10 and creates.get("duplicates") == 0
        add("concurrent-creates-137", "Passed" if ok else "Failed", str({k: creates.get(k) for k in ("status", "lots", "duplicates")}))
    else:
        add("concurrent-creates-137", "Failed", "missing performance-concurrent-creates.json")

    outage = load_json(find_file(p1_dirs[-1], "outage-mutation-recovery.json"))
    if not outage:
        add("outage-mutation-132", "Failed", "missing outage-mutation-recovery.json")
    else:
        assert_identity(outage, "outage-132")
        assert_fresh_timestamp(outage, "outage-132", p1_round_started)
        problems = []
        if outage.get("status") != "Passed":
            problems.append(f"status={outage.get('status')}")
        for section in ("baseline", "afterRestore", "afterRetry"):
            snap = outage.get(section) or {}
            if not isinstance(snap, dict) or not snap:
                problems.append(f"{section} empty")
                continue
            for field in ("quantity", "version", "transactionCount", "auditCount", "idempotencyCount"):
                if field not in snap:
                    problems.append(f"{section}.{field} missing")
        during = outage.get("duringOutage") or {}
        read = during.get("read") or {}
        mut = during.get("mutation") or {}
        for name, part in (("read", read), ("mutation", mut)):
            if part.get("resultType") not in {"http_error", "timeout", "connection_error"}:
                problems.append(f"duringOutage.{name}.resultType={part.get('resultType')}")
            if part.get("safeBodyValidated") is not True:
                problems.append(f"duringOutage.{name}.safeBodyValidated")
        if "idempotencyKey" not in mut:
            problems.append("duringOutage.mutation.idempotencyKey missing")
        after_retry = outage.get("afterRetry") or {}
        if after_retry.get("replayProducedAdditionalEffect") is not False:
            problems.append("replayProducedAdditionalEffect must be false")
        if after_retry.get("idempotencyCount") != 1:
            problems.append(f"afterRetry.idempotencyCount={after_retry.get('idempotencyCount')}")
        baseline = outage.get("baseline") or {}
        after_restore = outage.get("afterRestore") or {}
        for field in ("quantity", "version", "transactionCount", "auditCount"):
            if baseline.get(field) != after_restore.get(field):
                problems.append(f"partial effect: {field} changed across restore")
        if after_restore.get("idempotencyCount") not in (0, None):
            problems.append("idempotency present after restore before successful retry")
        add("outage-mutation-132", "Passed" if not problems else "Failed", "; ".join(problems) if problems else outage.get("note", "ok"))

# Historical Failed console must not be presented as current
for dirs, label in ((p0_dirs, "p0"), (p1_dirs, "p1")):
    if not dirs:
        continue
    root = dirs[-1]
    for path in root.rglob("*console*.txt"):
        name = path.name.lower()
        text = path.read_text(encoding="utf-8", errors="ignore")
        looks_failed = "overall\": \"Failed\"" in text or "overall: Failed" in text or '"overall": "Failed"' in text
        if looks_failed and "initial-failed" not in name and "historical" not in name:
            add(f"{label}-historical-failed-console", "Failed", f"{path.name} looks Failed but is not explicitly historical")
        elif "initial-failed" in name or "historical" in name:
            add(f"{label}-historical-failed-console", "Passed", f"{path.name} explicitly historical")
    # Prefer absence of p1-completion-console.txt as current
    bad_current = find_file(root, "p1-completion-console.txt")
    if bad_current:
        add("p1-current-console-name", "Failed", "p1-completion-console.txt must be renamed to historical initial-failed")
    else:
        add("p1-current-console-name", "Passed", "no ambiguous p1-completion-console.txt")

# Final assessment must not pin prior-head runs when present in artifact
for dirs in (p0_dirs, p1_dirs):
    if not dirs:
        continue
    final = load_json(find_file(dirs[-1], "final-quality-assessment.json"))
    if not final:
        continue
    head = final.get("prHeadSha") or final.get("evidenceGenerationSha") or final.get("headSha")
    if head and head != pr_head:
        add("final-assessment-head", "Failed", f"assessment head {head} != prHeadSha {pr_head}")
    else:
        add("final-assessment-head", "Passed", str(head))
    artifacts = (final.get("ci") or {}).get("artifacts") or {}
    for key, meta in artifacts.items():
        name = (meta or {}).get("name", "")
        if name and pr_head not in name:
            add(f"final-assessment-artifact-{key}", "Failed", f"{name} missing pr head")
        elif name:
            add(f"final-assessment-artifact-{key}", "Passed", name)

# Result matrix math when summary present in versioned evidence (repo copy)
matrix_path = evidence_dir / "final-quality-assessment.json"
if matrix_path.exists():
    final = load_json(matrix_path)
    tr = final.get("testCaseResults") or {}
    sub = final.get("subScenarioResults") or {}
    if tr:
        total = sum(int(tr.get(k, 0) or 0) for k in ("Passed", "Failed", "Blocked", "Deferred", "NotExecuted", "NotApplicable"))
        declared = final.get("testCaseTotal")
        if declared is not None and int(declared) != total:
            add("result-matrix-math", "Failed", f"testCaseTotal={declared} != sum {total}")
        else:
            add("result-matrix-math", "Passed", f"sum={total}")
    if sub:
        st = sum(int(sub.get(k, 0) or 0) for k in ("Passed", "Failed", "Blocked", "Deferred"))
        add("subscenario-matrix", "Passed", f"subScenarioSum={st} detail={sub}")

# Gitleaks must not contain whole-commit allowlist
gitleaks = Path(".gitleaks.toml")
if gitleaks.exists():
    raw = gitleaks.read_text(encoding="utf-8")
    data = tomllib.loads(raw)
    allow = data.get("allowlist") or {}
    commits = allow.get("commits") or []
    if commits:
        add("gitleaks-no-commit-allowlist", "Failed", f"commits allowlist present: {commits}")
    else:
        add("gitleaks-no-commit-allowlist", "Passed", "no whole-commit allowlist")
    if re.search(r"(?m)^\s*commits\s*=", raw):
        add("gitleaks-commits-key-absent", "Failed", "commits key still in toml text")
    else:
        add("gitleaks-commits-key-absent", "Passed", "commits key absent")
else:
    add("gitleaks-no-commit-allowlist", "Failed", "missing .gitleaks.toml")

# Container count evidence
for label, dirs in (("p0", p0_dirs), ("p1", p1_dirs)):
    if not dirs:
        continue
    cc = load_json(find_file(dirs[-1], "container-count.json"))
    if not cc:
        add(f"{label}-container-count", "Failed", "missing container-count.json")
        continue
    c = cc.get("containers") or {}
    needed = ["composeServiceCount", "composeServices", "testcontainersCreated", "testcontainerImages", "maximumConcurrentContainers", "totalContainerInstancesCreated"]
    missing = [k for k in needed if k not in c]
    add(f"{label}-container-count", "Passed" if not missing else "Failed", f"missing={missing} peak={c.get('maximumConcurrentContainers')}")

add("pr-head-sha-recorded", "Passed", pr_head)
add("checked-out-sha-recorded", "Passed", checked_out)
add("integrated-sha-pin", "Passed", integrated)

failed = sum(1 for c in checks if c["status"] == "Failed")
payload = {
  "plan": "PLAN-0005",
  "group": "evidence-consistency",
  "integratedMainSha": integrated,
  "prHeadSha": pr_head,
  "checkedOutCommitSha": checked_out,
  "evidenceGenerationSha": pr_head,
  "workflowStartedAtUtc": workflow_started or None,
  "checks": checks,
  "summary": {"passed": len(checks) - failed, "failed": failed},
}
(evidence_dir / "evidence-consistency.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(json.dumps(payload, indent=2))
raise SystemExit(1 if failed else 0)
PY
