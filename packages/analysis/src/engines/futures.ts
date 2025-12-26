import { z } from 'zod';

export interface FuturesContractInput {
  // Contract specifications
  underlyingAsset: string; // e.g., 'AAPL', 'WTI Crude', 'EURUSD'
  contractSize: number; // Number of units per contract
  currentPrice: number; // Current spot price of underlying
  futuresPrice: number; // Quoted futures price
  timeToExpiration: number; // Time to expiration in years
  riskFreeRate: number; // Risk-free rate
  dividendYield?: number; // For equity futures
  storageCost?: number; // For commodity futures
  convenienceYield?: number; // For commodity futures
}

export interface FuturesPricingResult {
  // Theoretical pricing
  theoreticalPrice: number;
  marketPrice: number;
  priceDifference: number;
  percentageDifference: number;

  // Greeks and sensitivities
  delta: number; // Price sensitivity (always 1 for futures)
  gamma: number; // Always 0 for futures
  theta: number; // Time decay
  rho: number; // Interest rate sensitivity

  // Risk metrics
  basis: number; // Futures price - spot price
  basisRisk: number;

  // Analysis
  isOvervalued: boolean;
  isUndervalued: boolean;
  recommendation: string;
  insights: string[];
}

export const FuturesContractInputSchema = z.object({
  underlyingAsset: z.string().min(1, 'Underlying asset is required'),
  contractSize: z.number().positive('Contract size must be positive'),
  currentPrice: z.number().positive('Current price must be positive'),
  futuresPrice: z.number().positive('Futures price must be positive'),
  timeToExpiration: z.number().positive('Time to expiration must be positive'),
  riskFreeRate: z.number().min(0).max(1, 'Risk-free rate must be between 0 and 1'),
  dividendYield: z.number().min(0).max(1).optional(),
  storageCost: z.number().min(0).optional(),
  convenienceYield: z.number().min(0).optional(),
});

export type FuturesContractInputValidated = z.infer<typeof FuturesContractInputSchema>;

export class FuturesPricingAnalyzer {
  /**
   * Analyze futures contract pricing and valuation
   */
  static analyze(input: FuturesContractInput): FuturesPricingResult {
    const validated = FuturesContractInputSchema.parse(input);

    // Calculate theoretical futures price
    const theoreticalPrice = this.calculateTheoreticalFuturesPrice(validated);

    // Calculate Greeks
    const greeks = this.calculateGreeks(validated);

    // Calculate risk metrics
    const basis = validated.futuresPrice - validated.currentPrice;
    const basisRisk = this.calculateBasisRisk(validated);

    // Analysis
    const priceDifference = validated.futuresPrice - theoreticalPrice;
    const percentageDifference = theoreticalPrice !== 0 ? (priceDifference / theoreticalPrice) * 100 : 0;

    const isOvervalued = priceDifference > 0;
    const isUndervalued = priceDifference < 0;

    const recommendation = this.generateRecommendation(validated, theoreticalPrice);
    const insights = this.generateInsights(validated, theoreticalPrice, basis);

    return {
      theoreticalPrice,
      marketPrice: validated.futuresPrice,
      priceDifference,
      percentageDifference,
      delta: greeks.delta,
      gamma: greeks.gamma,
      theta: greeks.theta,
      rho: greeks.rho,
      basis,
      basisRisk,
      isOvervalued,
      isUndervalued,
      recommendation,
      insights,
    };
  }

  /**
   * Calculate theoretical futures price using cost-of-carry model
   */
  private static calculateTheoreticalFuturesPrice(input: FuturesContractInputValidated): number {
    const { currentPrice, timeToExpiration, riskFreeRate } = input;

    // Base cost-of-carry model: F = S * e^(r * T)
    let theoreticalPrice = currentPrice * Math.exp(riskFreeRate * timeToExpiration);

    // Adjust for dividends (reduces futures price)
    if (input.dividendYield) {
      theoreticalPrice *= Math.exp(-input.dividendYield * timeToExpiration);
    }

    // Adjust for storage costs (increases futures price)
    if (input.storageCost) {
      theoreticalPrice *= Math.exp(input.storageCost * timeToExpiration);
    }

    // Adjust for convenience yield (reduces futures price)
    if (input.convenienceYield) {
      theoreticalPrice *= Math.exp(-input.convenienceYield * timeToExpiration);
    }

    return theoreticalPrice;
  }

