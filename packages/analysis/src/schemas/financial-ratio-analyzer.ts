import { z } from 'zod';

export const FinancialRatioAnalyzerInputSchema = z.object({
  companyInfo: z.object({
    name: z.string().optional(),
    industry: z.string().optional(),
    size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
    fiscalYearEnd: z.string().optional(),
  }),
  financialStatements: z.object({
    balanceSheet: z.object({
      currentAssets: z.number().min(0),
      totalAssets: z.number().min(0),
      currentLiabilities: z.number().min(0),
      totalLiabilities: z.number().min(0),
      totalEquity: z.number(),
      cash: z.number().min(0),
      accountsReceivable: z.number().min(0),
      inventory: z.number().min(0),
      accountsPayable: z.number().min(0),
      shortTermDebt: z.number().min(0),
      longTermDebt: z.number().min(0),
    }),
    incomeStatement: z.object({
      revenue: z.number().min(0),
      costOfGoodsSold: z.number().min(0),
      grossProfit: z.number(),
      operatingExpenses: z.number().min(0),
      ebitda: z.number(),
      ebit: z.number(),
      netIncome: z.number(),
      interestExpense: z.number().min(0).default(0),
      taxExpense: z.number().min(0).default(0),
    }),
    cashFlowStatement: z.object({
      operatingCashFlow: z.number(),
      capitalExpenditures: z.number().min(0).default(0),
      freeCashFlow: z.number(),
      investingCashFlow: z.number().default(0),
      financingCashFlow: z.number().default(0),
    }),
  }),
  marketData: z.object({
    sharePrice: z.number().min(0).optional(),
    sharesOutstanding: z.number().min(0).optional(),
    marketCap: z.number().min(0).optional(),
    industryAverages: z
      .object({
        currentRatio: z.number().min(0).optional(),
        quickRatio: z.number().min(0).optional(),
        debtToEquity: z.number().min(0).optional(),
        roe: z.number().optional(),
        roa: z.number().optional(),
        profitMargin: z.number().optional(),
      })
      .optional(),
  }),
  analysis: z.object({
    includeLiquidityRatios: z.boolean().default(true),
    includeProfitabilityRatios: z.boolean().default(true),
    includeEfficiencyRatios: z.boolean().default(true),
    includeLeverageRatios: z.boolean().default(true),
    includeMarketRatios: z.boolean().default(true),
    includeTrendAnalysis: z.boolean().default(false),
    includeBenchmarking: z.boolean().default(true),
  }),
});

export type FinancialRatioAnalyzerInput = z.infer<typeof FinancialRatioAnalyzerInputSchema>;



