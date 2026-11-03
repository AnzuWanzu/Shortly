#!/usr/bin/env bash

set -euo pipefail

project_name='shortly-container-test'
compose_file='infrastructure/local/compose.yaml'

cleanup() {
  result=$?
  if [[ "${result}" != '0' ]]; then
    docker compose --project-name "${project_name}" --env-file .env.example \
      --file "${compose_file}" logs --tail=30 >&2 || true
  fi
  docker compose \
    --project-name "${project_name}" \
    --env-file .env.example \
    --file "${compose_file}" \
    down --volumes --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT

export POSTGRES_PORT=15432
export REDIS_PORT=16379
export API_PORT=13333
export WEB_PORT=14200
export WEB_ORIGIN='http://localhost:14200'

docker compose \
  --project-name "${project_name}" \
  --env-file .env.example \
  --file "${compose_file}" \
  up --build --detach --wait

curl --fail --silent 'http://127.0.0.1:14200/health' |
  grep --quiet '"status":"ok"'

# A successful API response alone would also pass if NGINX bypassed Kong.
curl --fail --silent --show-error --dump-header - --output /dev/null \
  'http://127.0.0.1:14200/health' |
  grep --ignore-case --quiet '^Via: .*kong/'

curl --fail --silent 'http://127.0.0.1:14200/login' |
  grep --quiet '<div id="root"></div>'

api_user="$(docker compose \
  --project-name "${project_name}" \
  --env-file .env.example \
  --file "${compose_file}" \
  exec --no-TTY api id -u)"

web_user="$(docker compose \
  --project-name "${project_name}" \
  --env-file .env.example \
  --file "${compose_file}" \
  exec --no-TTY web id -u)"

if [[ "${api_user}" == '0' || "${web_user}" == '0' ]]; then
  echo 'Application containers must not run as root.' >&2
  exit 1
fi

SHORTLY_DISPOSABLE_STACK=1 node infrastructure/container-tests/gateway-flow.mjs
