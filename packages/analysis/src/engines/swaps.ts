import { z } from 'zod';

export interface InterestRateSwapInput {
  // Swap specifications
  notionalPrincipal: number; // Principal amount
  swapRate: number; // Fixed swap rate (quoted rate)
  floatingRateBenchmark: string; // e.g., 'LIBOR', 'SOFR', 'EURIBOR'
  currentFloatingRate: number; // Current floating rate
  timeToMaturity: number; // Years to maturity
  paymentFrequency: number; // Payments per year (1, 2, 4, 12)

  // Market data
  spotRates: number[]; // Spot rates for each period [r1, r2, ..., rn]
  discountFactors?: number[]; // Optional pre-calculated discount factors

  // Counterparty information
  payFixed: boolean; // True if paying fixed rate, receiving floating
}

export interface SwapPricingResult {
  // Valuation
  npv: number; // Net present value of the swap
  fixedLegValue: number;
  floatingLegValue: number;

  // Risk metrics
  dv01: number; // Dollar value of 1 basis point change
  duration: number; // Macaulay duration
  convexity: number; // Convexity measure

  // Greeks
  delta: number; // Sensitivity to rate changes
  gamma: number; // Second derivative
  vega: number; // Sensitivity to volatility

  // Cash flows
  fixedCashFlows: number[];
  floatingCashFlows: number[];
  netCashFlows: number[];

  // Analysis
  isFairValue: boolean;
  recommendation: string;
  insights: string[];
  risks: string[];
}

export const InterestRateSwapInputSchema = z.object({
  notionalPrincipal: z.number().positive('Notional principal must be positive'),
  swapRate: z.number().min(0).max(1, 'Swap rate must be between 0 and 1'),
  floatingRateBenchmark: z.string().min(1, 'Benchmark is required'),
  currentFloatingRate: z.number().min(0).max(1, 'Floating rate must be between 0 and 1'),
  timeToMaturity: z.number().positive('Time to maturity must be positive'),
  paymentFrequency: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(12)]).refine((val) => [1, 2, 4, 12].includes(val), {
    message: 'Payment frequency must be 1, 2, 4, or 12'
  }),
  spotRates: z.array(z.number().min(0).max(1)).min(1, 'At least one spot rate required'),
  discountFactors: z.array(z.number().min(0).max(1)).optional(),
  payFixed: z.boolean(),
});

export type InterestRateSwapInputValidated = z.infer<typeof InterestRateSwapInputSchema>;

export class InterestRateSwapAnalyzer {
  /**
   * Analyze interest rate swap pricing and valuation
   */
  static analyze(input: InterestRateSwapInput): SwapPricingResult {
    const validated = InterestRateSwapInputSchema.parse(input);

    // Calculate discount factors if not provided
    const discountFactors = validated.discountFactors ||
      this.calculateDiscountFactors(validated.spotRates, validated.paymentFrequency);

    // Generate cash flows
    const cashFlows = this.generateCashFlows(validated);

    // Calculate NPV
    const npv = this.calculateNPV(cashFlows.netCashFlows, discountFactors);

    // Calculate risk metrics
    const dv01 = this.calculateDV01(validated, discountFactors);
    const duration = this.calculateDuration(validated, discountFactors);
    const convexity = this.calculateConvexity(validated, discountFactors);

    // Calculate Greeks (simplified)
    const delta = this.calculateDelta(validated);
    const gamma = this.calculateGamma(validated);
    const vega = this.calculateVega(validated);

    // Analysis
    const isFairValue = Math.abs(npv) < validated.notionalPrincipal * 0.001; // Within 0.1% of notional
    const recommendation = this.generateRecommendation(npv, validated);
    const insights = this.generateInsights(validated, npv);
    const risks = this.generateRisks(validated);

    return {
      npv,
      fixedLegValue: cashFlows.fixedLegValue,
      floatingLegValue: cashFlows.floatingLegValue,
      dv01,
      duration,
      convexity,
      delta,
      gamma,
      vega,
      fixedCashFlows: cashFlows.fixedCashFlows,
      floatingCashFlows: cashFlows.floatingCashFlows,
      netCashFlows: cashFlows.netCashFlows,
      isFairValue,
      recommendation,
      insights,
      risks,
    };
  }

