/**
 * Business Expansion Loan Journey
 * Comprehensive analysis for businesses considering loans for expansion
 *
 * Implements business expansion loan analysis including:
 * - Current financial health assessment
 * - Debt capacity analysis
 * - Cash flow projections with loan payments
 * - Loan term optimization
 * - Risk assessment
 * - Scenario analysis
 * - Integration with cash flow, EBITDA, and amortization models
 */

import { Decimal } from 'decimal.js';
import type { BusinessExpansionLoanInput } from '../schemas/business-expansion-loan.js';

export class BusinessExpansionLoanJourney {
  /**
   * Analyze business expansion loan feasibility and provide comprehensive recommendations
   */
  static analyze(input: BusinessExpansionLoanInput): unknown {
    const businessInfo = input.businessInfo;
    const currentFinancials = input.currentFinancials;
    const expansionPlan = input.expansionPlan;
    const loanPreferences = input.loanPreferences;
    const goals = input.goals;

    // Calculate current financial health metrics
    const financialHealth = this.assessFinancialHealth(currentFinancials, businessInfo);

    // Calculate debt capacity
    const debtCapacity = this.calculateDebtCapacity(
      currentFinancials,
      expansionPlan,
      loanPreferences
    );

    // Calculate loan payment scenarios
    const loanScenarios = this.calculateLoanScenarios(
      expansionPlan.loanAmount,
      loanPreferences,
      currentFinancials
    );

    // Project cash flow with loan
    const cashFlowProjection = this.projectCashFlowWithLoan(
      currentFinancials,
      expansionPlan,
      loanScenarios.optimalScenario
    );

    // Calculate debt service coverage ratio
    const dscr = this.calculateDSCR(
      currentFinancials.annualEBITDA + expansionPlan.expectedEBITDAIncrease,
      loanScenarios.optimalScenario.monthlyPayment * 12
    );

    // Assess risk factors
    const riskAssessment = this.assessRisks(
      financialHealth,
      debtCapacity,
      dscr,
      expansionPlan,
      currentFinancials
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      financialHealth,
      debtCapacity,
      loanScenarios,
      dscr,
      riskAssessment,
      goals
    );

    // Calculate success probability
    const successProbability = this.calculateSuccessProbability(
      financialHealth,
      debtCapacity,
      dscr,
      riskAssessment
    );

    return {
      summary: {
        financialHealthScore: financialHealth.score,
        debtCapacity: debtCapacity.maxLoanAmount,
        recommendedLoanAmount: debtCapacity.recommendedLoanAmount,
        monthlyPayment: loanScenarios.optimalScenario.monthlyPayment,
        dscr: dscr.ratio,
        successProbability: successProbability * 100,
        riskLevel: riskAssessment.overallRisk,
      },
      financialHealth,
      debtCapacity,
      loanScenarios: {
        optimal: loanScenarios.optimalScenario,
        alternatives: loanScenarios.alternatives,
      },
      cashFlowProjection,
      dscr,
      riskAssessment,
      recommendations,
      insights: [
        `Your business has a financial health score of ${financialHealth.score}/100`,
        `Maximum recommended loan amount: $${debtCapacity.recommendedLoanAmount.toFixed(0)}`,
        `Debt service coverage ratio: ${dscr.ratio.toFixed(2)}x (target: >1.25x)`,
        `Success probability: ${(successProbability * 100).toFixed(0)}%`,
        riskAssessment.overallRisk === 'low'
          ? 'Your business is in a strong position to take on expansion debt'
          : riskAssessment.overallRisk === 'medium'
            ? 'Proceed with caution and consider improving financial metrics first'
            : 'Consider alternative financing or improving business fundamentals before taking on debt',
      ],
    };
  }

