/**
 * Financial Ratio Analyzer
 * Comprehensive financial ratio analysis with benchmarking
 */

import type { FinancialRatioAnalyzerInput } from '../schemas/financial-ratio-analyzer.js';

export class FinancialRatioAnalyzer {
  /**
   * Analyze financial ratios
   */
  static analyze(input: FinancialRatioAnalyzerInput): unknown {
    const financialStatements = input.financialStatements;
    const marketData = input.marketData;
    const analysis = input.analysis;

    // Liquidity ratios
    const liquidityRatios = analysis.includeLiquidityRatios
      ? this.calculateLiquidityRatios(financialStatements)
      : undefined;

    // Profitability ratios
    const profitabilityRatios = analysis.includeProfitabilityRatios
      ? this.calculateProfitabilityRatios(financialStatements)
      : undefined;

    // Efficiency ratios
    const efficiencyRatios = analysis.includeEfficiencyRatios
      ? this.calculateEfficiencyRatios(financialStatements)
      : undefined;

    // Leverage ratios
    const leverageRatios = analysis.includeLeverageRatios
      ? this.calculateLeverageRatios(financialStatements)
      : undefined;

    // Market ratios
    const marketRatios = analysis.includeMarketRatios && marketData.sharePrice
      ? this.calculateMarketRatios(financialStatements, marketData)
      : undefined;

    // Benchmarking
    const benchmarking = analysis.includeBenchmarking && marketData.industryAverages
      ? this.performBenchmarking(
          liquidityRatios,
          profitabilityRatios,
          leverageRatios,
          marketData.industryAverages
        )
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      liquidityRatios,
      profitabilityRatios,
      leverageRatios,
      benchmarking
    );

