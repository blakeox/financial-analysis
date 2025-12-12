/**
 * Cryptocurrency Tax Calculator
 * Calculate crypto taxes with multiple cost basis methods
 */

import type { CryptocurrencyTaxInput } from '../schemas/cryptocurrency-tax.js';

export class CryptocurrencyTaxCalculator {
  /**
   * Analyze cryptocurrency tax implications
   */
  static analyze(input: CryptocurrencyTaxInput): unknown {
    const transactions = input.transactions;
    const costBasisMethod = input.costBasisMethod;
    const taxInfo = input.taxInfo;
    const incomeTransactions = input.incomeTransactions;
    const analysis = input.analysis;

    // Calculate realized gains/losses
    const realizedGains = analysis.includeRealizedGains
      ? this.calculateRealizedGains(transactions, costBasisMethod)
      : undefined;

    // Unrealized gains
    const unrealizedGains = analysis.includeUnrealizedGains
      ? this.calculateUnrealizedGains(transactions)
      : undefined;

    // Tax loss harvesting
    const taxLossHarvesting = analysis.includeTaxLossHarvesting
      ? this.analyzeTaxLossHarvesting(realizedGains, taxInfo)
      : undefined;

    // Wash sale analysis
    const washSaleAnalysis = analysis.includeWashSaleAnalysis
      ? this.analyzeWashSales(transactions)
      : undefined;

    // Income transactions
    const incomeTax = this.calculateIncomeTax(incomeTransactions, taxInfo);

    // Total tax liability
    const totalTaxLiability = this.calculateTotalTaxLiability(
      realizedGains,
      incomeTax,
      taxInfo
    );

    // Recommendations
    const recommendations = this.generateRecommendations(
      realizedGains,
      taxLossHarvesting,
      washSaleAnalysis,
      costBasisMethod
    );

    return {
      summary: {
        totalRealizedGains: realizedGains?.totalGains || 0,
        totalRealizedLosses: realizedGains?.totalLosses || 0,
        netCapitalGains: realizedGains?.netGains || 0,
        incomeTax: incomeTax.totalTax,
        totalTaxLiability: totalTaxLiability.totalTax,
      },
      realizedGains,
      unrealizedGains,
      taxLossHarvesting,
      washSaleAnalysis,
      incomeTax,
      totalTaxLiability,
      recommendations,
    };
  }

  private static calculateRealizedGains(
    transactions: CryptocurrencyTaxInput['transactions'],
    method: CryptocurrencyTaxInput['costBasisMethod']
  ): {
    gains: Array<{ transactionId: string | undefined; asset: string; gain: number; costBasis: number; proceeds: number }>;
    totalGains: number;
    totalLosses: number;
    netGains: number;
  } {
    const sellTransactions = transactions.filter((t) => t.transactionType === 'sell' || t.transactionType === 'trade');
    const buyTransactions = transactions.filter((t) => t.transactionType === 'buy').sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const gains = sellTransactions.map((sell) => {
      let costBasis = 0;
      const proceeds = sell.proceeds || sell.totalValue;

      // Calculate cost basis based on method
      switch (method) {
        case 'fifo':
          costBasis = this.calculateFIFOBasis(sell, buyTransactions);
          break;
        case 'lifo':
          costBasis = this.calculateLIFOBasis(sell, buyTransactions);
          break;
        case 'highest-cost':
          costBasis = this.calculateHighestCostBasis(sell, buyTransactions);
          break;
        case 'lowest-cost':
          costBasis = this.calculateLowestCostBasis(sell, buyTransactions);
          break;
        default:
          costBasis = sell.costBasis || sell.pricePerUnit * sell.quantity;
      }

      const gain = proceeds - costBasis;

      return {
        transactionId: sell.transactionId,
        asset: sell.asset,
        gain,
        costBasis,
        proceeds,
      };
    });

    const totalGains = gains.filter((g) => g.gain > 0).reduce((sum, g) => sum + g.gain, 0);
    const totalLosses = Math.abs(gains.filter((g) => g.gain < 0).reduce((sum, g) => sum + g.gain, 0));
    const netGains = totalGains - totalLosses;

    return {
      gains,
      totalGains,
      totalLosses,
      netGains,
    };
  }

