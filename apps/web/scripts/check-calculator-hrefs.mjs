#!/usr/bin/env node
/**
 * CI guard: every literal /calculator/{id} href in apps/web/src must match CALCULATOR_CONFIGS.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const webSrc = path.join(repoRoot, 'apps/web/src');
const templatePath = path.join(webSrc, 'calculators/calculator-configs.ts');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.astro', '.mjs']);

const IGNORE_PATH_PARTS = ['/pages/calculator/', 'calculators/index.ts', 'calculators/configs/'];

const HREF_PATTERN = /\/calculator\/([a-z0-9][a-z0-9-]*)/g;

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      await walk(fullPath, files);
      continue;
    }
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

function shouldIgnore(rel) {
  return IGNORE_PATH_PARTS.some((part) => rel.includes(part));
}

async function loadCalculatorIds() {
  const content = await readFile(templatePath, 'utf8');
  const ids = new Set();
  const keyPattern = /^\s{2}(?:'([a-z0-9-]+)'|([a-z0-9-]+)):/gm;
  let match;
  while ((match = keyPattern.exec(content)) !== null) {
    ids.add(match[1] || match[2]);
  }
  if (ids.size === 0) {
    throw new Error('No calculator IDs found in calculators/calculator-configs.ts');
  }
  return ids;
}

async function main() {
  const validIds = await loadCalculatorIds();
  const violations = [];
  const files = await walk(webSrc);

  for (const file of files) {
    const rel = path.relative(repoRoot, file);
    if (shouldIgnore(rel)) continue;

    const content = await readFile(file, 'utf8');
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (line.includes('${')) continue;

      for (const match of line.matchAll(HREF_PATTERN)) {
        const id = match[1];
        if (!validIds.has(id)) {
          violations.push(`${rel}:${lineIndex + 1} — unknown calculator id "${id}"`);
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error(`Calculator href check failed (${validIds.size} valid ids):\n`);
    for (const violation of violations.slice(0, 50)) {
      console.error(`  • ${violation}`);
    }
    if (violations.length > 50) {
      console.error(`  … and ${violations.length - 50} more`);
    }
    process.exit(1);
  }

  console.log(`Calculator href check passed (${validIds.size} calculator configs).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