  /**
   * Calculate discount factors from spot rates
   */
  private static calculateDiscountFactors(spotRates: number[], paymentFrequency: number): number[] {
    const discountFactors: number[] = [];
    const periods = spotRates.length;

    for (let i = 0; i < periods; i++) {
      const time = (i + 1) / paymentFrequency;
      const discountFactor = Math.exp(-spotRates[i]! * time);
      discountFactors.push(discountFactor);
    }

    return discountFactors;
  }

  /**
   * Generate cash flows for both legs of the swap
   */
  private static generateCashFlows(input: InterestRateSwapInputValidated): {
    fixedCashFlows: number[];
    floatingCashFlows: number[];
    netCashFlows: number[];
    fixedLegValue: number;
    floatingLegValue: number;
  } {
    const { notionalPrincipal, swapRate, currentFloatingRate, timeToMaturity, paymentFrequency, payFixed } = input;

    const numPayments = Math.floor(timeToMaturity * paymentFrequency);
    const fixedPayment = notionalPrincipal * swapRate / paymentFrequency;

    const fixedCashFlows: number[] = [];
    const floatingCashFlows: number[] = [];
    const netCashFlows: number[] = [];

    // Generate periodic cash flows
    for (let i = 1; i <= numPayments; i++) {
      // Fixed leg: constant payments
      fixedCashFlows.push(fixedPayment);

      // Floating leg: based on current floating rate (simplified - in practice uses forward rates)
      const floatingPayment = notionalPrincipal * currentFloatingRate / paymentFrequency;
      floatingCashFlows.push(floatingPayment);

      // Net cash flow (from perspective of fixed payer)
      const netFlow = payFixed ? fixedPayment - floatingPayment : floatingPayment - fixedPayment;
      netCashFlows.push(netFlow);
    }

    // Calculate present values (simplified - should use proper discount factors)
    const discountRate = input.spotRates[0] || 0.05; // Use first spot rate as approximation
    let fixedLegValue = 0;
    let floatingLegValue = 0;

    for (let i = 0; i < numPayments; i++) {
      const time = (i + 1) / paymentFrequency;
      const df = Math.exp(-discountRate * time);

      fixedLegValue += fixedCashFlows[i]! * df;
      floatingLegValue += floatingCashFlows[i]! * df;
    }

    return {
      fixedCashFlows,
      floatingCashFlows,
      netCashFlows,
      fixedLegValue,
      floatingLegValue,
    };
  }

  /**
   * Calculate NPV of cash flows
   */
  private static calculateNPV(netCashFlows: number[], discountFactors: number[]): number {
    let npv = 0;

    for (let i = 0; i < Math.min(netCashFlows.length, discountFactors.length); i++) {
      npv += netCashFlows[i]! * discountFactors[i]!;
    }

    return npv;
  }

  /**
   * Calculate DV01 (Dollar Value of 1 basis point)
   */
  private static calculateDV01(input: InterestRateSwapInputValidated, discountFactors: number[]): number {
    // DV01 approximates the change in value for 1bp (0.01%) rate change
    // Simplified calculation - in practice uses duration-based approximation

    const rateShift = 0.0001; // 1 basis point
    const shiftedSpotRates = input.spotRates.map(rate => rate + rateShift);
    const shiftedDiscountFactors = this.calculateDiscountFactors(shiftedSpotRates, input.paymentFrequency);

    const originalValue = this.calculateNPV(
      this.generateCashFlows(input).netCashFlows,
      discountFactors
    );

    const shiftedValue = this.calculateNPV(
      this.generateCashFlows(input).netCashFlows,
      shiftedDiscountFactors
    );

    return shiftedValue - originalValue;
  }

