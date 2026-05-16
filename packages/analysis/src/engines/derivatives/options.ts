import { Decimal } from 'decimal.js';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface Option {
  // Basic Option Information
  type: OptionType;
  style: OptionStyle;
  underlyingPrice: number; // Current price of underlying asset
  strikePrice: number; // Exercise price
  timeToExpiry: number; // Time to expiration in years
  riskFreeRate: number; // Risk-free interest rate
  dividendYield?: number | undefined; // Dividend yield of underlying

  // Volatility Information
  volatility: number; // Implied or historical volatility
  volatilityType: 'implied' | 'historical';

  // Option Characteristics
  contractSize: number; // Number of shares per contract
  premium?: number | undefined; // Current option premium/price

  // Market Context
  symbol?: string | undefined;
  underlying?: string | undefined;
  expirationDate?: string | undefined;
  lastTradePrice?: number | undefined;
  bidPrice?: number | undefined;
  askPrice?: number | undefined;
  volume?: number | undefined;
  openInterest?: number | undefined;
}

export type OptionType = 'call' | 'put';
export type OptionStyle = 'european' | 'american' | 'bermudan';

export interface VolatilitySurface {
  strikes: number[]; // Strike prices
  expiries: number[]; // Time to expiry in years
  volatilities: number[][]; // 2D array: [expiry][strike] = volatility
  underlyingPrice: number;
  riskFreeRate: number;
  asOfDate: string;
}

export interface Greeks {
  delta: number; // Price sensitivity to underlying price
  gamma: number; // Delta sensitivity to underlying price
  theta: number; // Price sensitivity to time decay
  vega: number; // Price sensitivity to volatility
  rho: number; // Price sensitivity to interest rate

  // Second-order Greeks
  vanna: number; // Delta sensitivity to volatility (dDelta/dVol)
  charm: number; // Delta sensitivity to time (dDelta/dTime)
  vomma: number; // Vega sensitivity to volatility (dVega/dVol)
  ultima: number; // Vomma sensitivity to volatility
  speed: number; // Gamma sensitivity to underlying price (dGamma/dS)
  color: number; // Gamma sensitivity to time (dGamma/dTime)
  zomma: number; // Gamma sensitivity to volatility (dGamma/dVol)
}

export interface OptionPricingResult {
  // Core Pricing
  theoreticalPrice: number; // Black-Scholes or other model price
  intrinsicValue: number; // Max(S-K, 0) for calls, Max(K-S, 0) for puts
  timeValue: number; // Theoretical price - intrinsic value

  // Greeks Analysis
  greeks: Greeks;

  // Volatility Analysis
  impliedVolatility?: number | undefined; // If market price provided
  volatilityRank: number; // Current vol vs historical range (0-100)
  volatilityPercentile: number; // Current vol percentile vs historical

  // Risk Metrics
  probabilityOfProfit: number; // Probability of finishing in-the-money
  probabilityITM: number; // Probability of finishing in-the-money at expiry
  probabilityOTM: number; // Probability of finishing out-of-the-money
  probabilityTouch: number; // Probability of touching strike before expiry

  // Breakeven Analysis
  breakevenPoints: number[]; // Breakeven underlying prices
  maxProfit: number | null; // Maximum possible profit (null if unlimited)
  maxLoss: number; // Maximum possible loss

  // Time Decay Analysis
  thetaDecay: Array<{
    daysToExpiry: number;
    theoreticalPrice: number;
    theta: number;
    timeValue: number;
  }>;

  // Moneyness Analysis
  moneyness: {
    spot: number; // S/K ratio
    forward: number; // F/K ratio where F is forward price
    logMoneyness: number; // ln(S/K)
    percentMoneyness: number; // (S-K)/K * 100
  };

  // Model Information
  pricingModel: string; // Model used for pricing
  assumptions: {
    constantVolatility: boolean;
    constantRiskFreeRate: boolean;
    noDividends: boolean;
    europeanExercise: boolean;
  };
}

export interface StrategyPosition {
  option: Option;
  quantity: number; // Positive for long, negative for short
  cost: number; // Net cost/credit for position
}

export interface OptionStrategy {
  name: string;
  description: string;
  positions: StrategyPosition[];

  // Strategy Metrics
  netCost: number; // Total cost/credit
  maxProfit: number | null; // Maximum profit (null if unlimited)
  maxLoss: number | null; // Maximum loss (null if unlimited)
  breakevenPoints: number[];

  // Greeks for entire strategy
  strategyGreeks: Greeks;

  // Payoff Analysis
  payoffDiagram: Array<{
    underlyingPrice: number;
    payoff: number;
    delta: number;
    gamma: number;
    theta: number;
  }>;

  // Risk Analysis
  probabilityOfProfit: number;
  expectedValue: number;
  sharpeRatio: number;
  maximumDrawdown: number;
}

