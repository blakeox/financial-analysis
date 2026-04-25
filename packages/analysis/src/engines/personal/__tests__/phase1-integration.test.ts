/**
 * Maintained phase 1 integration coverage for the personal engines that have
 * real contracts in this lane today.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { InsuranceNeedsCalculator, InsuranceNeedsInputSchema } from '../insurance-needs';
import { TaxOptimizationPlanner } from '../tax-optimization';

describe('Phase 1 Personal Finance Models Integration', () => {
  describe('Insurance Needs Calculator', () => {
    let validInput: any;

    beforeEach(() => {
      validInput = {
        personalInfo: {
          age: 35,
          maritalStatus: 'married',
          dependents: 2,
          employmentStatus: 'employed',
          healthStatus: 'good',
          occupation: 'software engineer',
          annualIncome: 120000,
          monthlyExpenses: 8000,
        },
        currentInsurance: {
          lifeInsurance: {
            termLife: {
              coverage: 500000,
              termYears: 20,
              monthlyPremium: 50,
              beneficiary: 'spouse',
            },
            wholeLife: {
              coverage: 100000,
              cashValue: 20000,
              monthlyPremium: 200,
              beneficiary: 'spouse',
            },
          },
          disabilityInsurance: {
            shortTerm: { coverage: 5000, waitingPeriod: 0, benefitPeriod: 6, monthlyPremium: 30 },
            longTerm: { coverage: 6000, waitingPeriod: 90, benefitPeriod: 20, monthlyPremium: 80 },
          },
          longTermCare: {
            coverage: 200000,
            dailyBenefit: 200,
            benefitPeriod: 3,
            eliminationPeriod: 90,
            monthlyPremium: 150,
          },
          healthInsurance: {
            coverage: 'employer',
            monthlyPremium: 400,
            deductible: 2000,
            outOfPocketMax: 6000,
          },
        },
        financialSituation: {
          totalAssets: 500000,
          totalDebts: 200000,
          emergencyFund: 25000,
          retirementSavings: 200000,
          otherIncome: 5000,
          socialSecurityBenefit: 2000,
        },
        goals: {
          incomeReplacementRatio: 0.7,
          debtPayoffGoal: true,
          educationFunding: 100000,
          retirementGoal: 2000000,
          legacyGoal: 500000,
        },
        analysis: {
          includeLifeInsurance: true,
          includeDisabilityInsurance: true,
          includeLongTermCare: true,
          includeHealthInsurance: false,
          inflationRate: 0.03,
          discountRate: 0.05,
          lifeExpectancy: 85,
        },
      };
    });

    it('should validate input schema correctly', () => {
      expect(() => InsuranceNeedsInputSchema.parse(validInput)).not.toThrow();
    });

    it('should calculate life insurance needs', () => {
      const result = InsuranceNeedsCalculator.analyze(validInput);

      expect(result.lifeInsuranceAnalysis).toBeDefined();
      expect(result.lifeInsuranceAnalysis.totalRecommendedCoverage).toBeGreaterThan(0);
      expect(result.lifeInsuranceAnalysis.coverageAdequacy).toMatch(
        /adequate|underinsured|overinsured/
      );
      expect(result.lifeInsuranceAnalysis.estimatedMonthlyPremium).toBeGreaterThan(0);
    });

    it('should calculate disability insurance needs', () => {
      const result = InsuranceNeedsCalculator.analyze(validInput);

      expect(result.disabilityInsuranceAnalysis).toBeDefined();
      expect(result.disabilityInsuranceAnalysis.recommendedCoverage).toBeGreaterThan(0);
      expect(result.disabilityInsuranceAnalysis.estimatedMonthlyPremium).toBeGreaterThan(0);
    });

    it('should calculate long-term care needs', () => {
      const result = InsuranceNeedsCalculator.analyze(validInput);

      expect(result.longTermCareAnalysis).toBeDefined();
      expect(result.longTermCareAnalysis.recommendedCoverage.totalCoverage).toBeGreaterThan(0);
      expect(result.longTermCareAnalysis.estimatedMonthlyPremium).toBeGreaterThan(0);
    });

    it('should perform risk assessment', () => {
      const result = InsuranceNeedsCalculator.analyze(validInput);

      expect(result.riskAssessment).toBeDefined();
      expect(result.riskAssessment.overallRiskLevel).toMatch(/low|medium|high/);
      expect(result.riskAssessment.riskFactors).toBeInstanceOf(Array);
    });

    it('should generate insights and recommendations', () => {
      const result = InsuranceNeedsCalculator.analyze(validInput);

      expect(result.insights).toBeInstanceOf(Array);
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Model Integration', () => {
    it('should integrate with Financial Journey Analysis', () => {
      // Test that all Phase 1 models can be integrated into the financial journey
      const insuranceInput = {
        personalInfo: {
          age: 35,
          maritalStatus: 'married',
          dependents: 2,
          employmentStatus: 'employed',
          healthStatus: 'good',
          occupation: 'engineer',
          annualIncome: 120000,
          monthlyExpenses: 8000,
        },
        currentInsurance: {
          lifeInsurance: {
            termLife: { coverage: 0, termYears: 0, monthlyPremium: 0 },
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
          healthInsurance: { coverage: '', monthlyPremium: 0, deductible: 0, outOfPocketMax: 0 },
        },
        financialSituation: {
          totalAssets: 500000,
          totalDebts: 200000,
          emergencyFund: 25000,
          retirementSavings: 200000,
          otherIncome: 5000,
          socialSecurityBenefit: 2000,
        },
        goals: {
          incomeReplacementRatio: 0.7,
          debtPayoffGoal: true,
          educationFunding: 100000,
          retirementGoal: 2000000,
          legacyGoal: 500000,
        },
        analysis: {
          includeLifeInsurance: true,
          includeDisabilityInsurance: true,
          includeLongTermCare: true,
          includeHealthInsurance: false,
          inflationRate: 0.03,
          discountRate: 0.05,
          lifeExpectancy: 85,
        },
      };

      const insuranceResult = InsuranceNeedsCalculator.analyze(insuranceInput);

      // Verify that insurance analysis provides actionable insights for financial journey
      expect(insuranceResult.insights).toBeInstanceOf(Array);
      expect(insuranceResult.recommendations).toBeInstanceOf(Array);
      expect(insuranceResult.insuranceSummary.priorityRecommendations).toBeInstanceOf(Array);
    });

    it('should handle edge cases gracefully', () => {
      // Test with minimal valid inputs
      const minimalInsuranceInput = {
        personalInfo: {
          age: 25,
          maritalStatus: 'single',
          dependents: 0,
          employmentStatus: 'employed',
          healthStatus: 'excellent',
          occupation: 'engineer',
          annualIncome: 50000,
          monthlyExpenses: 3000,
        },
        currentInsurance: {
          lifeInsurance: {
            termLife: { coverage: 0, termYears: 0, monthlyPremium: 0 },
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
          healthInsurance: { coverage: '', monthlyPremium: 0, deductible: 0, outOfPocketMax: 0 },
        },
        financialSituation: {
          totalAssets: 100000,
          totalDebts: 20000,
          emergencyFund: 5000,
          retirementSavings: 10000,
          otherIncome: 0,
          socialSecurityBenefit: 0,
        },
        goals: {
          incomeReplacementRatio: 0.6,
          debtPayoffGoal: true,
          educationFunding: 0,
          retirementGoal: 1000000,
          legacyGoal: 0,
        },
        analysis: {
          includeLifeInsurance: true,
          includeDisabilityInsurance: true,
          includeLongTermCare: true,
          includeHealthInsurance: false,
          inflationRate: 0.03,
          discountRate: 0.05,
          lifeExpectancy: 85,
        },
      };

      expect(() => InsuranceNeedsCalculator.analyze(minimalInsuranceInput)).not.toThrow();

      const result = InsuranceNeedsCalculator.analyze(minimalInsuranceInput);
      expect(result).toBeDefined();
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Performance and Scalability', () => {
    it('should complete analysis within reasonable time', () => {
      const startTime = Date.now();

      const insuranceInput = {
        personalInfo: {
          age: 35,
          maritalStatus: 'married',
          dependents: 2,
          employmentStatus: 'employed',
          healthStatus: 'good',
          occupation: 'engineer',
          annualIncome: 120000,
          monthlyExpenses: 8000,
        },
        currentInsurance: {
          lifeInsurance: {
            termLife: { coverage: 0, termYears: 0, monthlyPremium: 0 },
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
          healthInsurance: { coverage: '', monthlyPremium: 0, deductible: 0, outOfPocketMax: 0 },
        },
        financialSituation: {
          totalAssets: 500000,
          totalDebts: 200000,
          emergencyFund: 25000,
          retirementSavings: 200000,
          otherIncome: 5000,
          socialSecurityBenefit: 2000,
        },
        goals: {
          incomeReplacementRatio: 0.7,
          debtPayoffGoal: true,
          educationFunding: 100000,
          retirementGoal: 2000000,
          legacyGoal: 500000,
        },
        analysis: {
          includeLifeInsurance: true,
          includeDisabilityInsurance: true,
          includeLongTermCare: true,
          includeHealthInsurance: false,
          inflationRate: 0.03,
          discountRate: 0.05,
          lifeExpectancy: 85,
        },
      };

      InsuranceNeedsCalculator.analyze(insuranceInput);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within 1 second
      expect(executionTime).toBeLessThan(1000);
    });

    it('should handle large datasets efficiently', () => {
      // Test with large investment portfolio
      const largeTaxInput = {
        personalInfo: {
          age: 35,
          maritalStatus: 'married-filing-jointly',
          dependents: 2,
          state: 'CA',
          filingStatus: 'married-joint',
        },
        currentTaxSituation: {
          annualIncome: 120000,
          adjustedGrossIncome: 110000,
          taxableIncome: 85000,
          federalTaxOwed: 12000,
          stateTaxOwed: 8000,
          effectiveTaxRate: 0.167,
          marginalTaxRate: 0.22,
          totalTaxOwed: 20000,
        },
        investmentHoldings: Array.from({ length: 100 }, (_, i) => {
          const shares = 100 + i * 5;
          const currentPrice = 50 + i * 1.25;
          const costBasis = i % 2 === 0 ? currentPrice - 12 : currentPrice + 8;

          return {
            symbol: `STOCK${i}`,
            name: `Stock ${i}`,
            shares,
            currentPrice,
            costBasis,
            purchaseDate: '2022-01-01',
            accountType: 'taxable',
            holdingPeriod: i % 2 === 0 ? 'long-term' : 'short-term',
            unrealizedGainLoss: (currentPrice - costBasis) * shares,
          };
        }),
        retirementAccounts: {
          traditional401k: { balance: 200000, annualContribution: 20000, employerMatch: 5000 },
          roth401k: { balance: 50000, annualContribution: 10000 },
          traditionalIRA: {
            balance: 30000,
            annualContribution: 6000,
            deductibleContribution: 6000,
          },
          rothIRA: { balance: 40000, annualContribution: 6000 },
          hsa: { balance: 15000, annualContribution: 4000, employerContribution: 1000 },
        },
        deductionsCredits: {
          standardDeduction: 25900,
          itemizedDeductions: {
            mortgageInterest: 12000,
            propertyTaxes: 8000,
            stateIncomeTax: 8000,
            charitableContributions: 5000,
            medicalExpenses: 2000,
            otherDeductions: 1000,
          },
          taxCredits: {
            childTaxCredit: 4000,
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
          capitalGainsGoal: 10000,
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

      const startTime = Date.now();
      TaxOptimizationPlanner.analyze(largeTaxInput);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(2000); // Should handle 100 holdings within 2 seconds
    });
  });
});
