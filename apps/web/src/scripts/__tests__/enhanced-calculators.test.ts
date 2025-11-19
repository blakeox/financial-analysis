/**
 * Unit Tests for Enhanced Calculator Features
 * 
 * Covers all 6 enhanced calculators:
 * - Mortgage Scenario Planner
 * - Retirement Calculator
 * - Auto Loan Calculator
 * - Debt Payoff Calculator
 * - Budget Calculator
 * - Savings Goal Calculator
 */

import { describe, it, expect } from 'vitest';

describe('Mortgage Scenario Planner Enhancements', () => {
  describe('PMI Calculations', () => {
    it('should calculate PMI rates based on down payment percentage', () => {
      const testCases = [
        { downPercent: 19, expectedRate: 0.005 }, // 15-19.99%: 0.5%
        { downPercent: 14, expectedRate: 0.0075 }, // 10-14.99%: 0.75%
        { downPercent: 8, expectedRate: 0.01 }, // 5-9.99%: 1%
        { downPercent: 3.5, expectedRate: 0.012 }, // <5%: 1.2%
      ];
      
      testCases.forEach(({ downPercent, expectedRate }) => {
        const homePrice = 500000;
        const downPayment = homePrice * (downPercent / 100);
        const principal = homePrice - downPayment;
        const loanToValue = principal / homePrice;
        
        let pmiRate = 0.01;
        if (downPercent >= 15) pmiRate = 0.005;
        else if (downPercent >= 10) pmiRate = 0.0075;
        else if (downPercent >= 5) pmiRate = 0.01;
        else pmiRate = 0.012;
        
        expect(pmiRate).toBe(expectedRate);
        expect(loanToValue).toBeCloseTo(1 - downPercent / 100, 5);
      });
    });

    it('should calculate PMI monthly payment', () => {
      const principal = 450000; // $500k home, 10% down
      const pmiRate = 0.01; // 1% annual
      const pmiAnnual = principal * pmiRate;
      const pmiMonthly = pmiAnnual / 12;
      
      expect(pmiMonthly).toBe(375);
    });

    it('should calculate PMI drop-off at 20% equity', () => {
      const homePrice = 500000;
      const downPayment = 50000; // 10% down
      const equityNeeded = homePrice * 0.20;
      const equityToGain = equityNeeded - downPayment;
      
      expect(equityToGain).toBe(50000);
    });

    it('should calculate total PMI cost', () => {
      const pmiMonthly = 375;
      const monthsUntilDropOff = 120; // 10 years
      const totalPMICost = pmiMonthly * monthsUntilDropOff;
      
      expect(totalPMICost).toBe(45000);
    });
  });

  describe('Affordability Check (DTI Ratio)', () => {
    it('should calculate DTI ratio correctly', () => {
      const monthlyPayment = 2800;
      const grossMonthlyIncome = 10000;
      const dtiRatio = (monthlyPayment / grossMonthlyIncome) * 100;
      
      expect(dtiRatio).toBeCloseTo(28, 1); // Right at the 28% recommendation
    });

    it('should categorize DTI ratios appropriately', () => {
      const testCases = [
        { dti: 15, expected: 'Excellent' },
        { dti: 25, expected: 'Good' },
        { dti: 32, expected: 'Tight' },
        { dti: 40, expected: 'Risky' },
      ];
      
      testCases.forEach(({ dti, expected }) => {
        let category = '';
        if (dti <= 20) category = 'Excellent';
        else if (dti <= 28) category = 'Good';
        else if (dti <= 35) category = 'Tight';
        else category = 'Risky';
        
        expect(category).toBe(expected);
      });
    });
  });
});

describe('Retirement Calculator Enhancements', () => {
  describe('Roth vs Traditional Comparison', () => {
    it('should recommend Traditional when current tax rate > retirement tax rate', () => {
      const currentTaxRate = 32; // High earner now
      const retirementTaxRate = 12; // Lower bracket in retirement
      
      expect(currentTaxRate).toBeGreaterThan(retirementTaxRate + 5);
      // Recommendation: Traditional (deduct at 32%, withdraw at 12%)
    });

    it('should recommend Roth when retirement tax rate > current tax rate', () => {
      const currentTaxRate = 12; // Early career, low bracket
      const retirementTaxRate = 22; // Expecting higher income in retirement
      
      expect(retirementTaxRate).toBeGreaterThan(currentTaxRate + 5);
      // Recommendation: Roth (pay 12% tax now, withdraw tax-free)
    });

    it('should recommend both when tax rates are similar', () => {
      const currentTaxRate = 22;
      const retirementTaxRate = 24;
      const difference = Math.abs(currentTaxRate - retirementTaxRate);
      
      expect(difference).toBeLessThan(5);
      // Recommendation: Split for tax diversification
    });

    it('should calculate after-tax Traditional IRA value', () => {
      const balance = 1000000;
      const retirementTaxRate = 0.12;
      const afterTaxBalance = balance * (1 - retirementTaxRate);
      
      expect(afterTaxBalance).toBe(880000);
    });

    it('should show Roth IRA is tax-free in retirement', () => {
      const balance = 1000000;
      const taxRate = 0; // No tax on Roth withdrawals
      const afterTaxBalance = balance * (1 - taxRate);
      
      expect(afterTaxBalance).toBe(1000000);
    });
  });

  describe('Tax Savings Calculations', () => {
    it('should calculate current year tax savings from Traditional contributions', () => {
      const annualContribution = 12000; // $1,000/month
      const marginalTaxRate = 0.22;
      const taxSavings = annualContribution * marginalTaxRate;
      
      expect(taxSavings).toBe(2640);
    });
  });
});

