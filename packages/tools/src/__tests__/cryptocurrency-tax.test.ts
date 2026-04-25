import { describe, expect, it } from 'vitest';
import { CryptocurrencyTaxTool } from '../tools/cryptocurrency-tax';

describe('CryptocurrencyTaxTool', () => {
  const validInput = {
    personalInfo: {
      country: 'US',
      taxYear: 2024,
      filingStatus: 'single',
    },
    transactions: [
      {
        transactionId: 'buy-1',
        date: '2024-01-01',
        transactionType: 'buy',
        asset: 'BTC',
        quantity: 1,
        pricePerUnit: 30000,
        totalValue: 30000,
        fees: 0,
      },
      {
        transactionId: 'sell-1',
        date: '2024-06-01',
        transactionType: 'sell',
        asset: 'BTC',
        quantity: 1,
        pricePerUnit: 40000,
        totalValue: 40000,
        proceeds: 40000,
        fees: 0,
      },
    ],
    costBasisMethod: 'fifo',
    taxInfo: {
      federalTaxRate: {
        shortTerm: 0.24,
        longTerm: 0.15,
      },
      stateTaxRate: 0.05,
      incomeBracket: 0.24,
    },
    incomeTransactions: {
      miningIncome: 1000,
      stakingRewards: 0,
      defiYield: 0,
      airdrops: 0,
      forks: 0,
    },
    analysis: {
      includeRealizedGains: true,
      includeUnrealizedGains: true,
      includeTaxLossHarvesting: true,
      includeWashSaleAnalysis: true,
      includeMethodComparison: false,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(CryptocurrencyTaxTool.toolName).toBe('analyze_cryptocurrency_tax');
    expect(CryptocurrencyTaxTool.inputSchema.required).toEqual(['personalInfo', 'transactions']);
  });

  it('calculates realized gains and tax liability', async () => {
    const result = (await CryptocurrencyTaxTool.execute(validInput)) as {
      summary: {
        totalRealizedGains: number;
        netCapitalGains: number;
        incomeTax: number;
        totalTaxLiability: number;
      };
    };

    expect(result.summary.totalRealizedGains).toBeCloseTo(10000, 6);
    expect(result.summary.netCapitalGains).toBeCloseTo(10000, 6);
    expect(result.summary.incomeTax).toBeCloseTo(290, 6);
    expect(result.summary.totalTaxLiability).toBeCloseTo(1790, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      CryptocurrencyTaxTool.execute({
        ...validInput,
        taxInfo: {
          ...validInput.taxInfo,
          federalTaxRate: {
            ...validInput.taxInfo.federalTaxRate,
            shortTerm: 0.7,
          },
        },
      })
    ).rejects.toThrow();
  });
});
