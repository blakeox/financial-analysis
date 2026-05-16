import { describe, expect, it } from 'vitest';
import { RetirementTool } from '../tools/retirement';

describe('RetirementTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(RetirementTool.toolName).toBe('analyze_retirement_savings');
    });

    it('has a description', () => {
      expect(RetirementTool.description).toBeTruthy();
      expect(RetirementTool.description.length).toBeGreaterThan(100);
    });

    it('has required input schema fields', () => {
      const schema = RetirementTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('currentAge');
      expect(schema.required).toContain('retirementAge');
      expect(schema.required).toContain('currentIncome');
      expect(schema.required).toContain('accounts');
    });

    it('supports multiple account types', () => {
      const accountTypes =
        RetirementTool.inputSchema.properties.accounts.items.properties.accountType.enum;
      expect(accountTypes).toContain('401k');
      expect(accountTypes).toContain('roth_401k');
      expect(accountTypes).toContain('traditional_ira');
      expect(accountTypes).toContain('roth_ira');
      expect(accountTypes).toContain('sep_ira');
    });
  });

  describe('execute', () => {
    it('calculates basic retirement projection', async () => {
      const result = await RetirementTool.execute({
        currentAge: 30,
        retirementAge: 65,
        currentIncome: 75000,
        accounts: [
          {
            accountType: '401k',
            currentBalance: 50000,
            annualContribution: 10000,
            employerMatch: 0.5,
            employerMatchLimit: 0.06,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.projectionSchedule).toBeDefined();
      expect(result.projectionSchedule.length).toBe(35); // 65 - 30 years
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('handles multiple accounts', async () => {
      const result = await RetirementTool.execute({
        currentAge: 35,
        retirementAge: 60,
        currentIncome: 100000,
        accounts: [
          {
            accountType: '401k',
            currentBalance: 100000,
            annualContribution: 15000,
            employerMatch: 0.5,
            employerMatchLimit: 0.06,
          },
          {
            accountType: 'roth_ira',
            currentBalance: 25000,
            annualContribution: 6500,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.projectionSchedule).toBeDefined();
      expect(result.employerMatchAnalysis).toBeDefined();
    });

    it('includes employer match analysis', async () => {
      const result = await RetirementTool.execute({
        currentAge: 40,
        retirementAge: 67,
        currentIncome: 120000,
        accounts: [
          {
            accountType: '401k',
            currentBalance: 200000,
            annualContribution: 20000,
            employerMatch: 0.5,
            employerMatchLimit: 0.06,
          },
        ],
      });

      expect(result.employerMatchAnalysis).toBeDefined();
    });

    it('includes tax advantage analysis', async () => {
      const result = await RetirementTool.execute({
        currentAge: 45,
        retirementAge: 65,
        currentIncome: 150000,
        accounts: [
          {
            accountType: '401k',
            currentBalance: 300000,
            annualContribution: 22500,
          },
          {
            accountType: 'roth_ira',
            currentBalance: 50000,
            annualContribution: 6500,
          },
        ],
      });

      expect(result.taxAdvantageAnalysis).toBeDefined();
    });

    it('includes withdrawal analysis', async () => {
      const result = await RetirementTool.execute({
        currentAge: 50,
        retirementAge: 65,
        currentIncome: 100000,
        accounts: [
          {
            accountType: '401k',
            currentBalance: 500000,
            annualContribution: 25000,
          },
        ],
        withdrawalStrategy: '4_percent_rule',
      });

      expect(result.withdrawalAnalysis).toBeDefined();
    });

    it('handles custom expected return rate', async () => {
      const result = await RetirementTool.execute({
        currentAge: 30,
        retirementAge: 65,
        currentIncome: 80000,
        accounts: [
          {
            accountType: 'traditional_ira',
            currentBalance: 30000,
            annualContribution: 6500,
          },
        ],
        expectedAnnualReturn: 0.08,
      });

      expect(result).toBeDefined();
      expect(result.projectionSchedule).toBeDefined();
    });

    it('handles inflation rate configuration', async () => {
      const result = await RetirementTool.execute({
        currentAge: 35,
        retirementAge: 60,
        currentIncome: 90000,
        accounts: [
          {
            accountType: '401k',
            currentBalance: 75000,
            annualContribution: 15000,
          },
        ],
        inflationRate: 0.025,
      });

      expect(result).toBeDefined();
    });

    it('rejects retirement age less than current age', async () => {
      await expect(
        RetirementTool.execute({
          currentAge: 65,
          retirementAge: 50,
          currentIncome: 100000,
          accounts: [
            {
              accountType: '401k',
              currentBalance: 100000,
              annualContribution: 10000,
            },
          ],
        })
      ).rejects.toThrow();
    });

    it('rejects empty accounts array', async () => {
      await expect(
        RetirementTool.execute({
          currentAge: 30,
          retirementAge: 65,
          currentIncome: 100000,
          accounts: [],
        })
      ).rejects.toThrow();
    });
  });
});