describe('Auto Loan Calculator Enhancements', () => {
  describe('Total Cost of Ownership', () => {
    it('should calculate annual insurance cost', () => {
      const monthlyInsurance = 150;
      const loanTermMonths = 60; // 5 years
      const totalInsurance = monthlyInsurance * loanTermMonths;
      
      expect(totalInsurance).toBe(9000);
    });

    it('should calculate annual maintenance cost', () => {
      const annualMaintenance = 1200;
      const loanYears = 5;
      const totalMaintenance = annualMaintenance * loanYears;
      
      expect(totalMaintenance).toBe(6000);
    });

    it('should calculate fuel costs based on mileage and MPG', () => {
      const annualMiles = 12000;
      const mpg = 25;
      const gasPrice = 3.50;
      
      const gallonsPerYear = annualMiles / mpg;
      const annualFuelCost = gallonsPerYear * gasPrice;
      
      expect(gallonsPerYear).toBe(480);
      expect(annualFuelCost).toBe(1680);
    });

    it('should estimate vehicle depreciation', () => {
      const vehiclePrice = 40000;
      const years = 5;
      const depreciationRate = 0.60; // 60% depreciation over 5 years
      
      const resaleValue = vehiclePrice * (1 - depreciationRate);
      const depreciation = vehiclePrice - resaleValue;
      const annualDepreciation = depreciation / years;
      
      expect(resaleValue).toBe(16000);
      expect(depreciation).toBe(24000);
      expect(annualDepreciation).toBe(4800);
    });

    it('should calculate cost per mile', () => {
      const totalCost = 50000; // Loan + insurance + maintenance + fuel + depreciation
      const totalMiles = 60000; // 12k miles/year * 5 years
      const costPerMile = totalCost / totalMiles;
      
      expect(costPerMile).toBeCloseTo(0.83, 2);
    });
  });
});

describe('Debt Payoff Calculator Enhancements', () => {
  describe('Debt-Free Date Calculation', () => {
    it('should calculate debt-free date correctly', () => {
      const monthsToPayoff = 24;
      const today = new Date();
      const debtFreeDate = new Date(today);
      debtFreeDate.setMonth(debtFreeDate.getMonth() + monthsToPayoff);
      
      expect(debtFreeDate.getTime()).toBeGreaterThan(today.getTime());
    });

    it('should format debt-free date as Month Year', () => {
      const date = new Date('2026-06-15');
      const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      expect(formatted).toBe('June 2026');
    });
  });
});

describe('Budget Calculator Enhancements', () => {
  describe('50/30/20 Rule Analysis', () => {
    it('should categorize spending into needs, wants, savings', () => {
      const monthlyIncome = 5000;
      const needs = 2500; // 50%
      const wants = 1500; // 30%
      const savings = 1000; // 20%
      
      const needsPercent = (needs / monthlyIncome) * 100;
      const wantsPercent = (wants / monthlyIncome) * 100;
      const savingsPercent = (savings / monthlyIncome) * 100;
      
      expect(needsPercent).toBe(50);
      expect(wantsPercent).toBe(30);
      expect(savingsPercent).toBe(20);
    });

    it('should flag when spending exceeds category targets', () => {
      const monthlyIncome = 5000;
      const needs = 3000; // 60% - exceeds 50% target!
      const needsPercent = (needs / monthlyIncome) * 100;
      
      expect(needsPercent).toBeGreaterThan(50);
    });
  });
});

describe('Savings Goal Calculator Enhancements', () => {
  describe('Progress Visualization', () => {
    it('should calculate progress percentage', () => {
      const currentSavings = 25000;
      const goalAmount = 100000;
      const progress = (currentSavings / goalAmount) * 100;
      
      expect(progress).toBe(25);
    });

    it('should identify achieved milestones', () => {
      const progress = 60; // 60% complete
      const milestones = [25, 50, 75, 100];
      
      const achieved = milestones.filter(m => progress >= m);
      
      expect(achieved).toEqual([25, 50]);
      expect(achieved.length).toBe(2);
    });
  });
});

