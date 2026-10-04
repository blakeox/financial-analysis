#!/usr/bin/env bash
# Run a command in the official Playwright image on the NUC (uid 1001, no sudo).
set -euo pipefail

IMAGE="${PLAYWRIGHT_DOCKER_IMAGE:-mcr.microsoft.com/playwright:v1.63.0-jammy}"
WORKDIR="${1:?usage: $0 <workdir-relative-to-repo> <command>}"
shift
CMD="$*"

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
  -e PLAYWRIGHT_CONTAINER_CMD="$CMD" \
  "$IMAGE" \
  bash -lc '
    set -euo pipefail
    export HOME=/tmp/pw-home
    export NPM_CONFIG_PREFIX="${HOME}/npm-global"
    mkdir -p "${NPM_CONFIG_PREFIX}/bin" "${HOME}/pnpm"
    export PATH="${NPM_CONFIG_PREFIX}/bin:${HOME}/pnpm:/work/node_modules/.bin:/work/apps/web/node_modules/.bin:${PATH}"
    if ! command -v pnpm >/dev/null 2>&1; then
      npm install --prefix "${NPM_CONFIG_PREFIX}" pnpm@10.17.0
    fi
    cd "/work/'"${WORKDIR}"'"
    eval "$PLAYWRIGHT_CONTAINER_CMD"
  '
