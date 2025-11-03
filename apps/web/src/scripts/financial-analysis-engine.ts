/**
 * Comprehensive Financial Analysis Engine
 *
 * This module provides detailed analysis, insights, and recommendations
 * for all financial models in the application.
 */

export interface AnalysisInsight {
  category: 'financial' | 'risk' | 'opportunity' | 'optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
}

export interface AnalysisRecommendation {
  priority: 'low' | 'medium' | 'high';
  category: 'immediate' | 'short-term' | 'long-term';
  title: string;
  description: string;
  potentialSavings?: number;
  effort: 'low' | 'medium' | 'high';
}

export interface DetailedAnalysis {
  summary: Record<string, unknown>;
  insights: AnalysisInsight[];
  recommendations: AnalysisRecommendation[];
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    factors: Array<{ factor: string; risk: 'low' | 'medium' | 'high'; description: string }>;
  };
  optimizationOpportunities: Array<{
    area: string;
    currentValue: number;
    optimizedValue: number;
    potentialImprovement: number;
    description: string;
  }>;
}

export class FinancialAnalysisEngine {
  /**
   * Generate comprehensive analysis for amortization calculations
   */
  static analyzeAmortization(data: {
    principal: number;
    annualRate: number;
    termMonths: number;
    extraPayment?: number;
    monthlyPayment?: number;
    totalInterest?: number;
    totalPayments?: number;
  }): DetailedAnalysis {
    const monthlyRate = data.annualRate / 12;
    const monthlyPayment =
      data.monthlyPayment ||
      (data.principal * monthlyRate * Math.pow(1 + monthlyRate, data.termMonths)) /
        (Math.pow(1 + monthlyRate, data.termMonths) - 1);

    const totalInterest = data.totalInterest || monthlyPayment * data.termMonths - data.principal;
    const totalPayments = data.totalPayments || monthlyPayment * data.termMonths;
    const interestToPrincipalRatio = totalInterest / data.principal;
    const monthlyPaymentToIncomeRatio = monthlyPayment / 5000; // Assuming $5k monthly income
    const yearsToPayoff = data.termMonths / 12;
    const firstYearInterest =
      monthlyPayment * 12 * (data.annualRate / 12) * (data.principal / data.principal); // Simplified
    const lastYearInterest =
      monthlyPayment * 12 * (data.annualRate / 12) * ((data.principal * 0.1) / data.principal); // Simplified
    const equityBuildRate = (data.principal - totalInterest) / yearsToPayoff;

    const insights: AnalysisInsight[] = [
      {
        category: 'financial',
        title: 'Interest Impact Analysis',
        description: `You'll pay $${totalInterest.toLocaleString()} in interest, which is ${(interestToPrincipalRatio * 100).toFixed(1)}% of your loan amount. This means you're paying ${(interestToPrincipalRatio + 1).toFixed(1)}x the original loan amount.`,
        impact:
          interestToPrincipalRatio > 0.5
            ? 'high'
            : interestToPrincipalRatio > 0.3
              ? 'medium'
              : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Payment Affordability',
        description: `Your monthly payment of $${monthlyPayment.toLocaleString()} represents ${(monthlyPaymentToIncomeRatio * 100).toFixed(1)}% of a typical $5,000 monthly income. The 28% rule suggests keeping housing costs under $1,400/month.`,
        impact:
          monthlyPaymentToIncomeRatio > 0.3
            ? 'high'
            : monthlyPaymentToIncomeRatio > 0.2
              ? 'medium'
              : 'low',
        actionable: true,
      },
      {
        category: 'opportunity',
        title: 'Extra Payment Potential',
        description: data.extraPayment
          ? `Adding $${data.extraPayment.toLocaleString()} monthly could save significant interest and reduce your loan term.`
          : `Consider adding extra payments to reduce total interest cost. Even $100/month could save thousands.`,
        impact: 'medium',
        actionable: true,
      },
      {
        category: 'financial',
        title: 'Interest Distribution',
        description: `In the first year, you'll pay approximately $${firstYearInterest.toLocaleString()} in interest. By the last year, this drops to around $${lastYearInterest.toLocaleString()}, showing how interest decreases over time.`,
        impact: 'medium',
        actionable: false,
      },
      {
        category: 'optimization',
        title: 'Equity Building Timeline',
        description: `You'll build equity at an average rate of $${equityBuildRate.toLocaleString()} per year. The first few years primarily build interest, while later years build more equity.`,
        impact: 'low',
        actionable: true,
      },
    ];

    const recommendations: AnalysisRecommendation[] = [
      {
        priority: 'high',
        category: 'immediate',
        title: 'Verify Affordability',
        description:
          "Ensure your monthly payment doesn't exceed 28% of your gross monthly income. Consider your total debt-to-income ratio including other loans.",
        effort: 'low',
      },
      {
        priority: 'high',
        category: 'immediate',
        title: 'Emergency Fund Check',
        description:
          'Before making extra payments, ensure you have 3-6 months of expenses saved for emergencies.',
        effort: 'medium',
      },
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Consider Extra Payments',
        description:
          'Even $100 extra per month could save thousands in interest over the loan term and reduce your payoff time significantly.',
        potentialSavings: this.calculateExtraPaymentSavings(
          data.principal,
          data.annualRate,
          data.termMonths,
          100
        ),
        effort: 'low',
      },
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Bi-weekly Payment Strategy',
        description:
          'Consider bi-weekly payments instead of monthly. This results in 26 half-payments (13 full payments) per year, reducing interest and term.',
        potentialSavings: monthlyPayment * 0.5 * 12 * (yearsToPayoff * 0.1), // Rough estimate
        effort: 'low',
      },
      {
        priority: 'medium',
        category: 'long-term',
        title: 'Refinancing Opportunity',
        description:
          'Monitor interest rates for potential refinancing opportunities. Consider refinancing if rates drop by 0.5% or more.',
        effort: 'medium',
      },
      {
        priority: 'low',
        category: 'long-term',
        title: 'Tax Optimization',
        description:
          'If this is a mortgage, ensure you understand the tax implications of mortgage interest deductions.',
        effort: 'low',
      },
    ];

    return {
      summary: {
        monthlyPayment: monthlyPayment,
        totalInterest: totalInterest,
        totalPayments: totalPayments,
        interestToPrincipalRatio: interestToPrincipalRatio,
        paymentToIncomeRatio: monthlyPaymentToIncomeRatio,
        principal: data.principal,
        annualRate: data.annualRate,
        termMonths: data.termMonths,
        yearsToPayoff: yearsToPayoff,
        firstYearInterest: firstYearInterest,
        lastYearInterest: lastYearInterest,
        equityBuildRate: equityBuildRate,
        extraPayment: data.extraPayment || 0,
      },
      insights,
      recommendations,
      riskAssessment: {
        overallRisk:
          monthlyPaymentToIncomeRatio > 0.3
            ? 'high'
            : monthlyPaymentToIncomeRatio > 0.2
              ? 'medium'
              : 'low',
        factors: [
          {
            factor: 'Payment Burden',
            risk:
              monthlyPaymentToIncomeRatio > 0.3
                ? 'high'
                : monthlyPaymentToIncomeRatio > 0.2
                  ? 'medium'
                  : 'low',
            description: `Monthly payment represents ${(monthlyPaymentToIncomeRatio * 100).toFixed(1)}% of typical income`,
          },
          {
            factor: 'Interest Rate Risk',
            risk: data.annualRate > 0.08 ? 'high' : data.annualRate > 0.06 ? 'medium' : 'low',
            description: `Current rate of ${(data.annualRate * 100).toFixed(2)}% is ${data.annualRate > 0.08 ? 'high' : data.annualRate > 0.06 ? 'moderate' : 'low'} risk`,
          },
          {
            factor: 'Loan Term Risk',
            risk: data.termMonths > 360 ? 'high' : data.termMonths > 240 ? 'medium' : 'low',
            description: `${yearsToPayoff.toFixed(1)}-year commitment requires long-term financial stability`,
          },
          {
            factor: 'Interest Cost Risk',
            risk:
              interestToPrincipalRatio > 0.5
                ? 'high'
                : interestToPrincipalRatio > 0.3
                  ? 'medium'
                  : 'low',
            description: `Interest costs ${(interestToPrincipalRatio * 100).toFixed(1)}% of loan amount`,
          },
          {
            factor: 'Refinancing Risk',
            risk: data.annualRate > 0.07 ? 'medium' : 'low',
            description: 'Higher rates may limit refinancing opportunities',
          },
        ],
      },
      optimizationOpportunities: [
        {
          area: 'Extra Payments',
          currentValue: data.extraPayment || 0,
          optimizedValue: 100,
          potentialImprovement: this.calculateExtraPaymentSavings(
            data.principal,
            data.annualRate,
            data.termMonths,
            100
          ),
          description: 'Adding $100 monthly extra payment',
        },
        {
          area: 'Bi-weekly Payments',
          currentValue: monthlyPayment,
          optimizedValue: monthlyPayment * 0.5,
          potentialImprovement: monthlyPayment * 0.5 * 12 * (yearsToPayoff * 0.1),
          description: 'Switching to bi-weekly payments (13 payments/year)',
        },
        {
          area: 'Shorter Term',
          currentValue: data.termMonths,
          optimizedValue: Math.round(data.termMonths * 0.8),
          potentialImprovement: this.calculateTermReductionSavings(
            data.principal,
            data.annualRate,
            data.termMonths
          ),
          description: 'Reducing loan term by 20%',
        },
        {
          area: 'Rate Refinancing',
          currentValue: data.annualRate,
          optimizedValue: data.annualRate * 0.9,
          potentialImprovement: this.calculateRateReductionSavings(
            data.principal,
            data.annualRate,
            data.termMonths
          ),
          description: 'Refinancing to 10% lower rate',
        },
      ],
    };
  }

  /**
   * Generate comprehensive analysis for lease calculations
   */
  static analyzeLease(data: {
    principal: number;
    annualRate: number;
    termMonths: number;
    residualValue: number;
    monthlyPayment?: number;
    totalCost?: number;
  }): DetailedAnalysis {
    const monthlyRate = data.annualRate / 12;
    const monthlyPayment =
      data.monthlyPayment ||
      ((data.principal - data.residualValue) *
        monthlyRate *
        Math.pow(1 + monthlyRate, data.termMonths)) /
        (Math.pow(1 + monthlyRate, data.termMonths) - 1);

    const totalCost = data.totalCost || monthlyPayment * data.termMonths + data.residualValue;
    const costPerMonth = totalCost / data.termMonths;
    const residualPercentage = (data.residualValue / data.principal) * 100;

    const insights: AnalysisInsight[] = [
      {
        category: 'financial',
        title: 'Total Lease Cost',
        description: `Your total lease cost is $${totalCost.toLocaleString()}, averaging $${costPerMonth.toLocaleString()} per month.`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Residual Value Risk',
        description: `The residual value of $${data.residualValue.toLocaleString()} (${residualPercentage.toFixed(1)}%) represents your end-of-lease obligation.`,
        impact: residualPercentage < 50 ? 'high' : residualPercentage < 60 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'opportunity',
        title: 'Lease vs Buy Analysis',
        description:
          'Consider comparing total lease cost to purchase price to determine the better option.',
        impact: 'medium',
        actionable: true,
      },
    ];

    const recommendations: AnalysisRecommendation[] = [
      {
        priority: 'high',
        category: 'immediate',
        title: 'Verify Residual Value',
        description: 'Ensure the residual value aligns with expected vehicle depreciation.',
        effort: 'low',
      },
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Mileage Planning',
        description: 'Plan your mileage usage to avoid excess mileage charges.',
        effort: 'low',
      },
      {
        priority: 'medium',
        category: 'long-term',
        title: 'End-of-Lease Options',
        description: 'Research your options: buy, return, or lease another vehicle.',
        effort: 'medium',
      },
    ];

    return {
      summary: {
        monthlyPayment: monthlyPayment,
        totalCost: totalCost,
        residualValue: data.residualValue,
        residualPercentage: residualPercentage,
        costPerMonth: costPerMonth,
        principal: data.principal,
        annualRate: data.annualRate,
        termMonths: data.termMonths,
      },
      insights,
      recommendations,
      riskAssessment: {
        overallRisk: residualPercentage < 50 ? 'high' : residualPercentage < 60 ? 'medium' : 'low',
        factors: [
          {
            factor: 'Residual Value Risk',
            risk: residualPercentage < 50 ? 'high' : residualPercentage < 60 ? 'medium' : 'low',
            description: 'End-of-lease vehicle value',
          },
          {
            factor: 'Interest Rate Risk',
            risk: data.annualRate > 0.08 ? 'high' : data.annualRate > 0.06 ? 'medium' : 'low',
            description: 'Current lease rate',
          },
          {
            factor: 'Mileage Risk',
            risk: 'medium',
            description: 'Potential excess mileage charges',
          },
        ],
      },
      optimizationOpportunities: [
        {
          area: 'Negotiate Residual',
          currentValue: data.residualValue,
          optimizedValue: data.residualValue * 1.05,
          potentialImprovement: monthlyPayment * 0.1,
          description: 'Negotiating 5% higher residual value',
        },
        {
          area: 'Lower Interest Rate',
          currentValue: data.annualRate,
          optimizedValue: data.annualRate * 0.9,
          potentialImprovement: this.calculateRateReductionSavings(
            data.principal,
            data.annualRate,
            data.termMonths
          ),
          description: 'Securing 10% lower interest rate',
        },
      ],
    };
  }

  /**
   * Generate comprehensive analysis for investment portfolio
   */
  static analyzeInvestmentPortfolio(data: {
    currentValue: number;
    monthlyContribution: number;
    expectedReturn: number;
    timeHorizon: number;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  }): DetailedAnalysis {
    const futureValue = this.calculateFutureValue(
      data.currentValue,
      data.monthlyContribution,
      data.expectedReturn,
      data.timeHorizon
    );
    const totalContributions = data.currentValue + data.monthlyContribution * 12 * data.timeHorizon;
    const totalGains = futureValue - totalContributions;
    const annualizedReturn = Math.pow(futureValue / data.currentValue, 1 / data.timeHorizon) - 1;

    const insights: AnalysisInsight[] = [
      {
        category: 'financial',
        title: 'Projected Growth',
        description: `Your portfolio could grow to $${futureValue.toLocaleString()} in ${data.timeHorizon} years with ${(data.expectedReturn * 100).toFixed(1)}% annual returns.`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Contribution Impact',
        description: `Your monthly contributions of $${data.monthlyContribution.toLocaleString()} will account for ${(((data.monthlyContribution * 12 * data.timeHorizon) / futureValue) * 100).toFixed(1)}% of your final portfolio value.`,
        impact: 'medium',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Risk Alignment',
        description: `Your ${data.riskTolerance} risk tolerance aligns with a ${data.expectedReturn > 0.08 ? 'growth-focused' : data.expectedReturn > 0.05 ? 'balanced' : 'conservative'} strategy.`,
        impact: 'medium',
        actionable: true,
      },
    ];

    const recommendations: AnalysisRecommendation[] = [
      {
        priority: 'high',
        category: 'immediate',
        title: 'Asset Allocation Review',
        description:
          'Ensure your portfolio allocation matches your risk tolerance and time horizon.',
        effort: 'medium',
      },
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Increase Contributions',
        description: 'Consider increasing monthly contributions to accelerate growth.',
        potentialSavings: this.calculateContributionIncreaseImpact(
          data.monthlyContribution,
          data.expectedReturn,
          data.timeHorizon
        ),
        effort: 'low',
      },
      {
        priority: 'medium',
        category: 'long-term',
        title: 'Tax Optimization',
        description: 'Consider tax-advantaged accounts like 401(k) or IRA for additional benefits.',
        effort: 'medium',
      },
    ];

    return {
      summary: {
        currentValue: data.currentValue,
        futureValue: futureValue,
        totalContributions: totalContributions,
        totalGains: totalGains,
        annualizedReturn: annualizedReturn,
        monthlyContribution: data.monthlyContribution,
        expectedReturn: data.expectedReturn,
        timeHorizon: data.timeHorizon,
      },
      insights,
      recommendations,
      riskAssessment: {
        overallRisk:
          data.riskTolerance === 'aggressive'
            ? 'high'
            : data.riskTolerance === 'moderate'
              ? 'medium'
              : 'low',
        factors: [
          {
            factor: 'Market Risk',
            risk:
              data.expectedReturn > 0.08 ? 'high' : data.expectedReturn > 0.05 ? 'medium' : 'low',
            description: 'Volatility based on expected returns',
          },
          {
            factor: 'Time Horizon Risk',
            risk: data.timeHorizon < 5 ? 'high' : data.timeHorizon < 10 ? 'medium' : 'low',
            description: 'Investment timeline',
          },
          {
            factor: 'Contribution Risk',
            risk:
              data.monthlyContribution < 500
                ? 'high'
                : data.monthlyContribution < 1000
                  ? 'medium'
                  : 'low',
            description: 'Consistency of contributions',
          },
        ],
      },
      optimizationOpportunities: [
        {
          area: 'Increase Contributions',
          currentValue: data.monthlyContribution,
          optimizedValue: data.monthlyContribution * 1.2,
          potentialImprovement: this.calculateContributionIncreaseImpact(
            data.monthlyContribution,
            data.expectedReturn,
            data.timeHorizon
          ),
          description: 'Increasing monthly contributions by 20%',
        },
        {
          area: 'Optimize Asset Allocation',
          currentValue: data.expectedReturn,
          optimizedValue: data.expectedReturn * 1.1,
          potentialImprovement: this.calculateReturnOptimizationImpact(
            data.currentValue,
            data.monthlyContribution,
            data.expectedReturn,
            data.timeHorizon
          ),
          description: 'Optimizing portfolio for 10% better returns',
        },
      ],
    };
  }

  // Helper methods for calculations
  private static calculateExtraPaymentSavings(
    principal: number,
    annualRate: number,
    termMonths: number,
    extraPayment: number
  ): number {
    const monthlyRate = annualRate / 12;
    const originalTotal =
      ((principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)) *
      termMonths;

    // Simplified calculation - in reality this would require iterative calculation
    return originalTotal * 0.15; // Estimate 15% savings
  }

  private static calculateTermReductionSavings(
    principal: number,
    annualRate: number,
    termMonths: number
  ): number {
    const monthlyRate = annualRate / 12;
    const originalTotal =
      ((principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)) *
      termMonths;

    const newTermMonths = Math.round(termMonths * 0.8);
    const newMonthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, newTermMonths)) /
      (Math.pow(1 + monthlyRate, newTermMonths) - 1);
    const newTotal = newMonthlyPayment * newTermMonths;

    return originalTotal - newTotal;
  }

  private static calculateRateReductionSavings(
    principal: number,
    annualRate: number,
    termMonths: number
  ): number {
    const monthlyRate = annualRate / 12;
    const originalTotal =
      ((principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)) *
      termMonths;

    const newAnnualRate = annualRate * 0.9;
    const newMonthlyRate = newAnnualRate / 12;
    const newMonthlyPayment =
      (principal * newMonthlyRate * Math.pow(1 + newMonthlyRate, termMonths)) /
      (Math.pow(1 + newMonthlyRate, termMonths) - 1);
    const newTotal = newMonthlyPayment * termMonths;

    return originalTotal - newTotal;
  }

  private static calculateFutureValue(
    currentValue: number,
    monthlyContribution: number,
    annualReturn: number,
    years: number
  ): number {
    const monthlyReturn = annualReturn / 12;
    const months = years * 12;

    const futureValueOfLumpSum = currentValue * Math.pow(1 + monthlyReturn, months);
    const futureValueOfAnnuity =
      monthlyContribution * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);

    return futureValueOfLumpSum + futureValueOfAnnuity;
  }

  private static calculateContributionIncreaseImpact(
    currentContribution: number,
    annualReturn: number,
    years: number
  ): number {
    const increasedContribution = currentContribution * 1.2;
    const currentFutureValue = this.calculateFutureValue(
      0,
      currentContribution,
      annualReturn,
      years
    );
    const increasedFutureValue = this.calculateFutureValue(
      0,
      increasedContribution,
      annualReturn,
      years
    );

    return increasedFutureValue - currentFutureValue;
  }

  private static calculateReturnOptimizationImpact(
    currentValue: number,
    monthlyContribution: number,
    currentReturn: number,
    years: number
  ): number {
    const optimizedReturn = currentReturn * 1.1;
    const currentFutureValue = this.calculateFutureValue(
      currentValue,
      monthlyContribution,
      currentReturn,
      years
    );
    const optimizedFutureValue = this.calculateFutureValue(
      currentValue,
      monthlyContribution,
      optimizedReturn,
      years
    );

    return optimizedFutureValue - currentFutureValue;
  }
}
