/**
 * Accounts Payable Optimization
 * Optimize payment terms and maximize early payment discounts
 */

import type { AccountsPayableOptimizationInput } from '../../schemas/accounts-payable-optimization.js';

export class AccountsPayableOptimizer {
  /**
   * Optimize accounts payable strategy
   */
  static analyze(input: AccountsPayableOptimizationInput): unknown {
    const payables = input.payables;
    const paymentTerms = input.paymentTerms;
    const cashFlow = input.cashFlow;
    const vendorRelationships = input.vendorRelationships;
    const strategy = input.strategy;
    const analysis = input.analysis;

    // Discount analysis
    const discountAnalysis = analysis.includeDiscountAnalysis
      ? this.analyzeDiscounts(paymentTerms, cashFlow)
      : undefined;

    // Cash flow impact
    const cashFlowImpact = analysis.includeCashFlowImpact
      ? this.analyzeCashFlowImpact(payables, paymentTerms, discountAnalysis)
      : undefined;

    // Payment schedule
    const paymentSchedule = analysis.includePaymentSchedule
      ? this.createPaymentSchedule(payables, paymentTerms, discountAnalysis)
      : undefined;

    // Vendor optimization
    const vendorOptimization = analysis.includeVendorOptimization
      ? this.optimizeVendorPayments(payables, vendorRelationships, strategy)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      discountAnalysis,
      cashFlowImpact,
      paymentSchedule,
      strategy
    );

