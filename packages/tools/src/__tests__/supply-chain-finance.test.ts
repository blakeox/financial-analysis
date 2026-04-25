import { describe, expect, it } from 'vitest';
import { SupplyChainFinanceTool } from '../tools/supply-chain-finance';

describe('SupplyChainFinanceTool', () => {
  const validInput = {
    companyInfo: {
      companyName: 'Acme Corp',
      industry: 'Manufacturing',
      annualRevenue: 10000000,
      paymentTerms: 30,
    },
    supplyChain: {
      suppliers: [
        {
          supplierName: 'Supplier A',
          annualPurchaseVolume: 1000000,
          paymentTerms: 30,
          averageInvoiceAmount: 50000,
          invoicesPerMonth: 2,
          supplierRelationship: 'critical',
        },
      ],
      customers: [
        {
          customerName: 'Customer A',
          annualSalesVolume: 1500000,
          paymentTerms: 40,
          averageInvoiceAmount: 75000,
          invoicesPerMonth: 2,
          customerRelationship: 'strategic',
        },
      ],
    },
    workingCapital: {
      accountsReceivable: 1200000,
      accountsPayable: 800000,
      inventory: 500000,
      daysSalesOutstanding: 40,
      daysPayableOutstanding: 30,
      daysInventoryOutstanding: 20,
      cashConversionCycle: 30,
    },
    financingOptions: {
      dynamicDiscounting: {
        enabled: true,
        discountRate: 0.02,
        earlyPaymentDays: 10,
        annualVolume: 500000,
      },
      reverseFactoring: {
        enabled: false,
        financingRate: 0.08,
        programFee: 0.01,
        annualVolume: 0,
      },
      supplyChainFinance: {
        enabled: true,
        financingRate: 0.06,
        programFee: 0.005,
        annualVolume: 600000,
      },
    },
    costOfCapital: {
      costOfDebt: 0.08,
      costOfEquity: 0.12,
      wacc: 0.1,
      opportunityCostRate: 0.07,
    },
    analysis: {
      includeWorkingCapitalOptimization: true,
      includeFinancingComparison: true,
      includeCashFlowImpact: true,
      includeSupplierBenefits: true,
      includeRiskAnalysis: true,
      projectionMonths: 12,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(SupplyChainFinanceTool.toolName).toBe('analyze_supply_chain_finance');
    expect(SupplyChainFinanceTool.inputSchema.required).toEqual(['companyInfo', 'supplyChain']);
  });

  it('calculates working capital improvement and financing recommendation', async () => {
    const result = (await SupplyChainFinanceTool.execute(validInput)) as {
      summary: {
        currentCashConversionCycle: number;
        optimizedCycle: number;
        cashFlowImprovement: number;
        recommendedFinancing: string;
        totalSavings: number;
      };
    };

    expect(result.summary.currentCashConversionCycle).toBeCloseTo(30, 6);
    expect(result.summary.optimizedCycle).toBeCloseTo(12, 6);
    expect(result.summary.cashFlowImprovement).toBeCloseTo(493150.68, 2);
    expect(result.summary.recommendedFinancing).toBe('supply-chain-finance');
    expect(result.summary.totalSavings).toBeCloseTo(14835.62, 2);
  });

  it('rejects invalid input', async () => {
    await expect(
      SupplyChainFinanceTool.execute({
        ...validInput,
        financingOptions: {
          ...validInput.financingOptions,
          dynamicDiscounting: {
            ...validInput.financingOptions.dynamicDiscounting,
            discountRate: 1.5,
          },
        },
      })
    ).rejects.toThrow();
  });
});