  private static calculateDuration(input: InterestRateSwapInputValidated, discountFactors: number[]): number {
    const cashFlows = this.generateCashFlows(input);
    let weightedSum = 0;
    let totalPV = 0;

    const numPayments = Math.min(cashFlows.netCashFlows.length, discountFactors.length);

    for (let i = 0; i < numPayments; i++) {
      const time = (i + 1) / input.paymentFrequency;
      const pv = cashFlows.netCashFlows[i]! * discountFactors[i]!;

      weightedSum += time * pv;
      totalPV += pv;
    }

    return totalPV !== 0 ? weightedSum / totalPV : 0;
  }

  /**
   * Calculate convexity
   */
  private static calculateConvexity(input: InterestRateSwapInputValidated, discountFactors: number[]): number {
    const cashFlows = this.generateCashFlows(input);
    let convexitySum = 0;
    let totalPV = 0;

    const numPayments = Math.min(cashFlows.netCashFlows.length, discountFactors.length);

    for (let i = 0; i < numPayments; i++) {
      const time = (i + 1) / input.paymentFrequency;
      const pv = cashFlows.netCashFlows[i]! * discountFactors[i]!;

      convexitySum += time * time * pv;
      totalPV += pv;
    }

    return totalPV !== 0 ? convexitySum / totalPV : 0;
  }

  /**
   * Calculate delta (simplified)
   */
  private static calculateDelta(input: InterestRateSwapInputValidated): number {
    // Delta approximates sensitivity to parallel rate shift
    // Simplified: use DV01 scaled by notional
    const dv01 = this.calculateDV01(input, this.calculateDiscountFactors(input.spotRates, input.paymentFrequency));
    return dv01 / (input.notionalPrincipal * 0.0001); // Normalize
  }

  /**
   * Calculate gamma (simplified)
   */
  private static calculateGamma(input: InterestRateSwapInputValidated): number {
    // Gamma measures curvature of delta
    // Simplified approximation
    return -input.timeToMaturity * input.notionalPrincipal * Math.pow(input.spotRates[0] || 0.05, 2);
  }

  /**
   * Calculate vega (simplified)
   */
  private static calculateVega(input: InterestRateSwapInputValidated): number {
    // Vega measures sensitivity to volatility
    // For swaps, this is related to the floating leg
    return input.notionalPrincipal * input.timeToMaturity * 0.01; // Simplified
  }

  /**
   * Generate recommendation
   */
  private static generateRecommendation(npv: number, input: InterestRateSwapInputValidated): string {
    const absNpv = Math.abs(npv);
    const threshold = input.notionalPrincipal * 0.001; // 0.1% of notional

    if (absNpv < threshold) {
      return 'Swap is fairly valued. No significant arbitrage opportunity.';
    } else if (npv > 0) {
      return `Swap is undervalued (NPV: $${npv.toFixed(2)}). Consider entering as ${input.payFixed ? 'fixed payer' : 'fixed receiver'}.`;
    } else {
      return `Swap is overvalued (NPV: $${npv.toFixed(2)}). Consider entering as ${input.payFixed ? 'fixed payer' : 'fixed receiver'}.`;
    }
  }

  /**
   * Generate insights
   */
  private static generateInsights(input: InterestRateSwapInputValidated, npv: number): string[] {
    const insights = [];

    const duration = this.calculateDuration(input, this.calculateDiscountFactors(input.spotRates, input.paymentFrequency));

    insights.push(`Swap duration: ${duration.toFixed(2)} years`);
    insights.push(`Payment frequency: ${input.paymentFrequency} times per year`);
    insights.push(`Notional principal: $${input.notionalPrincipal.toLocaleString()}`);

    if (input.payFixed) {
      insights.push('Position: Paying fixed rate, receiving floating rate');
    } else {
      insights.push('Position: Receiving fixed rate, paying floating rate');
    }

    if (Math.abs(npv) > input.notionalPrincipal * 0.005) {
      insights.push('Significant mispricing detected - potential arbitrage opportunity');
    }

    const dv01 = this.calculateDV01(input, this.calculateDiscountFactors(input.spotRates, input.paymentFrequency));
    insights.push(`DV01: ${dv01.toFixed(2)} ($${Math.abs(dv01).toFixed(0)} per basis point)`);

    return insights;
  }

