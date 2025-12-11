/**
 * Capital Structure Optimization
 * WACC optimization, optimal debt/equity ratio, credit rating impact
 */

import type { CapitalStructureInput } from '../schemas/capital-structure.js';

export class CapitalStructureOptimizer {
  /**
   * Analyze and optimize capital structure
   */
  static analyze(input: CapitalStructureInput): unknown {
    const companyInfo = input.companyInfo;
    const financials = input.financials;
    const marketData = input.marketData;
    const analysis = input.analysis;

    // Calculate current capital structure
    const currentStructure = this.calculateCurrentStructure(companyInfo, financials);

    // Calculate WACC
    const wacc = this.calculateWACC(financials, marketData, {
      ...currentStructure,
      debt: currentStructure.debt,
    });

    // WACC optimization across debt levels
    const waccOptimization = analysis.includeWACCOptimization
      ? this.optimizeWACC(financials, marketData, companyInfo)
      : undefined;

    // Debt capacity analysis
    const debtCapacity = analysis.includeDebtCapacity
      ? this.analyzeDebtCapacity(financials, currentStructure)
      : undefined;

    // Credit rating impact
    const creditRatingImpact = analysis.includeCreditRatingImpact
      ? this.analyzeCreditRatingImpact(financials, currentStructure, marketData.creditRating)
      : undefined;

    // Dividend policy (if requested)
    const dividendPolicy = analysis.includeDividendPolicy
      ? this.analyzeDividendPolicy(financials, currentStructure)
      : undefined;

    // Optimal structure recommendation
    const optimalStructure = this.recommendOptimalStructure(
      wacc,
      waccOptimization,
      debtCapacity,
      creditRatingImpact
    );

    return {
      summary: {
        currentWACC: wacc.wacc,
        optimalWACC: waccOptimization?.optimalWACC,
        currentDebtToEquity: currentStructure.debtToEquity,
        optimalDebtToEquity: optimalStructure.optimalDebtToEquity,
        debtCapacity: debtCapacity?.maxDebt,
      },
      currentStructure,
      wacc,
      waccOptimization,
      debtCapacity,
      creditRatingImpact,
      dividendPolicy,
      optimalStructure,
      recommendations: this.generateRecommendations(
        wacc,
        waccOptimization,
        debtCapacity,
        optimalStructure
      ),
    };
  }

  private static calculateCurrentStructure(
    companyInfo: CapitalStructureInput['companyInfo'],
    _financials: CapitalStructureInput['financials']
  ): {
    equity: number;
    debt: number;
    totalCapital: number;
    debtToEquity: number;
    debtToCapital: number;
    equityToCapital: number;
  } {
    const equity = companyInfo.marketCap;
    const debt = companyInfo.currentDebt;
    const totalCapital = equity + debt;
    const debtToEquity = equity > 0 ? debt / equity : 999;
    const debtToCapital = totalCapital > 0 ? debt / totalCapital : 0;
    const equityToCapital = totalCapital > 0 ? equity / totalCapital : 0;

    return {
      equity,
      debt,
      totalCapital,
      debtToEquity,
      debtToCapital,
      equityToCapital,
    };
  }

  private static calculateWACC(
    financials: CapitalStructureInput['financials'],
    marketData: CapitalStructureInput['marketData'],
    structure: { debtToCapital: number; equityToCapital: number; debt: number }
  ): {
    costOfEquity: number;
    costOfDebt: number;
    afterTaxCostOfDebt: number;
    wacc: number;
    equityWeight: number;
    debtWeight: number;
  } {
    // Cost of equity using CAPM
    const costOfEquity = marketData.riskFreeRate + marketData.beta * marketData.marketRiskPremium;

    // Cost of debt (from interest expense or credit rating)
    const costOfDebt =
      financials.annualInterestExpense > 0 && structure.debt > 0
        ? financials.annualInterestExpense / structure.debt
        : this.getCostOfDebtFromRating(marketData.creditRating);

    const afterTaxCostOfDebt = costOfDebt * (1 - financials.taxRate);

    // WACC
    const wacc =
      structure.equityToCapital * costOfEquity + structure.debtToCapital * afterTaxCostOfDebt;

    return {
      costOfEquity,
      costOfDebt,
      afterTaxCostOfDebt,
      wacc,
      equityWeight: structure.equityToCapital,
      debtWeight: structure.debtToCapital,
    };
  }

