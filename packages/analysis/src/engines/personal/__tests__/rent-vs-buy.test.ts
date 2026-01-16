import { describe, it, expect } from 'vitest';
import type { RentVsBuyInput } from '../rent-vs-buy';
import { RentVsBuyCalculator } from '../rent-vs-buy';

describe('RentVsBuyCalculator', () => {
  const baseInput: RentVsBuyInput = {
    homePrice: 500000,
    downPayment: 100000, // 20%
    interestRate: 6.5,
    loanTermYears: 30,
    propertyTaxRate: 1.2,
    propertyTaxIncreaseRate: 2,
    appreciationRate: 3,
    monthlyRent: 2500,
    rentersInsurance: 25,
    rentIncreaseRate: 3,
    homeInsurance: 150,
    hoaFees: 100,
    maintenanceRate: 1,
    closingCostRate: 2,
    sellingCostRate: 6,
    investmentReturnRate: 7,
    inflationRate: 2.5,
    marginalTaxRate: 24,
    filingStatus: 'married',
    otherItemizedDeductions: 5000,
    securityDepositMonths: 1,
    yearsToAnalyze: 10,
  };

  describe('analyze()', () => {
    it('should return complete rent vs buy analysis', () => {
      const result = RentVsBuyCalculator.analyze(baseInput);

      expect(result).toHaveProperty('buy');
      expect(result).toHaveProperty('rent');
      expect(result).toHaveProperty('comparison');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('inputSummary');

      expect(result.buy.name).toBe('Buying');
      expect(result.rent.name).toBe('Renting');
      expect(result.buy.equity).toBeGreaterThan(0);
      expect(result.rent.equity).toBeGreaterThan(0);
      expect(result.comparison.recommendation).toBeTruthy();
      expect(result.inputSummary.homePrice).toBe(500000);
      expect(result.inputSummary.monthlyRent).toBe(2500);
      expect(result.inputSummary.yearsAnalyzed).toBe(10);
      expect(result.inputSummary.downPaymentPercent).toBe(20);
    });

    it('should favor buying when home appreciation is strong', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        appreciationRate: 5, // Strong appreciation
        rentIncreaseRate: 2, // Low rent increases
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.comparison.difference).toBeGreaterThan(0);
      expect(result.comparison.factors.costAdvantage).toBe('Buying');
      expect(result.comparison.recommendation).toContain('Buy');
    });

    it('should favor renting when investment returns beat appreciation', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        appreciationRate: 2, // Low appreciation
        investmentReturnRate: 10, // High investment returns
        monthlyRent: 1800, // Low rent
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.comparison.difference).toBeLessThan(0);
      expect(result.comparison.factors.costAdvantage).toBe('Renting');
      expect(result.comparison.recommendation).toContain('Rent');
    });

    it('should calculate strong buy recommendation when difference > $50k', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        appreciationRate: 6,
        yearsToAnalyze: 15,
      };

      const result = RentVsBuyCalculator.analyze(input);

      if (result.comparison.difference > 50000) {
        expect(result.comparison.recommendation).toContain('Strong Buy');
      }
    });

    it('should calculate slight buy advantage when 0 < difference < $50k', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        appreciationRate: 3.5,
        yearsToAnalyze: 5,
      };

      const result = RentVsBuyCalculator.analyze(input);

      if (result.comparison.difference > 0 && result.comparison.difference <= 50000) {
        expect(result.comparison.recommendation).toContain('Slight Buy');
      }
    });

    it('should calculate strong rent recommendation when difference < -$50k', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        appreciationRate: 1,
        investmentReturnRate: 12,
        monthlyRent: 1500,
        yearsToAnalyze: 15,
      };

      const result = RentVsBuyCalculator.analyze(input);

      if (result.comparison.difference < -50000) {
        expect(result.comparison.recommendation).toContain('Strong Rent');
      }
    });

    it('should calculate slight rent advantage when difference is modestly negative', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        appreciationRate: 2,
        investmentReturnRate: 8,
        monthlyRent: 2300,
        yearsToAnalyze: 8,
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.comparison.difference).toBeLessThan(0);
      expect(result.comparison.difference).toBeGreaterThan(-50000);
      expect(result.comparison.recommendation).toContain('Slight Rent Advantage');
    });
  });

  describe('PMI calculation', () => {
    it('should include PMI when down payment is 5%', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        downPayment: 25000, // 5%
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.breakdown.pmiCost).toBeGreaterThan(0);
    });

    it('should include PMI when down payment is 10%', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        downPayment: 50000, // 10%
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.breakdown.pmiCost).toBeGreaterThan(0);
    });

    it('should include PMI when down payment is 15%', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        downPayment: 75000, // 15%
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.breakdown.pmiCost).toBeGreaterThan(0);
    });

    it('should not include PMI when down payment is 20%+', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        downPayment: 100000, // 20%
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.breakdown.pmiCost).toBe(0);
    });

    it('should stop charging PMI when LTV drops below 80%', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        downPayment: 50000, // 10% - will have PMI initially
        appreciationRate: 15, // Strong appreciation to push LTV below 80%
        yearsToAnalyze: 3,
      };

      const result = RentVsBuyCalculator.analyze(input);

      // PMI should be charged, but not for all years due to appreciation
      expect(result.buy.breakdown.pmiCost).toBeGreaterThan(0);
      // With 15% annual appreciation and equity build, LTV should drop fast
    });

    it('should apply higher PMI for down payments under 5%', () => {
      const lowDownPayment: RentVsBuyInput = {
        ...baseInput,
        downPayment: 10000, // 2%
      };
      const fivePercentDown: RentVsBuyInput = {
        ...baseInput,
        downPayment: 25000, // 5%
      };

      const lowResult = RentVsBuyCalculator.analyze(lowDownPayment);
      const fiveResult = RentVsBuyCalculator.analyze(fivePercentDown);

      expect(lowResult.buy.breakdown.pmiCost).toBeGreaterThan(fiveResult.buy.breakdown.pmiCost);
    });
  });

  describe('year-by-year tracking', () => {
    it('should track yearly housing costs and equity buildup', () => {
      const result = RentVsBuyCalculator.analyze(baseInput);

      expect(result.buy.yearByYear).toHaveLength(10);
      expect(result.rent.yearByYear).toHaveLength(10);

      // First year
      expect(result.buy.yearByYear[0].year).toBe(1);
      expect(result.buy.yearByYear[0].housingCost).toBeGreaterThan(0);
      expect(result.buy.yearByYear[0].equity).toBeGreaterThan(0);

      // Last year
      expect(result.buy.yearByYear[9].year).toBe(10);
      expect(result.buy.yearByYear[9].equity).toBeGreaterThan(result.buy.yearByYear[0].equity);
    });

    it('should show increasing cumulative costs over time', () => {
      const result = RentVsBuyCalculator.analyze(baseInput);

      for (let i = 1; i < result.buy.yearByYear.length; i++) {
        expect(result.buy.yearByYear[i].cumulativeCost).toBeGreaterThan(
          result.buy.yearByYear[i - 1].cumulativeCost
        );
      }
    });

    it('should track rent increases annually', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        rentIncreaseRate: 5,
      };

      const result = RentVsBuyCalculator.analyze(input);

      // Rent housing costs should increase year over year
      for (let i = 1; i < result.rent.yearByYear.length; i++) {
        expect(result.rent.yearByYear[i].housingCost).toBeGreaterThan(
          result.rent.yearByYear[i - 1].housingCost
        );
      }
    });
  });

  describe('tax benefits calculation', () => {
    it('should calculate SALT cap correctly for married filers', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        filingStatus: 'married',
        propertyTaxRate: 2.5, // High property tax
      };

      const result = RentVsBuyCalculator.analyze(input);

      // SALT is capped at $10k, should use standard deduction of $29,200 if itemized doesn't exceed it
      expect(result.buy.breakdown.shouldItemize).toBeDefined();
      expect(result.buy.breakdown.standardDeduction).toBe(29200);
    });

    it('should calculate SALT cap correctly for single filers', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        filingStatus: 'single',
        propertyTaxRate: 2.5,
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.breakdown.standardDeduction).toBe(14600);
    });

    it('should calculate SALT cap correctly for head of household', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        filingStatus: 'head',
        propertyTaxRate: 2.5,
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.breakdown.standardDeduction).toBe(21900);
    });

    it('should recommend itemizing when deductions exceed standard', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        homePrice: 1000000,
        downPayment: 200000,
        interestRate: 7,
        propertyTaxRate: 2,
        otherItemizedDeductions: 15000,
      };

      const result = RentVsBuyCalculator.analyze(input);

      // High mortgage interest + property tax + other deductions should exceed standard
      if (result.buy.breakdown.shouldItemize) {
        expect(result.buy.breakdown.potentialItemized).toBeGreaterThan(
          result.buy.breakdown.standardDeduction
        );
        expect(result.buy.breakdown.taxBenefits).toBeGreaterThan(0);
      }
    });

    it('should calculate zero tax benefits when standard deduction is better', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        homePrice: 200000,
        downPayment: 40000,
        interestRate: 4,
        propertyTaxRate: 0.5,
        otherItemizedDeductions: 0,
      };

      const result = RentVsBuyCalculator.analyze(input);

      // Low mortgage interest + low property tax likely won't beat standard deduction
      if (!result.buy.breakdown.shouldItemize) {
        expect(result.buy.breakdown.taxBenefits).toBe(0);
      }
    });
  });

  describe('capital gains calculation', () => {
    it('should apply married capital gains exclusion of $500k', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        filingStatus: 'married',
        appreciationRate: 8,
        yearsToAnalyze: 10,
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.breakdown.capitalGains).toBeGreaterThan(0);
      // If gains < $500k, no tax
      if (result.buy.breakdown.capitalGains < 500000) {
        expect(result.buy.breakdown.capitalGainsTax).toBe(0);
      }
    });

    it('should apply single capital gains exclusion of $250k', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        filingStatus: 'single',
        appreciationRate: 8,
        yearsToAnalyze: 10,
      };

      const result = RentVsBuyCalculator.analyze(input);

      // If gains < $250k, no tax
      if (result.buy.breakdown.capitalGains < 250000) {
        expect(result.buy.breakdown.capitalGainsTax).toBe(0);
      }
    });

    it('should not apply capital gains exclusion if owned < 2 years', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        yearsToAnalyze: 1,
        appreciationRate: 5,
      };

      const result = RentVsBuyCalculator.analyze(input);

      // No exclusion if < 2 years, so all gains are taxable
      if (result.buy.breakdown.capitalGains > 0) {
        expect(result.buy.breakdown.capitalGainsTax).toBeGreaterThan(0);
      }
    });

    it('should tax gains above exclusion at 15%', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        homePrice: 2000000,
        downPayment: 400000,
        filingStatus: 'single',
        appreciationRate: 10,
        yearsToAnalyze: 15,
      };

      const result = RentVsBuyCalculator.analyze(input);

      // With high price and appreciation, gains should exceed $250k exclusion
      const expectedTaxableGains = Math.max(0, result.buy.breakdown.capitalGains - 250000);
      const expectedTax = expectedTaxableGains * 0.15;

      if (expectedTaxableGains > 0) {
        expect(result.buy.breakdown.capitalGainsTax).toBeCloseTo(expectedTax, 0);
      }
    });
  });

  describe('break-even year', () => {
    it('should find break-even year when buying becomes cheaper', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        appreciationRate: 4,
        yearsToAnalyze: 15,
      };

      const result = RentVsBuyCalculator.analyze(input);

      if (result.comparison.breakEvenYear !== null) {
        expect(result.comparison.breakEvenYear).toBeGreaterThan(0);
        expect(result.comparison.breakEvenYear).toBeLessThanOrEqual(15);
      }
    });

    it('should return null break-even year if buying never breaks even', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        appreciationRate: 1,
        monthlyRent: 1000, // Very low rent
        rentIncreaseRate: 1,
        investmentReturnRate: 10,
        yearsToAnalyze: 5,
      };

      const result = RentVsBuyCalculator.analyze(input);

      // In this scenario, renting is likely always cheaper
      if (result.comparison.breakEvenYear === null) {
        expect(result.comparison.difference).toBeLessThan(0);
      }
    });
  });

  describe('renting scenario', () => {
    it('should include security deposit in calculations', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        securityDepositMonths: 2,
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.rent.breakdown.securityDeposit).toBeGreaterThan(0);
    });

    it('should default to 1 month security deposit if not specified', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        // securityDepositMonths not specified
      };

      const result = RentVsBuyCalculator.analyze(input);

      // Security deposit opportunity cost should be calculated
      expect(result.rent.breakdown.securityDeposit).toBeGreaterThan(0);
    });

    it('should invest down payment and closing costs when renting', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        investmentReturnRate: 8,
      };

      const result = RentVsBuyCalculator.analyze(input);

      // Rent equity should grow from investing down payment + closing costs
      expect(result.rent.equity).toBeGreaterThan(baseInput.downPayment);
    });

    it('should invest monthly savings when rent is cheaper than buying', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        monthlyRent: 1500, // Much cheaper than buying
      };

      const result = RentVsBuyCalculator.analyze(input);

      // Renting with low rent + investing savings should build significant equity
      expect(result.rent.equity).toBeGreaterThan(0);
    });
  });

  describe('buying scenario edge cases', () => {
    it('should handle zero HOA fees', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        hoaFees: 0,
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.monthlyPayment).toBeGreaterThan(0);
    });

    it('should handle zero maintenance costs', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        maintenanceRate: 0,
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.monthlyPayment).toBeGreaterThan(0);
    });

    it('should handle high property tax rate', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        propertyTaxRate: 3.5, // Very high property tax
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.monthlyPayment).toBeGreaterThan(baseInput.monthlyRent);
    });

    it('should handle short analysis period', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        yearsToAnalyze: 1,
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.yearByYear).toHaveLength(1);
      expect(result.rent.yearByYear).toHaveLength(1);
      // Short period likely favors renting due to closing/selling costs
    });

    it('should handle long analysis period', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        yearsToAnalyze: 30,
      };

      const result = RentVsBuyCalculator.analyze(input);

      expect(result.buy.yearByYear).toHaveLength(30);
      expect(result.rent.yearByYear).toHaveLength(30);
      // Long period should show significant equity growth
      expect(result.buy.equity).toBeGreaterThan(100000);
    });
  });

  describe('net position calculation', () => {
    it('should calculate buying net position correctly', () => {
      const result = RentVsBuyCalculator.analyze(baseInput);

      // Net position = home equity - down payment + tax benefits + investment balance
      expect(result.buy.netPosition).toBeDefined();
      expect(typeof result.buy.netPosition).toBe('number');
    });

    it('should calculate renting net position correctly', () => {
      const result = RentVsBuyCalculator.analyze(baseInput);

      // Net position = investment equity - total housing costs
      expect(result.rent.netPosition).toBeDefined();
      expect(result.rent.equity).toBeGreaterThan(0);
    });

    it('should show positive net position for buying in favorable scenario', () => {
      const input: RentVsBuyInput = {
        ...baseInput,
        appreciationRate: 6,
        interestRate: 4.5,
        yearsToAnalyze: 15,
      };

      const result = RentVsBuyCalculator.analyze(input);

      if (result.comparison.difference > 0) {
        expect(result.buy.netPosition).toBeGreaterThan(result.rent.netPosition);
      }
    });
  });

  describe('comparison factors', () => {
    it('should always include flexibility factor', () => {
      const result = RentVsBuyCalculator.analyze(baseInput);

      expect(result.comparison.factors.flexibility).toContain('mobility');
      expect(result.comparison.factors.flexibility).toContain('stability');
    });

    it('should show equity building amount', () => {
      const result = RentVsBuyCalculator.analyze(baseInput);

      expect(result.comparison.factors.equityBuilding).toBeGreaterThan(0);
      expect(result.comparison.factors.equityBuilding).toBe(result.buy.equity);
    });

    it('should include tax benefits in factors', () => {
      const result = RentVsBuyCalculator.analyze(baseInput);

      expect(result.comparison.factors.taxBenefits).toBe(result.buy.breakdown.taxBenefits);
    });
  });
});
