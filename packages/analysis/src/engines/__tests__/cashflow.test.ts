import { describe, expect, it } from 'vitest';
import { CashFlowAnalyzer, type CashFlowInput } from '../cashflow';
import { createBasicCashflowInput } from './fixtures/cashflow';

type CashFlowInputOverrides = Partial<
  Omit<CashFlowInput, 'analysis' | 'discounting' | 'cashFlows'>
> & {
  cashFlows?: CashFlowInput['cashFlows'];
  analysis?: Partial<CashFlowInput['analysis']>;
  discounting?: Partial<CashFlowInput['discounting']>;
};

const createCoreInput = (overrides: CashFlowInputOverrides = {}): CashFlowInput => {
  const base = createBasicCashflowInput();
  const { analysis, discounting, cashFlows, ...rest } = overrides;

  return createBasicCashflowInput({
    ...rest,
    cashFlows: cashFlows ?? base.cashFlows,
    analysis: {
      ...base.analysis,
      includeTerminalValue: false,
      includeSensitivity: false,
      includeScenarios: false,
      ...analysis,
    },
    discounting: {
      ...base.discounting,
      ...discounting,
    },
  });
};

describe('CashFlowAnalyzer - Core Valuation Metrics', () => {
  describe('NPV', () => {
    it('is positive for a profitable project', () => {
      const result = CashFlowAnalyzer.analyze(createCoreInput());

      expect(result.npv).toBeGreaterThan(0);
    });

    it('decreases as the discount rate increases', () => {
      const lowRateResult = CashFlowAnalyzer.analyze(
        createCoreInput({ discounting: { discountRate: 0.08 } })
      );
      const highRateResult = CashFlowAnalyzer.analyze(
        createCoreInput({ discounting: { discountRate: 0.2 } })
      );

      expect(highRateResult.npv).toBeLessThan(lowRateResult.npv);
    });

    it('turns negative when inflows never cover the investment', () => {
      const input = createCoreInput({
        cashFlows: [
          {
            period: 0,
            cashFlow: -100000,
            category: 'capital-expenditure',
            inflationAdjusted: false,
          },
          { period: 1, cashFlow: 12000, category: 'revenue', inflationAdjusted: false },
          { period: 2, cashFlow: 12000, category: 'revenue', inflationAdjusted: false },
          { period: 3, cashFlow: 12000, category: 'revenue', inflationAdjusted: false },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.npv).toBeLessThan(0);
    });
  });

  describe('IRR & MIRR', () => {
    it('returns IRR between 0 and 1 for a typical project', () => {
      const result = CashFlowAnalyzer.analyze(createCoreInput());

      expect(result.irr).toBeGreaterThan(0);
      expect(result.irr).toBeLessThan(1);
    });

    it('raises MIRR when the reinvestment rate increases', () => {
      const conservative = CashFlowAnalyzer.analyze(
        createCoreInput({ analysis: { reinvestmentRate: 0.05 } })
      );
      const aggressive = CashFlowAnalyzer.analyze(
        createCoreInput({ analysis: { reinvestmentRate: 0.15 } })
      );

      expect(aggressive.mirr).toBeGreaterThan(conservative.mirr);
    });
  });

  describe('Payback Periods', () => {
    it('computes a finite simple payback for profitable cash flows', () => {
      const result = CashFlowAnalyzer.analyze(createCoreInput());

      expect(result.paybackPeriod).toBeGreaterThan(0);
      expect(result.paybackPeriod).toBeLessThan(5);
    });

    it('returns Infinity when cash flows never recover the investment', () => {
      const result = CashFlowAnalyzer.analyze(
        createCoreInput({
          cashFlows: [
            {
              period: 0,
              cashFlow: -50000,
              category: 'capital-expenditure',
              inflationAdjusted: false,
            },
            {
              period: 1,
              cashFlow: -10000,
              category: 'operating-expense',
              inflationAdjusted: false,
            },
            {
              period: 2,
              cashFlow: -10000,
              category: 'operating-expense',
              inflationAdjusted: false,
            },
          ],
        })
      );

      expect(result.paybackPeriod).toBe(Infinity);
    });

    it('ensures discounted payback is not shorter than the simple payback', () => {
      const result = CashFlowAnalyzer.analyze(createCoreInput());

      expect(result.discountedPaybackPeriod).toBeGreaterThanOrEqual(result.paybackPeriod);
    });
  });

  describe('Profitability Index', () => {
    it('exceeds 1 when the project creates value', () => {
      const result = CashFlowAnalyzer.analyze(createCoreInput());

      expect(result.profitabilityIndex).toBeGreaterThan(1);
    });

    it('drops below 1 for value-destroying projects', () => {
      const result = CashFlowAnalyzer.analyze(
        createCoreInput({
          cashFlows: [
            {
              period: 0,
              cashFlow: -80000,
              category: 'capital-expenditure',
              inflationAdjusted: false,
            },
            { period: 1, cashFlow: 15000, category: 'revenue', inflationAdjusted: false },
            { period: 2, cashFlow: 15000, category: 'revenue', inflationAdjusted: false },
            { period: 3, cashFlow: 15000, category: 'revenue', inflationAdjusted: false },
          ],
        })
      );

      expect(result.profitabilityIndex).toBeLessThan(1);
    });
  });

  describe('Equivalent Annuity', () => {
    it('scales linearly with the magnitude of cash flows', () => {
      const baseInput = createCoreInput();
      const scaledInput = createCoreInput({
        cashFlows: baseInput.cashFlows.map((cf) => ({ ...cf, cashFlow: cf.cashFlow * 2 })),
      });

      const baseResult = CashFlowAnalyzer.analyze(baseInput);
      const scaledResult = CashFlowAnalyzer.analyze(scaledInput);

      expect(scaledResult.equivalentAnnuity).toBeCloseTo(baseResult.equivalentAnnuity * 2, 2);
    });
  });

  describe('Capital Recovery Factor', () => {
    it('is bounded between 0 and 1 for reasonable inputs', () => {
      const result = CashFlowAnalyzer.analyze(createCoreInput());

      expect(result.capitalRecoveryFactor).toBeGreaterThan(0);
      expect(result.capitalRecoveryFactor).toBeLessThan(1);
    });

    it('declines as the number of periods grows', () => {
      const shortHorizon = CashFlowAnalyzer.analyze(
        createCoreInput({
          cashFlows: [
            {
              period: 0,
              cashFlow: -100000,
              category: 'capital-expenditure',
              inflationAdjusted: false,
            },
            { period: 1, cashFlow: 55000, category: 'revenue', inflationAdjusted: false },
            { period: 2, cashFlow: 60000, category: 'revenue', inflationAdjusted: false },
          ],
        })
      );
      const longHorizon = CashFlowAnalyzer.analyze(
        createCoreInput({
          cashFlows: [
            {
              period: 0,
              cashFlow: -100000,
              category: 'capital-expenditure',
              inflationAdjusted: false,
            },
            { period: 1, cashFlow: 25000, category: 'revenue', inflationAdjusted: false },
            { period: 2, cashFlow: 25000, category: 'revenue', inflationAdjusted: false },
            { period: 3, cashFlow: 25000, category: 'revenue', inflationAdjusted: false },
            { period: 4, cashFlow: 25000, category: 'revenue', inflationAdjusted: false },
            { period: 5, cashFlow: 25000, category: 'revenue', inflationAdjusted: false },
          ],
        })
      );

      expect(shortHorizon.capitalRecoveryFactor).toBeGreaterThan(longHorizon.capitalRecoveryFactor);
    });
  });

  describe('Future Value', () => {
    it('increases when later-period inflows are added', () => {
      const baseInput = createCoreInput();
      const base = CashFlowAnalyzer.analyze(baseInput);
      const extendedInput = createCoreInput({
        cashFlows: [
          ...baseInput.cashFlows,
          { period: 5, cashFlow: 50000, category: 'revenue', inflationAdjusted: false },
        ],
      });
      const extended = CashFlowAnalyzer.analyze(extendedInput);

      expect(extended.futureValue).toBeGreaterThan(base.futureValue);
    });

    it('remains finite even with low discount rates', () => {
      const result = CashFlowAnalyzer.analyze(
        createCoreInput({ discounting: { discountRate: 0.01 } })
      );

      expect(Number.isFinite(result.futureValue)).toBe(true);
    });
  });

  describe('Present Value Ratio', () => {
    it('is positive when NPV is positive', () => {
      const result = CashFlowAnalyzer.analyze(createCoreInput());

      expect(result.presentValueRatio).toBeGreaterThan(0);
    });

    it('is negative for projects that destroy value', () => {
      const result = CashFlowAnalyzer.analyze(
        createCoreInput({
          cashFlows: [
            {
              period: 0,
              cashFlow: -60000,
              category: 'capital-expenditure',
              inflationAdjusted: false,
            },
            { period: 1, cashFlow: 5000, category: 'revenue', inflationAdjusted: false },
            { period: 2, cashFlow: 5000, category: 'revenue', inflationAdjusted: false },
          ],
        })
      );

      expect(result.presentValueRatio).toBeLessThan(0);
    });
  });
});
