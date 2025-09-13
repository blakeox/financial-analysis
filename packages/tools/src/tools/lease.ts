import { LeaseAnalyzer, type LeaseAnalysisResult } from '@financial-analysis/analysis';
import { z } from 'zod';

const LeaseToolInputSchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  termMonths: z.number().positive().int(),
  residualValue: z.number().min(0).default(0),
});

export class LeaseTool {
  static readonly toolName = 'analyze_lease';
  static readonly description = 'Analyze lease agreement financials';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      principal: { type: 'number', description: 'Principal amount' },
      annualRate: { type: 'number', description: 'Annual interest rate (0-1)' },
      termMonths: { type: 'number', description: 'Term in months' },
      residualValue: { type: 'number', description: 'Residual value', default: 0 },
    },
    required: ['principal', 'annualRate', 'termMonths'],
  };

  static execute(input: unknown): Promise<LeaseAnalysisResult> {
    const validated = LeaseToolInputSchema.parse(input);
    return Promise.resolve(LeaseAnalyzer.analyze(validated));
  }
}
