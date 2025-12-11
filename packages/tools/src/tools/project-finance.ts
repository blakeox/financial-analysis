/**
 * Project Finance Analyzer MCP Tool
 */

import { ProjectFinanceAnalyzer, ProjectFinanceInputSchema } from '@financial-analysis/analysis';

export class ProjectFinanceTool {
  static readonly toolName = 'analyze_project_finance';
  static readonly description =
    'Project finance analysis with NPV, IRR, payback period, sensitivity analysis, and risk assessment';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      projectInfo: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: {
            type: 'string',
            enum: [
              'infrastructure',
              'real-estate',
              'energy',
              'manufacturing',
              'technology',
              'other',
            ],
          },
          duration: { type: 'number', minimum: 1, maximum: 50 },
        },
        required: ['name', 'type', 'duration'],
      },
      cashFlows: {
        type: 'object',
        properties: {
          initialInvestment: { type: 'number', minimum: 0 },
          annualCashFlows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                year: { type: 'number' },
                revenue: { type: 'number', minimum: 0 },
                operatingExpenses: { type: 'number', minimum: 0 },
                capitalExpenditures: { type: 'number', minimum: 0, default: 0 },
                workingCapital: { type: 'number', default: 0 },
              },
              required: ['year', 'revenue', 'operatingExpenses'],
            },
          },
        },
        required: ['initialInvestment', 'annualCashFlows'],
      },
      financing: {
        type: 'object',
        properties: {
          equityPercentage: { type: 'number', minimum: 0, maximum: 100, default: 30 },
          debtPercentage: { type: 'number', minimum: 0, maximum: 100, default: 70 },
          costOfEquity: { type: 'number', minimum: 0, maximum: 0.5 },
          costOfDebt: { type: 'number', minimum: 0, maximum: 0.5 },
          taxRate: { type: 'number', minimum: 0, maximum: 0.5 },
        },
        required: ['equityPercentage', 'debtPercentage', 'costOfEquity', 'costOfDebt', 'taxRate'],
      },
      analysis: {
        type: 'object',
        properties: {
          includeNPV: { type: 'boolean', default: true },
          includeIRR: { type: 'boolean', default: true },
          includePayback: { type: 'boolean', default: true },
          includeSensitivity: { type: 'boolean', default: true },
          discountRate: { type: 'number', minimum: 0, maximum: 0.5 },
        },
      },
    },
    required: ['projectInfo', 'cashFlows', 'financing'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = ProjectFinanceInputSchema.parse(args);
    return ProjectFinanceAnalyzer.analyze(validated);
  }
}
