import { Decimal } from 'decimal.js';
import { z } from 'zod';
import {
  CashFlowAnalysisInputSchema,
  type CashFlowAnalysisInput,
  type CashFlowItem,
} from '../schemas/cash-flow.js';
import type {
  CashFlowAnalysisResult,
  MonthlyCashFlow,
  CashFlowByCategory,
  CashFlowMetrics,
  LiquidityAnalysis,
  RiskAssessment,
} from '../types/cash-flow-result.js';

export class CashFlowAnalyzer {
  /**
   * Main analysis method for cash flow
   */
  static analyze(input: z.infer<typeof CashFlowAnalysisInputSchema>): CashFlowAnalysisResult {
    const validated = CashFlowAnalysisInputSchema.parse(input);

    const startDate = new Date(validated.analysisStartDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + validated.analysisPeriodMonths);

    // Generate monthly cash flows
    const monthlyCashFlows = this.generateMonthlyCashFlows(validated, startDate);

    // Summarize by category
    const cashFlowByCategory = this.summarizeByCategory(validated.cashFlowItems, monthlyCashFlows);

    // Calculate metrics
    const metrics = this.calculateMetrics(validated, monthlyCashFlows);

    // Liquidity analysis
    const liquidityAnalysis = this.analyzeLiquidity(validated, monthlyCashFlows);

    // Risk assessment
    const riskAssessment = this.assessRisk(monthlyCashFlows, liquidityAnalysis);

    // Generate insights
    const insights = this.generateInsights(metrics, liquidityAnalysis, riskAssessment);
    const warnings = this.generateWarnings(liquidityAnalysis, riskAssessment);
    const recommendations = this.generateRecommendations(metrics, liquidityAnalysis);

    const overallHealth = this.assessOverallHealth(metrics, liquidityAnalysis, riskAssessment);

    const result: CashFlowAnalysisResult = {
      analysisStartDate: startDate.toISOString(),
      analysisEndDate: endDate.toISOString(),
      analysisPeriodMonths: validated.analysisPeriodMonths,
      method: validated.method,
      monthlyCashFlows,
      cashFlowByCategory,
      metrics,
      ratios: this.calculateRatios(metrics),
      liquidityAnalysis,
      riskAssessment,
      insights,
      warnings,
      recommendations,
      overallHealth,
      calculationDate: new Date().toISOString(),
      assumptions: this.buildAssumptions(validated),
    };

    // Add companyName only if it exists
    if (validated.companyName) {
      result.companyName = validated.companyName;
    }

    return result;
  }

  private static generateMonthlyCashFlows(
    input: CashFlowAnalysisInput,
    startDate: Date
  ): MonthlyCashFlow[] {
    const cashFlows: MonthlyCashFlow[] = [];
    let cumulativeCashFlow = new Decimal(0);
    let currentBalance = new Decimal(input.openingCashBalance);

    for (let month = 0; month < input.analysisPeriodMonths; month++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(monthDate.getMonth() + month);

      const monthData = this.calculateMonthCashFlow(input, month, monthDate);

      const netCashFlow = new Decimal(monthData.totalInflows).minus(monthData.totalOutflows);
      cumulativeCashFlow = cumulativeCashFlow.plus(netCashFlow);
      const closingBalance = currentBalance.plus(netCashFlow);

      cashFlows.push({
        month: month + 1,
        date: monthDate.toISOString(),
        operatingInflows: monthData.operatingInflows,
        operatingOutflows: monthData.operatingOutflows,
        netOperatingCashFlow: monthData.operatingInflows - monthData.operatingOutflows,
        investingInflows: monthData.investingInflows,
        investingOutflows: monthData.investingOutflows,
        netInvestingCashFlow: monthData.investingInflows - monthData.investingOutflows,
        financingInflows: monthData.financingInflows,
        financingOutflows: monthData.financingOutflows,
        netFinancingCashFlow: monthData.financingInflows - monthData.financingOutflows,
        totalInflows: monthData.totalInflows,
        totalOutflows: monthData.totalOutflows,
        netCashFlow: netCashFlow.toNumber(),
        openingBalance: currentBalance.toNumber(),
        closingBalance: closingBalance.toNumber(),
        cumulativeCashFlow: cumulativeCashFlow.toNumber(),
      });

      currentBalance = closingBalance;
    }

    return cashFlows;
  }

