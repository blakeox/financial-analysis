/**
 * Working Capital Optimizer
 * Cash conversion cycle, liquidity analysis, and working capital optimization
 */

import type { WorkingCapitalInput } from '../schemas/working-capital.js';

export class WorkingCapitalOptimizer {
  /**
   * Analyze and optimize working capital
   */
  static analyze(input: WorkingCapitalInput): unknown {
    const currentAssets = input.currentAssets;
    const currentLiabilities = input.currentLiabilities;
    const operatingMetrics = input.operatingMetrics;
    const analysis = input.analysis;

    // Calculate working capital
    const workingCapital = this.calculateWorkingCapital(currentAssets, currentLiabilities);

    // Calculate ratios
    const ratios = this.calculateRatios(
      currentAssets,
      currentLiabilities,
      input.companyInfo.annualRevenue
    );

    // Cash conversion cycle
    const cashConversionCycle = analysis.includeCashConversionCycle
      ? this.calculateCashConversionCycle(
          operatingMetrics,
          input.companyInfo.annualRevenue,
          currentAssets,
          currentLiabilities
        )
      : undefined;

    // Liquidity analysis
    const liquidityAnalysis = analysis.includeLiquidityAnalysis
      ? this.analyzeLiquidity(workingCapital, ratios, currentLiabilities)
      : undefined;

    // Optimization recommendations
    const optimization = analysis.includeOptimization
      ? this.optimizeWorkingCapital(
          currentAssets,
          currentLiabilities,
          operatingMetrics,
          input.companyInfo.annualRevenue
        )
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      workingCapital,
      ratios,
      cashConversionCycle,
      liquidityAnalysis,
      optimization
    );

