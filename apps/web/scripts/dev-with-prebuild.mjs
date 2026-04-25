import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const thisDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(thisDir, '../../..');
const webDir = resolve(repoRoot, 'apps/web');

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run('pnpm', ['--filter', '@financial-analysis/analysis', 'build'], repoRoot);
run('pnpm', ['--filter', '@financial-analysis/ui', 'build'], repoRoot);
rmSync(resolve(webDir, 'node_modules/.vite'), { recursive: true, force: true });

const rawArgs = process.argv.slice(2);
const astroArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;
run('pnpm', ['astro', 'dev', ...astroArgs], webDir);
