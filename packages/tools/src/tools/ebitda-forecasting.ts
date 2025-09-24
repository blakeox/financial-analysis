import {
  EbitdaForecaster,
  type EbitdaForecastResult,
} from '@financial-analysis/analysis';
import { z } from 'zod';

// Tool-specific input schemas with JSON Schema format for MCP
const ForecastingToolInputSchema = z.object({
  currentYear: z.object({
    january: z.number().optional(),
    february: z.number().optional(),
    march: z.number().optional(),
    april: z.number().optional(),
    may: z.number().optional(),
    june: z.number().optional(),
    july: z.number().optional(),
    august: z.number().optional(),
    september: z.number().optional(),
    october: z.number().optional(),
    november: z.number().optional(),
    december: z.number().optional(),
  }),
  employees: z.array(z.object({
    id: z.string(),
    name: z.string(),
    currentSalary: z.number().positive(),
    billableHoursPerMonth: z.number().min(0).max(744), // max hours in a month
    hourlyRate: z.number().positive(),
    department: z.string(),
    isActive: z.boolean().default(true),
  })).default([]),
  expenseTypes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    currentMonthlyAmount: z.number(),
    category: z.enum(['fixed', 'variable', 'mixed']),
    growthRate: z.number().default(0),
    isActive: z.boolean().default(true),
  })).default([]),
  projectionMonths: z.number().positive().int().max(60).default(12),
  revenueGrowthRate: z.number().default(0),
  marketGrowthFactor: z.number().default(1),
  seasonalityFactors: z.array(z.number()).length(12).optional(),
});

const ScenarioComparisonInputSchema = z.object({
  baseScenario: ForecastingToolInputSchema,
  alternativeScenarios: z.array(ForecastingToolInputSchema.extend({
    name: z.string(),
  })),
});

export class EbitdaForecastingTool {
  static readonly toolName = 'ebitda_forecasting';
  static readonly description = 'Generate EBITDA forecasts based on current financials, employee projections, and expense modeling for service industry scenario planning';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      currentYear: {
        type: 'object',
        description: 'Current year monthly financial data',
        properties: {
          january: { type: 'number', description: 'January revenue' },
          february: { type: 'number', description: 'February revenue' },
          march: { type: 'number', description: 'March revenue' },
          april: { type: 'number', description: 'April revenue' },
          may: { type: 'number', description: 'May revenue' },
          june: { type: 'number', description: 'June revenue' },
          july: { type: 'number', description: 'July revenue' },
          august: { type: 'number', description: 'August revenue' },
          september: { type: 'number', description: 'September revenue' },
          october: { type: 'number', description: 'October revenue' },
          november: { type: 'number', description: 'November revenue' },
          december: { type: 'number', description: 'December revenue' },
        },
      },
      employees: {
        type: 'array',
        description: 'Employee data for revenue and cost projections',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique employee identifier' },
            name: { type: 'string', description: 'Employee name' },
            currentSalary: { type: 'number', description: 'Current monthly salary' },
            billableHoursPerMonth: { type: 'number', description: 'Expected billable hours per month (0-744)' },
            hourlyRate: { type: 'number', description: 'Billable hourly rate' },
            department: { type: 'string', description: 'Department or division' },
            isActive: { type: 'boolean', description: 'Whether employee is active' },
          },
          required: ['id', 'name', 'currentSalary', 'billableHoursPerMonth', 'hourlyRate', 'department'],
        },
        default: [],
      },
      expenseTypes: {
        type: 'array',
        description: 'Expense categories and projections',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique expense type identifier' },
            name: { type: 'string', description: 'Expense type name' },
            currentMonthlyAmount: { type: 'number', description: 'Current monthly amount' },
            category: { type: 'string', enum: ['fixed', 'variable', 'mixed'], description: 'Expense category' },
            growthRate: { type: 'number', description: 'Monthly growth rate (0.05 = 5%)' },
            isActive: { type: 'boolean', description: 'Whether expense type is active' },
          },
          required: ['id', 'name', 'currentMonthlyAmount', 'category'],
        },
        default: [],
      },
      projectionMonths: { type: 'number', description: 'Number of months to project (1-60)', default: 12 },
      revenueGrowthRate: { type: 'number', description: 'Expected monthly revenue growth rate', default: 0 },
      marketGrowthFactor: { type: 'number', description: 'Market growth multiplier', default: 1 },
      seasonalityFactors: {
        type: 'array',
        description: 'Monthly seasonality factors (12 values, 1.0 = normal)',
        items: { type: 'number' },
        minItems: 12,
        maxItems: 12,
      },
    },
    required: ['currentYear'],
  };

  static async execute(input: unknown): Promise<EbitdaForecastResult> {
    const validated = ForecastingToolInputSchema.parse(input);
    
    // Transform the simplified input to match the ScenarioInputSchema
    // Convert monthly revenue data to currentMonthlyFinancials format
    const currentMonthlyFinancials = [];
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
    
    for (let i = 0; i < monthNames.length; i++) {
      const monthName = monthNames[i] as keyof typeof validated.currentYear;
      const revenue = validated.currentYear[monthName];
      if (revenue !== undefined) {
        currentMonthlyFinancials.push({
          month: i + 1,
          year: new Date().getFullYear(),
          revenue: revenue,
          costOfGoodsSold: 0, // Default to 0, as this is simplified input
          operatingExpenses: 0, // Will be calculated from expense types
          depreciation: 0,
          amortization: 0,
          interestExpense: 0,
          taxes: 0,
        });
      }
    }

    // Transform employees to match expected schema
    const currentEmployees = validated.employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      role: emp.department, // Use department as role
      department: emp.department,
      billableHoursPerMonth: emp.billableHoursPerMonth,
      hourlyRate: emp.hourlyRate,
      salary: emp.currentSalary,
      benefits: 0, // Default
      startDate: new Date().toISOString(),
      isActive: emp.isActive,
    }));

    // Transform expense types to additional expenses
    const additionalExpenses = validated.expenseTypes.map(expense => ({
      id: expense.id,
      name: expense.name,
      category: expense.category === 'mixed' ? 'semi-variable' as const : expense.category as 'fixed' | 'variable',
      amount: expense.currentMonthlyAmount,
      frequency: 'monthly' as const,
      isRecurring: true,
      description: `${expense.name} expense`,
      startMonth: 1,
      growthRate: expense.growthRate ?? 0,
    }));

    const scenarioInput = {
      name: 'EBITDA Forecast',
      description: 'Generated forecast from MCP tool',
      forecastPeriodMonths: validated.projectionMonths,
      currentMonthlyFinancials,
      currentEmployees,
      newEmployees: [],
      revenueGrowthRate: validated.revenueGrowthRate,
      billableHoursGrowthRate: 0, // Default
      additionalExpenses,
      operatingExpenseGrowthRate: 0, // Default
      inflationRate: 0.03, // Default 3%
      economicFactors: {
        marketGrowth: (validated.marketGrowthFactor - 1), // Convert multiplier to growth rate
        competitionFactor: 1, // Default
        seasonalityFactors: validated.seasonalityFactors,
      },
    };

    return EbitdaForecaster.forecast(scenarioInput);
  }
}