    return {
      summary: {
        workingCapital: workingCapital.netWorkingCapital,
        currentRatio: ratios.currentRatio,
        quickRatio: ratios.quickRatio,
        cashConversionCycle: cashConversionCycle?.cycle,
        workingCapitalTurnover: ratios.workingCapitalTurnover,
      },
      workingCapital,
      ratios,
      cashConversionCycle,
      liquidityAnalysis,
      optimization,
      recommendations,
    };
  }

  private static calculateWorkingCapital(
    currentAssets: WorkingCapitalInput['currentAssets'],
    currentLiabilities: WorkingCapitalInput['currentLiabilities']
  ): {
    totalCurrentAssets: number;
    totalCurrentLiabilities: number;
    netWorkingCapital: number;
    workingCapitalRatio: number;
  } {
    const totalCurrentAssets =
      currentAssets.cash +
      currentAssets.accountsReceivable +
      currentAssets.inventory +
      currentAssets.otherCurrentAssets;
    const totalCurrentLiabilities =
      currentLiabilities.accountsPayable +
      currentLiabilities.shortTermDebt +
      currentLiabilities.accruedExpenses +
      currentLiabilities.otherCurrentLiabilities;
    const netWorkingCapital = totalCurrentAssets - totalCurrentLiabilities;
    const workingCapitalRatio =
      totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 999;

    return {
      totalCurrentAssets,
      totalCurrentLiabilities,
      netWorkingCapital,
      workingCapitalRatio,
    };
  }

  private static calculateRatios(
    currentAssets: WorkingCapitalInput['currentAssets'],
    currentLiabilities: WorkingCapitalInput['currentLiabilities'],
    annualRevenue: number
  ): {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
    workingCapitalTurnover: number;
  } {
    const totalCurrentAssets =
      currentAssets.cash +
      currentAssets.accountsReceivable +
      currentAssets.inventory +
      currentAssets.otherCurrentAssets;
    const totalCurrentLiabilities =
      currentLiabilities.accountsPayable +
      currentLiabilities.shortTermDebt +
      currentLiabilities.accruedExpenses +
      currentLiabilities.otherCurrentLiabilities;

    const currentRatio =
      totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 999;
    const quickAssets = currentAssets.cash + currentAssets.accountsReceivable;
    const quickRatio = totalCurrentLiabilities > 0 ? quickAssets / totalCurrentLiabilities : 999;
    const cashRatio =
      totalCurrentLiabilities > 0 ? currentAssets.cash / totalCurrentLiabilities : 999;
    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;
    const workingCapitalTurnover = workingCapital > 0 ? annualRevenue / workingCapital : 0;

    return {
      currentRatio,
      quickRatio,
      cashRatio,
      workingCapitalTurnover,
    };
  }

  private static calculateCashConversionCycle(
    operatingMetrics: WorkingCapitalInput['operatingMetrics'],
    annualRevenue: number,
    currentAssets: WorkingCapitalInput['currentAssets'],
    currentLiabilities: WorkingCapitalInput['currentLiabilities']
  ): {
    daysSalesOutstanding: number;
    daysInventoryOutstanding: number;
    daysPayableOutstanding: number;
    cycle: number;
    interpretation: string;
  } {
    // Calculate DSO if not provided
    const dso = operatingMetrics.daysSalesOutstanding
      ? operatingMetrics.daysSalesOutstanding
      : (currentAssets.accountsReceivable / annualRevenue) * 365;

    // Calculate DIO if not provided
    const dio = operatingMetrics.daysInventoryOutstanding
      ? operatingMetrics.daysInventoryOutstanding
      : operatingMetrics.inventoryTurnover
        ? 365 / operatingMetrics.inventoryTurnover
        : (currentAssets.inventory / annualRevenue) * 365;

    // Calculate DPO if not provided
    const dpo = operatingMetrics.daysPayableOutstanding
      ? operatingMetrics.daysPayableOutstanding
      : (currentLiabilities.accountsPayable / annualRevenue) * 365;

    // Cash Conversion Cycle = DSO + DIO - DPO
    const cycle = dso + dio - dpo;

    let interpretation = '';
    if (cycle < 0) {
      interpretation = 'Negative cycle - company is paid before paying suppliers (excellent)';
    } else if (cycle < 30) {
      interpretation = 'Short cycle - efficient working capital management';
    } else if (cycle < 60) {
      interpretation = 'Moderate cycle - typical for many industries';
    } else {
      interpretation = 'Long cycle - capital tied up in operations, consider optimization';
    }

    return {
      daysSalesOutstanding: dso,
      daysInventoryOutstanding: dio,
      daysPayableOutstanding: dpo,
      cycle,
      interpretation,
    };
  }

  private static analyzeLiquidity(
    workingCapital: { netWorkingCapital: number },
    ratios: { currentRatio: number; quickRatio: number },
    currentLiabilities: WorkingCapitalInput['currentLiabilities']
  ): {
    liquidityScore: number;
    liquidityStatus: string;
    riskFactors: string[];
  } {
    let score = 100;
    const riskFactors: string[] = [];

    // Working capital
    if (workingCapital.netWorkingCapital < 0) {
      score -= 40;
      riskFactors.push('Negative working capital - cannot meet short-term obligations');
    } else if (workingCapital.netWorkingCapital < currentLiabilities.accountsPayable) {
      score -= 20;
      riskFactors.push('Low working capital relative to payables');
    }

    // Current ratio
    if (ratios.currentRatio < 1) {
      score -= 30;
      riskFactors.push('Current ratio below 1.0 - liquidity concerns');
    } else if (ratios.currentRatio < 1.5) {
      score -= 10;
      riskFactors.push('Current ratio below 1.5 - monitor closely');
    }

    // Quick ratio
    if (ratios.quickRatio < 0.5) {
      score -= 20;
      riskFactors.push('Low quick ratio - limited liquid assets');
    }

    let liquidityStatus = '';
    if (score >= 80) {
      liquidityStatus = 'Strong';
    } else if (score >= 60) {
      liquidityStatus = 'Adequate';
    } else if (score >= 40) {
      liquidityStatus = 'Weak';
    } else {
      liquidityStatus = 'Critical';
    }

    return {
      liquidityScore: Math.max(0, Math.min(100, score)),
      liquidityStatus,
      riskFactors,
    };
  }

  private static optimizeWorkingCapital(
    currentAssets: WorkingCapitalInput['currentAssets'],
    currentLiabilities: WorkingCapitalInput['currentLiabilities'],
    operatingMetrics: WorkingCapitalInput['operatingMetrics'],
    annualRevenue: number
  ): {
    optimizations: Array<{
      area: string;
      current: number;
      optimized: number;
      improvement: number;
      savings: number;
    }>;
    totalSavings: number;
  } {
    const optimizations: Array<{
      area: string;
      current: number;
      optimized: number;
      improvement: number;
      savings: number;
    }> = [];

    // AR optimization (reduce DSO by 10%)
    const currentDSO =
      operatingMetrics.daysSalesOutstanding ||
      (currentAssets.accountsReceivable / annualRevenue) * 365;
    const optimizedDSO = currentDSO * 0.9;
    const optimizedAR = (optimizedDSO / 365) * annualRevenue;
    const arSavings = currentAssets.accountsReceivable - optimizedAR;
    optimizations.push({
      area: 'Accounts Receivable',
      current: currentDSO,
      optimized: optimizedDSO,
      improvement: currentDSO - optimizedDSO,
      savings: arSavings,
    });

    // Inventory optimization (reduce DIO by 10%)
    const currentDIO =
      operatingMetrics.daysInventoryOutstanding || (currentAssets.inventory / annualRevenue) * 365;
    const optimizedDIO = currentDIO * 0.9;
    const optimizedInventory = (optimizedDIO / 365) * annualRevenue;
    const inventorySavings = currentAssets.inventory - optimizedInventory;
    optimizations.push({
      area: 'Inventory',
      current: currentDIO,
      optimized: optimizedDIO,
      improvement: currentDIO - optimizedDIO,
      savings: inventorySavings,
    });

    // AP optimization (extend DPO by 10% if reasonable)
    const currentDPO =
      operatingMetrics.daysPayableOutstanding ||
      (currentLiabilities.accountsPayable / annualRevenue) * 365;
    if (currentDPO < 60) {
      const optimizedDPO = currentDPO * 1.1;
      const optimizedAP = (optimizedDPO / 365) * annualRevenue;
      const apSavings = optimizedAP - currentLiabilities.accountsPayable;
      optimizations.push({
        area: 'Accounts Payable',
        current: currentDPO,
        optimized: optimizedDPO,
        improvement: optimizedDPO - currentDPO,
        savings: apSavings,
      });
    }

    const totalSavings = optimizations.reduce((sum, opt) => sum + opt.savings, 0);

    return {
      optimizations,
      totalSavings,
    };
  }

  private static generateRecommendations(
    workingCapital: { netWorkingCapital: number },
    ratios: { currentRatio: number; quickRatio: number },
    cashConversionCycle?: { cycle: number; interpretation: string },
    liquidityAnalysis?: { liquidityStatus: string; riskFactors: string[] },
    optimization?: { totalSavings: number }
  ): string[] {
    const recommendations: string[] = [];

    if (workingCapital.netWorkingCapital < 0) {
      recommendations.push(
        '⚠️ Negative working capital - urgent action needed to improve liquidity'
      );
    }

    if (ratios.currentRatio < 1.5) {
      recommendations.push(
        'Current ratio below 1.5 - consider increasing current assets or reducing liabilities'
      );
    }

    if (cashConversionCycle) {
      recommendations.push(
        `Cash Conversion Cycle: ${cashConversionCycle.cycle.toFixed(0)} days - ${cashConversionCycle.interpretation}`
      );
    }

    if (liquidityAnalysis) {
      recommendations.push(`Liquidity Status: ${liquidityAnalysis.liquidityStatus}`);
      if (liquidityAnalysis.riskFactors.length > 0) {
        recommendations.push(`Risk Factors: ${liquidityAnalysis.riskFactors.join(', ')}`);
      }
    }

    if (optimization && optimization.totalSavings > 0) {
      recommendations.push(
        `Potential working capital savings: $${optimization.totalSavings.toFixed(0)} through optimization`
      );
    }

    return recommendations;
  }
}
