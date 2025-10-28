/**
 * M&A Analysis Engine Test Suite
 * Comprehensive tests for M&A analysis functionality
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { MAAnalysisEngine, MAAnalysisInput } from '../ma-analysis';

describe('MAAnalysisEngine', () => {
  let sampleInput: MAAnalysisInput;

  beforeEach(() => {
    sampleInput = {
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
        marketCap: 10000000000,
        enterpriseValue: 12000000000,
        sharesOutstanding: 200000000,
        currentPrice: 50,
        revenue: 5000000000,
        ebitda: 1000000000,
        netIncome: 600000000,
        totalDebt: 3000000000,
        cashAndEquivalents: 2000000000,
        beta: 1.2,
        creditRating: 'A',
      },
      target: {
        name: 'Target Corp',
        ticker: 'TGT',
        marketCap: 3000000000,
        enterpriseValue: 3500000000,
        sharesOutstanding: 100000000,
        currentPrice: 30,
        revenue: 2000000000,
        ebitda: 400000000,
        netIncome: 200000000,
        totalDebt: 1000000000,
        cashAndEquivalents: 500000000,
        beta: 1.1,
        creditRating: 'A-',
      },
      transactionTerms: {
        purchasePrice: 3500000000,
        cashConsideration: 2000000000,
        stockConsideration: 1500000000,
        exchangeRatio: 0.6,
        premium: 0.167, // 16.7% premium
        financing: {
          newDebt: 1000000000,
          cashOnHand: 2000000000,
          equityIssuance: 0,
          otherSources: 0,
        },
      },
      synergies: {
        costSynergies: {
          annualAmount: 100000000,
          realizationPeriod: 3,
          probability: 0.8,
          categories: [
            { name: 'SG&A Reduction', amount: 60000000, timing: 2 },
            { name: 'IT Consolidation', amount: 40000000, timing: 3 },
          ],
        },
        revenueSynergies: {
          annualAmount: 50000000,
          realizationPeriod: 3,
          probability: 0.6,
          categories: [
            { name: 'Cross-selling', amount: 30000000, timing: 2 },
            { name: 'Market Expansion', amount: 20000000, timing: 3 },
          ],
        },
        taxSynergies: {
          annualAmount: 20000000,
          realizationPeriod: 2,
          probability: 0.7,
        },
      },
      integration: {
        timeline: 2,
        costs: {
          oneTimeCosts: 50000000,
          annualCosts: 25000000,
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

  describe('Basic M&A Analysis', () => {
    it('should calculate transaction summary', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.transactionSummary).toBeDefined();
      expect(result.transactionSummary.acquirer).toBe('Acquirer Corp');
      expect(result.transactionSummary.target).toBe('Target Corp');
      expect(result.transactionSummary.transactionType).toBe('acquisition');
      expect(result.transactionSummary.purchasePrice).toBe(3500000000);
      expect(result.transactionSummary.premium).toBeCloseTo(0.167, 3);
      expect(result.transactionSummary.dealSize).toBe('Large');
    });

    it('should calculate valuation analysis', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.valuation).toBeDefined();
      expect(result.valuation.targetStandaloneValue).toBeGreaterThan(0);
      expect(result.valuation.targetWithSynergies).toBeGreaterThan(
        result.valuation.targetStandaloneValue
      );
      expect(result.valuation.acquirerValue).toBeGreaterThan(0);
      expect(result.valuation.combinedValue).toBeGreaterThan(0);
      expect(result.valuation.valueCreation).toBeDefined();
      expect(result.valuation.valueCreationPercent).toBeDefined();
    });

    it('should analyze synergies', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.synergyAnalysis).toBeDefined();
      expect(result.synergyAnalysis.totalSynergies.presentValue).toBeGreaterThan(0);
      expect(result.synergyAnalysis.totalSynergies.annualRunRate).toBeGreaterThan(0);
      expect(result.synergyAnalysis.costSynergies.presentValue).toBeGreaterThan(0);
      expect(result.synergyAnalysis.revenueSynergies.presentValue).toBeGreaterThan(0);
      expect(result.synergyAnalysis.taxSynergies.presentValue).toBeGreaterThan(0);
    });
  });

  describe('Accretion/Dilution Analysis', () => {
    it('should calculate accretion/dilution when requested', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.accretionDilution).toBeDefined();
      expect(result.accretionDilution?.epsAccretion).toBeDefined();
      expect(result.accretionDilution?.epsAccretion).toHaveLength(5);
      expect(result.accretionDilution?.summary).toBeDefined();
      expect(result.accretionDilution?.summary.year1Accretion).toBeDefined();
      expect(result.accretionDilution?.summary.year3Accretion).toBeDefined();
      expect(result.accretionDilution?.summary.year5Accretion).toBeDefined();
    });

    it('should calculate EPS accretion correctly', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      if (result.accretionDilution) {
        const firstYear = result.accretionDilution.epsAccretion[0];
        expect(firstYear.year).toBe(new Date().getFullYear() + 1);
        expect(firstYear.standaloneEps).toBeGreaterThan(0);
        expect(firstYear.proFormaEps).toBeGreaterThan(0);
        expect(firstYear.accretion).toBeDefined();
        expect(firstYear.accretionPercent).toBeDefined();
      }
    });
  });

  describe('Financial Impact Analysis', () => {
    it('should calculate combined financial metrics', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.financialImpact).toBeDefined();
      expect(result.financialImpact.combinedRevenue).toBeGreaterThan(0);
      expect(result.financialImpact.combinedEbitda).toBeGreaterThan(0);
      expect(result.financialImpact.combinedNetIncome).toBeGreaterThan(0);
      expect(result.financialImpact.combinedDebt).toBeGreaterThan(0);
      expect(result.financialImpact.combinedCash).toBeDefined();
      expect(result.financialImpact.leverageRatio).toBeGreaterThan(0);
      expect(result.financialImpact.creditImpact).toBeDefined();
    });

    it('should assess credit impact based on leverage', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      const leverageRatio = result.financialImpact.leverageRatio;
      expect(leverageRatio).toBeGreaterThan(0);

      // Credit impact should be determined based on leverage
      expect(['Positive', 'Neutral', 'Negative']).toContain(result.financialImpact.creditImpact);
    });
  });

  describe('Integration Analysis', () => {
    it('should analyze integration costs and timeline', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.integrationAnalysis).toBeDefined();
      expect(result.integrationAnalysis.timeline).toBeGreaterThan(0);
      expect(result.integrationAnalysis.totalCosts).toBeGreaterThan(0);
      expect(result.integrationAnalysis.netSynergies).toBeDefined();
      expect(result.integrationAnalysis.paybackPeriod).toBeGreaterThan(0);
    });

    it('should assess integration risks', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.integrationAnalysis.riskAssessment).toBeDefined();
      expect(result.integrationAnalysis.riskAssessment.overallRisk).toMatch(/^(low|medium|high)$/);
      expect(result.integrationAnalysis.riskAssessment.keyRisks).toBeDefined();
      expect(Array.isArray(result.integrationAnalysis.riskAssessment.keyRisks)).toBe(true);
    });
  });

  describe('Sensitivity Analysis', () => {
    it('should perform sensitivity analysis when requested', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.sensitivity).toBeDefined();
      expect(result.sensitivity?.purchasePrice).toBeDefined();
      expect(result.sensitivity?.synergies).toBeDefined();

      // Check purchase price sensitivity
      const priceSensitivity = result.sensitivity?.purchasePrice;
      expect(priceSensitivity).toHaveLength(9); // 80% to 120% in 5% increments
      expect(priceSensitivity?.[0].price).toBeCloseTo(2800000000, 0); // 80% of purchase price
      expect(priceSensitivity?.[8].price).toBeCloseTo(4200000000, 0); // 120% of purchase price
    });

    it('should show value creation sensitivity to purchase price', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      const priceSensitivity = result.sensitivity?.purchasePrice;
      if (priceSensitivity && priceSensitivity.length > 1) {
        // Lower purchase price should result in higher value creation
        const firstValue = priceSensitivity[0].valueCreation;
        const lastValue = priceSensitivity[priceSensitivity.length - 1].valueCreation;
        expect(firstValue).toBeGreaterThan(lastValue);
      }
    });
  });

  describe('Scenario Analysis', () => {
    it('should perform scenario analysis when requested', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.scenarios).toBeDefined();
      expect(result.scenarios?.baseCase).toBeDefined();
      expect(result.scenarios?.optimisticCase).toBeGreaterThan(0);
      expect(result.scenarios?.pessimisticCase).toBeDefined();
      expect(result.scenarios?.probabilityWeighted).toBeGreaterThan(0);

      // Optimistic case should be higher than base case
      expect(result.scenarios?.optimisticCase).toBeGreaterThan(result.scenarios?.baseCase || 0);

      // Pessimistic case should be lower than base case
      expect(result.scenarios?.pessimisticCase).toBeLessThan(result.scenarios?.baseCase || 0);
    });
  });

  describe('Key Metrics', () => {
    it('should calculate key financial metrics', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.keyMetrics).toBeDefined();
      expect(result.keyMetrics.evRevenue).toBeGreaterThan(0);
      expect(result.keyMetrics.evEbitda).toBeGreaterThan(0);
      expect(result.keyMetrics.pe).toBeGreaterThan(0);
      expect(result.keyMetrics.debtToEquity).toBeGreaterThan(0);
    });
  });

  describe('Insights and Recommendations', () => {
    it('should generate insights', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('should generate warnings', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should generate recommendations', () => {
      const result = MAAnalysisEngine.analyze(sampleInput);

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
    it('should handle invalid transaction terms', () => {
      const invalidInput = {
        ...sampleInput,
        transactionTerms: {
          ...sampleInput.transactionTerms,
          purchasePrice: -1000000, // Invalid negative price
        },
      };

      expect(() => MAAnalysisEngine.analyze(invalidInput)).toThrow();
    });

    it('should handle missing synergy data', () => {
      const inputWithoutSynergies = {
        ...sampleInput,
        synergies: {
          ...sampleInput.synergies,
          costSynergies: {
            ...sampleInput.synergies.costSynergies,
            annualAmount: -50000000, // Invalid negative amount
          },
        },
      };

      expect(() => MAAnalysisEngine.analyze(inputWithoutSynergies)).toThrow();
    });

    it('should handle invalid integration timeline', () => {
      const inputWithInvalidTimeline = {
        ...sampleInput,
        integration: {
          ...sampleInput.integration,
          timeline: -1, // Invalid negative timeline
        },
      };

      expect(() => MAAnalysisEngine.analyze(inputWithInvalidTimeline)).toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete analysis within reasonable time', () => {
      const startTime = Date.now();
      MAAnalysisEngine.analyze(sampleInput);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle complex synergy analysis efficiently', () => {
      const complexSynergyInput = {
        ...sampleInput,
        synergies: {
          costSynergies: {
            annualAmount: 200000000,
            realizationPeriod: 5,
            probability: 0.8,
            categories: Array.from({ length: 10 }, (_, i) => ({
              name: `Cost Synergy ${i + 1}`,
              amount: 20000000,
              timing: i + 1,
            })),
          },
          revenueSynergies: {
            annualAmount: 100000000,
            realizationPeriod: 5,
            probability: 0.6,
            categories: Array.from({ length: 10 }, (_, i) => ({
              name: `Revenue Synergy ${i + 1}`,
              amount: 10000000,
              timing: i + 1,
            })),
          },
          taxSynergies: {
            annualAmount: 50000000,
            realizationPeriod: 3,
            probability: 0.7,
          },
        },
      };

      const startTime = Date.now();
      const result = MAAnalysisEngine.analyze(complexSynergyInput);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.synergyAnalysis).toBeDefined();
    });
  });
});
