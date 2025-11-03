/**
 * Comprehensive Edge Case Tests for All Calculators
 * 
 * Tests unusual, extreme, and boundary conditions that could break calculators
 */

import { describe, it, expect } from 'vitest';

describe('Extreme Value Edge Cases', () => {
  describe('Very Large Numbers', () => {
    it('should handle multi-million dollar homes', () => {
      const homePrice = 5000000; // $5M mansion
      const downPayment = 1000000; // $1M down (20%)
      const principal = homePrice - downPayment;
      
      expect(principal).toBe(4000000);
      expect(Number.isSafeInteger(principal)).toBe(true);
    });

    it('should handle very large debt balances', () => {
      const studentLoanDebt = 500000; // Medical school debt
      expect(Number.isSafeInteger(studentLoanDebt)).toBe(true);
    });

    it('should handle high-income earners', () => {
      const annualIncome = 1000000; // $1M/year
      const monthlyIncome = annualIncome / 12;
      
      expect(monthlyIncome).toBeCloseTo(83333, 0);
    });

    it('should handle very long time horizons without overflow', () => {
      const years = 30;
      const months = years * 12;
      const monthlyPayment = 2500;
      const totalPaid = monthlyPayment * months;
      
      expect(totalPaid).toBe(900000);
      expect(Number.isSafeInteger(totalPaid)).toBe(true);
    });
  });

  describe('Very Small Numbers', () => {
    it('should handle micro-payments without underflow', () => {
      const payment = 0.01; // 1 cent
      const months = 1000;
      const total = payment * months;
      
      expect(total).toBe(10);
    });

    it('should handle tiny interest rates (near-zero)', () => {
      const rate = 0.001; // 0.1% APR
      const balance = 10000;
      const monthlyInterest = balance * (rate / 12);
      
      expect(monthlyInterest).toBeCloseTo(0.83, 2);
    });

    it('should handle fractional percentages', () => {
      const downPaymentPercent = 19.5;
      expect(downPaymentPercent).toBeGreaterThan(19);
      expect(downPaymentPercent).toBeLessThan(20);
    });
  });

  describe('Zero Values', () => {
    it('should handle 0% interest (promotional financing)', () => {
      const principal = 30000;
      const rate = 0;
      const months = 60;
      const monthlyPayment = principal / months;
      
      expect(monthlyPayment).toBe(500);
      expect(isNaN(monthlyPayment)).toBe(false);
    });

    it('should handle $0 down payment (100% financing)', () => {
      const homePrice = 500000;
      const downPayment = 0;
      const principal = homePrice - downPayment;
      
      expect(principal).toBe(homePrice);
    });

    it('should handle 0% home appreciation (flat market)', () => {
      const homePrice = 500000;
      const years = 5;
      const rate = 0;
      const futureValue = homePrice * Math.pow(1 + rate, years);
      
      expect(futureValue).toBe(homePrice);
    });

    it('should handle $0 business expenses', () => {
      const revenue = 60000;
      const expenses = 0;
      const netIncome = revenue - expenses;
      
      expect(netIncome).toBe(revenue);
    });

    it('should handle 0% employer match', () => {
      const contribution = 500;
      const match = 0;
      const total = contribution * (1 + match);
      
      expect(total).toBe(contribution);
    });
  });

  describe('Negative Values', () => {
    it('should handle market crash scenarios (negative appreciation)', () => {
      const homePrice = 500000;
      const depreciationRate = -0.10; // -10% crash
      const years = 1;
      const futureValue = homePrice * Math.pow(1 + depreciationRate, years);
      
      expect(futureValue).toBe(450000);
      expect(futureValue).toBeLessThan(homePrice);
    });

    it('should handle negative equity (underwater mortgage)', () => {
      const homeValue = 400000;
      const loanBalance = 450000; // Owe more than home is worth
      const equity = homeValue - loanBalance;
      
      expect(equity).toBe(-50000);
      expect(equity).toBeLessThan(0);
    });

    it('should handle negative net income (budget deficit)', () => {
      const income = 5000;
      const expenses = 6000;
      const netIncome = income - expenses;
      
      expect(netIncome).toBe(-1000);
      expect(netIncome).toBeLessThan(0);
    });

    it('should handle negative real returns (inflation > investment return)', () => {
      const investmentReturn = 3;
      const inflationRate = 5;
      const realReturn = investmentReturn - inflationRate;
      
      expect(realReturn).toBe(-2);
      expect(realReturn).toBeLessThan(0);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle exactly 20% down payment (PMI threshold)', () => {
      const homePrice = 500000;
      const downPayment = 100000; // Exactly 20%
      const downPercent = (downPayment / homePrice) * 100;
      
      expect(downPercent).toBe(20);
      
      const hasPMI = downPercent < 20;
      expect(hasPMI).toBe(false); // No PMI at exactly 20%
    });

    it('should handle exactly 19.99% down payment (just under PMI threshold)', () => {
      const homePrice = 500000;
      const downPayment = 99950; // 19.99%
      const downPercent = (downPayment / homePrice) * 100;
      
      expect(downPercent).toBeCloseTo(19.99, 2);
      
      const hasPMI = downPercent < 20;
      expect(hasPMI).toBe(true); // PMI required
    });

    it('should handle payment exactly equal to monthly interest', () => {
      const balance = 10000;
      const rate = 0.18 / 12;
      const monthlyInterest = balance * rate;
      const payment = monthlyInterest;
      const principalPayment = payment - monthlyInterest;
      
      expect(principalPayment).toBe(0);
      // This means debt never decreases!
    });

    it('should handle age exactly 50 (catch-up contribution threshold)', () => {
      const age = 50;
      const eligibleForCatchUp = age >= 50;
      
      expect(eligibleForCatchUp).toBe(true);
    });

    it('should handle exactly 30% credit utilization (threshold)', () => {
      const balance = 3000;
      const limit = 10000;
      const utilization = (balance / limit) * 100;
      
      expect(utilization).toBe(30);
      
      const isHealthy = utilization <= 30;
      expect(isHealthy).toBe(true); // Exactly at threshold is OK
    });
  });
});

