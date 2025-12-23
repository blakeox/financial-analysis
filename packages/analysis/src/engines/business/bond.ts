import { Decimal } from 'decimal.js';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS  
// ============================================================================

export interface Bond {
  // Basic Bond Information
  faceValue: number; // Par value of the bond
  couponRate: number; // Annual coupon rate (e.g., 0.05 for 5%)
  maturity: number; // Years to maturity
  frequency: number; // Coupon payments per year (1, 2, 4, 12)
  currentPrice?: number | undefined; // Current market price
  
  // Bond Characteristics
  bondType: BondType;
  creditRating?: CreditRating | undefined;
  callableDate?: number | undefined; // Years until callable (if applicable)
  callPrice?: number | undefined; // Call price (if callable)
  puttableDate?: number | undefined; // Years until puttable (if applicable) 
  putPrice?: number | undefined; // Put price (if puttable)
  
  // Market Context
  issuerName?: string | undefined;
  cusip?: string | undefined;
  sector?: BondSector | undefined;
  issueDate?: string | undefined;
  maturityDate?: string | undefined;
}

export type BondType = 
  | 'treasury'
  | 'corporate'
  | 'municipal'
  | 'convertible'
  | 'zero-coupon'
  | 'floating-rate'
  | 'inflation-linked'
  | 'callable'
  | 'puttable'
  | 'step-up'
  | 'perpetual';

export type CreditRating =
  | 'AAA' | 'AA+' | 'AA' | 'AA-'
  | 'A+' | 'A' | 'A-'
  | 'BBB+' | 'BBB' | 'BBB-'
  | 'BB+' | 'BB' | 'BB-'
  | 'B+' | 'B' | 'B-'
  | 'CCC+' | 'CCC' | 'CCC-'
  | 'CC' | 'C' | 'D';

export type BondSector =
  | 'government'
  | 'financial'
  | 'industrial'
  | 'utility'
  | 'technology'
  | 'healthcare'
  | 'energy'
  | 'real-estate'
  | 'consumer'
  | 'telecommunications';

export interface YieldCurve {
  points: Array<{
    maturity: number; // Years
    yield: number; // Yield rate
    price?: number | undefined;
  }>;
  curveType: 'treasury' | 'corporate' | 'municipal';
  asOfDate: string; // ISO date
  interpolationMethod: 'linear' | 'cubic-spline' | 'nelson-siegel';
}

export interface BondPricingResult {
  // Core Pricing Metrics
  price: number; // Clean price
  accruedInterest: number;
  dirtyPrice: number; // Price + accrued interest
  yieldToMaturity: number; // YTM
  yieldToCall?: number | undefined; // YTC (if callable)
  yieldToPut?: number | undefined; // YTP (if puttable)
  yieldToWorst: number; // Minimum of YTM, YTC, YTP
  
  // Duration and Convexity Analysis  
  macaulayDuration: number;
  modifiedDuration: number;
  effectiveDuration: number; // For bonds with embedded options
  dollarDuration: number; // Price change per 1bp yield change
  convexity: number;
  effectiveConvexity: number; // For bonds with embedded options
  
  // Risk Metrics
  creditSpread: number; // Spread over risk-free rate
  optionAdjustedSpread?: number | undefined; // OAS (if applicable)
  zSpread: number; // Zero-volatility spread
  durationTimesSpread: number; // DTS risk measure
  
  // Sensitivity Analysis
  priceValue01: number; // PV01 - price change for 1bp yield change
  basisPointValue: number; // BPV
  convexityAdjustment: number; // Second-order price approximation
  
  // Advanced Metrics
  currentYield: number; // Annual coupon / current price
  nominalSpread: number; // Spread over comparable Treasury
  gSpread: number; // Spread over interpolated Treasury curve
  iSpread: number; // Interpolated spread
  
  // Cash Flow Analysis
  cashFlows: Array<{
    date: string;
    period: number;
    couponPayment: number;
    principalPayment: number;
    totalPayment: number;
    presentValue: number;
    discountFactor: number;
  }>;
  
  // Option Analysis (if applicable)
  optionValue?: number | undefined; // Value of embedded option
  straightBondPrice?: number | undefined; // Price without embedded option
  optionCost?: number | undefined; // Cost of embedded option
}

export interface BondPortfolioAnalysis {
  bonds: Array<{
    bond: Bond;
    weight: number; // Portfolio weight
    marketValue: number;
    pricing: BondPricingResult;
    contribution: {
      duration: number; // Contribution to portfolio duration
      yield: number; // Contribution to portfolio yield
      convexity: number; // Contribution to portfolio convexity
    };
  }>;
  
