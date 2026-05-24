#!/usr/bin/env node
/**
 * CI guard: block low-contrast Tailwind text utilities on light surfaces.
 * Prefer textColors.muted / text-slate-600 dark:text-slate-400 in components.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const SCAN_ROOTS = [path.join(repoRoot, 'apps/web/src'), path.join(repoRoot, 'packages/ui/src')];

const SOURCE_EXTENSIONS = new Set(['.tsx', '.astro', '.ts']);

function hasForbiddenLightSlate400(line) {
  const withoutDarkUtilities = line.replace(/dark:[\w-]*:?text-slate-400/g, '');
  return /\btext-slate-400\b/.test(withoutDarkUtilities);
}

function hasForbiddenLightGray400(line) {
  const withoutDarkUtilities = line.replace(/dark:[\w-]*:?text-gray-400/g, '');
  return /\btext-gray-400\b/.test(withoutDarkUtilities);
}

function hasBareLightSlate500(line) {
  if (!/\btext-slate-500\b/.test(line)) return false;
  if (
    line.includes('textColors.') ||
    line.includes('copyClasses.') ||
    line.includes('fa-help-copy') ||
    line.includes('fa-meta-copy') ||
    line.includes('fa-copy-muted') ||
    line.includes('fa-script-note') ||
    line.includes('fa-script-copy-muted')
  ) {
    return false;
  }
  if (/\btext-slate-600\b/.test(line)) return false;
  if (/placeholder:text-slate-500/.test(line)) return false;
  // Paired dark secondary copy is acceptable in CI (ESLint still suggests textColors.muted).
  if (/\bdark:text-slate-[34]00\b/.test(line)) return false;
  if (/\btext-slate-600\b/.test(line) && /\bdark:text-slate-400\b/.test(line)) return false;
  return true;
}

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      await walk(fullPath, files);
      continue;
    }
    const ext = path.extname(entry.name);
    if (SOURCE_EXTENSIONS.has(ext)) files.push(fullPath);
  }
  return files;
}

async function main() {
  const violations = [];

  for (const root of SCAN_ROOTS) {
    const files = await walk(root);
    for (const file of files) {
      const rel = path.relative(repoRoot, file);
      const content = await readFile(file, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (hasForbiddenLightSlate400(line)) {
          violations.push(
            `${rel}:${i + 1} — use text-slate-600 dark:text-slate-400 (or textColors.muted), not text-slate-400 on light surfaces`
          );
        }
        if (hasForbiddenLightGray400(line)) {
          violations.push(`${rel}:${i + 1} — text-gray-400 is too light on white backgrounds`);
        }
        if (hasBareLightSlate500(line)) {
          violations.push(
            `${rel}:${i + 1} — prefer text-slate-600 dark:text-slate-400 (textColors.muted) over bare text-slate-500 on light surfaces`
          );
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('Accessibility contrast check failed:\n');
    for (const v of violations) console.error(`  • ${v}`);
    console.error('\nUse shared tokens: textColors.muted, fa-meta-copy, fa-help-copy.');
    process.exit(1);
  }

  console.log('Accessibility contrast check passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