    return {
      summary: {
        totalPayables: payables.totalPayables,
        potentialDiscountSavings: discountAnalysis?.totalSavings || 0,
        cashFlowImpact: cashFlowImpact?.netCashFlowImpact || 0,
        optimalPaymentDays: paymentSchedule?.averagePaymentDays || 0,
      },
      discountAnalysis,
      cashFlowImpact,
      paymentSchedule,
      vendorOptimization,
      recommendations,
    };
  }

  private static analyzeDiscounts(
    terms: AccountsPayableOptimizationInput['paymentTerms'],
    cashFlow: AccountsPayableOptimizationInput['cashFlow']
  ): {
    discounts: Array<{
      vendor: string | undefined;
      discountAmount: number;
      annualSavings: number;
      effectiveRate: number;
      recommendation: string;
    }>;
    totalSavings: number;
    totalCost: number;
  } {
    const discounts = terms.earlyPaymentDiscounts.map((discount) => {
      const discountAmount = discount.annualInvoiceVolume * discount.discountPercentage;
      const earlyPaymentDays = discount.discountDays;
      const standardPaymentDays = 30; // Assume Net 30
      const daysSaved = standardPaymentDays - earlyPaymentDays;
      const effectiveRate = (discount.discountPercentage / (daysSaved / 365)) * 100;
      const annualSavings =
        discountAmount - discount.annualInvoiceVolume * cashFlow.costOfCapital * (daysSaved / 365);

      let recommendation = 'Take discount if cash available';
      if (effectiveRate > cashFlow.costOfCapital * 100) {
        recommendation = 'Highly recommended - discount rate exceeds cost of capital';
      }

      return {
        vendor: discount.vendor,
        discountAmount,
        annualSavings: Math.max(0, annualSavings),
        effectiveRate,
        recommendation,
      };
    });

    const totalSavings = discounts.reduce((sum, d) => sum + d.annualSavings, 0);
    const totalCost = discounts.reduce((sum, d) => sum + (d.discountAmount - d.annualSavings), 0);

    return {
      discounts,
      totalSavings,
      totalCost,
    };
  }

  private static analyzeCashFlowImpact(
    payables: AccountsPayableOptimizationInput['payables'],
    terms: AccountsPayableOptimizationInput['paymentTerms'],
    discounts: { totalSavings: number } | undefined
  ): {
    currentPaymentDays: number;
    optimizedPaymentDays: number;
    cashFlowImprovement: number;
    netCashFlowImpact: number;
  } {
    const currentPaymentDays = terms.standardTerms;
    const optimizedPaymentDays = discounts && discounts.totalSavings > 0 ? 10 : currentPaymentDays; // Take discounts
    const daysDifference = currentPaymentDays - optimizedPaymentDays;
    const cashFlowImprovement = payables.totalPayables * (daysDifference / 365);
    const netCashFlowImpact = cashFlowImprovement + (discounts?.totalSavings || 0);

    return {
      currentPaymentDays,
      optimizedPaymentDays,
      cashFlowImprovement,
      netCashFlowImpact,
    };
  }

  private static createPaymentSchedule(
    payables: AccountsPayableOptimizationInput['payables'],
    terms: AccountsPayableOptimizationInput['paymentTerms'],
    discounts:
      { discounts: Array<{ vendor: string | undefined; recommendation: string }> } | undefined
  ): {
    schedule: Array<{
      invoiceNumber: string;
      dueDate: string;
      paymentDate: string;
      amount: number;
      discountTaken: boolean;
    }>;
    averagePaymentDays: number;
  } {
    const schedule = payables.invoices.map((invoice) => {
      const discount = discounts?.discounts.find((d) => d.vendor === invoice.vendorName);
      const takeDiscount = discount && discount.recommendation.includes('recommended');
      const paymentDate = takeDiscount
        ? new Date(
            new Date(invoice.invoiceDate).getTime() +
              (terms.earlyPaymentDiscounts[0]?.discountDays || 10) * 24 * 60 * 60 * 1000
          )
        : new Date(invoice.dueDate);

      return {
        invoiceNumber: invoice.invoiceNumber,
        dueDate: invoice.dueDate,
        paymentDate: paymentDate.toISOString().split('T')[0] as string,
        amount: invoice.amountOutstanding ?? invoice.invoiceAmount,
        discountTaken: takeDiscount || false,
      };
    });

    const totalDays = schedule.reduce((sum, entry) => {
      const dueDate = new Date(entry.dueDate);
      const payDate = new Date(entry.paymentDate);
      const days = (payDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    const averagePaymentDays = schedule.length > 0 ? totalDays / schedule.length : 0;

    return {
      schedule,
      averagePaymentDays: Math.max(0, averagePaymentDays),
    };
  }

  private static optimizeVendorPayments(
    payables: AccountsPayableOptimizationInput['payables'],
    vendors: AccountsPayableOptimizationInput['vendorRelationships'],
    strategy: AccountsPayableOptimizationInput['strategy']
  ): {
    criticalVendorPayments: Array<{ vendor: string; priority: number; recommendedAction: string }>;
    standardVendorPayments: Array<{ vendor: string; recommendedAction: string }>;
  } {
    const criticalVendorPayments = vendors.criticalVendors.map((vendor) => ({
      vendor,
      priority: 1,
      recommendedAction: 'Pay on time to maintain relationship',
    }));

    const standardVendorPayments = payables.invoices
      .filter((inv) => !vendors.criticalVendors.includes(inv.vendorName || ''))
      .map((inv) => ({
        vendor: inv.vendorName || 'Unknown',
        recommendedAction:
          strategy.optimizeFor === 'max-discounts'
            ? 'Take early payment discount'
            : 'Pay according to terms',
      }));

    return {
      criticalVendorPayments,
      standardVendorPayments,
    };
  }

  private static generateRecommendations(
    discounts: { totalSavings: number; discounts: Array<{ recommendation: string }> } | undefined,
    cashFlow: { netCashFlowImpact: number } | undefined,
    schedule: { averagePaymentDays: number } | undefined,
    strategy: AccountsPayableOptimizationInput['strategy']
  ): string[] {
    const recommendations: string[] = [];

    if (discounts && discounts.totalSavings > 0) {
      recommendations.push(`Potential discount savings: $${discounts.totalSavings.toFixed(0)}`);
      discounts.discounts.forEach((discount) => {
        recommendations.push(discount.recommendation);
      });
    }

    if (cashFlow) {
      recommendations.push(`Net cash flow impact: $${cashFlow.netCashFlowImpact.toFixed(0)}`);
    }

    if (schedule) {
      recommendations.push(`Average payment days: ${schedule.averagePaymentDays.toFixed(0)}`);
    }

    if (strategy.optimizeFor === 'max-discounts') {
      recommendations.push('Focus on maximizing early payment discounts');
    } else if (strategy.optimizeFor === 'max-cash-flow') {
      recommendations.push('Focus on maximizing cash flow by extending payment terms');
    }

    return recommendations;
  }
}
