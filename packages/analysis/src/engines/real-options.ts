import { Decimal } from 'decimal.js';
import { z } from 'zod';

export interface RealOptionsInput {
  // Project parameters
  initialInvestment: number;
  expectedCashFlows: number[]; // Annual cash flows
  volatility: number; // Annual volatility of cash flows
  riskFreeRate: number; // Risk-free rate
  timeToMaturity: number; // Time horizon in years

  // Option parameters
  optionType: 'expand' | 'abandon' | 'delay';
  exercisePrice?: number; // Strike price for expand/abandon options
  expansionCost?: number; // Additional investment for expansion
  salvageValue?: number; // Value if abandoned
}

export interface RealOptionsResult {
  // Base project valuation
  npv: number;
  irr: number;
  paybackPeriod: number;

  // Real options valuation
  optionValue: number;
  totalValue: number; // NPV + Option Value
  optionToProjectRatio: number;

  // Option Greeks
  delta: number; // Sensitivity to underlying value
  gamma: number; // Sensitivity of delta
  theta: number; // Time decay
  rho: number; // Sensitivity to interest rate

  // Analysis
  recommendation: string;
  insights: string[];
  risks: string[];
}

export const RealOptionsInputSchema = z.object({
  initialInvestment: z.number().positive('Initial investment must be positive'),
  expectedCashFlows: z.array(z.number()).min(1, 'At least one cash flow required'),
  volatility: z.number().min(0).max(1, 'Volatility must be between 0 and 1'),
  riskFreeRate: z.number().min(0).max(1, 'Risk-free rate must be between 0 and 1'),
  timeToMaturity: z.number().positive('Time to maturity must be positive'),

  optionType: z.enum(['expand', 'abandon', 'delay']),
  exercisePrice: z.number().optional(),
  expansionCost: z.number().optional(),
  salvageValue: z.number().optional(),
});

export type RealOptionsInputValidated = z.infer<typeof RealOptionsInputSchema>;

export class RealOptionsAnalyzer {
  /**
   * Analyze real options value for a project
   */
  static analyze(input: RealOptionsInput): RealOptionsResult {
    const validated = RealOptionsInputSchema.parse(input);

    // Calculate base project NPV
    const npv = this.calculateNPV(validated.initialInvestment, validated.expectedCashFlows, validated.riskFreeRate);
    const irr = this.calculateIRR(validated.initialInvestment, validated.expectedCashFlows);
    const paybackPeriod = this.calculatePaybackPeriod(validated.initialInvestment, validated.expectedCashFlows);

    // Calculate real option value using Black-Scholes framework
    const optionValue = this.calculateRealOptionValue(validated);

    // Calculate option Greeks
    const greeks = this.calculateGreeks(validated);

    // Generate analysis
    const totalValue = npv + optionValue;
    const optionToProjectRatio = npv !== 0 ? optionValue / Math.abs(npv) : 0;

    const recommendation = this.generateRecommendation(npv, optionValue, validated.optionType);
    const insights = this.generateInsights(validated, npv, optionValue);
    const risks = this.generateRisks(validated);

    return {
      npv,
      irr,
      paybackPeriod,
      optionValue,
      totalValue,
      optionToProjectRatio,
      delta: greeks.delta,
      gamma: greeks.gamma,
      theta: greeks.theta,
      rho: greeks.rho,
      recommendation,
      insights,
      risks,
    };
  }

  /**
   * Calculate NPV of cash flows
   */
  private static calculateNPV(initialInvestment: number, cashFlows: number[], discountRate: number): number {
    let npv = new Decimal(-initialInvestment);

    for (let i = 0; i < cashFlows.length; i++) {
      const flow = cashFlows[i];
      if (flow === undefined) continue;
      const discountedFlow = new Decimal(flow).div(
        new Decimal(1).plus(discountRate).pow(i + 1)
      );
      npv = npv.plus(discountedFlow);
    }

    return npv.toNumber();
  }

  /**
   * Calculate IRR using iterative method
   */
  private static calculateIRR(initialInvestment: number, cashFlows: number[]): number {
    // Simple IRR calculation - in practice would use more sophisticated method
    const maxIterations = 100;
    let rate = 0.1; // Starting guess
    const tolerance = 0.0001;

    for (let i = 0; i < maxIterations; i++) {
      let npv = -initialInvestment;
      let dnpv = 0;

      for (let j = 0; j < cashFlows.length; j++) {
        const flow = cashFlows[j];
        if (flow === undefined) continue;
        const discountFactor = Math.pow(1 + rate, j + 1);
        npv += flow / discountFactor;
        dnpv -= (j + 1) * flow / Math.pow(1 + rate, j + 2);
      }

      const newRate = rate - npv / dnpv;

      if (Math.abs(newRate - rate) < tolerance) {
        return newRate;
      }

      rate = newRate;
    }

    return rate; // Return best approximation
  }

  /**
   * Calculate payback period
   */
  private static calculatePaybackPeriod(initialInvestment: number, cashFlows: number[]): number {
    let cumulative = 0;
    let years = 0;

    for (let i = 0; i < cashFlows.length; i++) {
      const flow = cashFlows[i];
      if (flow === undefined) continue;
      cumulative += flow;
      years++;

      if (cumulative >= initialInvestment) {
        // Interpolate for partial year
        const excess = cumulative - initialInvestment;
        const fractionOfLastYearNotNeeded = excess / flow;
        return years - fractionOfLastYearNotNeeded;
      }
    }

    return years; // If payback not achieved
  }

