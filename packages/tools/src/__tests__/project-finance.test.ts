import { describe, expect, it } from 'vitest';
import { ProjectFinanceTool } from '../tools/project-finance';

describe('ProjectFinanceTool', () => {
  const validInput = {
    projectInfo: {
      name: 'Solar Farm A',
      type: 'energy',
      duration: 3,
    },
    cashFlows: {
      initialInvestment: 500000,
      annualCashFlows: [
        { year: 1, revenue: 250000, operatingExpenses: 100000, capitalExpenditures: 10000, workingCapital: 5000 },
        { year: 2, revenue: 260000, operatingExpenses: 105000, capitalExpenditures: 5000, workingCapital: 2000 },
        { year: 3, revenue: 270000, operatingExpenses: 110000, capitalExpenditures: 0, workingCapital: 0 },
      ],
    },
    financing: {
      equityPercentage: 30,
      debtPercentage: 70,
      costOfEquity: 0.12,
      costOfDebt: 0.06,
      taxRate: 0.25,
    },
    analysis: {
      includeNPV: true,
      includeIRR: true,
      includePayback: true,
      includeSensitivity: true,
      discountRate: 0.08,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(ProjectFinanceTool.toolName).toBe('analyze_project_finance');
    expect(ProjectFinanceTool.inputSchema.required).toEqual([
      'projectInfo',
      'cashFlows',
      'financing',
    ]);
  });

  it('analyzes project finance summary outputs', async () => {
    const result = (await ProjectFinanceTool.execute(validInput)) as {
      summary: {
        npv?: number;
        irr?: number;
        paybackPeriod?: number;
        wacc: number;
        projectViability: string;
      };
    };

    expect(result.summary.wacc).toBeCloseTo(0.0675, 6);
    expect(result.summary.npv).toBeGreaterThan(0);
    expect(result.summary.irr).toBeGreaterThan(0);
    expect(result.summary.paybackPeriod).toBeGreaterThan(0);
    expect(['viable', 'not-viable', 'marginal']).toContain(result.summary.projectViability);
  });

  it('rejects invalid input', async () => {
    await expect(
      ProjectFinanceTool.execute({
        ...validInput,
        projectInfo: {
          ...validInput.projectInfo,
          duration: 0,
        },
      })
    ).rejects.toThrow();
  });
});