// Input Schemas
export const OptionSchema = z.object({
  type: z.enum(['call', 'put']),
  style: z.enum(['european', 'american', 'bermudan']),
  underlyingPrice: z.number().positive(),
  strikePrice: z.number().positive(),
  timeToExpiry: z.number().positive().max(10), // Max 10 years
  riskFreeRate: z.number().min(0).max(0.5), // Max 50%
  dividendYield: z.number().min(0).max(1).default(0),
  volatility: z.number().min(0.01).max(5), // 1% to 500%
  volatilityType: z.enum(['implied', 'historical']),
  contractSize: z.number().int().positive().default(100),
  premium: z.number().positive().optional(),
  symbol: z.string().optional(),
  underlying: z.string().optional(),
  expirationDate: z.string().optional(),
  lastTradePrice: z.number().positive().optional(),
  bidPrice: z.number().positive().optional(),
  askPrice: z.number().positive().optional(),
  volume: z.number().int().min(0).optional(),
  openInterest: z.number().int().min(0).optional(),
});

export const VolatilitySurfaceSchema = z.object({
  strikes: z.array(z.number().positive()).min(3),
  expiries: z.array(z.number().positive()).min(3),
  volatilities: z.array(z.array(z.number().positive())),
  underlyingPrice: z.number().positive(),
  riskFreeRate: z.number().min(0).max(0.5),
  asOfDate: z.string(),
});

export const OptionAnalysisInputSchema = z.object({
  option: OptionSchema,
  marketData: z
    .object({
      volatilitySurface: VolatilitySurfaceSchema.optional(),
      historicalVolatility: z.number().min(0.01).max(5).optional(),
      dividendSchedule: z
        .array(
          z.object({
            exDate: z.string(),
            amount: z.number().positive(),
          })
        )
        .optional(),
    })
    .optional(),
  analysis: z
    .object({
      includeGreeks: z.boolean().default(true),
      includeImpliedVol: z.boolean().default(true),
      includeMoneyness: z.boolean().default(true),
      includeProbabilities: z.boolean().default(true),
      includeTimeDecay: z.boolean().default(true),
      timeDecayDays: z.array(z.number().int().positive()).default([1, 7, 14, 30, 60, 90]),
      pricingModel: z
        .enum(['black-scholes', 'black-scholes-merton', 'binomial', 'monte-carlo'])
        .default('black-scholes'),
      monteCarloSimulations: z.number().int().min(1000).max(1000000).default(100000),
    })
    .default({
      includeGreeks: true,
      includeImpliedVol: true,
      includeMoneyness: true,
      includeProbabilities: true,
      includeTimeDecay: true,
      timeDecayDays: [1, 7, 14, 30, 60, 90],
      pricingModel: 'black-scholes',
      monteCarloSimulations: 100000,
    }),
});

export type OptionAnalysisInput = z.infer<typeof OptionAnalysisInputSchema>;

// ============================================================================
// OPTIONS PRICING ANALYZER CLASS
// ============================================================================

