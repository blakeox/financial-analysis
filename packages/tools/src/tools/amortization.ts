import {
  AmortizationAnalyzer,
  type AmortizationAnalysisResult,
} from '@financial-analysis/analysis';
import { z } from 'zod';

const AmortizationToolInputSchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  termMonths: z.number().positive().int(),
});

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

  static execute(input: unknown): Promise<AmortizationAnalysisResult> {
    const validated = AmortizationToolInputSchema.parse(input);
    return Promise.resolve(AmortizationAnalyzer.analyze(validated));
  }
}