  /**
   * Calculate real option value using Black-Scholes framework
   */
  private static calculateRealOptionValue(input: RealOptionsInputValidated): number {
    const { volatility, riskFreeRate, timeToMaturity, optionType } = input;

    // For real options, we treat the project value as the underlying asset
    const underlyingValue = Math.max(0, this.calculateNPV(input.initialInvestment, input.expectedCashFlows, riskFreeRate));

    let strikePrice = 0;

    switch (optionType) {
      case 'expand':
        strikePrice = input.exercisePrice || input.expansionCost || 0;
        // Call option (right to expand)
        return this.blackScholesCall(underlyingValue, strikePrice, timeToMaturity, riskFreeRate, volatility);

      case 'abandon':
        strikePrice = input.exercisePrice || input.salvageValue || 0;
        // Put option (right to abandon)
        return this.blackScholesPut(underlyingValue, strikePrice, timeToMaturity, riskFreeRate, volatility);

      case 'delay': {
        // Option to delay investment - value is the option to invest later
        const delayedNPV = this.calculateNPV(input.initialInvestment, input.expectedCashFlows.slice(1), riskFreeRate);
        return Math.max(0, delayedNPV - input.initialInvestment);
      }

      default:
        return 0;
    }
  }

  /**
   * Black-Scholes call option pricing
   */
  private static blackScholesCall(S: number, K: number, T: number, r: number, sigma: number): number {
    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const callPrice = S * this.normalCDF(d1) - K * Math.exp(-r * T) * this.normalCDF(d2);
    return Math.max(0, callPrice);
  }

  /**
   * Black-Scholes put option pricing
   */
  private static blackScholesPut(S: number, K: number, T: number, r: number, sigma: number): number {
    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const putPrice = K * Math.exp(-r * T) * this.normalCDF(-d2) - S * this.normalCDF(-d1);
    return Math.max(0, putPrice);
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
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * erf);
  }

  /**
   * Calculate option Greeks
   */
  private static calculateGreeks(input: RealOptionsInputValidated): {
    delta: number;
    gamma: number;
    theta: number;
    rho: number;
  } {
    const { volatility, riskFreeRate, timeToMaturity } = input;
    const underlyingValue = Math.max(0, this.calculateNPV(input.initialInvestment, input.expectedCashFlows, riskFreeRate));
    const strikePrice = input.exercisePrice || input.expansionCost || input.salvageValue || 0;

    if (underlyingValue <= 0 || timeToMaturity <= 0 || strikePrice <= 0) {
      return { delta: 0, gamma: 0, theta: 0, rho: 0 };
    }

    const d1 = (Math.log(underlyingValue / strikePrice) + (riskFreeRate + volatility * volatility / 2) * timeToMaturity) /
               (volatility * Math.sqrt(timeToMaturity));
    const d2 = d1 - volatility * Math.sqrt(timeToMaturity);

    const delta = input.optionType === 'expand' ? this.normalCDF(d1) : -this.normalCDF(-d1);
    const gamma = this.normalPDF(d1) / (underlyingValue * volatility * Math.sqrt(timeToMaturity));
    const theta = input.optionType === 'expand'
      ? -(underlyingValue * this.normalPDF(d1) * volatility) / (2 * Math.sqrt(timeToMaturity)) -
        riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToMaturity) * this.normalCDF(d2)
      : -(underlyingValue * this.normalPDF(d1) * volatility) / (2 * Math.sqrt(timeToMaturity)) +
        riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToMaturity) * this.normalCDF(-d2);
    const rho = input.optionType === 'expand'
      ? strikePrice * timeToMaturity * Math.exp(-riskFreeRate * timeToMaturity) * this.normalCDF(d2)
      : -strikePrice * timeToMaturity * Math.exp(-riskFreeRate * timeToMaturity) * this.normalCDF(-d2);

    return { delta, gamma, theta, rho };
  }

  /**
   * Normal probability density function
   */
  private static normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  /**
   * Generate recommendation
   */
  private static generateRecommendation(npv: number, optionValue: number, optionType: string): string {
    const totalValue = npv + optionValue;

    if (totalValue > 0 && npv >= 0) {
      return `Strong recommendation to proceed. The project has positive value including ${optionType} flexibility worth $${optionValue.toFixed(2)}.`;
    } else if (optionValue > Math.abs(npv)) {
      return `Consider proceeding due to significant ${optionType} value ($${optionValue.toFixed(2)}) that offsets negative NPV.`;
    } else {
      return `Not recommended. Negative total value even with ${optionType} flexibility.`;
    }
  }

  /**
   * Generate insights
   */
  private static generateInsights(input: RealOptionsInputValidated, npv: number, optionValue: number): string[] {
    const insights = [];

    if (optionValue > Math.abs(npv)) {
      insights.push(`Real options value ($${optionValue.toFixed(2)}) exceeds the absolute NPV magnitude, indicating high strategic value.`);
    }

    if (input.volatility > 0.3) {
      insights.push(`High volatility (${(input.volatility * 100).toFixed(1)}%) increases option value significantly.`);
    }

    if (input.timeToMaturity > 5) {
      insights.push(`Long time horizon (${input.timeToMaturity} years) provides substantial option value.`);
    }

    insights.push(`Total project value including real options: $${(npv + optionValue).toFixed(2)}`);

    return insights;
  }

  /**
   * Generate risks
   */
  private static generateRisks(input: RealOptionsInputValidated): string[] {
    const risks = [];

    if (input.volatility < 0.1) {
      risks.push('Low volatility reduces the value of managerial flexibility options.');
    }

    if (input.timeToMaturity < 2) {
      risks.push('Short time horizon limits the strategic value of real options.');
    }

    risks.push('Real options valuation relies on assumptions about future volatility and cash flows.');
    risks.push('Managerial discretion in exercising options may not always be optimal.');

    return risks;
  }
}