  private static calculateMonthCashFlow(
    input: CashFlowAnalysisInput,
    monthIndex: number,
    monthDate: Date
  ) {
    let operatingInflows = 0;
    let operatingOutflows = 0;
    let investingInflows = 0;
    let investingOutflows = 0;
    let financingInflows = 0;
    let financingOutflows = 0;

    input.cashFlowItems.forEach((item) => {
      const amount = this.getCashFlowAmount(item, monthIndex, input);

      if (amount !== 0) {
        switch (item.type) {
          case 'operating':
            if (amount > 0) operatingInflows += amount;
            else operatingOutflows += Math.abs(amount);
            break;
          case 'investing':
            if (amount > 0) investingInflows += amount;
            else investingOutflows += Math.abs(amount);
            break;
          case 'financing':
            if (amount > 0) financingInflows += amount;
            else financingOutflows += Math.abs(amount);
            break;
        }
      }
    });

    // Add debt service
    input.debtObligations?.forEach((debt) => {
      const debtPayment = this.calculateDebtPayment(debt, monthIndex, monthDate);
      financingOutflows += debtPayment;
    });

    return {
      operatingInflows,
      operatingOutflows,
      investingInflows,
      investingOutflows,
      financingInflows,
      financingOutflows,
      totalInflows: operatingInflows + investingInflows + financingInflows,
      totalOutflows: operatingOutflows + investingOutflows + financingOutflows,
    };
  }

