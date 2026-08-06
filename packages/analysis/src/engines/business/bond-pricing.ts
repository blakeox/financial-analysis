import { Decimal } from 'decimal.js';
import { z } from 'zod';
import { BOND_PRICING_FORMULA_METADATA } from '../../formula-semantics.js';
import { BondPricingInputSchema, type BondPricingInput } from '../../schemas/bond-pricing.js';
import type {
  BondPricingResult,
  BondMetrics,
  CouponPayment,
  SensitivityAnalysis,
  RiskMetrics,
} from '../../types/bond-pricing-result.js';

export class BondPricingAnalyzer {
  /**
   * Main analysis method for bond pricing
   */
  static analyze(input: z.infer<typeof BondPricingInputSchema>): BondPricingResult {
    const validated = BondPricingInputSchema.parse(input);

    const settlementDate = validated.settlementDate
      ? new Date(validated.settlementDate)
      : new Date();
    const maturityDate = new Date(validated.maturityDate);
    const issueDate = new Date(validated.issueDate);

    // Calculate time to maturity
    const yearsToMaturity = this.calculateYearsToMaturity(
      settlementDate,
      maturityDate,
      validated.dayCountConvention
    );
    const remainingPayments = this.calculateRemainingPayments(
      settlementDate,
      maturityDate,
      validated.couponFrequency
    );

    // Generate coupon schedule
    const couponSchedule = this.generateCouponSchedule(validated, settlementDate, maturityDate);

    // Calculate bond price and metrics
    const metrics = this.calculateBondMetrics(validated, couponSchedule, yearsToMaturity);

    // Sensitivity analysis
    const sensitivityAnalysis = this.performSensitivityAnalysis(validated, couponSchedule);

    // Risk assessment
    const riskMetrics = this.assessRisk(validated, metrics);

    // Generate insights
    const insights = this.generateInsights(validated, metrics, riskMetrics);
    const recommendation = this.generateRecommendation(validated, metrics);

    return {
      formulaVersion: BOND_PRICING_FORMULA_METADATA.formulaVersion,
      formulaMetadata: BOND_PRICING_FORMULA_METADATA,
      bondType: validated.bondType,
      faceValue: validated.faceValue,
      couponRate: validated.couponRate,
      issueDate: issueDate.toISOString(),
      maturityDate: maturityDate.toISOString(),
      settlementDate: settlementDate.toISOString(),
      yearsToMaturity,
      remainingPayments,
      metrics,
      couponSchedule,
      sensitivityAnalysis,
      riskMetrics,
      insights,
      recommendation,
      calculationDate: new Date().toISOString(),
      assumptions: this.buildAssumptions(validated),
    };
  }

  private static calculateYearsToMaturity(
    settlement: Date,
    maturity: Date,
    convention: string
  ): number {
    const diffMs = maturity.getTime() - settlement.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    switch (convention) {
      case 'actual-365':
        return diffDays / 365;
      case 'actual-360':
        return diffDays / 360;
      case '30-360':
      case '30-360-european':
        return this.calculate30360Days(settlement, maturity) / 360;
      default:
        return diffDays / 365.25; // actual-actual
    }
  }

  private static calculate30360Days(start: Date, end: Date): number {
    const y1 = start.getUTCFullYear();
    const m1 = start.getUTCMonth() + 1;
    const d1 = Math.min(start.getUTCDate(), 30);

    const y2 = end.getUTCFullYear();
    const m2 = end.getUTCMonth() + 1;
    const d2 = Math.min(end.getUTCDate(), 30);

    return 360 * (y2 - y1) + 30 * (m2 - m1) + (d2 - d1);
  }