  private static assessFinancialHealth(
    financials: BusinessExpansionLoanInput['currentFinancials'],
    businessInfo: BusinessExpansionLoanInput['businessInfo']
  ): {
    score: number;
    metrics: {
      debtToEquity: number;
      currentRatio: number;
      quickRatio: number;
      debtToEBITDA: number;
    };
    strengths: string[];
    weaknesses: string[];
  } {
    const ebitda = financials.annualEBITDA;
    const debtToEBITDA = ebitda > 0 ? financials.currentDebt / ebitda : 999;
    const currentRatio =
      financials.accountsPayable > 0
        ? (financials.cashOnHand + financials.accountsReceivable) / financials.accountsPayable
        : 999;
    const quickRatio =
      financials.accountsPayable > 0 ? financials.cashOnHand / financials.accountsPayable : 999;

    let score = 100;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Debt to EBITDA (target: <3x)
    if (debtToEBITDA < 2) {
      score += 10;
      strengths.push('Low debt-to-EBITDA ratio indicates strong debt capacity');
    } else if (debtToEBITDA > 5) {
      score -= 30;
      weaknesses.push('High debt-to-EBITDA ratio may limit borrowing capacity');
    } else if (debtToEBITDA > 3) {
      score -= 15;
      weaknesses.push('Moderate debt-to-EBITDA ratio - monitor closely');
    }

    // Current ratio (target: >1.5)
    if (currentRatio > 2) {
      score += 10;
      strengths.push('Strong current ratio indicates good liquidity');
    } else if (currentRatio < 1) {
      score -= 20;
      weaknesses.push('Current ratio below 1.0 indicates liquidity concerns');
    }

    // Quick ratio (target: >1.0)
    if (quickRatio > 1.5) {
      score += 5;
      strengths.push('Strong quick ratio shows good cash position');
    } else if (quickRatio < 0.5) {
      score -= 15;
      weaknesses.push('Low quick ratio - limited cash reserves');
    }

    // Years in business
    if (businessInfo.yearsInBusiness > 5) {
      score += 5;
      strengths.push('Established business history improves loan eligibility');
    } else if (businessInfo.yearsInBusiness < 2) {
      score -= 10;
      weaknesses.push('Newer business may face higher rates or stricter terms');
    }

    // Credit score
    if (financials.creditScore && financials.creditScore >= 720) {
      score += 10;
      strengths.push('Excellent credit score will help secure favorable terms');
    } else if (financials.creditScore && financials.creditScore < 620) {
      score -= 20;
      weaknesses.push('Low credit score may limit loan options or increase rates');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      metrics: {
        debtToEquity: 0, // Would need equity data
        currentRatio,
        quickRatio,
        debtToEBITDA,
      },
      strengths,
      weaknesses,
    };
  }

  private static calculateDebtCapacity(
    financials: BusinessExpansionLoanInput['currentFinancials'],
    expansionPlan: BusinessExpansionLoanInput['expansionPlan'],
    loanPreferences: BusinessExpansionLoanInput['loanPreferences']
  ): {
    maxLoanAmount: number;
    recommendedLoanAmount: number;
    debtCapacityRatio: number;
    factors: string[];
  } {
    const ebitda = financials.annualEBITDA + expansionPlan.expectedEBITDAIncrease;
    const currentDebtService = financials.monthlyDebtPayments * 12;

    // Conservative approach: DSCR of 1.5x means can service 1.5x current EBITDA
    // After existing debt service
    const availableForNewDebt = ebitda * 1.5 - currentDebtService;

    // Calculate maximum loan based on interest rate and term
    const interestRate =
      loanPreferences.preferredRate || this.getMarketRate(loanPreferences.loanType);
    const termMonths = loanPreferences.preferredTerm * 12;

    // Use amortization formula to work backwards from payment capacity
    const monthlyPaymentCapacity = availableForNewDebt / 12;
    const monthlyRate = interestRate / 12;
    const onePlusR = new Decimal(1).plus(monthlyRate);
    const onePlusRPowN = onePlusR.pow(termMonths);
    const numerator = onePlusRPowN.minus(1);
    const denominator = new Decimal(monthlyRate).times(onePlusRPowN);
    const maxLoanAmount = new Decimal(monthlyPaymentCapacity)
      .times(numerator)
      .div(denominator)
      .toNumber();

    // Recommended amount is 80% of max for safety
    const recommendedLoanAmount = maxLoanAmount * 0.8;

    const factors: string[] = [];
    if (maxLoanAmount >= expansionPlan.loanAmount) {
      factors.push('Your business can support the requested loan amount');
    } else {
      factors.push(
        `Maximum loan capacity: $${maxLoanAmount.toFixed(0)} (requested: $${expansionPlan.loanAmount.toFixed(0)})`
      );
    }

    return {
      maxLoanAmount,
      recommendedLoanAmount: Math.min(recommendedLoanAmount, expansionPlan.loanAmount),
      debtCapacityRatio: maxLoanAmount / expansionPlan.loanAmount,
      factors,
    };
  }

