/**
 * Employee Stock Options MCP Tool
 */

import { EmployeeStockOptionsInputSchema, EmployeeStockOptionsValuator } from '@financial-analysis/analysis';

export class EmployeeStockOptionsTool {
  static readonly toolName = 'analyze_employee_stock_options';
  static readonly description =
    'Value employee stock options with Black-Scholes, analyze tax implications (ISO vs NSO), optimize exercise strategies, and project scenarios';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 100, description: 'Current age' },
          currentSalary: { type: 'number', minimum: 0, description: 'Current salary' },
          expectedRetirementAge: { type: 'number', minimum: 50, maximum: 100, default: 65, description: 'Expected retirement age' },
        },
        required: ['age', 'currentSalary'],
      },
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            grantDate: { type: 'string', description: 'Grant date (ISO format)' },
            grantPrice: { type: 'number', minimum: 0, description: 'Strike price' },
            numberOfOptions: { type: 'number', minimum: 0, description: 'Number of options' },
            expirationDate: { type: 'string', description: 'Expiration date (ISO format)' },
            optionType: {
              type: 'string',
              enum: ['iso', 'nso', 'eso'],
              default: 'iso',
              description: 'Option type',
            },
            currentStockPrice: { type: 'number', minimum: 0, description: 'Current stock price' },
            vestingSchedule: {
              type: 'object',
              properties: {
                vestingType: {
                  type: 'string',
                  enum: ['cliff', 'graded', 'immediate'],
                  default: 'graded',
                  description: 'Vesting type',
                },
                vestingPeriod: { type: 'number', minimum: 0, default: 4, description: 'Vesting period (years)' },
              },
            },
          },
          required: ['grantDate', 'grantPrice', 'numberOfOptions', 'expirationDate', 'currentStockPrice'],
        },
        minItems: 1,
      },
      taxInfo: {
        type: 'object',
        properties: {
          federalTaxRate: {
            type: 'object',
            properties: {
              ordinary: { type: 'number', minimum: 0, maximum: 0.5, default: 0.37, description: 'Ordinary income rate' },
              capitalGains: { type: 'number', minimum: 0, maximum: 0.3, default: 0.2, description: 'Capital gains rate' },
            },
            required: ['ordinary', 'capitalGains'],
          },
          includeAMT: { type: 'boolean', default: true, description: 'Include AMT' },
        },
        required: ['federalTaxRate'],
      },
      exerciseStrategy: {
        type: 'object',
        properties: {
          strategy: {
            type: 'string',
            enum: ['exercise-early', 'exercise-at-vest', 'exercise-before-expiration', 'hold-to-expiration'],
            default: 'exercise-at-vest',
            description: 'Exercise strategy',
          },
          includeTaxOptimization: { type: 'boolean', default: true, description: 'Include tax optimization' },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeValuation: { type: 'boolean', default: true, description: 'Include Black-Scholes valuation' },
          includeTaxAnalysis: { type: 'boolean', default: true, description: 'Include tax analysis' },
          includeExerciseScenarios: { type: 'boolean', default: true, description: 'Include exercise scenarios' },
          projectionYears: { type: 'number', minimum: 1, maximum: 20, default: 10, description: 'Projection years' },
        },
        required: ['projectionYears'],
      },
    },
    required: ['personalInfo', 'options', 'taxInfo'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = EmployeeStockOptionsInputSchema.parse(args);
    return EmployeeStockOptionsValuator.analyze(validated);
  }
}


