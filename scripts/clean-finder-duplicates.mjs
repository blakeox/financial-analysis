#!/usr/bin/env node

import { readdirSync, rmSync } from 'fs';
import { join, relative, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { findMacOSFinderDuplicates } from './check-repo-duplicates.mjs';

const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

const SKIP_DIRS = new Set([
  '.git',
  // node_modules is traversed only when --node-modules is passed (see skipNodeModules flag)
  'dist',
  'build',
  '.astro',
  '.wrangler',
  'coverage',
  'playwright-report',
  'test-results',
  '.pnpm-store',
]);

/** macOS Finder duplicate suffix: "file 2.md", "tokens 3.css", "package 2", etc. */
const FINDER_DUPLICATE = / \d+(\.[^./]+)?$/;

function walkFinderDuplicates(rootDir, { includeNodeModules = false } = {}) {
  const hits = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!includeNodeModules && entry.name === 'node_modules') continue;
      if (SKIP_DIRS.has(entry.name)) continue;

      const fullPath = join(dir, entry.name);
      if (FINDER_DUPLICATE.test(entry.name)) {
        hits.push(fullPath);
      }
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        stack.push(fullPath);
      }
    }
  }

  return hits;
}

function main() {
  const includeNodeModules = process.argv.includes('--node-modules');
  const dryRun = process.argv.includes('--dry-run');

  const targets = includeNodeModules
    ? walkFinderDuplicates(REPO_ROOT, { includeNodeModules: true })
    : findMacOSFinderDuplicates(REPO_ROOT).map((rel) => join(REPO_ROOT, rel));

  if (targets.length === 0) {
    console.log('No macOS Finder duplicate files found.');
    return;
  }

  console.log(
    dryRun ? 'Would delete:' : 'Deleting:',
    includeNodeModules ? '(including node_modules)' : '(repository files only)'
  );

  const orderedTargets = [...targets].sort((a, b) => b.length - a.length);

  for (const fullPath of orderedTargets) {
    const rel = relative(REPO_ROOT, fullPath);
    if (dryRun) {
      console.log(`  - ${rel}`);
      continue;
    }
    try {
      rmSync(fullPath, { force: true, recursive: true });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }
    console.log(`  - ${rel}`);
  }

  if (!dryRun && includeNodeModules) {
    console.log('\nRun `pnpm install` if you removed duplicate packages under node_modules.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
