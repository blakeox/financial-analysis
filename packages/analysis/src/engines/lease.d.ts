import { z } from 'zod';
export interface LeaseAnalysisResult {
    monthlyPayment: number;
    totalPayments: number;
    totalInterest: number;
    schedule: Array<{
        month: number;
        payment: number;
        principal: number;
        interest: number;
        balance: number;
    }>;
}
declare const LeaseInputSchema: z.ZodObject<{
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
export declare class LeaseAnalyzer {
    static analyze(input: z.infer<typeof LeaseInputSchema>): LeaseAnalysisResult;
}
export {};
//# sourceMappingURL=lease.d.ts.map