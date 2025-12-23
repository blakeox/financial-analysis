import { Decimal } from 'decimal.js';
import { z } from 'zod';
import { OptionsPricingInputSchema, type OptionsPricingInput } from '../../schemas/options-pricing.js';
import type { OptionsPricingResult, OptionPricing, OptionGreeks, ScenarioAnalysis, RiskMetrics } from '../../types/options-pricing-result.js';

export class OptionsPricingAnalyzer {
  /**
   * Main analysis method for options pricing
   */
  static analyze(input: z.infer<typeof OptionsPricingInputSchema>): OptionsPricingResult {
    const validated = OptionsPricingInputSchema.parse(input);
    
    const expirationDate = new Date(validated.expirationDate);
    const today = new Date();
    const daysToExpiration = Math.max(1, Math.floor((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const timeToExpiration = daysToExpiration / 365;
    
    // Calculate option pricing
    const pricing = this.calculateOptionPricing(validated, timeToExpiration);
    
    // Calculate Greeks
    const greeks = this.calculateGreeks(validated, timeToExpiration);
    
    // Scenario analysis
    const scenarioAnalysis = this.performScenarioAnalysis(validated, timeToExpiration);
    
    // Risk assessment
    const riskMetrics = this.assessRisk(validated, pricing, greeks);
    
    // Generate insights
    const insights = this.generateInsights(validated, pricing, greeks);
    const recommendation = this.generateRecommendation(pricing, greeks);
    
    return {
      optionType: validated.optionType,
      optionStyle: validated.optionStyle,
      strikePrice: validated.strikePrice,
      currentPrice: validated.currentPrice,
      expirationDate: expirationDate.toISOString(),
      daysToExpiration,
      pricing,
      greeks,
      scenarioAnalysis,
      riskMetrics,
      pricingModel: validated.pricingModel,
      volatility: validated.volatility,
      riskFreeRate: validated.riskFreeRate,
      dividendYield: validated.dividendYield,
      insights,
      recommendation,
      calculationDate: new Date().toISOString(),
      assumptions: this.buildAssumptions(validated),
      warnings: this.generateWarnings(validated, daysToExpiration),
    };
  }

  private static calculateOptionPricing(input: OptionsPricingInput, timeToExpiration: number): OptionPricing {
    // Black-Scholes model
    const S = new Decimal(input.currentPrice);
    const K = new Decimal(input.strikePrice);
    const T = new Decimal(timeToExpiration);
    const r = new Decimal(input.riskFreeRate);
    const sigma = new Decimal(input.volatility);
    const q = new Decimal(input.dividendYield);
    
    // Calculate d1 and d2
    const sqrtT = T.sqrt();
    const d1 = S.div(K).ln()
      .plus(r.minus(q).plus(sigma.pow(2).div(2)).mul(T))
      .div(sigma.mul(sqrtT));
    const d2 = d1.minus(sigma.mul(sqrtT));
    
    // Normal CDF approximation
    const Nd1 = this.normalCDF(d1.toNumber());
    const Nd2 = this.normalCDF(d2.toNumber());
    const Nminusd1 = this.normalCDF(-d1.toNumber());
    const Nminusd2 = this.normalCDF(-d2.toNumber());
    
    let theoreticalValue: number;
    let intrinsicValue: number;
    
    if (input.optionType === 'call') {
      // Call option
      theoreticalValue = S.mul(Math.exp(-q.toNumber() * T.toNumber())).mul(Nd1).toNumber()
                       - K.mul(Math.exp(-r.toNumber() * T.toNumber())).mul(Nd2).toNumber();
      intrinsicValue = Math.max(0, input.currentPrice - input.strikePrice);
    } else {
      // Put option
      theoreticalValue = K.mul(Math.exp(-r.toNumber() * T.toNumber())).mul(Nminusd2).toNumber()
                       - S.mul(Math.exp(-q.toNumber() * T.toNumber())).mul(Nminusd1).toNumber();
      intrinsicValue = Math.max(0, input.strikePrice - input.currentPrice);
    }
    
    const timeValue = theoreticalValue - intrinsicValue;
    
    // Moneyness
    let moneyness: 'ITM' | 'ATM' | 'OTM';
    const priceDiff = input.currentPrice - input.strikePrice;
    if (Math.abs(priceDiff) < input.strikePrice * 0.02) {
      moneyness = 'ATM';
    } else if (input.optionType === 'call') {
      moneyness = priceDiff > 0 ? 'ITM' : 'OTM';
    } else {
      moneyness = priceDiff < 0 ? 'ITM' : 'OTM';
    }
    
    const inMoneyAmount = intrinsicValue;
    
    // Probabilities (simplified)
    const probabilityITM = input.optionType === 'call' ? Nd2 : Nminusd2;
    const breakEvenPrice = input.optionType === 'call' 
      ? input.strikePrice + theoreticalValue
      : input.strikePrice - theoreticalValue;
    
    const probabilityProfit = this.calculateProbabilityProfit(input, breakEvenPrice, timeToExpiration);
    
    const premium = theoreticalValue;
    const totalCost = premium * input.contractSize;
    const maxProfit = input.optionType === 'call' 
      ? Infinity 
      : (input.strikePrice - premium) * input.contractSize;
    const maxLoss = totalCost;
    
    return {
      theoreticalValue,
      intrinsicValue,
      timeValue,
      moneyness,
      inMoneyAmount,
      probabilityITM,
      probabilityProfit,
      breakEvenPrice,
      premium,
      totalCost,
      maxProfit,
      maxLoss,
    };
  }

  private static calculateGreeks(input: OptionsPricingInput, timeToExpiration: number): OptionGreeks {
    const S = input.currentPrice;
    const K = input.strikePrice;
    const T = timeToExpiration;
    const r = input.riskFreeRate;
    const sigma = input.volatility;
    const q = input.dividendYield;
    
    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r - q + sigma * sigma / 2) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;
    
    const Nd1 = this.normalCDF(d1);
    const Nminusd1 = this.normalCDF(-d1);
    const nd1 = this.normalPDF(d1);
    
    // Delta
    const delta = input.optionType === 'call'
      ? Math.exp(-q * T) * Nd1
      : -Math.exp(-q * T) * Nminusd1;
    
    // Gamma
    const gamma = (Math.exp(-q * T) * nd1) / (S * sigma * sqrtT);
    
    // Theta (per day)
    const theta1 = -(S * nd1 * sigma * Math.exp(-q * T)) / (2 * sqrtT);
    const theta2 = input.optionType === 'call'
      ? -r * K * Math.exp(-r * T) * this.normalCDF(d2) + q * S * Math.exp(-q * T) * Nd1
      : r * K * Math.exp(-r * T) * this.normalCDF(-d2) - q * S * Math.exp(-q * T) * Nminusd1;
    const theta = (theta1 + theta2) / 365;
    
    // Vega (per 1% volatility change)
    const vega = (S * Math.exp(-q * T) * nd1 * sqrtT) / 100;
    
    // Rho (per 1% rate change)
    const rho = input.optionType === 'call'
      ? (K * T * Math.exp(-r * T) * this.normalCDF(d2)) / 100
      : -(K * T * Math.exp(-r * T) * this.normalCDF(-d2)) / 100;
    
    // Lambda (leverage)
    const optionPrice = this.calculateOptionPricing(input, T).theoreticalValue;
    const lambda = (delta * S) / optionPrice;
    
    return {
      delta,
      gamma,
      theta,
      vega,
      rho,
      lambda,
    };
  }

  private static performScenarioAnalysis(input: OptionsPricingInput, timeToExpiration: number): ScenarioAnalysis {
    const priceScenarios: Array<{ underlyingPrice: number; optionValue: number; profitLoss: number; percentReturn: number }> = [];
    const premium = this.calculateOptionPricing(input, timeToExpiration).theoreticalValue;
    
    // Price scenarios
    const priceRange = input.priceRange || {
      min: input.currentPrice * 0.7,
      max: input.currentPrice * 1.3,
      step: input.currentPrice * 0.05,
    };
    
    for (let price = priceRange.min; price <= priceRange.max; price += priceRange.step) {
      const testInput = { ...input, currentPrice: price };
      const optionValue = this.calculateOptionPricing(testInput, timeToExpiration).theoreticalValue;
      const profitLoss = (optionValue - premium) * input.contractSize;
      const percentReturn = ((optionValue - premium) / premium) * 100;
      
      priceScenarios.push({
        underlyingPrice: price,
        optionValue,
        profitLoss,
        percentReturn,
      });
    }
    
    // Volatility scenarios
    const volatilityScenarios: Array<{ volatility: number; optionValue: number }> = [];
    for (let vol = input.volatility * 0.5; vol <= input.volatility * 1.5; vol += input.volatility * 0.1) {
      const testInput = { ...input, volatility: vol };
      const optionValue = this.calculateOptionPricing(testInput, timeToExpiration).theoreticalValue;
      volatilityScenarios.push({ volatility: vol, optionValue });
    }
    
    // Time decay scenarios
    const timeDecayScenarios: Array<{ daysToExpiration: number; optionValue: number; theta: number }> = [];
    const maxDays = Math.min(365, Math.ceil(timeToExpiration * 365));
    for (let days = maxDays; days >= 0; days -= Math.max(1, Math.floor(maxDays / 10))) {
      const T = days / 365;
      const optionValue = this.calculateOptionPricing(input, T).theoreticalValue;
      const greeks = this.calculateGreeks(input, T);
      timeDecayScenarios.push({
        daysToExpiration: days,
        optionValue,
        theta: greeks.theta,
      });
    }
    
    return {
      priceScenarios,
      volatilityScenarios,
      timeDecayScenarios,
    };
  }

  private static assessRisk(input: OptionsPricingInput, pricing: OptionPricing, greeks: OptionGreeks): RiskMetrics {
    const leverageRatio = Math.abs(greeks.lambda || 0);
    const probabilityOfLoss = 1 - pricing.probabilityProfit;
    const expectedReturn = pricing.probabilityProfit * pricing.maxProfit - probabilityOfLoss * pricing.maxLoss;
    
    const volatilityRisk = input.volatility > 0.5 ? 'High' : input.volatility > 0.3 ? 'Medium' : 'Low';
    const timeDecayRisk = Math.abs(greeks.theta) > pricing.theoreticalValue * 0.05 ? 'High' :
                          Math.abs(greeks.theta) > pricing.theoreticalValue * 0.02 ? 'Medium' : 'Low';
    
    return {
      leverageRatio,
      probabilityOfLoss,
      expectedReturn,
      volatilityRisk,
      timeDecayRisk,
    };
  }

  private static generateInsights(_input: OptionsPricingInput, pricing: OptionPricing, greeks: OptionGreeks): string[] {
    const insights: string[] = [];
    
    insights.push(`Option is ${pricing.moneyness} (${pricing.inMoneyAmount > 0 ? `$${pricing.inMoneyAmount.toFixed(2)} in the money` : 'out of the money'})`);
    insights.push(`Delta: ${greeks.delta.toFixed(4)} - ${Math.abs(greeks.delta * 100).toFixed(2)}% price sensitivity`);
    insights.push(`Theta: $${greeks.theta.toFixed(2)}/day - time decay impact`);
    insights.push(`Probability of profit: ${(pricing.probabilityProfit * 100).toFixed(1)}%`);
    
    if (Math.abs(greeks.theta) > pricing.theoreticalValue * 0.03) {
      insights.push('⚠️ High time decay - consider shorter holding period');
    }
    
    if (greeks.vega > pricing.theoreticalValue * 0.5) {
      insights.push('High vega - sensitive to volatility changes');
    }
    
    return insights;
  }

  private static generateRecommendation(pricing: OptionPricing, greeks: OptionGreeks): 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' {
    const score = (pricing.probabilityProfit - 0.5) * 2 + greeks.delta * 0.5;
    
    if (score > 0.6) return 'Strong Buy';
    if (score > 0.3) return 'Buy';
    if (score > -0.3) return 'Hold';
    if (score > -0.6) return 'Sell';
    return 'Strong Sell';
  }

  private static buildAssumptions(input: OptionsPricingInput): string[] {
    return [
      `Pricing model: ${input.pricingModel}`,
      `Volatility: ${(input.volatility * 100).toFixed(1)}%`,
      `Risk-free rate: ${(input.riskFreeRate * 100).toFixed(2)}%`,
      `Dividend yield: ${(input.dividendYield * 100).toFixed(2)}%`,
    ];
  }

  private static generateWarnings(input: OptionsPricingInput, daysToExpiration: number): string[] {
    const warnings: string[] = [];
    
    if (daysToExpiration < 7) {
      warnings.push('⚠️ Less than 7 days to expiration - very high time decay risk');
    }
    
    if (input.volatility > 0.8) {
      warnings.push('⚠️ Very high volatility - option prices may be inflated');
    }
    
    return warnings;
  }

  // Helper functions
  private static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }

  private static normalPDF(x: number): number {
    return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  }

  private static calculateProbabilityProfit(input: OptionsPricingInput, breakEven: number, T: number): number {
    const S = input.currentPrice;
    const sigma = input.volatility;
    const r = input.riskFreeRate;
    const q = input.dividendYield;
    
    const d = (Math.log(S / breakEven) + (r - q - sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    
    return input.optionType === 'call' ? this.normalCDF(d) : this.normalCDF(-d);
  }
}