  private static getCostOfDebtFromRating(
    rating?: CapitalStructureInput['marketData']['creditRating']
  ): number {
    const rates: Record<string, number> = {
      AAA: 0.03,
      AA: 0.035,
      A: 0.04,
      BBB: 0.05,
      BB: 0.07,
      B: 0.09,
      CCC: 0.12,
      D: 0.15,
    };
    return rates[rating || 'BBB'] || 0.05;
  }

  private static optimizeWACC(
    _financials: CapitalStructureInput['financials'],
    marketData: CapitalStructureInput['marketData'],
    _companyInfo: CapitalStructureInput['companyInfo']
  ): {
    scenarios: Array<{
      debtToEquity: number;
      wacc: number;
      costOfDebt: number;
      costOfEquity: number;
    }>;
    optimalWACC: number;
    optimalDebtToEquity: number;
  } {
    const scenarios: Array<{
      debtToEquity: number;
      wacc: number;
      costOfDebt: number;
      costOfEquity: number;
    }> = [];

    let optimalWACC = 999;
    let optimalDebtToEquity = 0;

    // Test different debt-to-equity ratios
    for (let debtToEquity = 0; debtToEquity <= 2; debtToEquity += 0.1) {
      const debtWeight = debtToEquity / (1 + debtToEquity);
      const equityWeight = 1 / (1 + debtToEquity);

      // Cost of equity increases with leverage (beta adjustment)
      const adjustedBeta = marketData.beta * (1 + debtToEquity * 0.3); // Simplified
      const costOfEquity = marketData.riskFreeRate + adjustedBeta * marketData.marketRiskPremium;

      // Cost of debt increases with leverage
      const baseCostOfDebt = this.getCostOfDebtFromRating(marketData.creditRating);
      const costOfDebt = baseCostOfDebt * (1 + debtToEquity * 0.1); // Simplified

      const afterTaxCostOfDebt = costOfDebt * (1 - financials.taxRate);
      const wacc = equityWeight * costOfEquity + debtWeight * afterTaxCostOfDebt;

      scenarios.push({
        debtToEquity,
        wacc,
        costOfDebt,
        costOfEquity,
      });

      if (wacc < optimalWACC) {
        optimalWACC = wacc;
        optimalDebtToEquity = debtToEquity;
      }
    }

    return {
      scenarios,
      optimalWACC,
      optimalDebtToEquity,
    };
  }

  private static analyzeDebtCapacity(
    financials: CapitalStructureInput['financials'],
    _structure: { debt: number; totalCapital: number }
  ): {
    maxDebt: number;
    recommendedDebt: number;
    currentDebtRatio: number;
    debtCapacityRatio: number;
  } {
    // Based on EBITDA coverage
    const maxDebtService = financials.annualEBITDA * 0.4; // 40% of EBITDA for debt service
    const avgCostOfDebt = 0.06; // Assume 6% average
    const maxDebt = maxDebtService / avgCostOfDebt;
    const recommendedDebt = maxDebt * 0.8; // 80% of max for safety

    const currentDebtRatio = maxDebt > 0 ? structure.debt / maxDebt : 0;
    const debtCapacityRatio = structure.debt > 0 ? maxDebt / structure.debt : 999;

    return {
      maxDebt,
      recommendedDebt,
      currentDebtRatio,
      debtCapacityRatio,
    };
  }

