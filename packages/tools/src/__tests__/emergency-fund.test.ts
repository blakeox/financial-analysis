import { describe, expect, it } from 'vitest';
import { EmergencyFundTool } from '../tools/emergency-fund';

describe('EmergencyFundTool', () => {
  const validInput = {
    currentSituation: {
      monthlyExpenses: 4000,
      monthlyIncome: 7000,
      currentEmergencyFund: 10000,
      dependents: 1,
      employmentStatus: 'self-employed',
    },
    goals: {
      targetMonths: 6,
      priority: 'build-gradually',
    },
    assumptions: {
      monthlySavings: 1000,
      expectedReturn: 0,
    },
    analysis: {
      includeTimeline: true,
      includeScenarios: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(EmergencyFundTool.toolName).toBe('analyze_emergency_fund');
    expect(EmergencyFundTool.inputSchema.required).toEqual([
      'currentSituation',
      'goals',
      'assumptions',
    ]);
  });

  it('calculates emergency fund target and timeline', async () => {
    const result = (await EmergencyFundTool.execute(validInput)) as {
      summary: {
        targetFund: number;
        shortfall: number;
        monthsToBuild?: number;
        onTrack: boolean;
      };
    };

    expect(result.summary.targetFund).toBeCloseTo(40800, 6);
    expect(result.summary.shortfall).toBeCloseTo(30800, 6);
    expect(result.summary.monthsToBuild).toBe(31);
    expect(result.summary.onTrack).toBe(false);
  });

  it('rejects invalid input', async () => {
    await expect(
      EmergencyFundTool.execute({
        ...validInput,
        currentSituation: {
          ...validInput.currentSituation,
          monthlyExpenses: -1,
        },
      })
    ).rejects.toThrow();
  });
});
