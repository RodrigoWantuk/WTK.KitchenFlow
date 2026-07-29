#!/usr/bin/env bash
set -euo pipefail

api_url="${KITCHENFLOW_OPENAPI_URL:-http://127.0.0.1:7080/openapi/v1.json}"
snapshot="packages/contracts/openapi/kitchenflow-v1.json"
temporary_file="$(mktemp)"
trap 'rm -f "$temporary_file"' EXIT

curl --fail --silent --show-error "$api_url" | jq --sort-keys . > "$temporary_file"
jq --sort-keys . "$snapshot" | diff --unified -- "$temporary_file" -
