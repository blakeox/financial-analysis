import { Decimal } from 'decimal.js';
import { z } from 'zod';
import { EnhancedLeaseInputSchema, type EnhancedLeaseInput } from '../../schemas/enhanced-lease.js';
import {
  type EnhancedLeaseAnalysisResult,
  type EnhancedLeasePaymentItem,
  type FinancialMetrics,
  type EscalationSummary,
  type RenewalAnalysis,
  type PurchaseOptionAnalysis,
  type LeaseVsBuyAnalysis,
  type RiskAnalysis,
} from '../../types/enhanced-lease-result.js';

export class EnhancedLeaseAnalyzer {
  /**
   * Main analysis method that orchestrates the comprehensive lease analysis
   */
  static analyze(input: z.infer<typeof EnhancedLeaseInputSchema>): EnhancedLeaseAnalysisResult {
    const validated = EnhancedLeaseInputSchema.parse(input);

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + validated.termMonths);

    // Determine base payment based on lease type
    const basePayment =
      validated.leaseType === 'equipment'
        ? this.calculateEquipmentPayment(validated).basePayment
        : validated.baseRent || 0;

    // Generate comprehensive payment schedule
    const schedule = this.generatePaymentSchedule(validated, basePayment, startDate);

    // Calculate financial metrics
    const metrics = this.calculateFinancialMetrics(schedule, validated);

    // Generate analysis components
    const escalationSummary = validated.escalation
      ? this.analyzeEscalations(validated.escalation, schedule)
      : undefined;

    const renewalOptions = this.analyzeRenewalOptions(validated, metrics);
    const purchaseOption = validated.purchaseOption?.enabled
      ? this.analyzePurchaseOption(validated)
      : undefined;

    const leaseVsBuy = validated.compareAlternatives
      ? this.analyzeLeaseVsBuy(validated, metrics)
      : undefined;

    const riskAnalysis = this.analyzeRisk(validated, metrics);
    const insights = this.generateInsights(validated, metrics, riskAnalysis);
    const sensitivity = this.performSensitivityAnalysis(metrics);