  /**
   * Generate risks
   */
  private static generateRisks(input: InterestRateSwapInputValidated): string[] {
    const risks = [];

    risks.push('Interest rate risk: Value changes with market rates');
    risks.push('Counterparty risk: Risk that counterparty defaults');
    risks.push('Liquidity risk: May be difficult to unwind position');

    if (input.floatingRateBenchmark.includes('LIBOR')) {
      risks.push('LIBOR transition risk: LIBOR is being phased out');
    }

    if (input.timeToMaturity > 10) {
      risks.push('Long-dated swap increases interest rate sensitivity');
    }

    return risks;
  }
}

// Currency Swap (extends interest rate swap for FX)
export interface CurrencySwapInput extends Omit<InterestRateSwapInput, 'floatingRateBenchmark'> {
  domesticCurrency: string; // e.g., 'USD'
  foreignCurrency: string; // e.g., 'EUR'
  exchangeRate: number; // Current spot FX rate
  domesticRates: number[]; // Domestic currency spot rates
  foreignRates: number[]; // Foreign currency spot rates
  paymentFrequency: 1 | 2 | 4 | 12; // Override to match validated type
}

export interface CurrencySwapResult extends SwapPricingResult {
  fxRisk: number;
  currencyMismatch: boolean;
}

export const CurrencySwapInputSchema = InterestRateSwapInputSchema.omit({
  floatingRateBenchmark: true,
}).extend({
  domesticCurrency: z.string().min(1, 'Domestic currency is required'),
  foreignCurrency: z.string().min(1, 'Foreign currency is required'),
  exchangeRate: z.number().positive('Exchange rate must be positive'),
  domesticRates: z.array(z.number().min(0).max(1)).min(1, 'Domestic rates required'),
  foreignRates: z.array(z.number().min(0).max(1)).min(1, 'Foreign rates required'),
});

export type CurrencySwapInputValidated = z.infer<typeof CurrencySwapInputSchema>;

export class CurrencySwapAnalyzer {
  /**
   * Analyze currency swap
   */
  static analyze(input: CurrencySwapInput): CurrencySwapResult {
    // Convert to interest rate swap format for core analysis
    const irsInput: InterestRateSwapInput = {
      ...input,
      floatingRateBenchmark: 'FX Adjusted',
      spotRates: input.domesticRates, // Use domestic rates as primary
    };

    const baseResult = InterestRateSwapAnalyzer.analyze(irsInput);

    // Additional FX-specific calculations
    const fxRisk = this.calculateFXRisk(input);
    const currencyMismatch = input.domesticCurrency !== input.foreignCurrency;

    return {
      ...baseResult,
      fxRisk,
      currencyMismatch,
      insights: [
        ...baseResult.insights,
        `Exchange rate: ${input.exchangeRate.toFixed(4)} ${input.foreignCurrency}/${input.domesticCurrency}`,
        `FX risk exposure: $${fxRisk.toFixed(2)}`,
      ],
      risks: [
        ...baseResult.risks,
        'Foreign exchange risk: Currency fluctuations affect value',
        'Sovereign risk: Country-specific risks for each currency',
      ],
    };
  }

  /**
   * Calculate FX risk exposure
   */
  private static calculateFXRisk(input: CurrencySwapInputValidated): number {
    // Simplified FX risk as notional * volatility proxy
    const volatilityProxy = 0.1; // 10% annual FX volatility proxy
    return input.notionalPrincipal * volatilityProxy * Math.sqrt(input.timeToMaturity);
  }
}