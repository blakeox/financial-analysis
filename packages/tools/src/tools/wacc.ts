import {
  WACCAnalyzer,
  WACCInputSchema,
  type WACCInput,
  type WACCResult,
} from '@financial-analysis/analysis';

export type WACCToolResponse = WACCResult;

export class WACCTool {
  static readonly toolName = 'calculate_wacc';
  static readonly description = 'Calculate Weighted Average Cost of Capital (WACC)';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      equityValue: {
        type: 'number',
        description: 'Market value of equity',
      },
      debtValue: {
        type: 'number',
        description: 'Market value of debt',
      },
      costOfEquity: {
        type: 'number',
        description: 'Cost of equity (as decimal, e.g., 0.08 for 8%)',
      },
      costOfDebt: {
        type: 'number',
        description: 'Cost of debt (as decimal, e.g., 0.05 for 5%)',
      },
      taxRate: {
        type: 'number',
        description: 'Corporate tax rate (as decimal, e.g., 0.21 for 21%)',
      },
    },
    required: ['equityValue', 'debtValue', 'costOfEquity', 'costOfDebt', 'taxRate'],
  };

  static execute(input: unknown): Promise<WACCToolResponse> {
    const validated = WACCInputSchema.parse(input) as WACCInput;
    const result = WACCAnalyzer.analyze(validated);
    return Promise.resolve(result);
  }
}
