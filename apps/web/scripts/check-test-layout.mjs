#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { basename, dirname, join, relative, resolve } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const TEST_ROOT = join(APP_ROOT, 'tests');
const TEST_FILE_PATTERN = /\.(spec|test)\.ts$/;

function collectTestFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTestFiles(fullPath, files);
      continue;
    }

    if (TEST_FILE_PATTERN.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function findDuplicateBasenames(rootDir, baseDir = APP_ROOT) {
  const files = collectTestFiles(rootDir);
  const byBasename = new Map();

  for (const file of files) {
    const name = basename(file);
    const hash = createHash('sha1').update(readFileSync(file)).digest('hex');
    const record = { path: relative(baseDir, file), hash };
    const existing = byBasename.get(name) ?? [];
    existing.push(record);
    byBasename.set(name, existing);
  }

  return [...byBasename.entries()]
    .map(([name, entries]) => (entries.length > 1 ? { name, entries } : null))
    .filter(Boolean);
}

function main() {
  const duplicates = findDuplicateBasenames(TEST_ROOT);

  if (duplicates.length > 0) {
    console.error('Found duplicate Playwright spec basenames:');
    for (const duplicate of duplicates) {
      console.error(`- ${duplicate.name}`);
      for (const entry of duplicate.entries) {
        console.error(`  - ${entry.path} (${entry.hash})`);
      }
    }
    process.exit(1);
  }

  console.log('No duplicate Playwright spec basenames found.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export { collectTestFiles, findDuplicateBasenames, main };
