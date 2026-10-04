#!/usr/bin/env bash
# Shared Playwright smoke spec list (keep in sync with apps/web package.json test:e2e:smoke).
set -euo pipefail
printf '%s\n' \
  tests/site/site-basic.spec.ts \
  tests/site/site-navigation.spec.ts \
  tests/status/status-page.spec.ts \
  tests/a11y/a11y-smoke.spec.ts
