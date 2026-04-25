import { describe, expect, it } from 'vitest';
import { SocialSecurityTool } from '../tools/social-security';

describe('SocialSecurityTool', () => {
  const validInput = {
    personalInfo: {
      birthDate: '1963-01-01',
      currentAge: 63,
      fullRetirementAge: 67,
      lifeExpectancy: 90,
    },
    earnings: {
      currentAnnualEarnings: 120000,
    },
    maritalStatus: 'single',
    claimingStrategy: {
      primaryClaimingAge: 67,
    },
    goals: {
      optimizeFor: 'maximum-lifetime',
      includeBreakEvenAnalysis: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(SocialSecurityTool.toolName).toBe('analyze_social_security');
    expect(SocialSecurityTool.inputSchema.required).toEqual([
      'personalInfo',
      'earnings',
      'maritalStatus',
      'claimingStrategy',
    ]);
  });

  it('calculates primary insurance amount and optimal claiming age', async () => {
    const result = (await SocialSecurityTool.execute(validInput)) as {
      summary: {
        primaryInsuranceAmount: number;
        optimalClaimingAge: number;
      };
      breakEvenAnalysis?: { breakEvenAge: number };
    };

    expect(result.summary.primaryInsuranceAmount).toBeCloseTo(3289.27, 2);
    expect(result.summary.optimalClaimingAge).toBe(70);
    expect(result.breakEvenAnalysis?.breakEvenAge).toBeGreaterThan(62);
  });

  it('rejects invalid input', async () => {
    await expect(
      SocialSecurityTool.execute({
        ...validInput,
        personalInfo: {
          ...validInput.personalInfo,
          currentAge: 71,
        },
      })
    ).rejects.toThrow();
  });
});