  // Portfolio-Level Metrics
  totalValue: number;
  averagePrice: number;
  weightedAverageYield: number;
  portfolioDuration: number; // Value-weighted duration
  portfolioConvexity: number; // Value-weighted convexity
  averageMaturity: number;
  averageCoupon: number;
  averageCreditRating: string;
  
  // Risk Analysis
  interestRateRisk: {
    dv01: number; // Dollar value of 1 basis point
    duration: number;
    convexity: number;
    keyRateDurations: Array<{ // Key rate durations for yield curve risk
      maturity: number;
      duration: number;
    }>;
  };
  
  creditRisk: {
    averageSpread: number;
    spreadDuration: number;
    creditExposure: Record<CreditRating, number>; // Exposure by rating
    sectorExposure: Record<BondSector, number>; // Exposure by sector
  };
  
  // Scenario Analysis
  scenarios: Array<{
    name: string;
    description: string;
    yieldChange: number; // Change in yield curve
    spreadChange?: number | undefined; // Change in credit spreads
    portfolioValue: number;
    valueChange: number;
    percentChange: number;
  }>;
}

// Input Schemas
export const BondSchema = z.object({
  faceValue: z.number().positive(),
  couponRate: z.number().min(0).max(1),
  maturity: z.number().positive(),
  frequency: z.number().int().positive().refine(val => [1, 2, 4, 12].includes(val), {
    message: "Frequency must be 1, 2, 4, or 12"
  }),
  currentPrice: z.number().positive().optional(),
  bondType: z.enum([
    'treasury', 'corporate', 'municipal', 'convertible', 'zero-coupon',
    'floating-rate', 'inflation-linked', 'callable', 'puttable', 'step-up', 'perpetual'
  ]),
  creditRating: z.enum([
    'AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-',
    'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-',
    'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D'
  ]).optional(),
  callableDate: z.number().positive().optional(),
  callPrice: z.number().positive().optional(),
  puttableDate: z.number().positive().optional(),
  putPrice: z.number().positive().optional(),
  issuerName: z.string().optional(),
  cusip: z.string().optional(),
  sector: z.enum([
    'government', 'financial', 'industrial', 'utility', 'technology',
    'healthcare', 'energy', 'real-estate', 'consumer', 'telecommunications'
  ]).optional(),
  issueDate: z.string().optional(),
  maturityDate: z.string().optional(),
});

export const YieldCurveSchema = z.object({
  points: z.array(z.object({
    maturity: z.number().positive(),
    yield: z.number().min(0).max(1),
    price: z.number().positive().optional(),
  })).min(2),
  curveType: z.enum(['treasury', 'corporate', 'municipal']),
  asOfDate: z.string(),
  interpolationMethod: z.enum(['linear', 'cubic-spline', 'nelson-siegel']),
});

export const BondAnalysisInputSchema = z.object({
  bond: BondSchema,
  marketData: z.object({
    yieldCurve: YieldCurveSchema,
    volatility: z.number().min(0).max(1).default(0.15), // Interest rate volatility
    creditSpread: z.number().min(0).max(0.5).default(0), // Credit spread over risk-free
    recoveryRate: z.number().min(0).max(1).default(0.4), // Recovery rate for credit risk
  }),
  analysis: z.object({
    includeOptionAnalysis: z.boolean().default(true),
    includeRiskMetrics: z.boolean().default(true),
    includeSensitivityAnalysis: z.boolean().default(true),
    scenarioShifts: z.array(z.number()).default([-200, -100, -50, 0, 50, 100, 200]), // bp shifts
    keyRateMaturities: z.array(z.number()).default([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30]),
  }).default({
    includeOptionAnalysis: true,
    includeRiskMetrics: true,
    includeSensitivityAnalysis: true,
    scenarioShifts: [-200, -100, -50, 0, 50, 100, 200],
    keyRateMaturities: [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30],
  }),
});

export type BondAnalysisInput = z.infer<typeof BondAnalysisInputSchema>;

// ============================================================================
// BOND ANALYZER CLASS
// ============================================================================

export class BondAnalyzer {

