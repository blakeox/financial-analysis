import { describe, expect, it } from 'vitest';
import { OneZeroThreeOneExchangeTool } from '../tools/1031-exchange';

describe('OneZeroThreeOneExchangeTool', () => {
  const validInput = {
    relinquishedProperty: {
      purchaseDate: '2018-01-01',
      purchasePrice: 350000,
      currentValue: 500000,
      adjustedBasis: 300000,
      accumulatedDepreciation: 50000,
      mortgageBalance: 100000,
      salePrice: 500000,
      sellingPrice: 500000,
      sellingExpenses: 0,
      netProceeds: 500000,
    },
    replacementProperty: {
      purchasePrice: 550000,
      closingCosts: 10000,
      purchaseExpenses: 10000,
      expectedValue: 600000,
      mortgageAmount: 200000,
      downPayment: 350000,
    },
    exchangeDetails: {
      exchangeType: 'delayed',
      identificationDeadline: '2025-03-01',
      closingDeadline: '2025-06-01',
      qualifiedIntermediary: true,
    },
    exchangeTimeline: {
      saleDate: '2025-01-15',
      identificationDeadline: '2025-03-01',
      closingDeadline: '2025-06-01',
      qualifiedIntermediary: true,
      qifees: 0,
    },
    taxInfo: {
      federalTaxRate: {
        ordinary: 0.37,
        capitalGains: 0.2,
        depreciationRecapture: 0.25,
      },
      stateTaxRate: 0.05,
      includeDepreciationRecapture: true,
      netInvestmentIncomeTax: false,
      niiTaxRate: 0.038,
    },
    boot: {
      cashReceived: 0,
      debtRelief: 0,
      nonLikeKindProperty: 0,
      totalBoot: 0,
    },
    analysis: {
      includeTaxDeferral: true,
      includeDepreciationRecapture: true,
      includeBootAnalysis: true,
      includeComparison: true,
      includeComplianceCheck: true,
      includeReplacementAnalysis: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(OneZeroThreeOneExchangeTool.toolName).toBe('analyze_1031_exchange');
    expect(OneZeroThreeOneExchangeTool.inputSchema.required).toEqual([
      'relinquishedProperty',
      'replacementProperty',
      'taxInfo',
    ]);
  });

  it('calculates deferred tax and recapture', async () => {
    const result = (await OneZeroThreeOneExchangeTool.execute(validInput)) as {
      summary: {
        relinquishedValue: number;
        replacementValue: number;
        taxDeferred: number;
        taxOnBoot: number;
      };
      depreciationRecapture: {
        recaptureTax: number;
      };
    };

    expect(result.summary.relinquishedValue).toBeCloseTo(500000, 6);
    expect(result.summary.replacementValue).toBeCloseTo(550000, 6);
    expect(result.summary.taxDeferred).toBeCloseTo(50000, 6);
    expect(result.summary.taxOnBoot).toBeCloseTo(0, 6);
    expect(result.depreciationRecapture.recaptureTax).toBeCloseTo(12500, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      OneZeroThreeOneExchangeTool.execute({
        ...validInput,
        taxInfo: {
          ...validInput.taxInfo,
          federalTaxRate: {
            ...validInput.taxInfo.federalTaxRate,
            capitalGains: 0.5,
          },
        },
      })
    ).rejects.toThrow();
  });
});
