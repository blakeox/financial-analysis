import { describe, expect, it } from 'vitest';
import { InternationalTaxPlanningTool } from '../tools/international-tax-planning';

describe('InternationalTaxPlanningTool', () => {
  const validInput = {
    personalInfo: {
      citizenship: 'US',
      residenceCountry: 'Germany',
      filingStatus: 'single',
      taxYear: 2024,
    },
    foreignIncome: {
      foreignEarnedIncome: 100000,
      foreignUnearnedIncome: 20000,
      foreignTaxPaid: 15000,
      foreignTaxRate: 0.125,
      countries: [
        {
          country: 'Germany',
          income: 120000,
          taxPaid: 15000,
        },
      ],
    },
    feie: {
      eligibleForFEIE: false,
      physicalPresenceTest: false,
      bonaFideResidenceTest: false,
      daysAbroad: 0,
      feieLimit: 126500,
      housingExclusion: 0,
    },
    foreignTaxCredit: {
      eligibleForFTC: true,
      foreignTaxPaid: 15000,
      foreignIncome: 120000,
      useFTC: true,
    },
    foreignAssets: {
      foreignBankAccounts: [],
      foreignFinancialAssets: [],
      fbarRequired: false,
      fatcaRequired: false,
    },
    taxTreaties: [
      {
        country: 'Germany',
        treatyBenefits: 'Reduced withholding',
      },
    ],
    analysis: {
      includeFEIEvsFTC: true,
      includeTaxSavings: true,
      includeComplianceCheck: true,
      includeOptimization: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(InternationalTaxPlanningTool.toolName).toBe('analyze_international_tax_planning');
    expect(InternationalTaxPlanningTool.inputSchema.required).toEqual(['personalInfo', 'income']);
  });

  it('calculates federal tax and foreign tax credit', async () => {
    const result = (await InternationalTaxPlanningTool.execute(validInput)) as {
      taxLiability: {
        usFederalTax: number;
        foreignTax: number;
        foreignTaxCredit: number;
        netTaxOwed: number;
      };
      projectedSavings: number;
    };

    expect(result.taxLiability.usFederalTax).toBeCloseTo(22200, 6);
    expect(result.taxLiability.foreignTax).toBeCloseTo(15000, 6);
    expect(result.taxLiability.foreignTaxCredit).toBeCloseTo(15000, 6);
    expect(result.taxLiability.netTaxOwed).toBeCloseTo(7200, 6);
    expect(result.projectedSavings).toBeCloseTo(15000, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      InternationalTaxPlanningTool.execute({
        ...validInput,
        foreignIncome: {
          ...validInput.foreignIncome,
          foreignTaxRate: 1.5,
        },
      })
    ).rejects.toThrow();
  });
});