  /**
   * Main bond analysis method
   */
  static analyze(input: BondAnalysisInput): BondPricingResult {
    const parsed = BondAnalysisInputSchema.parse(input);
    const { bond, marketData, analysis } = parsed;

    // Calculate current price if not provided
    const marketYield = this.getMarketYieldForBond(bond, marketData.yieldCurve, marketData.creditSpread);
    const price = bond.currentPrice ?? this.calculateBondPrice(bond, marketYield);
    
    // Calculate accrued interest
    const accruedInterest = this.calculateAccruedInterest(bond);
    const dirtyPrice = price + accruedInterest;
    
    // Calculate yield metrics
    const yieldToMaturity = bond.currentPrice ? this.calculateYTM(bond, bond.currentPrice) : marketYield;
    const yieldToCall = bond.callableDate && bond.callPrice 
      ? this.calculateYTC(bond, price, bond.callableDate, bond.callPrice)
      : undefined;
    const yieldToPut = bond.puttableDate && bond.putPrice
      ? this.calculateYTP(bond, price, bond.puttableDate, bond.putPrice)
      : undefined;
    
    const yieldToWorst = this.calculateYieldToWorst(yieldToMaturity, yieldToCall, yieldToPut);
    
    // Calculate duration and convexity
    const macaulayDuration = this.calculateMacaulayDuration(bond, yieldToMaturity);
    const modifiedDuration = macaulayDuration / (1 + yieldToMaturity / bond.frequency);
    const effectiveDuration = this.calculateEffectiveDuration(bond, yieldToMaturity, marketData.volatility);
    const dollarDuration = modifiedDuration * price / 100;
    
    const convexity = this.calculateConvexity(bond, yieldToMaturity);
    const effectiveConvexity = this.calculateEffectiveConvexity(bond, yieldToMaturity, marketData.volatility);
    
    // Calculate spreads and risk metrics
    const treasuryYield = this.interpolateYield(marketData.yieldCurve, bond.maturity);
    const creditSpread = yieldToMaturity - treasuryYield;
    const zSpread = this.calculateZSpread(bond, marketData.yieldCurve, price);
    const nominalSpread = yieldToMaturity - treasuryYield;
    const gSpread = this.calculateGSpread(bond, marketData.yieldCurve, yieldToMaturity);
    const iSpread = this.calculateISpread(bond, marketData.yieldCurve, yieldToMaturity);
    
    // Calculate sensitivity metrics
    const priceValue01 = modifiedDuration * price / 10000; // PV01
    const basisPointValue = priceValue01;
    const convexityAdjustment = 0.5 * convexity * Math.pow(0.0001, 2) * price; // Second-order term
    
    // Calculate additional yield metrics
    const currentYield = (bond.couponRate * bond.faceValue) / price;
    const durationTimesSpread = modifiedDuration * creditSpread * 10000; // DTS in bp
    
    // Generate cash flows
    const cashFlows = this.generateCashFlows(bond, yieldToMaturity);
    
    // Option analysis (if applicable)
    let optionValue: number | undefined;
    let straightBondPrice: number | undefined;
    let optionCost: number | undefined;
    let optionAdjustedSpread: number | undefined;
    
    if (analysis.includeOptionAnalysis && (bond.bondType === 'callable' || bond.bondType === 'puttable')) {
      const optionAnalysis = this.analyzeEmbeddedOptions(bond, marketData, yieldToMaturity);
      optionValue = optionAnalysis.optionValue;
      straightBondPrice = optionAnalysis.straightBondPrice;
      optionCost = optionAnalysis.optionCost;
      optionAdjustedSpread = optionAnalysis.oas;
    }
    
    return {
      // Core Pricing Metrics
      price: Number(new Decimal(price).toDecimalPlaces(4)),
      accruedInterest: Number(new Decimal(accruedInterest).toDecimalPlaces(4)),
      dirtyPrice: Number(new Decimal(dirtyPrice).toDecimalPlaces(4)),
      yieldToMaturity: Number(new Decimal(yieldToMaturity).toDecimalPlaces(6)),
      yieldToCall,
      yieldToPut,
      yieldToWorst: Number(new Decimal(yieldToWorst).toDecimalPlaces(6)),
      
      // Duration and Convexity
      macaulayDuration: Number(new Decimal(macaulayDuration).toDecimalPlaces(4)),
      modifiedDuration: Number(new Decimal(modifiedDuration).toDecimalPlaces(4)),
      effectiveDuration: Number(new Decimal(effectiveDuration).toDecimalPlaces(4)),
      dollarDuration: Number(new Decimal(dollarDuration).toDecimalPlaces(4)),
      convexity: Number(new Decimal(convexity).toDecimalPlaces(4)),
      effectiveConvexity: Number(new Decimal(effectiveConvexity).toDecimalPlaces(4)),
      
      // Risk Metrics
      creditSpread: Number(new Decimal(creditSpread).toDecimalPlaces(6)),
      optionAdjustedSpread,
      zSpread: Number(new Decimal(zSpread).toDecimalPlaces(6)),
      durationTimesSpread: Number(new Decimal(durationTimesSpread).toDecimalPlaces(2)),
      
      // Sensitivity Analysis
      priceValue01: Number(new Decimal(priceValue01).toDecimalPlaces(6)),
      basisPointValue: Number(new Decimal(basisPointValue).toDecimalPlaces(6)),
      convexityAdjustment: Number(new Decimal(convexityAdjustment).toDecimalPlaces(6)),
      
      // Additional Metrics
      currentYield: Number(new Decimal(currentYield).toDecimalPlaces(6)),
      nominalSpread: Number(new Decimal(nominalSpread).toDecimalPlaces(6)),
      gSpread: Number(new Decimal(gSpread).toDecimalPlaces(6)),
      iSpread: Number(new Decimal(iSpread).toDecimalPlaces(6)),
      
      // Cash Flow Analysis
      cashFlows,
      
      // Option Analysis
      optionValue,
      straightBondPrice,
      optionCost,
    };
  }

