import { describe, expect, it } from 'vitest';
import { FIRECalculatorTool } from '../tools/fire-calculator';

describe('FIRECalculatorTool', () => {
  const validInput = {
    currentSituation: {
      age: 30,
      currentSavings: 100000,
      annualIncome: 120000,
      annualExpenses: 48000,
      monthlySavings: 3000,
    },
    fireGoals: {
      targetAge: 45,
      annualExpensesInRetirement: 50000,
      safeWithdrawalRate: 0.04,
      fireType: 'traditional',
    },
    assumptions: {
      expectedReturn: 0.07,
      inflationRate: 0.03,
      incomeGrowth: 0.03,
      expenseReduction: 0,
    },
    analysis: {
      includeProjections: true,
      includeScenarios: true,
      includeExpenseOptimization: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(FIRECalculatorTool.toolName).toBe('analyze_fire_calculator');
    expect(FIRECalculatorTool.inputSchema.required).toEqual(['currentSituation', 'fireGoals']);
  });

  it('calculates FIRE number and savings gap', async () => {
    const result = (await FIRECalculatorTool.execute(validInput)) as {
      summary: {
        fireNumber: number;
        yearsToFIRE: number;
        projectedRetirementAge: number;
        savingsNeeded: number;
      };
    };

    expect(result.summary.fireNumber).toBeCloseTo(1250000, 6);
    expect(result.summary.savingsNeeded).toBeCloseTo(1150000, 6);
    expect(result.summary.yearsToFIRE).toBeGreaterThan(0);
    expect(result.summary.projectedRetirementAge).toBeGreaterThan(validInput.currentSituation.age);
  });

  it('rejects invalid input', async () => {
    await expect(
      FIRECalculatorTool.execute({
        ...validInput,
        fireGoals: {
          ...validInput.fireGoals,
          safeWithdrawalRate: 0.01,
        },
      })
    ).rejects.toThrow();
  });
});
