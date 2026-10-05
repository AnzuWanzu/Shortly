#!/usr/bin/env bash

set -euo pipefail

image_name='shortly-api:test'
container_name='shortly-api-image-test'

cleanup() {
  docker rm --force "${container_name}" >/dev/null 2>&1 || true
}

trap cleanup EXIT

docker build --file apps/api/Dockerfile --tag "${image_name}" .

runtime_user="$(docker image inspect "${image_name}" --format '{{.Config.User}}')"
if [[ -z "${runtime_user}" || "${runtime_user}" == '0' || "${runtime_user}" == 'root' ]]; then
  echo 'API image must declare a non-root runtime user.' >&2
  exit 1
fi

docker run --detach \
  --name "${container_name}" \
  --publish '127.0.0.1::3333' \
  --env 'DATABASE_URL=postgresql://shortly:test-password@postgres:5432/shortly' \
  --env 'REDIS_URL=redis://redis:6379' \
  "${image_name}" >/dev/null

host_port="$(docker port "${container_name}" 3333/tcp | awk -F: 'NR == 1 { print $NF }')"

for _ in {1..30}; do
  if curl --fail --silent "http://127.0.0.1:${host_port}/health" | grep --quiet '"status":"ok"'; then
    exit 0
  fi
  sleep 1
done

docker logs "${container_name}" >&2
echo 'API container did not become healthy.' >&2
exit 1
