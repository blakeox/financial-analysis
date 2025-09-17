export { LeaseAnalyzer } from './engines/lease';
export type { LeaseAnalysisResult } from './engines/lease';
import { z } from 'zod';
export declare const FinancialInputSchema: z.ZodObject<{
    principal: z.ZodNumber;
    annualRate: z.ZodNumber;
    termMonths: z.ZodNumber;
    residualValue: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    principal: number;
    annualRate: number;
    termMonths: number;
    residualValue: number;
}, {
    principal: number;
    annualRate: number;
    termMonths: number;
    residualValue?: number | undefined;
}>;
export type FinancialInput = z.infer<typeof FinancialInputSchema>;
export declare function validateFinancialInput(input: unknown): input is FinancialInput;
//# sourceMappingURL=index.d.ts.map