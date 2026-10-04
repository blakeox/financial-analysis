#!/usr/bin/env bash
set -euo pipefail
PID_FILE="${RUNNER_TEMP:-/tmp}/fanalyx-dev-all.pid"
if [[ -f "${PID_FILE}" ]]; then
  kill "$(cat "${PID_FILE}")" 2>/dev/null || true
  rm -f "${PID_FILE}"
fi
