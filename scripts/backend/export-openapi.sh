#!/usr/bin/env bash
set -euo pipefail

api_url="${KITCHENFLOW_OPENAPI_URL:-https://127.0.0.1:7443/openapi/v1.json}"
snapshot="packages/contracts/openapi/kitchenflow-v1.json"
temporary_file="$(mktemp)"
trap 'rm -f "$temporary_file"' EXIT

curl --fail --silent --show-error --insecure "$api_url" | jq --sort-keys . > "$temporary_file"
mv "$temporary_file" "$snapshot"

