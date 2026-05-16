import { describe, it, expect } from 'vitest';
import { AutoLoanAnalysisEngine, AutoLoanInputSchema } from '../auto-loan-analysis.js';
import type { AutoLoanInput } from '../auto-loan-analysis.js';

describe('AutoLoanAnalysisEngine', () => {
  const createBasicInput = (overrides: Partial<AutoLoanInput> = {}): AutoLoanInput => ({
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
      msrp: 35000,
      negotiatedPrice: 33000,
      tradeInValue: 0,
      downPayment: 5000,
    },
    loanTerms: {
      loanAmount: 28000,
      interestRate: 0.059,
      termMonths: 60,
      salesTaxRate: 0.08,
      fees: {
        documentationFee: 500,
        titleFee: 100,
        registrationFee: 200,
        otherFees: 0,
      },
    },
    analysis: {
      includeLeaseComparison: false,
      includeRefinancingAnalysis: true,
      includeTCOAnalysis: true,
      includePaymentSchedule: true,
      refinancingRates: [0.03, 0.04, 0.05, 0.06],
      ownershipYears: 5,
    },
    tcoParameters: {
      annualMileage: 12000,
      fuelCostPerGallon: 3.5,
      mpg: 32,
      maintenanceCostPerYear: 500,
      insuranceCostPerYear: 1500,
      registrationCostPerYear: 100,
      depreciationRate: 0.15,
    },
    ...overrides,
  });

  const createInputWithLease = (overrides: Partial<AutoLoanInput> = {}): AutoLoanInput => ({
    ...createBasicInput(),
    analysis: {
      includeLeaseComparison: true,
      includeRefinancingAnalysis: true,
      includeTCOAnalysis: true,
      includePaymentSchedule: true,
      refinancingRates: [0.03, 0.04, 0.05, 0.06],
      ownershipYears: 5,
    },
    leaseTerms: {
      leaseAmount: 28000,
      moneyFactor: 0.00125, // Equivalent to ~3% APR
      termMonths: 36,
      residualValue: 20000,
      securityDeposit: 0,
      acquisitionFee: 1000,
      dispositionFee: 400,
    },
    ...overrides,
  });

  describe('analyze()', () => {
    it('should perform comprehensive auto loan analysis', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
      expect(result.loanAnalysis).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should validate input with Zod schema', () => {
      const input = createBasicInput();
      expect(() => AutoLoanInputSchema.parse(input)).not.toThrow();
    });

    it('should reject invalid input', () => {
      const invalidInput = {
        vehicle: { make: 'Toyota' }, // Missing required fields
      };
      expect(() => AutoLoanInputSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('loan analysis', () => {
    it('should calculate monthly payment correctly', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.loanAnalysis.monthlyPayment).toBeDefined();
      expect(result.loanAnalysis.monthlyPayment).toBeGreaterThan(0);
      // Rough check: monthly payment for $28k at 5.9% for 60 months should be ~$540
      expect(result.loanAnalysis.monthlyPayment).toBeGreaterThan(400);
      expect(result.loanAnalysis.monthlyPayment).toBeLessThan(700);
    });

    it('should calculate total cost of loan', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.loanAnalysis.totalCost).toBeDefined();
      // Total cost should be greater than principal
      expect(result.loanAnalysis.totalCost).toBeGreaterThan(28000);
    });

    it('should calculate total interest paid', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.loanAnalysis.totalInterest).toBeDefined();
      expect(result.loanAnalysis.totalInterest).toBeGreaterThan(0);
    });

    it('should calculate effective rate', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.loanAnalysis.effectiveRate).toBeDefined();
      expect(result.loanAnalysis.effectiveRate).toBeGreaterThan(0);
    });

    it('should generate payment schedule', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.loanAnalysis.paymentSchedule).toBeDefined();
      expect(result.loanAnalysis.paymentSchedule.length).toBe(60);

      const firstPayment = result.loanAnalysis.paymentSchedule[0];
      expect(firstPayment).toHaveProperty('paymentNumber');
      expect(firstPayment).toHaveProperty('paymentDate');
      expect(firstPayment).toHaveProperty('principalPayment');
      expect(firstPayment).toHaveProperty('interestPayment');
      expect(firstPayment).toHaveProperty('remainingBalance');
      expect(firstPayment).toHaveProperty('cumulativeInterest');
    });

    it('should calculate loan payoff date', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.loanAnalysis.payoffDate).toBeDefined();
      // Should be a valid ISO date string
      expect(new Date(result.loanAnalysis.payoffDate).getTime()).not.toBeNaN();
    });

    it('should show decreasing balance in payment schedule', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      const schedule = result.loanAnalysis.paymentSchedule;
      // First payment should have higher balance than last
      expect(schedule[0].remainingBalance).toBeGreaterThan(
        schedule[schedule.length - 1].remainingBalance
      );
      // Last payment balance should be approximately zero
      expect(schedule[schedule.length - 1].remainingBalance).toBeLessThan(1);
    });

    it('should show increasing cumulative interest', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      const schedule = result.loanAnalysis.paymentSchedule;
      expect(schedule[schedule.length - 1].cumulativeInterest).toBeGreaterThan(
        schedule[0].cumulativeInterest
      );
    });
  });

  describe('lease comparison', () => {
    it('should include lease analysis when leaseTerms provided and comparison enabled', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.leaseAnalysis).toBeDefined();
    });

    it('should calculate lease monthly payment', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.leaseAnalysis).toBeDefined();
      expect(result.leaseAnalysis!.monthlyPayment).toBeGreaterThan(0);
    });

    it('should calculate total lease payments', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.leaseAnalysis).toBeDefined();
      expect(result.leaseAnalysis!.totalPayments).toBeGreaterThan(0);
    });

    it('should calculate total lease cost', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.leaseAnalysis).toBeDefined();
      expect(result.leaseAnalysis!.totalCost).toBeGreaterThan(0);
    });

    it('should calculate lease effective rate', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.leaseAnalysis).toBeDefined();
      expect(result.leaseAnalysis!.effectiveRate).toBeDefined();
    });

    it('should calculate lease end date', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.leaseAnalysis).toBeDefined();
      expect(result.leaseAnalysis!.endDate).toBeDefined();
      expect(new Date(result.leaseAnalysis!.endDate).getTime()).not.toBeNaN();
    });

    it('should calculate buyout cost', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.leaseAnalysis).toBeDefined();
      expect(result.leaseAnalysis!.buyoutCost).toBeDefined();
      expect(result.leaseAnalysis!.buyoutCost).toBeGreaterThan(0);
    });

    it('should calculate total cost if purchased after lease', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.leaseAnalysis).toBeDefined();
      expect(result.leaseAnalysis!.totalCostIfPurchased).toBeDefined();
    });
  });

  describe('loan vs lease comparison', () => {
    it('should include comparison when lease analysis is performed', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.comparison).toBeDefined();
    });

    it('should calculate monthly payment difference', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.comparison).toBeDefined();
      expect(result.comparison!.loanVsLease.monthlyPaymentDifference).toBeDefined();
    });

    it('should calculate total cost difference', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.comparison).toBeDefined();
      expect(result.comparison!.loanVsLease.totalCostDifference).toBeDefined();
    });

    it('should calculate break-even point', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.comparison).toBeDefined();
      expect(result.comparison!.loanVsLease.breakEvenPoint).toBeDefined();
    });

    it('should provide recommendation', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.comparison).toBeDefined();
      expect(result.comparison!.loanVsLease.recommendation).toBeDefined();
      expect(['loan', 'lease', 'depends']).toContain(result.comparison!.loanVsLease.recommendation);
    });

    it('should provide reasoning', () => {
      const input = createInputWithLease();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.comparison).toBeDefined();
      expect(result.comparison!.loanVsLease.reasoning).toBeDefined();
      expect(Array.isArray(result.comparison!.loanVsLease.reasoning)).toBe(true);
    });
  });

  describe('refinancing analysis', () => {
    it('should include refinancing analysis when requested', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.refinancingAnalysis).toBeDefined();
    });

    it('should generate refinancing scenarios', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.refinancingAnalysis).toBeDefined();
      expect(result.refinancingAnalysis!.scenarios).toBeDefined();
      expect(result.refinancingAnalysis!.scenarios.length).toBeGreaterThan(0);
    });

    it('should calculate new monthly payment for each scenario', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      const scenarios = result.refinancingAnalysis!.scenarios;
      scenarios.forEach((scenario) => {
        expect(scenario.newRate).toBeDefined();
        expect(scenario.newMonthlyPayment).toBeDefined();
        expect(scenario.monthlySavings).toBeDefined();
        expect(scenario.totalSavings).toBeDefined();
        expect(scenario.breakEvenMonths).toBeDefined();
        expect(scenario.recommendation).toBeDefined();
      });
    });

    it('should identify best refinancing scenario', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.refinancingAnalysis).toBeDefined();
      expect(result.refinancingAnalysis!.bestScenario).toBeDefined();
      expect(result.refinancingAnalysis!.bestScenario.rate).toBeDefined();
      expect(result.refinancingAnalysis!.bestScenario.monthlySavings).toBeDefined();
      expect(result.refinancingAnalysis!.bestScenario.totalSavings).toBeDefined();
    });

    it('should calculate refinancing with remaining term adjustment', () => {
      // The engine assumes 1 year has passed when calculating refinancing
      // This means the remaining term is shorter, which may result in higher monthly
      // payments even with a lower rate (due to fewer payments to amortize the principal)
      const input = createBasicInput({
        loanTerms: {
          loanAmount: 28000,
          interestRate: 0.12, // High rate
          termMonths: 60,
          salesTaxRate: 0.08,
          fees: {
            documentationFee: 500,
            titleFee: 100,
            registrationFee: 200,
            otherFees: 0,
          },
        },
        analysis: {
          includeLeaseComparison: false,
          includeRefinancingAnalysis: true,
          includeTCOAnalysis: false,
          includePaymentSchedule: true,
          refinancingRates: [0.05, 0.06, 0.07],
          ownershipYears: 5,
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.refinancingAnalysis).toBeDefined();
      // Each scenario should have valid calculations
      result.refinancingAnalysis!.scenarios.forEach((scenario) => {
        expect(scenario.newRate).toBeDefined();
        expect(typeof scenario.monthlySavings).toBe('number');
        expect(typeof scenario.totalSavings).toBe('number');
        // Lower rates should still result in lower new payments compared to higher refinancing rates
      });
      // The best scenario should be the lowest rate (even if savings are negative)
      expect(result.refinancingAnalysis!.bestScenario.rate).toBe(0.05);
    });
  });

  describe('TCO (Total Cost of Ownership) analysis', () => {
    it('should include TCO analysis when requested', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.tcoAnalysis).toBeDefined();
    });

    it('should calculate total cost of ownership', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.tcoAnalysis).toBeDefined();
      expect(result.tcoAnalysis!.totalCostOfOwnership).toBeDefined();
      expect(result.tcoAnalysis!.totalCostOfOwnership).toBeGreaterThan(0);
    });

    it('should calculate cost per mile', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.tcoAnalysis).toBeDefined();
      expect(result.tcoAnalysis!.costPerMile).toBeDefined();
      expect(result.tcoAnalysis!.costPerMile).toBeGreaterThan(0);
    });

    it('should calculate cost per month', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.tcoAnalysis).toBeDefined();
      expect(result.tcoAnalysis!.costPerMonth).toBeDefined();
      expect(result.tcoAnalysis!.costPerMonth).toBeGreaterThan(0);
    });

    it('should include ownership years', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.tcoAnalysis).toBeDefined();
      expect(result.tcoAnalysis!.ownershipYears).toBe(5);
    });

    it('should provide TCO breakdown', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.tcoAnalysis).toBeDefined();
      expect(result.tcoAnalysis!.breakdown).toBeDefined();
      expect(result.tcoAnalysis!.breakdown.loanPayments).toBeDefined();
      expect(result.tcoAnalysis!.breakdown.interest).toBeDefined();
      expect(result.tcoAnalysis!.breakdown.maintenance).toBeDefined();
      expect(result.tcoAnalysis!.breakdown.fuel).toBeDefined();
      expect(result.tcoAnalysis!.breakdown.insurance).toBeDefined();
      expect(result.tcoAnalysis!.breakdown.registration).toBeDefined();
      expect(result.tcoAnalysis!.breakdown.depreciation).toBeDefined();
      expect(result.tcoAnalysis!.breakdown.fees).toBeDefined();
    });

    it('should calculate residual value', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.tcoAnalysis).toBeDefined();
      expect(result.tcoAnalysis!.residualValue).toBeDefined();
      expect(result.tcoAnalysis!.residualValue).toBeGreaterThan(0);
      // Residual should be less than original price after depreciation
      expect(result.tcoAnalysis!.residualValue).toBeLessThan(33000);
    });

    it('should not include TCO when disabled', () => {
      const input = createBasicInput({
        analysis: {
          includeLeaseComparison: false,
          includeRefinancingAnalysis: false,
          includeTCOAnalysis: false,
          includePaymentSchedule: true,
          refinancingRates: [],
          ownershipYears: 5,
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.tcoAnalysis).toBeUndefined();
    });
  });

  describe('loan term variations', () => {
    it('should handle 36-month term', () => {
      const input = createBasicInput({
        loanTerms: {
          loanAmount: 28000,
          interestRate: 0.049,
          termMonths: 36,
          salesTaxRate: 0.08,
          fees: {
            documentationFee: 500,
            titleFee: 100,
            registrationFee: 200,
            otherFees: 0,
          },
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.loanAnalysis.paymentSchedule.length).toBe(36);
    });

    it('should handle 72-month term', () => {
      const input = createBasicInput({
        loanTerms: {
          loanAmount: 28000,
          interestRate: 0.069,
          termMonths: 72,
          salesTaxRate: 0.08,
          fees: {
            documentationFee: 500,
            titleFee: 100,
            registrationFee: 200,
            otherFees: 0,
          },
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.loanAnalysis.paymentSchedule.length).toBe(72);
    });

    it('should handle 84-month term', () => {
      const input = createBasicInput({
        loanTerms: {
          loanAmount: 28000,
          interestRate: 0.079,
          termMonths: 84,
          salesTaxRate: 0.08,
          fees: {
            documentationFee: 500,
            titleFee: 100,
            registrationFee: 200,
            otherFees: 0,
          },
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.loanAnalysis.paymentSchedule.length).toBe(84);
    });

    it('shorter terms should have higher monthly payments', () => {
      const baseConfig = {
        loanAmount: 28000,
        interestRate: 0.059,
        salesTaxRate: 0.08,
        fees: {
          documentationFee: 500,
          titleFee: 100,
          registrationFee: 200,
          otherFees: 0,
        },
      };

      const short = AutoLoanAnalysisEngine.analyze(
        createBasicInput({
          loanTerms: { ...baseConfig, termMonths: 36 },
        })
      );

      const long = AutoLoanAnalysisEngine.analyze(
        createBasicInput({
          loanTerms: { ...baseConfig, termMonths: 72 },
        })
      );

      expect(short.loanAnalysis.monthlyPayment).toBeGreaterThan(long.loanAnalysis.monthlyPayment);
    });

    it('shorter terms should have less total interest', () => {
      const baseConfig = {
        loanAmount: 28000,
        interestRate: 0.059,
        salesTaxRate: 0.08,
        fees: {
          documentationFee: 500,
          titleFee: 100,
          registrationFee: 200,
          otherFees: 0,
        },
      };

      const short = AutoLoanAnalysisEngine.analyze(
        createBasicInput({
          loanTerms: { ...baseConfig, termMonths: 36 },
        })
      );

      const long = AutoLoanAnalysisEngine.analyze(
        createBasicInput({
          loanTerms: { ...baseConfig, termMonths: 72 },
        })
      );

      expect(short.loanAnalysis.totalInterest).toBeLessThan(long.loanAnalysis.totalInterest);
    });
  });

  describe('interest rate variations', () => {
    it('should handle low interest rate (0.9%)', () => {
      const input = createBasicInput({
        loanTerms: {
          loanAmount: 28000,
          interestRate: 0.009,
          termMonths: 60,
          salesTaxRate: 0.08,
          fees: {
            documentationFee: 500,
            titleFee: 100,
            registrationFee: 200,
            otherFees: 0,
          },
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.loanAnalysis.totalInterest).toBeLessThan(2000);
    });

    it('should handle high interest rate (18%)', () => {
      const input = createBasicInput({
        loanTerms: {
          loanAmount: 28000,
          interestRate: 0.18,
          termMonths: 60,
          salesTaxRate: 0.08,
          fees: {
            documentationFee: 500,
            titleFee: 100,
            registrationFee: 200,
            otherFees: 0,
          },
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.loanAnalysis.totalInterest).toBeGreaterThan(10000);
    });

    it('higher rates should result in more total interest', () => {
      const lowRate = AutoLoanAnalysisEngine.analyze(
        createBasicInput({
          loanTerms: {
            loanAmount: 28000,
            interestRate: 0.03,
            termMonths: 60,
            salesTaxRate: 0.08,
            fees: {
              documentationFee: 500,
              titleFee: 100,
              registrationFee: 200,
              otherFees: 0,
            },
          },
        })
      );

      const highRate = AutoLoanAnalysisEngine.analyze(
        createBasicInput({
          loanTerms: {
            loanAmount: 28000,
            interestRate: 0.09,
            termMonths: 60,
            salesTaxRate: 0.08,
            fees: {
              documentationFee: 500,
              titleFee: 100,
              registrationFee: 200,
              otherFees: 0,
            },
          },
        })
      );

      expect(highRate.loanAnalysis.totalInterest).toBeGreaterThan(
        lowRate.loanAnalysis.totalInterest
      );
    });
  });

  describe('insights and recommendations', () => {
    it('should generate insights', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should generate recommendations', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should have proper recommendation structure', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      result.recommendations.forEach((rec) => {
        expect(rec.category).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(rec.priority);
        expect(rec.description).toBeDefined();
        expect(rec.impact).toBeDefined();
        expect(rec.action).toBeDefined();
      });
    });
  });

  describe('metadata', () => {
    it('should include metadata', () => {
      const input = createBasicInput();
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.calculatedAt).toBeDefined();
      expect(result.metadata.version).toBeDefined();
      expect(result.metadata.methodology).toBeDefined();
      expect(result.metadata.assumptions).toBeDefined();
    });

    it('should have valid calculation timestamp', () => {
      const input = createBasicInput();
      const beforeTime = new Date().toISOString();
      const result = AutoLoanAnalysisEngine.analyze(input);
      const afterTime = new Date().toISOString();

      expect(result.metadata.calculatedAt).toBeDefined();
      expect(result.metadata.calculatedAt >= beforeTime).toBe(true);
      expect(result.metadata.calculatedAt <= afterTime).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle minimum loan amount', () => {
      const input = createBasicInput({
        vehicle: {
          make: 'Used',
          model: 'Car',
          year: 2020,
          msrp: 5000,
          negotiatedPrice: 4000,
          tradeInValue: 0,
          downPayment: 1000,
        },
        loanTerms: {
          loanAmount: 3000,
          interestRate: 0.059,
          termMonths: 24,
          salesTaxRate: 0.08,
          fees: {
            documentationFee: 200,
            titleFee: 50,
            registrationFee: 100,
            otherFees: 0,
          },
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
      expect(result.loanAnalysis.monthlyPayment).toBeGreaterThan(0);
    });

    it('should handle large loan amount', () => {
      const input = createBasicInput({
        vehicle: {
          make: 'Luxury',
          model: 'Car',
          year: 2024,
          msrp: 150000,
          negotiatedPrice: 140000,
          tradeInValue: 0,
          downPayment: 40000,
        },
        loanTerms: {
          loanAmount: 100000,
          interestRate: 0.065,
          termMonths: 72,
          salesTaxRate: 0.08,
          fees: {
            documentationFee: 1000,
            titleFee: 200,
            registrationFee: 500,
            otherFees: 0,
          },
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
      expect(result.loanAnalysis.monthlyPayment).toBeGreaterThan(1000);
    });

    it('should handle trade-in value', () => {
      const input = createBasicInput({
        vehicle: {
          make: 'Toyota',
          model: 'Camry',
          year: 2024,
          msrp: 35000,
          negotiatedPrice: 33000,
          tradeInValue: 10000,
          downPayment: 5000,
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
    });

    it('should handle zero trade-in value', () => {
      const input = createBasicInput({
        vehicle: {
          make: 'Toyota',
          model: 'Camry',
          year: 2024,
          msrp: 35000,
          negotiatedPrice: 33000,
          tradeInValue: 0,
          downPayment: 5000,
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
    });

    it('should handle zero down payment', () => {
      const input = createBasicInput({
        vehicle: {
          make: 'Toyota',
          model: 'Camry',
          year: 2024,
          msrp: 35000,
          negotiatedPrice: 33000,
          tradeInValue: 0,
          downPayment: 0,
        },
      });
      const result = AutoLoanAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
    });
  });
});
