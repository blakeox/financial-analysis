#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'fs';
import { basename, join, relative, resolve } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawnSync } from 'child_process';

const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.astro',
  '.wrangler',
  'coverage',
  'playwright-report',
  'test-results',
  '.pnpm-store',
]);

/** macOS Finder duplicate suffix: "file 2.md", ".nvmrc 2", etc. */
const FINDER_DUPLICATE = / 2(\.[^./]+)?$/;

function walkFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

export function findMacOSFinderDuplicates(rootDir = REPO_ROOT) {
  const hits = [];
  for (const file of walkFiles(rootDir)) {
    const name = basename(file);
    if (FINDER_DUPLICATE.test(name)) {
      hits.push(relative(rootDir, file));
    }
  }
  return hits;
}

export function findIdenticalFiles(rootDir, { include = () => true } = {}) {
  const byHash = new Map();
  for (const file of walkFiles(rootDir)) {
    if (!include(file)) continue;
    const hash = createHash('sha1').update(readFileSync(file)).digest('hex');
    const rel = relative(rootDir, file);
    const group = byHash.get(hash) ?? [];
    group.push(rel);
    byHash.set(hash, group);
  }
  return [...byHash.values()].filter((group) => group.length > 1);
}

function runWebTestLayout() {
  const result = spawnSync('pnpm', ['--filter', '@financial-analysis/web', 'run', 'test:layout'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  return result.status ?? 1;
}

function main() {
  let failed = false;

  const finderDuplicates = findMacOSFinderDuplicates();
  if (finderDuplicates.length > 0) {
    failed = true;
    console.error('Found macOS Finder duplicate files (delete these copies):');
    for (const path of finderDuplicates) {
      console.error(`  - ${path}`);
    }
  }

  const webTestRoot = join(REPO_ROOT, 'apps/web/tests');
  const identicalTestHelpers = findIdenticalFiles(webTestRoot, {
    include: (file) => file.endsWith('.ts') && !file.endsWith('.d.ts'),
  });
  if (identicalTestHelpers.length > 0) {
    failed = true;
    console.error('Found identical files under apps/web/tests (keep one, delete the rest):');
    for (const group of identicalTestHelpers) {
      console.error(`  - ${group.join(' == ')}`);
    }
  }

  if (failed) {
    process.exit(1);
  }

  const layoutStatus = runWebTestLayout();
  process.exit(layoutStatus);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
