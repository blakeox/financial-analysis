#!/usr/bin/env bash
# Run Playwright smoke specs in the Docker Playwright image (host runs preflight).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SPECS="$(bash "${ROOT}/scripts/ci/playwright-smoke-specs.sh" | paste -sd' ' -)"
MODE="${1:-}"

ENV_PREFIX=""
if [[ "$MODE" == matrix ]]; then
  ENV_PREFIX="PLAYWRIGHT_MATRIX=1 "
fi

bash "${ROOT}/scripts/ci/run-in-playwright-container.sh" apps/web \
  "${ENV_PREFIX}playwright test ${SPECS}"