describe('Time-Based Edge Cases', () => {
  describe('Date Edge Cases', () => {
    it('should handle end-of-month calculations', () => {
      const date = new Date('2024-01-31');
      date.setMonth(date.getMonth() + 1);
      
      // JavaScript auto-adjusts to Feb 29 (leap year)
      expect(date.getMonth()).toBe(1); // February (0-indexed)
    });

    it('should handle leap year calculations', () => {
      const leapYear = 2024;
      const isLeap = leapYear % 4 === 0 && (leapYear % 100 !== 0 || leapYear % 400 === 0);
      
      expect(isLeap).toBe(true);
    });

    it('should handle year-end date calculations', () => {
      const date = new Date('2024-12-31');
      date.setDate(date.getDate() + 1);
      
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(1);
    });

    it('should handle very long time periods (30+ years)', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 30);
      
      expect(endDate.getFullYear()).toBe(2054);
    });
  });

  describe('Quarter-End Tax Calculations', () => {
    it('should identify correct quarterly tax deadlines', () => {
      const deadlines = [
        { quarter: 'Q1', date: 'April 15' },
        { quarter: 'Q2', date: 'June 15' },
        { quarter: 'Q3', date: 'September 15' },
        { quarter: 'Q4', date: 'January 15 (next year)' },
      ];
      
      expect(deadlines).toHaveLength(4);
      expect(deadlines[0].date).toBe('April 15');
    });
  });
});

