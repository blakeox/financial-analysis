import {
  AmortizationAnalyzer,
  computeAmortizationInsights,
  type AmortizationAnalysisResult,
  type AmortizationInsights,
} from '@financial-analysis/analysis';
import { z } from 'zod';

const AmortizationToolInputSchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  termMonths: z.number().positive().int(),
});

export interface AmortizationToolResponse {
  result: AmortizationAnalysisResult;
  insights: AmortizationInsights;
}

export class AmortizationTool {
  static readonly toolName = 'analyze_amortization';
  static readonly description = 'Analyze loan amortization schedule';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      principal: { type: 'number', description: 'Principal amount' },
      annualRate: { type: 'number', description: 'Annual interest rate (0-1)' },
      termMonths: { type: 'number', description: 'Term in months' },
    },
    required: ['principal', 'annualRate', 'termMonths'],
  };

  static execute(input: unknown): Promise<AmortizationToolResponse> {
    const validated = AmortizationToolInputSchema.parse(input);
    const result = AmortizationAnalyzer.analyze(validated);
    const insights = computeAmortizationInsights(result);
    return Promise.resolve({ result, insights });
  }
}