export class OptionsPricingAnalyzer {
  /**
   * Main options analysis method
   */
  static analyze(input: OptionAnalysisInput): OptionPricingResult {
    const parsed = OptionAnalysisInputSchema.parse(input);
    const { option, marketData, analysis } = parsed;

    // Calculate theoretical price based on selected model
    let theoreticalPrice = 0;
    let pricingModel = analysis.pricingModel;

    switch (analysis.pricingModel) {
      case 'black-scholes':
        theoreticalPrice = this.blackScholesPrice(option);
        break;
      case 'black-scholes-merton':
        theoreticalPrice = this.blackScholesMertonPrice(option);
        break;
      case 'binomial':
        theoreticalPrice = this.binomialPrice(option, 100); // 100 steps
        break;
      case 'monte-carlo':
        theoreticalPrice = this.monteCarloPrice(option, analysis.monteCarloSimulations);
        break;
    }

    // Calculate intrinsic and time value
    const intrinsicValue = this.calculateIntrinsicValue(option);
    const timeValue = Math.max(0, theoreticalPrice - intrinsicValue);

    // Calculate Greeks
    const greeks = analysis.includeGreeks ? this.calculateGreeks(option) : this.getEmptyGreeks();

    // Calculate implied volatility if market price provided
    let impliedVolatility: number | undefined;
    if (analysis.includeImpliedVol && option.premium) {
      impliedVolatility = this.calculateImpliedVolatility(option, option.premium);
    }

    // Calculate volatility rank and percentile
    const { volatilityRank, volatilityPercentile } = this.calculateVolatilityMetrics(
      option.volatility,
      marketData?.historicalVolatility ?? option.volatility
    );

    // Calculate probabilities
    const probabilities = analysis.includeProbabilities
      ? this.calculateProbabilities(option)
      : { probabilityOfProfit: 0, probabilityITM: 0, probabilityOTM: 0, probabilityTouch: 0 };

    // Calculate breakeven analysis
    const { breakevenPoints, maxProfit, maxLoss } = this.calculateBreakevenAnalysis(
      option,
      theoreticalPrice
    );

    // Calculate time decay analysis
    const thetaDecay = analysis.includeTimeDecay
      ? this.calculateTimeDecayAnalysis(option, analysis.timeDecayDays)
      : [];

    // Calculate moneyness metrics
    const moneyness = analysis.includeMoneyness
      ? this.calculateMoneyness(option)
      : { spot: 1, forward: 1, logMoneyness: 0, percentMoneyness: 0 };

    return {
      // Core Pricing
      theoreticalPrice: Number(new Decimal(theoreticalPrice).toDecimalPlaces(4)),
      intrinsicValue: Number(new Decimal(intrinsicValue).toDecimalPlaces(4)),
      timeValue: Number(new Decimal(timeValue).toDecimalPlaces(4)),

      // Greeks
      greeks,

      // Volatility Analysis
      impliedVolatility: impliedVolatility
        ? Number(new Decimal(impliedVolatility).toDecimalPlaces(6))
        : undefined,
      volatilityRank: Number(new Decimal(volatilityRank).toDecimalPlaces(2)),
      volatilityPercentile: Number(new Decimal(volatilityPercentile).toDecimalPlaces(2)),

      // Risk Metrics
      probabilityOfProfit: Number(
        new Decimal(probabilities.probabilityOfProfit).toDecimalPlaces(4)
      ),
      probabilityITM: Number(new Decimal(probabilities.probabilityITM).toDecimalPlaces(4)),
      probabilityOTM: Number(new Decimal(probabilities.probabilityOTM).toDecimalPlaces(4)),
      probabilityTouch: Number(new Decimal(probabilities.probabilityTouch).toDecimalPlaces(4)),

      // Breakeven Analysis
      breakevenPoints: breakevenPoints.map((bp) => Number(new Decimal(bp).toDecimalPlaces(2))),
      maxProfit,
      maxLoss: Number(new Decimal(maxLoss).toDecimalPlaces(2)),

      // Time Decay Analysis
      thetaDecay,

      // Moneyness Analysis
      moneyness: {
        spot: Number(new Decimal(moneyness.spot).toDecimalPlaces(6)),
        forward: Number(new Decimal(moneyness.forward).toDecimalPlaces(6)),
        logMoneyness: Number(new Decimal(moneyness.logMoneyness).toDecimalPlaces(6)),
        percentMoneyness: Number(new Decimal(moneyness.percentMoneyness).toDecimalPlaces(4)),
      },

      // Model Information
      pricingModel,
      assumptions: {
        constantVolatility: true,
        constantRiskFreeRate: true,
        noDividends: (option.dividendYield ?? 0) === 0,
        europeanExercise: option.style === 'european',
      },
    };
  }

  /**
   * Black-Scholes pricing model
   */
  private static blackScholesPrice(option: Option): number {
    const {
      underlyingPrice: S,
      strikePrice: K,
      timeToExpiry: T,
      riskFreeRate: r,
      volatility: vol,
    } = option;

    const d1 = (Math.log(S / K) + (r + 0.5 * vol * vol) * T) / (vol * Math.sqrt(T));
    const d2 = d1 - vol * Math.sqrt(T);

    if (option.type === 'call') {
      return S * this.normalCDF(d1) - K * Math.exp(-r * T) * this.normalCDF(d2);
    } else {
      return K * Math.exp(-r * T) * this.normalCDF(-d2) - S * this.normalCDF(-d1);
    }
  }

  /**
   * Black-Scholes-Merton pricing model (with dividends)
   */
  private static blackScholesMertonPrice(option: Option): number {
    const {
      underlyingPrice: S,
      strikePrice: K,
      timeToExpiry: T,
      riskFreeRate: r,
      volatility: vol,
    } = option;
    const q = option.dividendYield ?? 0; // Dividend yield

    const d1 = (Math.log(S / K) + (r - q + 0.5 * vol * vol) * T) / (vol * Math.sqrt(T));
    const d2 = d1 - vol * Math.sqrt(T);

    if (option.type === 'call') {
      return S * Math.exp(-q * T) * this.normalCDF(d1) - K * Math.exp(-r * T) * this.normalCDF(d2);
    } else {
      return (
        K * Math.exp(-r * T) * this.normalCDF(-d2) - S * Math.exp(-q * T) * this.normalCDF(-d1)
      );
    }
  }

  /**
   * Binomial tree pricing model
   */
  private static binomialPrice(option: Option, steps: number): number {
    const {
      underlyingPrice: S,
      strikePrice: K,
      timeToExpiry: T,
      riskFreeRate: r,
      volatility: vol,
    } = option;
    const q = option.dividendYield ?? 0;

    const dt = T / steps;
    const u = Math.exp(vol * Math.sqrt(dt)); // Up factor
    const d = 1 / u; // Down factor
    const p = (Math.exp((r - q) * dt) - d) / (u - d); // Risk-neutral probability
    const discount = Math.exp(-r * dt);

    // Initialize option values at maturity
    const optionValues = new Array(steps + 1);
    for (let i = 0; i <= steps; i++) {
      const ST = S * Math.pow(u, steps - i) * Math.pow(d, i);
      optionValues[i] = option.type === 'call' ? Math.max(0, ST - K) : Math.max(0, K - ST);
    }

    // Work backwards through the tree
    for (let step = steps - 1; step >= 0; step--) {
      for (let i = 0; i <= step; i++) {
        const exerciseValue =
          option.style === 'american'
            ? this.calculateExerciseValue(
                S * Math.pow(u, step - i) * Math.pow(d, i),
                K,
                option.type
              )
            : 0;

        const holdValue = discount * (p * optionValues[i] + (1 - p) * optionValues[i + 1]);

        optionValues[i] =
          option.style === 'american' ? Math.max(exerciseValue, holdValue) : holdValue;
      }
    }

    return optionValues[0] ?? 0;
  }

