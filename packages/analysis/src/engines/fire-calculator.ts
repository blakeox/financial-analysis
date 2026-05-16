/**
 * FIRE (Financial Independence, Retire Early) Calculator
 * Calculate retirement date, safe withdrawal rate, and FIRE strategies
 */

import { Decimal } from 'decimal.js';
import type { FIRECalculatorInput } from '../schemas/fire-calculator.js';

export class FIRECalculator {
  /**
   * Calculate FIRE projections and strategies
   */
  static analyze(input: FIRECalculatorInput): unknown {
    const currentSituation = input.currentSituation;
    const fireGoals = input.fireGoals;
    const assumptions = input.assumptions;
    const analysis = input.analysis;

    // Calculate FIRE number
    const fireNumber = this.calculateFIRENumber(fireGoals);

    // Calculate years to FIRE
    const yearsToFIRE = this.calculateYearsToFIRE(
      currentSituation,
      fireNumber,
      assumptions,
      fireGoals
    );

    // Projected retirement date
    const projectedRetirementAge = currentSituation.age + yearsToFIRE.years;

    // Coast FIRE calculation
    const coastFIRE = this.calculateCoastFIRE(currentSituation, fireGoals, assumptions);

    // Barista FIRE calculation
    const baristaFIRE = this.calculateBaristaFIRE(currentSituation, fireGoals, assumptions);

    // Projections
    const projections = analysis.includeProjections
      ? this.projectSavings(currentSituation, fireNumber, assumptions, yearsToFIRE.years)
      : undefined;

    // Scenarios
    const scenarios = analysis.includeScenarios
      ? this.analyzeScenarios(currentSituation, fireGoals, assumptions)
      : undefined;

    // Expense optimization
    const expenseOptimization = analysis.includeExpenseOptimization
      ? this.optimizeExpenses(currentSituation, fireGoals, assumptions)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      yearsToFIRE,
      projectedRetirementAge,
      fireGoals.targetAge,
      coastFIRE,
      baristaFIRE,
      expenseOptimization
    );

