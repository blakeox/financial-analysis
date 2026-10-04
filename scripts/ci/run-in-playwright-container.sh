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

NETWORK_ARGS=()
if [[ "${PLAYWRIGHT_USE_HOST_NETWORK:-}" == '1' ]]; then
  NETWORK_ARGS=(--network host)
fi

docker run --rm "${NETWORK_ARGS[@]}" --user 1001:1001 \
  -v "${GITHUB_WORKSPACE}:/work" \
  -w "/work/${WORKDIR}" \
  -e CI=true \
  -e HOME=/tmp/pw-home \
  -e PLAYWRIGHT_CONTAINER_CMD="$CMD" \
  -e PLAYWRIGHT_SKIP_WEBSERVER="${PLAYWRIGHT_SKIP_WEBSERVER:-}" \
  "$IMAGE" \
  bash -lc '
    set -euo pipefail
    export HOME=/tmp/pw-home
    mkdir -p "${HOME}/corepack" "${HOME}/npm-global/bin"
    export COREPACK_HOME="${HOME}/corepack"
    export NPM_CONFIG_PREFIX="${HOME}/npm-global"
    export PATH="${NPM_CONFIG_PREFIX}/bin:${HOME}/corepack/shims:/work/node_modules/.bin:/work/apps/web/node_modules/.bin:${PATH}"

    PNPM_VERSION=10.17.0
    if command -v corepack >/dev/null 2>&1; then
      corepack prepare "pnpm@${PNPM_VERSION}" --activate 2>/dev/null || true
    fi
    if ! command -v pnpm >/dev/null 2>&1; then
      curl -fsSL -o "${HOME}/pnpm" \
        "https://github.com/pnpm/pnpm/releases/download/v${PNPM_VERSION}/pnpm-linux-x64"
      chmod +x "${HOME}/pnpm"
      export PATH="${HOME}:${PATH}"
    fi
    if ! command -v pnpm >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
      npm install --prefix "${NPM_CONFIG_PREFIX}" "pnpm@${PNPM_VERSION}"
      export PATH="${NPM_CONFIG_PREFIX}/bin:${PATH}"
    fi
    command -v pnpm >/dev/null 2>&1 || {
      echo "pnpm is required in the Playwright container but could not be installed under \$HOME" >&2
      exit 127
    }

    cd "/work/'"${WORKDIR}"'"
    eval "$PLAYWRIGHT_CONTAINER_CMD"
  '