  /**
   * Calculate Greeks for futures contract
   */
  private static calculateGreeks(input: FuturesContractInputValidated): {
    delta: number;
    gamma: number;
    theta: number;
    rho: number;
  } {
    // For futures contracts:
    // Delta = 1 (futures move 1:1 with underlying)
    // Gamma = 0 (linear relationship)
    // Theta = -dF/dT (time decay)
    // Rho = dF/dr (interest rate sensitivity)

    const delta = 1;

    const gamma = 0;

    // Theta: approximate time decay
    const theta = -input.currentPrice * input.riskFreeRate * Math.exp(input.riskFreeRate * input.timeToExpiration);

    // Rho: sensitivity to risk-free rate
    const rho = input.currentPrice * input.timeToExpiration * Math.exp(input.riskFreeRate * input.timeToExpiration);

    return { delta, gamma, theta, rho };
  }

  /**
   * Calculate basis risk
   */
  private static calculateBasisRisk(input: FuturesContractInputValidated): number {
    // Basis risk is the risk that the basis will change unfavorably
    // Simplified measure: volatility of the basis
    // In practice, this would use historical data

    // For now, use a simplified proxy based on time to expiration
    // Longer time horizons generally have higher basis risk
    const timeFactor = Math.sqrt(input.timeToExpiration);

    // Assume some base volatility (in practice, use historical basis volatility)
    const baseVolatility = 0.15; // 15% annual volatility proxy

    return input.currentPrice * baseVolatility * timeFactor;
  }

  /**
   * Generate trading recommendation
   */
  private static generateRecommendation(input: FuturesContractInputValidated, theoreticalPrice: number): string {
    const priceDiff = input.futuresPrice - theoreticalPrice;
    const percentDiff = Math.abs(priceDiff / theoreticalPrice) * 100;

    if (percentDiff < 1) {
      return 'Futures price is fairly valued. No strong trading signal.';
    } else if (priceDiff > 0) {
      return `Futures appear overvalued by ${percentDiff.toFixed(2)}%. Consider selling futures or buying spot.`;
    } else {
      return `Futures appear undervalued by ${percentDiff.toFixed(2)}%. Consider buying futures or selling spot.`;
    }
  }

  /**
   * Generate insights about the futures contract
   */
  private static generateInsights(
    input: FuturesContractInputValidated,
    theoreticalPrice: number,
    basis: number
  ): string[] {
    const insights = [];

    if (input.dividendYield && input.dividendYield > 0) {
      insights.push(`Dividend yield of ${(input.dividendYield * 100).toFixed(2)}% reduces futures price relative to spot.`);
    }

    if (input.storageCost && input.storageCost > 0) {
      insights.push(`Storage costs of ${(input.storageCost * 100).toFixed(2)}% increase futures price relative to spot.`);
    }

    if (input.convenienceYield && input.convenienceYield > 0) {
      insights.push(`Convenience yield of ${(input.convenienceYield * 100).toFixed(2)}% reduces futures price due to non-financial benefits.`);
    }

    if (Math.abs(basis) > input.currentPrice * 0.05) {
      insights.push(`Large basis (${(basis / input.currentPrice * 100).toFixed(2)}% of spot price) indicates potential arbitrage opportunity.`);
    }

    if (input.timeToExpiration > 1) {
      insights.push(`Long-dated contract (${input.timeToExpiration.toFixed(1)} years) increases sensitivity to interest rate changes.`);
    }

    insights.push(`Theoretical price: $${theoreticalPrice.toFixed(2)}, Market price: $${input.futuresPrice.toFixed(2)}`);

    return insights;
  }
}

// Forward Contract Pricing (similar to futures but OTC)
export interface ForwardContractInput {
  underlyingAsset: string;
  contractSize: number;
  currentPrice: number;
  forwardPrice: number;
  timeToExpiration: number;
  riskFreeRate: number;
  dividendYield?: number;
  storageCost?: number;
  convenienceYield?: number;
}

export type ForwardPricingResult = FuturesPricingResult;

export const ForwardContractInputSchema = FuturesContractInputSchema.extend({
  forwardPrice: z.number().positive('Forward price must be positive'),
});

export type ForwardContractInputValidated = z.infer<typeof ForwardContractInputSchema>;

export class ForwardPricingAnalyzer {
  /**
   * Analyze forward contract pricing
   */
  static analyze(input: ForwardContractInput): ForwardPricingResult {
    // Forward contracts use the same pricing model as futures
    // but are OTC and may have different liquidity considerations
    const futuresInput: FuturesContractInput = {
      ...input,
      futuresPrice: input.forwardPrice,
    };

    const result = FuturesPricingAnalyzer.analyze(futuresInput);

    // Adjust insights for forward contract context
    const forwardInsights = result.insights.map(insight =>
      insight.replace('Futures', 'Forward').replace('futures', 'forward')
    );

    return {
      ...result,
      insights: [
        'Forward contracts are OTC instruments with potentially higher counterparty risk.',
        ...forwardInsights,
      ],
    };
  }
}