import { describe, it, expect } from 'vitest';
import { TaxOptimizationPlanner, TaxOptimizationInputSchema } from '../tax-optimization.js';
import type { TaxOptimizationInput, TaxOptimizationResult } from '../tax-optimization.js';
import { z } from 'zod';

describe('TaxOptimizationPlanner', () => {
  const createBasicInput = (
    overrides: Partial<z.input<typeof TaxOptimizationInputSchema>> = {}
  ): TaxOptimizationInput => {
    const base: z.input<typeof TaxOptimizationInputSchema> = {
      personalInfo: {
        age: 35,
        maritalStatus: 'single',
        dependents: 0,
        state: 'CA',
        filingStatus: 'single',
      },
      currentTaxSituation: {
        annualIncome: 150000,
        adjustedGrossIncome: 140000,
        taxableIncome: 125000,
        federalTaxOwed: 25000,
        stateTaxOwed: 8000,
        effectiveTaxRate: 0.22,
        marginalTaxRate: 0.24,
        totalTaxOwed: 33000,
      },
      investmentHoldings: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc',
          shares: 100,
          currentPrice: 180,
          costBasis: 15000,
          purchaseDate: '2021-01-15',
          accountType: 'taxable',
          holdingPeriod: 'long-term',
          unrealizedGainLoss: 3000, // 18000 - 15000
        },
        {
          symbol: 'GOOGL',
          name: 'Alphabet Inc',
          shares: 50,
          currentPrice: 140,
          costBasis: 8000,
          purchaseDate: '2022-06-01',
          accountType: 'taxable',
          holdingPeriod: 'long-term',
          unrealizedGainLoss: -1000, // 7000 - 8000 (loss position)
        },
      ],
      retirementAccounts: {
        traditional401k: {
          balance: 100000,
          annualContribution: 15000,
          employerMatch: 5000,
        },
        roth401k: {
          balance: 25000,
          annualContribution: 5000,
        },
        traditionalIRA: {
          balance: 30000,
          annualContribution: 3000,
          deductibleContribution: 3000,
        },
        rothIRA: {
          balance: 20000,
          annualContribution: 6000,
        },
        hsa: {
          balance: 10000,
          annualContribution: 3650,
          employerContribution: 500,
        },
      },
      deductionsCredits: {
        standardDeduction: 13850,
        itemizedDeductions: {
          mortgageInterest: 12000,
          propertyTaxes: 5000,
          stateIncomeTax: 8000,
          charitableContributions: 3000,
          medicalExpenses: 1000,
          otherDeductions: 500,
        },
        taxCredits: {
          childTaxCredit: 0,
          earnedIncomeCredit: 0,
          educationCredits: 0,
          otherCredits: 0,
        },
      },
      goals: {
        retirementAge: 65,
        expectedRetirementTaxRate: 0.15,
        charitableGivingGoal: 5000,
        taxLossHarvestingGoal: 3000,
        capitalGainsGoal: 0,
      },
      analysis: {
        includeTaxLossHarvesting: true,
        includeRothConversion: true,
        includeCharitableGiving: true,
        includeCapitalGainsOptimization: true,
        includeEstimatedTaxPlanning: true,
        includeBracketOptimization: true,
        inflationRate: 0.03,
        discountRate: 0.05,
      },
    };

    // Deep merge overrides
    return TaxOptimizationInputSchema.parse({
      ...base,
      ...overrides,
      personalInfo: { ...base.personalInfo, ...(overrides.personalInfo || {}) },
      currentTaxSituation: {
        ...base.currentTaxSituation,
        ...(overrides.currentTaxSituation || {}),
      },
      investmentHoldings: overrides.investmentHoldings ?? base.investmentHoldings,
      retirementAccounts: {
        traditional401k: {
          ...base.retirementAccounts.traditional401k,
          ...(overrides.retirementAccounts?.traditional401k || {}),
        },
        roth401k: {
          ...base.retirementAccounts.roth401k,
          ...(overrides.retirementAccounts?.roth401k || {}),
        },
        traditionalIRA: {
          ...base.retirementAccounts.traditionalIRA,
          ...(overrides.retirementAccounts?.traditionalIRA || {}),
        },
        rothIRA: {
          ...base.retirementAccounts.rothIRA,
          ...(overrides.retirementAccounts?.rothIRA || {}),
        },
        hsa: {
          ...base.retirementAccounts.hsa,
          ...(overrides.retirementAccounts?.hsa || {}),
        },
      },
      deductionsCredits: {
        standardDeduction:
          overrides.deductionsCredits?.standardDeduction ??
          base.deductionsCredits.standardDeduction,
        itemizedDeductions: {
          ...base.deductionsCredits.itemizedDeductions,
          ...(overrides.deductionsCredits?.itemizedDeductions || {}),
        },
        taxCredits: {
          ...base.deductionsCredits.taxCredits,
          ...(overrides.deductionsCredits?.taxCredits || {}),
        },
      },
      goals: { ...base.goals, ...(overrides.goals || {}) },
      analysis: { ...base.analysis, ...(overrides.analysis || {}) },
    });
  };

  describe('analyze()', () => {
    it('should perform comprehensive tax optimization analysis', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result).toBeDefined();
      expect(result.taxSummary).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should validate input with Zod schema', () => {
      const input = createBasicInput();
      expect(() => TaxOptimizationInputSchema.parse(input)).not.toThrow();
    });
  });

  describe('tax summary', () => {
    it('should calculate current year tax savings', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.taxSummary.currentYearTaxSavings).toBeDefined();
      expect(typeof result.taxSummary.currentYearTaxSavings).toBe('number');
    });

    it('should calculate projected long-term savings', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.taxSummary.projectedLongTermSavings).toBeDefined();
      expect(typeof result.taxSummary.projectedLongTermSavings).toBe('number');
    });

    it('should calculate optimization score', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.taxSummary.optimizationScore).toBeDefined();
      expect(result.taxSummary.optimizationScore).toBeGreaterThanOrEqual(0);
      expect(result.taxSummary.optimizationScore).toBeLessThanOrEqual(100);
    });

    it('should generate priority recommendations', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.taxSummary.priorityRecommendations).toBeDefined();
      expect(Array.isArray(result.taxSummary.priorityRecommendations)).toBe(true);
    });
  });

  describe('tax-loss harvesting', () => {
    it('should identify tax-loss harvesting opportunities', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.taxLossHarvesting).toBeDefined();
      expect(result.taxLossHarvesting.recommendedHarvesting).toBeDefined();
    });

    it('should calculate available losses from loss positions', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.taxLossHarvesting.availableLosses).toBeDefined();
      expect(result.taxLossHarvesting.availableLosses).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total tax benefit from harvesting', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.taxLossHarvesting.totalTaxBenefit).toBeDefined();
    });

    it('should identify wash sale risk', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(typeof result.taxLossHarvesting.washSaleRisk).toBe('boolean');
    });

    it('should provide wash sale recommendations when applicable', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.taxLossHarvesting.washSaleRecommendations).toBeDefined();
      expect(Array.isArray(result.taxLossHarvesting.washSaleRecommendations)).toBe(true);
    });
  });

  describe('Roth vs Traditional analysis', () => {
    it('should include Roth vs Traditional analysis', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.rothTraditionalAnalysis).toBeDefined();
    });

    it('should analyze current year contribution options', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.rothTraditionalAnalysis.currentYearAnalysis).toBeDefined();
      expect(
        result.rothTraditionalAnalysis.currentYearAnalysis.traditional401kBenefit
      ).toBeDefined();
      expect(result.rothTraditionalAnalysis.currentYearAnalysis.roth401kBenefit).toBeDefined();
    });

    it('should recommend contribution type based on tax rates', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(
        result.rothTraditionalAnalysis.currentYearAnalysis.recommendedContribution
      ).toBeDefined();
      expect(['traditional', 'roth', 'split']).toContain(
        result.rothTraditionalAnalysis.currentYearAnalysis.recommendedContribution
      );
    });

    it('should provide reasoning for recommendation', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.rothTraditionalAnalysis.currentYearAnalysis.reasoning).toBeDefined();
      expect(typeof result.rothTraditionalAnalysis.currentYearAnalysis.reasoning).toBe('string');
    });

    it('should analyze long-term projections', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.rothTraditionalAnalysis.longTermAnalysis).toBeDefined();
      expect(result.rothTraditionalAnalysis.longTermAnalysis.traditionalFutureValue).toBeDefined();
      expect(result.rothTraditionalAnalysis.longTermAnalysis.rothFutureValue).toBeDefined();
      expect(result.rothTraditionalAnalysis.longTermAnalysis.taxAdvantage).toBeDefined();
      expect(result.rothTraditionalAnalysis.longTermAnalysis.breakEvenAge).toBeDefined();
    });

    it('should analyze Roth conversion opportunities', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.rothTraditionalAnalysis.rothConversionAnalysis).toBeDefined();
      expect(
        result.rothTraditionalAnalysis.rothConversionAnalysis.recommendedConversionAmount
      ).toBeDefined();
      expect(result.rothTraditionalAnalysis.rothConversionAnalysis.taxCost).toBeDefined();
      expect(result.rothTraditionalAnalysis.rothConversionAnalysis.longTermBenefit).toBeDefined();
    });
  });

  describe('capital gains optimization', () => {
    it('should include capital gains analysis', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.capitalGainsOptimization).toBeDefined();
    });

    it('should calculate current unrealized gains', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.capitalGainsOptimization.currentGains).toBeDefined();
      expect(typeof result.capitalGainsOptimization.currentGains).toBe('number');
    });

    it('should recommend realization strategies', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.capitalGainsOptimization.recommendedRealization).toBeDefined();
      expect(Array.isArray(result.capitalGainsOptimization.recommendedRealization)).toBe(true);
    });

    it('should provide timing recommendations for gains', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      result.capitalGainsOptimization.recommendedRealization.forEach((rec) => {
        expect(['immediate', 'defer', 'offset']).toContain(rec.timing);
      });
    });

    it('should generate tax-efficient strategies', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.capitalGainsOptimization.taxEfficientStrategies).toBeDefined();
      expect(result.capitalGainsOptimization.taxEfficientStrategies.length).toBeGreaterThan(0);
    });

    it('should calculate total tax savings', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.capitalGainsOptimization.totalTaxSavings).toBeDefined();
    });
  });

  describe('charitable giving strategies', () => {
    it('should include charitable giving analysis', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.charitableGiving).toBeDefined();
    });

    it('should track current contributions', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.charitableGiving.currentContributions).toBeDefined();
    });

    it('should recommend charitable strategies', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.charitableGiving.recommendedStrategies).toBeDefined();
      expect(Array.isArray(result.charitableGiving.recommendedStrategies)).toBe(true);
    });

    it('should analyze donor-advised fund options', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.charitableGiving.donorAdvisedFund).toBeDefined();
      expect(typeof result.charitableGiving.donorAdvisedFund.recommended).toBe('boolean');
    });

    it('should analyze appreciated securities donation', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.charitableGiving.appreciatedSecurities).toBeDefined();
      expect(result.charitableGiving.appreciatedSecurities.recommendedSecurities).toBeDefined();
      expect(result.charitableGiving.appreciatedSecurities.totalTaxBenefit).toBeDefined();
    });
  });

  describe('estimated tax planning', () => {
    it('should include estimated tax planning', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.estimatedTaxPlanning).toBeDefined();
    });

    it('should project next year income and taxes', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.estimatedTaxPlanning.projectedIncome).toBeDefined();
      expect(result.estimatedTaxPlanning.projectedTaxOwed).toBeDefined();
    });

    it('should calculate quarterly payments', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.estimatedTaxPlanning.quarterlyPayments).toBeDefined();
      expect(result.estimatedTaxPlanning.quarterlyPayments.length).toBe(4);
      result.estimatedTaxPlanning.quarterlyPayments.forEach((payment) => {
        expect(payment.quarter).toBeDefined();
        expect(payment.dueDate).toBeDefined();
        expect(payment.amount).toBeDefined();
      });
    });

    it('should calculate safe harbor amount', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.estimatedTaxPlanning.safeHarborAmount).toBeDefined();
      expect(result.estimatedTaxPlanning.safeHarborAmount).toBeGreaterThan(0);
    });

    it('should generate estimated tax recommendations', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.estimatedTaxPlanning.recommendations).toBeDefined();
      expect(result.estimatedTaxPlanning.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('bracket optimization', () => {
    it('should include bracket optimization analysis', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.bracketOptimization).toBeDefined();
    });

    it('should identify current tax bracket', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.bracketOptimization.currentBracket).toBeDefined();
      expect(typeof result.bracketOptimization.currentBracket).toBe('string');
    });

    it('should calculate income to next bracket', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.bracketOptimization.bracketThreshold).toBeDefined();
      expect(result.bracketOptimization.incomeToNextBracket).toBeDefined();
    });

    it('should suggest bracket optimization strategies', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.bracketOptimization.optimizationStrategies).toBeDefined();
      expect(result.bracketOptimization.optimizationStrategies.length).toBeGreaterThan(0);
    });

    it('should recommend bracket-filling actions', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.bracketOptimization.recommendedActions).toBeDefined();
      expect(result.bracketOptimization.recommendedActions.length).toBeGreaterThan(0);
    });
  });

  describe('risk assessment', () => {
    it('should include risk assessment', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.riskAssessment).toBeDefined();
    });

    it('should calculate audit risk level', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.riskAssessment.auditRisk).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(result.riskAssessment.auditRisk);
    });

    it('should identify risk factors', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.riskAssessment.riskFactors).toBeDefined();
      expect(Array.isArray(result.riskAssessment.riskFactors)).toBe(true);
    });

    it('should flag high income as risk factor', () => {
      const input = createBasicInput({
        currentTaxSituation: {
          annualIncome: 500000,
          adjustedGrossIncome: 480000,
          taxableIncome: 450000,
          federalTaxOwed: 120000,
          stateTaxOwed: 40000,
          effectiveTaxRate: 0.32,
          marginalTaxRate: 0.35,
          totalTaxOwed: 160000,
        },
      });
      const result = TaxOptimizationPlanner.analyze(input);

      const highIncomeRisk = result.riskAssessment.riskFactors.find((rf) =>
        rf.factor.toLowerCase().includes('income')
      );
      expect(highIncomeRisk).toBeDefined();
    });

    it('should provide compliance recommendations', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.riskAssessment.complianceRecommendations).toBeDefined();
      expect(result.riskAssessment.complianceRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('marital status variations', () => {
    it('should handle married-filing-jointly', () => {
      const input = createBasicInput({
        personalInfo: {
          age: 40,
          maritalStatus: 'married-filing-jointly',
          dependents: 2,
          state: 'TX',
          filingStatus: 'married-joint',
        },
      });
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result).toBeDefined();
    });

    it('should handle married-filing-separately', () => {
      const input = createBasicInput({
        personalInfo: {
          age: 45,
          maritalStatus: 'married-filing-separately',
          dependents: 0,
          state: 'NY',
          filingStatus: 'married-separate',
        },
      });
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result).toBeDefined();
    });

    it('should handle head-of-household', () => {
      const input = createBasicInput({
        personalInfo: {
          age: 38,
          maritalStatus: 'head-of-household',
          dependents: 1,
          state: 'FL',
          filingStatus: 'head-of-household',
        },
      });
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle high-income taxpayer', () => {
      const input = createBasicInput({
        currentTaxSituation: {
          annualIncome: 1000000,
          adjustedGrossIncome: 950000,
          taxableIncome: 900000,
          federalTaxOwed: 280000,
          stateTaxOwed: 90000,
          effectiveTaxRate: 0.37,
          marginalTaxRate: 0.37,
          totalTaxOwed: 370000,
        },
      });
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result).toBeDefined();
    });

    it('should handle low-income taxpayer', () => {
      const input = createBasicInput({
        currentTaxSituation: {
          annualIncome: 40000,
          adjustedGrossIncome: 38000,
          taxableIncome: 25000,
          federalTaxOwed: 2800,
          stateTaxOwed: 1000,
          effectiveTaxRate: 0.095,
          marginalTaxRate: 0.12,
          totalTaxOwed: 3800,
        },
      });
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result).toBeDefined();
    });

    it('should handle taxpayer with no investments', () => {
      const input = createBasicInput({
        investmentHoldings: [],
      });
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result).toBeDefined();
      expect(result.taxLossHarvesting.availableLosses).toBe(0);
    });

    it('should handle retiree', () => {
      const input = createBasicInput({
        personalInfo: {
          age: 70,
          maritalStatus: 'qualifying-widow',
          dependents: 0,
          state: 'AZ',
          filingStatus: 'widow',
        },
        goals: {
          retirementAge: 65,
          expectedRetirementTaxRate: 0.12,
          charitableGivingGoal: 10000,
          taxLossHarvestingGoal: 3000,
          capitalGainsGoal: 0,
        },
      });
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result).toBeDefined();
    });

    it('should handle young taxpayer', () => {
      const input = createBasicInput({
        personalInfo: {
          age: 25,
          maritalStatus: 'single',
          dependents: 0,
          state: 'CA',
          filingStatus: 'single',
        },
      });
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result).toBeDefined();
      // Recommendation depends on current vs expected retirement tax rate
      expect(['traditional', 'roth', 'split']).toContain(
        result.rothTraditionalAnalysis.currentYearAnalysis.recommendedContribution
      );
    });

    it('should handle multiple loss positions', () => {
      const input = createBasicInput({
        investmentHoldings: [
          {
            symbol: 'LOSS1',
            name: 'Loss Stock 1',
            shares: 100,
            currentPrice: 50,
            costBasis: 7000,
            purchaseDate: '2022-01-01',
            accountType: 'taxable',
            holdingPeriod: 'long-term',
            unrealizedGainLoss: -2000,
          },
          {
            symbol: 'LOSS2',
            name: 'Loss Stock 2',
            shares: 200,
            currentPrice: 25,
            costBasis: 8000,
            purchaseDate: '2022-03-01',
            accountType: 'taxable',
            holdingPeriod: 'long-term',
            unrealizedGainLoss: -3000,
          },
          {
            symbol: 'LOSS3',
            name: 'Loss Stock 3',
            shares: 50,
            currentPrice: 40,
            costBasis: 3000,
            purchaseDate: '2022-06-01',
            accountType: 'taxable',
            holdingPeriod: 'long-term',
            unrealizedGainLoss: -1000,
          },
        ],
      });
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.taxLossHarvesting.availableLosses).toBe(6000);
      expect(result.taxLossHarvesting.recommendedHarvesting.length).toBeGreaterThan(0);
    });
  });

  describe('insights and recommendations', () => {
    it('should generate insights', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should include optimization score in insights', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      const scoreInsight = result.insights.find((i) => i.includes('optimization score'));
      expect(scoreInsight).toBeDefined();
    });

    it('should generate warnings when appropriate', () => {
      const input = createBasicInput({
        currentTaxSituation: {
          annualIncome: 500000,
          adjustedGrossIncome: 480000,
          taxableIncome: 450000,
          federalTaxOwed: 130000,
          stateTaxOwed: 45000,
          effectiveTaxRate: 0.35,
          marginalTaxRate: 0.37,
          totalTaxOwed: 175000,
        },
      });
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.warnings).toBeDefined();
    });

    it('should generate actionable recommendations', () => {
      const input = createBasicInput();
      const result = TaxOptimizationPlanner.analyze(input);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should include age-based recommendations for young taxpayers', () => {
      const input = createBasicInput({
        personalInfo: {
          age: 28,
          maritalStatus: 'single',
          dependents: 0,
          state: 'CA',
          filingStatus: 'single',
        },
      });
      const result = TaxOptimizationPlanner.analyze(input);

      const rothRec = result.recommendations.find((r) => r.toLowerCase().includes('roth'));
      expect(rothRec).toBeDefined();
    });
  });

  describe('additional branch coverage', () => {
    it('flags portfolio complexity and high charitable contributions as risk factors', () => {
      const base = createBasicInput();
      const extraHoldings = Array.from({ length: 23 }, (_, index) => ({
        symbol: `RISK${index}`,
        name: `Risk Asset ${index}`,
        shares: 10,
        currentPrice: 100 + index,
        costBasis: 80 + index,
        purchaseDate: '2023-01-01',
        accountType: 'taxable' as const,
        holdingPeriod: 'long-term' as const,
        unrealizedGainLoss: 200 + index,
      }));

      const input = createBasicInput({
        investmentHoldings: [...base.investmentHoldings, ...extraHoldings],
        deductionsCredits: {
          standardDeduction: base.deductionsCredits.standardDeduction,
          itemizedDeductions: {
            ...base.deductionsCredits.itemizedDeductions,
            charitableContributions: 60000,
          },
          taxCredits: base.deductionsCredits.taxCredits,
        },
        currentTaxSituation: {
          ...base.currentTaxSituation,
          annualIncome: 300000,
          adjustedGrossIncome: 290000,
          taxableIncome: 260000,
          federalTaxOwed: 80000,
          stateTaxOwed: 30000,
          effectiveTaxRate: 0.27,
          marginalTaxRate: 0.35,
          totalTaxOwed: 110000,
        },
      });

      const result = TaxOptimizationPlanner.analyze(input);
      const riskFactors = result.riskAssessment.riskFactors;

      expect(riskFactors.some((rf) => rf.factor.includes('Complex Investment Portfolio'))).toBe(
        true
      );
      expect(riskFactors.some((rf) => rf.factor.includes('High Charitable Contributions'))).toBe(
        true
      );
    });

    it('treats short-term gains and large long-term gains with appropriate timing', () => {
      const baseHoldings = createBasicInput().investmentHoldings;
      const input = createBasicInput({
        investmentHoldings: [
          ...baseHoldings,
          {
            symbol: 'SHORT',
            name: 'Short Term Gain',
            shares: 20,
            currentPrice: 120,
            costBasis: 1500,
            purchaseDate: '2024-03-01',
            accountType: 'taxable',
            holdingPeriod: 'short-term',
            unrealizedGainLoss: 5000,
          },
          {
            symbol: 'BIG',
            name: 'Large Long Term Gain',
            shares: 40,
            currentPrice: 400,
            costBasis: 2000,
            purchaseDate: '2020-01-01',
            accountType: 'taxable',
            holdingPeriod: 'long-term',
            unrealizedGainLoss: 20000,
          },
        ],
      });

      const result = TaxOptimizationPlanner.analyze(input);
      const shortTerm = result.capitalGainsOptimization.recommendedRealization.find(
        (rec) => rec.symbol === 'SHORT'
      );
      const longTerm = result.capitalGainsOptimization.recommendedRealization.find(
        (rec) => rec.symbol === 'BIG'
      );

      expect(shortTerm?.timing).toBe('defer');
      expect(shortTerm?.taxRate).toBe(input.currentTaxSituation.marginalTaxRate);
      expect(longTerm?.timing).toBe('offset');
      expect(longTerm?.taxRate).toBe(0.15);
    });

    it('recommends traditional contributions when current tax rate greatly exceeds retirement rate', () => {
      const base = createBasicInput();
      const input = createBasicInput({
        currentTaxSituation: {
          ...base.currentTaxSituation,
          marginalTaxRate: 0.37,
        },
        goals: {
          ...base.goals,
          expectedRetirementTaxRate: 0.2,
        },
      });

      const result = TaxOptimizationPlanner.analyze(input);
      expect(result.rothTraditionalAnalysis.currentYearAnalysis.recommendedContribution).toBe(
        'traditional'
      );
    });

    it('prefers split contributions for older taxpayers with similar tax rates', () => {
      const base = createBasicInput();
      const input = createBasicInput({
        personalInfo: {
          ...base.personalInfo,
          age: 55,
        },
        currentTaxSituation: {
          ...base.currentTaxSituation,
          marginalTaxRate: 0.24,
        },
        goals: {
          ...base.goals,
          expectedRetirementTaxRate: 0.22,
        },
      });

      const result = TaxOptimizationPlanner.analyze(input);
      expect(result.rothTraditionalAnalysis.currentYearAnalysis.recommendedContribution).toBe(
        'split'
      );
    });
  });

  describe('helper functions', () => {
    const helpers = TaxOptimizationPlanner as unknown as {
      recommendRealizationTiming: (
        holding: { holdingPeriod: string; unrealizedGainLoss: number },
        currentTaxSituation: TaxOptimizationInput['currentTaxSituation']
      ) => 'immediate' | 'defer' | 'offset';
    } & {
      generateEstimatedTaxRecommendations: (
        projectedTax: number,
        safeHarborAmount: number
      ) => string[];
      getCurrentTaxBracket: (taxableIncome: number, filingStatus: string) => string;
      calculateProjectedTax: (income: number, filingStatus: string) => number;
      calculateAuditRisk: (
        input: TaxOptimizationInput,
        riskFactors: TaxOptimizationResult['riskAssessment']['riskFactors']
      ) => 'low' | 'medium' | 'high';
      getContributionReasoning: (
        currentTaxRate: number,
        retirementTaxRate: number,
        age: number
      ) => string;
      generateInsights: (
        input: TaxOptimizationInput,
        taxSummary: TaxOptimizationResult['taxSummary'],
        riskAssessment: TaxOptimizationResult['riskAssessment']
      ) => string[];
      generateWarnings: (
        input: TaxOptimizationInput,
        taxSummary: TaxOptimizationResult['taxSummary'],
        riskAssessment: TaxOptimizationResult['riskAssessment']
      ) => string[];
      generateRecommendations: (
        input: TaxOptimizationInput,
        taxSummary: TaxOptimizationResult['taxSummary'],
        riskAssessment: TaxOptimizationResult['riskAssessment']
      ) => string[];
    };

    it('warns when projected tax exceeds safe harbor amount', () => {
      const recommendations = helpers.generateEstimatedTaxRecommendations(20000, 15000);
      expect(recommendations[0]).toContain('estimated tax payments');
    });

    it('maps married filing status across bracket thresholds', () => {
      expect(helpers.getCurrentTaxBracket(20000, 'married-joint')).toBe('10%');
      expect(helpers.getCurrentTaxBracket(50000, 'married-joint')).toBe('12%');
      expect(helpers.getCurrentTaxBracket(150000, 'married-joint')).toBe('22%');
      expect(helpers.getCurrentTaxBracket(300000, 'married-joint')).toBe('24%');
      expect(helpers.getCurrentTaxBracket(500000, 'married-joint')).toBe('32%+');
    });

    it('maps single filing status across bracket thresholds', () => {
      expect(helpers.getCurrentTaxBracket(10000, 'single')).toBe('10%');
      expect(helpers.getCurrentTaxBracket(30000, 'single')).toBe('12%');
      expect(helpers.getCurrentTaxBracket(80000, 'single')).toBe('22%');
      expect(helpers.getCurrentTaxBracket(150000, 'single')).toBe('24%');
      expect(helpers.getCurrentTaxBracket(300000, 'single')).toBe('32%+');
    });

    it('calculates projected tax across income brackets', () => {
      const marriedCases: Array<[number, number]> = [
        [25900 + 20000, 20000 * 0.1],
        [25900 + 50000, 2200 + (50000 - 22000) * 0.12],
        [25900 + 150000, 10294 + (150000 - 89450) * 0.22],
        [25900 + 250000, 30426 + (250000 - 190750) * 0.24],
      ];

      marriedCases.forEach(([income, expected]) => {
        expect(helpers.calculateProjectedTax(income, 'married-joint')).toBeCloseTo(expected, 5);
      });

      const singleCases: Array<[number, number]> = [
        [12950 + 8000, 8000 * 0.1],
        [12950 + 30000, 1100 + (30000 - 11000) * 0.12],
        [12950 + 70000, 5147 + (70000 - 44725) * 0.22],
        [12950 + 150000, 16290 + (150000 - 95375) * 0.24],
      ];

      singleCases.forEach(([income, expected]) => {
        expect(helpers.calculateProjectedTax(income, 'single')).toBeCloseTo(expected, 5);
      });
    });

    it('calculates audit risk tiers', () => {
      const input = createBasicInput();
      const highRisk = helpers.calculateAuditRisk(input, [
        {
          factor: 'Aggressive deductions',
          riskLevel: 'high',
          mitigation: 'Document carefully',
        },
      ]);
      expect(highRisk).toBe('high');

      const mediumRisk = helpers.calculateAuditRisk(input, [
        {
          factor: 'Complex K-1',
          riskLevel: 'medium',
          mitigation: 'Document carefully',
        },
        {
          factor: 'Crypto trades',
          riskLevel: 'medium',
          mitigation: 'Maintain logs',
        },
      ]);
      expect(mediumRisk).toBe('medium');
    });

    it('explains contribution reasoning for rate differences and age', () => {
      expect(helpers.getContributionReasoning(0.35, 0.2, 50)).toContain('higher');
      expect(helpers.getContributionReasoning(0.15, 0.3, 50)).toContain('lower');
      expect(helpers.getContributionReasoning(0.22, 0.22, 30)).toContain('Young age');
    });

    it('adapts insights to audit risk level', () => {
      const input = createBasicInput();
      const taxSummary: TaxOptimizationResult['taxSummary'] = {
        currentYearTaxSavings: 2000,
        projectedLongTermSavings: 10000,
        optimizationScore: 65,
        priorityRecommendations: [],
      };

      const mediumInsights = helpers.generateInsights(input, taxSummary, {
        auditRisk: 'medium',
        riskFactors: [],
        complianceRecommendations: [],
      });
      expect(mediumInsights.some((msg) => msg.includes('moderate'))).toBe(true);

      const highInsights = helpers.generateInsights(input, taxSummary, {
        auditRisk: 'high',
        riskFactors: [],
        complianceRecommendations: [],
      });
      expect(highInsights.some((msg) => msg.includes('professional tax planning'))).toBe(true);
    });

    it('emits warnings for high audit risk and marginal tax rates', () => {
      const base = createBasicInput();
      const input = createBasicInput({
        currentTaxSituation: {
          ...base.currentTaxSituation,
          marginalTaxRate: 0.35,
        },
      });
      const taxSummary: TaxOptimizationResult['taxSummary'] = {
        currentYearTaxSavings: 1000,
        projectedLongTermSavings: 5000,
        optimizationScore: 40,
        priorityRecommendations: [],
      };
      const warnings = helpers.generateWarnings(input, taxSummary, {
        auditRisk: 'high',
        riskFactors: [],
        complianceRecommendations: [],
      });

      expect(warnings.some((msg) => msg.includes('High audit risk detected'))).toBe(true);
      expect(warnings.some((msg) => msg.includes('High marginal tax rate'))).toBe(true);
    });

    it('adds recommendations for high audit risk situations', () => {
      const base = createBasicInput();
      const input = createBasicInput({
        personalInfo: {
          ...base.personalInfo,
          age: 55,
        },
        currentTaxSituation: {
          ...base.currentTaxSituation,
          annualIncome: 200000,
        },
      });
      const taxSummary: TaxOptimizationResult['taxSummary'] = {
        currentYearTaxSavings: 3000,
        projectedLongTermSavings: 15000,
        optimizationScore: 70,
        priorityRecommendations: [
          {
            action: 'Tax-Loss Harvesting',
            priority: 'high',
            taxSavings: 1500,
            implementation: 'Harvest losses this quarter',
          },
        ],
      };
      const recommendations = helpers.generateRecommendations(input, taxSummary, {
        auditRisk: 'high',
        riskFactors: [],
        complianceRecommendations: [],
      });

      expect(recommendations.some((msg) => msg.includes('Implement Tax-Loss Harvesting'))).toBe(
        true
      );
      expect(
        recommendations.some((msg) => msg.includes('professional tax planning services'))
      ).toBe(true);
    });
  });
});
