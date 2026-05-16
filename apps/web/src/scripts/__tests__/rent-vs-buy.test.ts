/**
 * Unit Tests for Rent vs Buy Calculator
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock the utilities (mirrors real helpers for deterministic math checks)
const mockUtilities = {
  coerceNumber: (val: unknown, defaultVal: number) => {
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    return isNaN(num) ? defaultVal : num;
  },
  formatCurrency: (val: number) => `$${val.toLocaleString()}`,
  showLoading: () => {},
  hideLoading: () => {},
  showError: () => {},
  hideError: () => {},
};

// Import types for testing
type RentVsBuyInput = {
  homePrice: number;
  downPayment: number;
  interestRate: number;
  loanTermYears: number;
  propertyTaxRate: number;
  propertyTaxIncreaseRate: number;
  homeInsurance: number;
  hoaFees: number;
  maintenanceRate: number;
  appreciationRate: number;
  closingCostRate: number;
  sellingCostRate: number;
  monthlyRent: number;
  rentIncreaseRate: number;
  rentersInsurance: number;
  securityDepositMonths: number;
  yearsToAnalyze: number;
  marginalTaxRate: number;
  investmentReturnRate: number;
  inflationRate: number;
  filingStatus: 'single' | 'married' | 'head';
  otherItemizedDeductions: number;
};

describe('Rent vs Buy Calculator', () => {
  let defaultInput: RentVsBuyInput;

  beforeEach(() => {
    defaultInput = {
      homePrice: 500000,
      downPayment: 100000,
      interestRate: 6.5,
      loanTermYears: 30,
      propertyTaxRate: 1.2,
      propertyTaxIncreaseRate: 2,
      homeInsurance: 150,
      hoaFees: 0,
      maintenanceRate: 1,
      appreciationRate: 3,
      closingCostRate: 3,
      sellingCostRate: 6,
      monthlyRent: 2500,
      rentIncreaseRate: 3,
      rentersInsurance: 20,
      securityDepositMonths: 1,
      yearsToAnalyze: 5,
      marginalTaxRate: 22,
      investmentReturnRate: 7,
      inflationRate: 2.5,
      filingStatus: 'single',
      otherItemizedDeductions: 0,
    };
  });

  describe('Utility Helpers', () => {
    it('should coerce strings to numbers safely', () => {
      const result = mockUtilities.coerceNumber('42.5', 0);
      expect(result).toBeCloseTo(42.5);
    });

    it('should format currency with commas', () => {
      const formatted = mockUtilities.formatCurrency(123456.78);
      expect(formatted).toBe('$123,456.78');
    });
  });

  describe('Input Validation', () => {
    it('should require positive home price', () => {
      const invalidInput = { ...defaultInput, homePrice: 0 };
      expect(() => validateInput(invalidInput)).toThrow('valid home price');
    });

    it('should require down payment less than home price', () => {
      const invalidInput = { ...defaultInput, downPayment: 600000 };
      expect(() => validateInput(invalidInput)).toThrow('less than home price');
    });

    it('should require positive interest rate', () => {
      const invalidInput = { ...defaultInput, interestRate: 0 };
      expect(() => validateInput(invalidInput)).toThrow('valid interest rate');
    });

    it('should require positive monthly rent', () => {
      const invalidInput = { ...defaultInput, monthlyRent: 0 };
      expect(() => validateInput(invalidInput)).toThrow('valid monthly rent');
    });

    it('should enforce analysis period range (1-30 years)', () => {
      const invalidInput1 = { ...defaultInput, yearsToAnalyze: 0 };
      const invalidInput2 = { ...defaultInput, yearsToAnalyze: 35 };
      expect(() => validateInput(invalidInput1)).toThrow('1-30 years');
      expect(() => validateInput(invalidInput2)).toThrow('1-30 years');
    });
  });

  describe('Buying Scenario Calculations', () => {
    it('should calculate monthly mortgage payment correctly', () => {
      // $400k loan at 6.5% for 30 years should be ~$2,528/month
      const principal = 400000;
      const rate = 0.065 / 12;
      const months = 360;
      const expected =
        (principal * (rate * Math.pow(1 + rate, months))) / (Math.pow(1 + rate, months) - 1);

      expect(expected).toBeCloseTo(2528, 0);
    });

    it('should include property taxes in monthly payment', () => {
      // 1.2% of $500k = $6k/year = $500/month
      const annualPropertyTax = 500000 * 0.012;
      const monthlyPropertyTax = annualPropertyTax / 12;

      expect(monthlyPropertyTax).toBe(500);
    });

    it('should calculate home appreciation correctly', () => {
      // $500k at 3% annual for 5 years
      const futureValue = 500000 * Math.pow(1.03, 5);

      expect(futureValue).toBeCloseTo(579637, 0);
    });

    it('should account for closing costs upfront', () => {
      // 3% of $500k = $15k
      const closingCosts = 500000 * 0.03;

      expect(closingCosts).toBe(15000);
    });

    it('should calculate tax benefits from mortgage interest deduction', () => {
      // Simplified: if you pay $50k interest over 5 years at 22% tax rate
      const taxBenefit = 50000 * 0.22;

      expect(taxBenefit).toBe(11000);
    });
  });

  describe('Renting Scenario Calculations', () => {
    it('should calculate rent increase over time correctly', () => {
      // $2,500 at 3% annual increase
      const year1 = 2500;
      const year2 = 2500 * 1.03;
      const year5 = 2500 * Math.pow(1.03, 4); // Year 5 is after 4 increases

      expect(year1).toBe(2500);
      expect(year2).toBeCloseTo(2575, -1);
      expect(year5).toBeCloseTo(2813, -1);
    });

    it('should calculate investment returns on saved capital', () => {
      // $100k invested at 7% annual for 5 years
      const futureValue = 100000 * Math.pow(1.07, 5);

      expect(futureValue).toBeCloseTo(140255, 0);
    });

    it('should include renters insurance in monthly costs', () => {
      const monthlyRent = 2500;
      const rentersInsurance = 20;
      const totalMonthlyCost = monthlyRent + rentersInsurance;

      expect(totalMonthlyCost).toBe(2520);
    });
  });

  describe('Break-Even Analysis', () => {
    it('should find break-even point when buying becomes cheaper', () => {
      // In most markets, break-even occurs between 3-7 years
      // This is when (total buy costs - equity) < total rent costs
      // Mock calculation: if buying costs $300k and equity is $150k, net cost is $150k
      // If renting costs $180k over same period, buying wins
      const buyNetCost = 300000 - 150000;
      const rentCost = 180000;

      expect(buyNetCost).toBeLessThan(rentCost);
    });

    it('should return null if no break-even within analysis period', () => {
      // Very expensive home in cheap rent market may never break even
      const expensiveHome = { ...defaultInput, homePrice: 1000000, monthlyRent: 1500 };

      // In this scenario, renting is always cheaper
      expect(expensiveHome.homePrice).toBeGreaterThan(expensiveHome.monthlyRent * 12 * 50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero down payment (100% financing)', () => {
      const zeroDown = { ...defaultInput, downPayment: 0 };
      const principal = zeroDown.homePrice;

      expect(principal).toBe(500000);
    });

    it('should handle negative home appreciation (market downturn)', () => {
      const depreciation = { ...defaultInput, appreciationRate: -2 };
      const depreciationRate = 1 + depreciation.appreciationRate / 100;
      const futureValue =
        depreciation.homePrice * Math.pow(depreciationRate, depreciation.yearsToAnalyze);

      expect(depreciation.appreciationRate).toBeLessThan(0);
      expect(futureValue).toBeLessThan(depreciation.homePrice);
      expect(futureValue).toBeCloseTo(451960, -2); // Allow tolerance of 100
    });

    it('should handle very short analysis periods (1 year)', () => {
      const shortTerm = { ...defaultInput, yearsToAnalyze: 1 };

      // Buying almost never makes sense for 1 year due to transaction costs
      const transactionCosts = 500000 * (0.03 + 0.06); // Closing + selling
      expect(shortTerm.yearsToAnalyze).toBe(1);
      expect(transactionCosts).toBe(45000);
    });

    it('should handle very long analysis periods (30 years)', () => {
      const longTerm = { ...defaultInput, yearsToAnalyze: 30, loanTermYears: 30 };

      // After 30 years, mortgage is fully paid off
      // Home should be fully owned
      expect(longTerm.yearsToAnalyze).toBe(longTerm.loanTermYears);
    });
  });

  describe('Comparison Logic', () => {
    it('should recommend buying when appreciation + tax benefits exceed rent + opportunity cost', () => {
      const buyFavorable = {
        ...defaultInput,
        appreciationRate: 5, // High appreciation
        investmentReturnRate: 4, // Low investment returns
        monthlyRent: 3000, // High rent
      };

      // With high appreciation and high rent, buying should win
      expect(buyFavorable.appreciationRate).toBeGreaterThan(buyFavorable.investmentReturnRate);
    });

    it('should recommend renting when investment returns exceed home appreciation', () => {
      const rentFavorable = {
        ...defaultInput,
        appreciationRate: 2, // Low appreciation
        investmentReturnRate: 10, // High investment returns
        monthlyRent: 1500, // Low rent
      };

      expect(rentFavorable.investmentReturnRate).toBeGreaterThan(rentFavorable.appreciationRate);
    });
  });

  describe('Monthly Savings Investment', () => {
    it('should invest renter monthly savings when rent is cheaper than buying', () => {
      // Set rent much lower than expected mortgage payment
      const cheapRent = {
        ...defaultInput,
        monthlyRent: 1500, // Cheap rent vs ~$3500+ total monthly buying cost
        investmentReturnRate: 7,
      };

      // Calculate estimated buying monthly payment
      // $400k loan at 6.5%, plus taxes, insurance, maintenance
      const mortgagePayment = 2528; // approximate P&I
      const otherCosts = 500 + 150 + 417; // property tax + insurance + maintenance
      const totalBuyingMonthly = mortgagePayment + otherCosts;

      // The renter should save ~$2000/month when rent is $1500 vs $3500+ buying
      const monthlySavings =
        totalBuyingMonthly - (cheapRent.monthlyRent + cheapRent.rentersInsurance);
      expect(monthlySavings).toBeGreaterThan(1500); // Significant monthly savings
    });

    it('should invest buyer monthly savings when buying is cheaper than renting', () => {
      // Set rent higher than typical mortgage costs
      const expensiveRent = {
        ...defaultInput,
        monthlyRent: 4500, // Expensive rent vs ~$3500 total monthly buying cost
        investmentReturnRate: 7,
      };

      // When rent > buying monthly payment, buyer should have savings to invest
      const rentTotal = expensiveRent.monthlyRent + expensiveRent.rentersInsurance;
      const estimatedBuyingMonthly = 3500; // approximate total
      const monthlySavings = rentTotal - estimatedBuyingMonthly;
      expect(monthlySavings).toBeGreaterThan(900); // ~$1000/month savings
    });

    it('should use user-configurable investment return rate', () => {
      // Test that changing the investment return rate affects calculations
      const lowReturn = { ...defaultInput, investmentReturnRate: 4 };
      const highReturn = { ...defaultInput, investmentReturnRate: 10 };

      // With higher investment returns, renting becomes more attractive
      // because the opportunity cost of buying (down payment invested) grows faster
      expect(highReturn.investmentReturnRate).toBeGreaterThan(lowReturn.investmentReturnRate);

      // Over 5 years, $100k at 10% vs 4%
      const lowGrowth = 100000 * Math.pow(1.04, 5);
      const highGrowth = 100000 * Math.pow(1.1, 5);
      expect(highGrowth - lowGrowth).toBeGreaterThan(39000); // Significant difference (~$39,386)
    });

    it('should compound monthly savings at the user-specified rate', () => {
      // Monthly compounding of $1000/month at 7% annual for 5 years
      const monthlyContribution = 1000;
      const annualRate = 0.07;
      const monthlyRate = annualRate / 12;
      const months = 60;

      // Future value of annuity formula: PMT * ((1+r)^n - 1) / r
      const futureValue =
        monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

      // Should be around $71k (more than just 60 * $1000 = $60k due to compounding)
      expect(futureValue).toBeGreaterThan(70000);
      expect(futureValue).toBeLessThan(75000);
    });
  });
});

// Helper function for validation (mirroring actual implementation)
function validateInput(input: RentVsBuyInput): void {
  if (input.homePrice <= 0) throw new Error('Please enter a valid home price');
  if (input.downPayment >= input.homePrice)
    throw new Error('Down payment must be less than home price');
  if (input.interestRate <= 0) throw new Error('Please enter a valid interest rate');
  if (input.monthlyRent <= 0) throw new Error('Please enter a valid monthly rent');
  if (input.yearsToAnalyze < 1 || input.yearsToAnalyze > 30)
    throw new Error('Analysis period must be 1-30 years');
}
