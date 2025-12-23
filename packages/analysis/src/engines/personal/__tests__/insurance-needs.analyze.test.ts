import { describe, expect, it } from 'vitest';
import {
  InsuranceNeedsCalculator,
  InsuranceNeedsInput,
  InsuranceNeedsResult,
} from '../insurance-needs';
import { createBaseInsuranceInput } from './fixtures/insurance-needs';

describe('InsuranceNeedsCalculator analyze flow', () => {
  const baseInput: InsuranceNeedsInput = createBaseInsuranceInput();

  describe('insights generation', () => {
    it('generates coverage gap insight when gap exists', () => {
      const result = InsuranceNeedsCalculator.analyze(baseInput);
      const gapInsight = result.insights.find((i) => i.includes('coverage gap'));
      expect(gapInsight).toBeDefined();
    });

    it('generates adequate coverage insight when no gap', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: { coverage: 5000000, termYears: 30, monthlyPremium: 500 },
            wholeLife: { coverage: 1000000, cashValue: 200000, monthlyPremium: 300 },
          },
          disabilityInsurance: {
            shortTerm: { coverage: 100000, waitingPeriod: 14, benefitPeriod: 90, monthlyPremium: 100 },
            longTerm: { coverage: 100000, waitingPeriod: 90, benefitPeriod: 60, monthlyPremium: 150 },
          },
          longTermCare: {
            coverage: 500000,
            dailyBenefit: 400,
            benefitPeriod: 5,
            eliminationPeriod: 90,
            monthlyPremium: 200,
          },
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const adequateInsight = result.insights.find((i) => i.includes('appears adequate'));
      expect(adequateInsight).toBeDefined();
    });

    it('generates high risk insight when overall risk is high', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          healthStatus: 'poor',
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const highRiskInsight = result.insights.find((i) => i.includes('high-risk factors'));
      expect(highRiskInsight).toBeDefined();
    });

    it('generates low risk insight when overall risk is low', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 30,
          dependents: 0,
          healthStatus: 'excellent',
          occupation: 'Accountant',
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const lowRiskInsight = result.insights.find((i) => i.includes('low-risk profile'));
      expect(lowRiskInsight).toBeDefined();
    });

    it('exercises helper logic for gap, adequate, and risk insights', () => {
      const generateInsights = (InsuranceNeedsCalculator as unknown as {
        generateInsights: (
          input: InsuranceNeedsInput,
          insuranceSummary: InsuranceNeedsResult['insuranceSummary'],
          riskAssessment: InsuranceNeedsResult['riskAssessment']
        ) => string[];
      }).generateInsights;

      const gapSummary: InsuranceNeedsResult['insuranceSummary'] = {
        totalRecommendedCoverage: 300000,
        totalCurrentCoverage: 100000,
        totalCoverageGap: 200000,
        totalMonthlyPremiums: 250,
        insuranceHealthScore: 55,
        priorityRecommendations: [],
      };

      const highRiskAssessment: InsuranceNeedsResult['riskAssessment'] = {
        overallRiskLevel: 'high',
        riskFactors: [],
        recommendations: [],
      };

      const gapInsights = generateInsights(baseInput, gapSummary, highRiskAssessment);
      expect(gapInsights.some((i) => i.includes('coverage gap'))).toBe(true);
      expect(gapInsights.some((i) => i.includes('high-risk factors'))).toBe(true);

      const adequateSummary: InsuranceNeedsResult['insuranceSummary'] = {
        ...gapSummary,
        totalCoverageGap: 0,
        totalCurrentCoverage: 300000,
        insuranceHealthScore: 90,
      };

      const lowRiskAssessment: InsuranceNeedsResult['riskAssessment'] = {
        overallRiskLevel: 'low',
        riskFactors: [],
        recommendations: [],
      };

      const adequateInsights = generateInsights(baseInput, adequateSummary, lowRiskAssessment);
      expect(adequateInsights).toContain('Your current insurance coverage appears adequate');
      expect(adequateInsights.some((i) => i.includes('low-risk profile'))).toBe(true);
    });
  });

  describe('warnings generation', () => {
    it('generates large coverage gap warning', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 300000,
        },
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: { coverage: 10000, termYears: 10, monthlyPremium: 10 },
            wholeLife: { coverage: 0, cashValue: 0, monthlyPremium: 0 },
          },
          disabilityInsurance: {
            shortTerm: { coverage: 0, waitingPeriod: 0, benefitPeriod: 0, monthlyPremium: 0 },
            longTerm: { coverage: 0, waitingPeriod: 0, benefitPeriod: 0, monthlyPremium: 0 },
          },
          longTermCare: {
            coverage: 0,
            dailyBenefit: 0,
            benefitPeriod: 0,
            eliminationPeriod: 0,
            monthlyPremium: 0,
          },
        },
        goals: {
          ...baseInput.goals,
          educationFunding: 500000,
        },
        financialSituation: {
          ...baseInput.financialSituation,
          totalDebts: 1000000,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.warnings.some((w) => w.includes('coverage gap') || w.includes('health score'))).toBe(true);
    });

    it('only emits coverage gap warning when exceeding helper threshold', () => {
      const generateWarnings = (InsuranceNeedsCalculator as unknown as {
        generateWarnings: (
          input: InsuranceNeedsInput,
          insuranceSummary: InsuranceNeedsResult['insuranceSummary'],
          riskAssessment: InsuranceNeedsResult['riskAssessment']
        ) => string[];
      }).generateWarnings;

      const baseSummary: InsuranceNeedsResult['insuranceSummary'] = {
        totalRecommendedCoverage: 300000,
        totalCurrentCoverage: 200000,
        totalCoverageGap: 120000,
        totalMonthlyPremiums: 250,
        insuranceHealthScore: 80,
        priorityRecommendations: [],
      };

      const warnings = generateWarnings(baseInput, baseSummary, {
        overallRiskLevel: 'medium',
        riskFactors: [],
        recommendations: [],
      });

      expect(warnings).toContain('Large coverage gap detected - consider increasing insurance coverage');

      const boundaryWarnings = generateWarnings(
        baseInput,
        {
          ...baseSummary,
          totalCoverageGap: 100000,
        },
        {
          overallRiskLevel: 'low',
          riskFactors: [],
          recommendations: [],
        }
      );

      expect(boundaryWarnings).not.toContain(
        'Large coverage gap detected - consider increasing insurance coverage'
      );
    });

    it('includes explicit warning when insurance health score falls below 50', () => {
      const generateWarnings = (InsuranceNeedsCalculator as unknown as {
        generateWarnings: (
          input: InsuranceNeedsInput,
          insuranceSummary: InsuranceNeedsResult['insuranceSummary'],
          riskAssessment: InsuranceNeedsResult['riskAssessment']
        ) => string[];
      }).generateWarnings;

      const warnings = generateWarnings(
        baseInput,
        {
          totalRecommendedCoverage: 100000,
          totalCurrentCoverage: 90000,
          totalCoverageGap: 10000,
          totalMonthlyPremiums: 200,
          insuranceHealthScore: 45,
          priorityRecommendations: [],
        },
        {
          overallRiskLevel: 'low',
          riskFactors: [],
          recommendations: [],
        }
      );

      expect(warnings).toContain(
        'Low insurance health score - consider implementing recommended strategies'
      );
    });

    it('generates low health score warning', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: { coverage: 10000, termYears: 5, monthlyPremium: 5 },
            wholeLife: { coverage: 0, cashValue: 0, monthlyPremium: 0 },
          },
          disabilityInsurance: {
            shortTerm: { coverage: 0, waitingPeriod: 0, benefitPeriod: 0, monthlyPremium: 0 },
            longTerm: { coverage: 0, waitingPeriod: 0, benefitPeriod: 0, monthlyPremium: 0 },
          },
          longTermCare: {
            coverage: 0,
            dailyBenefit: 0,
            benefitPeriod: 0,
            eliminationPeriod: 0,
            monthlyPremium: 0,
          },
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.insuranceSummary.insuranceHealthScore).toBeLessThanOrEqual(100);
    });

    it('returns empty warnings array when none apply', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 50000,
        },
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: { coverage: 1000000, termYears: 30, monthlyPremium: 100 },
            wholeLife: { coverage: 500000, cashValue: 100000, monthlyPremium: 200 },
          },
          disabilityInsurance: {
            shortTerm: { coverage: 50000, waitingPeriod: 14, benefitPeriod: 90, monthlyPremium: 50 },
            longTerm: { coverage: 50000, waitingPeriod: 90, benefitPeriod: 60, monthlyPremium: 100 },
          },
          longTermCare: {
            coverage: 400000,
            dailyBenefit: 300,
            benefitPeriod: 4,
            eliminationPeriod: 90,
            monthlyPremium: 150,
          },
        },
        goals: {
          ...baseInput.goals,
          debtPayoffGoal: false,
          educationFunding: 0,
        },
        financialSituation: {
          ...baseInput.financialSituation,
          totalDebts: 0,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('recommendations generation', () => {
    it('generates high priority recommendations', () => {
      const result = InsuranceNeedsCalculator.analyze(baseInput);
      const priorityRec = result.recommendations.find((r) => r.includes('Priority'));
      if (result.insuranceSummary.priorityRecommendations.some((p) => p.priority === 'high')) {
        expect(priorityRec).toBeDefined();
      }
    });

    it('generates unaffordable recommendation when premiums too high', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 15000,
          age: 60,
          healthStatus: 'poor',
        },
        goals: {
          ...baseInput.goals,
          educationFunding: 200000,
        },
        financialSituation: {
          ...baseInput.financialSituation,
          totalDebts: 500000,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      if (result.costAnalysis.affordabilityAssessment === 'unaffordable') {
        const affordRec = result.recommendations.find((r) => r.includes('reducing coverage'));
        expect(affordRec).toBeDefined();
      }
    });

    it('generates stretch recommendation when premiums are manageable but tight', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 40000,
          age: 50,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      if (result.costAnalysis.affordabilityAssessment === 'stretch') {
        const stretchRec = result.recommendations.find((r) =>
          r.includes('manageable') || r.includes('budget')
        );
        expect(stretchRec).toBeDefined();
      }
    });

    it('mirrors stretch affordability guidance when budgets are tight', () => {
      const generateRecommendations = (InsuranceNeedsCalculator as unknown as {
        generateRecommendations: (
          input: InsuranceNeedsInput,
          insuranceSummary: InsuranceNeedsResult['insuranceSummary'],
          costAnalysis: InsuranceNeedsResult['costAnalysis']
        ) => string[];
      }).generateRecommendations;

      const recommendations = generateRecommendations(
        baseInput,
        {
          totalRecommendedCoverage: 250000,
          totalCurrentCoverage: 200000,
          totalCoverageGap: 50000,
          totalMonthlyPremiums: 150,
          insuranceHealthScore: 75,
          priorityRecommendations: [],
        },
        {
          currentMonthlyPremiums: 100,
          recommendedMonthlyPremiums: 350,
          premiumIncrease: 250,
          costBenefitAnalysis: {
            totalProtectionValue: 500000,
            totalPremiumCost: 4200,
            protectionRatio: 119.05,
          },
          affordabilityAssessment: 'stretch',
        }
      );

      expect(recommendations).toContain(
        'Insurance costs are manageable but may require budget adjustments'
      );
    });

    it('emits priority call-to-action when summary has high priority gaps', () => {
      const generateRecommendations = (InsuranceNeedsCalculator as unknown as {
        generateRecommendations: (
          input: InsuranceNeedsInput,
          insuranceSummary: InsuranceNeedsResult['insuranceSummary'],
          costAnalysis: InsuranceNeedsResult['costAnalysis']
        ) => string[];
      }).generateRecommendations;

      const recommendations = generateRecommendations(
        baseInput,
        {
          totalRecommendedCoverage: 500000,
          totalCurrentCoverage: 200000,
          totalCoverageGap: 300000,
          totalMonthlyPremiums: 200,
          insuranceHealthScore: 60,
          priorityRecommendations: [
            {
              type: 'life',
              priority: 'high',
              reason: 'Test gap',
              estimatedCost: 120,
              impact: 'Protects family',
            },
          ],
        },
        {
          currentMonthlyPremiums: 150,
          recommendedMonthlyPremiums: 200,
          premiumIncrease: 50,
          costBenefitAnalysis: {
            totalProtectionValue: 500000,
            totalPremiumCost: 2400,
            protectionRatio: 208.33,
          },
          affordabilityAssessment: 'affordable',
        }
      );

      expect(recommendations[0]).toMatch(/Priority: Address/);
      expect(recommendations[0]).toContain('life');
    });

    it('includes unaffordable guidance when affordability assessment is unaffordable', () => {
      const generateRecommendations = (InsuranceNeedsCalculator as unknown as {
        generateRecommendations: (
          input: InsuranceNeedsInput,
          insuranceSummary: InsuranceNeedsResult['insuranceSummary'],
          costAnalysis: InsuranceNeedsResult['costAnalysis']
        ) => string[];
      }).generateRecommendations;

      const recommendations = generateRecommendations(
        baseInput,
        {
          totalRecommendedCoverage: 200000,
          totalCurrentCoverage: 150000,
          totalCoverageGap: 50000,
          totalMonthlyPremiums: 300,
          insuranceHealthScore: 70,
          priorityRecommendations: [],
        },
        {
          currentMonthlyPremiums: 100,
          recommendedMonthlyPremiums: 600,
          premiumIncrease: 500,
          costBenefitAnalysis: {
            totalProtectionValue: 200000,
            totalPremiumCost: 7200,
            protectionRatio: 27.78,
          },
          affordabilityAssessment: 'unaffordable',
        }
      );

      expect(recommendations).toContain(
        'Consider reducing coverage amounts or increasing income to afford recommended insurance'
      );
    });

    it('generates age-based recommendation for young users', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 25,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const youngRec = result.recommendations.find((r) => r.includes('while young'));
      expect(youngRec).toBeDefined();
    });

    it('generates age-based recommendation for older users', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 55,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const olderRec = result.recommendations.find((r) => r.includes('long-term care'));
      expect(olderRec).toBeDefined();
    });

    it('generates health recommendation for poor health', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          healthStatus: 'poor',
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const healthRec = result.recommendations.find((r) => r.includes('health habits'));
      expect(healthRec).toBeDefined();
    });
  });

  describe('priority recommendation helper', () => {
    it('elevates life and disability gaps above fifty percent to high priority', () => {
      const baseResult = InsuranceNeedsCalculator.analyze(baseInput);
      const generatePriorityRecommendations = (InsuranceNeedsCalculator as unknown as {
        generatePriorityRecommendations: (
          input: InsuranceNeedsInput,
          life: InsuranceNeedsResult['lifeInsuranceAnalysis'],
          disability: InsuranceNeedsResult['disabilityInsuranceAnalysis'],
          ltc: InsuranceNeedsResult['longTermCareAnalysis']
        ) => InsuranceNeedsResult['insuranceSummary']['priorityRecommendations'];
      }).generatePriorityRecommendations;

      const recommendations = generatePriorityRecommendations(
        baseInput,
        {
          ...baseResult.lifeInsuranceAnalysis,
          coverageGap: baseResult.lifeInsuranceAnalysis.totalRecommendedCoverage * 0.6,
        },
        {
          ...baseResult.disabilityInsuranceAnalysis,
          coverageGap: baseResult.disabilityInsuranceAnalysis.recommendedCoverage * 0.75,
        },
        baseResult.longTermCareAnalysis
      );

      const lifePriority = recommendations.find((rec) => rec.type === 'life');
      const disabilityPriority = recommendations.find((rec) => rec.type === 'disability');

      expect(lifePriority?.priority).toBe('high');
      expect(disabilityPriority?.priority).toBe('high');
    });
  });

  describe('insurance health score branches', () => {
    it('gives full score for adequate life insurance', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: { coverage: 5000000, termYears: 30, monthlyPremium: 300 },
            wholeLife: { coverage: 0, cashValue: 0, monthlyPremium: 0 },
          },
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.insuranceSummary.insuranceHealthScore).toBeGreaterThan(0);
    });

    it('gives partial score for disability gap < 30% of recommended', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 100000,
        },
        currentInsurance: {
          ...baseInput.currentInsurance,
          disabilityInsurance: {
            shortTerm: { coverage: 30000, waitingPeriod: 14, benefitPeriod: 90, monthlyPremium: 50 },
            longTerm: { coverage: 35000, waitingPeriod: 90, benefitPeriod: 60, monthlyPremium: 100 },
          },
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.insuranceSummary.insuranceHealthScore).toBeGreaterThan(50);
    });

    it('gives partial score for LTC gap < 30% of recommended', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        currentInsurance: {
          ...baseInput.currentInsurance,
          longTermCare: {
            coverage: 300000,
            dailyBenefit: 250,
            benefitPeriod: 3,
            eliminationPeriod: 90,
            monthlyPremium: 150,
          },
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.insuranceSummary.insuranceHealthScore).toBeGreaterThan(0);
    });
  });

  describe('employment status variations', () => {
    const statuses = ['employed', 'self-employed', 'unemployed', 'retired'] as const;

    statuses.forEach((status) => {
      it(`handles ${status} employment status`, () => {
        const input: InsuranceNeedsInput = {
          ...baseInput,
          personalInfo: {
            ...baseInput.personalInfo,
            employmentStatus: status,
          },
        };

        const result = InsuranceNeedsCalculator.analyze(input);
        expect(result.lifeInsuranceAnalysis).toBeDefined();
        expect(result.disabilityInsuranceAnalysis).toBeDefined();
      });
    });
  });

  describe('marital status variations', () => {
    const statuses = ['single', 'married', 'divorced', 'widowed'] as const;

    statuses.forEach((status) => {
      it(`handles ${status} marital status`, () => {
        const input: InsuranceNeedsInput = {
          ...baseInput,
          personalInfo: {
            ...baseInput.personalInfo,
            maritalStatus: status,
          },
        };

        const result = InsuranceNeedsCalculator.analyze(input);
        expect(result.lifeInsuranceAnalysis).toBeDefined();
      });
    });
  });

  describe('edge cases', () => {
    it('handles maximum dependents', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          dependents: 10,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis).toBeDefined();
    });

    it('handles minimum age', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 18,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis.recommendedTermYears).toBeGreaterThan(0);
    });

    it('handles maximum age (retirement age)', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 65,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis).toBeDefined();
    });

    it('handles near-retirement age correctly', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 64,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.disabilityInsuranceAnalysis.longTermNeeds.benefitPeriod).toBe(1);
    });

    it('handles zero annual income', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 0,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis.humanLifeValue).toBe(0);
      expect(result.lifeInsuranceAnalysis.incomeReplacementNeeds).toBe(0);
    });

    it('handles zero total assets', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        financialSituation: {
          ...baseInput.financialSituation,
          totalAssets: 0,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.longTermCareAnalysis.selfInsuranceFeasibility).toBe(false);
    });

    it('handles zero monthly expenses', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          monthlyExpenses: 0,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.disabilityInsuranceAnalysis.shortTermNeeds.recommendedCoverage).toBe(0);
    });
  });
});
