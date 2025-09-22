export { LeaseAnalyzer } from './engines/lease';
export type { LeaseAnalysisResult } from './engines/lease';
export interface AmortizationResultItem {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
}
export interface AmortizationAnalysisResult {
    monthlyPayment: number;
    totalPayments: number;
    totalInterest: number;
    schedule: AmortizationResultItem[];
}
export declare class AmortizationAnalyzer {
    static analyze(input: z.infer<typeof AmortizationInputSchema>): AmortizationAnalysisResult;
}
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
export declare const AmortizationInputSchema: z.ZodObject<{
    principal: z.ZodNumber;
    annualRate: z.ZodNumber;
    termMonths: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    principal: number;
    annualRate: number;
    termMonths: number;
}, {
    principal: number;
    annualRate: number;
    termMonths: number;
}>;
//# sourceMappingURL=index.d.ts.map