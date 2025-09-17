export { LeaseAnalyzer } from './engines/lease';
import { z } from 'zod';
export const FinancialInputSchema = z.object({
    principal: z.number().positive(),
    annualRate: z.number().min(0).max(1),
    termMonths: z.number().positive().int(),
    residualValue: z.number().min(0).default(0),
});
export function validateFinancialInput(input) {
    const result = FinancialInputSchema.safeParse(input);
    return result.success;
}