  private static analyzeCreditRatingImpact(
    financials: CapitalStructureInput['financials'],
    structure: { debtToEquity: number },
    currentRating?: CapitalStructureInput['marketData']['creditRating']
  ): {
    currentRating: string;
    projectedRating: string;
    ratingFactors: Array<{ factor: string; impact: string }>;
  } {
    // Simplified rating logic
    let projectedRating = currentRating || 'BBB';

    if (structure.debtToEquity > 1.5) {
      projectedRating = 'BB';
    } else if (structure.debtToEquity > 1.0) {
      projectedRating = 'BBB';
    } else if (structure.debtToEquity > 0.5) {
      projectedRating = 'A';
    } else {
      projectedRating = 'AA';
    }

    const ratingFactors: Array<{ factor: string; impact: string }> = [];
    if (structure.debtToEquity > 1.0) {
      ratingFactors.push({
        factor: 'High Debt-to-Equity',
        impact: 'May result in credit rating downgrade',
      });
    }

    return {
      currentRating: currentRating || 'BBB',
      projectedRating,
      ratingFactors,
    };
  }

  private static analyzeDividendPolicy(
    financials: CapitalStructureInput['financials'],
    structure: { equity: number }
  ): {
    payoutRatio: number;
    dividendYield: number;
    sustainablePayout: number;
    recommendations: string[];
  } {
    // Assume no current dividends for analysis
    const payoutRatio = 0;
    const dividendYield = 0;
    const sustainablePayout = financials.netIncome * 0.4; // 40% payout ratio

    return {
      payoutRatio,
      dividendYield,
      sustainablePayout,
      recommendations: [
        'Consider dividend policy based on growth opportunities and cash needs',
        `Sustainable dividend: $${sustainablePayout.toFixed(0)}/year (${((sustainablePayout / structure.equity) * 100).toFixed(2)}% yield)`,
      ],
    };
  }

  private static recommendOptimalStructure(
    wacc: { wacc: number },
    waccOptimization?: { optimalDebtToEquity: number; optimalWACC: number },
    debtCapacity?: { recommendedDebt: number },
    creditRatingImpact?: { projectedRating: string }
  ): {
    optimalDebtToEquity: number;
    optimalWACC: number;
    recommendation: string;
    reasoning: string;
  } {
    const optimalDebtToEquity = waccOptimization?.optimalDebtToEquity || 0.5;
    const optimalWACC = waccOptimization?.optimalWACC || wacc.wacc;

    let recommendation = 'Maintain current capital structure';
    let reasoning = 'Current structure appears optimal';

    if (waccOptimization && waccOptimization.optimalWACC < wacc.wacc * 0.95) {
      recommendation = 'Consider adjusting debt-to-equity ratio';
      reasoning = `Optimal WACC of ${(optimalWACC * 100).toFixed(2)}% can be achieved with debt-to-equity of ${optimalDebtToEquity.toFixed(2)}`;
    }

    if (
      creditRatingImpact &&
      creditRatingImpact.projectedRating !== 'A' &&
      creditRatingImpact.projectedRating !== 'AA'
    ) {
      reasoning += `. Note: Target structure may impact credit rating (${creditRatingImpact.projectedRating})`;
    }

    return {
      optimalDebtToEquity,
      optimalWACC,
      recommendation,
      reasoning,
    };
  }

  private static generateRecommendations(
    wacc: { wacc: number },
    waccOptimization?: { optimalWACC: number; optimalDebtToEquity: number },
    debtCapacity?: { recommendedDebt: number },
    optimalStructure: { optimalDebtToEquity: number }
  ): string[] {
    const recommendations: string[] = [];

    if (waccOptimization && waccOptimization.optimalWACC < wacc.wacc) {
      recommendations.push(
        `WACC can be optimized from ${(wacc.wacc * 100).toFixed(2)}% to ${(waccOptimization.optimalWACC * 100).toFixed(2)}%`
      );
      recommendations.push(
        `Optimal debt-to-equity ratio: ${optimalStructure.optimalDebtToEquity.toFixed(2)}`
      );
    }

    if (debtCapacity) {
      recommendations.push(`Recommended debt level: $${debtCapacity.recommendedDebt.toFixed(0)}`);
    }

    recommendations.push('Monitor credit rating impact when adjusting capital structure');
    recommendations.push('Consider tax shield benefits of debt vs financial flexibility of equity');

    return recommendations;
  }
}