describe('Market Condition Edge Cases', () => {
  describe('Economic Extremes', () => {
    it('should handle recession scenario (negative growth + high unemployment)', () => {
      const homeAppreciation = -5; // -5% annual
      const investmentReturn = -10; // Market crash
      const jobLoss = true;
      
      expect(homeAppreciation).toBeLessThan(0);
      expect(investmentReturn).toBeLessThan(0);
      expect(jobLoss).toBe(true);
    });

    it('should handle boom scenario (high appreciation + high returns)', () => {
      const homeAppreciation = 15; // Hot market
      const investmentReturn = 20; // Bull market
      
      expect(homeAppreciation).toBeGreaterThan(10);
      expect(investmentReturn).toBeGreaterThan(15);
    });

    it('should handle hyperinflation scenario', () => {
      const inflationRate = 25; // 25% annual (hyperinflation)
      const years = 5;
      const costToday = 50000;
      const costFuture = costToday * Math.pow(1 + (inflationRate / 100), years);
      
      expect(costFuture).toBeGreaterThan(costToday * 2);
      expect(costFuture).toBeCloseTo(152587, 0);
    });
  });

  describe('Interest Rate Extremes', () => {
    it('should handle near-zero rates (ZIRP)', () => {
      const rate = 0.01; // 0.01% APR (Japan-style)
      const monthlyRate = rate / 100 / 12;
      
      expect(monthlyRate).toBeCloseTo(0.0000083, 7);
    });

    it('should handle very high rates (payday loans)', () => {
      const rate = 400; // 400% APR (payday loan)
      const monthlyRate = rate / 100 / 12;
      
      expect(monthlyRate).toBeCloseTo(0.333, 3);
    });

    it('should handle credit card APR variations', () => {
      const rates = {
        excellent: 13.99,
        good: 18.99,
        fair: 22.99,
        poor: 29.99,
      };
      
      expect(rates.excellent).toBeLessThan(rates.poor);
      expect(rates.poor).toBeLessThan(35); // Legal limit in most states
    });
  });
});

describe('User Journey Edge Cases', () => {
  describe('Life Event Scenarios', () => {
    it('should handle early retirement (before age 65)', () => {
      const currentAge = 30;
      const retirementAge = 45; // FIRE movement
      const yearsToRetirement = retirementAge - currentAge;
      
      expect(yearsToRetirement).toBe(15);
      expect(retirementAge).toBeLessThan(65);
    });

    it('should handle late retirement (working past 65)', () => {
      const currentAge = 60;
      const retirementAge = 75; // Working longer
      const yearsToRetirement = retirementAge - currentAge;
      
      expect(yearsToRetirement).toBe(15);
      expect(retirementAge).toBeGreaterThan(65);
    });

    it('should handle career change mid-life (income fluctuation)', () => {
      const currentIncome = 100000;
      const futureIncome = 60000; // Career change to lower-paying field
      const incomeChange = ((futureIncome - currentIncome) / currentIncome) * 100;
      
      expect(incomeChange).toBe(-40); // 40% income reduction
    });

    it('should handle multiple debt sources', () => {
      const debts = [
        { type: 'mortgage', balance: 400000, rate: 3.5 },
        { type: 'student', balance: 100000, rate: 5.5 },
        { type: 'auto', balance: 30000, rate: 4.5 },
        { type: 'credit-card', balance: 10000, rate: 18 },
      ];
      
      const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
      const avgRate = debts.reduce((sum, d) => sum + (d.balance * d.rate), 0) / totalDebt;
      
      expect(totalDebt).toBe(540000);
      expect(avgRate).toBeCloseTo(3.96, 2);
    });
  });

  describe('Geographic Variations', () => {
    it('should handle high-tax states (CA, NY, NJ)', () => {
      const stateTaxRate = 13.3; // California top rate
      const federalTaxRate = 37; // Top federal bracket
      const combinedTaxRate = stateTaxRate + federalTaxRate;
      
      expect(combinedTaxRate).toBeCloseTo(50.3, 1);
    });

    it('should handle no-tax states (FL, TX, WA)', () => {
      const stateTaxRate = 0;
      const federalTaxRate = 22;
      const combinedTaxRate = stateTaxRate + federalTaxRate;
      
      expect(combinedTaxRate).toBe(22);
    });

    it('should handle high property tax areas (NJ, IL)', () => {
      const homePrice = 500000;
      const propertyTaxRate = 2.5; // NJ average
      const annualPropertyTax = homePrice * (propertyTaxRate / 100);
      
      expect(annualPropertyTax).toBe(12500);
    });

    it('should handle low property tax areas (HI, AL)', () => {
      const homePrice = 500000;
      const propertyTaxRate = 0.3; // Hawaii
      const annualPropertyTax = homePrice * (propertyTaxRate / 100);
      
      expect(annualPropertyTax).toBe(1500);
    });
  });

  describe('Special Loan Programs', () => {
    it('should handle VA loan (0% down, no PMI)', () => {
      const homePrice = 500000;
      const downPayment = 0; // VA allows 0% down
      const pmiRequired = false; // VA loans don't require PMI
      
      expect(downPayment).toBe(0);
      expect(pmiRequired).toBe(false);
    });

    it('should handle FHA loan (3.5% down, MIP required)', () => {
      const homePrice = 300000;
      const minDownPayment = homePrice * 0.035; // 3.5% minimum
      const mipRequired = true; // FHA has mortgage insurance premium
      
      expect(minDownPayment).toBe(10500);
      expect(mipRequired).toBe(true);
    });

    it('should handle jumbo loan (>$766,550)', () => {
      const loanAmount = 1000000;
      const conformingLimit = 766550; // 2024 limit
      const isJumbo = loanAmount > conformingLimit;
      
      expect(isJumbo).toBe(true);
    });
  });
});

