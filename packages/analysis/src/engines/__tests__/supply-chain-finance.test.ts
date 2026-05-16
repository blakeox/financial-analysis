/**
 * Supply Chain Finance Tests
 */

import { describe, expect, it } from 'vitest';
import { SupplyChainFinanceInputSchema } from '../../schemas/supply-chain-finance.js';
import { SupplyChainFinanceOptimizer } from '../supply-chain-finance.js';

describe('SupplyChainFinanceOptimizer', () => {
  const baseInput = SupplyChainFinanceInputSchema.parse({
    companyInfo: {
      companyName: 'Test Company',
      industry: 'Manufacturing',
      annualRevenue: 10000000,
      paymentTerms: 30,
    },
    supplyChain: {
      suppliers: [
        {
          supplierName: 'Supplier A',
          annualPurchaseVolume: 500000,
          paymentTerms: 30,
          averageInvoiceAmount: 10000,
          invoicesPerMonth: 4,
          supplierRelationship: 'important',
        },
      ],
      customers: [
        {
          customerName: 'Customer B',
          annualSalesVolume: 800000,
          paymentTerms: 45,
          averageInvoiceAmount: 20000,
          invoicesPerMonth: 3,
          customerRelationship: 'strategic',
        },
      ],
    },
    workingCapital: {
      accountsReceivable: 800000,
      accountsPayable: 500000,
      inventory: 1000000,
      daysSalesOutstanding: 45,
      daysPayableOutstanding: 30,
      daysInventoryOutstanding: 60,
      cashConversionCycle: 75,
    },
    financingOptions: {
      dynamicDiscounting: {
        enabled: true,
        discountRate: 0.02,
        earlyPaymentDays: 10,
        annualVolume: 200000,
      },
      reverseFactoring: {
        enabled: false,
        financingRate: 0.08,
        programFee: 0.01,
        annualVolume: 1000000,
      },
      supplyChainFinance: {
        enabled: false,
        financingRate: 0.06,
        programFee: 0.005,
        annualVolume: 1000000,
      },
    },
    costOfCapital: {
      wacc: 0.1,
      costOfDebt: 0.06,
      costOfEquity: 0.12,
    },
    analysis: {
      includeWorkingCapitalOptimization: true,
      includeFinancingComparison: true,
      includeCashFlowImpact: true,
      includeSupplierBenefits: true,
      includeRiskAnalysis: true,
    },
  });

  it('should calculate supply chain finance optimization', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.currentCashConversionCycle).toBe(75);
  });

  it('should analyze working capital when requested', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput) as any;
    expect(result.workingCapitalOptimization).toBeDefined();
    expect(result.workingCapitalOptimization.optimizedCycle).toBeDefined();
  });

  it('should calculate cash flow impact', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput) as any;
    expect(result.cashFlowImpact).toBeDefined();
    expect(result.cashFlowImpact.cashFlowImprovement).toBeDefined();
  });

  it('should perform financing comparison', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput) as any;
    expect(result.financingComparison).toBeDefined();
  });

  it('should provide risk analysis', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput) as any;
    expect(result.riskAnalysis).toBeDefined();
  });

  it('should include supplier benefits for dynamic discounting', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput) as any;
    expect(result.supplierBenefits).toBeDefined();
    expect(result.supplierBenefits.suppliers[0].benefit).toBe('Early payment with discount');
    expect(result.supplierBenefits.suppliers[0].earlyPaymentDays).toBe(10);
  });

  it('should include supplier benefits for reverse factoring', () => {
    const input = SupplyChainFinanceInputSchema.parse({
      ...baseInput,
      financingOptions: {
        ...baseInput.financingOptions,
        dynamicDiscounting: { ...baseInput.financingOptions.dynamicDiscounting, enabled: false },
        reverseFactoring: { ...baseInput.financingOptions.reverseFactoring, enabled: true },
      },
    });

    const result = SupplyChainFinanceOptimizer.analyze(input) as any;
    expect(result.supplierBenefits.suppliers[0].benefit).toBe('Access to financing at lower cost');
  });

  it('should mark overall risk as high when cash conversion cycle is extended', () => {
    const input = SupplyChainFinanceInputSchema.parse({
      ...baseInput,
      workingCapital: {
        ...baseInput.workingCapital,
        cashConversionCycle: 120,
      },
    });

    const result = SupplyChainFinanceOptimizer.analyze(input) as any;
    expect(result.riskAnalysis.overallRisk).toBe('high');
    expect(result.recommendations.join(' ')).toContain('high-risk');
  });

  it('should mark overall risk as medium when program utilization is low', () => {
    const input = SupplyChainFinanceInputSchema.parse({
      ...baseInput,
      financingOptions: {
        ...baseInput.financingOptions,
        supplyChainFinance: {
          ...baseInput.financingOptions.supplyChainFinance,
          enabled: true,
          annualVolume: 0,
        },
      },
      workingCapital: {
        ...baseInput.workingCapital,
        cashConversionCycle: 80,
      },
    });

    const result = SupplyChainFinanceOptimizer.analyze(input) as any;
    expect(result.riskAnalysis.overallRisk).toBe('medium');
  });

  it('should omit optional analyses when disabled', () => {
    const input = SupplyChainFinanceInputSchema.parse({
      ...baseInput,
      analysis: {
        includeWorkingCapitalOptimization: false,
        includeFinancingComparison: false,
        includeCashFlowImpact: false,
        includeSupplierBenefits: false,
        includeRiskAnalysis: false,
      },
    });

    const result = SupplyChainFinanceOptimizer.analyze(input) as any;
    expect(result.workingCapitalOptimization).toBeUndefined();
    expect(result.financingComparison).toBeUndefined();
    expect(result.cashFlowImpact).toBeUndefined();
    expect(result.supplierBenefits).toBeUndefined();
    expect(result.riskAnalysis).toBeUndefined();
  });
});
