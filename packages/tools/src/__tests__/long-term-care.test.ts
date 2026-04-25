import { describe, expect, it } from 'vitest';
import { LongTermCareTool } from '../tools/long-term-care';

describe('LongTermCareTool', () => {
  const validInput = {
    personalInfo: {
      age: 60,
      gender: 'male',
      healthStatus: 'good',
      familyHistory: {
        hasLTCNeeds: false,
        averageLTCDuration: 0,
      },
    },
    careNeeds: {
      expectedCareStartAge: 80,
      expectedCareDuration: 3,
      careType: 'mixed',
      annualCareCost: 100000,
      careCostInflation: 0.05,
    },
    insuranceOptions: {
      hasLTCInsurance: false,
    },
    financialResources: {
      currentAssets: 200000,
      annualIncome: 100000,
      expectedRetirementAssets: 150000,
      otherInsurance: {
        hasMedicaid: false,
        hasMedicare: true,
        hasHybridPolicy: false,
      },
    },
    strategy: {
      fundingMethod: 'hybrid',
      includeMedicaidPlanning: false,
      includeHybridPolicy: false,
    },
    analysis: {
      includeProbabilityAnalysis: true,
      includeScenarioAnalysis: true,
      projectionYears: 30,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(LongTermCareTool.toolName).toBe('analyze_long_term_care');
    expect(LongTermCareTool.inputSchema.required).toEqual([
      'personalInfo',
      'careNeeds',
      'financialResources',
    ]);
  });

  it('calculates care cost and funding summary', async () => {
    const result = (await LongTermCareTool.execute(validInput)) as {
      summary: {
        estimatedLifetimeCost: number;
        selfFundingShortfall: number;
        recommendedStrategy: string;
      };
    };

    expect(result.summary.estimatedLifetimeCost).toBeCloseTo(300000, 6);
    expect(result.summary.selfFundingShortfall).toBeCloseTo(0, 6);
    expect(result.summary.recommendedStrategy).toBe('hybrid');
  });

  it('rejects invalid input', async () => {
    await expect(
      LongTermCareTool.execute({
        ...validInput,
        personalInfo: {
          ...validInput.personalInfo,
          age: 30,
        },
      })
    ).rejects.toThrow();
  });
});