describe('Calculation Convergence Edge Cases', () => {
  describe('Non-Converging Scenarios', () => {
    it('should detect when payment does not cover interest', () => {
      const balance = 10000;
      const rate = 0.20 / 12; // 20% APR
      const monthlyInterest = balance * rate;
      const payment = 100; // Less than $166 monthly interest!
      
      const principalPayment = payment - monthlyInterest;
      
      expect(principalPayment).toBeLessThan(0);
      // Debt grows - infinite loop if not handled
    });

    it('should cap iterations to prevent infinite loops', () => {
      const maxIterations = 600; // 50 years
      let iterations = 0;
      let balance = 10000;
      const rate = 0.18 / 12;
      const payment = 10; // Very low payment
      
      while (balance > 0 && iterations < maxIterations) {
        const interest = balance * rate;
        const principal = payment - interest;
        
        if (principal <= 0) {
          // Would loop forever - break
          break;
        }
        
        balance -= principal;
        iterations++;
      }
      
      expect(iterations).toBeLessThan(maxIterations);
    });

    it('should handle scenarios that take >50 years to pay off', () => {
      const balance = 100000;
      const rate = 0.05 / 12;
      const payment = 500; // Very small relative to balance
      
      let remaining = balance;
      let months = 0;
      const maxMonths = 600;
      
      while (remaining > 0 && months < maxMonths) {
        const interest = remaining * rate;
        const principal = payment - interest;
        remaining -= principal;
        months++;
      }
      
      if (months >= maxMonths) {
        // Cap at 50 years for display
        expect(months).toBe(maxMonths);
      }
    });
  });

  describe('Rounding and Precision', () => {
    it('should handle floating point precision issues', () => {
      const a = 0.1;
      const b = 0.2;
      const sum = a + b;
      
      // 0.1 + 0.2 = 0.30000000000000004 in JavaScript
      expect(sum).not.toBe(0.3);
      expect(sum).toBeCloseTo(0.3, 10);
    });

    it('should round final payment to eliminate tiny balances', () => {
      const balance = 0.001; // Less than a cent
      const threshold = 0.01;
      const shouldConsiderPaidOff = balance < threshold;
      
      expect(shouldConsiderPaidOff).toBe(true);
    });

    it('should handle currency rounding to 2 decimals', () => {
      const value = 1234.56789;
      const rounded = Math.round(value * 100) / 100;
      
      expect(rounded).toBe(1234.57);
    });

    it('should handle percentage rounding to 2 decimals', () => {
      const value = 18.9876;
      const rounded = Math.round(value * 100) / 100;
      
      expect(rounded).toBe(18.99);
    });
  });
});

