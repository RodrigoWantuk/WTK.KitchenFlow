#!/usr/bin/env bash
set -euo pipefail

api_url="${KITCHENFLOW_OPENAPI_URL:-https://127.0.0.1:7443/openapi/v1.json}"
snapshot="packages/contracts/openapi/kitchenflow-v1.json"
temporary_file="$(mktemp)"
trap 'rm -f "$temporary_file"' EXIT

curl_arguments=(--fail --silent --show-error)
if [[ "${KITCHENFLOW_OPENAPI_ALLOW_UNTRUSTED_LOCAL_CERTIFICATE:-0}" == "1" ]]; then
  # Diagnostic only: accepted validation uses a trusted certificate or the CI loopback HTTP URL.
  curl_arguments+=(--insecure)
fi

curl "${curl_arguments[@]}" "$api_url" | jq --sort-keys . > "$temporary_file"
mv "$temporary_file" "$snapshot"