  private static calculateRemainingPayments(
    settlement: Date,
    maturity: Date,
    frequency: string
  ): number {
    const yearsToMaturity =
      (maturity.getTime() - settlement.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    const paymentsPerYear =
      frequency === 'annual'
        ? 1
        : frequency === 'semi-annual'
          ? 2
          : frequency === 'quarterly'
            ? 4
            : frequency === 'monthly'
              ? 12
              : 0;

    return Math.ceil(yearsToMaturity * paymentsPerYear);
  }

  private static addUtcMonths(date: Date, months: number): Date {
    const next = new Date(date.getTime());
    next.setUTCMonth(next.getUTCMonth() + months);
    return next;
  }

  private static generateCouponSchedule(
    input: BondPricingInput,
    settlement: Date,
    maturity: Date
  ): CouponPayment[] {
    if (input.bondType === 'zero-coupon') {
      return [];
    }

    const schedule: CouponPayment[] = [];
    const paymentsPerYear =
      input.couponFrequency === 'annual'
        ? 1
        : input.couponFrequency === 'semi-annual'
          ? 2
          : input.couponFrequency === 'quarterly'
            ? 4
            : input.couponFrequency === 'monthly'
              ? 12
              : 0;

    const couponAmount = new Decimal(input.faceValue)
      .mul(input.couponRate)
      .div(paymentsPerYear)
      .toNumber();

    const monthsPerPayment = 12 / paymentsPerYear;
    let currentDate = new Date(settlement.getTime());
    let paymentNumber = 1;

    // Find first payment date after settlement using UTC month arithmetic so
    // pinned settlement/maturity ISO dates are reproducible across timezones.
    while (currentDate <= maturity) {
      currentDate = this.addUtcMonths(currentDate, monthsPerPayment);

      if (currentDate > settlement && currentDate <= maturity) {
        const discountFactor = Math.pow(
          1 + input.yieldToMaturity / paymentsPerYear,
          -paymentNumber
        );

        schedule.push({
          paymentNumber,
          date: currentDate.toISOString(),
          couponAmount,
          accruedInterest: 0, // Simplified - would need actual calculation
          discountedValue: couponAmount * discountFactor,
        });

        paymentNumber++;
      }
    }

    return schedule;
  }

  private static calculateBondMetrics(
    input: BondPricingInput,
    couponSchedule: CouponPayment[],
    _yearsToMaturity: number
  ): BondMetrics {
    const ytm = input.yieldToMaturity;
    const paymentsPerYear =
      input.couponFrequency === 'annual'
        ? 1
        : input.couponFrequency === 'semi-annual'
          ? 2
          : input.couponFrequency === 'quarterly'
            ? 4
            : input.couponFrequency === 'monthly'
              ? 12
              : 1;

    // Calculate price using present value of cash flows
    let price = new Decimal(0);
    let weightedTime = new Decimal(0);

    couponSchedule.forEach((payment, index) => {
      const pv = new Decimal(payment.couponAmount).div(
        Math.pow(1 + ytm / paymentsPerYear, index + 1)
      );
      price = price.add(pv);
      weightedTime = weightedTime.add(pv.mul(index + 1).div(paymentsPerYear));
    });

    // Add present value of face value
    const faceValuePV = new Decimal(input.faceValue).div(
      Math.pow(1 + ytm / paymentsPerYear, couponSchedule.length)
    );
    price = price.add(faceValuePV);
    weightedTime = weightedTime.add(faceValuePV.mul(couponSchedule.length).div(paymentsPerYear));

    const cleanPrice = price.toNumber();
    const accruedInterest = 0; // Simplified
    const dirtyPrice = cleanPrice + accruedInterest;

    // Macaulay Duration
    const macaulayDuration = weightedTime.div(price).toNumber();

    // Modified Duration
    const modifiedDuration = macaulayDuration / (1 + ytm / paymentsPerYear);

    // Convexity (simplified calculation)
    const convexity = this.calculateConvexity(input, couponSchedule, ytm, paymentsPerYear);

    // Dollar metrics
    const dollarDuration = (modifiedDuration * cleanPrice) / 100;
    const dv01 = dollarDuration / 10000; // Value of 1 basis point

    // Current yield
    const annualCoupon = input.faceValue * input.couponRate;
    const currentYield = annualCoupon / cleanPrice;

    return {
      price: cleanPrice,
      dirtyPrice,
      accruedInterest,
      yieldToMaturity: ytm,
      currentYield,
      macaulayDuration,
      modifiedDuration,
      dollarDuration,
      convexity,
      dv01,
    };
  }

  private static calculateConvexity(
    input: BondPricingInput,
    couponSchedule: CouponPayment[],
    ytm: number,
    paymentsPerYear: number
  ): number {
    let convexity = new Decimal(0);
    let price = new Decimal(0);

    couponSchedule.forEach((payment, index) => {
      const t = (index + 1) / paymentsPerYear;
      const pv = new Decimal(payment.couponAmount).div(
        Math.pow(1 + ytm / paymentsPerYear, index + 1)
      );
      convexity = convexity.add(pv.mul(t).mul(t + 1 / paymentsPerYear));
      price = price.add(pv);
    });

    const faceValuePV = new Decimal(input.faceValue).div(
      Math.pow(1 + ytm / paymentsPerYear, couponSchedule.length)
    );
    const t = couponSchedule.length / paymentsPerYear;
    convexity = convexity.add(faceValuePV.mul(t).mul(t + 1 / paymentsPerYear));
    price = price.add(faceValuePV);

    return convexity
      .div(price)
      .div(Math.pow(1 + ytm / paymentsPerYear, 2))
      .toNumber();
  }

  private static performSensitivityAnalysis(
    input: BondPricingInput,
    couponSchedule: CouponPayment[]
  ): SensitivityAnalysis {
    const baseYield = input.yieldToMaturity;
    const priceYieldCurve: Array<{ yield: number; price: number }> = [];

    // Calculate prices for yield changes from -3% to +3%
    for (let deltaYield = -0.03; deltaYield <= 0.03; deltaYield += 0.005) {
      const newYield = Math.max(0.001, baseYield + deltaYield);
      const testInput = { ...input, yieldToMaturity: newYield };
      const metrics = this.calculateBondMetrics(testInput, couponSchedule, 0);
      priceYieldCurve.push({ yield: newYield, price: metrics.price });
    }

    const baseMetrics = this.calculateBondMetrics(input, couponSchedule, 0);
    const durationAnalysis = [
      { yieldChange: -100, priceChange: 0, percentChange: 0 },
      { yieldChange: -50, priceChange: 0, percentChange: 0 },
      { yieldChange: 50, priceChange: 0, percentChange: 0 },
      { yieldChange: 100, priceChange: 0, percentChange: 0 },
    ];

    durationAnalysis.forEach((item) => {
      const newYield = baseYield + item.yieldChange / 10000;
      const testInput = { ...input, yieldToMaturity: newYield };
      const metrics = this.calculateBondMetrics(testInput, couponSchedule, 0);
      item.priceChange = metrics.price - baseMetrics.price;
      item.percentChange = (item.priceChange / baseMetrics.price) * 100;
    });

    return { priceYieldCurve, durationAnalysis };
  }

  private static assessRisk(input: BondPricingInput, metrics: BondMetrics): RiskMetrics {
    const creditRisk = input.creditRating || 'Not Rated';

    const interestRateRisk =
      metrics.modifiedDuration > 10 ? 'High' : metrics.modifiedDuration > 5 ? 'Medium' : 'Low';

    const reinvestmentRisk =
      input.couponRate > 0.05 ? 'High' : input.couponRate > 0.02 ? 'Medium' : 'Low';

    return {
      creditRisk,
      interestRateRisk,
      reinvestmentRisk,
    };
  }

  private static generateInsights(
    input: BondPricingInput,
    metrics: BondMetrics,
    _risk: RiskMetrics
  ): string[] {
    const insights: string[] = [];

    if (metrics.price > input.faceValue) {
      insights.push(
        `Bond trading at premium (${((metrics.price / input.faceValue - 1) * 100).toFixed(2)}% above par)`
      );
    } else if (metrics.price < input.faceValue) {
      insights.push(
        `Bond trading at discount (${((1 - metrics.price / input.faceValue) * 100).toFixed(2)}% below par)`
      );
    }

    if (metrics.modifiedDuration > 7) {
      insights.push(
        `High duration (${metrics.modifiedDuration.toFixed(2)}) means significant price sensitivity to interest rate changes`
      );
    }

    if (metrics.convexity > 100) {
      insights.push(
        `High convexity (${metrics.convexity.toFixed(2)}) provides downside protection`
      );
    }

    if (input.bondType === 'municipal' && input.isTaxExempt) {
      insights.push('Tax-exempt municipal bond - consider tax-equivalent yield for comparison');
    }

    return insights;
  }

  private static generateRecommendation(
    _input: BondPricingInput,
    metrics: BondMetrics
  ): 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' {
    const yieldSpread = metrics.yieldToMaturity - 0.04; // Simplified vs risk-free rate

    if (yieldSpread > 0.03) return 'Strong Buy';
    if (yieldSpread > 0.01) return 'Buy';
    if (yieldSpread > -0.01) return 'Hold';
    if (yieldSpread > -0.03) return 'Sell';
    return 'Strong Sell';
  }

  private static buildAssumptions(input: BondPricingInput): string[] {
    const assumptions = [
      `Day count convention: ${input.dayCountConvention}`,
      `Coupon frequency: ${input.couponFrequency}`,
      `Yield to maturity: ${(input.yieldToMaturity * 100).toFixed(2)}%`,
    ];

    if (input.reinvestmentRate) {
      assumptions.push(`Reinvestment rate: ${(input.reinvestmentRate * 100).toFixed(2)}%`);
    }

    if (input.taxRate > 0) {
      assumptions.push(`Tax rate: ${(input.taxRate * 100).toFixed(2)}%`);
    }

    return assumptions;
  }
}
