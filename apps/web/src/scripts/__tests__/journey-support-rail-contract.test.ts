import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP_ROOT = resolve(process.cwd());
const JOURNEY_PAGES = resolve(APP_ROOT, 'src/pages/journey');

function collectAstroFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      collectAstroFiles(fullPath, files);
      continue;
    }
    if (entry.endsWith('.astro')) files.push(fullPath);
  }
  return files;
}

// Dedicated journey step pages under journey/.../step/*.astro (excludes scenario overview).
function listJourneyStepPages(): string[] {
  return collectAstroFiles(JOURNEY_PAGES).filter((file) => /[/\\]step[/\\]/.test(file));
}

describe('journey support rail contract', () => {
  const stepPages = listJourneyStepPages();

  it('discovers dedicated journey step pages', () => {
    expect(stepPages.length).toBeGreaterThan(10);
  });

  it('requires fa-workflow-grid + WorkflowSupportRail (or JourneyCalculatorPage fallback)', () => {
    const violations: string[] = [];

    for (const file of stepPages) {
      const rel = relative(APP_ROOT, file);
      const source = readFileSync(file, 'utf8');

      // Calculator-backed fallback already mounts the rail via JourneyCalculatorPage.
      if (source.includes('JourneyCalculatorPage')) {
        expect(source).toContain('JourneyCalculatorPage');
        continue;
      }

      const hasGrid = source.includes('fa-workflow-grid');
      const hasRail = source.includes('WorkflowSupportRail');
      const disablesGlobalChat = source.includes('showChat={false}');

      if (!hasGrid || !hasRail || !disablesGlobalChat) {
        violations.push(
          `${rel}: grid=${hasGrid} rail=${hasRail} showChat={false}=${disablesGlobalChat}`
        );
      }
    }

    expect(violations).toEqual([]);
  });
});
