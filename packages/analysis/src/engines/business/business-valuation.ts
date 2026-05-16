/**
 * Business Valuation Engine
 *
 * Provides simple, rule-of-thumb business valuations using industry-standard
 * methods including revenue multiples, EBITDA multiples, and asset-based valuation.
 * Designed for small to medium-sized businesses.
 */

export interface BusinessValuationInput {
  // Company Information
  industry: string;
  businessAge: number; // Years in operation

  // Financial Metrics (Annual)
  annualRevenue: number;
  annualEbitda: number; // Earnings before interest, taxes, depreciation, amortization
  annualNetIncome: number;

  // Assets & Liabilities
  totalAssets: number;
  totalLiabilities: number;
  inventoryValue?: number;
  equipmentValue?: number;

  // Growth & Performance
  revenueGrowthRate: number; // Annual % growth
  customerCount?: number;

  // Risk Factors
  customerConcentration?: number; // % of revenue from top customer
  ownerDependency?: 'low' | 'medium' | 'high'; // How dependent is business on current owner
  hasRecurringRevenue?: boolean;
  hasDocumentedProcesses?: boolean;
}

export interface ValuationMethod {
  name: string;
  value: number;
  weight: number; // 0-1, how much to weight this method
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface BusinessValuationResult {
  // Valuation Estimates
  valuationLow: number;
  valuationMid: number;
  valuationHigh: number;

  // Methods Used
  methods: ValuationMethod[];

  // Multiples Applied
  ebitdaMultiple: number;
  revenueMultiple: number;
  sdeMultiple: number; // Seller's Discretionary Earnings

  // Asset-Based
  bookValue: number; // Assets - Liabilities
  adjustedBookValue: number; // With adjustments

  // Per-Unit Metrics
  valuePerCustomer?: number;
  valuePerDollarRevenue: number;

  // Adjustment Factors
  adjustments: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
    adjustmentPercent: number; // How much this affects value (±%)
  }[];

  // Valuation Summary
  summary: {
    recommendedValue: number;
    valuationRange: string;
    confidenceLevel: 'high' | 'medium' | 'low';
    mostRelevantMethod: string;
  };

  // Insights & Recommendations
  insights: string[];
  recommendations: string[];
  warnings: string[];
}

export class BusinessValuationEngine {
  /**
   * Analyze business valuation using multiple methods
   */
  static analyze(input: BusinessValuationInput): BusinessValuationResult {
    // Calculate key metrics
    const bookValue = input.totalAssets - input.totalLiabilities;
    const ebitdaMargin =
      input.annualRevenue > 0 ? (input.annualEbitda / input.annualRevenue) * 100 : 0;
    const netMargin =
      input.annualRevenue > 0 ? (input.annualNetIncome / input.annualRevenue) * 100 : 0;

    // Get industry multiples
    const industryMultiples = this.getIndustryMultiples(input.industry);

    // Calculate adjustment factors
    const adjustments = this.calculateAdjustments(input, ebitdaMargin, netMargin);
    const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.adjustmentPercent, 0);
    const adjustmentMultiplier = 1 + totalAdjustment / 100;

    // Apply different valuation methods
    const methods: ValuationMethod[] = [];

    // Method 1: EBITDA Multiple
    if (input.annualEbitda > 0) {
      const baseEbitdaMultiple = industryMultiples.ebitda;
      const adjustedMultiple = baseEbitdaMultiple * adjustmentMultiplier;
      const value = input.annualEbitda * adjustedMultiple;

      methods.push({
        name: 'EBITDA Multiple',
        value,
        weight: 0.4, // 40% weight for most businesses
        explanation: `${adjustedMultiple.toFixed(2)}x EBITDA of ${this.formatCurrency(input.annualEbitda)}`,
        confidence: 'high',
      });
    }

    // Method 2: Revenue Multiple
    if (input.annualRevenue > 0) {
      const baseRevenueMultiple = industryMultiples.revenue;
      const adjustedMultiple = baseRevenueMultiple * adjustmentMultiplier;
      const value = input.annualRevenue * adjustedMultiple;

      const weight = input.annualEbitda > 0 ? 0.2 : 0.5; // Higher weight if no EBITDA
      const confidence = input.annualEbitda > 0 ? 'medium' : 'high';

      methods.push({
        name: 'Revenue Multiple',
        value,
        weight,
        explanation: `${adjustedMultiple.toFixed(2)}x revenue of ${this.formatCurrency(input.annualRevenue)}`,
        confidence,
      });
    }

