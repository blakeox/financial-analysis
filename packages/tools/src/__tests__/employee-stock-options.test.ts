import { describe, expect, it } from 'vitest';
import { EmployeeStockOptionsTool } from '../tools/employee-stock-options';

describe('EmployeeStockOptionsTool', () => {
  const validInput = {
    personalInfo: {
      age: 35,
      currentSalary: 180000,
      expectedRetirementAge: 65,
    },
    options: [
      {
        grantId: 'grant-1',
        grantDate: '2024-01-15',
        grantPrice: 10,
        numberOfOptions: 1000,
        vestingSchedule: {
          vestingType: 'graded',
          cliffPeriod: 1,
          vestingPeriod: 4,
        },
        expirationDate: '2035-01-15',
        optionType: 'nso',
        currentStockPrice: 20,
        expectedVolatility: 0.3,
        riskFreeRate: 0.04,
        dividendYield: 0,
      },
    ],
    taxInfo: {
      federalTaxRate: {
        ordinary: 0.32,
        capitalGains: 0.15,
        amt: false,
      },
      stateTaxRate: 0.05,
      includeAMT: true,
    },
    exerciseStrategy: {
      strategy: 'exercise-at-vest',
      exerciseAmount: 0,
      includeTaxOptimization: true,
    },
    analysis: {
      includeValuation: true,
      includeTaxAnalysis: true,
      includeExerciseScenarios: true,
      includeDilutionAnalysis: false,
      projectionYears: 10,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(EmployeeStockOptionsTool.toolName).toBe('analyze_employee_stock_options');
    expect(EmployeeStockOptionsTool.inputSchema.required).toEqual([
      'personalInfo',
      'options',
      'taxInfo',
    ]);
  });

  it('calculates option value and exercise tax', async () => {
    const result = (await EmployeeStockOptionsTool.execute(validInput)) as {
      summary: {
        totalOptions: number;
        totalIntrinsicValue: number;
        totalBlackScholesValue: number;
        estimatedTaxOnExercise: number;
      };
    };

    expect(result.summary.totalOptions).toBe(1000);
    expect(result.summary.totalIntrinsicValue).toBeCloseTo(10000, 6);
    expect(result.summary.estimatedTaxOnExercise).toBeCloseTo(3700, 6);
    expect(result.summary.totalBlackScholesValue).toBeGreaterThan(0);
  });

  it('rejects invalid input', async () => {
    await expect(
      EmployeeStockOptionsTool.execute({
        ...validInput,
        options: [
          {
            ...validInput.options[0],
            expectedVolatility: 1.5,
          },
        ],
      })
    ).rejects.toThrow();
  });
});
