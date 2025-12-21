/**
 * Supply Chain Finance Tests
 */

import { describe, expect, it } from 'vitest';
import type { SupplyChainFinanceInput } from '../../schemas/supply-chain-finance.js';
import { SupplyChainFinanceOptimizer } from '../supply-chain-finance.js';

describe('SupplyChainFinanceOptimizer', () => {
  const baseInput: SupplyChainFinanceInput = {
    companyInfo: {
      companyName: 'Test Company',
      industry: 'Manufacturing',
      annualRevenue: 10000000,
      paymentTerms: 30,
    },
    supplyChain: {
      suppliers: [],
      customers: [],
    },
    workingCapital: {
      accountsPayable: 500000,
      accountsReceivable: 800000,
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
        annualVolume: 1000000,
      },
      reverseFactoring: {
        enabled: false,
        financingRate: 0.08,
        programFee: 0.01,
        annualVolume: 0,
      },
      supplyChainFinance: {
        enabled: false,
        financingRate: 0.06,
        programFee: 0.005,
        annualVolume: 0,
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
  };

  it('should calculate supply chain finance optimization', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should analyze working capital when requested', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput);
    expect(result.workingCapitalOptimization).toBeDefined();
    expect(result.workingCapitalOptimization.optimizedCycle).toBeDefined();
  });

  it('should calculate cash flow impact', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput);
    expect(result.cashFlowImpact).toBeDefined();
  });

  it('should perform financing comparison', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput);
    expect(result.financingComparison).toBeDefined();
  });

  it('should provide risk analysis', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput);
    expect(result.riskAnalysis).toBeDefined();
  });
});

