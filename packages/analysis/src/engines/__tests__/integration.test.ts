/**
 * Business Models Integration Test Suite
 * Comprehensive tests for all business models working together
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { CCAValuationEngine, CCAValuationInput } from '../cca-analysis';
import { DCFValuationEngine, DCFValuationInput } from '../dcf-analysis';
import { MAAnalysisEngine, MAAnalysisInput } from '../ma-analysis';

describe('Business Models Integration', () => {
  let dcfInput: DCFValuationInput;
  let ccaInput: CCAValuationInput;
  let maInput: MAAnalysisInput;

  beforeEach(() => {
    // DCF Input
    dcfInput = {
      companyData: {
        name: 'TechCorp Inc.',
        industry: 'Technology',
        size: 'large',
        country: 'US',
        currency: 'USD',
      },
      historicalFinancials: {
        revenue: [
          { year: 2020, amount: 2000000000, growthRate: 0.15 },
          { year: 2021, amount: 2300000000, growthRate: 0.15 },
          { year: 2022, amount: 2645000000, growthRate: 0.15 },
        ],
        ebitda: [
          { year: 2020, amount: 400000000, margin: 0.2 },
          { year: 2021, amount: 460000000, margin: 0.2 },
          { year: 2022, amount: 529000000, margin: 0.2 },
        ],
        ebit: [
          { year: 2020, amount: 300000000, margin: 0.15 },
          { year: 2021, amount: 345000000, margin: 0.15 },
          { year: 2022, amount: 396750000, margin: 0.15 },
        ],
        netIncome: [
          { year: 2020, amount: 240000000, margin: 0.12 },
          { year: 2021, amount: 276000000, margin: 0.12 },
          { year: 2022, amount: 317400000, margin: 0.12 },
        ],
        capex: [
          { year: 2020, amount: 100000000, asPercentOfRevenue: 0.05 },
          { year: 2021, amount: 115000000, asPercentOfRevenue: 0.05 },
          { year: 2022, amount: 132250000, asPercentOfRevenue: 0.05 },
        ],
        workingCapital: [
          { year: 2020, amount: 200000000, asPercentOfRevenue: 0.1 },
          { year: 2021, amount: 230000000, asPercentOfRevenue: 0.1 },
          { year: 2022, amount: 264500000, asPercentOfRevenue: 0.1 },
        ],
        depreciation: [
          { year: 2020, amount: 100000000 },
          { year: 2021, amount: 115000000 },
          { year: 2022, amount: 132250000 },
        ],
        taxRate: [
          { year: 2020, rate: 0.25 },
          { year: 2021, rate: 0.25 },
          { year: 2022, rate: 0.25 },
        ],
      },
      forecastAssumptions: {
        forecastPeriod: 5,
        revenueGrowth: {
          year1: 0.12,
          year2: 0.1,
          year3: 0.08,
          year4: 0.06,
          year5: 0.05,
          terminalGrowth: 0.025,
        },
        ebitdaMargin: {
          year1: 0.22,
          year2: 0.23,
          year3: 0.24,
          year4: 0.25,
          year5: 0.25,
          terminalMargin: 0.25,
        },
        capexAsPercentOfRevenue: {
          year1: 0.05,
          year2: 0.05,
          year3: 0.05,
          year4: 0.05,
          year5: 0.05,
          terminalPercent: 0.05,
        },
        workingCapitalAsPercentOfRevenue: {
          year1: 0.1,
          year2: 0.1,
          year3: 0.1,
          year4: 0.1,
          year5: 0.1,
          terminalPercent: 0.1,
        },
        depreciationAsPercentOfRevenue: {
          year1: 0.05,
          year2: 0.05,
          year3: 0.05,
          year4: 0.05,
          year5: 0.05,
          terminalPercent: 0.05,
        },
        taxRate: 0.25,
      },
      waccInput: {
        riskFreeRate: 0.03,
        marketRiskPremium: 0.06,
        beta: 1.3,
        costOfDebt: 0.05,
        debtToEquityRatio: 0.25,
        taxRate: 0.25,
      },
      terminalValue: {
        method: 'gordon-growth',
        terminalGrowthRate: 0.025,
      },
      analysis: {
        includeSensitivity: true,
        includeScenarios: true,
        includeMonteCarlo: false,
        monteCarloSimulations: 1000,
        sensitivityVariables: ['revenueGrowth', 'ebitdaMargin', 'wacc'],
      },
    };

    // CCA Input
    ccaInput = {
      targetCompany: {
        name: 'TechCorp Inc.',
        industry: 'Technology',
        size: 'large',
        country: 'US',
        currency: 'USD',
      },
      targetFinancials: {
        marketCap: 8000000000,
        enterpriseValue: 9000000000,
        revenue: 2645000000,
        ebitda: 529000000,
        ebit: 396750000,
        netIncome: 317400000,
        totalDebt: 2000000000,
        cashAndEquivalents: 1000000000,
        sharesOutstanding: 200000000,
        bookValue: 4000000000,
        freeCashFlow: 300000000,
        capex: 132250000,
        depreciation: 132250000,
      },
      peerGroupCriteria: {
        industry: ['Technology', 'Software'],
        sizeRange: {
          minRevenue: 1000000000,
          maxRevenue: 10000000000,
        },
        geography: ['US'],
        businessModel: ['SaaS', 'Enterprise Software'],
        excludeTarget: true,
      },
      peerCompanies: [
        {
          name: 'Peer Tech A',
          ticker: 'PTA',
          industry: 'Technology',
          country: 'US',
          marketCap: 6000000000,
          enterpriseValue: 7000000000,
          revenue: 2000000000,
          ebitda: 400000000,
          ebit: 300000000,
          netIncome: 240000000,
          totalDebt: 1500000000,
          cashAndEquivalents: 500000000,
          sharesOutstanding: 150000000,
          bookValue: 3000000000,
          freeCashFlow: 250000000,
          capex: 100000000,
          depreciation: 100000000,
          currentPrice: 40,
          beta: 1.2,
          creditRating: 'A',
        },
        {
          name: 'Peer Tech B',
          ticker: 'PTB',
          industry: 'Technology',
          country: 'US',
          marketCap: 12000000000,
          enterpriseValue: 14000000000,
          revenue: 4000000000,
          ebitda: 800000000,
          ebit: 600000000,
          netIncome: 480000000,
          totalDebt: 3000000000,
          cashAndEquivalents: 1000000000,
          sharesOutstanding: 300000000,
          bookValue: 6000000000,
          freeCashFlow: 500000000,
          capex: 200000000,
          depreciation: 200000000,
          currentPrice: 40,
          beta: 1.4,
          creditRating: 'A+',
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

    // M&A Input
    maInput = {
      transaction: {
        type: 'acquisition',
        structure: 'mixed',
        announcementDate: '2024-01-15',
        expectedClosingDate: '2024-06-30',
        status: 'announced',
      },
      acquirer: {
        name: 'Acquirer Corp',
        ticker: 'ACQR',
        marketCap: 20000000000,
        enterpriseValue: 24000000000,
        sharesOutstanding: 400000000,
        currentPrice: 50,
        revenue: 8000000000,
        ebitda: 1600000000,
        netIncome: 960000000,
        totalDebt: 6000000000,
        cashAndEquivalents: 4000000000,
        beta: 1.1,
        creditRating: 'A+',
      },
      target: {
        name: 'TechCorp Inc.',
        ticker: 'TECH',
        marketCap: 8000000000,
        enterpriseValue: 9000000000,
        sharesOutstanding: 200000000,
        currentPrice: 40,
        revenue: 2645000000,
        ebitda: 529000000,
        netIncome: 317400000,
        totalDebt: 2000000000,
        cashAndEquivalents: 1000000000,
        beta: 1.3,
        creditRating: 'A',
      },
      transactionTerms: {
        purchasePrice: 10000000000,
        cashConsideration: 6000000000,
        stockConsideration: 4000000000,
        exchangeRatio: 0.8,
        premium: 0.25,
        financing: {
          newDebt: 2000000000,
          cashOnHand: 4000000000,
          equityIssuance: 0,
          otherSources: 0,
        },
      },
      synergies: {
        costSynergies: {
          annualAmount: 150000000,
          realizationPeriod: 3,
          probability: 0.8,
          categories: [
            { name: 'SG&A Reduction', amount: 90000000, timing: 2 },
            { name: 'IT Consolidation', amount: 60000000, timing: 3 },
          ],
        },
        revenueSynergies: {
          annualAmount: 75000000,
          realizationPeriod: 3,
          probability: 0.6,
          categories: [
            { name: 'Cross-selling', amount: 45000000, timing: 2 },
            { name: 'Market Expansion', amount: 30000000, timing: 3 },
          ],
        },
        taxSynergies: {
          annualAmount: 30000000,
          realizationPeriod: 2,
          probability: 0.7,
        },
      },
      integration: {
        timeline: 2,
        costs: {
          oneTimeCosts: 75000000,
          annualCosts: 37500000,
          duration: 2,
        },
        risks: [
          {
            category: 'Integration',
            description: 'Cultural integration challenges',
            probability: 0.3,
            impact: 'medium',
            mitigation: 'Change management program',
          },
          {
            category: 'Technology',
            description: 'IT system integration complexity',
            probability: 0.4,
            impact: 'high',
            mitigation: 'Phased integration approach',
          },
        ],
      },
      analysis: {
        discountRate: 0.1,
        taxRate: 0.25,
        terminalGrowthRate: 0.025,
        includeAccretionDilution: true,
        includeSensitivity: true,
        includeScenarios: true,
        forecastPeriod: 5,
      },
    };
  });

  describe('Cross-Model Validation', () => {
    it('should produce consistent valuations across DCF and CCA', () => {
      const dcfResult = DCFValuationEngine.analyze(dcfInput);
      const ccaResult = CCAValuationEngine.analyze(ccaInput);

      // Both should produce valid valuations
      expect(dcfResult.valuation.enterpriseValue).toBeGreaterThan(0);
      expect(ccaResult.valuation.enterpriseValue.median).toBeGreaterThan(0);

      // Valuations should be in reasonable range relative to each other
      const dcfEV = dcfResult.valuation.enterpriseValue;
      const ccaEV = ccaResult.valuation.enterpriseValue.median;

      // Allow for reasonable variance (within 50% of each other)
      const ratio = Math.max(dcfEV, ccaEV) / Math.min(dcfEV, ccaEV);
      expect(ratio).toBeLessThan(2.0);
    });

    it('should validate M&A transaction against DCF valuation', () => {
      const dcfResult = DCFValuationEngine.analyze(dcfInput);
      const maResult = MAAnalysisEngine.analyze(maInput);

      // M&A purchase price should be reasonable relative to DCF valuation
      const dcfEV = dcfResult.valuation.enterpriseValue;
      const maPrice = maResult.transactionSummary.purchasePrice;

      // Purchase price should be within reasonable range of DCF value
      const ratio = maPrice / dcfEV;
      expect(ratio).toBeGreaterThan(0.5); // At least 50% of DCF value
      expect(ratio).toBeLessThan(2.0); // At most 200% of DCF value
    });

    it('should validate M&A synergies against CCA multiples', () => {
      const ccaResult = CCAValuationEngine.analyze(ccaInput);
      const maResult = MAAnalysisEngine.analyze(maInput);

      // Synergy value should be reasonable relative to target size
      const targetRevenue = ccaInput.targetFinancials.revenue;
      const synergyValue = maResult.synergyAnalysis.totalSynergies.presentValue;

      // Synergies should be reasonable percentage of revenue
      const synergyPercent = synergyValue / targetRevenue;
      expect(synergyPercent).toBeGreaterThan(0.01); // At least 1% of revenue
      expect(synergyPercent).toBeLessThan(0.5); // At most 50% of revenue

      // CCA result should be valid
      expect(ccaResult.valuation.enterpriseValue.median).toBeGreaterThan(0);
    });
  });

  describe('Model Consistency', () => {
    it('should use consistent financial metrics across models', () => {
      const dcfResult = DCFValuationEngine.analyze(dcfInput);
      const ccaResult = CCAValuationEngine.analyze(ccaInput);
      const maResult = MAAnalysisEngine.analyze(maInput);

      // All models should reference their methodology
      expect(dcfResult.metadata.methodology.toLowerCase()).toMatch(/dcf|discount|cash flow/);
      expect(ccaResult.metadata.methodology.toLowerCase()).toMatch(/cca|comparable|company/);
      expect(maResult.metadata.methodology.toLowerCase()).toMatch(/m&a|merger|acquisition/);

      // All should have similar calculation timestamps
      const dcfTime = new Date(dcfResult.metadata.calculatedAt);
      const ccaTime = new Date(ccaResult.metadata.calculatedAt);
      const maTime = new Date(maResult.metadata.calculatedAt);

      const timeDiff = Math.max(
        Math.abs(dcfTime.getTime() - ccaTime.getTime()),
        Math.abs(dcfTime.getTime() - maTime.getTime()),
        Math.abs(ccaTime.getTime() - maTime.getTime())
      );

      expect(timeDiff).toBeLessThan(10000); // Within 10 seconds
    });

    it('should produce consistent insights across models', () => {
      const dcfResult = DCFValuationEngine.analyze(dcfInput);
      const ccaResult = CCAValuationEngine.analyze(ccaInput);
      const maResult = MAAnalysisEngine.analyze(maInput);

      // All models should have insights array (may be empty for some inputs)
      expect(Array.isArray(dcfResult.insights)).toBe(true);
      expect(Array.isArray(ccaResult.insights)).toBe(true);
      expect(Array.isArray(maResult.insights)).toBe(true);

      // If insights are generated, they should be relevant to their respective methodologies
      if (dcfResult.insights.length > 0) {
        const dcfInsights = dcfResult.insights.join(' ').toLowerCase();
        expect(dcfInsights).toMatch(/wacc|discount|cash flow|terminal|growth|margin|capital/);
      }
      if (ccaResult.insights.length > 0) {
        const ccaInsights = ccaResult.insights.join(' ').toLowerCase();
        expect(ccaInsights).toMatch(/peer|multiple|valuation|comparable|median|range/);
      }
      if (maResult.insights.length > 0) {
        const maInsights = maResult.insights.join(' ').toLowerCase();
        expect(maInsights).toMatch(/synergy|acquisition|merger|integration|value|premium/);
      }
    });
  });

  describe('Performance Integration', () => {
    it('should complete all analyses within reasonable time', () => {
      const startTime = Date.now();

      const dcfResult = DCFValuationEngine.analyze(dcfInput);
      const ccaResult = CCAValuationEngine.analyze(ccaInput);
      const maResult = MAAnalysisEngine.analyze(maInput);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(10000); // All three within 10 seconds
      expect(dcfResult).toBeDefined();
      expect(ccaResult).toBeDefined();
      expect(maResult).toBeDefined();
    });

    it('should handle Monte Carlo analysis across models', () => {
      const dcfWithMonteCarlo = {
        ...dcfInput,
        analysis: {
          ...dcfInput.analysis,
          includeMonteCarlo: true,
          monteCarloSimulations: 5000,
        },
      };

      const startTime = Date.now();

      const dcfResult = DCFValuationEngine.analyze(dcfWithMonteCarlo);
      const ccaResult = CCAValuationEngine.analyze(ccaInput);
      const maResult = MAAnalysisEngine.analyze(maInput);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(15000); // Within 15 seconds with Monte Carlo
      expect(dcfResult.monteCarlo).toBeDefined();
      // Monte Carlo may produce negative values in stress scenarios; check it's a valid number
      expect(typeof dcfResult.monteCarlo?.meanValuation).toBe('number');
      expect(Number.isFinite(dcfResult.monteCarlo?.meanValuation)).toBe(true);
      expect(ccaResult).toBeDefined();
      expect(maResult).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors gracefully across models', () => {
      const invalidDcfInput = {
        ...dcfInput,
        waccInput: {
          ...dcfInput.waccInput,
          beta: -1, // Invalid beta
        },
      };

      const invalidCcaInput = {
        ...ccaInput,
        targetFinancials: {
          ...ccaInput.targetFinancials,
          revenue: -1000000, // Invalid revenue
        },
      };

      const invalidMaInput = {
        ...maInput,
        transactionTerms: {
          ...maInput.transactionTerms,
          purchasePrice: -1000000, // Invalid price
        },
      };

      // All should throw errors for invalid inputs
      expect(() => DCFValuationEngine.analyze(invalidDcfInput)).toThrow();
      expect(() => CCAValuationEngine.analyze(invalidCcaInput)).toThrow();
      expect(() => MAAnalysisEngine.analyze(invalidMaInput)).toThrow();
    });

    it('should maintain data integrity across models', () => {
      const dcfResult = DCFValuationEngine.analyze(dcfInput);
      const ccaResult = CCAValuationEngine.analyze(ccaInput);
      const maResult = MAAnalysisEngine.analyze(maInput);

      // All results should have valid metadata
      expect(dcfResult.metadata.version).toBeDefined();
      expect(ccaResult.metadata.version).toBeDefined();
      expect(maResult.metadata.version).toBeDefined();

      // All should have valid calculation timestamps
      expect(new Date(dcfResult.metadata.calculatedAt)).toBeInstanceOf(Date);
      expect(new Date(ccaResult.metadata.calculatedAt)).toBeInstanceOf(Date);
      expect(new Date(maResult.metadata.calculatedAt)).toBeInstanceOf(Date);
    });
  });

  describe('Business Logic Integration', () => {
    it('should validate business logic consistency', () => {
      const dcfResult = DCFValuationEngine.analyze(dcfInput);
      const ccaResult = CCAValuationEngine.analyze(ccaInput);
      const maResult = MAAnalysisEngine.analyze(maInput);

      // DCF terminal value should be significant portion of total value
      const terminalValuePercent =
        dcfResult.dcfComponents.presentValueOfTerminalValue / dcfResult.valuation.enterpriseValue;
      expect(terminalValuePercent).toBeGreaterThan(0.3); // At least 30%
      expect(terminalValuePercent).toBeLessThan(0.8); // At most 80%

      // CCA valuation range should be present
      const ccaRange = ccaResult.valuation.enterpriseValue.range;
      expect(ccaRange.max).toBeGreaterThanOrEqual(ccaRange.min);
      // If there's a spread, it should be reasonable (some peer sets may have no spread)
      if (ccaRange.max > ccaRange.min) {
        const ccaSpread = (ccaRange.max - ccaRange.min) / ccaRange.min;
        expect(ccaSpread).toBeLessThan(2.0); // At most 200% spread
      }

      // M&A value creation should be reasonable
      const valueCreationPercent = maResult.valuation.valueCreationPercent;
      expect(valueCreationPercent).toBeGreaterThan(-0.5); // Not more than 50% destruction
      expect(valueCreationPercent).toBeLessThan(1.0); // Not more than 100% creation
    });

    it('should validate financial metric consistency', () => {
      const dcfResult = DCFValuationEngine.analyze(dcfInput);
      const ccaResult = CCAValuationEngine.analyze(ccaInput);
      const maResult = MAAnalysisEngine.analyze(maInput);

      // All models should reference similar financial metrics
      expect(dcfResult.keyMetrics.revenueCAGR).toBeGreaterThan(0);
      expect(ccaResult.keyMetrics.revenue.peerAverage).toBeGreaterThan(0);
      expect(maResult.keyMetrics.evRevenue).toBeGreaterThan(0);

      // Growth rates should be reasonable
      expect(dcfResult.keyMetrics.revenueCAGR).toBeLessThan(1.0); // Less than 100% CAGR
      expect(dcfResult.keyMetrics.ebitdaCAGR).toBeLessThan(1.0);

      // Margins should be reasonable
      expect(dcfResult.keyMetrics.averageEbitdaMargin).toBeGreaterThan(0.05); // At least 5%
      expect(dcfResult.keyMetrics.averageEbitdaMargin).toBeLessThan(0.5); // At most 50%
    });
  });
});
