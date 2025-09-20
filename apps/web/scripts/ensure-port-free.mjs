/* eslint-env node */
// Ensure the preview port is free before starting Astro preview.
// Works on macOS/Linux runners. No-op on failure.
import { execSync } from 'node:child_process';

const port = 4321;

const tryRun = (cmd) => {
  try {
    execSync(cmd, { stdio: 'ignore', shell: '/bin/bash' });
    return true;
  } catch {
    return false;
  }
};

// macOS/Linux using lsof; guard against empty PID list
if (
  !tryRun(
    `PIDS=$(lsof -ti tcp:${port} 2>/dev/null); if [[ -n "$PIDS" ]]; then kill -9 $PIDS; fi`
  )
) {
  // Ubuntu fallback using fuser
  tryRun(`fuser -k ${port}/tcp 2>/dev/null`);
}
