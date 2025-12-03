import { describe, expect, it } from 'vitest';
import { SavingsGoalTool } from '../tools/savings-goal';

describe('SavingsGoalTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(SavingsGoalTool.toolName).toBe('analyze_savings_goal');
    });

    it('has a description', () => {
      expect(SavingsGoalTool.description).toBeTruthy();
      expect(SavingsGoalTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = SavingsGoalTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('goalAmount');
      expect(schema.required).toContain('currentSavings');
    });

    it('supports multiple goal types', () => {
      const goalTypes = SavingsGoalTool.inputSchema.properties.goalType.enum;
      expect(goalTypes).toContain('general');
      expect(goalTypes).toContain('emergency_fund');
      expect(goalTypes).toContain('home_down_payment');
      expect(goalTypes).toContain('education');
      expect(goalTypes).toContain('retirement');
    });
  });

  describe('execute', () => {
    it('calculates basic savings goal', async () => {
      const result = await SavingsGoalTool.execute({
        goalAmount: 10000,
        currentSavings: 2000,
        monthlyContribution: 500,
      });

      expect(result).toBeDefined();
      expect(result.savingsSchedule).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('handles emergency fund goal', async () => {
      const result = await SavingsGoalTool.execute({
        goalAmount: 15000,
        currentSavings: 5000,
        monthlyContribution: 800,
        goalType: 'emergency_fund',
      });

      expect(result).toBeDefined();
      expect(result.input.goalType).toBe('emergency_fund');
    });

    it('handles home down payment goal', async () => {
      const result = await SavingsGoalTool.execute({
        goalAmount: 60000,
        currentSavings: 10000,
        monthlyContribution: 1500,
        goalType: 'home_down_payment',
      });

      expect(result).toBeDefined();
      expect(result.input.goalType).toBe('home_down_payment');
    });

    it('calculates with custom return rate', async () => {
      const result = await SavingsGoalTool.execute({
        goalAmount: 50000,
        currentSavings: 10000,
        monthlyContribution: 1000,
        annualReturnRate: 0.07,
      });

      expect(result).toBeDefined();
    });

    it('includes inflation adjustment', async () => {
      const result = await SavingsGoalTool.execute({
        goalAmount: 100000,
        currentSavings: 20000,
        monthlyContribution: 2000,
        inflationRate: 0.03,
      });

      expect(result).toBeDefined();
    });

    it('handles fixed time horizon', async () => {
      const result = await SavingsGoalTool.execute({
        goalAmount: 25000,
        currentSavings: 5000,
        monthlyContribution: 500,
        timeHorizonMonths: 36,
      });

      expect(result).toBeDefined();
      expect(result.savingsSchedule.length).toBeLessThanOrEqual(36);
    });

    it('provides alternative scenarios', async () => {
      const result = await SavingsGoalTool.execute({
        goalAmount: 30000,
        currentSavings: 5000,
        monthlyContribution: 600,
      });

      expect(result.alternativeScenarios).toBeDefined();
    });

    it('handles zero monthly contribution', async () => {
      const result = await SavingsGoalTool.execute({
        goalAmount: 10000,
        currentSavings: 5000,
        monthlyContribution: 0,
        annualReturnRate: 0.05,
      });

      expect(result).toBeDefined();
    });

    it('handles education goal type', async () => {
      const result = await SavingsGoalTool.execute({
        goalAmount: 80000,
        currentSavings: 10000,
        monthlyContribution: 500,
        goalType: 'education',
        timeHorizonMonths: 216, // 18 years
      });

      expect(result).toBeDefined();
      expect(result.input.goalType).toBe('education');
    });

    it('rejects negative goal amount', async () => {
      await expect(
        SavingsGoalTool.execute({
          goalAmount: -10000,
          currentSavings: 2000,
        })
      ).rejects.toThrow();
    });

    it('rejects negative current savings', async () => {
      await expect(
        SavingsGoalTool.execute({
          goalAmount: 10000,
          currentSavings: -1000,
        })
      ).rejects.toThrow();
    });
  });
});