  private static calculateFIFOBasis(
    sell: CryptocurrencyTaxInput['transactions'][0],
    buys: CryptocurrencyTaxInput['transactions'][]
  ): number {
    let remainingQuantity = sell.quantity;
    let costBasis = 0;

    for (const buy of buys.filter((b) => b.asset === sell.asset)) {
      if (remainingQuantity <= 0) break;
      const quantityUsed = Math.min(remainingQuantity, buy.quantity);
      costBasis += buy.pricePerUnit * quantityUsed;
      remainingQuantity -= quantityUsed;
    }

    return costBasis;
  }

  private static calculateLIFOBasis(
    sell: CryptocurrencyTaxInput['transactions'][0],
    buys: CryptocurrencyTaxInput['transactions'][]
  ): number {
    let remainingQuantity = sell.quantity;
    let costBasis = 0;
    const relevantBuys = buys.filter((b) => b.asset === sell.asset).reverse();

    for (const buy of relevantBuys) {
      if (remainingQuantity <= 0) break;
      const quantityUsed = Math.min(remainingQuantity, buy.quantity);
      costBasis += buy.pricePerUnit * quantityUsed;
      remainingQuantity -= quantityUsed;
    }

    return costBasis;
  }

  private static calculateHighestCostBasis(
    sell: CryptocurrencyTaxInput['transactions'][0],
    buys: CryptocurrencyTaxInput['transactions'][]
  ): number {
    const relevantBuys = buys.filter((b) => b.asset === sell.asset).sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    let remainingQuantity = sell.quantity;
    let costBasis = 0;

    for (const buy of relevantBuys) {
      if (remainingQuantity <= 0) break;
      const quantityUsed = Math.min(remainingQuantity, buy.quantity);
      costBasis += buy.pricePerUnit * quantityUsed;
      remainingQuantity -= quantityUsed;
    }

    return costBasis;
  }

  private static calculateLowestCostBasis(
    sell: CryptocurrencyTaxInput['transactions'][0],
    buys: CryptocurrencyTaxInput['transactions'][]
  ): number {
    const relevantBuys = buys.filter((b) => b.asset === sell.asset).sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    let remainingQuantity = sell.quantity;
    let costBasis = 0;

    for (const buy of relevantBuys) {
      if (remainingQuantity <= 0) break;
      const quantityUsed = Math.min(remainingQuantity, buy.quantity);
      costBasis += buy.pricePerUnit * quantityUsed;
      remainingQuantity -= quantityUsed;
    }

    return costBasis;
  }

  private static calculateUnrealizedGains(
    transactions: CryptocurrencyTaxInput['transactions']
  ): {
    holdings: Array<{ asset: string; quantity: number; costBasis: number; currentValue: number; unrealizedGain: number }>;
    totalUnrealizedGains: number;
  } {
    const holdings = new Map<string, { quantity: number; costBasis: number }>();

    transactions.forEach((t) => {
      if (t.transactionType === 'buy') {
        const current = holdings.get(t.asset) || { quantity: 0, costBasis: 0 };
        holdings.set(t.asset, {
          quantity: current.quantity + t.quantity,
          costBasis: current.costBasis + t.totalValue,
        });
      } else if (t.transactionType === 'sell' || t.transactionType === 'trade') {
        const current = holdings.get(t.asset) || { quantity: 0, costBasis: 0 };
        const avgCostBasis = current.quantity > 0 ? current.costBasis / current.quantity : 0;
        const quantitySold = t.quantity;
        holdings.set(t.asset, {
          quantity: current.quantity - quantitySold,
          costBasis: current.costBasis - (avgCostBasis * quantitySold),
        });
      }
    });

    const holdingsArray = Array.from(holdings.entries()).map(([asset, holding]) => {
      const latestPrice = transactions
        .filter((t) => t.asset === asset)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.pricePerUnit || 0;
      const currentValue = holding.quantity * latestPrice;
      const unrealizedGain = currentValue - holding.costBasis;

      return {
        asset,
        quantity: holding.quantity,
        costBasis: holding.costBasis,
        currentValue,
        unrealizedGain,
      };
    });

    const totalUnrealizedGains = holdingsArray.reduce((sum, h) => sum + h.unrealizedGain, 0);

    return {
      holdings: holdingsArray,
      totalUnrealizedGains,
    };
  }