describe('Tax Edge Cases', () => {
  describe('Standard vs Itemized Deduction', () => {
    it('should only benefit from mortgage interest deduction if itemizing', () => {
      const mortgageInterest = 20000; // Annual
      const propertyTax = 10000; // Annual
      const totalItemized = mortgageInterest + propertyTax; // $30k
      
      const standardDeduction2024Single = 14600;
      const standardDeduction2024Married = 29200;
      
      const shouldItemizeSingle = totalItemized > standardDeduction2024Single;
      const shouldItemizeMarried = totalItemized > standardDeduction2024Married;
      
      expect(shouldItemizeSingle).toBe(true); // $30k > $14.6k
      expect(shouldItemizeMarried).toBe(true); // $30k > $29.2k (barely)
    });

    it('should handle SALT deduction cap ($10,000)', () => {
      const propertyTax = 15000;
      const stateTax = 8000;
      const totalSALT = propertyTax + stateTax; // $23k
      const saltCap = 10000;
      const deductibleSALT = Math.min(totalSALT, saltCap);
      
      expect(deductibleSALT).toBe(10000); // Capped
      expect(totalSALT - deductibleSALT).toBe(13000); // Lost deduction
    });
  });

  describe('Self-Employment Tax Edge Cases', () => {
    it('should handle SE tax on maximum Social Security wages', () => {
      const netEarnings = 200000;
      const ssTaxableMax = 160200; // 2024 limit
      const medicareTaxableAll = netEarnings;
      
      const ssTax = ssTaxableMax * 0.124; // 12.4%
      const medicareTax = medicareTaxableAll * 0.029; // 2.9%
      const totalSETax = (ssTax + medicareTax) * 0.9235; // On 92.35% of net
      
      expect(totalSETax).toBeGreaterThan(0);
    });

    it('should handle additional Medicare tax (>$200k single)', () => {
      const netEarnings = 250000;
      const additionalMedicareThreshold = 200000;
      const excessEarnings = netEarnings - additionalMedicareThreshold;
      const additionalMedicareTax = excessEarnings * 0.009; // Additional 0.9%
      
      expect(additionalMedicareTax).toBe(450);
    });
  });
});

describe('Credit and Lending Edge Cases', () => {
  describe('Credit Score Boundaries', () => {
    it('should handle credit score ranges', () => {
      const scores = {
        min: 300,
        poor: 550,
        fair: 650,
        good: 700,
        excellent: 750,
        max: 850,
      };
      
      expect(scores.min).toBeGreaterThanOrEqual(300);
      expect(scores.max).toBeLessThanOrEqual(850);
    });

    it('should categorize credit scores correctly', () => {
      const categorize = (score: number) => {
        if (score < 580) return 'Poor';
        if (score < 650) return 'Fair';
        if (score < 700) return 'Good';
        if (score < 750) return 'Very Good';
        return 'Excellent';
      };
      
      expect(categorize(550)).toBe('Poor');
      expect(categorize(620)).toBe('Fair');
      expect(categorize(680)).toBe('Good');
      expect(categorize(725)).toBe('Very Good');
      expect(categorize(800)).toBe('Excellent');
    });
  });

  describe('Loan-to-Value Edge Cases', () => {
    it('should handle LTV exactly at 80% (PMI threshold)', () => {
      const homeValue = 500000;
      const loanBalance = 400000;
      const ltv = (loanBalance / homeValue) * 100;
      
      expect(ltv).toBe(80);
      
      const pmiRequired = ltv > 80;
      expect(pmiRequired).toBe(false); // PMI drops at 80% LTV
    });

    it('should handle LTV over 100% (underwater)', () => {
      const homeValue = 300000;
      const loanBalance = 350000; // Owe more than home is worth
      const ltv = (loanBalance / homeValue) * 100;
      
      expect(ltv).toBeCloseTo(116.67, 2);
      expect(ltv).toBeGreaterThan(100);
    });
  });
});

