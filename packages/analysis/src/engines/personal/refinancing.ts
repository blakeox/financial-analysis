/**
 * Refinancing Calculator
 * Comprehensive mortgage refinancing analysis
 */

import { Decimal } from 'decimal.js';
import type { RefinancingInput } from '../../schemas/refinancing.js';

export class RefinancingCalculator {
  /**
   * Analyze mortgage refinancing options
   */
  static analyze(input: RefinancingInput): unknown {
    const currentMortgage = input.currentMortgage;
    const newMortgage = input.newMortgage;
    const costs = input.costs;
    const goals = input.goals;

    // Calculate new loan amount
    const newLoanAmount =
      currentMortgage.principalBalance +
      newMortgage.cashOutAmount -
      newMortgage.cashInAmount +
      costs.closingCosts;

    // Calculate new monthly payment
    const newPayment = this.calculateMonthlyPayment(
      newLoanAmount,
      newMortgage.interestRate,
      newMortgage.term
    );

    // Calculate remaining payments on current mortgage
    const currentRemainingPayments = this.calculateRemainingPayments(currentMortgage);

    // Calculate total interest comparison
    const interestComparison = this.compareInterestCosts(currentMortgage, newPayment);

    // Break-even analysis
    const breakEvenAnalysis = goals.includeBreakEvenAnalysis
      ? this.calculateBreakEven(
          currentMortgage.monthlyPayment,
          newPayment.monthlyPayment,
          costs.closingCosts + costs.points * newLoanAmount * 0.01
        )
      : undefined;

    // Net benefit analysis
    const netBenefit = this.calculateNetBenefit(
      costs.closingCosts + costs.points * newLoanAmount * 0.01,
      interestComparison
    );

    // Recommendations
    const recommendations = this.generateRecommendations(
      breakEvenAnalysis,
      netBenefit,
      interestComparison,
      goals
    );

    return {
      summary: {
        newLoanAmount,
        newMonthlyPayment: newPayment.monthlyPayment,
        monthlySavings: currentMortgage.monthlyPayment - newPayment.monthlyPayment,
        totalInterestSavings: interestComparison.totalSavings,
        breakEvenMonths: breakEvenAnalysis?.breakEvenMonths,
        netBenefit: netBenefit.totalSavings,
      },
      newPayment,
      currentRemainingPayments,
      interestComparison,
      breakEvenAnalysis,
      netBenefit,
      recommendations,
    };
  }

