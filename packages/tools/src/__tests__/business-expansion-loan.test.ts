import { describe, expect, it } from 'vitest';
import { BusinessExpansionLoanTool } from '../tools/business-expansion-loan';

describe('BusinessExpansionLoanTool', () => {
  const validInput = {
    businessInfo: {
      businessName: 'Northwind Services',
      industry: 'Professional Services',
      yearsInBusiness: 8,
      businessType: 'llc',
      employeeCount: 18,
    },
    currentFinancials: {
      annualRevenue: 500000,
      annualEBITDA: 95000,
      currentDebt: 120000,
      monthlyDebtPayments: 2500,
      cashOnHand: 80000,
      accountsReceivable: 45000,
      accountsPayable: 30000,
      creditScore: 720,
    },
    expansionPlan: {
      loanAmount: 250000,
      loanPurpose: 'expansion',
      expectedRevenueIncrease: 0.12,
      expectedEBITDAIncrease: 30000,
      timeline: 3,
    },
    loanPreferences: {
      preferredTerm: 7,
      preferredRate: 0.08,
      loanType: 'term-loan',
      collateralAvailable: true,
      collateralValue: 150000,
    },
    goals: {
      riskTolerance: 'moderate',
      priority: 'maximum-amount',
      includeScenarioAnalysis: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(BusinessExpansionLoanTool.toolName).toBe('analyze_business_expansion_loan');
    expect(BusinessExpansionLoanTool.inputSchema.required).toEqual([
      'businessInfo',
      'currentFinancials',
      'expansionPlan',
      'loanPreferences',
      'goals',
    ]);
  });

  it('analyzes expansion loan feasibility', async () => {
    const result = (await BusinessExpansionLoanTool.execute(validInput)) as {
      summary: {
        financialHealthScore: number;
        debtCapacity: number;
        recommendedLoanAmount: number;
        dscr: number;
        riskLevel: string;
      };
      recommendations: string[];
    };

    expect(result.summary.financialHealthScore).toBeGreaterThan(0);
    expect(result.summary.debtCapacity).toBeGreaterThan(0);
    expect(result.summary.recommendedLoanAmount).toBeGreaterThan(0);
    expect(result.summary.dscr).toBeGreaterThan(1);
    expect(['low', 'medium', 'high']).toContain(result.summary.riskLevel);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('rejects invalid input', async () => {
    await expect(
      BusinessExpansionLoanTool.execute({
        ...validInput,
        businessInfo: {
          ...validInput.businessInfo,
          employeeCount: -1,
        },
      })
    ).rejects.toThrow();
  });
});
