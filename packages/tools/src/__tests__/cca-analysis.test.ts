import { describe, expect, it } from 'vitest';
import { CCAAnalysisTool } from '../tools/cca-analysis';

describe('CCAAnalysisTool', () => {
  // Valid input matching CCAValuationInputSchema from analysis package
  const validInput = {
    targetCompany: {
      name: 'Target Corp',
      industry: 'Technology',
      size: 'medium' as const,
      country: 'US',
      currency: 'USD',
    },
    targetFinancials: {
      marketCap: 500000000,
      enterpriseValue: 550000000,
      revenue: 100000000,
      ebitda: 20000000,
      ebit: 15000000,
      netIncome: 10000000,
      totalDebt: 60000000,
      cashAndEquivalents: 10000000,
      sharesOutstanding: 10000000,
      bookValue: 80000000,
      freeCashFlow: 12000000,
      capex: 5000000,
      depreciation: 3000000,
    },
    peerGroupCriteria: {
      industry: ['Technology', 'Software'],
      sizeRange: {
        minRevenue: 50000000,
        maxRevenue: 200000000,
      },
      geography: ['US'],
    },
    peerCompanies: [
      {
        name: 'Peer A',
        ticker: 'PEERA',
        industry: 'Technology',
        country: 'US',
        marketCap: 600000000,
        enterpriseValue: 650000000,
        revenue: 120000000,
        ebitda: 25000000,
        ebit: 18000000,
        netIncome: 12000000,
        totalDebt: 70000000,
        cashAndEquivalents: 20000000,
        sharesOutstanding: 12000000,
        bookValue: 100000000,
        freeCashFlow: 15000000,
        capex: 6000000,
        depreciation: 4000000,
        currentPrice: 50,
        beta: 1.2,
      },
      {
        name: 'Peer B',
        ticker: 'PEERB',
        industry: 'Technology',
        country: 'US',
        marketCap: 450000000,
        enterpriseValue: 480000000,
        revenue: 90000000,
        ebitda: 18000000,
        ebit: 13000000,
        netIncome: 9000000,
        totalDebt: 40000000,
        cashAndEquivalents: 10000000,
        sharesOutstanding: 9000000,
        bookValue: 70000000,
        freeCashFlow: 10000000,
        capex: 4000000,
        depreciation: 2500000,
        currentPrice: 50,
        beta: 1.0,
      },
    ],
    analysis: {
      multiplesToCalculate: ['ev-revenue', 'ev-ebitda', 'pe', 'pb'] as const,
      excludeOutliers: true,
      includeMedian: true,
      includeMean: true,
    },
    valuation: {
      applyPremiumsDiscounts: true,
      controlPremium: 0.2,
      liquidityDiscount: 0.15,
    },
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(CCAAnalysisTool.toolName).toBe('analyze_cca_valuation');
    });

    it('has a description', () => {
      expect(CCAAnalysisTool.description).toBeTruthy();
      expect(CCAAnalysisTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = CCAAnalysisTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('targetCompany');
      expect(schema.required).toContain('targetFinancials');
      expect(schema.required).toContain('peerGroupCriteria');
      expect(schema.required).toContain('peerCompanies');
    });
  });

  describe('execute', () => {
    it('performs CCA valuation analysis with valid input', async () => {
      const result = await CCAAnalysisTool.execute(validInput);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('peerGroup');
    });

    it('returns peer group analysis', async () => {
      const result = await CCAAnalysisTool.execute(validInput);
      expect(result).toBeDefined();
      const typedResult = result as { peerGroup?: { companies?: unknown[] } };
      expect(typedResult.peerGroup).toBeDefined();
    });

    it('throws error for invalid input', async () => {
      const invalidInput = {
        targetCompany: {
          name: 'Test',
          // Missing required fields
        },
      };

      await expect(CCAAnalysisTool.execute(invalidInput)).rejects.toThrow();
    });

    it('throws error for empty input', async () => {
      await expect(CCAAnalysisTool.execute({})).rejects.toThrow();
    });
  });
});
