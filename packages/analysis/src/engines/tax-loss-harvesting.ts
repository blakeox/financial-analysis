import { Decimal } from 'decimal.js';

import type { TaxLossHarvestingInput } from '../schemas/tax-loss-harvesting.js';

export interface TaxLossHarvestingResult {
  totalTaxLoss: number;
  harvestableLosses: Array<{
    symbol: string;
    lossAmount: number;
    washSaleRisk: boolean;
  }>;
  recommendedActions: string[];
  projectedTaxSavings: number;
  washSalePeriod: number;
  recommendations: string[];
  risks: string[];
}

export class TaxLossHarvestingOptimizer {
  static analyze(input: TaxLossHarvestingInput): TaxLossHarvestingResult {
    let totalTaxLoss = 0;
    const harvestableLosses: Array<{
      symbol: string;
      lossAmount: number;
      washSaleRisk: boolean;
    }> = [];

    // Calculate losses for each holding
    for (const holding of input.portfolio.holdings) {
      const currentValue = new Decimal(holding.shares).times(holding.currentPrice);
      const costBasis = new Decimal(holding.costBasis);
      const loss = costBasis.minus(currentValue).toNumber();

      if (loss > 0) {
        totalTaxLoss += loss;
        harvestableLosses.push({
          symbol: holding.symbol,
          lossAmount: loss,
          washSaleRisk: false, // TODO: Implement wash sale checking when recentTrades data is available
        });
      }
    }

    // Calculate tax savings (assuming long-term capital gains rate)
    const projectedTaxSavings = new Decimal(totalTaxLoss)
      .times(input.taxInfo.federalTaxRate.longTerm)
      .toNumber();

    return {
      totalTaxLoss,
      harvestableLosses,
      recommendedActions: harvestableLosses
        .filter((h) => !h.washSaleRisk)
        .map((h) => `Harvest loss in ${h.symbol}: $${h.lossAmount.toFixed(2)}`),
      projectedTaxSavings,
      washSalePeriod: 30,
      recommendations: [
        'Avoid wash sales by not repurchasing substantially identical securities within 30 days',
        'Consider tax-loss harvesting in down markets to offset gains',
        'Use harvested losses against up to $3,000 of ordinary income annually',
      ],
      risks: [
        'Wash sale rules prohibit claiming losses if repurchasing same or substantially identical securities',
        'Market timing risks when selling at losses',
        'Transaction costs may reduce benefits',
      ],
    };
  }
}
