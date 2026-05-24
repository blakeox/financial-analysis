import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  meetsWcagAaNormalText,
  validateRequiredContrastPairs,
  WCAG_AA_NORMAL_TEXT,
} from './a11y-contrast';

describe('a11y-contrast', () => {
  it('computes known contrast ratios', () => {
    expect(contrastRatio('#475569', '#ffffff')).toBeCloseTo(7.58, 1);
    expect(contrastRatio('#94a3b8', '#050816')).toBeCloseTo(7.78, 1);
    expect(contrastRatio('#94a3b8', '#ffffff')).toBeLessThan(WCAG_AA_NORMAL_TEXT);
  });

  it('validates required design-token pairs meet WCAG AA', () => {
    expect(validateRequiredContrastPairs()).toEqual([]);
  });

  it('flags failing pairs', () => {
    expect(meetsWcagAaNormalText('#94a3b8', '#ffffff')).toBe(false);
    expect(meetsWcagAaNormalText('#475569', '#ffffff')).toBe(true);
  });
});
