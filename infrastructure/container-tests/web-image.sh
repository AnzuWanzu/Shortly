#!/usr/bin/env bash

set -euo pipefail

image_name='shortly-web:test'
container_name='shortly-web-image-test'

cleanup() {
  docker rm --force "${container_name}" >/dev/null 2>&1 || true
}

trap cleanup EXIT

docker build --file apps/web/Dockerfile --tag "${image_name}" .

runtime_user="$(docker image inspect "${image_name}" --format '{{.Config.User}}')"
if [[ -z "${runtime_user}" || "${runtime_user}" == '0' || "${runtime_user}" == 'root' ]]; then
  echo 'Web image must declare a non-root runtime user.' >&2
  exit 1
fi

docker run --detach \
  --name "${container_name}" \
  --publish '127.0.0.1::8080' \
  "${image_name}" >/dev/null

host_port="$(docker port "${container_name}" 8080/tcp | awk -F: 'NR == 1 { print $NF }')"

for _ in {1..30}; do
  root_page="$(curl --fail --silent "http://127.0.0.1:${host_port}/" || true)"
  login_page="$(curl --fail --silent "http://127.0.0.1:${host_port}/login" || true)"

  if grep --quiet '<div id="root"></div>' <<<"${root_page}" && [[ "${login_page}" == "${root_page}" ]]; then
    exit 0
  fi
  sleep 1
done

docker logs "${container_name}" >&2
echo 'Web container did not serve the React application and SPA fallback.' >&2
exit 1
