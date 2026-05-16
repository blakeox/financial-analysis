import { describe, expect, it } from 'vitest';
import { BusinessSuccessionPlanningTool } from '../tools/business-succession-planning';

describe('BusinessSuccessionPlanningTool', () => {
  const validInput = {
    businessInfo: {
      businessName: 'Acme LLC',
      businessType: 'llc',
      annualRevenue: 2000000,
      annualEBITDA: 400000,
      totalAssets: 1500000,
      totalDebt: 300000,
    },
    ownership: {
      currentOwners: [
        {
          name: 'Alex',
          ownershipPercentage: 1,
          age: 60,
          expectedExitAge: 65,
        },
      ],
      totalOwnership: 1,
    },
    valuation: {
      valuationMethod: 'market-multiple',
      estimatedValue: 1800000,
      valuationMultiple: 5,
      industryMultiple: 5,
    },
    successionOptions: {
      transferMethod: 'family-transfer',
      buyerType: 'family-member',
      salePrice: 1800000,
    },
    taxPlanning: {
      federalEstateTaxExemption: 13400000,
      stateEstateTaxExemption: 0,
      estateTaxRate: 0.4,
      giftTaxExemption: 18000,
      includeGRAT: false,
      includeFLP: false,
    },
    buySellAgreement: {
      hasAgreement: true,
      agreementType: 'cross-purchase',
      fundingMethod: 'life-insurance',
      valuationMethod: 'formula',
    },
    analysis: {
      includeTaxAnalysis: true,
      includeEstateTaxImpact: true,
      includeTransferStrategies: true,
      includeTimingAnalysis: true,
      includeFundingAnalysis: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(BusinessSuccessionPlanningTool.toolName).toBe('analyze_business_succession_planning');
    expect(BusinessSuccessionPlanningTool.inputSchema.required).toEqual([
      'businessInfo',
      'ownerInfo',
    ]);
  });

  it('calculates business value, transfer tax, and timing', async () => {
    const result = (await BusinessSuccessionPlanningTool.execute(validInput)) as {
      summary: {
        businessValue: number;
        transferTax: number;
        recommendedStrategy: string;
        yearsUntilTransfer: number;
      };
    };

    expect(result.summary.businessValue).toBeCloseTo(2000000, 6);
    expect(result.summary.transferTax).toBeCloseTo(360000, 6);
    expect(result.summary.recommendedStrategy).toBe('family-transfer');
    expect(result.summary.yearsUntilTransfer).toBeCloseTo(5, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      BusinessSuccessionPlanningTool.execute({
        ...validInput,
        ownership: {
          ...validInput.ownership,
          currentOwners: [
            {
              ...validInput.ownership.currentOwners[0],
              ownershipPercentage: 1.5,
            },
          ],
        },
      })
    ).rejects.toThrow();
  });
});