  /**
   * Monte Carlo pricing model
   */
  private static monteCarloPrice(option: Option, simulations: number): number {
    const {
      underlyingPrice: S,
      strikePrice: K,
      timeToExpiry: T,
      riskFreeRate: r,
      volatility: vol,
    } = option;
    const q = option.dividendYield ?? 0;

    let payoffSum = 0;
    const drift = (r - q - 0.5 * vol * vol) * T;
    const diffusion = vol * Math.sqrt(T);

    for (let i = 0; i < simulations; i++) {
      // Generate random price path
      const z = this.boxMullerNormal();
      const ST = S * Math.exp(drift + diffusion * z);

      // Calculate payoff
      const payoff = option.type === 'call' ? Math.max(0, ST - K) : Math.max(0, K - ST);

      payoffSum += payoff;
    }

    // Discount back to present value
    const averagePayoff = payoffSum / simulations;
    return averagePayoff * Math.exp(-r * T);
  }

  /**
   * Calculate exercise value for American options
   */
  private static calculateExerciseValue(
    spotPrice: number,
    strikePrice: number,
    optionType: OptionType
  ): number {
    return optionType === 'call'
      ? Math.max(0, spotPrice - strikePrice)
      : Math.max(0, strikePrice - spotPrice);
  }

  /**
   * Calculate intrinsic value
   */
  private static calculateIntrinsicValue(option: Option): number {
    return this.calculateExerciseValue(option.underlyingPrice, option.strikePrice, option.type);
  }

  /**
   * Calculate Greeks using finite differences
   */
  private static calculateGreeks(option: Option): Greeks {
    const basePrice = this.blackScholesMertonPrice(option);

    // First-order Greeks
    const dS = 0.01; // $0.01 change in underlying
    const upPrice = this.blackScholesMertonPrice({
      ...option,
      underlyingPrice: option.underlyingPrice + dS,
    });
    const downPrice = this.blackScholesMertonPrice({
      ...option,
      underlyingPrice: option.underlyingPrice - dS,
    });
    const delta = (upPrice - downPrice) / (2 * dS);

    const dT = 1 / 365; // 1 day change
    const timePrice = this.blackScholesMertonPrice({
      ...option,
      timeToExpiry: Math.max(0.001, option.timeToExpiry - dT),
    });
    const theta = timePrice - basePrice; // Note: negative for time decay

    const dVol = 0.01; // 1% volatility change
    const volUpPrice = this.blackScholesMertonPrice({
      ...option,
      volatility: option.volatility + dVol,
    });
    const volDownPrice = this.blackScholesMertonPrice({
      ...option,
      volatility: option.volatility - dVol,
    });
    const vega = (volUpPrice - volDownPrice) / (2 * dVol);

    const dR = 0.0001; // 1bp interest rate change
    const rateUpPrice = this.blackScholesMertonPrice({
      ...option,
      riskFreeRate: option.riskFreeRate + dR,
    });
    const rateDownPrice = this.blackScholesMertonPrice({
      ...option,
      riskFreeRate: option.riskFreeRate - dR,
    });
    const rho = (rateUpPrice - rateDownPrice) / (2 * dR);

    // Second-order Greeks
    const gamma = (upPrice - 2 * basePrice + downPrice) / (dS * dS);

    // Vanna (dDelta/dVol)
    const deltaUp = this.calculateSingleGreek(option, 'delta', {
      volatility: option.volatility + dVol,
    });
    const deltaDown = this.calculateSingleGreek(option, 'delta', {
      volatility: option.volatility - dVol,
    });
    const vanna = (deltaUp - deltaDown) / (2 * dVol);

    // Charm (dDelta/dTime)
    const deltaTime = this.calculateSingleGreek(option, 'delta', {
      timeToExpiry: Math.max(0.001, option.timeToExpiry - dT),
    });
    const charm = deltaTime - delta; // Change in delta per day

    // Vomma (dVega/dVol)
    const vegaUp = this.calculateSingleGreek(option, 'vega', {
      volatility: option.volatility + dVol,
    });
    const vegaDown = this.calculateSingleGreek(option, 'vega', {
      volatility: option.volatility - dVol,
    });
    const vomma = (vegaUp - vegaDown) / (2 * dVol);

    // Additional second-order Greeks
    const speed = this.calculateSpeed(option);
    const color = this.calculateColor(option);
    const zomma = this.calculateZomma(option);
    const ultima = this.calculateUltima(option);

    return {
      delta: Number(new Decimal(delta).toDecimalPlaces(6)),
      gamma: Number(new Decimal(gamma).toDecimalPlaces(8)),
      theta: Number(new Decimal(theta).toDecimalPlaces(6)),
      vega: Number(new Decimal(vega).toDecimalPlaces(6)),
      rho: Number(new Decimal(rho).toDecimalPlaces(8)),
      vanna: Number(new Decimal(vanna).toDecimalPlaces(8)),
      charm: Number(new Decimal(charm).toDecimalPlaces(8)),
      vomma: Number(new Decimal(vomma).toDecimalPlaces(8)),
      ultima: Number(new Decimal(ultima).toDecimalPlaces(10)),
      speed: Number(new Decimal(speed).toDecimalPlaces(10)),
      color: Number(new Decimal(color).toDecimalPlaces(10)),
      zomma: Number(new Decimal(zomma).toDecimalPlaces(10)),
    };
  }

