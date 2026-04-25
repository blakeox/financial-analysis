import { describe, expect, it } from 'vitest';
import { EstatePlanningTool } from '../tools/estate-planning';

describe('EstatePlanningTool', () => {
  const validInput = {
    personalInfo: {
      age: 60,
      maritalStatus: 'married',
      stateOfResidence: 'CA',
    },
    assets: {
      totalAssets: 5000000,
      realEstate: 2000000,
      investments: 2000000,
      retirementAccounts: 500000,
      businessInterests: 0,
      otherAssets: 500000,
    },
    estatePlan: {
      hasWill: true,
      hasTrust: false,
      beneficiaries: 2,
      charitableGiving: 0,
    },
    taxInfo: {
      federalEstateTaxExemption: 12920000,
      stateEstateTaxExemption: 0,
      expectedGrowthRate: 0.05,
      yearsToProject: 20,
    },
    analysis: {
      includeEstateTaxProjection: true,
      includeInheritanceProjection: true,
      includeTrustAnalysis: false,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(EstatePlanningTool.toolName).toBe('analyze_estate_planning');
    expect(EstatePlanningTool.inputSchema.required).toEqual([
      'personalInfo',
      'assets',
      'estatePlan',
      'taxInfo',
    ]);
  });

  it('projects estate growth and inheritance', async () => {
    const result = (await EstatePlanningTool.execute(validInput)) as {
      summary: {
        currentEstateValue: number;
        projectedEstateValue: number;
        netInheritance?: number;
        taxSavings: number;
      };
    };

    expect(result.summary.currentEstateValue).toBeCloseTo(5000000, 6);
    expect(result.summary.projectedEstateValue).toBeGreaterThan(result.summary.currentEstateValue);
    expect(result.summary.netInheritance).toBeGreaterThan(0);
    expect(result.summary.taxSavings).toBeGreaterThanOrEqual(0);
  });

  it('rejects invalid input', async () => {
    await expect(
      EstatePlanningTool.execute({
        ...validInput,
        personalInfo: {
          ...validInput.personalInfo,
          age: 10,
        },
      })
    ).rejects.toThrow();
  });
});
