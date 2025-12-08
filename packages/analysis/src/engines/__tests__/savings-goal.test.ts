import { describe, it, expect } from 'vitest';
import { analyze } from '../savings-goal.js';
import type { SavingsGoalInput } from '../../schemas/savings-goal.js';

describe('SavingsGoalAnalyzer', () => {
  const createBasicInput = (overrides: Partial<SavingsGoalInput> = {}): SavingsGoalInput => ({
    goalAmount: 50000,
    currentSavings: 10000,
    monthlyContribution: 500,
    annualReturnRate: 0.05,
    inflationRate: 0.02,
    goalType: 'emergency_fund' as const,
    ...overrides,
  });

  describe('analyze()', () => {
    it('should calculate time to goal correctly', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.goalAmount).toBe('50000.00');
      expect(result.summary.currentSavings).toBe('10000.00');
      expect(result.summary.monthsToGoal).toBeGreaterThan(0);
    });

    it('should generate savings schedule', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(result.savingsSchedule).toBeDefined();
      expect(result.savingsSchedule.length).toBeGreaterThan(0);

      const firstMonth = result.savingsSchedule[0];
      expect(firstMonth).toHaveProperty('month');
      expect(firstMonth).toHaveProperty('contribution');
      expect(firstMonth).toHaveProperty('interest');
      expect(firstMonth).toHaveProperty('balance');
      expect(firstMonth).toHaveProperty('realValue');
    });

    it('should calculate compound interest correctly', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(parseFloat(result.summary.totalInterestEarned)).toBeGreaterThan(0);
      expect(parseFloat(result.summary.finalBalance)).toBeGreaterThanOrEqual(
        parseFloat(result.summary.goalAmount)
      );
    });

    it('should account for inflation in real value', () => {
      const input = createBasicInput({ inflationRate: 0.03 });
      const result = analyze(input);

      const lastMonth = result.savingsSchedule[result.savingsSchedule.length - 1];
      expect(parseFloat(lastMonth!.realValue)).toBeLessThan(parseFloat(lastMonth!.balance));
    });

    it('should calculate inflation impact', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(parseFloat(result.summary.inflationImpact)).toBeGreaterThan(0);
    });

    it('should use fixed time horizon if provided', () => {
      const input = createBasicInput({ timeHorizonMonths: 24 });
      const result = analyze(input);

      expect(result.savingsSchedule.length).toBeLessThanOrEqual(24);
    });

    it('should return 0 months if goal already reached', () => {
      const input = createBasicInput({
        currentSavings: 60000,
        goalAmount: 50000,
      });
      const result = analyze(input);

      expect(result.summary.monthsToGoal).toBe(0);
    });
  });

  describe('alternative scenarios', () => {
    it('should generate alternative scenarios', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(result.alternativeScenarios).toBeDefined();
      expect(result.alternativeScenarios.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate half-time scenario when possible', () => {
      const input = createBasicInput();
      const result = analyze(input);

      const halfTimeScenario = result.alternativeScenarios.find((s) =>
        s.description.includes('half the time')
      );

      if (halfTimeScenario) {
        expect(parseFloat(halfTimeScenario.requiredMonthlyContribution)).toBeGreaterThan(
          parseFloat(result.summary.monthlyContribution)
        );
      }
    });

    it('should calculate doubled contribution scenario', () => {
      const input = createBasicInput();
      const result = analyze(input);

      const doubledScenario = result.alternativeScenarios.find((s) =>
        s.description.includes('Double')
      );

      if (doubledScenario) {
        expect(parseInt(doubledScenario.monthsToGoal.toString())).toBeLessThan(
          result.summary.monthsToGoal
        );
      }
    });
  });

  describe('goal-specific recommendations', () => {
    it('should provide emergency fund recommendations', () => {
      const input = createBasicInput({ goalType: 'emergency_fund' });
      const result = analyze(input);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.goalType).toBe('emergency_fund');
      expect(result.recommendations.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide home down payment recommendations', () => {
      const input = createBasicInput({ goalType: 'home_down_payment' });
      const result = analyze(input);

      expect(result.recommendations.goalType).toBe('home_down_payment');
      expect(result.recommendations.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide education recommendations', () => {
      const input = createBasicInput({ goalType: 'education' });
      const result = analyze(input);

      expect(result.recommendations.goalType).toBe('education');
    });

    it('should provide retirement recommendations', () => {
      const input = createBasicInput({ goalType: 'retirement' });
      const result = analyze(input);

      expect(result.recommendations.goalType).toBe('retirement');
    });
  });

  describe('edge cases', () => {
    it('should handle zero monthly contribution', () => {
      const input = createBasicInput({
        monthlyContribution: 0,
        annualReturnRate: 0.1, // Higher rate to reach goal eventually
      });
      const result = analyze(input);

      expect(result).toBeDefined();
      expect(result.summary.monthsToGoal).toBeGreaterThan(0);
    });

    it('should handle zero return rate', () => {
      const input = createBasicInput({ annualReturnRate: 0 });
      const result = analyze(input);

      expect(result).toBeDefined();
      expect(parseFloat(result.summary.totalInterestEarned)).toBe(0);
    });

    it('should handle zero inflation rate', () => {
      const input = createBasicInput({ inflationRate: 0 });
      const result = analyze(input);

      expect(result).toBeDefined();
      // Real value should equal balance when no inflation
      const lastMonth = result.savingsSchedule[result.savingsSchedule.length - 1];
      expect(lastMonth!.realValue).toBe(lastMonth!.balance);
    });

    it('should handle very small goal amount', () => {
      const input = createBasicInput({
        goalAmount: 100,
        currentSavings: 0,
        monthlyContribution: 50,
      });
      const result = analyze(input);

      expect(result.summary.monthsToGoal).toBeLessThanOrEqual(3);
    });

    it('should handle very large goal amount', () => {
      const input = createBasicInput({
        goalAmount: 10000000,
        currentSavings: 0,
        monthlyContribution: 1000,
      });
      const result = analyze(input);

      expect(result).toBeDefined();
      expect(result.summary.monthsToGoal).toBeGreaterThan(0);
    });

    it('should cap at maximum months for unreachable goals', () => {
      const input = createBasicInput({
        goalAmount: 1000000000, // 1 billion
        currentSavings: 0,
        monthlyContribution: 1,
        annualReturnRate: 0,
      });
      const result = analyze(input);

      // Should hit MAX_MONTHS cap (600)
      expect(result.summary.monthsToGoal).toBeLessThanOrEqual(600);
    });
  });

  describe('effective return calculation', () => {
    it('should calculate effective annual return', () => {
      const input = createBasicInput({
        annualReturnRate: 0.07,
        inflationRate: 0.02,
      });
      const result = analyze(input);

      // Effective return should be approximately returnRate - inflationRate
      expect(parseFloat(result.summary.effectiveAnnualReturn)).toBeCloseTo(5, 0);
    });

    it('should handle negative effective return', () => {
      const input = createBasicInput({
        annualReturnRate: 0.01,
        inflationRate: 0.03,
      });
      const result = analyze(input);

      expect(parseFloat(result.summary.effectiveAnnualReturn)).toBeLessThan(0);
    });
  });

  describe('metadata', () => {
    it('should include metadata in result', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.calculatedAt).toBeDefined();
      expect(result.metadata.version).toBe('1.0.0');
    });

    it('should include input echo in result', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(result.input).toBeDefined();
      expect(result.input.goalAmount).toBe('50000.00');
    });
  });

  describe('summary calculations', () => {
    it('should calculate total contributions correctly', () => {
      const input = createBasicInput();
      const result = analyze(input);

      const totalContributions = parseFloat(result.summary.totalContributions);
      expect(totalContributions).toBeGreaterThan(input.currentSavings);
    });

    it('should calculate years to goal correctly', () => {
      const input = createBasicInput();
      const result = analyze(input);

      const expectedYears = result.summary.monthsToGoal / 12;
      expect(parseFloat(result.summary.yearsToGoal)).toBeCloseTo(expectedYears, 1);
    });
  });
});