    return {
      summary: {
        fireNumber,
        yearsToFIRE: yearsToFIRE.years,
        projectedRetirementAge,
        currentSavings: currentSituation.currentSavings,
        savingsNeeded: fireNumber - currentSituation.currentSavings,
        onTrack: projectedRetirementAge <= fireGoals.targetAge,
      },
      fireNumber,
      yearsToFIRE,
      projectedRetirementAge,
      coastFIRE,
      baristaFIRE,
      projections,
      scenarios,
      expenseOptimization,
      recommendations,
    };
  }

  private static calculateFIRENumber(fireGoals: FIRECalculatorInput['fireGoals']): number {
    // FIRE number = Annual expenses / Safe withdrawal rate
    return fireGoals.annualExpensesInRetirement / fireGoals.safeWithdrawalRate;
  }

  private static calculateYearsToFIRE(
    currentSituation: FIRECalculatorInput['currentSituation'],
    fireNumber: number,
    assumptions: FIRECalculatorInput['assumptions'],
    fireGoals: FIRECalculatorInput['fireGoals']
  ): {
    years: number;
    monthlySavingsNeeded: number;
    savingsRate: number;
  } {
    const currentSavings = currentSituation.currentSavings;
    const monthlySavings = currentSituation.monthlySavings;
    const annualSavings = monthlySavings * 12;
    const savingsRate =
      currentSituation.annualIncome > 0 ? annualSavings / currentSituation.annualIncome : 0;

    // Use future value of annuity formula to solve for years
    // FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
    // Solve for n where FV = fireNumber

    let years = 0;
    let balance = currentSavings;
    const monthlyReturn = assumptions.expectedReturn / 12;

    while (balance < fireNumber && years < 100) {
      balance = balance * (1 + monthlyReturn) + monthlySavings;
      years += 1 / 12; // Increment by month
    }

    // Calculate required monthly savings if current path doesn't reach goal
    const requiredMonthlySavings =
      currentSavings >= fireNumber
        ? 0
        : this.calculateRequiredSavings(
            currentSavings,
            fireNumber,
            assumptions.expectedReturn,
            fireGoals.targetAge - currentSituation.age
          );

    return {
      years: Math.ceil(years),
      monthlySavingsNeeded: requiredMonthlySavings,
      savingsRate,
    };
  }

  private static calculateRequiredSavings(
    currentSavings: number,
    targetAmount: number,
    annualReturn: number,
    years: number
  ): number {
    if (years <= 0) return 0;

    const monthlyReturn = annualReturn / 12;
    const months = years * 12;
    const futureValueOfCurrent = currentSavings * Math.pow(1 + monthlyReturn, months);
    const needed = targetAmount - futureValueOfCurrent;

    if (needed <= 0) return 0;

    const onePlusR = new Decimal(1).plus(monthlyReturn);
    const onePlusRPowN = onePlusR.pow(months);
    const numerator = onePlusRPowN.minus(1);
    const denominator = new Decimal(monthlyReturn);
    const monthlyPayment = new Decimal(needed).div(numerator).times(denominator).toNumber();

    return monthlyPayment;
  }

  private static calculateCoastFIRE(
    currentSituation: FIRECalculatorInput['currentSituation'],
    fireGoals: FIRECalculatorInput['fireGoals'],
    assumptions: FIRECalculatorInput['assumptions']
  ): {
    coastFIRENumber: number;
    yearsToCoastFIRE: number;
    coastFIREAge: number;
    interpretation: string;
  } {
    // Coast FIRE: enough saved that it will grow to FIRE number by retirement age without additional contributions
    const fireNumber = this.calculateFIRENumber(fireGoals);
    const yearsToRetirement = fireGoals.targetAge - currentSituation.age;

    if (yearsToRetirement <= 0) {
      return {
        coastFIRENumber: fireNumber,
        yearsToCoastFIRE: 0,
        coastFIREAge: currentSituation.age,
        interpretation: 'Already at or past target retirement age',
      };
    }

    // PV = FV / (1 + r)^n
    const coastFIRENumber =
      fireNumber / Math.pow(1 + assumptions.expectedReturn, yearsToRetirement);

    const yearsToCoastFIRE = this.calculateYearsToFIRE(
      currentSituation,
      coastFIRENumber,
      assumptions,
      fireGoals
    ).years;

    const coastFIREAge = currentSituation.age + yearsToCoastFIRE;

    return {
      coastFIRENumber,
      yearsToCoastFIRE,
      coastFIREAge,
      interpretation:
        coastFIREAge <= currentSituation.age
          ? 'You have reached Coast FIRE - your savings will grow to FIRE number without additional contributions'
          : `Reach Coast FIRE at age ${coastFIREAge.toFixed(0)} - then you can stop saving and let compound growth do the work`,
    };
  }

  private static calculateBaristaFIRE(
    _currentSituation: FIRECalculatorInput['currentSituation'],
    fireGoals: FIRECalculatorInput['fireGoals'],
    _assumptions: FIRECalculatorInput['assumptions']
  ): {
    baristaFIRENumber: number;
    partTimeIncomeNeeded: number;
    interpretation: string;
  } {
    // Barista FIRE: enough saved to cover part of expenses, part-time work covers the rest
    const fireNumber = this.calculateFIRENumber(fireGoals);
    const baristaFIRENumber = fireNumber * 0.5; // Assume 50% coverage from savings

    const annualWithdrawal = baristaFIRENumber * fireGoals.safeWithdrawalRate;
    const partTimeIncomeNeeded = fireGoals.annualExpensesInRetirement - annualWithdrawal;

    return {
      baristaFIRENumber,
      partTimeIncomeNeeded,
      interpretation: `With $${baristaFIRENumber.toFixed(0)} saved, you need $${partTimeIncomeNeeded.toFixed(0)}/year from part-time work to cover expenses`,
    };
  }

  private static projectSavings(
    currentSituation: FIRECalculatorInput['currentSituation'],
    fireNumber: number,
    assumptions: FIRECalculatorInput['assumptions'],
    yearsToFIRE: number
  ): {
    projections: Array<{
      year: number;
      age: number;
      savings: number;
      annualContribution: number;
      growth: number;
      progress: number;
    }>;
    milestones: Array<{
      milestone: string;
      age: number;
      savings: number;
    }>;
  } {
    const projections: Array<{
      year: number;
      age: number;
      savings: number;
      annualContribution: number;
      growth: number;
      progress: number;
    }> = [];

    let savings = currentSituation.currentSavings;
    const annualContribution = currentSituation.monthlySavings * 12;

    for (let year = 0; year <= Math.ceil(yearsToFIRE); year++) {
      const age = currentSituation.age + year;
      const growth = savings * assumptions.expectedReturn;
      savings = savings * (1 + assumptions.expectedReturn) + annualContribution;
      const progress = fireNumber > 0 ? (savings / fireNumber) * 100 : 0;

      projections.push({
        year,
        age,
        savings,
        annualContribution,
        growth,
        progress: Math.min(100, progress),
      });
    }

    // Milestones
    const milestones: Array<{ milestone: string; savings: number; age: number }> = [];
    const quarterFIRE = fireNumber * 0.25;
    const halfFIRE = fireNumber * 0.5;
    const threeQuarterFIRE = fireNumber * 0.75;

    projections.forEach((proj) => {
      if (proj.savings >= quarterFIRE && !milestones.find((m) => m.milestone === '25% FIRE')) {
        milestones.push({ milestone: '25% FIRE', savings: quarterFIRE, age: proj.age });
      }
      if (proj.savings >= halfFIRE && !milestones.find((m) => m.milestone === '50% FIRE')) {
        milestones.push({ milestone: '50% FIRE', savings: halfFIRE, age: proj.age });
      }
      if (proj.savings >= threeQuarterFIRE && !milestones.find((m) => m.milestone === '75% FIRE')) {
        milestones.push({ milestone: '75% FIRE', savings: threeQuarterFIRE, age: proj.age });
      }
      if (proj.savings >= fireNumber && !milestones.find((m) => m.milestone === '100% FIRE')) {
        milestones.push({ milestone: '100% FIRE', savings: fireNumber, age: proj.age });
      }
    });

    return {
      projections,
      milestones,
    };
  }

  private static analyzeScenarios(
    currentSituation: FIRECalculatorInput['currentSituation'],
    fireGoals: FIRECalculatorInput['fireGoals'],
    _assumptions: FIRECalculatorInput['assumptions']
  ): {
    optimistic: { yearsToFIRE: number; retirementAge: number };
    base: { yearsToFIRE: number; retirementAge: number };
    pessimistic: { yearsToFIRE: number; retirementAge: number };
  } {
    const fireNumber = this.calculateFIRENumber(fireGoals);

    const base = this.calculateYearsToFIRE(currentSituation, fireNumber, _assumptions, fireGoals);
    const optimistic = this.calculateYearsToFIRE(
      currentSituation,
      fireNumber,
      {
        ..._assumptions,
        expectedReturn: _assumptions.expectedReturn * 1.2,
        incomeGrowth: _assumptions.incomeGrowth * 1.2,
      },
      fireGoals
    );
    const pessimistic = this.calculateYearsToFIRE(
      currentSituation,
      fireNumber,
      {
        ..._assumptions,
        expectedReturn: _assumptions.expectedReturn * 0.8,
        incomeGrowth: _assumptions.incomeGrowth * 0.8,
      },
      fireGoals
    );

    return {
      optimistic: {
        yearsToFIRE: optimistic.years,
        retirementAge: currentSituation.age + optimistic.years,
      },
      base: {
        yearsToFIRE: base.years,
        retirementAge: currentSituation.age + base.years,
      },
      pessimistic: {
        yearsToFIRE: pessimistic.years,
        retirementAge: currentSituation.age + pessimistic.years,
      },
    };
  }

  private static optimizeExpenses(
    currentSituation: FIRECalculatorInput['currentSituation'],
    fireGoals: FIRECalculatorInput['fireGoals'],
    _assumptions: FIRECalculatorInput['assumptions']
  ): {
    currentSavingsRate: number;
    optimizedSavingsRate: number;
    yearsSaved: number;
    recommendations: string[];
  } {
    const currentSavingsRate =
      currentSituation.annualIncome > 0
        ? (currentSituation.monthlySavings * 12) / currentSituation.annualIncome
        : 0;

    // Optimize by reducing expenses
    const expenseReduction = _assumptions.expenseReduction;
    const optimizedExpenses = currentSituation.annualExpenses * (1 - expenseReduction);
    const optimizedSavings = currentSituation.annualIncome - optimizedExpenses;
    const optimizedSavingsRate =
      currentSituation.annualIncome > 0 ? optimizedSavings / currentSituation.annualIncome : 0;

    const fireNumber = this.calculateFIRENumber(fireGoals);
    const currentYears = this.calculateYearsToFIRE(
      currentSituation,
      fireNumber,
      _assumptions,
      fireGoals
    ).years;
    const optimizedYears = this.calculateYearsToFIRE(
      { ...currentSituation, monthlySavings: optimizedSavings / 12 },
      fireNumber,
      _assumptions,
      fireGoals
    ).years;

    const yearsSaved = currentYears - optimizedYears;

    const recommendations: string[] = [];
    if (expenseReduction > 0) {
      recommendations.push(
        `Reducing expenses by ${(expenseReduction * 100).toFixed(0)}% saves ${yearsSaved.toFixed(1)} years to FIRE`
      );
      recommendations.push(
        `Optimized savings rate: ${(optimizedSavingsRate * 100).toFixed(1)}% (current: ${(currentSavingsRate * 100).toFixed(1)}%)`
      );
    }

    return {
      currentSavingsRate,
      optimizedSavingsRate,
      yearsSaved,
      recommendations,
    };
  }

  private static generateRecommendations(
    yearsToFIRE: { years: number; monthlySavingsNeeded: number },
    projectedRetirementAge: number,
    targetAge: number,
    coastFIRE?: { coastFIREAge: number; interpretation: string },
    baristaFIRE?: { interpretation: string },
    expenseOptimization?: { recommendations: string[] }
  ): string[] {
    const recommendations: string[] = [];

    if (projectedRetirementAge <= targetAge) {
      recommendations.push(
        `✅ On track! Projected to reach FIRE at age ${projectedRetirementAge.toFixed(0)}`
      );
    } else {
      recommendations.push(
        `⚠️ Off track by ${(projectedRetirementAge - targetAge).toFixed(0)} years - need to increase savings or adjust goals`
      );
      if (yearsToFIRE.monthlySavingsNeeded > 0) {
        recommendations.push(
          `Required monthly savings: $${yearsToFIRE.monthlySavingsNeeded.toFixed(0)} to reach FIRE by target age`
        );
      }
    }

    if (coastFIRE) {
      recommendations.push(coastFIRE.interpretation);
    }

    if (baristaFIRE) {
      recommendations.push(baristaFIRE.interpretation);
    }

    if (expenseOptimization) {
      recommendations.push(...expenseOptimization.recommendations);
    }

    recommendations.push(
      'Consider increasing savings rate, reducing expenses, or adjusting retirement age'
    );
    recommendations.push('Monitor progress annually and adjust strategy as needed');

    return recommendations;
  }
}
