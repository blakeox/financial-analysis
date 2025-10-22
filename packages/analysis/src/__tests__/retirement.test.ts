import { describe, it, expect } from "vitest";
import * as RetirementEngine from "../engines/retirement.js";
import type { RetirementInput } from "../schemas/retirement.js";

describe("RetirementEngine", () => {
  it("should calculate retirement projections with 401k", () => {
    const input: RetirementInput = {
      currentAge: 30,
      retirementAge: 65,
      currentIncome: 75000,
      accounts: [
        {
          accountType: "401k",
          currentBalance: 25000,
          annualContribution: 7500,
          employerMatch: 0.5,
          employerMatchLimit: 0.06,
        },
      ],
      expectedAnnualReturn: 0.07,
      inflationRate: 0.03,
      incomeIncreaseRate: 0.03,
      withdrawalStrategy: "4_percent_rule",
    };

    const result = RetirementEngine.analyze(input);

    expect(result.summary.yearsToRetirement).toBe(35);
    expect(result.projectionSchedule.length).toBe(35);
    expect(parseFloat(result.summary.projectedBalanceAtRetirement)).toBeGreaterThan(25000);
    expect(result.employerMatchAnalysis).toBeDefined();
  });

  it("should analyze employer match optimization", () => {
    const input: RetirementInput = {
      currentAge: 35,
      retirementAge: 67,
      currentIncome: 100000,
      accounts: [
        {
          accountType: "401k",
          currentBalance: 50000,
          annualContribution: 4000, // Only 4% when match goes to 6%
          employerMatch: 0.5,
          employerMatchLimit: 0.06,
        },
      ],
      expectedAnnualReturn: 0.08,
      inflationRate: 0.025,
      incomeIncreaseRate: 0.025,
      withdrawalStrategy: "4_percent_rule",
    };

    const result = RetirementEngine.analyze(input);

    expect(result.employerMatchAnalysis.isOptimized).toBe(false);
    expect(parseFloat(result.employerMatchAnalysis.unmatchedAmount)).toBeGreaterThan(0);
    expect(parseFloat(result.employerMatchAnalysis.contributionNeededForFullMatch)).toBeGreaterThan(0);
  });

  it("should analyze tax advantages with mixed accounts", () => {
    const input: RetirementInput = {
      currentAge: 40,
      retirementAge: 65,
      currentIncome: 90000,
      accounts: [
        {
          accountType: "401k",
          currentBalance: 100000,
          annualContribution: 10000,
          employerMatch: 0.5,
          employerMatchLimit: 0.06,
        },
        {
          accountType: "roth_ira",
          currentBalance: 30000,
          annualContribution: 6000,
        },
      ],
      expectedAnnualReturn: 0.07,
      inflationRate: 0.03,
      incomeIncreaseRate: 0.03,
      withdrawalStrategy: "4_percent_rule",
    };

    const result = RetirementEngine.analyze(input);

    expect(result.taxAdvantageAnalysis).toBeDefined();
    expect(parseFloat(result.taxAdvantageAnalysis.totalPreTaxContributions)).toBe(10000);
    expect(parseFloat(result.taxAdvantageAnalysis.totalRothContributions)).toBe(6000);
    expect(parseFloat(result.taxAdvantageAnalysis.estimatedTaxSavings)).toBeGreaterThan(0);
  });

  it("should calculate withdrawal strategies", () => {
    const input: RetirementInput = {
      currentAge: 60,
      retirementAge: 67,
      currentIncome: 120000,
      accounts: [
        {
          accountType: "401k",
          currentBalance: 500000,
          annualContribution: 20000,
          employerMatch: 0.5,
          employerMatchLimit: 0.06,
        },
      ],
      expectedAnnualReturn: 0.06,
      inflationRate: 0.025,
      incomeIncreaseRate: 0.02,
      withdrawalStrategy: "4_percent_rule",
    };

    const result = RetirementEngine.analyze(input);

    expect(result.withdrawalAnalysis).toBeDefined();
    expect(result.withdrawalAnalysis.strategy).toBe("4_percent_rule");
    expect(parseFloat(result.withdrawalAnalysis.firstYearWithdrawal)).toBeGreaterThan(0);
    expect(parseFloat(result.withdrawalAnalysis.projectedMonthlyIncome)).toBeGreaterThan(0);
  });

  it("should determine if on track for retirement", () => {
    const input: RetirementInput = {
      currentAge: 45,
      retirementAge: 65,
      currentIncome: 80000,
      accounts: [
        {
          accountType: "401k",
          currentBalance: 200000,
          annualContribution: 15000,
          employerMatch: 0.5,
          employerMatchLimit: 0.06,
        },
      ],
      expectedAnnualReturn: 0.07,
      inflationRate: 0.03,
      incomeIncreaseRate: 0.03,
      withdrawalStrategy: "4_percent_rule",
    };

    const result = RetirementEngine.analyze(input);

    expect(result.summary.onTrack).toBeDefined();
    expect(parseFloat(result.summary.replacementRatio)).toBeGreaterThan(0);
  });

  it("should handle multiple account types", () => {
    const input: RetirementInput = {
      currentAge: 50,
      retirementAge: 67,
      currentIncome: 150000,
      accounts: [
        {
          accountType: "401k",
          currentBalance: 300000,
          annualContribution: 22500,
          employerMatch: 1.0,
          employerMatchLimit: 0.04,
        },
        {
          accountType: "roth_ira",
          currentBalance: 50000,
          annualContribution: 7000,
        },
        {
          accountType: "traditional_ira",
          currentBalance: 75000,
          annualContribution: 0,
        },
      ],
      expectedAnnualReturn: 0.075,
      inflationRate: 0.03,
      incomeIncreaseRate: 0.025,
      withdrawalStrategy: "4_percent_rule",
    };

    const result = RetirementEngine.analyze(input);

    expect(result.input.totalAccounts).toBe(3);
    expect(parseFloat(result.input.totalCurrentBalance)).toBe(425000);
    expect(result.projectionSchedule[0]?.accounts.length).toBe(3);
  });

  it("should account for inflation in projections", () => {
    const input: RetirementInput = {
      currentAge: 25,
      retirementAge: 65,
      currentIncome: 60000,
      accounts: [
        {
          accountType: "roth_401k",
          currentBalance: 5000,
          annualContribution: 6000,
          employerMatch: 0.5,
          employerMatchLimit: 0.03,
        },
      ],
      expectedAnnualReturn: 0.08,
      inflationRate: 0.03,
      incomeIncreaseRate: 0.03,
      withdrawalStrategy: "4_percent_rule",
    };

    const result = RetirementEngine.analyze(input);

    const finalYear = result.projectionSchedule[result.projectionSchedule.length - 1];
    expect(finalYear).toBeDefined();
    if (finalYear) {
      const nominalBalance = parseFloat(finalYear.totalBalance);
      const realValue = parseFloat(finalYear.realValue);
      expect(realValue).toBeLessThan(nominalBalance);
    }
  });

  it("should provide recommendations", () => {
    const input: RetirementInput = {
      currentAge: 55,
      retirementAge: 67,
      currentIncome: 100000,
      accounts: [
        {
          accountType: "401k",
          currentBalance: 150000,
          annualContribution: 10000,
          employerMatch: 0.5,
          employerMatchLimit: 0.06,
        },
      ],
      expectedAnnualReturn: 0.065,
      inflationRate: 0.03,
      incomeIncreaseRate: 0.02,
      withdrawalStrategy: "4_percent_rule",
    };

    const result = RetirementEngine.analyze(input);

    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
