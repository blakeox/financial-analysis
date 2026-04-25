import { describe, expect, it } from 'vitest';
import { EquipmentLeaseVsBuyTool } from '../tools/equipment-lease-vs-buy';

describe('EquipmentLeaseVsBuyTool', () => {
  const validInput = {
    equipmentInfo: {
      purchasePrice: 50000,
      usefulLife: 5,
      expectedResidualValue: 10000,
    },
    leaseTerms: {
      leaseType: 'operating-lease',
      leaseTerm: 5,
      monthlyPayment: 1000,
      downPayment: 0,
      buyoutOption: false,
      buyoutPrice: 0,
      maintenanceIncluded: false,
      annualMaintenanceCost: 0,
    },
    purchaseTerms: {
      downPayment: 0,
      loanTerm: 5,
      interestRate: 0.08,
      annualMaintenanceCost: 1000,
      insuranceCost: 500,
    },
    taxInfo: {
      federalTaxRate: 0.21,
      stateTaxRate: 0.05,
      section179Eligible: true,
      section179Deduction: 50000,
      bonusDepreciationEligible: false,
      bonusDepreciationPercentage: 0,
    },
    financialAssumptions: {
      opportunityCostRate: 0.1,
      inflationRate: 0.03,
      analysisPeriod: 5,
    },
    analysis: {
      includeNPV: true,
      includeIRR: true,
      includeCashFlowComparison: true,
      includeTaxImpact: true,
      analysisPeriod: 5,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(EquipmentLeaseVsBuyTool.toolName).toBe('analyze_equipment_lease_vs_buy');
    expect(EquipmentLeaseVsBuyTool.inputSchema.required).toEqual([
      'equipmentInfo',
      'leaseTerms',
      'purchaseTerms',
      'taxInfo',
      'analysis',
    ]);
  });

  it('compares lease and purchase costs', async () => {
    const result = (await EquipmentLeaseVsBuyTool.execute(validInput)) as {
      summary: {
        leaseTotalCost: number;
        purchaseTotalCost: number;
        betterOption: string;
        costDifference: number;
      };
      recommendation: {
        recommendedOption: string;
      };
    };

    expect(result.summary.leaseTotalCost).toBeCloseTo(60000, 6);
    expect(result.summary.purchaseTotalCost).toBeCloseTo(42868.02, 2);
    expect(result.summary.betterOption).toBe('lease');
    expect(result.summary.costDifference).toBeCloseTo(17131.98, 2);
    expect(result.recommendation.recommendedOption).toBe('lease');
  });

  it('rejects invalid input', async () => {
    await expect(
      EquipmentLeaseVsBuyTool.execute({
        ...validInput,
        purchaseTerms: {
          ...validInput.purchaseTerms,
          interestRate: 0.5,
        },
      })
    ).rejects.toThrow();
  });
});
