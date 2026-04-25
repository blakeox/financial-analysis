import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PLAYWRIGHT_MATRIX_PROJECTS } from '../../../scripts/playwright-projects.mjs';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(TEST_DIR, '../../..');
const WORKFLOW_PATH = resolve(APP_ROOT, '../../.github/workflows/e2e-web.yml');
const PLAYWRIGHT_CONFIG_PATH = resolve(APP_ROOT, 'playwright.config.ts');

function getWorkflowProjects(sectionHeader: string) {
  const workflow = readFileSync(WORKFLOW_PATH, 'utf8');
  const start = workflow.indexOf(sectionHeader);
  if (start === -1) {
    throw new Error(`Missing workflow section: ${sectionHeader}`);
  }

  const block = workflow.slice(start);
  const matrixMatch = block.match(/project:\s*\[([^\]]+)\]/);
  if (matrixMatch) {
    return matrixMatch[1].split(',').map((value) => value.trim());
  }

  const optionsMatch = block.match(/options:\n((?:\s+- .+\n)+)/);
  if (!optionsMatch) {
    throw new Error(`Missing project options in section: ${sectionHeader}`);
  }

  return optionsMatch[1]
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '').trim());
}

describe('Playwright project contracts', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('keeps the runner, config, and full-matrix workflow in sync', () => {
    const configSource = readFileSync(PLAYWRIGHT_CONFIG_PATH, 'utf8');

    expect(configSource).toContain('PLAYWRIGHT_MATRIX_PROJECTS');
    expect(configSource).toContain('PLAYWRIGHT_PROJECT_DEVICE_MAP[name]');
    expect(getWorkflowProjects('full-matrix:')).toEqual(PLAYWRIGHT_MATRIX_PROJECTS);
  });

  it('keeps the workflow dispatch project selector in sync with matrix support', () => {
    expect(getWorkflowProjects('      project:')).toEqual(PLAYWRIGHT_MATRIX_PROJECTS);
  });
});
