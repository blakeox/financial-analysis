/**
 * CCA Valuation Engine Test Suite
 * Comprehensive tests for Comparable Company Analysis functionality
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { CCAValuationEngine, CCAValuationInput } from '../cca-analysis';

describe('CCAValuationEngine', () => {
  let sampleInput: CCAValuationInput;

  beforeEach(() => {
    sampleInput = {
      targetCompany: {
        name: 'Target Corp',
        industry: 'Technology',
        size: 'large',
        country: 'US',
        currency: 'USD',
      },
      targetFinancials: {
        marketCap: 5000000000,
        enterpriseValue: 5500000000,
        revenue: 2000000000,
        ebitda: 400000000,
        ebit: 300000000,
        netIncome: 200000000,
        totalDebt: 1000000000,
        cashAndEquivalents: 500000000,
        sharesOutstanding: 100000000,
        bookValue: 2000000000,
        freeCashFlow: 250000000,
        capex: 150000000,
        depreciation: 100000000,
      },
      peerGroupCriteria: {
        industry: ['Technology', 'Software'],
        sizeRange: {
          minRevenue: 500000000,
          maxRevenue: 10000000000,
        },
        geography: ['US'],
        businessModel: ['SaaS', 'Enterprise Software'],
        excludeTarget: true,
      },
      peerCompanies: [
        {
          name: 'Peer Company A',
          ticker: 'PEER-A',
          industry: 'Technology',
          country: 'US',
          marketCap: 3000000000,
          enterpriseValue: 3500000000,
          revenue: 1500000000,
          ebitda: 300000000,
          ebit: 225000000,
          netIncome: 150000000,
          totalDebt: 800000000,
          cashAndEquivalents: 300000000,
          sharesOutstanding: 75000000,
          bookValue: 1500000000,
          freeCashFlow: 200000000,
          capex: 100000000,
          depreciation: 75000000,
          currentPrice: 40,
          beta: 1.1,
          creditRating: 'A',
        },
        {
          name: 'Peer Company B',
          ticker: 'PEER-B',
          industry: 'Technology',
          country: 'US',
          marketCap: 8000000000,
          enterpriseValue: 9000000000,
          revenue: 3000000000,
          ebitda: 600000000,
          ebit: 450000000,
          netIncome: 300000000,
          totalDebt: 1500000000,
          cashAndEquivalents: 600000000,
          sharesOutstanding: 200000000,
          bookValue: 3000000000,
          freeCashFlow: 400000000,
          capex: 200000000,
          depreciation: 150000000,
          currentPrice: 40,
          beta: 1.3,
          creditRating: 'A+',
        },
        {
          name: 'Peer Company C',
          ticker: 'PEER-C',
          industry: 'Technology',
          country: 'US',
          marketCap: 2000000000,
          enterpriseValue: 2500000000,
          revenue: 1000000000,
          ebitda: 200000000,
          ebit: 150000000,
          netIncome: 100000000,
          totalDebt: 500000000,
          cashAndEquivalents: 200000000,
          sharesOutstanding: 50000000,
          bookValue: 1000000000,
          freeCashFlow: 150000000,
          capex: 50000000,
          depreciation: 50000000,
          currentPrice: 40,
          beta: 0.9,
          creditRating: 'BBB+',
        },
      ],
      analysis: {
        multiplesToCalculate: ['ev-revenue', 'ev-ebitda', 'ev-ebit', 'pe', 'pb'],
        excludeOutliers: true,
        outlierThreshold: 2,
        includeMedian: true,
        includeMean: true,
        includeHarmonicMean: false,
        weightBySize: false,
        sizeWeightMethod: 'revenue',
      },
      valuation: {
        applyPremiumsDiscounts: true,
        controlPremium: 0.2,
        liquidityDiscount: 0.15,
        sizeDiscount: 0.05,
        countryRiskPremium: 0,
      },
    };
  });

  describe('Basic CCA Analysis', () => {
    it('should calculate peer multiples correctly', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.peerGroup.companies).toBeDefined();
      expect(result.peerGroup.companies).toHaveLength(3);

      // Check that multiples are calculated for each peer
      result.peerGroup.companies.forEach((company) => {
        expect(company.multiples).toBeDefined();
        expect(company.multiples.evRevenue).toBeGreaterThan(0);
        expect(company.multiples.evEbitda).toBeGreaterThan(0);
        expect(company.multiples.pe).toBeGreaterThan(0);
        expect(company.multiples.pb).toBeGreaterThan(0);
      });
    });

    it('should analyze trading multiples', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.tradingMultiples).toBeDefined();
      expect(result.tradingMultiples.evRevenue).toBeDefined();
      expect(result.tradingMultiples.evEbitda).toBeDefined();
      expect(result.tradingMultiples.pe).toBeDefined();
      expect(result.tradingMultiples.pb).toBeDefined();

      // Check EV/EBITDA multiple analysis
      const evEbitda = result.tradingMultiples.evEbitda;
      expect(evEbitda.statistics.min).toBeGreaterThan(0);
      expect(evEbitda.statistics.max).toBeGreaterThan(evEbitda.statistics.min);
      expect(evEbitda.statistics.median).toBeGreaterThan(evEbitda.statistics.min);
      expect(evEbitda.statistics.mean).toBeGreaterThan(0);
    });

    it('should calculate valuation ranges', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.valuation).toBeDefined();
      expect(result.valuation.enterpriseValue.range.min).toBeGreaterThan(0);
      // max should be >= min (equal is valid when all multiples produce similar values)
      expect(result.valuation.enterpriseValue.range.max).toBeGreaterThanOrEqual(
        result.valuation.enterpriseValue.range.min
      );
      expect(result.valuation.equityValue.range.min).toBeGreaterThan(0);
      expect(result.valuation.valuePerShare.range.min).toBeGreaterThan(0);
    });
  });

  describe('Peer Group Analysis', () => {
    it('should generate peer group summary', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.peerGroup.summary).toBeDefined();
      expect(result.peerGroup.summary.count).toBe(3);
      expect(result.peerGroup.summary.averageSize).toBeGreaterThan(0);
      expect(result.peerGroup.summary.sizeRange.min).toBeGreaterThan(0);
      expect(result.peerGroup.summary.sizeRange.max).toBeGreaterThan(
        result.peerGroup.summary.sizeRange.min
      );
    });

    it('should calculate geographic and industry distribution', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.peerGroup.summary.geographicDistribution).toBeDefined();
      expect(result.peerGroup.summary.industryDistribution).toBeDefined();
      expect(result.peerGroup.summary.geographicDistribution['US']).toBe(3);
      expect(result.peerGroup.summary.industryDistribution['Technology']).toBe(3);
    });
  });

  describe('Premium/Discount Analysis', () => {
    it('should analyze premiums and discounts', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.premiumDiscount).toBeDefined();
      expect(result.premiumDiscount.vsPeers).toBeDefined();
      expect(result.premiumDiscount.vsPeers.premium).toBeDefined();
      expect(result.premiumDiscount.vsPeers.explanation).toBeDefined();

      expect(result.premiumDiscount.sizeAdjustment).toBeDefined();
      expect(result.premiumDiscount.liquidityAdjustment).toBeDefined();
      expect(result.premiumDiscount.countryRiskAdjustment).toBeDefined();
    });
  });

  describe('Key Metrics Comparison', () => {
    it('should compare key metrics against peers', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.keyMetrics).toBeDefined();
      expect(result.keyMetrics.revenue).toBeDefined();
      expect(result.keyMetrics.ebitda).toBeDefined();
      expect(result.keyMetrics.ebitdaMargin).toBeDefined();
      expect(result.keyMetrics.netIncome).toBeDefined();
      expect(result.keyMetrics.netMargin).toBeDefined();

      // Check comparison metrics structure
      const revenueMetrics = result.keyMetrics.revenue;
      expect(revenueMetrics.target).toBeGreaterThan(0);
      expect(revenueMetrics.peerAverage).toBeGreaterThan(0);
      expect(revenueMetrics.peerMedian).toBeGreaterThan(0);
      expect(revenueMetrics.percentile).toBeGreaterThanOrEqual(0);
      expect(revenueMetrics.percentile).toBeLessThanOrEqual(100);
    });
  });

  describe('Outlier Detection', () => {
    it('should identify outliers in multiples', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      // Check if outliers are identified
      const evEbitda = result.tradingMultiples.evEbitda;
      expect(evEbitda.outliers).toBeDefined();
      expect(Array.isArray(evEbitda.outliers)).toBe(true);
    });

    it('should handle outlier exclusion', () => {
      const inputWithOutliers = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          outlierThreshold: 1.5, // Lower threshold to detect outliers more easily
        },
        peerCompanies: [
          ...sampleInput.peerCompanies,
          {
            name: 'Outlier Company',
            ticker: 'OUTLIER',
            industry: 'Technology',
            country: 'US',
            marketCap: 10000000000,
            enterpriseValue: 50000000000, // Extremely high EV
            revenue: 1000000000,
            ebitda: 50000000, // Very low EBITDA (5% margin) - EV/EBITDA = 1000x
            ebit: 30000000,
            netIncome: 20000000,
            totalDebt: 2000000000,
            cashAndEquivalents: 1000000000,
            sharesOutstanding: 250000000,
            bookValue: 5000000000,
            freeCashFlow: 100000000,
            capex: 40000000,
            depreciation: 20000000,
            currentPrice: 40,
            beta: 1.5,
            creditRating: 'BB',
          },
        ],
      };

      const result = CCAValuationEngine.analyze(inputWithOutliers);

      // Should identify the outlier
      const evEbitda = result.tradingMultiples.evEbitda;
      expect(evEbitda.outliers.length).toBeGreaterThan(0);
    });
  });

  describe('Insights and Recommendations', () => {
    it('should generate insights', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('should generate warnings', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should generate recommendations', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);

      if (result.recommendations.length > 0) {
        const recommendation = result.recommendations[0];
        expect(recommendation.category).toBeDefined();
        expect(recommendation.priority).toMatch(/^(high|medium|low)$/);
        expect(recommendation.description).toBeDefined();
        expect(recommendation.impact).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid peer company data', () => {
      const invalidInput = {
        ...sampleInput,
        peerCompanies: [
          {
            ...sampleInput.peerCompanies[0],
            revenue: -1000000, // Invalid negative revenue
          },
        ],
      };

      expect(() => CCAValuationEngine.analyze(invalidInput)).toThrow();
    });

    it('should handle empty peer group', () => {
      const inputWithNoPeers = {
        ...sampleInput,
        peerCompanies: [],
      };

      expect(() => CCAValuationEngine.analyze(inputWithNoPeers)).toThrow();
    });

    it('should handle missing target financials', () => {
      const inputWithMissingFinancials = {
        ...sampleInput,
        targetFinancials: {
          ...sampleInput.targetFinancials,
          revenue: 0, // Invalid zero revenue
        },
      };

      expect(() => CCAValuationEngine.analyze(inputWithMissingFinancials)).toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete analysis within reasonable time', () => {
      const startTime = Date.now();
      CCAValuationEngine.analyze(sampleInput);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle large peer groups efficiently', () => {
      const largePeerGroup = Array.from({ length: 50 }, (_, i) => ({
        name: `Peer Company ${i + 1}`,
        ticker: `PEER-${i + 1}`,
        industry: 'Technology',
        country: 'US',
        marketCap: 1000000000 + i * 100000000,
        enterpriseValue: 1200000000 + i * 100000000,
        revenue: 500000000 + i * 50000000,
        ebitda: 100000000 + i * 10000000,
        ebit: 75000000 + i * 7500000,
        netIncome: 50000000 + i * 5000000,
        totalDebt: 200000000 + i * 20000000,
        cashAndEquivalents: 100000000 + i * 10000000,
        sharesOutstanding: 25000000 + i * 2500000,
        bookValue: 400000000 + i * 40000000,
        freeCashFlow: 75000000 + i * 7500000,
        capex: 25000000 + i * 2500000,
        depreciation: 25000000 + i * 2500000,
        currentPrice: 40,
        beta: 1.0 + i * 0.01,
        creditRating: 'A',
      }));

      const inputWithLargePeerGroup = {
        ...sampleInput,
        peerCompanies: largePeerGroup,
      };

      const startTime = Date.now();
      const result = CCAValuationEngine.analyze(inputWithLargePeerGroup);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.peerGroup.summary.count).toBe(50);
    });
  });
});