    return {
      summary: {
        currentRatio: liquidityRatios?.currentRatio || 0,
        quickRatio: liquidityRatios?.quickRatio || 0,
        roe: profitabilityRatios?.roe || 0,
        roa: profitabilityRatios?.roa || 0,
        debtToEquity: leverageRatios?.debtToEquity || 0,
      },
      liquidityRatios,
      profitabilityRatios: profitabilityRatios ? {
        ...profitabilityRatios,
        netProfitMargin: profitabilityRatios.netMargin,
      } : undefined,
      efficiencyRatios,
      leverageRatios,
      marketRatios,
      benchmarking,
      recommendations,
    };
  }

  private static calculateLiquidityRatios(
    statements: FinancialRatioAnalyzerInput['financialStatements']
  ): {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
    interpretation: string;
  } {
    const currentRatio = statements.balanceSheet.currentLiabilities > 0
      ? statements.balanceSheet.currentAssets / statements.balanceSheet.currentLiabilities
      : 0;
    const quickRatio = statements.balanceSheet.currentLiabilities > 0
      ? (statements.balanceSheet.currentAssets - statements.balanceSheet.inventory) / statements.balanceSheet.currentLiabilities
      : 0;
    const cashRatio = statements.balanceSheet.currentLiabilities > 0
      ? statements.balanceSheet.cash / statements.balanceSheet.currentLiabilities
      : 0;

    let interpretation = 'Liquidity ratios are healthy';
    if (currentRatio < 1) {
      interpretation = 'Current ratio below 1 - potential liquidity concerns';
    }

    return {
      currentRatio,
      quickRatio,
      cashRatio,
      interpretation,
    };
  }

  private static calculateProfitabilityRatios(
    statements: FinancialRatioAnalyzerInput['financialStatements']
  ): {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    roe: number;
    roa: number;
    roic: number;
  } {
    const grossMargin = statements.incomeStatement.revenue > 0
      ? (statements.incomeStatement.grossProfit / statements.incomeStatement.revenue) * 100
      : 0;
    const operatingMargin = statements.incomeStatement.revenue > 0
      ? (statements.incomeStatement.ebit / statements.incomeStatement.revenue) * 100
      : 0;
    const netMargin = statements.incomeStatement.revenue > 0
      ? (statements.incomeStatement.netIncome / statements.incomeStatement.revenue) * 100
      : 0;
    const roe = statements.balanceSheet.totalEquity > 0
      ? (statements.incomeStatement.netIncome / statements.balanceSheet.totalEquity) * 100
      : 0;
    const roa = statements.balanceSheet.totalAssets > 0
      ? (statements.incomeStatement.netIncome / statements.balanceSheet.totalAssets) * 100
      : 0;
    const roic = (statements.balanceSheet.totalEquity + statements.balanceSheet.longTermDebt) > 0
      ? (statements.incomeStatement.ebit / (statements.balanceSheet.totalEquity + statements.balanceSheet.longTermDebt)) * 100
      : 0;

    return {
      grossMargin,
      operatingMargin,
      netMargin,
      roe,
      roa,
      roic,
    };
  }

  private static calculateEfficiencyRatios(
    statements: FinancialRatioAnalyzerInput['financialStatements']
  ): {
    assetTurnover: number;
    inventoryTurnover: number;
    receivablesTurnover: number;
    payablesTurnover: number;
  } {
    const assetTurnover = statements.balanceSheet.totalAssets > 0
      ? statements.incomeStatement.revenue / statements.balanceSheet.totalAssets
      : 0;
    const inventoryTurnover = statements.balanceSheet.inventory > 0
      ? statements.incomeStatement.costOfGoodsSold / statements.balanceSheet.inventory
      : 0;
    const receivablesTurnover = statements.balanceSheet.accountsReceivable > 0
      ? statements.incomeStatement.revenue / statements.balanceSheet.accountsReceivable
      : 0;
    const payablesTurnover = statements.balanceSheet.accountsPayable > 0
      ? statements.incomeStatement.costOfGoodsSold / statements.balanceSheet.accountsPayable
      : 0;

    return {
      assetTurnover,
      inventoryTurnover,
      receivablesTurnover,
      payablesTurnover,
    };
  }

  private static calculateLeverageRatios(
    statements: FinancialRatioAnalyzerInput['financialStatements']
  ): {
    debtToEquity: number;
    debtToAssets: number;
    equityRatio: number;
    timesInterestEarned: number;
  } {
    const totalDebt = statements.balanceSheet.shortTermDebt + statements.balanceSheet.longTermDebt;
    const debtToEquity = statements.balanceSheet.totalEquity > 0
      ? totalDebt / statements.balanceSheet.totalEquity
      : 0;
    const debtToAssets = statements.balanceSheet.totalAssets > 0
      ? totalDebt / statements.balanceSheet.totalAssets
      : 0;
    const equityRatio = statements.balanceSheet.totalAssets > 0
      ? statements.balanceSheet.totalEquity / statements.balanceSheet.totalAssets
      : 0;
    const timesInterestEarned = statements.incomeStatement.interestExpense > 0
      ? statements.incomeStatement.ebit / statements.incomeStatement.interestExpense
      : 0;

    return {
      debtToEquity,
      debtToAssets,
      equityRatio,
      timesInterestEarned,
    };
  }

  private static calculateMarketRatios(
    statements: FinancialRatioAnalyzerInput['financialStatements'],
    market: NonNullable<FinancialRatioAnalyzerInput['marketData']>
  ): {
    peRatio: number;
    priceToBook: number;
    priceToSales: number;
    evToEbitda: number;
  } {
    if (!market.sharePrice || !market.sharesOutstanding) {
      return {
        peRatio: 0,
        priceToBook: 0,
        priceToSales: 0,
        evToEbitda: 0,
      };
    }

    const marketCap = market.sharePrice * market.sharesOutstanding;
    const earningsPerShare = statements.incomeStatement.netIncome / market.sharesOutstanding;
    const peRatio = earningsPerShare > 0 ? market.sharePrice / earningsPerShare : 0;
    const bookValuePerShare = statements.balanceSheet.totalEquity / market.sharesOutstanding;
    const priceToBook = bookValuePerShare > 0 ? market.sharePrice / bookValuePerShare : 0;
    const revenuePerShare = statements.incomeStatement.revenue / market.sharesOutstanding;
    const priceToSales = revenuePerShare > 0 ? market.sharePrice / revenuePerShare : 0;
    const enterpriseValue = marketCap + statements.balanceSheet.longTermDebt - statements.balanceSheet.cash;
    const evToEbitda = statements.incomeStatement.ebitda > 0 ? enterpriseValue / statements.incomeStatement.ebitda : 0;

    return {
      peRatio,
      priceToBook,
      priceToSales,
      evToEbitda,
    };
  }

  private static performBenchmarking(
    liquidity: { currentRatio: number } | undefined,
    profitability: { roe: number } | undefined,
    leverage: { debtToEquity: number } | undefined,
    industry: NonNullable<FinancialRatioAnalyzerInput['marketData']['industryAverages']>
  ): {
    liquidityComparison: { ratio: number; industry: number; variance: number };
    profitabilityComparison: { ratio: number; industry: number; variance: number };
    leverageComparison: { ratio: number; industry: number; variance: number };
  } {
    const liquidityComparison = {
      ratio: liquidity?.currentRatio || 0,
      industry: industry.currentRatio || 0,
      variance: (liquidity?.currentRatio || 0) - (industry.currentRatio || 0),
    };

    const profitabilityComparison = {
      ratio: profitability?.roe || 0,
      industry: industry.roe || 0,
      variance: (profitability?.roe || 0) - (industry.roe || 0),
    };

    const leverageComparison = {
      ratio: leverage?.debtToEquity || 0,
      industry: industry.debtToEquity || 0,
      variance: (leverage?.debtToEquity || 0) - (industry.debtToEquity || 0),
    };

    return {
      liquidityComparison,
      profitabilityComparison,
      leverageComparison,
    };
  }

  private static generateRecommendations(
    liquidity: { currentRatio: number; interpretation: string } | undefined,
    profitability: { roe: number; roa: number } | undefined,
    leverage: { debtToEquity: number } | undefined,
    benchmarking: { liquidityComparison: { variance: number } } | undefined
  ): string[] {
    const recommendations: string[] = [];

    if (liquidity) {
      recommendations.push(`Current Ratio: ${liquidity.currentRatio.toFixed(2)}`);
      recommendations.push(liquidity.interpretation);
    }

    if (profitability) {
      recommendations.push(`ROE: ${profitability.roe.toFixed(2)}%`);
      recommendations.push(`ROA: ${profitability.roa.toFixed(2)}%`);
    }

    if (leverage && leverage.debtToEquity > 2) {
      recommendations.push('High debt-to-equity ratio - consider reducing debt');
    }

    if (benchmarking && benchmarking.liquidityComparison.variance < -0.5) {
      recommendations.push('Liquidity ratios below industry average - improve working capital management');
    }

    return recommendations;
  }
}