  private static getCashFlowAmount(
    item: CashFlowItem,
    monthIndex: number,
    input: CashFlowAnalysisInput
  ): number {
    if (!item.isRecurring && item.date) {
      // One-time item
      const itemDate = new Date(item.date);
      const startDate = new Date(input.analysisStartDate);
      const itemMonth = Math.floor(
        (itemDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );
      return itemMonth === monthIndex ? item.amount : 0;
    }

    // Recurring item
    if (item.frequency === 'monthly') {
      const yearFraction = monthIndex / 12;
      const growthMultiplier = Math.pow(1 + item.growthRate, yearFraction);
      let amount = item.amount * growthMultiplier;

      // Apply seasonality if enabled
      if (input.includeSeasonality && input.seasonalityFactors) {
        const seasonalMonth = monthIndex % 12;
        const factor = input.seasonalityFactors[seasonalMonth];
        if (factor !== undefined) {
          amount *= factor;
        }
      }

      return amount;
    } else if (item.frequency === 'quarterly') {
      if (monthIndex % 3 === 0) {
        const yearFraction = monthIndex / 12;
        const growthMultiplier = Math.pow(1 + item.growthRate, yearFraction);
        return item.amount * growthMultiplier;
      }
      return 0;
    } else if (item.frequency === 'annual') {
      if (monthIndex % 12 === 0) {
        const years = Math.floor(monthIndex / 12);
        const growthMultiplier = Math.pow(1 + item.growthRate, years);
        return item.amount * growthMultiplier;
      }
      return 0;
    }

    return 0;
  }

  private static calculateDebtPayment(
    debt: { principal: number; interestRate: number; termMonths: number },
    monthIndex: number,
    _monthDate: Date
  ): number {
    // Simplified debt payment calculation
    const monthlyRate = debt.interestRate / 12;
    const payment =
      (debt.principal * monthlyRate * Math.pow(1 + monthlyRate, debt.termMonths)) /
      (Math.pow(1 + monthlyRate, debt.termMonths) - 1);

    return monthIndex < debt.termMonths ? payment : 0;
  }

  private static summarizeByCategory(
    items: CashFlowItem[],
    monthlyCashFlows: MonthlyCashFlow[]
  ): CashFlowByCategory[] {
    const categorySummary = new Map<string, { inflow: Decimal; outflow: Decimal }>();

    items.forEach((item) => {
      const key = item.category;
      if (!categorySummary.has(key)) {
        categorySummary.set(key, { inflow: new Decimal(0), outflow: new Decimal(0) });
      }

      const summary = categorySummary.get(key)!;
      if (item.amount > 0) {
        summary.inflow = summary.inflow.plus(Math.abs(item.amount) * monthlyCashFlows.length);
      } else {
        summary.outflow = summary.outflow.plus(Math.abs(item.amount) * monthlyCashFlows.length);
      }
    });

    const totalCashFlow = monthlyCashFlows.reduce((sum, m) => sum + Math.abs(m.netCashFlow), 0);

    return Array.from(categorySummary.entries()).map(([category, summary]) => {
      const netCashFlow = summary.inflow.minus(summary.outflow).toNumber();
      return {
        category,
        totalInflow: summary.inflow.toNumber(),
        totalOutflow: summary.outflow.toNumber(),
        netCashFlow,
        percentOfTotal: totalCashFlow > 0 ? (Math.abs(netCashFlow) / totalCashFlow) * 100 : 0,
        monthlyAverage: netCashFlow / monthlyCashFlows.length,
      };
    });
  }

  private static calculateMetrics(
    input: CashFlowAnalysisInput,
    monthlyCashFlows: MonthlyCashFlow[]
  ): CashFlowMetrics {
    const totalOperatingCashFlow = monthlyCashFlows.reduce(
      (sum, m) => sum + m.netOperatingCashFlow,
      0
    );
    const totalInvestingCashFlow = monthlyCashFlows.reduce(
      (sum, m) => sum + m.netInvestingCashFlow,
      0
    );
    const totalFinancingCashFlow = monthlyCashFlows.reduce(
      (sum, m) => sum + m.netFinancingCashFlow,
      0
    );

    // Capital expenditure (negative investing outflows)
    const capitalExpenditure = Math.abs(
      monthlyCashFlows.reduce((sum, m) => sum + Math.min(0, m.netInvestingCashFlow), 0)
    );

    const freeCashFlow = totalOperatingCashFlow - capitalExpenditure;

    const averageMonthlyOperatingCF = totalOperatingCashFlow / monthlyCashFlows.length;
    const averageMonthlyFreeCF = freeCashFlow / monthlyCashFlows.length;

    // Calculate NPV
    const npv = this.calculateNPV(monthlyCashFlows, input.discountRate);

    // Burn rate (for negative cash flow companies)
    const negativeCashFlowMonths = monthlyCashFlows.filter((m) => m.netCashFlow < 0);
    const burnRate =
      negativeCashFlowMonths.length > 0
        ? Math.abs(
            negativeCashFlowMonths.reduce((sum, m) => sum + m.netCashFlow, 0) /
              negativeCashFlowMonths.length
          )
        : 0;

    const runway =
      burnRate > 0 && input.openingCashBalance > 0 ? input.openingCashBalance / burnRate : 0;

    return {
      totalOperatingCashFlow,
      totalInvestingCashFlow,
      totalFinancingCashFlow,
      freeCashFlow,
      averageMonthlyOperatingCF,
      averageMonthlyFreeCF,
      operatingCashFlowRatio: 0, // Would need liabilities data
      cashFlowToDebtRatio: 0, // Would need debt data
      cashFlowMargin: 0, // Would need revenue data
      cashFlowQuality: input.netIncome ? totalOperatingCashFlow / input.netIncome : 0,
      capitalExpenditure,
      maintenanceCapEx: capitalExpenditure * 0.6, // Estimated
      growthCapEx: capitalExpenditure * 0.4, // Estimated
      burnRate,
      runway,
      npv,
    };
  }

  private static calculateNPV(monthlyCashFlows: MonthlyCashFlow[], annualRate: number): number {
    const monthlyRate = annualRate / 12;
    return monthlyCashFlows.reduce((npv, flow, index) => {
      return npv + flow.netCashFlow / Math.pow(1 + monthlyRate, index + 1);
    }, 0);
  }

  private static calculateRatios(metrics: CashFlowMetrics) {
    return {
      operatingCashFlowRatio: metrics.operatingCashFlowRatio,
      cashFlowToDebtRatio: metrics.cashFlowToDebtRatio,
      cashFlowMargin: metrics.cashFlowMargin,
      freeCashFlowYield: 0, // Would need market cap
      cashFlowCoverage: 0, // Would need total debt service
    };
  }

  private static analyzeLiquidity(
    input: CashFlowAnalysisInput,
    monthlyCashFlows: MonthlyCashFlow[]
  ): LiquidityAnalysis {
    const minimumBalance = monthlyCashFlows.reduce(
      (min, m) => Math.min(min, m.closingBalance),
      Infinity
    );
    const violations = monthlyCashFlows.filter(
      (m) => m.closingBalance < input.minimumCashBalance
    ).length;

    const avgMonthlyOutflow =
      monthlyCashFlows.reduce((sum, m) => sum + m.totalOutflows, 0) / monthlyCashFlows.length;
    const monthsOfCoverage =
      avgMonthlyOutflow > 0 ? input.openingCashBalance / avgMonthlyOutflow : Infinity;

    const maxDrawdown = Math.abs(Math.min(0, minimumBalance));

    let currentLiquidity: 'Excellent' | 'Good' | 'Adequate' | 'Poor' | 'Critical';
    if (monthsOfCoverage > 12) currentLiquidity = 'Excellent';
    else if (monthsOfCoverage > 6) currentLiquidity = 'Good';
    else if (monthsOfCoverage > 3) currentLiquidity = 'Adequate';
    else if (monthsOfCoverage > 1) currentLiquidity = 'Poor';
    else currentLiquidity = 'Critical';

    return {
      currentLiquidity,
      monthsOfCoverage,
      minimumBalanceViolations: violations,
      maxDrawdown,
    };
  }

  private static assessRisk(
    monthlyCashFlows: MonthlyCashFlow[],
    liquidity: LiquidityAnalysis
  ): RiskAssessment {
    const cashFlowValues = monthlyCashFlows.map((m) => m.netCashFlow);
    const mean = cashFlowValues.reduce((sum, v) => sum + v, 0) / cashFlowValues.length;
    const variance =
      cashFlowValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / cashFlowValues.length;
    const stdDev = Math.sqrt(variance);

    const coefficientOfVariation = mean !== 0 ? stdDev / Math.abs(mean) : Infinity;

    const liquidityRisk =
      liquidity.currentLiquidity === 'Critical' || liquidity.currentLiquidity === 'Poor'
        ? 'High'
        : liquidity.currentLiquidity === 'Adequate'
          ? 'Medium'
          : 'Low';

    const operatingRisk =
      coefficientOfVariation > 1 ? 'High' : coefficientOfVariation > 0.5 ? 'Medium' : 'Low';

    const riskFactors: string[] = [];
    if (liquidityRisk === 'High') riskFactors.push('Insufficient cash reserves');
    if (operatingRisk === 'High') riskFactors.push('Highly volatile cash flows');
    if (liquidity.minimumBalanceViolations > 0)
      riskFactors.push('Minimum balance violations detected');

    const mitigationStrategies: string[] = [];
    if (liquidityRisk !== 'Low') mitigationStrategies.push('Build cash reserves');
    if (operatingRisk !== 'Low') mitigationStrategies.push('Diversify revenue streams');

    return {
      cashFlowVolatility: stdDev,
      coefficientOfVariation,
      liquidityRisk,
      operatingRisk,
      financingRisk: 'Medium',
      riskFactors,
      mitigationStrategies,
    };
  }

  private static generateInsights(
    metrics: CashFlowMetrics,
    liquidity: LiquidityAnalysis,
    _risk: RiskAssessment
  ): string[] {
    const insights: string[] = [];

    if (metrics.freeCashFlow > 0) {
      insights.push(`Positive free cash flow of $${metrics.freeCashFlow.toLocaleString()}`);
    } else {
      insights.push(
        `Negative free cash flow of $${Math.abs(metrics.freeCashFlow).toLocaleString()} - requires financing`
      );
    }

    if (liquidity.monthsOfCoverage < 3) {
      insights.push(`⚠️ Only ${liquidity.monthsOfCoverage.toFixed(1)} months of cash coverage`);
    } else {
      insights.push(`${liquidity.monthsOfCoverage.toFixed(1)} months of cash coverage available`);
    }

    if (metrics.runway > 0) {
      insights.push(`Current runway: ${metrics.runway.toFixed(1)} months at current burn rate`);
    }

    return insights;
  }

  private static generateWarnings(liquidity: LiquidityAnalysis, risk: RiskAssessment): string[] {
    const warnings: string[] = [];

    if (liquidity.currentLiquidity === 'Critical' || liquidity.currentLiquidity === 'Poor') {
      warnings.push('⚠️ Critical liquidity situation - immediate action required');
    }

    if (liquidity.minimumBalanceViolations > 0) {
      warnings.push(
        `⚠️ Minimum cash balance violated in ${liquidity.minimumBalanceViolations} months`
      );
    }

    if (risk.liquidityRisk === 'High') {
      warnings.push('⚠️ High liquidity risk detected');
    }

    return warnings;
  }

  private static generateRecommendations(
    metrics: CashFlowMetrics,
    liquidity: LiquidityAnalysis
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.freeCashFlow < 0) {
      recommendations.push(
        'Focus on improving operating cash flow or reducing capital expenditures'
      );
    }

    if (liquidity.monthsOfCoverage < 6) {
      recommendations.push('Build cash reserves to at least 6 months of operating expenses');
    }

    if (metrics.burnRate > 0) {
      recommendations.push('Explore cost reduction opportunities to extend runway');
    }

    return recommendations;
  }

  private static assessOverallHealth(
    metrics: CashFlowMetrics,
    liquidity: LiquidityAnalysis,
    _risk: RiskAssessment
  ): 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical' {
    if (metrics.freeCashFlow > 0 && liquidity.currentLiquidity === 'Excellent') return 'Excellent';
    if (metrics.freeCashFlow > 0 && liquidity.currentLiquidity === 'Good') return 'Good';
    if (metrics.freeCashFlow >= 0 || liquidity.currentLiquidity === 'Adequate') return 'Fair';
    if (liquidity.currentLiquidity === 'Poor') return 'Poor';
    return 'Critical';
  }

  private static buildAssumptions(input: CashFlowAnalysisInput): string[] {
    return [
      `Analysis method: ${input.method}`,
      `Analysis period: ${input.analysisPeriodMonths} months`,
      `Discount rate: ${(input.discountRate * 100).toFixed(1)}%`,
      `Minimum cash balance: $${input.minimumCashBalance.toLocaleString()}`,
    ];
  }
}