    // Method 3: SDE Multiple (for small businesses)
    const sde = this.calculateSDE(input);
    if (sde > 0 && input.businessAge < 10 && input.annualRevenue < 5000000) {
      const baseSDEMultiple = industryMultiples.sde;
      const adjustedMultiple = baseSDEMultiple * adjustmentMultiplier;
      const value = sde * adjustedMultiple;

      methods.push({
        name: 'SDE Multiple',
        value,
        weight: 0.3,
        explanation: `${adjustedMultiple.toFixed(2)}x SDE of ${this.formatCurrency(sde)}`,
        confidence: 'high',
      });
    }

    // Method 4: Asset-Based Valuation
    if (bookValue > 0) {
      const adjustedBookValue = this.calculateAdjustedBookValue(input, bookValue);
      const value = adjustedBookValue;

      const weight = methods.length === 0 ? 0.8 : 0.1; // High weight if no other methods
      const confidence = methods.length > 0 ? 'low' : 'medium';

      methods.push({
        name: 'Asset-Based',
        value,
        weight,
        explanation: `Adjusted book value (assets - liabilities with market adjustments)`,
        confidence,
      });
    }

    // Calculate weighted average valuation
    const totalWeight = methods.reduce((sum, m) => sum + m.weight, 0);
    const weightedValue = methods.reduce((sum, m) => sum + m.value * m.weight, 0) / totalWeight;

    // Calculate valuation range (±20% of weighted average)
    const valuationLow = weightedValue * 0.8;
    const valuationHigh = weightedValue * 1.2;
    const valuationMid = weightedValue;

    // Determine most relevant method
    const mostRelevantMethod =
      methods.length > 0
        ? methods.reduce((best, current) => (current.weight > best.weight ? current : best))
        : null;

    // Calculate per-unit metrics
    const valuePerCustomer =
      input.customerCount && input.customerCount > 0
        ? valuationMid / input.customerCount
        : undefined;
    const valuePerDollarRevenue = input.annualRevenue > 0 ? valuationMid / input.annualRevenue : 0;

    // Generate insights and recommendations
    const insights = this.generateInsights(input, methods, weightedValue, adjustments);
    const recommendations = this.generateRecommendations(input, methods, adjustments, ebitdaMargin);
    const warnings = this.generateWarnings(input, valuationMid);

    // Determine confidence level
    const confidenceLevel = this.assessConfidence(methods, input);

