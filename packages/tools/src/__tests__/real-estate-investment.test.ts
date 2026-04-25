import { describe, expect, it } from 'vitest';
import { RealEstateInvestmentTool } from '../tools/real-estate-investment';

describe('RealEstateInvestmentTool', () => {
  const validInput = {
    propertyInfo: {
      purchasePrice: 300000,
      propertyType: 'residential',
      squareFeet: 1800,
      units: 1,
    },
    financing: {
      downPayment: 60000,
      loanAmount: 240000,
      interestRate: 0.06,
      loanTerm: 30,
      loanType: 'conventional',
    },
    income: {
      monthlyRent: 2500,
      annualRentIncrease: 0.03,
      occupancyRate: 0.95,
      otherIncome: 0,
    },
    expenses: {
      propertyTaxes: 4000,
      insurance: 1200,
      maintenance: 2000,
      propertyManagement: 0,
      utilities: 0,
      otherExpenses: 0,
      vacancyRate: 0.05,
    },
    projections: {
      holdingPeriod: 10,
      appreciationRate: 0.03,
      saleCosts: 0.06,
    },
    analysis: {
      includeCapRate: true,
      includeCashOnCash: true,
      includeIRR: true,
      includeNOI: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(RealEstateInvestmentTool.toolName).toBe('analyze_real_estate_investment');
    expect(RealEstateInvestmentTool.inputSchema.required).toEqual([
      'propertyInfo',
      'financing',
      'income',
      'expenses',
    ]);
  });

  it('calculates NOI and cap rate', async () => {
    const result = (await RealEstateInvestmentTool.execute(validInput)) as {
      summary: {
        capRate?: number;
        annualNOI?: number;
        monthlyCashFlow: number;
      };
    };

    expect(result.summary.annualNOI).toBeCloseTo(21300, 6);
    expect(result.summary.capRate).toBeCloseTo(0.071, 6);
    expect(result.summary.monthlyCashFlow).toBeGreaterThan(0);
  });

  it('rejects invalid input', async () => {
    await expect(
      RealEstateInvestmentTool.execute({
        ...validInput,
        financing: {
          ...validInput.financing,
          loanTerm: 31,
        },
      })
    ).rejects.toThrow();
  });
});