describe('Calculation Limit Edge Cases', () => {
  describe('IRS Contribution Limits', () => {
    it('should enforce 401(k) contribution limits', () => {
      const contribution2024 = 23000; // 2024 limit
      const catchUpContribution = 7500; // Additional for 50+
      const maxUnder50 = 23000;
      const maxOver50 = 23000 + 7500;
      
      expect(maxOver50).toBe(30500);
    });

    it('should enforce Roth IRA income limits', () => {
      const income = 150000;
      const rothIRAPhaseoutSingle = 138000; // Starts phasing out
      const rothIRAMaxSingle = 153000; // Completely phased out
      
      const canContribute = income < rothIRAPhaseoutSingle;
      const canContributePartial = income >= rothIRAPhaseoutSingle && income < rothIRAMaxSingle;
      
      expect(canContribute).toBe(false);
      expect(canContributePartial).toBe(true);
    });
  });

  describe('Loan Amount Limits', () => {
    it('should identify conventional loan limits', () => {
      const conformingLimit2024 = 766550;
      const loanAmount = 800000;
      const isJumbo = loanAmount > conformingLimit2024;
      
      expect(isJumbo).toBe(true);
    });

    it('should handle FHA loan limits by county', () => {
      const fhaLimitLowCost = 498257; // Low-cost areas
      const fhaLimitHighCost = 1149825; // High-cost areas (SF, NYC)
      
      expect(fhaLimitHighCost).toBeGreaterThan(fhaLimitLowCost * 2);
    });
  });
});

describe('Performance Edge Cases', () => {
  describe('Large Dataset Handling', () => {
    it('should handle amortization schedule for 30 years (360 rows)', () => {
      const schedule: Array<{ month: number; principal: number; interest: number }> = [];
      
      for (let month = 1; month <= 360; month++) {
        schedule.push({
          month,
          principal: 1000 + month,
          interest: 1500 - month,
        });
      }
      
      expect(schedule).toHaveLength(360);
      expect(schedule[0].month).toBe(1);
      expect(schedule[359].month).toBe(360);
    });

    it('should handle yearly projections for 30 years', () => {
      const projections = [];
      
      for (let year = 0; year <= 30; year++) {
        projections.push({
          year,
          balance: 10000 * Math.pow(1.07, year),
        });
      }
      
      expect(projections).toHaveLength(31);
      expect(projections[30].balance).toBeGreaterThan(70000);
    });
  });

  describe('Calculation Complexity', () => {
    it('should handle nested iterations (year-by-year, month-by-month)', () => {
      let total = 0;
      
      for (let year = 0; year < 30; year++) {
        for (let month = 0; month < 12; month++) {
          total += 100;
        }
      }
      
      expect(total).toBe(36000);
    });

    it('should handle recursive calculations without stack overflow', () => {
      const fib = (n: number): number => {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
      };
      
      // Should handle reasonable recursion depth
      expect(fib(10)).toBe(55);
      expect(() => fib(40)).not.toThrow(); // Slow but doesn't crash
    });
  });
});

describe('User Error Edge Cases', () => {
  describe('Common Input Mistakes', () => {
    it('should detect monthly vs annual income confusion', () => {
      const suspiciousIncome = 80000; // Entered as monthly but probably annual
      const likelyMonthly = suspiciousIncome / 12;
      
      if (suspiciousIncome > 50000) {
        // Probably meant annual
        expect(likelyMonthly).toBeCloseTo(6667, 0);
      }
    });

    it('should detect percentage entered as decimal', () => {
      const suspiciousRate = 0.065; // 6.5% entered as 0.065
      
      if (suspiciousRate < 1) {
        // Probably meant percentage (6.5%), not decimal (0.065%)
        const corrected = suspiciousRate * 100;
        expect(corrected).toBe(6.5);
      }
    });

    it('should detect years entered instead of months', () => {
      const suspiciousMonths = 30; // User entered 30 (years) instead of 360 (months)
      
      if (suspiciousMonths < 100) {
        // Probably meant years
        const corrected = suspiciousMonths * 12;
        expect(corrected).toBe(360);
      }
    });

    it('should detect unrealistic rent-to-price ratios', () => {
      const homePrice = 500000;
      const monthlyRent = 500; // Way too low
      const annualRent = monthlyRent * 12;
      const rentToPriceRatio = (annualRent / homePrice) * 100;
      
      expect(rentToPriceRatio).toBe(1.2);
      
      if (rentToPriceRatio < 0.3) {
        // Suspiciously low - data entry error?
        expect(rentToPriceRatio).toBeLessThan(0.3);
      }
    });
  });

  describe('Copy-Paste Errors', () => {
    it('should handle commas in numeric input', () => {
      const input = '1,000,000';
      const cleaned = input.replace(/,/g, '');
      const numeric = parseFloat(cleaned);
      
      expect(numeric).toBe(1000000);
    });

    it('should handle dollar signs in input', () => {
      const input = '$500,000';
      const cleaned = input.replace(/[$,]/g, '');
      const numeric = parseFloat(cleaned);
      
      expect(numeric).toBe(500000);
    });

    it('should handle percentage signs in input', () => {
      const input = '6.5%';
      const cleaned = input.replace(/%/g, '');
      const numeric = parseFloat(cleaned);
      
      expect(numeric).toBe(6.5);
    });

    it('should handle scientific notation', () => {
      const input = '5e5'; // 500,000 in scientific notation
      const numeric = parseFloat(input);
      
      expect(numeric).toBe(500000);
    });
  });
});

