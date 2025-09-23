import { describe, it, expect } from 'vitest';
import { EbitdaForecastingTool, EbitdaScenarioComparisonTool } from '../tools/ebitda-forecasting';

describe('EBITDA Forecasting MCP Tools', () => {
  describe('EbitdaForecastingTool', () => {
    it('should have correct tool metadata', () => {
      expect(EbitdaForecastingTool.toolName).toBe('ebitda_forecasting');
      expect(EbitdaForecastingTool.description).toContain('EBITDA forecasts');
      expect(EbitdaForecastingTool.inputSchema).toHaveProperty('type', 'object');
      expect(EbitdaForecastingTool.inputSchema.properties).toHaveProperty('currentYear');
    });

    it('should execute forecasting with minimal input', async () => {
      const input = {
        currentYear: {
          january: 100000,
          february: 110000,
          march: 120000,
        },
        employees: [],
        expenseTypes: [],
        projectionMonths: 6,
      };

      const result = await EbitdaForecastingTool.execute(input);
      
      expect(result).toHaveProperty('forecast');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('scenario');
      expect(Array.isArray(result.forecast)).toBe(true);
      expect(result.forecast.length).toBe(6);
    });

    it('should execute forecasting with employees and expenses', async () => {
      const input = {
        currentYear: {
          january: 100000,
          february: 110000,
        },
        employees: [
          {
            id: 'emp1',
            name: 'John Doe',
            currentSalary: 8000,
            billableHoursPerMonth: 160,
            hourlyRate: 150,
            department: 'Engineering',
            isActive: true,
          },
        ],
        expenseTypes: [
          {
            id: 'exp1',
            name: 'Office Rent',
            currentMonthlyAmount: 5000,
            category: 'fixed' as const,
            growthRate: 0.02,
            isActive: true,
          },
        ],
        projectionMonths: 3,
        revenueGrowthRate: 0.05,
      };

      const result = await EbitdaForecastingTool.execute(input);
      
      expect(result).toHaveProperty('forecast');
      expect(result.forecast.length).toBe(3);
      expect(result.summary.totalRevenue).toBeGreaterThan(0);
    });
  });

  describe('EbitdaScenarioComparisonTool', () => {
    it('should have correct tool metadata', () => {
      expect(EbitdaScenarioComparisonTool.toolName).toBe('ebitda_scenario_comparison');
      expect(EbitdaScenarioComparisonTool.description).toContain('Compare multiple EBITDA');
      expect(EbitdaScenarioComparisonTool.inputSchema).toHaveProperty('type', 'object');
      expect(EbitdaScenarioComparisonTool.inputSchema.properties).toHaveProperty('baseScenario');
      expect(EbitdaScenarioComparisonTool.inputSchema.properties).toHaveProperty('alternativeScenarios');
    });

    it('should compare scenarios', async () => {
      const baseScenario = {
        currentYear: {
          january: 100000,
          february: 110000,
        },
        employees: [],
        expenseTypes: [],
        projectionMonths: 3,
        revenueGrowthRate: 0.05,
      };

      const input = {
        baseScenario,
        alternativeScenarios: [
          {
            name: 'High Growth',
            ...baseScenario,
            revenueGrowthRate: 0.10,
          },
          {
            name: 'Conservative',
            ...baseScenario,
            revenueGrowthRate: 0.02,
          },
        ],
      };

      const result = await EbitdaScenarioComparisonTool.execute(input);
      
      expect(result).toHaveProperty('comparison');
      expect(result).toHaveProperty('bestScenario');
      expect(result).toHaveProperty('insights');
      expect(Array.isArray(result.comparison)).toBe(true);
      expect(result.comparison.length).toBe(3); // Base + 2 alternatives
      expect(typeof result.bestScenario).toBe('string');
    });
  });
});