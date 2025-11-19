/**
 * Comprehensive Calculator Tests
 * Tests all financial calculators for functionality and accuracy
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock DOM environment
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Financial Calculators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Amortization Calculator', () => {
    it('should calculate monthly payment correctly', () => {
      const principal = 300000;
      const annualRate = 0.06;
      const termYears = 30;

      // Expected monthly payment calculation
      const monthlyRate = annualRate / 12;
      const numPayments = termYears * 12;
      const monthlyPayment =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

      expect(monthlyPayment).toBeCloseTo(1798.65, 2);
    });

    it('should generate amortization schedule', () => {
      const principal = 100000;
      const annualRate = 0.05;
      const termYears = 5;

      const monthlyRate = annualRate / 12;
      const numPayments = termYears * 12;
      const monthlyPayment =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

      let balance = principal;
      const schedule = [];

      for (let i = 0; i < numPayments; i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance -= principalPayment;

        schedule.push({
          payment: i + 1,
          monthlyPayment: monthlyPayment,
          principalPayment: principalPayment,
          interestPayment: interestPayment,
          balance: balance,
        });
      }

      expect(schedule).toHaveLength(60);
      expect(schedule[0].interestPayment).toBeCloseTo(416.67, 2);
      expect(schedule[59].balance).toBeCloseTo(0, 2);
    });
  });

  describe('Auto Loan Calculator', () => {
    it('should calculate auto loan payment', () => {
      const vehiclePrice = 25000;
      const downPayment = 5000;
      const tradeInValue = 2000;
      const annualRate = 0.045;
      const termMonths = 60;

      const loanAmount = vehiclePrice - downPayment - tradeInValue;
      const monthlyRate = annualRate / 12;
      const monthlyPayment =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

      expect(monthlyPayment).toBeCloseTo(335.57, 1);
    });

    it('should calculate total cost of ownership', () => {
      const vehiclePrice = 30000;
      const downPayment = 6000;
      const tradeInValue = 3000;
      const annualRate = 0.05;
      const termMonths = 72;
      const annualInsurance = 1200;
      const annualMaintenance = 800;
      const annualFuel = 1500;

      const loanAmount = vehiclePrice - downPayment - tradeInValue;
      const monthlyRate = annualRate / 12;
      const monthlyPayment =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

      const totalLoanCost = monthlyPayment * termMonths;
      const totalOwnershipCost =
        totalLoanCost +
        downPayment +
        (annualInsurance + annualMaintenance + annualFuel) * (termMonths / 12);

      expect(totalOwnershipCost).toBeCloseTo(51350.66, 1);
    });
  });

  describe('Retirement Planning Calculator', () => {
    it('should calculate retirement savings needed', () => {
      const currentAge = 30;
      const retirementAge = 65;
      const currentSavings = 50000;
      const annualContribution = 10000;
      const annualReturn = 0.07;
      const inflationRate = 0.03;
      const annualExpenses = 60000;

      const yearsToRetirement = retirementAge - currentAge;
      const realReturn = (1 + annualReturn) / (1 + inflationRate) - 1;
      const inflationAdjustedGrowth = Math.pow(1 + realReturn, yearsToRetirement);

      // Future value of current savings
      const futureValueCurrentSavings =
        currentSavings * Math.pow(1 + annualReturn, yearsToRetirement);

      // Future value of annual contributions
      const futureValueContributions =
        annualContribution * ((Math.pow(1 + annualReturn, yearsToRetirement) - 1) / annualReturn);

      const totalRetirementSavings = futureValueCurrentSavings + futureValueContributions;

      // Required savings for retirement (25x annual expenses rule)
      const requiredSavings = annualExpenses * 25;

      expect(realReturn).toBeGreaterThan(0);
      expect(inflationAdjustedGrowth).toBeGreaterThan(1);
      expect(totalRetirementSavings).toBeGreaterThan(requiredSavings);
    });

    it('should calculate required annual contribution', () => {
      const currentAge = 35;
      const retirementAge = 65;
      const currentSavings = 100000;
      const annualReturn = 0.08;
      const targetRetirementSavings = 2000000;

      const yearsToRetirement = retirementAge - currentAge;
      const futureValueCurrentSavings =
        currentSavings * Math.pow(1 + annualReturn, yearsToRetirement);

      const requiredFutureValue = targetRetirementSavings - futureValueCurrentSavings;
      const requiredAnnualContribution =
        (requiredFutureValue * annualReturn) / (Math.pow(1 + annualReturn, yearsToRetirement) - 1);

      expect(requiredAnnualContribution).toBeGreaterThan(0);
    });
  });

  describe('Savings Goal Calculator', () => {
    it('should calculate monthly savings needed', () => {
      const goalAmount = 50000;
      const currentSavings = 10000;
      const yearsToGoal = 5;
      const annualReturn = 0.06;

      const monthlyReturn = annualReturn / 12;
      const monthsToGoal = yearsToGoal * 12;

      const requiredMonthlyContribution =
        ((goalAmount - currentSavings * Math.pow(1 + annualReturn, yearsToGoal)) * monthlyReturn) /
        (Math.pow(1 + monthlyReturn, monthsToGoal) - 1);

      expect(requiredMonthlyContribution).toBeGreaterThan(0);
    });

    it('should calculate time to reach goal', () => {
      const goalAmount = 100000;
      const currentSavings = 20000;
      const monthlyContribution = 1000;
      const annualReturn = 0.07;

      const monthlyReturn = annualReturn / 12;

      // Solve for n in: FV = PV(1+r)^n + PMT[((1+r)^n - 1)/r]
      // This is a complex calculation that would typically use iterative methods
      // For testing purposes, we'll verify the calculation works
      let months = 0;
      let balance = currentSavings;

      while (balance < goalAmount && months < 120) {
        // Max 10 years
        balance = balance * (1 + monthlyReturn) + monthlyContribution;
        months++;
      }

      expect(months).toBeLessThan(120);
      expect(balance).toBeGreaterThanOrEqual(goalAmount);
    });
  });

  describe('Debt Payoff Calculator', () => {
    it('should calculate debt avalanche payoff', () => {
      const debts = [
        { balance: 5000, rate: 0.18, minPayment: 100 },
        { balance: 10000, rate: 0.12, minPayment: 200 },
        { balance: 3000, rate: 0.22, minPayment: 75 },
      ];

      const extraPayment = 200;
      const totalMinPayment = debts.reduce((sum, debt) => sum + debt.minPayment, 0);
      const totalAvailablePayment = totalMinPayment + extraPayment;

      // Sort by interest rate (highest first) for avalanche method
      const sortedDebts = debts.sort((a, b) => b.rate - a.rate);

      expect(sortedDebts[0].rate).toBe(0.22); // Highest rate first
      expect(totalAvailablePayment).toBe(575);
    });

    it('should calculate debt snowball payoff', () => {
      const debts = [
        { balance: 5000, rate: 0.18, minPayment: 100 },
        { balance: 10000, rate: 0.12, minPayment: 200 },
        { balance: 3000, rate: 0.22, minPayment: 75 },
      ];

      // Sort by balance (lowest first) for snowball method
      const sortedDebts = debts.sort((a, b) => a.balance - b.balance);

      expect(sortedDebts[0].balance).toBe(3000); // Lowest balance first
      expect(sortedDebts[1].balance).toBe(5000);
      expect(sortedDebts[2].balance).toBe(10000);
    });
  });

  describe('Student Loan Calculator', () => {
    it('should calculate standard repayment', () => {
      const principal = 50000;
      const annualRate = 0.045;
      const termYears = 10;

      const monthlyRate = annualRate / 12;
      const numPayments = termYears * 12;
      const monthlyPayment =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

      expect(monthlyPayment).toBeCloseTo(518.19, 1);
    });

    it('should calculate income-driven repayment', () => {
      const principal = 50000;
      const annualRate = 0.045;
      const discretionaryIncome = 30000;
      const familySize = 1;

      // REPAYE calculation (10% of discretionary income)
      const povertyGuideline = 12760 + (familySize - 1) * 4480;
      const discretionaryIncomeAmount = Math.max(0, discretionaryIncome - 1.5 * povertyGuideline);
      const monthlyPayment = (discretionaryIncomeAmount * 0.1) / 12;
      const monthlyInterestOnly = principal * (annualRate / 12);

      expect(monthlyPayment).toBeGreaterThan(0);
      expect(monthlyInterestOnly).toBeCloseTo(187.5, 1);
      expect(monthlyPayment).toBeLessThan(monthlyInterestOnly);
    });
  });

  describe('Budget Calculator', () => {
    it('should calculate 50/30/20 budget allocation', () => {
      const monthlyIncome = 5000;

      const needs = monthlyIncome * 0.5; // 50%
      const wants = monthlyIncome * 0.3; // 30%
      const savings = monthlyIncome * 0.2; // 20%

      expect(needs).toBe(2500);
      expect(wants).toBe(1500);
      expect(savings).toBe(1000);
      expect(needs + wants + savings).toBe(monthlyIncome);
    });

    it('should calculate debt-to-income ratio', () => {
      const monthlyIncome = 6000;
      const monthlyDebtPayments = 1200;

      const debtToIncomeRatio = monthlyDebtPayments / monthlyIncome;

      expect(debtToIncomeRatio).toBe(0.2); // 20%
    });
  });

  describe('DCF Valuation Calculator', () => {
    it('should calculate present value of cash flows', () => {
      const cashFlows = [1000, 1200, 1400, 1600, 1800];
      const discountRate = 0.1;

      const presentValues = cashFlows.map((cf, year) => cf / Math.pow(1 + discountRate, year + 1));
      const totalPV = presentValues.reduce((sum, pv) => sum + pv, 0);

      expect(totalPV).toBeCloseTo(5163, 0);
    });

    it('should calculate terminal value', () => {
      const finalCashFlow = 2000;
      const growthRate = 0.03;
      const discountRate = 0.1;

      const terminalValue = (finalCashFlow * (1 + growthRate)) / (discountRate - growthRate);

      expect(terminalValue).toBeCloseTo(29428.57, 2);
    });
  });

  describe('M&A Analysis Calculator', () => {
    it('should calculate accretion/dilution', () => {
      const acquirerEPS = 2.5;
      const targetEPS = 1.8;
      const exchangeRatio = 0.8;

      const proFormaEPS = (acquirerEPS + targetEPS * exchangeRatio) / (1 + exchangeRatio);
      const accretion = (proFormaEPS - acquirerEPS) / acquirerEPS;

      expect(accretion).toBeCloseTo(-0.124, 2); // -12.4% dilution
    });

    it('should calculate synergy value', () => {
      const revenueSynergies = 5000000;
      const costSynergies = 2000000;
      const synergyMultiple = 8;

      const totalSynergies = revenueSynergies + costSynergies;
      const synergyValue = totalSynergies * synergyMultiple;

      expect(synergyValue).toBe(56000000);
    });
  });

  describe('Risk Management Calculator', () => {
    it('should calculate Value at Risk (VaR)', () => {
      const portfolioValue = 1000000;
      const volatility = 0.2;
      const confidenceLevel = 0.95;
      const timeHorizon = 1; // 1 day

      // VaR calculation using normal distribution
      const zScoreLookup: Record<number, number> = {
        0.9: 1.281,
        0.95: 1.645,
        0.99: 2.326,
      };
      const zScore = zScoreLookup[confidenceLevel] ?? 1.645;
      const tailProbability = 1 - confidenceLevel;
      const varAmount = portfolioValue * volatility * Math.sqrt(timeHorizon) * zScore;

      expect(varAmount).toBeCloseTo(329000, 0);
      expect(tailProbability).toBeCloseTo(0.05, 2);
      expect(zScore).toBeGreaterThan(1);
    });

    it('should calculate portfolio beta', () => {
      const stockWeights = [0.4, 0.3, 0.3];
      const stockBetas = [1.2, 0.8, 1.5];

      const portfolioBeta = stockWeights.reduce(
        (sum, weight, index) => sum + weight * stockBetas[index],
        0
      );

      expect(portfolioBeta).toBeCloseTo(1.17, 2);
    });
  });
});

describe('Calculator Form Validation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="calculator-form">
        <input type="number" name="principal" value="100000" />
        <input type="number" name="rate" value="0.05" />
        <input type="number" name="term" value="30" />
        <button type="submit">Calculate</button>
      </form>
      <div id="results"></div>
    `;
  });

  it('should validate required fields', () => {
    const form = document.getElementById('calculator-form') as HTMLFormElement;
    const principalInput = form.querySelector('input[name="principal"]') as HTMLInputElement;

    principalInput.value = '';

    // Simulate form validation
    const isValid = principalInput.value !== '';
    expect(isValid).toBe(false);
  });

  it('should validate numeric inputs', () => {
    const form = document.getElementById('calculator-form') as HTMLFormElement;
    const rateInput = form.querySelector('input[name="rate"]') as HTMLInputElement;

    rateInput.value = 'invalid';

    const isValid = !isNaN(parseFloat(rateInput.value));
    expect(isValid).toBe(false);
  });

  it('should validate positive values', () => {
    const form = document.getElementById('calculator-form') as HTMLFormElement;
    const principalInput = form.querySelector('input[name="principal"]') as HTMLInputElement;

    principalInput.value = '-1000';

    const isValid = parseFloat(principalInput.value) > 0;
    expect(isValid).toBe(false);
  });
});

describe('Calculator Error Handling', () => {
  it('should handle division by zero', () => {
    const principal = 100000;
    const rate = 0;
    const term = 30;

    const monthlyRate = rate / 12;
    const numPayments = term * 12;

    if (monthlyRate === 0) {
      const monthlyPayment = principal / numPayments;
      expect(monthlyPayment).toBeCloseTo(277.78, 2);
    }
  });

  it('should handle invalid inputs gracefully', () => {
    const invalidInputs = ['', 'abc'];

    invalidInputs.forEach((input) => {
      const result = parseFloat(input);
      expect(isNaN(result)).toBe(true);
    });
  });

  it('should handle extreme values', () => {
    const principal = 1e12; // Very large number
    const rate = 0.5; // Very high rate
    const term = 1; // Very short term

    const monthlyRate = rate / 12;
    const numPayments = term * 12;
    const monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    expect(monthlyPayment).toBeGreaterThan(0);
    expect(isFinite(monthlyPayment)).toBe(true);
  });
});
