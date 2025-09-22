// Financial Analysis Engines
export { LeaseAnalyzer } from './engines/lease';
export { AmortizationAnalyzer } from './engines/amortization';

// Types
export type { LeaseAnalysisResult } from './engines/lease';
export type { AmortizationAnalysisResult } from './engines/amortization';
export { AmortizationInputSchema } from './engines/amortization';

// Utilities (placeholder - to be implemented)
import { z } from 'zod';

export const FinancialInputSchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  termMonths: z.number().positive().int(),
  residualValue: z.number().min(0).default(0),
});

export type FinancialInput = z.infer<typeof FinancialInputSchema>;

export function validateFinancialInput(input: unknown): input is FinancialInput {
  const result = FinancialInputSchema.safeParse(input);
  return result.success;
}
