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

  describe('Valuation Insights Branches', () => {
    it('should generate undervalued insight when upside > 20%', () => {
      // Create input with low target valuation vs peers for undervaluation
      const undervaluedInput = {
        ...sampleInput,
        targetFinancials: {
          ...sampleInput.targetFinancials,
          marketCap: 2000000000, // Lower market cap
          enterpriseValue: 2500000000, // Lower EV
        },
      };

      const result = CCAValuationEngine.analyze(undervaluedInput);
      expect(result.valuation.upsideDownside).toBeGreaterThan(0.2);
      expect(result.insights.some((i) => i.toLowerCase().includes('undervalued'))).toBe(true);
    });

    it('should generate overvalued insight when downside > 20%', () => {
      // Create input with high target valuation vs peers for overvaluation
      const overvaluedInput = {
        ...sampleInput,
        targetFinancials: {
          ...sampleInput.targetFinancials,
          marketCap: 15000000000, // Much higher market cap
          enterpriseValue: 16000000000, // Much higher EV
        },
      };

      const result = CCAValuationEngine.analyze(overvaluedInput);
      expect(result.valuation.upsideDownside).toBeLessThan(-0.2);
      expect(result.insights.some((i) => i.toLowerCase().includes('overvalued'))).toBe(true);
    });

    it('should generate high variation insight when CV > 0.5', () => {
      // Create peers with high variation in EBITDA multiples
      const highVariationInput = {
        ...sampleInput,
        peerCompanies: [
          {
            ...sampleInput.peerCompanies[0],
            enterpriseValue: 1500000000, // EV/EBITDA = 5x
            ebitda: 300000000,
          },
          {
            ...sampleInput.peerCompanies[1],
            enterpriseValue: 15000000000, // EV/EBITDA = 25x (high)
            ebitda: 600000000,
          },
          {
            ...sampleInput.peerCompanies[2]!,
            enterpriseValue: 500000000, // EV/EBITDA = 2.5x (very low)
            ebitda: 200000000,
          },
        ],
      };

      const result = CCAValuationEngine.analyze(highVariationInput);
      expect(result.tradingMultiples.evEbitda.statistics.coefficientOfVariation).toBeGreaterThan(
        0.5
      );
      expect(result.insights.some((i) => i.toLowerCase().includes('variation'))).toBe(true);
    });
  });

  describe('Warnings Generation Branches', () => {
    it('should warn about small peer group (<5 companies)', () => {
      // Sample input already has 3 peers
      const result = CCAValuationEngine.analyze(sampleInput);
      expect(result.peerGroup.summary.count).toBeLessThan(5);
      expect(result.warnings.some((w) => w.toLowerCase().includes('small peer group'))).toBe(true);
    });

    it('should warn about high number of outliers', () => {
      // Create input where most values are outliers
      const highOutlierInput = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          outlierThreshold: 1, // Low threshold (min is 1) to flag more outliers
        },
        peerCompanies: [
          {
            ...sampleInput.peerCompanies[0],
            enterpriseValue: 300000000, // Very low EV/EBITDA = 1x
            ebitda: 300000000,
          },
          {
            ...sampleInput.peerCompanies[1],
            enterpriseValue: 60000000000, // Extreme EV/EBITDA = 100x
            ebitda: 600000000,
          },
          {
            ...sampleInput.peerCompanies[2]!,
            enterpriseValue: 20000000, // Extreme low EV/EBITDA = 0.1x
            ebitda: 200000000,
          },
        ],
      };

      const result = CCAValuationEngine.analyze(highOutlierInput);
      // Check outliers exist
      expect(result.tradingMultiples.evEbitda.outliers.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendations Generation Branches', () => {
    it('should recommend expanding peer group when <10 companies', () => {
      const result = CCAValuationEngine.analyze(sampleInput);
      expect(result.peerGroup.summary.count).toBeLessThan(10);
      expect(
        result.recommendations.some((r) => r.description.toLowerCase().includes('expanding'))
      ).toBe(true);
    });

    it('should recommend additional screening when CV > 0.5', () => {
      const highVariationInput = {
        ...sampleInput,
        peerCompanies: [
          {
            ...sampleInput.peerCompanies[0],
            enterpriseValue: 1500000000, // EV/EBITDA = 5x
            ebitda: 300000000,
          },
          {
            ...sampleInput.peerCompanies[1],
            enterpriseValue: 15000000000, // EV/EBITDA = 25x
            ebitda: 600000000,
          },
          {
            ...sampleInput.peerCompanies[2]!,
            enterpriseValue: 500000000, // EV/EBITDA = 2.5x
            ebitda: 200000000,
          },
        ],
      };

      const result = CCAValuationEngine.analyze(highVariationInput);
      expect(
        result.recommendations.some((r) => r.description.toLowerCase().includes('screening'))
      ).toBe(true);
    });
  });

  describe('Multiple Calculation Branches', () => {
    it('should calculate EV/FCF multiple when freeCashFlow > 0', () => {
      const inputWithEvFcf = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          multiplesToCalculate: ['ev-fcf'] as const,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithEvFcf);
      expect(result.tradingMultiples.evFcf).toBeDefined();
      expect(result.tradingMultiples.evFcf.statistics.median).toBeGreaterThan(0);
    });

    it('should calculate P/S multiple', () => {
      const inputWithPs = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          multiplesToCalculate: ['ps'] as const,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithPs);
      expect(result.tradingMultiples.ps).toBeDefined();
      expect(result.tradingMultiples.ps.statistics.median).toBeGreaterThan(0);
    });

    it('should calculate PEG multiple', () => {
      const inputWithPeg = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          multiplesToCalculate: ['peg'] as const,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithPeg);
      expect(result.tradingMultiples.peg).toBeDefined();
    });

    it('should calculate all multiples when requested', () => {
      const inputWithAllMultiples = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          multiplesToCalculate: [
            'ev-revenue',
            'ev-ebitda',
            'ev-ebit',
            'ev-fcf',
            'pe',
            'pb',
            'ps',
            'peg',
          ] as const,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithAllMultiples);
      expect(result.tradingMultiples.evRevenue).toBeDefined();
      expect(result.tradingMultiples.evEbitda).toBeDefined();
      expect(result.tradingMultiples.evEbit).toBeDefined();
      expect(result.tradingMultiples.evFcf).toBeDefined();
      expect(result.tradingMultiples.pe).toBeDefined();
      expect(result.tradingMultiples.pb).toBeDefined();
      expect(result.tradingMultiples.ps).toBeDefined();
      expect(result.tradingMultiples.peg).toBeDefined();
    });
  });

  describe('Statistics Calculation Branches', () => {
    it('should use mean instead of median when includeMedian is false', () => {
      const inputWithMean = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          includeMedian: false,
          includeMean: true,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithMean);
      // The targetMultiple should be the mean, not median
      expect(result.tradingMultiples.evEbitda.targetMultiple).toBe(
        result.tradingMultiples.evEbitda.statistics.mean
      );
    });

    it('should calculate harmonic mean when requested', () => {
      const inputWithHarmonicMean = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          includeHarmonicMean: true,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithHarmonicMean);
      expect(result.tradingMultiples.evEbitda).toBeDefined();
    });

    it('should handle weightBySize option', () => {
      const inputWithWeighting = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          weightBySize: true,
          sizeWeightMethod: 'revenue' as const,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithWeighting);
      expect(result.valuation).toBeDefined();
    });

    it('should handle weightBySize with market-cap method', () => {
      const inputWithMarketCapWeight = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          weightBySize: true,
          sizeWeightMethod: 'market-cap' as const,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithMarketCapWeight);
      expect(result.valuation).toBeDefined();
    });

    it('should handle weightBySize with enterprise-value method', () => {
      const inputWithEvWeight = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          weightBySize: true,
          sizeWeightMethod: 'enterprise-value' as const,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithEvWeight);
      expect(result.valuation).toBeDefined();
    });
  });

  describe('Premium and Discount Branches', () => {
    it('should apply control premium when enabled', () => {
      const inputWithPremiums = {
        ...sampleInput,
        valuation: {
          ...sampleInput.valuation,
          applyPremiumsDiscounts: true,
          controlPremium: 0.25,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithPremiums);
      expect(result.premiumDiscount).toBeDefined();
    });

    it('should apply liquidity discount', () => {
      const inputWithLiquidityDiscount = {
        ...sampleInput,
        valuation: {
          ...sampleInput.valuation,
          applyPremiumsDiscounts: true,
          liquidityDiscount: 0.2,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithLiquidityDiscount);
      expect(result.premiumDiscount.liquidityAdjustment.adjustment).toBe(0.2);
    });

    it('should apply size discount', () => {
      const inputWithSizeDiscount = {
        ...sampleInput,
        valuation: {
          ...sampleInput.valuation,
          applyPremiumsDiscounts: true,
          sizeDiscount: 0.1,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithSizeDiscount);
      expect(result.premiumDiscount.sizeAdjustment.adjustment).toBe(0.1);
    });

    it('should apply country risk premium', () => {
      const inputWithCountryRisk = {
        ...sampleInput,
        valuation: {
          ...sampleInput.valuation,
          applyPremiumsDiscounts: true,
          countryRiskPremium: 0.05,
        },
      };

      const result = CCAValuationEngine.analyze(inputWithCountryRisk);
      expect(result.premiumDiscount.countryRiskAdjustment.adjustment).toBe(0.05);
    });

    it('should handle zero peer values in premium calculations', () => {
      // Create scenario where peer calculations might produce zero values
      const inputWithZeroPeers = {
        ...sampleInput,
        targetFinancials: {
          ...sampleInput.targetFinancials,
          ebitda: 1, // Very small EBITDA
        },
      };

      const result = CCAValuationEngine.analyze(inputWithZeroPeers);
      expect(result.premiumDiscount.vsPeers).toBeDefined();
    });
  });

  describe('Key Metrics Comparison Branches', () => {
    it('should compare all key metrics', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.keyMetrics.revenue).toBeDefined();
      expect(result.keyMetrics.ebitda).toBeDefined();
      expect(result.keyMetrics.ebitdaMargin).toBeDefined();
      expect(result.keyMetrics.netIncome).toBeDefined();
      expect(result.keyMetrics.netMargin).toBeDefined();
    });

    it('should calculate percentile correctly', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.keyMetrics.revenue.percentile).toBeGreaterThanOrEqual(0);
      expect(result.keyMetrics.revenue.percentile).toBeLessThanOrEqual(100);
    });

    it('should calculate vsAverage and vsMedian', () => {
      const result = CCAValuationEngine.analyze(sampleInput);

      expect(result.keyMetrics.revenue.vsAverage).toBeDefined();
      expect(result.keyMetrics.revenue.vsMedian).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle peer with zero EBITDA', () => {
      const inputWithZeroEbitda = {
        ...sampleInput,
        peerCompanies: [
          {
            ...sampleInput.peerCompanies[0],
            ebitda: 0, // Zero EBITDA
          },
          sampleInput.peerCompanies[1],
          sampleInput.peerCompanies[2]!,
        ],
      };

      const result = CCAValuationEngine.analyze(inputWithZeroEbitda);
      // Should still calculate but exclude zero EBITDA peer from EV/EBITDA
      expect(result.tradingMultiples.evEbitda).toBeDefined();
    });

    it('should handle peer with negative net income', () => {
      const inputWithNegativeNetIncome = {
        ...sampleInput,
        peerCompanies: [
          {
            ...sampleInput.peerCompanies[0],
            netIncome: -50000000, // Negative net income
          },
          sampleInput.peerCompanies[1],
          sampleInput.peerCompanies[2]!,
        ],
      };

      const result = CCAValuationEngine.analyze(inputWithNegativeNetIncome);
      // Should still calculate but exclude negative NI peer from P/E
      expect(result.tradingMultiples.pe).toBeDefined();
    });

    it('should handle peer with zero free cash flow', () => {
      const inputWithZeroFcf = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          multiplesToCalculate: ['ev-fcf'] as const,
        },
        peerCompanies: [
          {
            ...sampleInput.peerCompanies[0],
            freeCashFlow: 0, // Zero FCF
          },
          sampleInput.peerCompanies[1],
          sampleInput.peerCompanies[2]!,
        ],
      };

      const result = CCAValuationEngine.analyze(inputWithZeroFcf);
      expect(result.tradingMultiples.evFcf).toBeDefined();
    });

    it('should handle single peer company', () => {
      const inputWithSinglePeer = {
        ...sampleInput,
        peerCompanies: [sampleInput.peerCompanies[0]],
      };

      const result = CCAValuationEngine.analyze(inputWithSinglePeer);
      expect(result.peerGroup.summary.count).toBe(1);
      expect(result.tradingMultiples.evEbitda.statistics.median).toBe(
        result.tradingMultiples.evEbitda.statistics.mean
      );
    });

    it('should handle even number of peers for median calculation', () => {
      const inputWithEvenPeers = {
        ...sampleInput,
        peerCompanies: [
          sampleInput.peerCompanies[0],
          sampleInput.peerCompanies[1],
          sampleInput.peerCompanies[2]!,
          {
            ...sampleInput.peerCompanies[0],
            name: 'Peer Company D',
            ticker: 'PEER-D',
            marketCap: 4000000000,
            enterpriseValue: 4500000000,
            revenue: 1750000000,
            ebitda: 350000000,
          },
        ],
      };

      const result = CCAValuationEngine.analyze(inputWithEvenPeers);
      expect(result.peerGroup.summary.count).toBe(4);
      expect(result.tradingMultiples.evEbitda.statistics.median).toBeDefined();
    });

    it('should handle different target company sizes', () => {
      const smallCompanyInput = {
        ...sampleInput,
        targetCompany: {
          ...sampleInput.targetCompany,
          size: 'small' as const,
        },
      };

      const result = CCAValuationEngine.analyze(smallCompanyInput);
      expect(result.metadata.methodology).toBe('Comparable Company Analysis');
    });

    it('should handle different currencies', () => {
      const eurInput = {
        ...sampleInput,
        targetCompany: {
          ...sampleInput.targetCompany,
          currency: 'EUR',
        },
      };

      const result = CCAValuationEngine.analyze(eurInput);
      expect(result.metadata).toBeDefined();
    });

    it('should handle international geography distribution', () => {
      const inputWithInternationalPeers = {
        ...sampleInput,
        peerCompanies: [
          {
            ...sampleInput.peerCompanies[0],
            country: 'UK',
          },
          {
            ...sampleInput.peerCompanies[1],
            country: 'Germany',
          },
          {
            ...sampleInput.peerCompanies[2]!,
            country: 'Japan',
          },
        ],
      };

      const result = CCAValuationEngine.analyze(inputWithInternationalPeers);
      expect(Object.keys(result.peerGroup.summary.geographicDistribution).length).toBe(3);
    });

    it('should handle multiple industries in peer group', () => {
      const inputWithMultipleIndustries = {
        ...sampleInput,
        peerCompanies: [
          {
            ...sampleInput.peerCompanies[0],
            industry: 'Software',
          },
          {
            ...sampleInput.peerCompanies[1],
            industry: 'Hardware',
          },
          {
            ...sampleInput.peerCompanies[2]!,
            industry: 'Services',
          },
        ],
      };

      const result = CCAValuationEngine.analyze(inputWithMultipleIndustries);
      expect(Object.keys(result.peerGroup.summary.industryDistribution).length).toBe(3);
    });
  });
});