  private static calculateLoanScenarios(
    loanAmount: number,
    loanPreferences: BusinessExpansionLoanInput['loanPreferences'],
    financials: BusinessExpansionLoanInput['currentFinancials']
  ): {
    optimalScenario: {
      term: number;
      rate: number;
      monthlyPayment: number;
      totalInterest: number;
      totalCost: number;
    };
    alternatives: Array<{
      term: number;
      rate: number;
      monthlyPayment: number;
      totalInterest: number;
      totalCost: number;
      description: string;
    }>;
  } {
    const baseRate = loanPreferences.preferredRate || this.getMarketRate(loanPreferences.loanType);
    const baseTerm = loanPreferences.preferredTerm;

    // Calculate optimal scenario
    const optimalScenario = this.calculateLoanPayment(loanAmount, baseRate, baseTerm);

    // Generate alternatives
    const alternatives: Array<{
      term: number;
      rate: number;
      monthlyPayment: number;
      totalInterest: number;
      totalCost: number;
      description: string;
    }> = [];

    // Shorter term (higher payment, less interest)
    if (baseTerm > 3) {
      const shorterTerm = Math.max(3, baseTerm - 2);
      const alt = this.calculateLoanPayment(loanAmount, baseRate, shorterTerm);
      alternatives.push({
        ...alt,
        term: shorterTerm,
        description: `Shorter ${shorterTerm}-year term saves $${(optimalScenario.totalInterest - alt.totalInterest).toFixed(0)} in interest`,
      });
    }

    // Longer term (lower payment, more interest)
    if (baseTerm < 10) {
      const longerTerm = Math.min(10, baseTerm + 2);
      const alt = this.calculateLoanPayment(loanAmount, baseRate, longerTerm);
      alternatives.push({
        ...alt,
        term: longerTerm,
        description: `Longer ${longerTerm}-year term reduces monthly payment by $${(optimalScenario.monthlyPayment - alt.monthlyPayment).toFixed(0)}`,
      });
    }

    // Better rate scenario (if credit is good)
    if (financials.creditScore && financials.creditScore >= 720) {
      const betterRate = baseRate * 0.9; // 10% better rate
      const alt = this.calculateLoanPayment(loanAmount, betterRate, baseTerm);
      alternatives.push({
        ...alt,
        rate: betterRate,
        description: `With excellent credit, you may qualify for a ${(betterRate * 100).toFixed(2)}% rate`,
      });
    }

    return {
      optimalScenario: {
        term: baseTerm,
        rate: baseRate,
        ...optimalScenario,
      },
      alternatives,
    };
  }

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

  private static projectCashFlowWithLoan(
    currentFinancials: BusinessExpansionLoanInput['currentFinancials'],
    expansionPlan: BusinessExpansionLoanInput['expansionPlan'],
    loanScenario: { monthlyPayment: number }
  ): {
    months: Array<{
      month: number;
      revenue: number;
      ebitda: number;
      loanPayment: number;
      netCashFlow: number;
      cumulativeCashFlow: number;
    }>;
    summary: {
      averageMonthlyCashFlow: number;
      monthsPositive: number;
      monthsNegative: number;
      minimumCashBalance: number;
    };
  } {
    const months: Array<{
      month: number;
      revenue: number;
      ebitda: number;
      loanPayment: number;
      netCashFlow: number;
      cumulativeCashFlow: number;
    }> = [];

    const monthlyRevenue = currentFinancials.annualRevenue / 12;
    const monthlyEBITDA = currentFinancials.annualEBITDA / 12;
    const monthlyRevenueIncrease = expansionPlan.expectedRevenueIncrease / 12;
    const monthlyEBITDAIncrease = expansionPlan.expectedEBITDAIncrease / 12;

    let cumulativeCashFlow = currentFinancials.cashOnHand;
    let monthsPositive = 0;
    let monthsNegative = 0;
    let minimumCashBalance = cumulativeCashFlow;

    // Project 24 months
    for (let month = 1; month <= 24; month++) {
      // Revenue ramps up over first 6 months
      const revenueMultiplier = month <= 6 ? month / 6 : 1;
      const revenue = monthlyRevenue + monthlyRevenueIncrease * revenueMultiplier;
      const ebitda = monthlyEBITDA + monthlyEBITDAIncrease * revenueMultiplier;
      const netCashFlow =
        ebitda - loanScenario.monthlyPayment - currentFinancials.monthlyDebtPayments;
      cumulativeCashFlow += netCashFlow;

      if (netCashFlow > 0) monthsPositive++;
      else monthsNegative++;

      if (cumulativeCashFlow < minimumCashBalance) {
        minimumCashBalance = cumulativeCashFlow;
      }

      months.push({
        month,
        revenue,
        ebitda,
        loanPayment: loanScenario.monthlyPayment,
        netCashFlow,
        cumulativeCashFlow,
      });
    }

    const averageMonthlyCashFlow =
      months.reduce((sum, m) => sum + m.netCashFlow, 0) / months.length;

    return {
      months,
      summary: {
        averageMonthlyCashFlow,
        monthsPositive,
        monthsNegative,
        minimumCashBalance,
      },
    };
  }