  /**
   * Get market yield for bond based on yield curve and credit spread
   */
  private static getMarketYieldForBond(
    bond: Bond,
    yieldCurve: YieldCurve,
    creditSpread: number
  ): number {
    const baseYield = this.interpolateYield(yieldCurve, bond.maturity);
    return baseYield + creditSpread + this.getCreditSpreadAdjustment(bond.creditRating);
  }

  /**
   * Calculate credit spread adjustment based on rating
   */
  private static getCreditSpreadAdjustment(rating?: CreditRating): number {
    if (!rating) return 0;
    
    const spreads: Record<CreditRating, number> = {
      'AAA': 0.0005, 'AA+': 0.001, 'AA': 0.0015, 'AA-': 0.002,
      'A+': 0.0025, 'A': 0.003, 'A-': 0.004,
      'BBB+': 0.006, 'BBB': 0.008, 'BBB-': 0.012,
      'BB+': 0.02, 'BB': 0.03, 'BB-': 0.045,
      'B+': 0.07, 'B': 0.1, 'B-': 0.15,
      'CCC+': 0.25, 'CCC': 0.4, 'CCC-': 0.6,
      'CC': 0.8, 'C': 1.0, 'D': 1.5,
    };
    
    return spreads[rating] ?? 0;
  }

  /**
   * Interpolate yield from yield curve
   */
  private static interpolateYield(curve: YieldCurve, maturity: number): number {
    const sortedPoints = [...curve.points].sort((a, b) => a.maturity - b.maturity);
    
    // If exact match, return it
    const exact = sortedPoints.find(p => Math.abs(p.maturity - maturity) < 0.001);
    if (exact) return exact.yield;
    
    // If outside range, extrapolate
    if (maturity <= sortedPoints[0]!.maturity) {
      return sortedPoints[0]!.yield;
    }
    if (maturity >= sortedPoints[sortedPoints.length - 1]!.maturity) {
      return sortedPoints[sortedPoints.length - 1]!.yield;
    }
    
    // Interpolate between two points
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i]!;
      const p2 = sortedPoints[i + 1]!;
      