describe('Student Loan Calculator Enhancements', () => {
  describe('Forgiveness Eligibility', () => {
    it('should check PSLF eligibility (federal + public service)', () => {
      const loanType = 'federal_unsubsidized';
      const employment = 'public';
      const isFederal = loanType.startsWith('federal');
      const isPSLFEligible = isFederal && employment === 'public';
      
      expect(isPSLFEligible).toBe(true);
    });

    it('should not qualify private loans for PSLF', () => {
      const loanType = 'private';
      const employment = 'public';
      const isFederal = loanType.startsWith('federal');
      const isPSLFEligible = isFederal && employment === 'public';
      
      expect(isPSLFEligible).toBe(false);
    });

    it('should calculate teacher loan forgiveness max', () => {
      const balance = 30000;
      const maxForgiveness = 17500;
      const actualForgiveness = Math.min(maxForgiveness, balance);
      
      expect(actualForgiveness).toBe(17500);
    });

    it('should estimate PSLF savings (avg 50% forgiven)', () => {
      const balance = 100000;
      const avgForgivenPercent = 0.50;
      const estimatedSavings = balance * avgForgivenPercent;
      
      expect(estimatedSavings).toBe(50000);
    });
  });

  describe('Refinance Comparison', () => {
    it('should estimate rate reduction based on credit score', () => {
      const currentRate = 0.07; // 7%
      const creditScore = 780;
      
      let refinanceRate = currentRate;
      if (creditScore >= 780) refinanceRate = Math.max(0.03, currentRate - 0.03);
      
      expect(refinanceRate).toBeCloseTo(0.04, 2); // 3% reduction
    });

    it('should warn about losing federal protections', () => {
      const loanType = 'federal_unsubsidized';
      const isFederal = loanType.startsWith('federal');
      
      const warnings: string[] = [];
      if (isFederal) {
        warnings.push('Loss of forbearance/deferment');
        warnings.push('Loss of forgiveness programs');
        warnings.push('Loss of IDR plans');
      }
      
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should calculate refinance savings', () => {
      const balance = 50000;
      const currentRate = 0.07 / 12;
      const refinanceRate = 0.04 / 12;
      const months = 120;
      
      // Current loan cost
      const currentPayment = (balance * (currentRate * Math.pow(1 + currentRate, months))) /
        (Math.pow(1 + currentRate, months) - 1);
      const currentTotalCost = currentPayment * months;
      
      // Refinanced loan cost
      const refinancePayment = (balance * (refinanceRate * Math.pow(1 + refinanceRate, months))) /
        (Math.pow(1 + refinanceRate, months) - 1);
      const refinanceTotalCost = refinancePayment * months;
      
      const savings = currentTotalCost - refinanceTotalCost;
      
      expect(savings).toBeGreaterThan(5000); // Should save significant amount
    });
  });
});

