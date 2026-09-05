#!/usr/bin/env bash

set -euo pipefail

mebibyte=$((1024 * 1024))

assert_max_size() {
  local image_name="$1"
  local max_mebibytes="$2"
  local size_bytes

  size_bytes="$(docker image inspect "${image_name}" --format '{{.Size}}')"

  if ((size_bytes > max_mebibytes * mebibyte)); then
    echo "${image_name} exceeds ${max_mebibytes} MiB: $((size_bytes / mebibyte)) MiB" >&2
    exit 1
  fi
}

docker build --quiet --file apps/api/Dockerfile --target runtime --tag shortly-api:test .
docker build --quiet --file apps/api/Dockerfile --target migrate --tag shortly-migrate:test .
docker build --quiet --file apps/web/Dockerfile --target runtime --tag shortly-web:test .

assert_max_size shortly-api:test 500
assert_max_size shortly-migrate:test 500
assert_max_size shortly-web:test 50