      if (maturity >= p1.maturity && maturity <= p2.maturity) {
        const weight = (maturity - p1.maturity) / (p2.maturity - p1.maturity);
        return p1.yield + weight * (p2.yield - p1.yield);
      }
    }
    
    return curve.points[0]?.yield ?? 0;
  }

  /**
   * Calculate bond price given yield
   */
  private static calculateBondPrice(bond: Bond, yieldRate: number): number {
    if (bond.bondType === 'zero-coupon') {
      return (bond.faceValue / Math.pow(1 + yieldRate, bond.maturity)) * 100 / bond.faceValue;
    }
    
    const periodsPerYear = bond.frequency;
    const totalPeriods = bond.maturity * periodsPerYear;
    const couponPayment = (bond.couponRate / periodsPerYear) * bond.faceValue;
    const periodYield = yieldRate / periodsPerYear;
    
    let presentValue = 0;
    
    // Present value of coupon payments
    for (let i = 1; i <= totalPeriods; i++) {
      presentValue += couponPayment / Math.pow(1 + periodYield, i);
    }
    
    // Present value of principal
    presentValue += bond.faceValue / Math.pow(1 + periodYield, totalPeriods);
    
    return (presentValue / bond.faceValue) * 100;
  }

  /**
   * Calculate accrued interest
   */
  private static calculateAccruedInterest(bond: Bond): number {
    // Simplified calculation assuming we're at the beginning of a coupon period
    // In practice, this would require actual settlement date and last coupon date
    const daysSinceLastCoupon = 0; // Placeholder
    const daysInCouponPeriod = 365 / bond.frequency;
    const couponPayment = (bond.couponRate / bond.frequency) * bond.faceValue;
    
    return (daysSinceLastCoupon / daysInCouponPeriod) * couponPayment;
  }

  /**
   * Calculate yield to maturity using Newton-Raphson method
   */
  private static calculateYTM(bond: Bond, price: number): number {
    let ytm = 0.05; // Initial guess
    const tolerance = 1e-8;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      const calculatedPrice = this.calculateBondPrice(bond, ytm);
      const priceDifference = calculatedPrice - price;
      
      if (Math.abs(priceDifference) < tolerance) {
        return ytm;
      }
      
      // Calculate derivative (modified duration * price)
      const duration = this.calculateMacaulayDuration(bond, ytm) / (1 + ytm / bond.frequency);
      const priceDerivative = -duration * calculatedPrice / 100;
      
      if (Math.abs(priceDerivative) < tolerance) {
        break;
      }
      
      ytm = ytm - priceDifference / priceDerivative;
    }
    
    return Math.max(0, ytm);
  }

  /**
   * Calculate yield to call
   */
  private static calculateYTC(bond: Bond, price: number, callDate: number, callPrice: number): number {
    const modifiedBond = { ...bond, maturity: callDate, faceValue: callPrice };
    return this.calculateYTM(modifiedBond, price);
  }

  /**
   * Calculate yield to put
   */
  private static calculateYTP(bond: Bond, price: number, putDate: number, putPrice: number): number {
    const modifiedBond = { ...bond, maturity: putDate, faceValue: putPrice };
    return this.calculateYTM(modifiedBond, price);
  }

  /**
   * Calculate yield to worst
   */
  private static calculateYieldToWorst(
    ytm: number,
    ytc?: number | undefined,
    ytp?: number | undefined
  ): number {
    const yields = [ytm];
    if (ytc !== undefined) yields.push(ytc);
    if (ytp !== undefined) yields.push(ytp);
    return Math.min(...yields);
  }

  /**
   * Calculate Macaulay Duration
   */
  private static calculateMacaulayDuration(bond: Bond, yieldRate: number): number {
    if (bond.bondType === 'zero-coupon') {
      return bond.maturity;
    }
    
    const periodsPerYear = bond.frequency;
    const totalPeriods = bond.maturity * periodsPerYear;
    const couponPayment = (bond.couponRate / periodsPerYear) * bond.faceValue;
    const periodYield = yieldRate / periodsPerYear;
    
    let weightedCashFlows = 0;
    let totalPresentValue = 0;
    
    // Coupon payments
    for (let i = 1; i <= totalPeriods; i++) {
      const pv = couponPayment / Math.pow(1 + periodYield, i);
      weightedCashFlows += (i / periodsPerYear) * pv;
      totalPresentValue += pv;
    }
    
    // Principal payment
    const principalPV = bond.faceValue / Math.pow(1 + periodYield, totalPeriods);
    weightedCashFlows += bond.maturity * principalPV;
    totalPresentValue += principalPV;
    
    return weightedCashFlows / totalPresentValue;
  }

  /**
   * Calculate convexity
   */
  private static calculateConvexity(bond: Bond, yieldRate: number): number {
    const periodsPerYear = bond.frequency;
    const totalPeriods = bond.maturity * periodsPerYear;
    const couponPayment = (bond.couponRate / periodsPerYear) * bond.faceValue;
    const periodYield = yieldRate / periodsPerYear;
    
    let convexitySum = 0;
    let totalPresentValue = 0;
    
    // Coupon payments
    for (let i = 1; i <= totalPeriods; i++) {
      const pv = couponPayment / Math.pow(1 + periodYield, i);
      convexitySum += i * (i + 1) * pv;
      totalPresentValue += pv;
    }
    
    // Principal payment
    const principalPV = bond.faceValue / Math.pow(1 + periodYield, totalPeriods);
    convexitySum += totalPeriods * (totalPeriods + 1) * principalPV;
    totalPresentValue += principalPV;
    
    return (convexitySum / totalPresentValue) / Math.pow(1 + periodYield, 2) / Math.pow(periodsPerYear, 2);
  }

  /**
   * Calculate effective duration (for bonds with embedded options)
   */
  private static calculateEffectiveDuration(bond: Bond, yieldRate: number, _volatility: number): number {
    // For bonds without options, effective duration equals modified duration
    if (!bond.callableDate && !bond.puttableDate) {
      const macaulay = this.calculateMacaulayDuration(bond, yieldRate);
      return macaulay / (1 + yieldRate / bond.frequency);
    }
    
    // Simplified effective duration calculation
    // In practice, this would use option pricing models
    const shiftSize = 0.01; // 1% yield shift
    const priceUp = this.calculateBondPrice(bond, yieldRate - shiftSize);
    const priceDown = this.calculateBondPrice(bond, yieldRate + shiftSize);
    const currentPrice = this.calculateBondPrice(bond, yieldRate);
    
    return (priceUp - priceDown) / (2 * shiftSize * currentPrice);
  }

  /**
   * Calculate effective convexity (for bonds with embedded options)
   */
  private static calculateEffectiveConvexity(bond: Bond, yieldRate: number, _volatility: number): number {
    if (!bond.callableDate && !bond.puttableDate) {
      return this.calculateConvexity(bond, yieldRate);
    }
    
    // Simplified effective convexity calculation
    const shiftSize = 0.01;
    const priceUp = this.calculateBondPrice(bond, yieldRate - shiftSize);
    const priceDown = this.calculateBondPrice(bond, yieldRate + shiftSize);
    const currentPrice = this.calculateBondPrice(bond, yieldRate);
    
    return (priceUp + priceDown - 2 * currentPrice) / (Math.pow(shiftSize, 2) * currentPrice);
  }

  /**
   * Calculate Z-spread (zero-volatility spread)
   */
  private static calculateZSpread(bond: Bond, yieldCurve: YieldCurve, price: number): number {
    let zSpread = 0.01; // Initial guess
    const tolerance = 1e-6;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      const calculatedPrice = this.calculateBondPriceWithZSpread(bond, yieldCurve, zSpread);
      const priceDifference = calculatedPrice - price;
      
      if (Math.abs(priceDifference) < tolerance) {
        return zSpread;
      }
      
      // Numerical derivative
      const deltaSpread = 0.0001;
      const priceWithDelta = this.calculateBondPriceWithZSpread(bond, yieldCurve, zSpread + deltaSpread);
      const derivative = (priceWithDelta - calculatedPrice) / deltaSpread;
      
      if (Math.abs(derivative) < tolerance) {
        break;
      }
      
      zSpread = zSpread - priceDifference / derivative;
    }
    
    return zSpread;
  }

  /**
   * Calculate bond price with Z-spread
   */
  private static calculateBondPriceWithZSpread(
    bond: Bond,
    yieldCurve: YieldCurve,
    zSpread: number
  ): number {
    const periodsPerYear = bond.frequency;
    const totalPeriods = bond.maturity * periodsPerYear;
    const couponPayment = (bond.couponRate / periodsPerYear) * bond.faceValue;
    
    let presentValue = 0;
    
    for (let i = 1; i <= totalPeriods; i++) {
      const timeToPayment = i / periodsPerYear;
      const spotRate = this.interpolateYield(yieldCurve, timeToPayment);
      const discountRate = spotRate + zSpread;
      
      const payment = i === totalPeriods ? couponPayment + bond.faceValue : couponPayment;
      presentValue += payment / Math.pow(1 + discountRate, timeToPayment);
    }
    
    return (presentValue / bond.faceValue) * 100;
  }

  /**
   * Calculate G-spread (spread over interpolated government curve)
   */
  private static calculateGSpread(bond: Bond, yieldCurve: YieldCurve, bondYield: number): number {
    const interpolatedGovtYield = this.interpolateYield(yieldCurve, bond.maturity);
    return bondYield - interpolatedGovtYield;
  }

  /**
   * Calculate I-spread (interpolated spread)
   */
  private static calculateISpread(bond: Bond, yieldCurve: YieldCurve, bondYield: number): number {
    // For simplicity, same as G-spread. In practice, this would use specific interpolation methods
    return this.calculateGSpread(bond, yieldCurve, bondYield);
  }

  /**
   * Generate detailed cash flows
   */
  private static generateCashFlows(bond: Bond, discountRate: number) {
    const periodsPerYear = bond.frequency;
    const totalPeriods = bond.maturity * periodsPerYear;
    const couponPayment = (bond.couponRate / periodsPerYear) * bond.faceValue;
    const cashFlows = [];
    
    for (let i = 1; i <= totalPeriods; i++) {
      const timeToPayment = i / periodsPerYear;
      const principal = i === totalPeriods ? bond.faceValue : 0;
      const totalPayment = couponPayment + principal;
      const discountFactor = 1 / Math.pow(1 + discountRate / periodsPerYear, i);
      const presentValue = totalPayment * discountFactor;
      
      // Calculate approximate date (simplified)
      const paymentDate = new Date();
      paymentDate.setFullYear(paymentDate.getFullYear() + Math.floor(timeToPayment));
      paymentDate.setMonth(paymentDate.getMonth() + Math.round((timeToPayment % 1) * 12));
      
      cashFlows.push({
        date: paymentDate.toISOString().split('T')[0]!,
        period: i,
        couponPayment: Number(new Decimal(couponPayment).toDecimalPlaces(2)),
        principalPayment: Number(new Decimal(principal).toDecimalPlaces(2)),
        totalPayment: Number(new Decimal(totalPayment).toDecimalPlaces(2)),
        presentValue: Number(new Decimal(presentValue).toDecimalPlaces(2)),
        discountFactor: Number(new Decimal(discountFactor).toDecimalPlaces(6)),
      });
    }
    
    return cashFlows;
  }

  /**
   * Analyze embedded options (simplified)
   */
  private static analyzeEmbeddedOptions(
    bond: Bond,
    marketData: { yieldCurve: YieldCurve; volatility: number; creditSpread: number },
    bondYield: number
  ) {
    // Simplified option analysis - in practice would use binomial trees or Monte Carlo
    const straightBondPrice = this.calculateBondPrice(bond, bondYield);
    let optionValue = 0;
    
    if (bond.bondType === 'callable' && bond.callPrice && bond.callableDate) {
      // Call option value (negative for bondholder)
      const timeToCall = bond.callableDate;
      const volatility = marketData.volatility;
      
      // Simplified option value using Black-Scholes approximation
      const d1 = (Math.log(straightBondPrice / bond.callPrice) + 
        (bondYield + 0.5 * Math.pow(volatility, 2)) * timeToCall) / 
        (volatility * Math.sqrt(timeToCall));
      const d2 = d1 - volatility * Math.sqrt(timeToCall);
      
      // Approximate call option value
      optionValue = straightBondPrice * this.normalCDF(d1) - 
        bond.callPrice * Math.exp(-bondYield * timeToCall) * this.normalCDF(d2);
        
      optionValue = -Math.max(0, optionValue); // Negative for bondholder
    }
    
    if (bond.bondType === 'puttable' && bond.putPrice && bond.puttableDate) {
      // Put option value (positive for bondholder)
      const timeToPut = bond.puttableDate;
      const volatility = marketData.volatility;
      
      const d1 = (Math.log(straightBondPrice / bond.putPrice) + 
        (bondYield + 0.5 * Math.pow(volatility, 2)) * timeToPut) / 
        (volatility * Math.sqrt(timeToPut));
      const d2 = d1 - volatility * Math.sqrt(timeToPut);
      
      // Approximate put option value
      optionValue = bond.putPrice * Math.exp(-bondYield * timeToPut) * this.normalCDF(-d2) -
        straightBondPrice * this.normalCDF(-d1);
        
      optionValue = Math.max(0, optionValue); // Positive for bondholder
    }
    
    const optionAdjustedSpread = this.calculateOAS(bond, marketData.yieldCurve, straightBondPrice - optionValue, marketData.volatility);
    
    return {
      optionValue: Number(new Decimal(optionValue).toDecimalPlaces(4)),
      straightBondPrice: Number(new Decimal(straightBondPrice).toDecimalPlaces(4)),
      optionCost: Number(new Decimal(Math.abs(optionValue)).toDecimalPlaces(4)),
      oas: Number(new Decimal(optionAdjustedSpread).toDecimalPlaces(6)),
    };
  }

  /**
   * Calculate Option-Adjusted Spread (simplified)
   */
  private static calculateOAS(
    bond: Bond,
    yieldCurve: YieldCurve,
    bondPrice: number,
    _volatility: number
  ): number {
    // Simplified OAS calculation - in practice would use option pricing models
    return this.calculateZSpread(bond, yieldCurve, bondPrice);
  }

  /**
   * Normal cumulative distribution function (approximation)
   */
  private static normalCDF(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Analyze bond portfolio
   */
  static analyzePortfolio(
    portfolio: Array<{ bond: Bond; weight: number; input: BondAnalysisInput }>,
    scenarioShifts: number[] = [-200, -100, -50, 0, 50, 100, 200]
  ): BondPortfolioAnalysis {
    
    const bondAnalyses = portfolio.map(item => {
      const pricing = this.analyze(item.input);
      const marketValue = item.weight * pricing.price;
      
      return {
        bond: item.bond,
        weight: item.weight,
        marketValue,
        pricing,
        contribution: {
          duration: item.weight * pricing.modifiedDuration,
          yield: item.weight * pricing.yieldToMaturity,
          convexity: item.weight * pricing.convexity,
        },
      };
    });
    
    // Portfolio-level calculations
    const totalValue = bondAnalyses.reduce((sum, item) => sum + item.marketValue, 0);
    const weightedAverageYield = bondAnalyses.reduce((sum, item) => sum + item.contribution.yield, 0);
    const portfolioDuration = bondAnalyses.reduce((sum, item) => sum + item.contribution.duration, 0);
    const portfolioConvexity = bondAnalyses.reduce((sum, item) => sum + item.contribution.convexity, 0);
    
    // Risk analysis
    const dv01 = portfolioDuration * totalValue / 10000;
    
    // Scenario analysis
    const scenarios = scenarioShifts.map(shift => {
      const shiftDecimal = shift / 10000; // Convert bp to decimal
      let newPortfolioValue = 0;
      
      for (const item of bondAnalyses) {
        const durationEffect = -item.pricing.modifiedDuration * shiftDecimal * item.marketValue;
        const convexityEffect = 0.5 * item.pricing.convexity * Math.pow(shiftDecimal, 2) * item.marketValue;
        const newValue = item.marketValue + durationEffect + convexityEffect;
        newPortfolioValue += newValue;
      }
      
      const valueChange = newPortfolioValue - totalValue;
      const percentChange = (valueChange / totalValue) * 100;
      
      return {
        name: `${shift >= 0 ? '+' : ''}${shift}bp`,
        description: `${shift >= 0 ? 'Rates up' : 'Rates down'} ${Math.abs(shift)} basis points`,
        yieldChange: shiftDecimal,
        portfolioValue: Number(new Decimal(newPortfolioValue).toDecimalPlaces(2)),
        valueChange: Number(new Decimal(valueChange).toDecimalPlaces(2)),
        percentChange: Number(new Decimal(percentChange).toDecimalPlaces(4)),
      };
    });
    
    // Credit and sector exposure
    const creditExposure: Record<string, number> = {};
    const sectorExposure: Record<string, number> = {};
    
    for (const item of bondAnalyses) {
      const rating = item.bond.creditRating ?? 'Unrated';
      const sector = item.bond.sector ?? 'Other';
      
      creditExposure[rating] = (creditExposure[rating] ?? 0) + item.weight;
      sectorExposure[sector] = (sectorExposure[sector] ?? 0) + item.weight;
    }
    
    return {
      bonds: bondAnalyses,
      totalValue: Number(new Decimal(totalValue).toDecimalPlaces(2)),
      averagePrice: Number(new Decimal(totalValue / bondAnalyses.length).toDecimalPlaces(4)),
      weightedAverageYield: Number(new Decimal(weightedAverageYield).toDecimalPlaces(6)),
      portfolioDuration: Number(new Decimal(portfolioDuration).toDecimalPlaces(4)),
      portfolioConvexity: Number(new Decimal(portfolioConvexity).toDecimalPlaces(4)),
      averageMaturity: Number(new Decimal(
        bondAnalyses.reduce((sum, item) => sum + item.weight * item.bond.maturity, 0)
      ).toDecimalPlaces(2)),
      averageCoupon: Number(new Decimal(
        bondAnalyses.reduce((sum, item) => sum + item.weight * item.bond.couponRate, 0)
      ).toDecimalPlaces(6)),
      averageCreditRating: this.calculateAverageCreditRating(bondAnalyses),
      
      interestRateRisk: {
        dv01: Number(new Decimal(dv01).toDecimalPlaces(4)),
        duration: portfolioDuration,
        convexity: portfolioConvexity,
        keyRateDurations: [], // Simplified - would calculate key rate durations
      },
      
      creditRisk: {
        averageSpread: Number(new Decimal(
          bondAnalyses.reduce((sum, item) => sum + item.weight * item.pricing.creditSpread, 0)
        ).toDecimalPlaces(6)),
        spreadDuration: portfolioDuration, // Simplified assumption
        creditExposure: creditExposure as Record<CreditRating, number>,
        sectorExposure: sectorExposure as Record<BondSector, number>,
      },
      
      scenarios,
    };
  }

  /**
   * Calculate average credit rating (simplified)
   */
  private static calculateAverageCreditRating(
    bondAnalyses: Array<{ bond: Bond; weight: number; marketValue: number; pricing: BondPricingResult }>
  ): string {
    // Simplified - return the most common rating
    const ratings: Record<string, number> = {};
    
    for (const item of bondAnalyses) {
      const rating = item.bond.creditRating ?? 'Unrated';
      ratings[rating] = (ratings[rating] ?? 0) + item.weight;
    }
    
    return Object.entries(ratings)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'Unrated';
  }
}