  private static calculateDSCR(
    ebitda: number,
    annualDebtService: number
  ): {
    ratio: number;
    status: string;
    interpretation: string;
  } {
    const ratio = annualDebtService > 0 ? ebitda / annualDebtService : 999;
    let status: string;
    let interpretation: string;

    if (ratio >= 1.5) {
      status = 'excellent';
      interpretation = 'Strong debt service coverage - low risk';
    } else if (ratio >= 1.25) {
      status = 'good';
      interpretation = 'Adequate debt service coverage - acceptable risk';
    } else if (ratio >= 1.0) {
      status = 'marginal';
      interpretation = 'Minimal debt service coverage - higher risk';
    } else {
      status = 'poor';
      interpretation = 'Insufficient debt service coverage - high risk';
    }

    return {
      ratio,
      status,
      interpretation,
    };
  }

  private static assessRisks(
    financialHealth: { score: number },
    debtCapacity: { debtCapacityRatio: number },
    dscr: { ratio: number },
    expansionPlan: BusinessExpansionLoanInput['expansionPlan'],
    financials: BusinessExpansionLoanInput['currentFinancials']
  ): {
    overallRisk: 'low' | 'medium' | 'high';
    riskFactors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    mitigations: string[];
  } {
    const riskFactors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }> = [];

    // DSCR risk
    if (dscr.ratio < 1.0) {
      riskFactors.push({
        factor: 'Insufficient Debt Service Coverage',
        severity: 'high',
        description: `DSCR of ${dscr.ratio.toFixed(2)}x is below 1.0x - business cannot service debt`,
      });
    } else if (dscr.ratio < 1.25) {
      riskFactors.push({
        factor: 'Low Debt Service Coverage',
        severity: 'medium',
        description: `DSCR of ${dscr.ratio.toFixed(2)}x is below recommended 1.25x minimum`,
      });
    }

    // Debt capacity risk
    if (debtCapacity.debtCapacityRatio < 0.8) {
      riskFactors.push({
        factor: 'Exceeds Debt Capacity',
        severity: 'high',
        description: 'Requested loan amount exceeds recommended debt capacity',
      });
    } else if (debtCapacity.debtCapacityRatio < 1.0) {
      riskFactors.push({
        factor: 'Near Debt Capacity Limit',
        severity: 'medium',
        description: 'Requested loan amount is at or near maximum capacity',
      });
    }

    // Financial health risk
    if (financialHealth.score < 50) {
      riskFactors.push({
        factor: 'Weak Financial Health',
        severity: 'high',
        description: 'Low financial health score indicates business vulnerabilities',
      });
    } else if (financialHealth.score < 70) {
      riskFactors.push({
        factor: 'Moderate Financial Health',
        severity: 'medium',
        description: 'Financial health could be improved before taking on additional debt',
      });
    }

    // Cash flow risk
    if (financials.cashOnHand < expansionPlan.loanAmount * 0.1) {
      riskFactors.push({
        factor: 'Insufficient Cash Reserves',
        severity: 'medium',
        description:
          'Low cash reserves relative to loan amount - limited buffer for unexpected expenses',
      });
    }

    // Revenue projection risk
    if (expansionPlan.expectedRevenueIncrease / currentFinancials.annualRevenue > 0.5) {
      riskFactors.push({
        factor: 'Aggressive Revenue Projections',
        severity: 'medium',
        description:
          'Large expected revenue increase may be optimistic - ensure projections are realistic',
      });
    }

    // Determine overall risk
    const highRiskCount = riskFactors.filter((r) => r.severity === 'high').length;
    const mediumRiskCount = riskFactors.filter((r) => r.severity === 'medium').length;
    let overallRisk: 'low' | 'medium' | 'high';
    if (highRiskCount > 0) {
      overallRisk = 'high';
    } else if (mediumRiskCount >= 2 || highRiskCount > 0) {
      overallRisk = 'medium';
    } else {
      overallRisk = 'low';
    }