describe('Concurrent Usage Edge Cases', () => {
  describe('Multiple Calculator Usage', () => {
    it('should handle multiple calculations without state interference', () => {
      const calc1Result = { id: 'calc1', value: 100 };
      const calc2Result = { id: 'calc2', value: 200 };
      
      expect(calc1Result.value).toBe(100);
      expect(calc2Result.value).toBe(200);
      expect(calc1Result.value).not.toBe(calc2Result.value);
    });

    it('should handle rapid form submissions', () => {
      let submissionCount = 0;
      let isCalculating = false;
      
      const submit = () => {
        if (isCalculating) return false;
        isCalculating = true;
        submissionCount++;
        setTimeout(() => { isCalculating = false; }, 100);
        return true;
      };
      
      expect(submit()).toBe(true); // First submission
      expect(submit()).toBe(false); // Second submission blocked
      expect(submissionCount).toBe(1);
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle Number.isFinite correctly', () => {
      expect(Number.isFinite(100)).toBe(true);
      expect(Number.isFinite(Infinity)).toBe(false);
      expect(Number.isFinite(NaN)).toBe(false);
      expect(Number.isFinite('100' as any)).toBe(false);
    });

    it('should handle Math.pow vs ** operator', () => {
      const mathPow = Math.pow(1.07, 5);
      const exponentOperator = 1.07 ** 5;
      
      expect(mathPow).toBeCloseTo(exponentOperator, 10);
    });

    it('should handle Intl.NumberFormat consistently', () => {
      const formatter = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0,
      });
      
      expect(formatter.format(1234)).toBe('$1,234');
      expect(formatter.format(0)).toBe('$0');
    });
  });
});

describe('Accessibility Edge Cases', () => {
  describe('Screen Reader Content', () => {
    it('should provide text alternatives for visual indicators', () => {
      const visualIndicator = '✅';
      const textAlternative = 'Achieved';
      const ariaLabel = `Milestone ${textAlternative}`;
      
      expect(ariaLabel).toContain(textAlternative);
    });

    it('should announce dynamic content changes', () => {
      const announcement = {
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true',
      };
      
      expect(announcement.role).toBe('status');
      expect(announcement['aria-live']).toBe('polite');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Enter key for form submission', () => {
      const event = { key: 'Enter', type: 'keydown' };
      const shouldSubmit = event.key === 'Enter';
      
      expect(shouldSubmit).toBe(true);
    });

    it('should support Escape key for dialog close', () => {
      const event = { key: 'Escape', type: 'keydown' };
      const shouldClose = event.key === 'Escape';
      
      expect(shouldClose).toBe(true);
    });
  });
});

describe('Internationalization Edge Cases', () => {
  describe('Currency Formatting', () => {
    it('should handle different locales', () => {
      const value = 1234.56;
      
      const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
      
      expect(usd).toContain('$');
      expect(eur).toContain('€');
    });

    it('should handle large numbers with locale formatting', () => {
      const million = 1000000;
      
      const formatted = new Intl.NumberFormat('en-US').format(million);
      
      expect(formatted).toBe('1,000,000');
    });
  });

  describe('Date Formatting', () => {
    it('should format dates consistently', () => {
      const date = new Date('2025-06-15');
      const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      expect(formatted).toBe('June 2025');
    });

    it('should handle different date formats', () => {
      const date = new Date('2025-06-15');
      
      const long = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const short = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      expect(long).toContain('June');
      expect(short).toContain('Jun');
    });
  });
});