  private static calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    termYears: number
  ): {
    monthlyPayment: number;
    totalPayments: number;
    totalInterest: number;
  } {
    const monthlyRate = annualRate / 12;
    const termMonths = termYears * 12;
    const onePlusR = new Decimal(1).plus(monthlyRate);
    const onePlusRPowN = onePlusR.pow(termMonths);
    const numerator = new Decimal(monthlyRate).times(onePlusRPowN);
    const denominator = onePlusRPowN.minus(1);
    const monthlyPayment = new Decimal(principal).times(numerator).div(denominator).toNumber();
    const totalPayments = monthlyPayment * termMonths;
    const totalInterest = totalPayments - principal;

    return {
      monthlyPayment,
      totalPayments,
      totalInterest,
    };
  }

  private static calculateRemainingPayments(currentMortgage: RefinancingInput['currentMortgage']): {
    remainingPayments: number;
    totalRemainingInterest: number;
    totalRemainingCost: number;
  } {
    const remainingMonths = currentMortgage.remainingTerm * 12;

    // Calculate remaining balance using amortization formula
    // Note: Remaining balance calculation removed as it's not used in the return value
    // const onePlusR = new Decimal(1).plus(monthlyRate);
    // const onePlusRPowN = onePlusR.pow(remainingMonths);
    // const remainingBalance = new Decimal(currentMortgage.principalBalance)
    //   .times(onePlusRPowN)
    //   .minus(
    //     new Decimal(currentMortgage.monthlyPayment).times(onePlusRPowN.minus(1)).div(monthlyRate)
    //   )
    //   .toNumber();

    const totalRemainingPayments = currentMortgage.monthlyPayment * remainingMonths;
    const totalRemainingInterest = totalRemainingPayments - currentMortgage.principalBalance;

    return {
      remainingPayments: remainingMonths,
      totalRemainingInterest,
      totalRemainingCost: totalRemainingPayments,
    };
  }

  private static compareInterestCosts(
    currentMortgage: RefinancingInput['currentMortgage'],
    newPayment: { totalInterest: number }
  ): {
    currentTotalInterest: number;
    newTotalInterest: number;
    totalSavings: number;
    percentSavings: number;
  } {
    const remaining = this.calculateRemainingPayments(currentMortgage);
    const currentTotalInterest = remaining.totalRemainingInterest;
    const newTotalInterest = newPayment.totalInterest;
    const totalSavings = currentTotalInterest - newTotalInterest;
    const percentSavings =
      currentTotalInterest > 0 ? (totalSavings / currentTotalInterest) * 100 : 0;

    return {
      currentTotalInterest,
      newTotalInterest,
      totalSavings,
      percentSavings,
    };
  }

  private static calculateBreakEven(
    currentPayment: number,
    newPayment: number,
    totalCosts: number
  ): {
    breakEvenMonths: number;
    breakEvenYears: number;
    monthlySavings: number;
    analysis: Array<{
      month: number;
      cumulativeSavings: number;
      netPosition: number;
    }>;
  } {
    const monthlySavings = currentPayment - newPayment;
    const breakEvenMonths = monthlySavings > 0 ? totalCosts / monthlySavings : 999;
    const breakEvenYears = breakEvenMonths / 12;

    const analysis: Array<{
      month: number;
      cumulativeSavings: number;
      netPosition: number;
    }> = [];

    for (let month = 1; month <= Math.min(breakEvenMonths * 2, 120); month++) {
      const cumulativeSavings = monthlySavings * month;
      const netPosition = cumulativeSavings - totalCosts;
      analysis.push({
        month,
        cumulativeSavings,
        netPosition,
      });
    }

    return {
      breakEvenMonths,
      breakEvenYears,
      monthlySavings,
      analysis,
    };
  }

  private static calculateNetBenefit(
    totalCosts: number,
    interestComparison: { totalSavings: number }
  ): {
    totalSavings: number;
    netSavings: number;
    roi: number;
  } {
    const totalSavings = interestComparison.totalSavings;
    const netSavings = totalSavings - totalCosts;
    const roi = totalCosts > 0 ? (netSavings / totalCosts) * 100 : 0;

    return {
      totalSavings,
      netSavings,
      roi,
    };
  }

  private static generateRecommendations(
    breakEvenAnalysis?: { breakEvenMonths: number; monthlySavings: number },
    netBenefit?: { netSavings: number; roi: number },
    interestComparison?: { totalSavings: number },
    goals?: RefinancingInput['goals']
  ): string[] {
    const recommendations: string[] = [];

    if (breakEvenAnalysis) {
      if (breakEvenAnalysis.breakEvenMonths < 24) {
        recommendations.push(
          `Excellent break-even point: ${breakEvenAnalysis.breakEvenMonths.toFixed(0)} months - refinancing makes sense`
        );
      } else if (breakEvenAnalysis.breakEvenMonths < 60) {
        recommendations.push(
          `Break-even in ${breakEvenAnalysis.breakEvenMonths.toFixed(0)} months - consider if you plan to stay in home longer`
        );
      } else {
        recommendations.push(
          `Break-even in ${breakEvenAnalysis.breakEvenMonths.toFixed(0)} months - may not be worth refinancing unless staying long-term`
        );
      }

      recommendations.push(
        `Monthly savings: $${breakEvenAnalysis.monthlySavings.toFixed(0)} - saves $${(breakEvenAnalysis.monthlySavings * 12).toFixed(0)}/year`
      );
    }

    if (netBenefit && netBenefit.netSavings > 0) {
      recommendations.push(
        `Total net savings: $${netBenefit.netSavings.toFixed(0)} (ROI: ${netBenefit.roi.toFixed(0)}%)`
      );
    }

    if (interestComparison && interestComparison.totalSavings > 0) {
      recommendations.push(
        `Total interest savings: $${interestComparison.totalSavings.toFixed(0)} over loan term`
      );
    }

    if (goals?.priority === 'shorter-term') {
      recommendations.push(
        'Refinancing to shorter term will save significant interest but increase monthly payment'
      );
    }

    return recommendations;
  }
}
