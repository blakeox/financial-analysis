import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { WorkbenchResultViewSchema, type WorkbenchResultView } from './workbench-contracts.js';
import {
  compareWorkbenchScenarios,
  diffWorkbenchResultViews,
  projectWorkbenchResultRenderModel,
  warningsByCategory,
} from './workbench-result-view.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');

function loadFixture(name: string): WorkbenchResultView {
  const raw = JSON.parse(readFileSync(join(fixturesDir, name), 'utf8')) as unknown;
  return WorkbenchResultViewSchema.parse(raw);
}

describe('workbench result view helpers', () => {
  const base = loadFixture('workbench-result-amortization-base.json');
  const higher = loadFixture('workbench-result-amortization-higher-rate.json');

  it('projects a reproducible render model from the same fixture', () => {
    const first = projectWorkbenchResultRenderModel(base);
    const second = projectWorkbenchResultRenderModel(base);
    expect(first).toEqual(second);
    expect(first.outputs).toEqual({ payment: 1498.88, totalInterest: 289595.06 });
    expect(first.answerIds).toEqual([]);
  });

  it('keeps answer ids as non-canonical links only', () => {
    const projected = projectWorkbenchResultRenderModel(higher);
    expect(projected.answerIds).toEqual(['answer-explanatory-only']);
    expect(projected.outputs).not.toHaveProperty('answer-explanatory-only');
  });

  it('diffs changed inputs, assumptions, and outputs between runs', () => {
    const diff = diffWorkbenchResultViews(base, higher);
    expect(diff.changedFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'inputs.annualRate', section: 'inputs' }),
        expect.objectContaining({ path: 'outputs.payment', section: 'outputs' }),
        expect.objectContaining({ path: 'assumptions.rate', section: 'assumptions' }),
      ])
    );
    expect(diffWorkbenchResultViews(base, base).changedFields).toEqual([]);
  });

  it('compares two named scenarios with shared capability and formula versions', () => {
    const comparison = compareWorkbenchScenarios([base, higher]);
    expect(comparison.scenarioNames).toEqual(['Base', 'Higher rate']);
    expect(comparison.capabilityId).toBe('analysis.amortization');
    expect(comparison.formulaVersion).toBe('1.0.0');
    expect(comparison.incompatibleReason).toBeUndefined();
    expect(comparison.diffs).toHaveLength(1);
    expect(
      comparison.diffs[0]?.changedFields.some((field) => field.path === 'outputs.payment')
    ).toBe(true);
  });

  it('fails closed when formula versions differ', () => {
    const mismatched = {
      ...higher,
      formulaVersion: '2.0.0',
    };
    const comparison = compareWorkbenchScenarios([base, mismatched]);
    expect(comparison.diffs).toEqual([]);
    expect(comparison.incompatibleReason).toMatch(/matching capabilityId and formulaVersion/i);
  });

  it('buckets warnings by evidence-first categories', () => {
    const categories = [
      ...base.warnings.map((warning) => warning.category),
      ...higher.warnings.map((warning) => warning.category),
    ];
    expect(new Set(categories)).toEqual(
      new Set(['validation', 'missing-evidence', 'stale-evidence', 'model-uncertainty'])
    );
    const buckets = warningsByCategory([...base.warnings, ...higher.warnings]);
    expect(buckets.validation).toHaveLength(1);
    expect(buckets['missing-evidence']).toHaveLength(1);
    expect(buckets['stale-evidence']).toHaveLength(1);
    expect(buckets['model-uncertainty']).toHaveLength(1);
  });
});