  /**
   * Calculate single Greek using finite differences
   */
  private static calculateSingleGreek(
    option: Option,
    greek: 'delta' | 'gamma' | 'theta' | 'vega' | 'rho',
    modification: Partial<Option>
  ): number {
    const modifiedOption = { ...option, ...modification };

    switch (greek) {
      case 'delta': {
        const dS = 0.01;
        const upPrice = this.blackScholesMertonPrice({
          ...modifiedOption,
          underlyingPrice: modifiedOption.underlyingPrice + dS,
        });
        const downPrice = this.blackScholesMertonPrice({
          ...modifiedOption,
          underlyingPrice: modifiedOption.underlyingPrice - dS,
        });
        return (upPrice - downPrice) / (2 * dS);
      }
      case 'vega': {
        const dVol = 0.01;
        const upPrice = this.blackScholesMertonPrice({
          ...modifiedOption,
          volatility: modifiedOption.volatility + dVol,
        });
        const downPrice = this.blackScholesMertonPrice({
          ...modifiedOption,
          volatility: modifiedOption.volatility - dVol,
        });
        return (upPrice - downPrice) / (2 * dVol);
      }
      default:
        return 0;
    }
  }

  /**
   * Calculate third-order Greeks
   */
  private static calculateSpeed(option: Option): number {
    const dS = 0.01;
    const upGamma = this.calculateGamma({
      ...option,
      underlyingPrice: option.underlyingPrice + dS,
    });
    const downGamma = this.calculateGamma({
      ...option,
      underlyingPrice: option.underlyingPrice - dS,
    });
    return (upGamma - downGamma) / (2 * dS);
  }

  private static calculateColor(option: Option): number {
    const dT = 1 / 365;
    const timeGamma = this.calculateGamma({
      ...option,
      timeToExpiry: Math.max(0.001, option.timeToExpiry - dT),
    });
    const gamma = this.calculateGamma(option);
    return timeGamma - gamma;
  }

  private static calculateZomma(option: Option): number {
    const dVol = 0.01;
    const upGamma = this.calculateGamma({ ...option, volatility: option.volatility + dVol });
    const downGamma = this.calculateGamma({ ...option, volatility: option.volatility - dVol });
    return (upGamma - downGamma) / (2 * dVol);
  }

  private static calculateUltima(option: Option): number {
    const dVol = 0.01;
    const upVomma = this.calculateVomma({ ...option, volatility: option.volatility + dVol });
    const downVomma = this.calculateVomma({ ...option, volatility: option.volatility - dVol });
    return (upVomma - downVomma) / (2 * dVol);
  }

  private static calculateGamma(option: Option): number {
    const dS = 0.01;
    const upPrice = this.blackScholesMertonPrice({
      ...option,
      underlyingPrice: option.underlyingPrice + dS,
    });
    const basePrice = this.blackScholesMertonPrice(option);
    const downPrice = this.blackScholesMertonPrice({
      ...option,
      underlyingPrice: option.underlyingPrice - dS,
    });
    return (upPrice - 2 * basePrice + downPrice) / (dS * dS);
  }

  private static calculateVomma(option: Option): number {
    const dVol = 0.01;
    const upVega = this.calculateSingleGreek(option, 'vega', {
      volatility: option.volatility + dVol,
    });
    const downVega = this.calculateSingleGreek(option, 'vega', {
      volatility: option.volatility - dVol,
    });
    return (upVega - downVega) / (2 * dVol);
  }

  /**
   * Get empty Greeks object
   */
  private static getEmptyGreeks(): Greeks {
    return {
      delta: 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
      vanna: 0,
      charm: 0,
      vomma: 0,
      ultima: 0,
      speed: 0,
      color: 0,
      zomma: 0,
    };
  }

  /**
   * Calculate implied volatility using Newton-Raphson method
   */
  private static calculateImpliedVolatility(option: Option, marketPrice: number): number {
    let vol = 0.2; // Initial guess: 20% volatility
    const tolerance = 1e-6;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      const optionWithVol = { ...option, volatility: vol };
      const theoreticalPrice = this.blackScholesMertonPrice(optionWithVol);
      const priceDifference = theoreticalPrice - marketPrice;

      if (Math.abs(priceDifference) < tolerance) {
        return vol;
      }

      // Calculate vega for derivative
      const dVol = 0.001;
      const vegaPrice = this.blackScholesMertonPrice({ ...optionWithVol, volatility: vol + dVol });
      const vega = (vegaPrice - theoreticalPrice) / dVol;

      if (Math.abs(vega) < tolerance) {
        break; // Vega too small, avoid division by zero
      }

      vol = vol - priceDifference / vega;
      vol = Math.max(0.001, Math.min(5, vol)); // Keep vol between 0.1% and 500%
    }