    return {
      leaseType: validated.leaseType,
      termMonths: validated.termMonths,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      schedule,
      metrics,
      escalationSummary,
      renewalOptions,
      purchaseOption,
      leaseVsBuy,
      riskAnalysis,
      insights,
      sensitivity,
    };
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]!;
  }

  /**
   * Calculate base equipment lease payment using present value formulas
   */
  private static calculateEquipmentPayment(input: EnhancedLeaseInput): {
    basePayment: number;
    interestRate: number;
  } {
    const { principal, annualRate, termMonths, residualValue } = input;
    const monthlyRate = annualRate / 12;

    if (monthlyRate === 0) {
      // No interest case
      const basePayment = (principal - residualValue) / termMonths;
      return { basePayment, interestRate: 0 };
    }

    // Standard lease payment calculation using present value annuity formula
    const pv = new Decimal(principal);
    const fv = new Decimal(residualValue);
    const r = new Decimal(monthlyRate);
    const n = new Decimal(termMonths);

    const onePlusR = new Decimal(1).plus(r);
    const discountedFV = fv.div(onePlusR.pow(n));
    const annuityFactor = new Decimal(1).minus(onePlusR.pow(n.neg())).div(r);

    const basePayment = pv.minus(discountedFV).div(annuityFactor);

    return {
      basePayment: Number(basePayment.toFixed(2)),
      interestRate: monthlyRate,
    };
  }

  /**
   * Generate comprehensive payment schedule with escalations
   */
  private static generatePaymentSchedule(
    input: EnhancedLeaseInput,
    basePayment: number,
    startDate: Date
  ): EnhancedLeasePaymentItem[] {
    const schedule: EnhancedLeasePaymentItem[] = [];
    let balance = input.principal;
    let cumulativePaid = 0;
    const discountRate = input.discountRate / 12; // Monthly discount rate

    for (let month = 1; month <= input.termMonths; month++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + month - 1);

      // Calculate escalated payment
      const escalatedPayment = this.applyEscalation(basePayment, month, input.escalation);

      // Calculate additional costs
      const additionalCosts = this.calculateAdditionalCosts(input.additionalCosts);

      // Calculate percentage rent (for retail)
      const percentageRent = this.calculatePercentageRent(input.percentageRent);

      // Total payment
      const totalPayment = escalatedPayment + additionalCosts.total + percentageRent;

      // Interest and principal components (for equipment leases)
      const interestComponent = balance * (input.annualRate / 12);
      const principalComponent = escalatedPayment - interestComponent;

      // Update balance
      if (month === input.termMonths) {
        balance = input.residualValue;
      } else {
        balance = Math.max(0, balance - principalComponent);
      }

      cumulativePaid += totalPayment;

      // Present value of this payment
      const presentValue = totalPayment / Math.pow(1 + discountRate, month);

      // Effective rate calculation
      const effectiveRate =
        month === 1 ? input.annualRate : (cumulativePaid / input.principal - 1) * (12 / month);

      schedule.push({
        month,
        date: this.formatDate(paymentDate),
        basePayment,
        escalatedPayment,
        additionalCosts,
        percentageRent,
        totalPayment: Number(new Decimal(totalPayment).toFixed(2)),
        cumulativePaid: Number(new Decimal(cumulativePaid).toFixed(2)),
        effectiveRate: Number(new Decimal(effectiveRate).toFixed(4)),
        presentValue: Number(new Decimal(presentValue).toFixed(2)),
        interestComponent: Number(new Decimal(interestComponent).toFixed(2)),
        principalComponent: Number(new Decimal(principalComponent).toFixed(2)),
        remainingBalance: Number(new Decimal(balance).toFixed(2)),
      });
    }

    return schedule;
  }

  private static applyEscalation(
    basePayment: number,
    month: number,
    escalation?: EnhancedLeaseInput['escalation']
  ): number {
    if (!escalation || escalation.type === 'none') {
      return basePayment;
    }

    const yearsPassed = Math.floor((month - 1) / 12);

    switch (escalation.type) {
      case 'fixed':
        return basePayment * Math.pow(1 + escalation.rate, yearsPassed);

      case 'stepped': {
        let currentRate = 0;
        for (const step of escalation.schedule) {
          if (month >= step.startMonth) {
            currentRate = step.rate;
          }
        }
        return basePayment * (1 + currentRate);
      }

      case 'cpi': {
        // Simplified CPI calculation - in practice would use actual CPI data
        const cpiIncrease = escalation.rate || 0.025; // Default 2.5% annually
        return basePayment * Math.pow(1 + cpiIncrease, yearsPassed);
      }

      case 'market': {
        // Market adjustments typically occur at specific intervals
        const marketAdjustment = yearsPassed > 0 ? escalation.rate : 0;
        return basePayment * (1 + marketAdjustment);
      }

      default:
        return basePayment;
    }
  }

  private static calculateAdditionalCosts(additionalCosts?: EnhancedLeaseInput['additionalCosts']) {
    const costs = additionalCosts || {
      camCharges: 0,
      propertyTaxes: 0,
      insurance: 0,
      utilities: 0,
      maintenance: 0,
      managementFee: 0,
    };

    const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    return {
      ...costs,
      total: Number(new Decimal(total).toFixed(2)),
    };
  }

  private static calculatePercentageRent(
    percentageRent?: EnhancedLeaseInput['percentageRent']
  ): number {
    if (!percentageRent?.enabled || !percentageRent.annualSalesEstimate) {
      return 0;
    }

    const monthlySales = percentageRent.annualSalesEstimate / 12;
    const monthlyBreakpoint = percentageRent.breakpoint / 12;

    if (monthlySales <= monthlyBreakpoint) {
      return 0;
    }

    const excessSales = monthlySales - monthlyBreakpoint;
    return Number(new Decimal(excessSales * percentageRent.percentage).toFixed(2));
  }

  private static calculateFinancialMetrics(
    schedule: EnhancedLeasePaymentItem[],
    input: EnhancedLeaseInput
  ): FinancialMetrics {
    const totalCost = schedule.reduce((sum, item) => sum + item.totalPayment, 0);
    const presentValue = schedule.reduce((sum, item) => sum + item.presentValue, 0);
    const averageMonthlyPayment = totalCost / schedule.length;

    return {
      totalCost: Number(new Decimal(totalCost).toFixed(2)),
      presentValue: Number(new Decimal(presentValue).toFixed(2)),
      futureValue: totalCost, // Simplified
      effectiveAnnualRate: input.annualRate,
      internalRateOfReturn: input.annualRate, // Simplified - would need iterative calculation
      paybackPeriod: input.termMonths,
      totalInterestPaid: schedule.reduce((sum, item) => sum + item.interestComponent, 0),
      averageMonthlyPayment: Number(new Decimal(averageMonthlyPayment).toFixed(2)),
      costPerMonth: Number(new Decimal(averageMonthlyPayment).toFixed(2)),
      costPerYear: Number(new Decimal(averageMonthlyPayment * 12).toFixed(2)),
    };
  }

  private static analyzeEscalations(
    escalation: NonNullable<EnhancedLeaseInput['escalation']>,
    schedule: EnhancedLeasePaymentItem[]
  ): EscalationSummary {
    // Simplified escalation analysis
    return {
      type: escalation.type,
      totalEscalations: 0,
      averageAnnualIncrease: escalation.rate,
      effectiveRate: escalation.rate,
      firstEscalationMonth: 13, // Typically after first year
      lastEscalationMonth: schedule.length,
    };
  }

  private static analyzeRenewalOptions(
    input: EnhancedLeaseInput,
    metrics: FinancialMetrics
  ): RenewalAnalysis[] {
    return input.renewalOptions.map((option, index) => ({
      optionNumber: index + 1,
      termMonths: option.termMonths,
      projectedMonthlyPayment: metrics.averageMonthlyPayment * (1 + option.rateAdjustment),
      totalOptionCost:
        metrics.averageMonthlyPayment * (1 + option.rateAdjustment) * option.termMonths,
      presentValue: 0, // Would calculate based on discount rate
      effectiveRate: input.annualRate + option.rateAdjustment,
    }));
  }

  private static analyzePurchaseOption(
    input: EnhancedLeaseInput
  ): PurchaseOptionAnalysis | undefined {
    if (!input.purchaseOption?.enabled) return undefined;

    return {
      available: true,
      purchasePrice: input.purchaseOption.fixedAmount || input.residualValue,
      residualValue: input.residualValue,
      fairMarketValueEstimate: input.principal * 0.6, // Simplified estimate
      breakEvenMonth: input.termMonths,
      netPresentValueBenefit: 0, // Would calculate based on purchase vs continue leasing
    };
  }

  private static analyzeLeaseVsBuy(
    input: EnhancedLeaseInput,
    metrics: FinancialMetrics
  ): LeaseVsBuyAnalysis | undefined {
    if (!input.compareAlternatives?.purchasePrice) return undefined;

    const purchasePrice = input.compareAlternatives.purchasePrice;
    const loanRate = input.compareAlternatives.loanRate || 0.06;
    const loanTerm = input.compareAlternatives.loanTermMonths || input.termMonths;

    // Simplified loan payment calculation
    const monthlyLoanRate = loanRate / 12;
    const loanPayment =
      (purchasePrice * (monthlyLoanRate * Math.pow(1 + monthlyLoanRate, loanTerm))) /
      (Math.pow(1 + monthlyLoanRate, loanTerm) - 1);

    return {
      leaseOption: {
        totalCost: metrics.totalCost,
        presentValue: metrics.presentValue,
        monthlyPayment: metrics.averageMonthlyPayment,
        totalInterest: metrics.totalInterestPaid,
      },
      buyOption: {
        purchasePrice,
        loanPayment: Number(new Decimal(loanPayment).toFixed(2)),
        totalLoanCost: loanPayment * loanTerm,
        presentValue: purchasePrice, // Simplified
        taxBenefits: 0, // Would calculate depreciation benefits
        netCost: loanPayment * loanTerm,
      },
      recommendation: metrics.totalCost < loanPayment * loanTerm ? 'lease' : 'buy',
      savingsAmount: Math.abs(metrics.totalCost - loanPayment * loanTerm),
      breakEvenPoint: input.termMonths / 2, // Simplified
    };
  }

  private static analyzeRisk(input: EnhancedLeaseInput, metrics: FinancialMetrics): RiskAnalysis {
    const earlyTerminationCost = input.earlyTermination?.allowed
      ? input.earlyTermination.penaltyAmount ||
        metrics.averageMonthlyPayment * (input.earlyTermination.penaltyMonths || 3)
      : metrics.totalCost;

    return {
      earlyTerminationCost: Number(new Decimal(earlyTerminationCost).toFixed(2)),
      totalCommitment: metrics.totalCost,
      flexibilityScore: input.earlyTermination?.allowed ? 75 : 25, // 0-100 scale
      renewalRisk: input.renewalOptions.length > 0 ? 'low' : 'medium',
      rateEscalationRisk: input.escalation?.type === 'none' ? 'low' : 'medium',
    };
  }

  private static generateInsights(
    input: EnhancedLeaseInput,
    metrics: FinancialMetrics,
    risk: RiskAnalysis
  ) {
    const recommendations: string[] = [];

    if (risk.flexibilityScore < 50) {
      recommendations.push('Consider negotiating early termination options for flexibility');
    }

    if (input.escalation?.type !== 'none') {
      recommendations.push(
        'Monitor escalation clauses to ensure they align with market conditions'
      );
    }

    return {
      effectiveRent: metrics.costPerMonth,
      occupancyCost: metrics.totalCost,
      totalCommitment: risk.totalCommitment,
      flexibilityRating:
        risk.flexibilityScore > 75 ? 'High' : risk.flexibilityScore > 50 ? 'Medium' : 'Low',
      recommendations,
    };
  }

  private static performSensitivityAnalysis(metrics: FinancialMetrics) {
    // Simplified sensitivity analysis
    const rateIncrease = 0.01; // 1% increase
    const termExtension = 6; // 6 months

    return {
      rateIncrease1Percent: {
        totalCostChange: metrics.totalCost * rateIncrease,
        monthlyPaymentChange: metrics.averageMonthlyPayment * rateIncrease,
      },
      termExtension6Months: {
        totalCostChange: metrics.averageMonthlyPayment * termExtension,
        monthlyPaymentChange: 0,
      },
      escalationRateChange: {
        totalCostChange: metrics.totalCost * 0.02, // 2% change
        effectiveRateChange: 0.02,
      },
    };
  }
}
