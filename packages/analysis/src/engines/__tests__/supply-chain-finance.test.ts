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
    },
    supplyChain: {
      accountsPayable: 500000,
      accountsReceivable: 800000,
      inventory: 1000000,
      averagePaymentTerms: 30,
      averageCollectionTerms: 45,
    },
    financingOptions: {
      dynamicDiscounting: {
        enabled: true,
        discountRate: 0.02,
      },
      reverseFactoring: {
        enabled: false,
        financingRate: 0.08,
      },
      inventoryFinancing: {
        enabled: false,
        financingRate: 0.1,
      },
    },
    analysis: {
      includeWorkingCapital: true,
      includeCashFlow: true,
      includeCostBenefit: true,
      includeScenarioAnalysis: true,
    },
  };

  it('should calculate supply chain finance optimization', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should analyze working capital when requested', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput);
    expect(result.workingCapitalAnalysis).toBeDefined();
    expect(result.workingCapitalAnalysis.currentWorkingCapital).toBeDefined();
  });

  it('should calculate cash flow impact', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput);
    expect(result.cashFlowAnalysis).toBeDefined();
  });

  it('should perform cost-benefit analysis', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput);
    expect(result.costBenefitAnalysis).toBeDefined();
  });

  it('should provide scenario analysis', () => {
    const result = SupplyChainFinanceOptimizer.analyze(baseInput);
    expect(result.scenarioAnalysis).toBeDefined();
  });
});

