#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'fs';
import { basename, dirname, join, relative, resolve } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const TEST_ROOT = join(APP_ROOT, 'tests');
const TEST_FILE_PATTERN = /\.(spec|test)\.ts$/;

/** macOS Finder duplicate suffix: "file 2.md", etc. */
const FINDER_DUPLICATE = / 2(\.[^./]+)?$/;

const FORBIDDEN_DUPLICATE_MODULES = [
  {
    canonical: 'tests/_shared/nav.ts',
    legacy: 'tests/utils/nav.ts',
  },
];

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

function collectTypeScriptFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTypeScriptFiles(fullPath, files);
      continue;
    }
    if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

export function findDuplicateBasenames(rootDir, baseDir = APP_ROOT) {
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

export function findIdenticalContent(rootDir, baseDir = APP_ROOT) {
  const files = collectTypeScriptFiles(rootDir);
  const byHash = new Map();

  for (const file of files) {
    const hash = createHash('sha1').update(readFileSync(file)).digest('hex');
    const rel = relative(baseDir, file);
    const group = byHash.get(hash) ?? [];
    group.push(rel);
    byHash.set(hash, group);
  }

  return [...byHash.values()].filter((group) => group.length > 1);
}

function collectAllFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectAllFiles(fullPath, files);
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

export function findMacOSFinderCopies(rootDir, baseDir = APP_ROOT) {
  return collectAllFiles(rootDir)
    .filter((file) => FINDER_DUPLICATE.test(basename(file)))
    .map((file) => relative(baseDir, file));
}

export function findForbiddenDuplicateModules(baseDir = APP_ROOT) {
  const violations = [];
  for (const { canonical, legacy } of FORBIDDEN_DUPLICATE_MODULES) {
    const canonicalPath = join(baseDir, canonical);
    const legacyPath = join(baseDir, legacy);
    if (existsSync(canonicalPath) && existsSync(legacyPath)) {
      violations.push({ canonical, legacy });
    }
  }
  return violations;
}

function main() {
  let failed = false;

  const finderCopies = findMacOSFinderCopies(TEST_ROOT);
  if (finderCopies.length > 0) {
    failed = true;
    console.error('Found macOS Finder duplicate files under tests/ (delete them):');
    for (const path of finderCopies) {
      console.error(`  - ${path}`);
    }
  }

  const forbiddenModules = findForbiddenDuplicateModules();
  if (forbiddenModules.length > 0) {
    failed = true;
    console.error('Found legacy duplicate test modules (delete the legacy copy):');
    for (const { canonical, legacy } of forbiddenModules) {
      console.error(`  - keep ${canonical}, delete ${legacy}`);
    }
  }

  const identicalContent = findIdenticalContent(TEST_ROOT);
  if (identicalContent.length > 0) {
    failed = true;
    console.error('Found identical file content under tests/ (delete duplicates):');
    for (const group of identicalContent) {
      console.error(`  - ${group.join(' == ')}`);
    }
  }

  const duplicates = findDuplicateBasenames(TEST_ROOT);
  if (duplicates.length > 0) {
    failed = true;
    console.error('Found duplicate Playwright spec basenames:');
    for (const duplicate of duplicates) {
      console.error(`- ${duplicate.name}`);
      for (const entry of duplicate.entries) {
        console.error(`  - ${entry.path} (${entry.hash})`);
      }
    }
  }

  if (failed) {
    process.exit(1);
  }

  console.log('No duplicate Playwright specs or test files found.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
