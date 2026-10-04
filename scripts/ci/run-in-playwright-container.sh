#!/usr/bin/env bash
# Run a command in the official Playwright image on the NUC (uid 1001, no sudo).
set -euo pipefail

IMAGE="${PLAYWRIGHT_DOCKER_IMAGE:-mcr.microsoft.com/playwright:v1.63.0-jammy}"
WORKDIR="${1:?usage: $0 <workdir-relative-to-repo> <command>}"
shift

docker pull "$IMAGE"
cleanup() {
  docker rmi "$IMAGE" 2>/dev/null || true
}
trap cleanup EXIT

docker run --rm --user 1001:1001 \
  -v "${GITHUB_WORKSPACE}:/work" \
  -w "/work/${WORKDIR}" \
  -e CI=true \
  -e HOME=/tmp/pw-home \
  "$IMAGE" \
  bash -lc "$*"