  private static analyzeTaxLossHarvesting(
    realized: { totalLosses: number } | undefined,
    taxInfo: CryptocurrencyTaxInput['taxInfo']
  ): {
    harvestableLosses: number;
    taxSavings: number;
    recommendation: string;
  } {
    if (!realized || realized.totalLosses === 0) {
      return {
        harvestableLosses: 0,
        taxSavings: 0,
        recommendation: 'No tax-loss harvesting opportunities',
      };
    }

    const maxHarvest = 3000; // Annual limit
    const harvestableLosses = Math.min(realized.totalLosses, maxHarvest);
    const taxSavings = harvestableLosses * taxInfo.federalTaxRate.shortTerm;

    let recommendation = 'Consider harvesting losses to offset gains';
    if (harvestableLosses >= maxHarvest) {
      recommendation = 'Harvest up to $3,000 annual limit, carry forward excess';
    }

    return {
      harvestableLosses,
      taxSavings,
      recommendation,
    };
  }

  private static analyzeWashSales(
    transactions: CryptocurrencyTaxInput['transactions']
  ): {
    washSaleRisks: Array<{ transactionId: string | undefined; asset: string; risk: string }>;
  } {
    // Simplified wash sale detection - crypto doesn't have traditional wash sale rules but similar assets may
    const washSaleRisks = transactions
      .filter((t) => t.transactionType === 'sell')
      .map((sell) => {
        const buyBack = transactions.find(
          (t) =>
            t.asset === sell.asset &&
            t.transactionType === 'buy' &&
            new Date(t.date).getTime() - new Date(sell.date).getTime() < 30 * 24 * 60 * 60 * 1000
        );

        return {
          transactionId: sell.transactionId,
          asset: sell.asset,
          risk: buyBack ? 'potential-wash-sale' : 'low',
        };
      });

    return {
      washSaleRisks,
    };
  }

  private static calculateIncomeTax(
    income: CryptocurrencyTaxInput['incomeTransactions'],
    taxInfo: CryptocurrencyTaxInput['taxInfo']
  ): {
    miningIncome: number;
    stakingRewards: number;
    defiYield: number;
    totalIncome: number;
    totalTax: number;
  } {
    const totalIncome = income.miningIncome + income.stakingRewards + income.defiYield + income.airdrops + income.forks;
    const totalTax = totalIncome * (taxInfo.federalTaxRate.shortTerm + taxInfo.stateTaxRate);

    return {
      miningIncome: income.miningIncome,
      stakingRewards: income.stakingRewards,
      defiYield: income.defiYield,
      totalIncome,
      totalTax,
    };
  }

  private static calculateTotalTaxLiability(
    realized: { netGains: number } | undefined,
    income: { totalTax: number },
    taxInfo: CryptocurrencyTaxInput['taxInfo']
  ): {
    capitalGainsTax: number;
    incomeTax: number;
    totalTax: number;
  } {
    const netGains = realized?.netGains || 0;
    const capitalGainsTax = netGains > 0 ? netGains * taxInfo.federalTaxRate.longTerm : 0;
    const totalTax = capitalGainsTax + income.totalTax;

    return {
      capitalGainsTax,
      incomeTax: income.totalTax,
      totalTax,
    };
  }

  private static generateRecommendations(
    realized: { netGains: number } | undefined,
    taxLoss: { recommendation: string } | undefined,
    washSale: { washSaleRisks: Array<{ risk: string }> } | undefined,
    method: CryptocurrencyTaxInput['costBasisMethod']
  ): string[] {
    const recommendations: string[] = [];

    if (realized) {
      recommendations.push(`Net capital gains: $${realized.netGains.toFixed(0)}`);
    }

    if (taxLoss) {
      recommendations.push(taxLoss.recommendation);
    }

    if (washSale) {
      const risks = washSale.washSaleRisks.filter((r) => r.risk === 'potential-wash-sale');
      if (risks.length > 0) {
        recommendations.push(`Be aware of potential wash sale rules for ${risks.length} transactions`);
      }
    }

    recommendations.push(`Using ${method.toUpperCase()} cost basis method`);

    return recommendations;
  }
}


