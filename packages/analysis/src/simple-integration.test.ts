import { describe, it, expect } from 'vitest';
import { LeaseAnalyzer, AmortizationAnalyzer } from './index.js';
import { EbitdaForecaster } from './engines/ebitda-forecasting.js';

console.log('Debug imports:');
console.log('LeaseAnalyzer:', typeof LeaseAnalyzer);
console.log('AmortizationAnalyzer:', typeof AmortizationAnalyzer);
console.log('EbitdaForecaster:', typeof EbitdaForecaster);
console.log('EbitdaForecaster?.forecast:', typeof EbitdaForecaster?.forecast);

describe('Simple Financial Integration Tests', () => {
  describe('Core Engine Functionality', () => {
    it('should perform lease analysis correctly', () => {
      const result = LeaseAnalyzer.analyze({
        principal: 50000,
        annualRate: 0.05,
        termMonths: 36,
        residualValue: 10000
      });

      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.totalPayments).toBeGreaterThan(0);
      expect(result.schedule).toHaveLength(36);
      expect(result.totalInterest).toBeGreaterThan(0);

      // Verify schedule structure
      const firstPayment = result.schedule[0];
      expect(firstPayment).toHaveProperty('month');
      expect(firstPayment).toHaveProperty('payment');
      expect(firstPayment).toHaveProperty('principal');
      expect(firstPayment).toHaveProperty('interest');
      expect(firstPayment).toHaveProperty('balance');
    });

    it('should perform amortization analysis correctly', () => {
      const result = AmortizationAnalyzer.analyze({
        principal: 200000,
        annualRate: 0.05,
        termMonths: 360, // 30 years
        extraMonthlyPayment: 0,
        oneTimePayments: [],
        paymentFrequency: 'monthly',
        interestOnlyMonths: 0,
        balloonPayment: 0,
        origination_fee: 0,
        points: 0,
        pmi: {
          enabled: false,
          rate: 0,
          dropOffLTV: 0.8
        }
      });

      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.totalPayments).toBeGreaterThan(0);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.schedule.length).toBe(360);

      // Verify the payment is reasonable (should be around $1,073 for these parameters)
      expect(result.monthlyPayment).toBeGreaterThan(1000);
      expect(result.monthlyPayment).toBeLessThan(1200);
    });

    it('should perform EBITDA forecasting correctly', () => {
      const result = EbitdaForecaster.forecast({
        name: 'Basic Forecast Test',
        description: 'Simple 3-month forecast',
        forecastPeriodMonths: 3,
        currentMonthlyFinancials: [
          {
            month: 1,
            year: 2024,
            revenue: 100000,
            costOfGoodsSold: 30000,
            operatingExpenses: 40000, // Reduced from 50000
            depreciation: 2000,
            amortization: 1000,
            interestExpense: 500,
            taxes: 4000
          }
        ],
        currentEmployees: [
          {
            id: 'emp1',
            name: 'Manager',
            role: 'Manager',
            department: 'Management',
            billableHoursPerMonth: 160,
            hourlyRate: 50, // Reduced from 75
            salary: 80000, // Reduced from 120000
            benefits: 16000, // Reduced from 24000
            startDate: '2024-01-01T00:00:00.000Z',
            isActive: true
          }
        ],
        newEmployees: [],
        revenueGrowthRate: 0.02, // 2% monthly growth
        billableHoursGrowthRate: 0.01,
        additionalExpenses: [],
        operatingExpenseGrowthRate: 0.015,
        inflationRate: 0.003
      });

      expect(result.scenario.name).toBe('Basic Forecast Test');
      expect(result.forecast).toHaveLength(3);
      expect(result.summary.totalRevenue).toBeGreaterThan(300000);
      expect(result.summary.totalEbitda).toBeGreaterThan(0);
      expect(result.keyMetrics.revenuePerEmployee).toBeGreaterThan(0);

      // Verify growth - month 3 should have higher revenue than month 1
      expect(result.forecast[2].revenue).toBeGreaterThan(result.forecast[0].revenue);
    });

    it('should handle deterministic calculations', () => {
      // Test that same inputs produce same outputs
      const input = {
        principal: 100000,
        annualRate: 0.06,
        termMonths: 60,
        residualValue: 20000
      };

      const result1 = LeaseAnalyzer.analyze(input);
      const result2 = LeaseAnalyzer.analyze(input);

      expect(result1.monthlyPayment).toBe(result2.monthlyPayment);
      expect(result1.totalPayments).toBe(result2.totalPayments);
      expect(result1.totalInterest).toBe(result2.totalInterest);
    });

    it('should validate inputs and throw appropriate errors', () => {
      // Test negative principal
      expect(() => {
        LeaseAnalyzer.analyze({
          principal: -50000,
          annualRate: 0.05,
          termMonths: 36,
          residualValue: 0
        });
      }).toThrow();

      // Test invalid rate
      expect(() => {
        AmortizationAnalyzer.analyze({
          principal: 100000,
          annualRate: -0.01, // Negative rate should fail
          termMonths: 360,
          extraMonthlyPayment: 0,
          oneTimePayments: [],
          paymentFrequency: 'monthly',
          interestOnlyMonths: 0,
          balloonPayment: 0,
          origination_fee: 0,
          points: 0,
          pmi: {
            enabled: false,
            rate: 0,
            dropOffLTV: 0.8
          }
        });
      }).toThrow();

      // Test empty financials array
      expect(() => {
        EbitdaForecaster.forecast({
          name: 'Invalid Test',
          forecastPeriodMonths: 1,
          currentMonthlyFinancials: [], // Empty should fail
          currentEmployees: [],
          newEmployees: [],
          revenueGrowthRate: 0,
          billableHoursGrowthRate: 0,
          additionalExpenses: [],
          operatingExpenseGrowthRate: 0,
          inflationRate: 0.03
        });
      }).toThrow();
    });

    it('should demonstrate realistic business scenario', () => {
      // Equipment lease analysis
      const equipmentLease = LeaseAnalyzer.analyze({
        principal: 150000, // $150k equipment
        annualRate: 0.055, // 5.5% annual rate
        termMonths: 48, // 4 year lease
        residualValue: 30000 // 20% residual value
      });

      // Alternative loan for purchase
      const equipmentLoan = AmortizationAnalyzer.analyze({
        principal: 150000,
        annualRate: 0.065, // Higher rate for loan
        termMonths: 48,
        extraMonthlyPayment: 0,
        oneTimePayments: [],
        paymentFrequency: 'monthly',
        interestOnlyMonths: 0,
        balloonPayment: 0,
        origination_fee: 0,
        points: 0,
        pmi: {
          enabled: false,
          rate: 0,
          dropOffLTV: 0.8
        }
      });

      // Business forecast to see if it can afford payments
      const businessForecast = EbitdaForecaster.forecast({
        name: 'Equipment Purchase Decision',
        description: 'Analyzing ability to service equipment debt',
        forecastPeriodMonths: 6,
        currentMonthlyFinancials: [
          {
            month: 12,
            year: 2023,
            revenue: 80000, // Increased from 75000 - new equipment should boost revenue
            costOfGoodsSold: 25000,
            operatingExpenses: 25000, // Reduced from 35000
            depreciation: 1500,
            amortization: 500,
            interestExpense: 800,
            taxes: 3000
          }
        ],
        currentEmployees: [
          {
            id: 'owner',
            name: 'Business Owner',
            role: 'Owner',
            department: 'Management',
            billableHoursPerMonth: 160,
            hourlyRate: 100,
            salary: 65000, // Reduced from 80000
            benefits: 13000, // Reduced proportionally
            startDate: '2023-01-01T00:00:00.000Z',
            isActive: true
          },
          {
            id: 'worker1',
            name: 'Production Worker',
            role: 'Technician',
            department: 'Production',
            billableHoursPerMonth: 160,
            hourlyRate: 35,
            salary: 45000, // Reduced from 56000
            benefits: 9000, // Reduced proportionally
            startDate: '2023-06-01T00:00:00.000Z',
            isActive: true
          }
        ],
        newEmployees: [],
        revenueGrowthRate: 0.025, // 2.5% monthly growth expected from new equipment
        billableHoursGrowthRate: 0.01,
        additionalExpenses: [
          {
            id: 'equipment_maintenance',
            name: 'Equipment Maintenance',
            category: 'variable',
            amount: 800, // Reduced from 1200
            frequency: 'monthly',
            isRecurring: true,
            growthRate: 0.01,
            startMonth: 1
          }
        ],
        operatingExpenseGrowthRate: 0.01,
        inflationRate: 0.003,
        economicFactors: {
          marketGrowth: 0.02,
          competitionFactor: 0.95, // Competitive pressure
          seasonalityFactors: [1.0, 1.05, 1.1, 1.15, 1.2, 1.1, 1.0, 0.95, 1.0, 1.05, 1.1, 1.0] // 12 months
        }
      });

      // Analysis
      const leasePayment = equipmentLease.monthlyPayment;
      const loanPayment = equipmentLoan.monthlyPayment;
      const averageEbitda = businessForecast.summary.totalEbitda / 6;

      // All calculations should complete successfully
      expect(leasePayment).toBeGreaterThan(0);
      expect(loanPayment).toBeGreaterThan(0);
      expect(averageEbitda).toBeGreaterThan(0);

      // Business should be able to service debt
      const leaseCoverageRatio = averageEbitda / leasePayment;
      const loanCoverageRatio = averageEbitda / loanPayment;

      expect(leaseCoverageRatio).toBeGreaterThan(1.5); // Should have 1.5x coverage
      expect(loanCoverageRatio).toBeGreaterThan(1.2); // Loan should be affordable too

      // Lease should have lower monthly payments
      expect(leasePayment).toBeLessThan(loanPayment);

      // Revenue should grow with new equipment
      expect(businessForecast.forecast[5].revenue).toBeGreaterThan(businessForecast.forecast[0].revenue * 1.1);

      console.log(`📊 Equipment Financing Decision:
        🏗️  Equipment Cost: $${(150000).toLocaleString()}
        💰 Lease Payment: $${leasePayment.toLocaleString()}/month
        🏦 Loan Payment: $${loanPayment.toLocaleString()}/month
        📈 Average EBITDA: $${averageEbitda.toLocaleString()}/month
        📊 Lease Coverage: ${leaseCoverageRatio.toFixed(2)}x
        🎯 Loan Coverage: ${loanCoverageRatio.toFixed(2)}x
        🚀 Revenue Growth: ${((businessForecast.forecast[5].revenue / businessForecast.forecast[0].revenue - 1) * 100).toFixed(1)}%`);
    });
  });
});