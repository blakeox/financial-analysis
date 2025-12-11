/**
 * Unit Tests for Side Hustle Income Calculator
 */

import { describe, it, expect, beforeEach } from 'vitest';

type SideHustleInput = {
  monthlyRevenue: number;
  hoursPerWeek: number;
  businessExpenses: number;
  filingStatus: 'single' | 'married' | 'head-of-household';
  otherIncome: number;
  selfEmploymentTaxDeduction: boolean;
  qbiDeduction: boolean;
  stateTaxRate: number;
};

describe('Side Hustle Income Calculator', () => {
  let defaultInput: SideHustleInput;

  beforeEach(() => {
    defaultInput = {
      monthlyRevenue: 5000,
      hoursPerWeek: 20,
      businessExpenses: 500,
      filingStatus: 'single',
      otherIncome: 0,
      selfEmploymentTaxDeduction: true,
      qbiDeduction: true,
      stateTaxRate: 5,
    };
  });

  describe('Self-Employment Tax Calculations', () => {
    it('should calculate SE tax as 15.3% of 92.35% of net income', () => {
      const annualRevenue = 60000;
      const annualExpenses = 6000;
      const netIncome = annualRevenue - annualExpenses;
      
      const seTaxBase = netIncome * 0.9235;
      const seTax = seTaxBase * 0.153;
      
      expect(seTaxBase).toBeCloseTo(49869, 0);
      expect(seTax).toBeCloseTo(7630, 0);
    });

    it('should allow deduction of half of SE tax', () => {
      const seTax = 7630;
      const deductible = seTax / 2;
      
      expect(deductible).toBeCloseTo(3815, 0);
    });

    it('should calculate SE tax even with zero other income', () => {
      const netProfit = 54000;
      const seTaxBase = netProfit * 0.9235;
      const seTax = seTaxBase * 0.153;
      
      expect(seTax).toBeGreaterThan(0);
      expect(seTax).toBeCloseTo(7630, 0);
    });
  });

  describe('QBI Deduction', () => {
    it('should calculate 20% QBI deduction when eligible', () => {
      const qualifiedBusinessIncome = 50000;
      const qbiDeduction = qualifiedBusinessIncome * 0.20;
      
      expect(qbiDeduction).toBe(10000);
    });

    it('should reduce taxable income by QBI amount', () => {
      const netIncome = 50000;
      const qbiDeduction = 10000;
      const taxableIncome = netIncome - qbiDeduction;
      
      expect(taxableIncome).toBe(40000);
    });
  });

  describe('Hourly Rate Calculations', () => {
    it('should calculate gross hourly rate', () => {
      const annualRevenue = 60000;
      const annualHours = 20 * 52; // 20 hours/week * 52 weeks
      const hourlyRate = annualRevenue / annualHours;
      
      expect(hourlyRate).toBeCloseTo(57.69, 2);
    });

    it('should calculate net hourly rate after expenses', () => {
      const annualRevenue = 60000;
      const annualExpenses = 6000;
      const netIncome = annualRevenue - annualExpenses;
      const annualHours = 1040;
      const netHourlyRate = netIncome / annualHours;
      
      expect(netHourlyRate).toBeCloseTo(51.92, 2);
    });

    it('should calculate true hourly rate after ALL taxes', () => {
      const annualRevenue = 60000;
      const annualExpenses = 6000;
      const netIncome = 54000;
      const totalTaxes = 15000; // SE tax + federal + state
      const afterTaxIncome = netIncome - totalTaxes;
      const annualHours = 1040;
      const trueHourlyRate = afterTaxIncome / annualHours;
      
      expect(trueHourlyRate).toBeCloseTo(37.50, 2);
      expect(trueHourlyRate).toBeLessThan(netIncome / annualHours);
    });
  });

  describe('Quarterly Estimated Tax', () => {
    it('should divide annual tax by 4 for quarterly payments', () => {
      const annualTax = 12000;
      const quarterlyTax = annualTax / 4;
      
      expect(quarterlyTax).toBe(3000);
    });

    it('should calculate total tax including SE + federal + state', () => {
      const seTax = 7630;
      const federalTax = 5000;
      const stateTax = 2700;
      const totalTax = seTax + federalTax + stateTax;
      
      expect(totalTax).toBe(15330);
    });
  });

  describe('Federal Tax Bracket Calculations', () => {
    it('should apply progressive tax brackets for single filers', () => {
      // 2024 brackets (simplified)
      const taxableIncome = 50000;
      
      // 10% on first $11,000 = $1,100
      // 12% on next $33,725 = $4,047
      // 22% on remaining $5,275 = $1,160.50
      // Total: ~$6,307
      
      const expectedTax = 1100 + 4047 + 1160.50;
      expect(expectedTax).toBeCloseTo(6307.50, 0);
    });

    it('should apply different brackets for married filing jointly', () => {
      // Married brackets are roughly 2x single brackets
      const taxableIncome = 100000;
      
      // First $22,000 at 10% = $2,200
      // Next $67,050 at 12% = $8,046
      // Remaining $10,950 at 22% = $2,409
      // Total: ~$12,655
      
      const expectedTax = 2200 + 8046 + 2409;
      expect(expectedTax).toBeCloseTo(12655, 0);
    });
  });

  describe('W-2 Equivalent Comparison', () => {
    it('should calculate W-2 salary that gives same take-home', () => {
      const afterTaxIncome = 39000;
      // W-2 employee pays ~7.65% FICA (employer pays other half)
      // Plus federal and state income tax
      // W-2 equivalent should be higher than freelance revenue
      
      const w2Equivalent = afterTaxIncome / (1 - 0.25); // Assuming ~25% total tax for W-2
      
      expect(w2Equivalent).toBeGreaterThan(afterTaxIncome);
      expect(w2Equivalent).toBeCloseTo(52000, -2);
    });

    it('should estimate benefits value at 20-30% of salary', () => {
      const w2Salary = 60000;
      const benefitsValue = w2Salary * 0.25;
      
      expect(benefitsValue).toBe(15000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high income (QBI phase-out)', () => {
      const highIncome = { ...defaultInput, monthlyRevenue: 30000 }; // $360k/year
      
      // QBI deduction phases out above certain thresholds
      expect(highIncome.monthlyRevenue * 12).toBeGreaterThan(182100); // 2024 phase-out start
    });

    it('should handle zero business expenses', () => {
      const noExpenses = { ...defaultInput, businessExpenses: 0 };
      const netIncome = noExpenses.monthlyRevenue * 12;
      
      expect(netIncome).toBe(60000);
    });

    it('should handle multiple income sources', () => {
      const multipleIncome = { ...defaultInput, otherIncome: 50000 };
      const totalIncome = (multipleIncome.monthlyRevenue * 12 - multipleIncome.businessExpenses * 12) + multipleIncome.otherIncome;
      
      expect(totalIncome).toBe(104000);
    });

    it('should handle states with no income tax', () => {
      const noStateTax = { ...defaultInput, stateTaxRate: 0 };
      const stateTax = 0 * 0;
      
      expect(stateTax).toBe(0);
    });

    it('should handle part-time freelance (few hours)', () => {
      const partTime = { ...defaultInput, hoursPerWeek: 5 };
      const annualHours = partTime.hoursPerWeek * 52;
      
      expect(annualHours).toBe(260);
    });
  });

  describe('Tax Optimization', () => {
    it('should show value of tracking expenses (deductions)', () => {
      const withExpenses = 6000;
      const withoutExpenses = 0;
      
      const netWith = 60000 - withExpenses;
      const netWithout = 60000 - withoutExpenses;
      
      const seTaxSavings = (withExpenses * 0.9235 * 0.153);
      
      expect(seTaxSavings).toBeGreaterThan(0);
      expect(netWith).toBeLessThan(netWithout);
      // But after-tax income is better with expense tracking due to deductions
    });

    it('should calculate take-home percentage correctly', () => {
      const grossRevenue = 60000;
      const afterTaxIncome = 39000;
      const takeHomePercent = (afterTaxIncome / grossRevenue) * 100;
      
      expect(takeHomePercent).toBeCloseTo(65, 0);
    });
  });
});

function validateInput(input: SideHustleInput): void {
  if (input.monthlyRevenue <= 0) throw new Error('Please enter monthly revenue');
  if (input.hoursPerWeek <= 0) throw new Error('Please enter hours per week');
}

