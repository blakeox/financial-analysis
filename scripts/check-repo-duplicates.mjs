#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'fs';
import { basename, join, relative, resolve } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawnSync } from 'child_process';

const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

const SKIP_DIRS = new Set([
  '.git',
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

function walkFinderPaths(dir, paths = [], { skipNodeModules = true } = {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (skipNodeModules && entry.name === 'node_modules') continue;
    const fullPath = join(dir, entry.name);
    if (FINDER_DUPLICATE.test(entry.name)) {
      paths.push(fullPath);
    }
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      walkFinderPaths(fullPath, paths, { skipNodeModules });
    }
  }
  return paths;
}

export function findMacOSFinderDuplicates(rootDir = REPO_ROOT, { skipNodeModules = true } = {}) {
  return walkFinderPaths(rootDir, [], { skipNodeModules }).map((file) => relative(rootDir, file));
}

export function findNodeModulesFinderDuplicates(rootDir = REPO_ROOT) {
  return findMacOSFinderDuplicates(rootDir, { skipNodeModules: false }).filter((path) =>
    path.split(/[/\\]/).includes('node_modules')
  );
}

function walkFiles(dir, files = [], { skipNodeModules = true } = {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (skipNodeModules && entry.name === 'node_modules') continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files, { skipNodeModules });
      continue;
    }
    files.push(fullPath);
  }
  return files;
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
  const filesOnly = process.argv.includes('--files-only');
  let failed = false;

  const finderDuplicates = findMacOSFinderDuplicates();
  if (finderDuplicates.length > 0) {
    failed = true;
    console.error('Found macOS Finder duplicate files (delete these copies):');
    for (const path of finderDuplicates) {
      console.error(`  - ${path}`);
    }
    console.error('\nRun: pnpm run clean:finder-duplicates');
  }

  const nodeModulesDuplicates = findNodeModulesFinderDuplicates();
  if (nodeModulesDuplicates.length > 0) {
    console.warn(
      `Warning: ${nodeModulesDuplicates.length} macOS Finder duplicate(s) under node_modules/ (not blocking).`
    );
    console.warn('Run: pnpm run clean:finder-duplicates -- --node-modules && pnpm install');
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

  if (filesOnly) {
    process.exit(0);
  }

  const layoutStatus = runWebTestLayout();
  process.exit(layoutStatus);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
