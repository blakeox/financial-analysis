import { describe, it, expect } from 'vitest';
import { analyze } from '../retirement';
import type { RetirementInput } from '../../schemas/retirement';

describe('Retirement Analysis Engine', () => {
  const basicInput: RetirementInput = {
    currentAge: 30,
    retirementAge: 65,
    currentIncome: 100000,
    incomeIncreaseRate: 0.03,
    accounts: [
      {
        accountType: '401k',
        currentBalance: 50000,
        annualContribution: 15000,
        employerMatch: 0.5, // 50% match
        employerMatchLimit: 0.06, // up to 6% of salary
      },
      {
        accountType: 'roth_ira',
        currentBalance: 20000,
        annualContribution: 6500,
      },
    ],
    expectedAnnualReturn: 0.07,
    inflationRate: 0.03,
    withdrawalStrategy: '4_percent_rule',
  };

  describe('basic retirement projections', () => {
    it('generates projection schedule', () => {
      const result = analyze(basicInput);

      expect(result.projectionSchedule).toBeDefined();
      expect(result.projectionSchedule.length).toBe(35); // 65 - 30 = 35 years
    });

    it('calculates year-by-year balances', () => {
      const result = analyze(basicInput);

      const firstYear = result.projectionSchedule[0]!;
      const lastYear = result.projectionSchedule[result.projectionSchedule.length - 1]!;

      expect(firstYear.age).toBe(31);
      expect(lastYear.age).toBe(65);
      expect(parseFloat(lastYear.totalBalance)).toBeGreaterThan(parseFloat(firstYear.totalBalance));
    });

    it('tracks contributions and growth separately', () => {
      const result = analyze(basicInput);

      const firstYear = result.projectionSchedule[0]!;

      expect(firstYear.totalContribution).toBeDefined();
      expect(firstYear.totalGrowth).toBeDefined();
      expect(firstYear.totalBalance).toBeDefined();
    });

    it('calculates inflation-adjusted (real) value', () => {
      const result = analyze(basicInput);

      const lastYear = result.projectionSchedule[result.projectionSchedule.length - 1]!;

      // Real value should be less than nominal value due to inflation
      expect(parseFloat(lastYear.realValue)).toBeLessThan(parseFloat(lastYear.totalBalance));
    });
  });

  describe('employer match', () => {
    it('calculates employer match contributions', () => {
      const result = analyze(basicInput);

      const firstYear = result.projectionSchedule[0]!;
      expect(parseFloat(firstYear.totalEmployerMatch)).toBeGreaterThan(0);
    });

    it('analyzes employer match optimization', () => {
      const result = analyze(basicInput);

      expect(result.employerMatchAnalysis).toBeDefined();
      expect(result.employerMatchAnalysis.currentMatchAmount).toBeDefined();
      expect(result.employerMatchAnalysis.maxPossibleMatch).toBeDefined();
    });

    it('identifies when full match is captured', () => {
      const fullMatchInput: RetirementInput = {
        ...basicInput,
        accounts: [
          {
            accountType: '401k',
            currentBalance: 50000,
            annualContribution: 20000, // Enough to capture full match
            employerMatch: 0.5,
            employerMatchLimit: 0.06,
          },
        ],
      };

      const result = analyze(fullMatchInput);

      expect(result.employerMatchAnalysis.isOptimized).toBe(true);
    });

    it('identifies missed employer match', () => {
      const missedMatchInput: RetirementInput = {
        ...basicInput,
        accounts: [
          {
            accountType: '401k',
            currentBalance: 50000,
            annualContribution: 3000, // 3% - below 6% match limit
            employerMatch: 0.5,
            employerMatchLimit: 0.06,
          },
        ],
      };

      const result = analyze(missedMatchInput);

      expect(result.employerMatchAnalysis.isOptimized).toBe(false);
      expect(parseFloat(result.employerMatchAnalysis.unmatchedAmount)).toBeGreaterThan(0);
    });
  });

  describe('tax advantage analysis', () => {
    it('analyzes pre-tax and Roth contributions', () => {
      const result = analyze(basicInput);

      expect(result.taxAdvantageAnalysis).toBeDefined();
      expect(result.taxAdvantageAnalysis.totalPreTaxContributions).toBeDefined();
      expect(result.taxAdvantageAnalysis.totalRothContributions).toBeDefined();
    });

    it('estimates tax savings from pre-tax contributions', () => {
      const result = analyze(basicInput);

      expect(parseFloat(result.taxAdvantageAnalysis.estimatedTaxSavings)).toBeGreaterThan(0);
    });

    it('calculates tax diversification score', () => {
      const result = analyze(basicInput);

      expect(result.taxAdvantageAnalysis.taxDiversificationScore).toBeDefined();
    });
  });

  describe('withdrawal analysis', () => {
    it('analyzes 4% rule withdrawal strategy', () => {
      const result = analyze(basicInput);

      expect(result.withdrawalAnalysis).toBeDefined();
      expect(result.withdrawalAnalysis.strategy).toBe('4_percent_rule');
      expect(parseFloat(result.withdrawalAnalysis.firstYearWithdrawal)).toBeGreaterThan(0);
    });

    it('calculates projected monthly income', () => {
      const result = analyze(basicInput);

      expect(parseFloat(result.withdrawalAnalysis.projectedMonthlyIncome)).toBeGreaterThan(0);
    });

    it('estimates portfolio longevity', () => {
      const result = analyze(basicInput);

      expect(result.withdrawalAnalysis.portfolioLastsUntilAge).toBeGreaterThanOrEqual(
        basicInput.retirementAge
      );
    });

    it('handles fixed_amount withdrawal strategy', () => {
      const fixedAmountInput: RetirementInput = {
        ...basicInput,
        withdrawalStrategy: 'fixed_amount',
        desiredRetirementIncome: 60000,
      };

      const result = analyze(fixedAmountInput);

      expect(result.withdrawalAnalysis.strategy).toBe('fixed_amount');
    });

    it('handles required_minimum withdrawal strategy', () => {
      const rmdInput: RetirementInput = {
        ...basicInput,
        withdrawalStrategy: 'required_minimum',
      };

      const result = analyze(rmdInput);

      expect(result.withdrawalAnalysis.strategy).toBe('required_minimum');
    });
  });

  describe('summary', () => {
    it('calculates projected balance at retirement', () => {
      const result = analyze(basicInput);

      expect(result.summary.projectedBalanceAtRetirement).toBeDefined();
      expect(parseFloat(result.summary.projectedBalanceAtRetirement)).toBeGreaterThan(0);
    });

    it('calculates total contributions', () => {
      const result = analyze(basicInput);

      expect(parseFloat(result.summary.totalContributions)).toBeGreaterThan(0);
    });

    it('calculates total employer match', () => {
      const result = analyze(basicInput);

      expect(parseFloat(result.summary.totalEmployerMatch)).toBeGreaterThan(0);
    });

    it('calculates total growth', () => {
      const result = analyze(basicInput);

      // Growth = Final Balance - Contributions - Match
      expect(parseFloat(result.summary.totalGrowth)).toBeGreaterThan(0);
    });

    it('calculates income replacement ratio', () => {
      const result = analyze(basicInput);

      expect(parseFloat(result.summary.replacementRatio)).toBeGreaterThan(0);
    });

    it('determines if on track for retirement', () => {
      const result = analyze(basicInput);

      expect(typeof result.summary.onTrack).toBe('boolean');
    });
  });

  describe('recommendations', () => {
    it('generates recommendations', () => {
      const result = analyze(basicInput);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('account types', () => {
    it('handles traditional IRA', () => {
      const iraInput: RetirementInput = {
        ...basicInput,
        accounts: [
          {
            accountType: 'traditional_ira',
            currentBalance: 30000,
            annualContribution: 6500,
          },
        ],
      };

      const result = analyze(iraInput);

      expect(result.projectionSchedule.length).toBeGreaterThan(0);
    });

    it('handles SEP IRA', () => {
      const sepInput: RetirementInput = {
        ...basicInput,
        accounts: [
          {
            accountType: 'sep_ira',
            currentBalance: 100000,
            annualContribution: 25000,
          },
        ],
      };

      const result = analyze(sepInput);

      expect(result.projectionSchedule.length).toBeGreaterThan(0);
    });

    it('handles Roth 401k', () => {
      const roth401kInput: RetirementInput = {
        ...basicInput,
        accounts: [
          {
            accountType: 'roth_401k',
            currentBalance: 40000,
            annualContribution: 15000,
            employerMatch: 0.5,
            employerMatchLimit: 0.06,
          },
        ],
      };

      const result = analyze(roth401kInput);

      expect(result.projectionSchedule.length).toBeGreaterThan(0);
    });

    it('handles taxable account', () => {
      const taxableInput: RetirementInput = {
        ...basicInput,
        accounts: [
          {
            accountType: 'taxable',
            currentBalance: 50000,
            annualContribution: 10000,
          },
        ],
      };

      const result = analyze(taxableInput);

      expect(result.projectionSchedule.length).toBeGreaterThan(0);
    });

    it('handles multiple account types', () => {
      const result = analyze(basicInput);

      const firstYear = result.projectionSchedule[0]!;
      expect(firstYear.accounts.length).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('throws error if retirement age is not greater than current age', () => {
      const invalidInput: RetirementInput = {
        ...basicInput,
        currentAge: 65,
        retirementAge: 60,
      };

      expect(() => analyze(invalidInput)).toThrow();
    });

    it('handles near-term retirement (5 years)', () => {
      const nearTermInput: RetirementInput = {
        ...basicInput,
        currentAge: 60,
        retirementAge: 65,
      };

      const result = analyze(nearTermInput);

      expect(result.projectionSchedule.length).toBe(5);
    });

    it('handles long-term retirement (40 years)', () => {
      const longTermInput: RetirementInput = {
        ...basicInput,
        currentAge: 25,
        retirementAge: 65,
      };

      const result = analyze(longTermInput);

      expect(result.projectionSchedule.length).toBe(40);
    });

    it('handles zero starting balance', () => {
      const zeroBalanceInput: RetirementInput = {
        ...basicInput,
        accounts: [
          {
            accountType: '401k',
            currentBalance: 0,
            annualContribution: 15000,
            employerMatch: 0.5,
            employerMatchLimit: 0.06,
          },
        ],
      };

      const result = analyze(zeroBalanceInput);

      expect(result.projectionSchedule.length).toBeGreaterThan(0);
      const lastYear = result.projectionSchedule[result.projectionSchedule.length - 1]!;
      expect(parseFloat(lastYear.totalBalance)).toBeGreaterThan(0);
    });
  });

  describe('input reflection', () => {
    it('reflects input parameters correctly', () => {
      const result = analyze(basicInput);

      expect(result.input.currentAge).toBe(30);
      expect(result.input.retirementAge).toBe(65);
      expect(result.input.totalAccounts).toBe(2);
    });
  });

  describe('metadata', () => {
    it('includes calculation metadata', () => {
      const result = analyze(basicInput);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.calculatedAt).toBeDefined();
      expect(result.metadata.version).toBe('1.0.0');
    });
  });
});
