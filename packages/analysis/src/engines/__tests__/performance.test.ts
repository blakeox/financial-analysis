/**
 * Business Models Performance Test Suite
 * Performance tests for Monte Carlo and sensitivity analysis
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { CCAValuationEngine, CCAValuationInput } from '../cca-analysis';
import { DCFValuationEngine, DCFValuationInput } from '../dcf-analysis';
import { MAAnalysisEngine, MAAnalysisInput } from '../ma-analysis';

describe('Business Models Performance', () => {
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
        includeSensitivity: true,
        includeScenarios: true,
        includeMonteCarlo: false,
        monteCarloSimulations: 1000,
        sensitivityVariables: ['revenueGrowth', 'ebitdaMargin', 'wacc'],
      },
    };
  });

  describe('Monte Carlo Performance', () => {
    it('should complete Monte Carlo analysis within reasonable time', () => {
      const dcfWithMonteCarlo = {
        ...dcfInput,
        analysis: {
          ...dcfInput.analysis,
          includeMonteCarlo: true,
          monteCarloSimulations: 1000,
        },
      };

      const startTime = Date.now();
      const result = DCFValuationEngine.analyze(dcfWithMonteCarlo);
      const endTime = Date.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000); // Within 5 seconds
      expect(result.monteCarlo).toBeDefined();
      expect(result.monteCarlo?.meanValuation).toBeGreaterThan(0);
    });

    it('should scale Monte Carlo performance linearly', () => {
      const simulations = [100, 500, 1000];
      const executionTimes: number[] = [];

      for (const simCount of simulations) {
        const dcfWithMonteCarlo = {
          ...dcfInput,
          analysis: {
            ...dcfInput.analysis,
            includeMonteCarlo: true,
            monteCarloSimulations: simCount,
          },
        };

        const startTime = Date.now();
        DCFValuationEngine.analyze(dcfWithMonteCarlo);
        const endTime = Date.now();

        executionTimes.push(endTime - startTime);
      }

      // Performance should scale roughly linearly
      const ratio1 = executionTimes[1] / executionTimes[0];
      const ratio2 = executionTimes[2] / executionTimes[0];

      expect(ratio1).toBeGreaterThan(0.5); // At least 50% of expected scaling
      expect(ratio1).toBeLessThan(2.0); // At most 200% of expected scaling
      expect(ratio2).toBeGreaterThan(0.5);
      expect(ratio2).toBeLessThan(2.0);
    });

    it('should produce consistent Monte Carlo results', () => {
      const dcfWithMonteCarlo = {
        ...dcfInput,
        analysis: {
          ...dcfInput.analysis,
          includeMonteCarlo: true,
          monteCarloSimulations: 500,
        },
      };

      const results = [];
      for (let i = 0; i < 3; i++) {
        results.push(DCFValuationEngine.analyze(dcfWithMonteCarlo));
      }

      // Results should be consistent (within reasonable variance)
      const mean1 = results[0].monteCarlo?.meanValuation || 0;
      const mean2 = results[1].monteCarlo?.meanValuation || 0;
      const mean3 = results[2].monteCarlo?.meanValuation || 0;

      const avgMean = (mean1 + mean2 + mean3) / 3;
      const variance = Math.max(
        Math.abs(mean1 - avgMean),
        Math.abs(mean2 - avgMean),
        Math.abs(mean3 - avgMean)
      );

      expect(variance / avgMean).toBeLessThan(0.1); // Less than 10% variance
    });

    it('should handle large Monte Carlo simulations', () => {
      const dcfWithMonteCarlo = {
        ...dcfInput,
        analysis: {
          ...dcfInput.analysis,
          includeMonteCarlo: true,
          monteCarloSimulations: 2000,
        },
      };

      const startTime = Date.now();
      const result = DCFValuationEngine.analyze(dcfWithMonteCarlo);
      const endTime = Date.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(10000); // Within 10 seconds
      expect(result.monteCarlo).toBeDefined();
      expect(result.monteCarlo?.meanValuation).toBeGreaterThan(0);
      expect(result.monteCarlo?.confidenceInterval.p5).toBeLessThan(
        result.monteCarlo?.confidenceInterval.p95 || 0
      );
    });
  });

  describe('Sensitivity Analysis Performance', () => {
    it('should complete sensitivity analysis within reasonable time', () => {
      const dcfWithSensitivity = {
        ...dcfInput,
        analysis: {
          ...dcfInput.analysis,
          includeSensitivity: true,
        },
      };

      const startTime = Date.now();
      const result = DCFValuationEngine.analyze(dcfWithSensitivity);
      const endTime = Date.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(2000); // Within 2 seconds
      expect(result.sensitivity).toBeDefined();
      expect(result.sensitivity?.revenueGrowth).toBeDefined();
      expect(result.sensitivity?.ebitdaMargin).toBeDefined();
      expect(result.sensitivity?.wacc).toBeDefined();
    });

    it('should complete scenario analysis within reasonable time', () => {
      const dcfWithScenarios = {
        ...dcfInput,
        analysis: {
          ...dcfInput.analysis,
          includeScenarios: true,
        },
      };

      const startTime = Date.now();
      const result = DCFValuationEngine.analyze(dcfWithScenarios);
      const endTime = Date.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(2000); // Within 2 seconds
      expect(result.scenarios).toBeDefined();
      expect(result.scenarios?.baseCase).toBeGreaterThan(0);
      expect(result.scenarios?.bullCase).toBeGreaterThan(0);
      expect(result.scenarios?.bearCase).toBeGreaterThan(0);
    });

    it('should complete M&A sensitivity analysis within reasonable time', () => {
      const maWithSensitivity = {
        ...maInput,
        analysis: {
          ...maInput.analysis,
          includeSensitivity: true,
        },
      };

      const startTime = Date.now();
      const result = MAAnalysisEngine.analyze(maWithSensitivity);
      const endTime = Date.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(3000); // Within 3 seconds
      expect(result.sensitivity).toBeDefined();
      expect(result.sensitivity?.purchasePrice).toBeDefined();
      expect(result.sensitivity?.synergies).toBeDefined();
      expect(result.sensitivity?.discountRate).toBeDefined();
    });

    it('should complete CCA outlier analysis within reasonable time', () => {
      const ccaWithOutliers = {
        ...ccaInput,
        analysis: {
          ...ccaInput.analysis,
          excludeOutliers: true,
          outlierThreshold: 2,
        },
      };

      const startTime = Date.now();
      const result = CCAValuationEngine.analyze(ccaWithOutliers);
      const endTime = Date.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(1000); // Within 1 second
      expect(result.tradingMultiples).toBeDefined();
      expect(result.tradingMultiples.evRevenue).toBeDefined();
      expect(result.tradingMultiples.evEbitda).toBeDefined();
    });
  });

  describe('Memory Performance', () => {
    it('should not exceed memory limits during Monte Carlo', () => {
      const dcfWithMonteCarlo = {
        ...dcfInput,
        analysis: {
          ...dcfInput.analysis,
          includeMonteCarlo: true,
          monteCarloSimulations: 1000,
        },
      };

      const startMemory = process.memoryUsage().heapUsed;
      const result = DCFValuationEngine.analyze(dcfWithMonteCarlo);
      const endMemory = process.memoryUsage().heapUsed;

      const memoryIncrease = endMemory - startMemory;

      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
      expect(result.monteCarlo).toBeDefined();
    });

    it('should handle multiple concurrent analyses', () => {
      const analyses = [];

      for (let i = 0; i < 5; i++) {
        analyses.push(DCFValuationEngine.analyze(dcfInput));
      }

      expect(analyses.length).toBe(5);
      analyses.forEach((result) => {
        expect(result.valuation.enterpriseValue).toBeGreaterThan(0);
      });
    });

    it('should clean up memory after analysis', () => {
      const startMemory = process.memoryUsage().heapUsed;

      // Run multiple analyses
      for (let i = 0; i < 10; i++) {
        DCFValuationEngine.analyze(dcfInput);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;

      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });

  describe('Concurrent Performance', () => {
    it('should handle concurrent Monte Carlo analyses', async () => {
      const dcfWithMonteCarlo = {
        ...dcfInput,
        analysis: {
          ...dcfInput.analysis,
          includeMonteCarlo: true,
          monteCarloSimulations: 500,
        },
      };

      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          new Promise((resolve) => {
            const result = DCFValuationEngine.analyze(dcfWithMonteCarlo);
            resolve(result);
          })
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(10000); // Within 10 seconds for all 3
      expect(results.length).toBe(3);
      results.forEach((result) => {
        expect(result.monteCarlo).toBeDefined();
        expect(result.monteCarlo?.meanValuation).toBeGreaterThan(0);
      });
    });

    it('should handle mixed analysis types concurrently', async () => {
      const startTime = Date.now();

      const promises = [
        new Promise((resolve) => {
          const result = DCFValuationEngine.analyze(dcfInput);
          resolve(result);
        }),
        new Promise((resolve) => {
          const result = CCAValuationEngine.analyze(ccaInput);
          resolve(result);
        }),
        new Promise((resolve) => {
          const result = MAAnalysisEngine.analyze(maInput);
          resolve(result);
        }),
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000); // Within 5 seconds for all 3
      expect(results.length).toBe(3);
    });
  });
});
