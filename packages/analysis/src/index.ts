// Financial Analysis Engines
export { LeaseAnalyzer } from './engines/lease';
export { AmortizationAnalyzer } from './engines/amortization';
export { EbitdaForecaster } from './engines/ebitda-forecasting';

// Types
export type { LeaseAnalysisResult } from './engines/lease';
export type { AmortizationAnalysisResult } from './engines/amortization';
export type { 
  EbitdaForecastResult, 
  MonthlyForecast,
  MonthlyFinancials,
  Employee,
  ExpenseType,
  ScenarioInput
} from './engines/ebitda-forecasting';
export { AmortizationInputSchema } from './engines/amortization';
export { 
  MonthlyFinancialsSchema,
  EmployeeSchema,
  ExpenseTypeSchema,
  ScenarioInputSchema
} from './engines/ebitda-forecasting';

// Utilities (placeholder - to be implemented)
import { z } from 'zod';
// Re-export the Zod instance so downstream packages (API/UI) can share the same instance
// This ensures extensions like zod-to-openapi apply consistently across schemas.
export { z } from 'zod';

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