    return {
      valuationLow,
      valuationMid,
      valuationHigh,
      methods,
      ebitdaMultiple: methods.find((m) => m.name === 'EBITDA Multiple')
        ? input.annualEbitda > 0
          ? methods.find((m) => m.name === 'EBITDA Multiple')!.value / input.annualEbitda
          : 0
        : 0,
      revenueMultiple: methods.find((m) => m.name === 'Revenue Multiple')
        ? input.annualRevenue > 0
          ? methods.find((m) => m.name === 'Revenue Multiple')!.value / input.annualRevenue
          : 0
        : 0,
      sdeMultiple: methods.find((m) => m.name === 'SDE Multiple')
        ? sde > 0
          ? methods.find((m) => m.name === 'SDE Multiple')!.value / sde
          : 0
        : 0,
      bookValue,
      adjustedBookValue: this.calculateAdjustedBookValue(input, bookValue),
      valuePerCustomer,
      valuePerDollarRevenue,
      adjustments,
      summary: {
        recommendedValue: valuationMid,
        valuationRange: `${this.formatCurrency(valuationLow)} - ${this.formatCurrency(valuationHigh)}`,
        confidenceLevel,
        mostRelevantMethod: mostRelevantMethod?.name || 'Multiple Methods',
      },
      insights,
      recommendations,
      warnings,
    } as BusinessValuationResult;
  }

  /**
   * Get industry-standard multiples
   */
  private static getIndustryMultiples(industry: string): {
    ebitda: number;
    revenue: number;
    sde: number;
  } {
    const multiples: Record<string, { ebitda: number; revenue: number; sde: number }> = {
      saas: { ebitda: 8.0, revenue: 6.0, sde: 5.0 },
      software: { ebitda: 7.0, revenue: 4.0, sde: 4.5 },
      consulting: { ebitda: 4.5, revenue: 0.8, sde: 3.0 },
      'professional-services': { ebitda: 4.0, revenue: 0.75, sde: 2.8 },
      'e-commerce': { ebitda: 3.5, revenue: 0.6, sde: 2.5 },
      retail: { ebitda: 3.0, revenue: 0.4, sde: 2.0 },
      manufacturing: { ebitda: 5.0, revenue: 0.8, sde: 3.5 },
      healthcare: { ebitda: 6.0, revenue: 1.0, sde: 4.0 },
      construction: { ebitda: 3.5, revenue: 0.5, sde: 2.5 },
      restaurants: { ebitda: 2.5, revenue: 0.3, sde: 1.8 },
      agency: { ebitda: 4.0, revenue: 0.7, sde: 3.0 },
      'real-estate': { ebitda: 5.5, revenue: 1.2, sde: 4.0 },
      technology: { ebitda: 6.5, revenue: 3.0, sde: 4.5 },
      other: { ebitda: 4.0, revenue: 0.8, sde: 2.5 },
    };

    const normalized = industry.toLowerCase().trim();
    return multiples[normalized] || multiples['other']!;
  }

  /**
   * Calculate Seller's Discretionary Earnings (SDE)
   * EBITDA + Owner's compensation + Personal expenses run through business
   */
  private static calculateSDE(input: BusinessValuationInput): number {
    // For small businesses, estimate owner compensation at 20% of revenue or $100k, whichever is higher
    const estimatedOwnerComp = Math.max(100000, input.annualRevenue * 0.2);
    return input.annualEbitda + estimatedOwnerComp;
  }

  /**
   * Calculate adjusted book value with market-based adjustments
   */
  private static calculateAdjustedBookValue(
    input: BusinessValuationInput,
    bookValue: number
  ): number {
    let adjusted = bookValue;

    // Adjust inventory (typically valued at 50-70% of book for quick sale)
    if (input.inventoryValue) {
      adjusted = adjusted - input.inventoryValue + input.inventoryValue * 0.6;
    }

    // Equipment may depreciate faster than books show
    if (input.equipmentValue) {
      adjusted = adjusted - input.equipmentValue + input.equipmentValue * 0.7;
    }

    return Math.max(0, adjusted);
  }

  /**
   * Calculate adjustment factors based on business characteristics
   */
  private static calculateAdjustments(
    input: BusinessValuationInput,
    ebitdaMargin: number,
    _netMargin: number
  ) {
    const adjustments: BusinessValuationResult['adjustments'] = [];

    // Growth rate adjustment
    if (input.revenueGrowthRate > 20) {
      adjustments.push({
        name: 'High Growth',
        impact: 'positive',
        description: `${input.revenueGrowthRate.toFixed(0)}% annual revenue growth is exceptional`,
        adjustmentPercent: 25,
      });
    } else if (input.revenueGrowthRate > 10) {
      adjustments.push({
        name: 'Moderate Growth',
        impact: 'positive',
        description: `${input.revenueGrowthRate.toFixed(0)}% annual revenue growth is above average`,
        adjustmentPercent: 15,
      });
    } else if (input.revenueGrowthRate < -5) {
      adjustments.push({
        name: 'Revenue Decline',
        impact: 'negative',
        description: `${input.revenueGrowthRate.toFixed(0)}% revenue decline is concerning`,
        adjustmentPercent: -25,
      });
    }

    // Profitability adjustment
    if (ebitdaMargin > 25) {
      adjustments.push({
        name: 'High Profitability',
        impact: 'positive',
        description: `${ebitdaMargin.toFixed(1)}% EBITDA margin is excellent`,
        adjustmentPercent: 15,
      });
    } else if (ebitdaMargin < 10) {
      adjustments.push({
        name: 'Low Profitability',
        impact: 'negative',
        description: `${ebitdaMargin.toFixed(1)}% EBITDA margin is below industry standards`,
        adjustmentPercent: -15,
      });
    }

    // Customer concentration risk
    if (input.customerConcentration && input.customerConcentration > 25) {
      adjustments.push({
        name: 'Customer Concentration Risk',
        impact: 'negative',
        description: `${input.customerConcentration.toFixed(0)}% of revenue from one customer creates risk`,
        adjustmentPercent: -20,
      });
    } else if (input.customerConcentration && input.customerConcentration < 10) {
      adjustments.push({
        name: 'Diversified Customer Base',
        impact: 'positive',
        description: 'Well-diversified customer base reduces risk',
        adjustmentPercent: 10,
      });
    }

    // Owner dependency
    if (input.ownerDependency === 'high') {
      adjustments.push({
        name: 'High Owner Dependency',
        impact: 'negative',
        description: 'Business relies heavily on current owner - reduces transferability',
        adjustmentPercent: -25,
      });
    } else if (input.ownerDependency === 'low') {
      adjustments.push({
        name: 'Low Owner Dependency',
        impact: 'positive',
        description: 'Business can operate independently - increases value',
        adjustmentPercent: 15,
      });
    }

    // Recurring revenue
    if (input.hasRecurringRevenue) {
      adjustments.push({
        name: 'Recurring Revenue Model',
        impact: 'positive',
        description: 'Predictable revenue stream increases valuation',
        adjustmentPercent: 20,
      });
    }

    // Documented processes
    if (input.hasDocumentedProcesses) {
      adjustments.push({
        name: 'Documented Processes',
        impact: 'positive',
        description: 'Well-documented operations increase transferability',
        adjustmentPercent: 10,
      });
    }

    // Business age/stability
    if (input.businessAge >= 10) {
      adjustments.push({
        name: 'Established Business',
        impact: 'positive',
        description: `${input.businessAge} years of operation demonstrates stability`,
        adjustmentPercent: 10,
      });
    } else if (input.businessAge < 2) {
      adjustments.push({
        name: 'Early Stage',
        impact: 'negative',
        description: 'Less than 2 years in operation increases risk',
        adjustmentPercent: -15,
      });
    }

    return adjustments;
  }

  /**
   * Generate insights about the valuation
   */
  private static generateInsights(
    input: BusinessValuationInput,
    methods: ValuationMethod[],
    value: number,
    adjustments: BusinessValuationResult['adjustments']
  ): string[] {
    const insights: string[] = [];

    insights.push(
      `Based on ${methods.length} valuation methods, your business is worth approximately ${this.formatCurrency(value)}.`
    );

    // EBITDA multiple insight
    const ebitdaMethod = methods.find((m) => m.name === 'EBITDA Multiple');
    if (ebitdaMethod) {
      const multiple = input.annualEbitda > 0 ? ebitdaMethod.value / input.annualEbitda : 0;
      insights.push(
        `EBITDA multiple of ${multiple.toFixed(2)}x is ${multiple >= 5 ? 'strong' : multiple >= 3 ? 'typical' : 'below average'} for ${input.industry} businesses.`
      );
    }

    // Revenue multiple insight
    const revenueMethod = methods.find((m) => m.name === 'Revenue Multiple');
    if (revenueMethod) {
      const multiple = input.annualRevenue > 0 ? revenueMethod.value / input.annualRevenue : 0;
      insights.push(
        `Revenue multiple of ${multiple.toFixed(2)}x reflects ${multiple >= 2 ? 'high growth potential' : 'stable but moderate growth expectations'}.`
      );
    }

    // Positive adjustments
    const positiveAdj = adjustments.filter((a) => a.impact === 'positive');
    if (positiveAdj.length > 0) {
      const totalPositive = positiveAdj.reduce((sum, a) => sum + a.adjustmentPercent, 0);
      insights.push(
        `✅ Positive factors add ${totalPositive.toFixed(0)}% to base valuation: ${positiveAdj.map((a) => a.name).join(', ')}.`
      );
    }

    // Negative adjustments
    const negativeAdj = adjustments.filter((a) => a.impact === 'negative');
    if (negativeAdj.length > 0) {
      const totalNegative = Math.abs(negativeAdj.reduce((sum, a) => sum + a.adjustmentPercent, 0));
      insights.push(
        `⚠️ Risk factors reduce valuation by ${totalNegative.toFixed(0)}%: ${negativeAdj.map((a) => a.name).join(', ')}.`
      );
    }

    return insights;
  }

  /**
   * Generate recommendations for increasing business value
   */
  private static generateRecommendations(
    input: BusinessValuationInput,
    _methods: ValuationMethod[],
    adjustments: BusinessValuationResult['adjustments'],
    ebitdaMargin: number
  ): string[] {
    const recommendations: string[] = [];

    // EBITDA improvement
    if (ebitdaMargin < 15) {
      recommendations.push(
        `📈 Improve EBITDA margin from ${ebitdaMargin.toFixed(1)}% to 20%+ by reducing costs or increasing prices.`
      );
      recommendations.push(
        `   • For every 5% margin improvement, valuation could increase by ${this.formatCurrency(input.annualRevenue * 0.05 * 4)}`
      );
    }

    // Growth recommendations
    if (input.revenueGrowthRate < 10) {
      recommendations.push(`🚀 Accelerate growth to 10%+ annually to command higher multiples.`);
      recommendations.push(`   • Growth-oriented businesses can fetch 2-3x higher multiples`);
    }

    // Risk mitigation
    const hasHighRisk = adjustments.some(
      (a) => a.impact === 'negative' && Math.abs(a.adjustmentPercent) >= 20
    );

    if (hasHighRisk) {
      recommendations.push(`🛡️ Address key risk factors to unlock 20-40% more value:`);
      adjustments
        .filter((a) => a.impact === 'negative')
        .forEach((adj) => {
          recommendations.push(`   • ${adj.description}`);
        });
    }

    // Documentation
    if (!input.hasDocumentedProcesses) {
      recommendations.push(
        `📝 Document all processes and procedures - adds 10-15% to valuation and makes sale easier.`
      );
    }

    // Recurring revenue
    if (!input.hasRecurringRevenue) {
      recommendations.push(
        `🔄 Add recurring revenue streams (subscriptions, contracts, retainers) - can increase valuation by 20-30%.`
      );
    }

    // Customer diversification
    if (input.customerConcentration && input.customerConcentration > 20) {
      recommendations.push(
        `👥 Reduce customer concentration from ${input.customerConcentration.toFixed(0)}% by acquiring more customers.`
      );
      recommendations.push(`   • Aim for no single customer > 10% of revenue`);
    }

    return recommendations;
  }

  /**
   * Generate warnings about valuation concerns
   */
  private static generateWarnings(input: BusinessValuationInput, value: number): string[] {
    const warnings: string[] = [];

    if (input.annualEbitda < 0) {
      warnings.push(
        `🚨 Negative EBITDA makes traditional valuation difficult. Focus on path to profitability.`
      );
    }

    if (input.businessAge < 1) {
      warnings.push(`⚠️ Business less than 1 year old - valuation is highly speculative.`);
    }

    if (input.totalLiabilities > input.totalAssets) {
      warnings.push(`🚨 Liabilities exceed assets - business has negative book value.`);
    }

    if (input.customerConcentration && input.customerConcentration > 50) {
      warnings.push(
        `🚨 CRITICAL: ${input.customerConcentration.toFixed(0)}% revenue concentration creates extreme risk. Losing top customer would be catastrophic.`
      );
    }

    if (value < 100000 && input.annualRevenue > 500000) {
      warnings.push(
        `⚠️ Low valuation relative to revenue suggests profitability issues or other concerns.`
      );
    }

    return warnings;
  }

  /**
   * Assess overall confidence in valuation
   */
  private static assessConfidence(
    methods: ValuationMethod[],
    input: BusinessValuationInput
  ): 'high' | 'medium' | 'low' {
    const highConfidenceMethods = methods.filter((m) => m.confidence === 'high').length;
    const hasMultipleMethods = methods.length >= 2;
    const hasSolidFinancials = input.annualEbitda > 0 && input.annualRevenue > 0;
    const isEstablished = input.businessAge >= 3;

    if (highConfidenceMethods >= 2 && hasMultipleMethods && hasSolidFinancials && isEstablished) {
      return 'high';
    }

    if (highConfidenceMethods >= 1 && hasSolidFinancials) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Format currency for display
   */
  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
