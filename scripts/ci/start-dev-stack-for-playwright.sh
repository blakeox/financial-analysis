#!/usr/bin/env bash
# Start dev:all on the NUC host for Playwright (container uses --network host).
set -euo pipefail

PID_FILE="${RUNNER_TEMP:-/tmp}/fanalyx-dev-all.pid"
cd "${GITHUB_WORKSPACE:?GITHUB_WORKSPACE required}"

pnpm run dev:all &
echo $! > "${PID_FILE}"

for _ in $(seq 1 120); do
  if curl -sf http://127.0.0.1:8788 >/dev/null 2>&1; then
    echo "dev stack ready on :8788 (pid $(cat "${PID_FILE}"))"
    exit 0
  fi
  sleep 2
done

echo "Timed out waiting for http://127.0.0.1:8788" >&2
exit 1
