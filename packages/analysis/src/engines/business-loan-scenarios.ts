/**
 * Business Loan Scenario Comparison
 * Standalone model for comparing different loan scenarios
 */

import { Decimal } from 'decimal.js';
import type { BusinessLoanScenariosInput } from '../schemas/business-loan-scenarios.js';

export class BusinessLoanScenariosAnalyzer {
  private static calculateLoanPayment(
    principal: number,
    annualRate: number,
    termYears: number
  ): {
    monthlyPayment: number;
    totalInterest: number;
    totalCost: number;
  } {
    const monthlyRate = annualRate / 12;
    const termMonths = termYears * 12;
    const onePlusR = new Decimal(1).plus(monthlyRate);
    const onePlusRPowN = onePlusR.pow(termMonths);
    const numerator = new Decimal(monthlyRate).times(onePlusRPowN);
    const denominator = onePlusRPowN.minus(1);
    const monthlyPayment = new Decimal(principal).times(numerator).div(denominator).toNumber();
    const totalCost = monthlyPayment * termMonths;
    const totalInterest = totalCost - principal;

    return {
      monthlyPayment,
      totalInterest,
      totalCost,
    };
  }

  static analyze(input: BusinessLoanScenariosInput): unknown {
    const scenarios = input.scenarios.map((scenario) => {
      const loanDetails = this.calculateLoanPayment(input.loanAmount, scenario.rate, scenario.term);

      return {
        name: scenario.name,
        term: scenario.term,
        rate: scenario.rate,
        monthlyPayment: loanDetails.monthlyPayment,
        totalInterest: loanDetails.totalInterest,
        totalCost: loanDetails.totalCost,
        totalDebtService: loanDetails.monthlyPayment + input.currentDebtPayments,
        description: scenario.description,
      };
    });

    // Sort by total cost (ascending)
    const sortedByCost = [...scenarios].sort((a, b) => a.totalCost - b.totalCost);
    const cheapest = sortedByCost[0];

    // Sort by monthly payment (ascending)
    const sortedByPayment = [...scenarios].sort((a, b) => a.monthlyPayment - b.monthlyPayment);
    const lowestPayment = sortedByPayment[0];

    return {
      scenarios,
      comparison: {
        cheapest: {
          scenario: cheapest.name,
          totalCost: cheapest.totalCost,
          savings:
            scenarios.length > 1
              ? scenarios
                  .filter((s) => s.name !== cheapest.name)
                  .map((s) => s.totalCost - cheapest.totalCost)
                  .reduce((a, b) => Math.max(a, b), 0)
              : 0,
        },
        lowestPayment: {
          scenario: lowestPayment.name,
          monthlyPayment: lowestPayment.monthlyPayment,
          savings:
            scenarios.length > 1
              ? scenarios
                  .filter((s) => s.name !== lowestPayment.name)
                  .map((s) => s.monthlyPayment - lowestPayment.monthlyPayment)
                  .reduce((a, b) => Math.max(a, b), 0)
              : 0,
        },
      },
      recommendations: this.generateRecommendations(scenarios, cheapest, lowestPayment),
    };
  }

  private static generateRecommendations(
    scenarios: Array<{
      name: string;
      monthlyPayment: number;
      totalCost: number;
      totalInterest: number;
    }>,
    cheapest: { name: string; totalCost: number },
    lowestPayment: { name: string; monthlyPayment: number }
  ): string[] {
    const recommendations: string[] = [];

    if (scenarios.length > 1) {
      recommendations.push(
        `Lowest total cost: ${cheapest.name} (saves up to $${(scenarios[0].totalCost - cheapest.totalCost).toFixed(0)})`
      );
      recommendations.push(
        `Lowest monthly payment: ${lowestPayment.name} (saves $${(scenarios[0].monthlyPayment - lowestPayment.monthlyPayment).toFixed(0)}/month)`
      );
    }

    return recommendations;
  }
}
