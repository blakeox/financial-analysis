import { describe, expect, it } from 'vitest';
import { EmployerMatch401kTool } from '../tools/401k-match';

describe('EmployerMatch401kTool', () => {
  const validInput = {
    planDetails: {
      employerMatch: 0.5,
      matchLimit: 0.06,
      vestingSchedule: 'immediate',
      vestingYears: 0,
      currentVestingPercentage: 1,
    },
    employeeInfo: {
      annualSalary: 100000,
      currentContribution: 0.03,
      currentBalance: 50000,
      yearsOfService: 3,
    },
    analysis: {
      includeMaximization: true,
      includeVestingAnalysis: true,
      includeTaxAnalysis: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(EmployerMatch401kTool.toolName).toBe('analyze_401k_match');
    expect(EmployerMatch401kTool.inputSchema.required).toEqual(['planDetails', 'employeeInfo']);
  });

  it('calculates current and maximum employer match', async () => {
    const result = (await EmployerMatch401kTool.execute(validInput)) as {
      summary: {
        currentContribution: number;
        currentMatch: number;
        maximumMatch: number;
        matchLeftOnTable: number;
        optimalContribution: number;
      };
    };

    expect(result.summary.currentContribution).toBeCloseTo(3000, 6);
    expect(result.summary.currentMatch).toBeCloseTo(1500, 6);
    expect(result.summary.maximumMatch).toBeCloseTo(3000, 6);
    expect(result.summary.matchLeftOnTable).toBeCloseTo(1500, 6);
    expect(result.summary.optimalContribution).toBeCloseTo(0.06, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      EmployerMatch401kTool.execute({
        ...validInput,
        employeeInfo: {
          ...validInput.employeeInfo,
          currentContribution: 0.6,
        },
      })
    ).rejects.toThrow();
  });
});
