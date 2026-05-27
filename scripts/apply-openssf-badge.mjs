#!/usr/bin/env node
/**
 * After passing-tier enrollment on bestpractices.dev, add the README badge line.
 * Usage: node scripts/apply-openssf-badge.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const readmePath = join(root, 'README.md');
const dryRun = process.argv.includes('--dry-run');

const raw = execFileSync('node', ['scripts/check-openssf-badge.mjs', '--json'], {
  cwd: root,
  encoding: 'utf8',
});
const { project } = JSON.parse(raw);
if (!project?.id) {
  console.error('No enrolled project at passing tier. Run: pnpm run check:openssf-badge');
  process.exit(1);
}

const id = project.id;
const badgeLine = `[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/${id}/badge)](https://www.bestpractices.dev/projects/${id})`;
const readme = readFileSync(readmePath, 'utf8');

if (readme.includes('bestpractices.dev/projects/')) {
  console.log(`README already references Best Practices (project id=${id}).`);
  process.exit(0);
}

const anchor = '![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/blakeox/financial-analysis/badge)';
if (!readme.includes(anchor)) {
  console.error('Could not find Scorecard badge line in README.md');
  process.exit(1);
}

const updated = readme.replace(
  anchor,
  `${anchor}\n${badgeLine}`
);

if (dryRun) {
  console.log('Would insert after Scorecard badge:\n', badgeLine);
  process.exit(0);
}

writeFileSync(readmePath, updated);
console.log(`Added Best Practices badge (project id=${id}).`);
console.log('Next: pnpm run verify && open PR, then gh workflow run "OpenSSF Scorecard" --ref main');
