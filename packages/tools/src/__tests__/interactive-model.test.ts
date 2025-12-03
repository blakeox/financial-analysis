import { describe, expect, it } from 'vitest';
import { InteractiveModelTool } from '../tools/interactive-model';

describe('InteractiveModelTool', () => {
  // Valid lease parameters (matches LeaseInputSchema)
  const validLeaseParameters = {
    principal: 100000,
    annualRate: 0.06,
    termMonths: 36,
    residualValue: 10000,
  };

  // Valid amortization parameters (matches AmortizationInputSchema)
  const validAmortizationParameters = {
    principal: 250000,
    annualRate: 0.065,
    termMonths: 360,
    extraMonthlyPayment: 0,
  };

  // Valid EBITDA parameters (matches ScenarioInputSchema)
  const validEbitdaParameters = {
    name: 'Test Scenario',
    forecastPeriodMonths: 12,
    currentMonthlyFinancials: [
      {
        month: 1,
        year: 2024,
        revenue: 100000,
        costOfGoodsSold: 40000,
        operatingExpenses: 30000,
        depreciation: 2000,
        amortization: 1000,
        interestExpense: 500,
        taxes: 5000,
      },
    ],
    currentEmployees: [
      {
        id: 'emp-1',
        name: 'John Doe',
        role: 'Developer',
        department: 'Engineering',
        billableHoursPerMonth: 160,
        hourlyRate: 100,
        salary: 120000,
        benefits: 15000,
        startDate: '2024-01-01T00:00:00Z',
        isActive: true,
      },
    ],
    revenueGrowthRate: 0.05,
    billableHoursGrowthRate: 0.02,
    operatingExpenseGrowthRate: 0.03,
    inflationRate: 0.03,
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(InteractiveModelTool.toolName).toBe('interactive_financial_model');
    });

    it('has a description', () => {
      expect(InteractiveModelTool.description).toBeTruthy();
      expect(InteractiveModelTool.description.length).toBeGreaterThan(30);
    });

    it('has required input schema fields', () => {
      const schema = InteractiveModelTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('action');
      expect(schema.required).toContain('modelType');
      expect(schema.required).toContain('parameters');
    });

    it('supports expected actions', () => {
      const actions = InteractiveModelTool.inputSchema.properties.action.enum;
      expect(actions).toContain('modify_lease');
      expect(actions).toContain('modify_amortization');
      expect(actions).toContain('modify_ebitda');
      expect(actions).toContain('compare_scenarios');
    });

    it('supports expected model types', () => {
      const modelTypes = InteractiveModelTool.inputSchema.properties.modelType.enum;
      expect(modelTypes).toContain('lease');
      expect(modelTypes).toContain('amortization');
      expect(modelTypes).toContain('ebitda');
    });
  });

  describe('execute', () => {
    describe('lease model', () => {
      it('performs lease analysis successfully', async () => {
        const result = await InteractiveModelTool.execute({
          action: 'modify_lease',
          modelType: 'lease',
          parameters: validLeaseParameters,
          thinking: true,
        });

        expect(result.success).toBe(true);
        expect(result.model_type).toBe('lease');
        expect(result.original_result).toBeDefined();
        expect(result.thinking_steps.length).toBeGreaterThan(0);
        expect(result.insights.length).toBeGreaterThan(0);
      });

      it('compares lease scenarios with modifications', async () => {
        const result = await InteractiveModelTool.execute({
          action: 'compare_scenarios',
          modelType: 'lease',
          parameters: validLeaseParameters,
          modifications: { annualRate: 0.05 },
          thinking: true,
        });

        expect(result.success).toBe(true);
        expect(result.original_result).toBeDefined();
        expect(result.modified_result).toBeDefined();
      });
    });

    describe('amortization model', () => {
      it('performs amortization analysis successfully', async () => {
        const result = await InteractiveModelTool.execute({
          action: 'modify_amortization',
          modelType: 'amortization',
          parameters: validAmortizationParameters,
          thinking: true,
        });

        expect(result.success).toBe(true);
        expect(result.model_type).toBe('amortization');
        expect(result.original_result).toBeDefined();
        expect(result.insights.length).toBeGreaterThan(0);
      });

      it('compares amortization scenarios with modifications', async () => {
        const result = await InteractiveModelTool.execute({
          action: 'compare_scenarios',
          modelType: 'amortization',
          parameters: validAmortizationParameters,
          modifications: { termMonths: 180 },
          thinking: true,
        });

        expect(result.success).toBe(true);
        expect(result.modified_result).toBeDefined();
      });
    });

    describe('ebitda model', () => {
      it('performs ebitda forecast successfully', async () => {
        const result = await InteractiveModelTool.execute({
          action: 'modify_ebitda',
          modelType: 'ebitda',
          parameters: validEbitdaParameters,
          thinking: true,
        });

        expect(result.success).toBe(true);
        expect(result.model_type).toBe('ebitda');
        expect(result.original_result).toBeDefined();
        expect(result.insights.length).toBeGreaterThan(0);
      });
    });

    describe('thinking process', () => {
      it('includes thinking steps when thinking is enabled', async () => {
        const result = await InteractiveModelTool.execute({
          action: 'modify_lease',
          modelType: 'lease',
          parameters: validLeaseParameters,
          thinking: true,
        });

        expect(result.thinking_steps.length).toBeGreaterThan(0);
        expect(result.thinking_steps[0]).toHaveProperty('step');
        expect(result.thinking_steps[0]).toHaveProperty('thought');
      });

      it('provides recommendations', async () => {
        const result = await InteractiveModelTool.execute({
          action: 'modify_amortization',
          modelType: 'amortization',
          parameters: validAmortizationParameters,
          thinking: true,
        });

        expect(result.recommendations).toBeDefined();
        expect(Array.isArray(result.recommendations)).toBe(true);
      });
    });

    describe('error handling', () => {
      it('returns error for invalid input', async () => {
        const result = await InteractiveModelTool.execute({
          action: 'modify_lease',
          modelType: 'lease',
          parameters: {}, // Empty parameters - should fail validation
          thinking: true,
        });

        expect(result.success).toBe(false);
      });

      it('throws error for missing required fields', async () => {
        await expect(
          InteractiveModelTool.execute({
            action: 'modify_lease',
            // Missing modelType and parameters
          })
        ).rejects.toThrow();
      });
    });
  });
});
