/**
 * Auto Loan Analysis Engine
 * Professional-grade vehicle financing analysis
 *
 * Implements comprehensive auto loan analysis including:
 * - Loan vs lease comparison
 * - Down payment optimization
 * - Trade-in value analysis
 * - Total cost of ownership (TCO)
 * - Refinancing analysis
 * - Payment schedule generation
 */

import { Decimal } from 'decimal.js';

import {
  AutoLoanAnalysisInputSchema,
  type AutoLoanAnalysisInput,
} from '../schemas/auto-loan-analysis.js';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export { AutoLoanAnalysisInputSchema };

// Back-compat exports (existing consumers import these from this module)
export const AutoLoanInputSchema = AutoLoanAnalysisInputSchema;
export type AutoLoanInput = AutoLoanAnalysisInput;

const formatISODate = (date: Date): string => date.toISOString().slice(0, 10);

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface AutoLoanResult {
  loanAnalysis: {
    monthlyPayment: number;
    totalInterest: number;
    totalCost: number;
    effectiveRate: number;
    payoffDate: string;
    paymentSchedule: Array<{
      paymentNumber: number;
      paymentDate: string;
      principalPayment: number;
      interestPayment: number;
      remainingBalance: number;
      cumulativeInterest: number;
    }>;
  };

  leaseAnalysis?: {
    monthlyPayment: number;
    totalPayments: number;
    totalCost: number;
    effectiveRate: number;
    endDate: string;
    buyoutCost: number;
    totalCostIfPurchased: number;
  };

  comparison?: {
    loanVsLease: {
      monthlyPaymentDifference: number;
      totalCostDifference: number;
      breakEvenPoint: number; // months
      recommendation: 'loan' | 'lease' | 'depends';
      reasoning: string[];
    };
  };

  refinancingAnalysis?: {
    scenarios: Array<{
      newRate: number;
      newMonthlyPayment: number;
      monthlySavings: number;
      totalSavings: number;
      breakEvenMonths: number;
      recommendation: 'refinance' | 'keep-current';
    }>;
    bestScenario: {
      rate: number;
      monthlySavings: number;
      totalSavings: number;
    };
  };

  tcoAnalysis?: {
    ownershipYears: number;
    totalCostOfOwnership: number;
    costPerMile: number;
    costPerMonth: number;
    breakdown: {
      loanPayments: number;
      interest: number;
      maintenance: number;
      fuel: number;
      insurance: number;
      registration: number;
      depreciation: number;
      fees: number;
    };
    residualValue: number;
  };

  insights: string[];
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    action: string;
  }>;

  metadata: {
    calculatedAt: string;
    version: string;
    methodology: string;
    assumptions: Record<string, any>;
  };
}

// ============================================================================
// AUTO LOAN ANALYSIS ENGINE
// ============================================================================

export class AutoLoanAnalysisEngine {
  /**
   * Main auto loan analysis method
   *
   * @param input - Auto loan analysis input parameters
   * @returns Comprehensive auto loan analysis results
   */
  static analyze(input: AutoLoanInput): AutoLoanResult {
    const validated = AutoLoanInputSchema.parse(input);

    // Set precision for financial calculations
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

    // Calculate loan analysis
    const loanAnalysis = this.calculateLoanAnalysis(validated);

    // Calculate lease analysis if requested
    const leaseAnalysis =
      validated.analysis.includeLeaseComparison && validated.leaseTerms
        ? this.calculateLeaseAnalysis(validated)
        : undefined;

    // Perform comparison analysis
    const comparison = leaseAnalysis
      ? this.performComparisonAnalysis(loanAnalysis, leaseAnalysis)
      : undefined;

    // Calculate refinancing analysis if requested
    const refinancingAnalysis = validated.analysis.includeRefinancingAnalysis
      ? this.calculateRefinancingAnalysis(validated, loanAnalysis)
      : undefined;

    // Calculate TCO analysis if requested
    const tcoAnalysis = validated.analysis.includeTCOAnalysis
      ? this.calculateTCOAnalysis(validated, loanAnalysis)
      : undefined;

    // Generate insights and recommendations
    const insights = this.generateInsights(validated, loanAnalysis, leaseAnalysis, tcoAnalysis);
    const recommendations = this.generateRecommendations(
      validated,
      loanAnalysis,
      leaseAnalysis,
      refinancingAnalysis
    );

    const result: AutoLoanResult = {
      loanAnalysis,
      insights,
      recommendations,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: '1.0.0',
        methodology: 'Auto Loan Analysis',
        assumptions: {
          salesTaxRate: validated.loanTerms.salesTaxRate,
          ownershipYears: validated.analysis.ownershipYears,
          depreciationRate: validated.tcoParameters.depreciationRate,
        },
      },
    };