export class EbitdaScenarioComparisonTool {
  static readonly toolName = 'ebitda_scenario_comparison';
  static readonly description = 'Compare multiple EBITDA forecasting scenarios to analyze different business assumptions and their impact on profitability';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      baseScenario: EbitdaForecastingTool.inputSchema,
      alternativeScenarios: {
        type: 'array',
        description: 'Alternative scenarios to compare against the base scenario',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Scenario name for identification' },
            ...EbitdaForecastingTool.inputSchema.properties,
          },
          required: ['name', 'currentYear'],
        },
        minItems: 1,
        maxItems: 5,
      },
    },
    required: ['baseScenario', 'alternativeScenarios'],
  };

  static async execute(input: unknown): Promise<ReturnType<typeof EbitdaForecaster.compareScenarios>> {
    const validated = ScenarioComparisonInputSchema.parse(input);
    
    // Helper function to transform scenario input
    const transformScenario = (scenario: typeof validated.baseScenario, name: string) => {
      // Convert monthly revenue data to currentMonthlyFinancials format
      const currentMonthlyFinancials = [];
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                         'july', 'august', 'september', 'october', 'november', 'december'];
      
      for (let i = 0; i < monthNames.length; i++) {
        const monthName = monthNames[i] as keyof typeof scenario.currentYear;
        const revenue = scenario.currentYear[monthName];
        if (revenue !== undefined) {
          currentMonthlyFinancials.push({
            month: i + 1,
            year: new Date().getFullYear(),
            revenue: revenue,
            costOfGoodsSold: 0,
            operatingExpenses: 0,
            depreciation: 0,
            amortization: 0,
            interestExpense: 0,
            taxes: 0,
          });
        }
      }

      // Transform employees
      const currentEmployees = scenario.employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        role: emp.department,
        department: emp.department,
        billableHoursPerMonth: emp.billableHoursPerMonth,
        hourlyRate: emp.hourlyRate,
        salary: emp.currentSalary,
        benefits: 0,
        startDate: new Date().toISOString(),
        isActive: emp.isActive,
      }));

      // Transform expenses
      const additionalExpenses = scenario.expenseTypes.map(expense => ({
        id: expense.id,
        name: expense.name,
        category: expense.category === 'mixed' ? 'semi-variable' as const : expense.category as 'fixed' | 'variable',
        amount: expense.currentMonthlyAmount,
        frequency: 'monthly' as const,
        isRecurring: true,
        description: `${expense.name} expense`,
        startMonth: 1,
        growthRate: expense.growthRate ?? 0,
      }));

      return {
        name,
        description: `${name} scenario`,
        forecastPeriodMonths: scenario.projectionMonths,
        currentMonthlyFinancials,
        currentEmployees,
        newEmployees: [],
        revenueGrowthRate: scenario.revenueGrowthRate,
        billableHoursGrowthRate: 0,
        additionalExpenses,
        operatingExpenseGrowthRate: 0,
        inflationRate: 0.03,
        economicFactors: {
          marketGrowth: (scenario.marketGrowthFactor - 1),
          competitionFactor: 1,
          seasonalityFactors: scenario.seasonalityFactors,
        },
      };
    };
    
    // Generate forecast for base scenario
    const baseScenarioInput = transformScenario(validated.baseScenario, 'Base Scenario');
    const baseResult = EbitdaForecaster.forecast(baseScenarioInput);

    // Generate forecasts for alternative scenarios
    const alternativeResults = validated.alternativeScenarios.map(scenario => {
      const scenarioInput = transformScenario(scenario, scenario.name);
      return EbitdaForecaster.forecast(scenarioInput);
    });

    // Combine all results
    const allResults = [baseResult, ...alternativeResults];
    
    // Use the static comparison method
    return EbitdaForecaster.compareScenarios(allResults);
  }
}