    return Math.max(0.001, vol);
  }

  /**
   * Calculate volatility metrics
   */
  private static calculateVolatilityMetrics(
    currentVol: number,
    historicalVol: number
  ): { volatilityRank: number; volatilityPercentile: number } {
    // Simplified calculation - in practice would use historical volatility distribution
    const rank = (currentVol / historicalVol) * 50; // Normalize to 0-100 scale
    const percentile = rank; // Simplified - same as rank for now

    return {
      volatilityRank: Math.min(100, Math.max(0, rank)),
      volatilityPercentile: Math.min(100, Math.max(0, percentile)),
    };
  }

  /**
   * Calculate probability metrics
   */
  private static calculateProbabilities(option: Option): {
    probabilityOfProfit: number;
    probabilityITM: number;
    probabilityOTM: number;
    probabilityTouch: number;
  } {
    const {
      underlyingPrice: S,
      strikePrice: K,
      timeToExpiry: T,
      riskFreeRate: r,
      volatility: vol,
    } = option;
    const q = option.dividendYield ?? 0;

    // Calculate d2 from Black-Scholes
    const d2 = (Math.log(S / K) + (r - q - 0.5 * vol * vol) * T) / (vol * Math.sqrt(T));

    // Probability of finishing in-the-money
    const probabilityITM = option.type === 'call' ? this.normalCDF(d2) : this.normalCDF(-d2);

    const probabilityOTM = 1 - probabilityITM;

    // Probability of profit (simplified - assumes buying the option)
    const breakevenPrice =
      option.type === 'call'
        ? K + this.blackScholesMertonPrice(option)
        : K - this.blackScholesMertonPrice(option);

    const dProfit =
      (Math.log(S / breakevenPrice) + (r - q - 0.5 * vol * vol) * T) / (vol * Math.sqrt(T));
    const probabilityOfProfit =
      option.type === 'call' ? this.normalCDF(dProfit) : this.normalCDF(-dProfit);

    // Probability of touching strike price
    const probabilityTouch =
      2 * this.normalCDF((Math.log(K / S) + 0.5 * vol * vol * T) / (vol * Math.sqrt(T)));

    return {
      probabilityOfProfit: Math.max(0, Math.min(1, probabilityOfProfit)),
      probabilityITM: Math.max(0, Math.min(1, probabilityITM)),
      probabilityOTM: Math.max(0, Math.min(1, probabilityOTM)),
      probabilityTouch: Math.max(0, Math.min(1, probabilityTouch)),
    };
  }

  /**
   * Calculate breakeven analysis
   */
  private static calculateBreakevenAnalysis(
    option: Option,
    premium: number
  ): {
    breakevenPoints: number[];
    maxProfit: number | null;
    maxLoss: number;
  } {
    const { strikePrice: K, type } = option;

    let breakevenPoints: number[] = [];
    let maxProfit: number | null = null;
    let maxLoss: number = premium; // Assuming buying the option

    if (type === 'call') {
      // Call option breakeven: Strike + Premium
      breakevenPoints = [K + premium];
      maxProfit = null; // Unlimited upside
      maxLoss = premium;
    } else {
      // Put option breakeven: Strike - Premium
      breakevenPoints = [Math.max(0, K - premium)];
      maxProfit = K - premium; // Maximum when underlying goes to 0
      maxLoss = premium;
    }

    return { breakevenPoints, maxProfit, maxLoss };
  }

  /**
   * Calculate time decay analysis
   */
  private static calculateTimeDecayAnalysis(
    option: Option,
    days: number[]
  ): Array<{
    daysToExpiry: number;
    theoreticalPrice: number;
    theta: number;
    timeValue: number;
  }> {
    const originalTimeToExpiry = option.timeToExpiry;
    const analysis = [];

    for (const dayCount of days) {
      if (dayCount >= originalTimeToExpiry * 365) continue; // Skip if past expiry

      const timeToExpiry = Math.max(0.001, originalTimeToExpiry - dayCount / 365);
      const modifiedOption = { ...option, timeToExpiry };

      const theoreticalPrice = this.blackScholesMertonPrice(modifiedOption);
      const intrinsicValue = this.calculateIntrinsicValue(modifiedOption);
      const timeValue = Math.max(0, theoreticalPrice - intrinsicValue);

      // Calculate theta
      const nextDayTime = Math.max(0.001, timeToExpiry - 1 / 365);
      const nextDayPrice = this.blackScholesMertonPrice({
        ...modifiedOption,
        timeToExpiry: nextDayTime,
      });
      const theta = nextDayPrice - theoreticalPrice;

      analysis.push({
        daysToExpiry: Math.round(timeToExpiry * 365),
        theoreticalPrice: Number(new Decimal(theoreticalPrice).toDecimalPlaces(4)),
        theta: Number(new Decimal(theta).toDecimalPlaces(6)),
        timeValue: Number(new Decimal(timeValue).toDecimalPlaces(4)),
      });
    }

    return analysis.sort((a, b) => b.daysToExpiry - a.daysToExpiry);
  }

  /**
   * Calculate moneyness metrics
   */
  private static calculateMoneyness(option: Option): {
    spot: number;
    forward: number;
    logMoneyness: number;
    percentMoneyness: number;
  } {
    const { underlyingPrice: S, strikePrice: K, timeToExpiry: T, riskFreeRate: r } = option;
    const q = option.dividendYield ?? 0;

    const spot = S / K;
    const forward = (S * Math.exp((r - q) * T)) / K;
    const logMoneyness = Math.log(spot);
    const percentMoneyness = ((S - K) / K) * 100;

    return { spot, forward, logMoneyness, percentMoneyness };
  }

  /**
   * Normal cumulative distribution function
   */
  private static normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Box-Muller transformation for normal random numbers
   */
  private static boxMullerNormal(): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Analyze option strategy
   */
  static analyzeStrategy(
    positions: StrategyPosition[],
    underlyingPriceRange: { min: number; max: number; steps: number }
  ): OptionStrategy {
    const netCost = positions.reduce((sum, pos) => sum + pos.cost * pos.quantity, 0);

    // Calculate strategy Greeks
    const strategyGreeks = this.calculateStrategyGreeks(positions);

    // Generate payoff diagram
    const payoffDiagram = this.generatePayoffDiagram(positions, underlyingPriceRange);

    // Calculate max profit/loss and breakeven points
    const { maxProfit, maxLoss, breakevenPoints } = this.analyzeStrategyRisk(payoffDiagram);

    // Calculate probability metrics
    const probabilityOfProfit = this.calculateStrategyProbabilityOfProfit(payoffDiagram, positions);
    const expectedValue = this.calculateExpectedValue(payoffDiagram);

    // Risk metrics
    const sharpeRatio = this.calculateSharpeRatio(
      payoffDiagram,
      positions[0]?.option.riskFreeRate ?? 0.05
    );
    const maximumDrawdown = this.calculateMaximumDrawdown(payoffDiagram);

    return {
      name: 'Custom Strategy',
      description: `Strategy with ${positions.length} positions`,
      positions,
      netCost: Number(new Decimal(netCost).toDecimalPlaces(2)),
      maxProfit,
      maxLoss,
      breakevenPoints: breakevenPoints.map((bp) => Number(new Decimal(bp).toDecimalPlaces(2))),
      strategyGreeks,
      payoffDiagram,
      probabilityOfProfit: Number(new Decimal(probabilityOfProfit).toDecimalPlaces(4)),
      expectedValue: Number(new Decimal(expectedValue).toDecimalPlaces(2)),
      sharpeRatio: Number(new Decimal(sharpeRatio).toDecimalPlaces(4)),
      maximumDrawdown: Number(new Decimal(maximumDrawdown).toDecimalPlaces(2)),
    };
  }

  /**
   * Calculate strategy Greeks
   */
  private static calculateStrategyGreeks(positions: StrategyPosition[]): Greeks {
    const totalGreeks = this.getEmptyGreeks();

    for (const position of positions) {
      const optionGreeks = this.calculateGreeks(position.option);

      totalGreeks.delta += optionGreeks.delta * position.quantity;
      totalGreeks.gamma += optionGreeks.gamma * position.quantity;
      totalGreeks.theta += optionGreeks.theta * position.quantity;
      totalGreeks.vega += optionGreeks.vega * position.quantity;
      totalGreeks.rho += optionGreeks.rho * position.quantity;
      totalGreeks.vanna += optionGreeks.vanna * position.quantity;
      totalGreeks.charm += optionGreeks.charm * position.quantity;
      totalGreeks.vomma += optionGreeks.vomma * position.quantity;
      totalGreeks.ultima += optionGreeks.ultima * position.quantity;
      totalGreeks.speed += optionGreeks.speed * position.quantity;
      totalGreeks.color += optionGreeks.color * position.quantity;
      totalGreeks.zomma += optionGreeks.zomma * position.quantity;
    }

    // Round the results
    return {
      delta: Number(new Decimal(totalGreeks.delta).toDecimalPlaces(6)),
      gamma: Number(new Decimal(totalGreeks.gamma).toDecimalPlaces(8)),
      theta: Number(new Decimal(totalGreeks.theta).toDecimalPlaces(6)),
      vega: Number(new Decimal(totalGreeks.vega).toDecimalPlaces(6)),
      rho: Number(new Decimal(totalGreeks.rho).toDecimalPlaces(8)),
      vanna: Number(new Decimal(totalGreeks.vanna).toDecimalPlaces(8)),
      charm: Number(new Decimal(totalGreeks.charm).toDecimalPlaces(8)),
      vomma: Number(new Decimal(totalGreeks.vomma).toDecimalPlaces(8)),
      ultima: Number(new Decimal(totalGreeks.ultima).toDecimalPlaces(10)),
      speed: Number(new Decimal(totalGreeks.speed).toDecimalPlaces(10)),
      color: Number(new Decimal(totalGreeks.color).toDecimalPlaces(10)),
      zomma: Number(new Decimal(totalGreeks.zomma).toDecimalPlaces(10)),
    };
  }

  /**
   * Generate payoff diagram
   */
  private static generatePayoffDiagram(
    positions: StrategyPosition[],
    priceRange: { min: number; max: number; steps: number }
  ) {
    const step = (priceRange.max - priceRange.min) / priceRange.steps;
    const diagram = [];

    for (let i = 0; i <= priceRange.steps; i++) {
      const underlyingPrice = priceRange.min + i * step;
      let totalPayoff = 0;
      let totalDelta = 0;
      let totalGamma = 0;
      let totalTheta = 0;

      for (const position of positions) {
        const modifiedOption = { ...position.option, underlyingPrice };
        const optionValue = this.blackScholesMertonPrice(modifiedOption);

        // P&L calculation
        const positionPL = (optionValue - position.cost) * position.quantity;
        totalPayoff += positionPL;

        // Greeks at this price level
        const greeks = this.calculateGreeks(modifiedOption);
        totalDelta += greeks.delta * position.quantity;
        totalGamma += greeks.gamma * position.quantity;
        totalTheta += greeks.theta * position.quantity;
      }

      diagram.push({
        underlyingPrice: Number(new Decimal(underlyingPrice).toDecimalPlaces(2)),
        payoff: Number(new Decimal(totalPayoff).toDecimalPlaces(2)),
        delta: Number(new Decimal(totalDelta).toDecimalPlaces(6)),
        gamma: Number(new Decimal(totalGamma).toDecimalPlaces(8)),
        theta: Number(new Decimal(totalTheta).toDecimalPlaces(6)),
      });
    }

    return diagram;
  }

  /**
   * Analyze strategy risk metrics
   */
  private static analyzeStrategyRisk(
    payoffDiagram: Array<{ underlyingPrice: number; payoff: number }>
  ) {
    const payoffs = payoffDiagram.map((point) => point.payoff);

    const maxProfit = Math.max(...payoffs);
    const maxLoss = Math.min(...payoffs);

    // Find breakeven points (where payoff crosses zero)
    const breakevenPoints: number[] = [];
    for (let i = 1; i < payoffDiagram.length; i++) {
      const current = payoffDiagram[i]!;
      const previous = payoffDiagram[i - 1]!;

      if (
        (current.payoff >= 0 && previous.payoff < 0) ||
        (current.payoff < 0 && previous.payoff >= 0)
      ) {
        // Interpolate to find exact breakeven point
        const ratio = -previous.payoff / (current.payoff - previous.payoff);
        const breakevenPrice =
          previous.underlyingPrice + ratio * (current.underlyingPrice - previous.underlyingPrice);
        breakevenPoints.push(breakevenPrice);
      }
    }

    return {
      maxProfit: maxProfit === Infinity ? null : maxProfit,
      maxLoss: maxLoss === -Infinity ? null : maxLoss,
      breakevenPoints,
    };
  }

  /**
   * Calculate strategy probability of profit
   */
  private static calculateStrategyProbabilityOfProfit(
    payoffDiagram: Array<{ underlyingPrice: number; payoff: number }>,
    _positions: StrategyPosition[]
  ): number {
    const profitablePoints = payoffDiagram.filter((point) => point.payoff > 0).length;
    const totalPoints = payoffDiagram.length;

    // This is a simplified calculation - in practice would use actual probability distribution
    return totalPoints > 0 ? profitablePoints / totalPoints : 0;
  }

  /**
   * Calculate expected value of strategy
   */
  private static calculateExpectedValue(
    payoffDiagram: Array<{ underlyingPrice: number; payoff: number }>
  ): number {
    // Simplified - assumes uniform distribution of underlying prices
    const totalPayoff = payoffDiagram.reduce((sum, point) => sum + point.payoff, 0);
    return payoffDiagram.length > 0 ? totalPayoff / payoffDiagram.length : 0;
  }

  /**
   * Calculate Sharpe ratio for strategy
   */
  private static calculateSharpeRatio(
    payoffDiagram: Array<{ underlyingPrice: number; payoff: number }>,
    riskFreeRate: number
  ): number {
    const returns = payoffDiagram.map((point) => point.payoff);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;

    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? (avgReturn - riskFreeRate) / stdDev : 0;
  }

  /**
   * Calculate maximum drawdown
   */
  private static calculateMaximumDrawdown(
    payoffDiagram: Array<{ underlyingPrice: number; payoff: number }>
  ): number {
    let maxDrawdown = 0;
    let peak = -Infinity;

    for (const point of payoffDiagram) {
      if (point.payoff > peak) {
        peak = point.payoff;
      } else {
        const drawdown = peak - point.payoff;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }

    return maxDrawdown;
  }
}