    if (leaseAnalysis) {
      result.leaseAnalysis = leaseAnalysis;
    }
    if (comparison) {
      result.comparison = comparison;
    }
    if (refinancingAnalysis) {
      result.refinancingAnalysis = refinancingAnalysis;
    }
    if (tcoAnalysis) {
      result.tcoAnalysis = tcoAnalysis;
    }

    return result;
  }

  /**
   * Calculate loan analysis
   */
  private static calculateLoanAnalysis(input: AutoLoanInput) {
    const { loanTerms, vehicle } = input;

    // Calculate total loan amount including taxes and fees
    const taxableAmount = vehicle.negotiatedPrice - vehicle.tradeInValue - vehicle.downPayment;
    const salesTax = taxableAmount * loanTerms.salesTaxRate;
    const totalFees = Object.values(loanTerms.fees).reduce((sum, fee) => sum + fee, 0);
    const totalLoanAmount = loanTerms.loanAmount + salesTax + totalFees;

    // Calculate monthly payment using PMT formula
    const monthlyRate = loanTerms.interestRate / 12;
    const monthlyPayment = this.calculateMonthlyPayment(
      totalLoanAmount,
      monthlyRate,
      loanTerms.termMonths
    );

    // Calculate total interest
    const totalPayments = monthlyPayment * loanTerms.termMonths;
    const totalInterest = totalPayments - totalLoanAmount;

    // Calculate total cost
    const totalCost = vehicle.downPayment + totalPayments;

    // Calculate effective rate (APR)
    const effectiveRate = this.calculateEffectiveRate(
      totalLoanAmount,
      monthlyPayment,
      loanTerms.termMonths
    );

    // Calculate payoff date
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + loanTerms.termMonths);

    // Generate payment schedule
    const paymentSchedule = this.generatePaymentSchedule(
      totalLoanAmount,
      monthlyRate,
      monthlyPayment,
      loanTerms.termMonths
    );

    return {
      monthlyPayment,
      totalInterest,
      totalCost,
      effectiveRate,
      payoffDate: formatISODate(payoffDate),
      paymentSchedule,
    };
  }

  /**
   * Calculate lease analysis
   */
  private static calculateLeaseAnalysis(input: AutoLoanInput) {
    const { leaseTerms } = input;
    if (!leaseTerms) return undefined;

    // Calculate monthly lease payment
    const monthlyPayment = this.calculateLeasePayment(
      leaseTerms.leaseAmount,
      leaseTerms.moneyFactor,
      leaseTerms.residualValue,
      leaseTerms.termMonths,
      leaseTerms.acquisitionFee
    );

    // Calculate total payments
    const totalPayments = monthlyPayment * leaseTerms.termMonths + leaseTerms.securityDeposit;

    // Calculate total cost
    const totalCost = totalPayments + leaseTerms.dispositionFee;

    // Calculate effective rate
    const effectiveRate = leaseTerms.moneyFactor * 2400; // Convert to APR

    // Calculate end date
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + leaseTerms.termMonths);

    // Calculate buyout cost
    const buyoutCost = leaseTerms.residualValue;

    // Calculate total cost if purchased
    const totalCostIfPurchased = totalCost + buyoutCost;

    return {
      monthlyPayment,
      totalPayments,
      totalCost,
      effectiveRate,
      endDate: formatISODate(endDate),
      buyoutCost,
      totalCostIfPurchased,
    };
  }

  /**
   * Perform comparison analysis between loan and lease
   */
  private static performComparisonAnalysis(loanAnalysis: any, leaseAnalysis: any) {
    const monthlyPaymentDifference = loanAnalysis.monthlyPayment - leaseAnalysis.monthlyPayment;
    const totalCostDifference = loanAnalysis.totalCost - leaseAnalysis.totalCost;

    // Calculate break-even point (simplified)
    const breakEvenPoint = Math.abs(totalCostDifference) / Math.abs(monthlyPaymentDifference);

    // Determine recommendation
    let recommendation: 'loan' | 'lease' | 'depends';
    const reasoning: string[] = [];

    if (totalCostDifference < -5000) {
      recommendation = 'lease';
      reasoning.push('Lease offers significantly lower total cost');
    } else if (totalCostDifference > 5000) {
      recommendation = 'loan';
      reasoning.push('Loan offers significantly lower total cost');
    } else {
      recommendation = 'depends';
      reasoning.push('Costs are similar - consider other factors');
    }

    if (monthlyPaymentDifference < -100) {
      reasoning.push('Lease offers lower monthly payments');
    } else if (monthlyPaymentDifference > 100) {
      reasoning.push('Loan offers lower monthly payments');
    }

    return {
      loanVsLease: {
        monthlyPaymentDifference,
        totalCostDifference,
        breakEvenPoint,
        recommendation,
        reasoning,
      },
    };
  }

  /**
   * Calculate refinancing analysis
   */
  private static calculateRefinancingAnalysis(input: AutoLoanInput, loanAnalysis: any) {
    const scenarios = input.analysis.refinancingRates.map((newRate) => {
      const newMonthlyPayment = this.calculateMonthlyPayment(
        loanAnalysis.totalCost - loanAnalysis.totalInterest, // Remaining principal
        newRate / 12,
        input.loanTerms.termMonths - 12 // Assume 1 year has passed
      );

      const monthlySavings = loanAnalysis.monthlyPayment - newMonthlyPayment;
      const totalSavings = monthlySavings * (input.loanTerms.termMonths - 12);

      // Calculate break-even (simplified - assume $500 refinancing cost)
      const refinancingCost = 500;
      const breakEvenMonths = refinancingCost / monthlySavings;

      return {
        newRate,
        newMonthlyPayment,
        monthlySavings,
        totalSavings,
        breakEvenMonths,
        recommendation: breakEvenMonths < 12 ? ('refinance' as const) : ('keep-current' as const),
      };
    });

    // Find best scenario
    const bestScenario = scenarios.reduce((best, current) =>
      current.totalSavings > best.totalSavings ? current : best
    );

    return {
      scenarios,
      bestScenario: {
        rate: bestScenario.newRate,
        monthlySavings: bestScenario.monthlySavings,
        totalSavings: bestScenario.totalSavings,
      },
    };
  }

  /**
   * Calculate Total Cost of Ownership
   */
  private static calculateTCOAnalysis(input: AutoLoanInput, loanAnalysis: any) {
    const { tcoParameters, analysis } = input;
    const years = analysis.ownershipYears;

    // Calculate annual costs
    const annualFuelCost =
      (tcoParameters.annualMileage / tcoParameters.mpg) * tcoParameters.fuelCostPerGallon;
    const annualMaintenanceCost = tcoParameters.maintenanceCostPerYear;
    const annualInsuranceCost = tcoParameters.insuranceCostPerYear;
    const annualRegistrationCost = tcoParameters.registrationCostPerYear;

    // Calculate depreciation
    const currentValue = input.vehicle.negotiatedPrice;
    const residualValue = currentValue * Math.pow(1 - tcoParameters.depreciationRate, years);
    const totalDepreciation = currentValue - residualValue;

    // Calculate total costs
    const loanPayments = loanAnalysis.monthlyPayment * 12 * years;
    const interest = loanAnalysis.totalInterest;
    const maintenance = annualMaintenanceCost * years;
    const fuel = annualFuelCost * years;
    const insurance = annualInsuranceCost * years;
    const registration = annualRegistrationCost * years;
    const fees = Object.values(input.loanTerms.fees).reduce((sum, fee) => sum + fee, 0);

    const totalCostOfOwnership =
      loanPayments + interest + maintenance + fuel + insurance + registration + fees;
    const costPerMile = totalCostOfOwnership / (tcoParameters.annualMileage * years);
    const costPerMonth = totalCostOfOwnership / (years * 12);

    return {
      ownershipYears: years,
      totalCostOfOwnership,
      costPerMile,
      costPerMonth,
      breakdown: {
        loanPayments,
        interest,
        maintenance,
        fuel,
        insurance,
        registration,
        depreciation: totalDepreciation,
        fees,
      },
      residualValue,
    };
  }

  /**
   * Calculate monthly payment using PMT formula
   */
  private static calculateMonthlyPayment(
    principal: number,
    monthlyRate: number,
    termMonths: number
  ): number {
    if (monthlyRate === 0) {
      return principal / termMonths;
    }

    const factor = Math.pow(1 + monthlyRate, termMonths);
    return (principal * (monthlyRate * factor)) / (factor - 1);
  }

  /**
   * Calculate lease payment
   */
  private static calculateLeasePayment(
    leaseAmount: number,
    moneyFactor: number,
    residualValue: number,
    termMonths: number,
    acquisitionFee: number
  ): number {
    const depreciation = leaseAmount - residualValue;
    const monthlyDepreciation = depreciation / termMonths;
    const monthlyRent = (leaseAmount + residualValue) * moneyFactor;
    const monthlyAcquisitionFee = acquisitionFee / termMonths;

    return monthlyDepreciation + monthlyRent + monthlyAcquisitionFee;
  }

  /**
   * Calculate effective rate (APR)
   */
  private static calculateEffectiveRate(
    principal: number,
    monthlyPayment: number,
    termMonths: number
  ): number {
    // Simplified APR calculation - in practice, would use more sophisticated method
    const totalPayments = monthlyPayment * termMonths;
    const totalInterest = totalPayments - principal;
    return (totalInterest / principal) * (12 / termMonths);
  }

  /**
   * Generate payment schedule
   */
  private static generatePaymentSchedule(
    principal: number,
    monthlyRate: number,
    monthlyPayment: number,
    termMonths: number
  ) {
    const schedule = [];
    let remainingBalance = principal;
    let cumulativeInterest = 0;

    for (let i = 1; i <= termMonths; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);
      cumulativeInterest += interestPayment;

      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() + i);

      schedule.push({
        paymentNumber: i,
        paymentDate: formatISODate(paymentDate),
        principalPayment,
        interestPayment,
        remainingBalance,
        cumulativeInterest,
      });
    }

    return schedule;
  }

  /**
   * Generate insights
   */
  private static generateInsights(
    input: AutoLoanInput,
    _loanAnalysis: any,
    _leaseAnalysis: any,
    tcoAnalysis: any
  ): string[] {
    const insights = [];

    // Interest rate insights
    if (input.loanTerms.interestRate < 0.03) {
      insights.push('Excellent interest rate - consider locking in this rate');
    } else if (input.loanTerms.interestRate > 0.08) {
      insights.push('High interest rate - consider improving credit score or shopping around');
    }

    // Down payment insights
    if (input.vehicle.downPayment < input.vehicle.negotiatedPrice * 0.1) {
      insights.push('Low down payment - consider increasing to reduce monthly payments');
    }

    // Term insights
    if (input.loanTerms.termMonths > 60) {
      insights.push('Long loan term - consider shorter term to save on interest');
    }

    // TCO insights
    if (tcoAnalysis) {
      if (tcoAnalysis.costPerMile > 0.5) {
        insights.push('High cost per mile - consider more fuel-efficient vehicle');
      }
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    input: AutoLoanInput,
    _loanAnalysis: any,
    _leaseAnalysis: any,
    refinancingAnalysis: any
  ): Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    action: string;
  }> {
    const recommendations = [];

    // Interest rate recommendations
    if (input.loanTerms.interestRate > 0.06) {
      recommendations.push({
        category: 'Interest Rate',
        priority: 'high' as const,
        description: 'Consider improving credit score or shopping for better rates',
        impact: 'Could save thousands in interest over loan term',
        action: 'Check credit score and compare rates from multiple lenders',
      });
    }

    // Down payment recommendations
    if (input.vehicle.downPayment < input.vehicle.negotiatedPrice * 0.2) {
      recommendations.push({
        category: 'Down Payment',
        priority: 'medium' as const,
        description: 'Consider increasing down payment to reduce monthly payments',
        impact: 'Lower monthly payments and total interest',
        action: 'Save additional funds or consider trade-in value',
      });
    }

    // Refinancing recommendations
    if (refinancingAnalysis && refinancingAnalysis.bestScenario.totalSavings > 1000) {
      recommendations.push({
        category: 'Refinancing',
        priority: 'medium' as const,
        description: 'Refinancing could provide significant savings',
        impact: `Could save $${refinancingAnalysis.bestScenario.totalSavings.toFixed(0)} over loan term`,
        action: 'Contact lenders about refinancing options',
      });
    }

    return recommendations;
  }
}
