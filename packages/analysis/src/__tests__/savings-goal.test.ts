import { describe, it, expect } from 'vitest';
import * as SavingsGoalEngine from '../engines/savings-goal.js';
import type { SavingsGoalInput } from '../schemas/savings-goal.js';

describe('SavingsGoalEngine', () => {
  it('should calculate time to reach savings goal', () => {
    const input: SavingsGoalInput = {
      goalAmount: 20000,
      currentSavings: 5000,
      monthlyContribution: 500,
      annualReturnRate: 0.05,
      inflationRate: 0.03,
      goalType: 'general',
    };

    const result = SavingsGoalEngine.analyze(input);

    expect(result.summary.goalAmount).toBe('20000.00');
    expect(result.summary.currentSavings).toBe('5000.00');
    expect(result.summary.monthlyContribution).toBe('500.00');
    expect(result.summary.monthsToGoal).toBeGreaterThan(0);
    expect(result.summary.monthsToGoal).toBeLessThanOrEqual(36);
    expect(result.savingsSchedule.length).toBe(result.summary.monthsToGoal);
  });

  it('should handle emergency fund goal type', () => {
    const input: SavingsGoalInput = {
      goalAmount: 18000,
      currentSavings: 2000,
      monthlyContribution: 800,
      annualReturnRate: 0.02,
      inflationRate: 0.03,
      goalType: 'emergency_fund',
    };

    const result = SavingsGoalEngine.analyze(input);

    expect(result.recommendations.goalType).toBe('emergency_fund');
    expect(result.recommendations.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.targetMultiplier).toBe('6');
  });

  it('should generate month-by-month schedule', () => {
    const input: SavingsGoalInput = {
      goalAmount: 10000,
      currentSavings: 8000,
      monthlyContribution: 500,
      annualReturnRate: 0.04,
      inflationRate: 0.02,
      goalType: 'general',
    };

    const result = SavingsGoalEngine.analyze(input);

    expect(result.savingsSchedule.length).toBeGreaterThan(0);

    const firstMonth = result.savingsSchedule[0];
    expect(firstMonth).toBeDefined();
    if (firstMonth) {
      expect(firstMonth.month).toBe(1);
      expect(firstMonth.contribution).toBe('500.00');
      expect(parseFloat(firstMonth.interest)).toBeGreaterThan(0);
      expect(parseFloat(firstMonth.balance)).toBeGreaterThan(8000);
      expect(parseFloat(firstMonth.realValue)).toBeGreaterThan(0);
    }
  });

  it('should account for inflation impact', () => {
    const input: SavingsGoalInput = {
      goalAmount: 50000,
      currentSavings: 10000,
      monthlyContribution: 1000,
      annualReturnRate: 0.07,
      inflationRate: 0.03,
      goalType: 'retirement',
    };

    const result = SavingsGoalEngine.analyze(input);

    const inflationImpact = parseFloat(result.summary.inflationImpact);
    const finalBalance = parseFloat(result.summary.finalBalance);
    const realValue = parseFloat(result.summary.realValueAtGoal);

    expect(inflationImpact).toBeGreaterThan(0);
    expect(realValue).toBeLessThan(finalBalance);
    expect(parseFloat(result.summary.effectiveAnnualReturn)).toBe(4.0);
  });

  it('should provide alternative scenarios', () => {
    const input: SavingsGoalInput = {
      goalAmount: 30000,
      currentSavings: 5000,
      monthlyContribution: 400,
      annualReturnRate: 0.06,
      inflationRate: 0.025,
      goalType: 'home_down_payment',
    };

    const result = SavingsGoalEngine.analyze(input);

    expect(result.alternativeScenarios.length).toBeGreaterThan(0);

    const firstScenario = result.alternativeScenarios[0];
    expect(firstScenario).toBeDefined();
    if (firstScenario) {
      expect(firstScenario.description).toBeDefined();
      expect(firstScenario.requiredMonthlyContribution).toBeDefined();
      expect(firstScenario.monthsToGoal).toBeDefined();
    }
  });

  it('should handle goal already met', () => {
    const input: SavingsGoalInput = {
      goalAmount: 10000,
      currentSavings: 12000,
      monthlyContribution: 0,
      annualReturnRate: 0.03,
      inflationRate: 0.02,
      goalType: 'general',
    };

    const result = SavingsGoalEngine.analyze(input);

    expect(result.summary.monthsToGoal).toBe(0);
    expect(result.savingsSchedule.length).toBe(0);
  });

  it('should calculate with fixed time horizon', () => {
    const input: SavingsGoalInput = {
      goalAmount: 100000,
      currentSavings: 20000,
      monthlyContribution: 1500,
      annualReturnRate: 0.08,
      inflationRate: 0.03,
      timeHorizonMonths: 48,
      goalType: 'education',
    };

    const result = SavingsGoalEngine.analyze(input);

    // Goal reached before fixed timeHorizon (in 43 months instead of 48)
    expect(result.summary.monthsToGoal).toBeLessThanOrEqual(48);
    expect(result.savingsSchedule.length).toBe(result.summary.monthsToGoal);
    expect(result.input.timeHorizonMonths).toBe(48);
  });
});
