import { describe, expect, it } from 'vitest';

import * as analysis from '@financial-analysis/analysis';

import { BusinessExpansionLoanJourney as DirectBusinessExpansionLoanJourney } from '../engines/business/business-expansion-loan.js';
import { BusinessFinancialHealthAnalyzer as DirectBusinessFinancialHealthAnalyzer } from '../engines/business/business-financial-health.js';
import { DebtCapacityCalculator as DirectDebtCapacityCalculator } from '../engines/business/debt-capacity.js';
import { DSCRCalculator as DirectDSCRCalculator } from '../engines/business/dscr.js';
import { InvestmentPortfolioAnalyzer as DirectInvestmentPortfolioAnalyzer } from '../engines/business/investment-portfolio.js';
import { RetirementPlanningEngine as DirectRetirementPlanningEngine } from '../engines/personal/retirement-planning.js';
import { BusinessExpansionLoanInputSchema as DirectBusinessExpansionLoanInputSchema } from '../schemas/business-expansion-loan.js';
import { BusinessFinancialHealthInputSchema as DirectBusinessFinancialHealthInputSchema } from '../schemas/business-financial-health.js';
import { DebtCapacityInputSchema as DirectDebtCapacityInputSchema } from '../schemas/debt-capacity.js';
import { DSCRInputSchema as DirectDSCRInputSchema } from '../schemas/dscr.js';
import { InvestmentPortfolioInputSchema as DirectInvestmentPortfolioInputSchema } from '../schemas/investment-portfolio.js';
import { RetirementPlanningInputSchema as DirectRetirementPlanningInputSchema } from '../schemas/retirement-planning.js';

describe('analysis public API barrel', () => {
  it('re-exports representative newer analyzers from the source barrel', () => {
    expect(analysis.BusinessExpansionLoanJourney).toBe(DirectBusinessExpansionLoanJourney);
    expect(analysis.BusinessFinancialHealthAnalyzer).toBe(DirectBusinessFinancialHealthAnalyzer);
    expect(analysis.DebtCapacityCalculator).toBe(DirectDebtCapacityCalculator);
    expect(analysis.DSCRCalculator).toBe(DirectDSCRCalculator);
    expect(analysis.InvestmentPortfolioAnalyzer).toBe(DirectInvestmentPortfolioAnalyzer);
    expect(analysis.RetirementPlanningEngine).toBe(DirectRetirementPlanningEngine);
  });

  it('re-exports representative newer schemas from the source barrel', () => {
    expect(analysis.BusinessExpansionLoanInputSchema).toBe(DirectBusinessExpansionLoanInputSchema);
    expect(analysis.BusinessFinancialHealthInputSchema).toBe(
      DirectBusinessFinancialHealthInputSchema
    );
    expect(analysis.DebtCapacityInputSchema).toBe(DirectDebtCapacityInputSchema);
    expect(analysis.DSCRInputSchema).toBe(DirectDSCRInputSchema);
    expect(analysis.InvestmentPortfolioInputSchema).toBe(DirectInvestmentPortfolioInputSchema);
    expect(analysis.RetirementPlanningInputSchema).toBe(DirectRetirementPlanningInputSchema);
  });

  it('keeps representative newer schemas usable through the public barrel', () => {
    expect(() =>
      analysis.BusinessExpansionLoanInputSchema.parse({
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
      })
    ).not.toThrow();

    expect(() =>
      analysis.DebtCapacityInputSchema.parse({
        financials: {
          annualEBITDA: 180000,
          monthlyDebtPayments: 2500,
          expectedEBITDAIncrease: 20000,
        },
        loanPreferences: {
          preferredTerm: 10,
          preferredRate: 0.07,
          loanType: 'term-loan',
        },
        requestedAmount: 300000,
      })
    ).not.toThrow();

    expect(() =>
      analysis.RetirementPlanningInputSchema.parse({
        personalInfo: {
          age: 35,
          retirementAge: 65,
          lifeExpectancy: 90,
          maritalStatus: 'married',
          dependents: 2,
        },
        currentAccounts: [
          {
            type: '401k',
            balance: 150000,
            annualContribution: 18000,
            employerMatch: 6000,
            expectedReturn: 0.07,
          },
        ],
        income: {
          currentAnnual: 140000,
          expectedGrowthRate: 0.03,
          socialSecurity: 30000,
        },
        expenses: {
          currentAnnual: 85000,
          retirementAnnual: 90000,
          inflationRate: 0.025,
        },
        goals: {
          targetRetirementIncome: 90000,
          riskTolerance: 'moderate',
          taxStrategy: 'balanced',
        },
      })
    ).not.toThrow();
  });
});
