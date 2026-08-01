#!/usr/bin/env bash
# PLAN-0005: prove gitleaks allowlist is narrow — legitimate SHA pins pass; fake API keys fail.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "${ROOT}/scripts/plan-0005/lib-identity.sh"
EVIDENCE_DIR="${PLAN0005_EVIDENCE_DIR}"
POLICY_DIR="${EVIDENCE_DIR}/gitleaks-policy"
FIXTURE_DIR="${POLICY_DIR}/fixtures"
mkdir -p "$FIXTURE_DIR" "$EVIDENCE_DIR"

GITLEAKS_BIN="${GITLEAKS_BIN:-}"
if [[ -z "$GITLEAKS_BIN" ]]; then
  if command -v gitleaks >/dev/null 2>&1; then
    GITLEAKS_BIN="$(command -v gitleaks)"
  elif [[ -x /tmp/gitleaks821 ]]; then
    GITLEAKS_BIN=/tmp/gitleaks821
  elif [[ -x /tmp/gitleaks828 ]]; then
    GITLEAKS_BIN=/tmp/gitleaks828
  else
    curl -sL https://github.com/gitleaks/gitleaks/releases/download/v8.21.2/gitleaks_8.21.2_linux_x64.tar.gz | tar -xz -C /tmp gitleaks
    mv /tmp/gitleaks /tmp/gitleaks821
    GITLEAKS_BIN=/tmp/gitleaks821
  fi
fi

LEGIT="$FIXTURE_DIR/legitimate-sha-pin.json"
FAKE="$FIXTURE_DIR/fake-api-key-must-fail.json"
cat > "$LEGIT" <<'EOF'
{
  "openapiContractGitObjectId": "0cc5050ced6c43daf69538ad1af3fee135871e58",
  "integratedMainSha": "b94abd9a83fe29d88b095e3e9a42f10d01c05414"
}
EOF
# Construct a synthetic GitHub PAT-shaped string at runtime so the script source
# does not itself contain a gitleaks-detectable secret literal.
python3 - <<'PY' > "$FAKE"
import json
prefix = "ghp_"
body = "abcdefghijklmnopqrstuvwxyz0123456789ABCD"
print(json.dumps({
  "note": "synthetic fixture for PLAN-0005 gitleaks policy — must be detected",
  "accessToken": prefix + body
}, indent=2))
PY

# Scan fixtures with no-git mode against current config.
set +e
"$GITLEAKS_BIN" detect --no-git --source "$LEGIT" --config .gitleaks.toml --no-banner >/tmp/plan0005-gitleaks-legit.out 2>&1
LEGIT_CODE=$?
"$GITLEAKS_BIN" detect --no-git --source "$FAKE" --config .gitleaks.toml --no-banner >/tmp/plan0005-gitleaks-fake.out 2>&1
FAKE_CODE=$?
set -e

LEGIT_STATUS=Failed
FAKE_STATUS=Failed
# gitleaks exits 0 when clean, 1 when leaks found
if [[ $LEGIT_CODE -eq 0 ]]; then LEGIT_STATUS=Passed; fi
if [[ $FAKE_CODE -ne 0 ]]; then FAKE_STATUS=Passed; fi

python3 - <<PY
import json
from pathlib import Path
payload = {
  "plan": "PLAN-0005",
  "group": "gitleaks-policy",
  "gitleaksBinary": "${GITLEAKS_BIN}",
  "results": [
    {"testId": "TEST-0005-GITLEAKS-LEGIT-SHA", "status": "${LEGIT_STATUS}", "exitCode": ${LEGIT_CODE}, "note": "Known Git object ID pin field must not trip generic-api-key"},
    {"testId": "TEST-0005-GITLEAKS-FAKE-SECRET", "status": "${FAKE_STATUS}", "exitCode": ${FAKE_CODE}, "note": "Fake access token inside evidence-shaped JSON must still be detected"}
  ]
}
failed = sum(1 for r in payload["results"] if r["status"] != "Passed")
payload["summary"] = {"passed": 2 - failed, "failed": failed}
Path("${EVIDENCE_DIR}/gitleaks-policy.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(json.dumps(payload, indent=2))
raise SystemExit(1 if failed else 0)
PY

# Remove fake secret fixture so it is never published as durable evidence.
rm -f "$FAKE"
# Keep legitimate fixture as documentation of the allowlisted shape (no secret).
