/**
 * Supply Chain Finance Optimizer
 * Optimize working capital through supply chain financing
 */

import type { SupplyChainFinanceInput } from '../schemas/supply-chain-finance.js';

export class SupplyChainFinanceOptimizer {
  /**
   * Optimize supply chain finance
   */
  static analyze(input: SupplyChainFinanceInput): unknown {
    const companyInfo = input.companyInfo;
    const supplyChain = input.supplyChain;
    const workingCapital = input.workingCapital;
    const financingOptions = input.financingOptions;
    const costOfCapital = input.costOfCapital;
    const analysis = input.analysis;

    // Working capital optimization
    const workingCapitalOptimization = analysis.includeWorkingCapitalOptimization
      ? this.optimizeWorkingCapital(workingCapital, supplyChain, companyInfo)
      : undefined;

    // Financing comparison
    const financingComparison = analysis.includeFinancingComparison
      ? this.compareFinancingOptions(financingOptions, costOfCapital, supplyChain)
      : undefined;

    // Cash flow impact
    const cashFlowImpact = analysis.includeCashFlowImpact
      ? this.analyzeCashFlowImpact(workingCapitalOptimization, financingComparison, workingCapital)
      : undefined;

    // Supplier benefits
    const supplierBenefits = analysis.includeSupplierBenefits
      ? this.analyzeSupplierBenefits(financingOptions, supplyChain)
      : undefined;

    // Risk analysis
    const riskAnalysis = analysis.includeRiskAnalysis
      ? this.analyzeRisks(supplyChain, financingOptions, workingCapital)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      workingCapitalOptimization,
      financingComparison,
      cashFlowImpact,
      supplierBenefits,
      riskAnalysis
    );