    // Generate mitigations
    const mitigations: string[] = [];
    if (dscr.ratio < 1.25) {
      mitigations.push('Improve EBITDA or reduce debt service to increase DSCR above 1.25x');
    }
    if (financials.cashOnHand < expansionPlan.loanAmount * 0.2) {
      mitigations.push('Build cash reserves to at least 20% of loan amount before borrowing');
    }
    if (financialHealth.score < 70) {
      mitigations.push('Strengthen financial health metrics before taking on additional debt');
    }

    return {
      overallRisk,
      riskFactors,
      mitigations,
    };
  }

  private static generateRecommendations(
    financialHealth: { score: number; strengths: string[]; weaknesses: string[] },
    debtCapacity: { recommendedLoanAmount: number; maxLoanAmount: number },
    loanScenarios: { optimalScenario: { monthlyPayment: number; totalCost: number } },
    dscr: { ratio: number; status: string },
    riskAssessment: { overallRisk: string; mitigations: string[] },
    goals: BusinessExpansionLoanInput['goals']
  ): string[] {
    const recommendations: string[] = [];

    // Loan amount recommendations
    if (debtCapacity.recommendedLoanAmount < debtCapacity.maxLoanAmount * 0.9) {
      recommendations.push(
        `Consider reducing loan amount to $${debtCapacity.recommendedLoanAmount.toFixed(0)} for better safety margin`
      );
    }

    // DSCR recommendations
    if (dscr.status === 'poor' || dscr.status === 'marginal') {
      recommendations.push(
        'Improve debt service coverage ratio before taking on loan - consider increasing revenue or reducing expenses'
      );
    }

    // Risk-based recommendations
    if (riskAssessment.overallRisk === 'high') {
      recommendations.push(
        'High risk assessment - strongly consider alternative financing or improving business fundamentals first'
      );
    } else if (riskAssessment.overallRisk === 'medium') {
      recommendations.push(
        'Moderate risk - proceed with caution and implement risk mitigation strategies'
      );
    }

    // Goal-based recommendations
    if (goals.priority === 'lowest-cost') {
      recommendations.push(
        `Consider shorter loan term to reduce total interest cost (saves $${(loanScenarios.optimalScenario.totalCost * 0.1).toFixed(0)} over 10-year term)`
      );
    } else if (goals.priority === 'fastest-approval') {
      recommendations.push('SBA loans may offer faster approval but require more documentation');
    }

    // Financial health recommendations
    if (financialHealth.weaknesses.length > 0) {
      recommendations.push(
        `Address financial weaknesses: ${financialHealth.weaknesses.slice(0, 2).join(', ')}`
      );
    }

    // Add risk mitigations
    recommendations.push(...riskAssessment.mitigations);

    return recommendations;
  }

  private static calculateSuccessProbability(
    financialHealth: { score: number },
    debtCapacity: { debtCapacityRatio: number },
    dscr: { ratio: number },
    riskAssessment: { overallRisk: string }
  ): number {
    let probability = 0.5; // Base 50%

    // Financial health contribution (0-30%)
    probability += (financialHealth.score / 100) * 0.3;

    // Debt capacity contribution (0-20%)
    if (debtCapacity.debtCapacityRatio >= 1.2) {
      probability += 0.2;
    } else if (debtCapacity.debtCapacityRatio >= 1.0) {
      probability += 0.15;
    } else if (debtCapacity.debtCapacityRatio >= 0.8) {
      probability += 0.1;
    }

    // DSCR contribution (0-20%)
    if (dscr.ratio >= 1.5) {
      probability += 0.2;
    } else if (dscr.ratio >= 1.25) {
      probability += 0.15;
    } else if (dscr.ratio >= 1.0) {
      probability += 0.1;
    }

    // Risk adjustment (0-10%)
    if (riskAssessment.overallRisk === 'low') {
      probability += 0.1;
    } else if (riskAssessment.overallRisk === 'high') {
      probability -= 0.2;
    }

    return Math.max(0, Math.min(1, probability));
  }

  private static getMarketRate(loanType: string): number {
    const rates: Record<string, number> = {
      'term-loan': 0.08,
      'line-of-credit': 0.1,
      sba: 0.065,
      'equipment-financing': 0.09,
      'commercial-mortgage': 0.07,
    };
    return rates[loanType] || 0.08;
  }
}
