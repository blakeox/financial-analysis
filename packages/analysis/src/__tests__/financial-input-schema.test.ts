import { describe, expect, it } from 'vitest';
import { FinancialInputSchema, validateFinancialInput } from '../index.js';

const buildInput = (
  overrides: Partial<{
    principal: number;
    annualRate: number;
    termMonths: number;
    residualValue?: number;
  }> = {}
) => ({
  principal: 10000,
  annualRate: 0.05,
  termMonths: 60,
  ...overrides,
});

describe('FinancialInputSchema', () => {
  it('accepts valid input and defaults residualValue to zero', () => {
    const parsed = FinancialInputSchema.parse(buildInput({ residualValue: undefined }));
    expect(parsed).toEqual({ ...buildInput(), residualValue: 0 });
    expect(validateFinancialInput(buildInput())).toBe(true);
  });

  it('rejects invalid inputs via validateFinancialInput', () => {
    expect(validateFinancialInput(buildInput({ principal: -1 }))).toBe(false);
    expect(validateFinancialInput(buildInput({ annualRate: 1.5 }))).toBe(false);
    expect(validateFinancialInput(buildInput({ termMonths: 0 }))).toBe(false);
  });
});