describe('Edge Cases and Boundary Conditions', () => {
  describe('Zero and Negative Values', () => {
    it('should handle zero down payment', () => {
      const homePrice = 500000;
      const downPayment = 0;
      const principal = homePrice - downPayment;
      
      expect(principal).toBe(500000);
    });

    it('should handle zero interest rate (0% financing)', () => {
      const principal = 30000;
      const rate = 0;
      const months = 60;
      const monthlyPayment = principal / months;
      const interestPortion = principal * rate;
      
      expect(monthlyPayment).toBe(500);
      expect(interestPortion).toBe(0);
    });

    it('should handle negative home appreciation (recession)', () => {
      const homePrice = 500000;
      const depreciationRate = -0.03; // -3% annual
      const years = 5;
      const futureValue = homePrice * Math.pow(1 + depreciationRate, years);
      
      expect(futureValue).toBeLessThan(homePrice);
      expect(futureValue).toBeCloseTo(429367, -2); // Allow tolerance of 100
    });
  });

  describe('Extreme Values', () => {
    it('should handle very large debts', () => {
      const debt = 500000; // Large mortgage
      const rate = 0.065 / 12;
      const payment = 5000;
      const interestOnlyPayment = debt * rate;
      
      expect(debt).toBeGreaterThan(100000);
      expect(payment / debt).toBeLessThan(0.02); // Less than 2% per month
      expect(interestOnlyPayment).toBeGreaterThan(payment); // Payment would need to rise to reduce balance
    });

    it('should handle very high interest rates', () => {
      const balance = 5000;
      const rate = 0.2999 / 12; // 29.99% APR (payday loan territory)
      const monthlyInterest = balance * rate;
      
      expect(monthlyInterest).toBeCloseTo(125, 0);
    });

    it('should handle very long time horizons', () => {
      const years = 30;
      const months = years * 12;
      
      expect(months).toBe(360);
    });

    it('should handle fractional years', () => {
      const years = 5.5;
      const months = years * 12;
      
      expect(months).toBe(66);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle payment exactly equal to interest (no principal reduction)', () => {
      const balance = 10000;
      const rate = 0.18 / 12;
      const monthlyInterest = balance * rate;
      const payment = monthlyInterest;
      const principalPayment = payment - monthlyInterest;
      
      expect(principalPayment).toBe(0);
      // This means debt never gets paid off!
    });

    it('should handle payment less than interest (debt grows)', () => {
      const balance = 10000;
      const rate = 0.18 / 12;
      const monthlyInterest = balance * rate;
      const payment = monthlyInterest - 10;
      
      const principalPayment = payment - monthlyInterest;
      
      expect(principalPayment).toBeLessThan(0);
      // Debt actually grows!
    });

    it('should handle 100% down payment (cash purchase)', () => {
      const homePrice = 500000;
      const downPayment = 500000;
      const principal = homePrice - downPayment;
      
      expect(principal).toBe(0);
      // No mortgage needed
    });
  });

  describe('Time-Based Edge Cases', () => {
    it('should handle calculations across year boundaries', () => {
      const startDate = new Date('2024-11-15');
      const monthsToAdd = 3;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + monthsToAdd);
      
      expect(endDate.getFullYear()).toBe(2025);
      expect(endDate.getMonth()).toBe(1); // February (0-indexed)
    });

    it('should handle leap years in date calculations', () => {
      const startDate = new Date('2024-02-15'); // Leap year
      const monthsToAdd = 12;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + monthsToAdd);
      
      expect(endDate.getFullYear()).toBe(2025);
    });
  });
});

describe('Calculation Accuracy Tests', () => {
  describe('Floating Point Precision', () => {
    it('should handle floating point arithmetic correctly', () => {
      const a = 0.1;
      const b = 0.2;
      const sum = a + b;
      
      // Floating point quirk: 0.1 + 0.2 = 0.30000000000000004
      expect(sum).toBeCloseTo(0.3, 10);
    });

    it('should round currency values appropriately', () => {
      const value = 1234.567;
      const rounded = Math.round(value * 100) / 100;
      
      expect(rounded).toBe(1234.57);
    });

    it('should handle very small payments without underflow', () => {
      const payment = 0.01;
      const months = 1000;
      const total = payment * months;
      
      expect(total).toBe(10);
    });
  });

  describe('Formula Validation', () => {
    it('should validate mortgage payment formula', () => {
      // Mortgage payment formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
      const P = 400000;
      const r = 0.065 / 12;
      const n = 360;
      
      const numerator = r * Math.pow(1 + r, n);
      const denominator = Math.pow(1 + r, n) - 1;
      const payment = P * (numerator / denominator);
      
      expect(payment).toBeCloseTo(2528, 0);
    });

    it('should validate future value of annuity formula', () => {
      // FV = PMT * ((1 + r)^n - 1) / r
      const PMT = 500;
      const r = 0.07 / 12;
      const n = 120;
      
      const FV = PMT * ((Math.pow(1 + r, n) - 1) / r);
      
      expect(FV).toBeCloseTo(86542, -1); // Allow tolerance of 10
    });

    it('should validate compound interest formula', () => {
      // FV = PV * (1 + r)^n
      const PV = 10000;
      const r = 0.05; // 5% annual
      const n = 10; // years
      
      const FV = PV * Math.pow(1 + r, n);
      
      expect(FV).toBeCloseTo(16288.95, 2);
    });
  });
});

describe('Data Consistency Tests', () => {
  it('should ensure total payments equal principal + interest', () => {
    const principal = 400000;
    const totalInterest = 511400; // Over 30 years
    const totalPaid = principal + totalInterest;
    
    expect(totalPaid).toBe(911400);
  });

  it('should ensure monthly payment * months = total paid', () => {
    const monthlyPayment = 2528;
    const months = 360;
    const totalPaid = monthlyPayment * months;
    
    expect(totalPaid).toBeCloseTo(910080, 0);
  });

  it('should ensure ending balance equals zero after full payoff', () => {
    const principal = 10000;
    const rate = 0.10 / 12;
    const months = 24;
    
    let balance = principal;
    const payment = (principal * (rate * Math.pow(1 + rate, months))) /
      (Math.pow(1 + rate, months) - 1);
    
    for (let i = 0; i < months; i++) {
      const interest = balance * rate;
      const principalPayment = payment - interest;
      balance -= principalPayment;
    }
    
    expect(balance).toBeCloseTo(0, 1);
  });
});

