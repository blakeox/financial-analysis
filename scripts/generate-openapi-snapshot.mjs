#!/usr/bin/env node
/* eslint-env node */
import { spawn } from 'node:child_process';

const child = spawn(
  'pnpm',
  [
    '--filter',
    '@financial-analysis/api',
    'exec',
    'vitest',
    'run',
    'src/__tests__/openapi-snapshot.test.ts',
    '--update',
  ],
  {
    stdio: 'inherit',
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