    return {
      summary: {
        currentCashConversionCycle: workingCapital.cashConversionCycle,
        optimizedCycle: workingCapitalOptimization?.optimizedCycle || 0,
        cashFlowImprovement: cashFlowImpact?.cashFlowImprovement || 0,
        recommendedFinancing: financingComparison?.bestOption,
        totalSavings: financingComparison?.totalSavings || 0,
      },
      workingCapitalOptimization,
      financingComparison,
      cashFlowImpact,
      supplierBenefits,
      riskAnalysis,
      recommendations,
    };
  }

  private static optimizeWorkingCapital(
    workingCapital: SupplyChainFinanceInput['workingCapital'],
    _supplyChain: SupplyChainFinanceInput['supplyChain'],
    _companyInfo: SupplyChainFinanceInput['companyInfo']
  ): {
    optimizedDSO: number;
    optimizedDPO: number;
    optimizedDIO: number;
    optimizedCycle: number;
    improvement: number;
  } {
    // Optimize DSO (reduce collection period)
    const optimizedDSO = Math.max(0, workingCapital.daysSalesOutstanding - 5); // Reduce by 5 days

    // Optimize DPO (extend payment terms where beneficial)
    const optimizedDPO = Math.min(60, workingCapital.daysPayableOutstanding + 10); // Extend by 10 days

    // Optimize DIO (reduce inventory days)
    const optimizedDIO = Math.max(0, workingCapital.daysInventoryOutstanding - 3); // Reduce by 3 days

    const optimizedCycle = optimizedDSO + optimizedDIO - optimizedDPO;
    const improvement = workingCapital.cashConversionCycle - optimizedCycle;

    return {
      optimizedDSO,
      optimizedDPO,
      optimizedDIO,
      optimizedCycle,
      improvement,
    };
  }

  private static compareFinancingOptions(
    options: SupplyChainFinanceInput['financingOptions'],
    costOfCapital: SupplyChainFinanceInput['costOfCapital'],
    supplyChain: SupplyChainFinanceInput['supplyChain']
  ): {
    options: Array<{
      method: string;
      annualCost: number;
      annualSavings: number;
      netBenefit: number;
    }>;
    bestOption: string;
    totalSavings: number;
  } {
    const totalPayables = supplyChain.suppliers.reduce((sum, s) => sum + s.annualPurchaseVolume, 0);

    const financingOptions = [
      {
        method: 'dynamic-discounting',
        annualCost: options.dynamicDiscounting.enabled
          ? options.dynamicDiscounting.annualVolume * options.dynamicDiscounting.discountRate
          : 0,
        annualSavings: options.dynamicDiscounting.enabled
          ? (totalPayables *
              costOfCapital.opportunityCostRate *
              (30 - options.dynamicDiscounting.earlyPaymentDays)) /
            365
          : 0,
        netBenefit: 0,
      },
      {
        method: 'reverse-factoring',
        annualCost: options.reverseFactoring.enabled
          ? options.reverseFactoring.annualVolume *
            (options.reverseFactoring.financingRate + options.reverseFactoring.programFee)
          : 0,
        annualSavings: options.reverseFactoring.enabled
          ? totalPayables * costOfCapital.wacc * 0.5 // 50% of payables financed
          : 0,
        netBenefit: 0,
      },
      {
        method: 'supply-chain-finance',
        annualCost: options.supplyChainFinance.enabled
          ? options.supplyChainFinance.annualVolume *
            (options.supplyChainFinance.financingRate + options.supplyChainFinance.programFee)
          : 0,
        annualSavings: options.supplyChainFinance.enabled
          ? totalPayables * costOfCapital.wacc * 0.6 // 60% of payables financed
          : 0,
        netBenefit: 0,
      },
    ].map((opt) => ({
      ...opt,
      netBenefit: opt.annualSavings - opt.annualCost,
    }));

    const bestOption = financingOptions.reduce((best, current) =>
      current.netBenefit > best.netBenefit ? current : best
    ).method;

    const totalSavings = financingOptions.reduce((sum, opt) => sum + opt.netBenefit, 0);

    return {
      options: financingOptions,
      bestOption,
      totalSavings,
    };
  }

  private static analyzeCashFlowImpact(
    optimization: { improvement: number } | undefined,
    financing: { totalSavings: number } | undefined,
    _workingCapital: SupplyChainFinanceInput['workingCapital']
  ): {
    cashFlowImprovement: number;
    workingCapitalReduction: number;
    freedCash: number;
  } {
    const cycleImprovement = optimization?.improvement || 0;
    const annualRevenue = 10000000; // Simplified - would come from input
    const dailyRevenue = annualRevenue / 365;
    const cashFlowImprovement = cycleImprovement * dailyRevenue;
    const workingCapitalReduction = cashFlowImprovement;
    const freedCash = workingCapitalReduction + (financing?.totalSavings || 0);

    return {
      cashFlowImprovement,
      workingCapitalReduction,
      freedCash,
    };
  }

  private static analyzeSupplierBenefits(
    options: SupplyChainFinanceInput['financingOptions'],
    supplyChain: SupplyChainFinanceInput['supplyChain']
  ): {
    suppliers: Array<{ supplier: string; benefit: string; earlyPaymentDays: number }>;
    totalSupplierBenefits: number;
  } {
    const suppliers = supplyChain.suppliers.map((supplier) => {
      let benefit = 'Standard payment terms';
      let earlyPaymentDays = 0;

      if (options.dynamicDiscounting.enabled) {
        benefit = 'Early payment with discount';
        earlyPaymentDays = options.dynamicDiscounting.earlyPaymentDays;
      } else if (options.reverseFactoring.enabled) {
        benefit = 'Access to financing at lower cost';
        earlyPaymentDays = 0;
      }

      return {
        supplier: supplier.supplierName || 'Unknown',
        benefit,
        earlyPaymentDays,
      };
    });

    return {
      suppliers,
      totalSupplierBenefits: suppliers.length * 1000, // Simplified
    };
  }

  private static analyzeRisks(
    _supplyChain: SupplyChainFinanceInput['supplyChain'],
    options: SupplyChainFinanceInput['financingOptions'],
    workingCapital: SupplyChainFinanceInput['workingCapital']
  ): {
    risks: Array<{ risk: string; severity: 'low' | 'medium' | 'high'; mitigation: string }>;
    overallRisk: string;
  } {
    const risks: Array<{ risk: string; severity: 'low' | 'medium' | 'high'; mitigation: string }> =
      [];

    if (workingCapital.cashConversionCycle > 90) {
      risks.push({
        risk: 'Extended cash conversion cycle',
        severity: 'high',
        mitigation: 'Implement supply chain finance to reduce cycle',
      });
    }

    if (options.supplyChainFinance.enabled && !options.supplyChainFinance.annualVolume) {
      risks.push({
        risk: 'Financing program not fully utilized',
        severity: 'medium',
        mitigation: 'Increase program participation',
      });
    }

    const overallRisk = risks.some((r) => r.severity === 'high')
      ? 'high'
      : risks.length > 0
        ? 'medium'
        : 'low';

    return {
      risks,
      overallRisk,
    };
  }

  private static generateRecommendations(
    optimization: { improvement: number } | undefined,
    financing: { bestOption: string; totalSavings: number } | undefined,
    cashFlow: { freedCash: number } | undefined,
    _suppliers: { totalSupplierBenefits: number } | undefined,
    risk: { overallRisk: string } | undefined
  ): string[] {
    const recommendations: string[] = [];

    if (optimization && optimization.improvement > 0) {
      recommendations.push(
        `Cash conversion cycle improvement: ${optimization.improvement.toFixed(0)} days`
      );
    }

    if (financing) {
      recommendations.push(`Recommended financing: ${financing.bestOption}`);
      recommendations.push(`Total savings: $${financing.totalSavings.toFixed(0)}`);
    }

    if (cashFlow) {
      recommendations.push(`Freed cash: $${cashFlow.freedCash.toFixed(0)}`);
    }

    if (risk && risk.overallRisk === 'high') {
      recommendations.push('Address high-risk items in supply chain finance');
    }

    return recommendations;
  }
}
