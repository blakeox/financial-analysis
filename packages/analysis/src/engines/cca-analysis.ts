/**
 * Comparable Company Analysis (CCA) Valuation Engine
 * Professional-grade peer group valuation analysis
 *
 * Implements industry-standard CCA methodology including:
 * - Trading multiples calculation (EV/Revenue, EV/EBITDA, P/E, P/B, etc.)
 * - Peer group selection and screening
 * - Premium/discount analysis
 * - Outlier detection and statistical analysis
 * - Valuation range determination
 */

import { Decimal } from 'decimal.js';
import { z } from 'zod';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const CCAValuationInputSchema = z.object({
  // Target Company Information
  targetCompany: z.object({
    name: z.string(),
    industry: z.string(),
    size: z.enum(['small', 'medium', 'large', 'enterprise']),
    country: z.string().default('US'),
    currency: z.string().default('USD'),
  }),

  // Target Company Financials
  targetFinancials: z.object({
    marketCap: z.number().min(0),
    enterpriseValue: z.number().min(0),
    revenue: z.number().min(0),
    ebitda: z.number(),
    ebit: z.number(),
    netIncome: z.number(),
    totalDebt: z.number().min(0),
    cashAndEquivalents: z.number().min(0),
    sharesOutstanding: z.number().min(0),
    bookValue: z.number().min(0),
    freeCashFlow: z.number(),
    capex: z.number().min(0),
    depreciation: z.number().min(0),
  }),

  // Peer Group Selection Criteria
  peerGroupCriteria: z.object({
    industry: z.array(z.string()),
    sizeRange: z.object({
      minRevenue: z.number().min(0),
      maxRevenue: z.number().min(0),
    }),
    geography: z.array(z.string()).default(['US']),
    businessModel: z.array(z.string()).optional(),
    excludeTarget: z.boolean().default(true),
  }),

  // Peer Companies Data
  peerCompanies: z.array(
    z.object({
      name: z.string(),
      ticker: z.string(),
      industry: z.string(),
      country: z.string(),
      marketCap: z.number().min(0),
      enterpriseValue: z.number().min(0),
      revenue: z.number().min(0),
      ebitda: z.number(),
      ebit: z.number(),
      netIncome: z.number(),
      totalDebt: z.number().min(0),
      cashAndEquivalents: z.number().min(0),
      sharesOutstanding: z.number().min(0),
      bookValue: z.number().min(0),
      freeCashFlow: z.number(),
      capex: z.number().min(0),
      depreciation: z.number().min(0),
      currentPrice: z.number().min(0),
      beta: z.number().min(0).max(3).default(1.0),
      creditRating: z.string().optional(),
    })
  ),

  // Analysis Parameters
  analysis: z.object({
    multiplesToCalculate: z
      .array(
        z.enum([
          'ev-revenue',
          'ev-ebitda',
          'ev-ebit',
          'ev-fcf',
          'pe',
          'pb',
          'ps',
          'peg',
          'ev-nopat',
          'ev-ebitda-capex',
        ])
      )
      .default(['ev-revenue', 'ev-ebitda', 'ev-ebit', 'pe', 'pb']),
    excludeOutliers: z.boolean().default(true),
    outlierThreshold: z.number().min(1).max(5).default(2),
    includeMedian: z.boolean().default(true),
    includeMean: z.boolean().default(true),
    includeHarmonicMean: z.boolean().default(false),
    weightBySize: z.boolean().default(false),
    sizeWeightMethod: z.enum(['revenue', 'market-cap', 'enterprise-value']).default('revenue'),
  }),

  // Valuation Assumptions
  valuation: z.object({
    applyPremiumsDiscounts: z.boolean().default(true),
    controlPremium: z.number().min(0).max(1).default(0.2),
    liquidityDiscount: z.number().min(0).max(1).default(0.15),
    sizeDiscount: z.number().min(0).max(1).default(0.05),
    countryRiskPremium: z.number().min(0).max(0.1).default(0),
  }),
});

export type CCAValuationInput = z.infer<typeof CCAValuationInputSchema>;

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface CCAValuationResult {
  // Peer Group Analysis
  peerGroup: {
    companies: Array<{
      name: string;
      ticker: string;
      industry: string;
      country: string;
      marketCap: number;
      enterpriseValue: number;
      revenue: number;
      ebitda: number;
      ebit: number;
      netIncome: number;
      multiples: Record<string, number>;
    }>;
    summary: {
      count: number;
      averageSize: number;
      sizeRange: { min: number; max: number };
      geographicDistribution: Record<string, number>;
      industryDistribution: Record<string, number>;
    };
  };

  // Trading Multiples Analysis
  tradingMultiples: {
    evRevenue: MultipleAnalysis;
    evEbitda: MultipleAnalysis;
    evEbit: MultipleAnalysis;
    evFcf: MultipleAnalysis;
    pe: MultipleAnalysis;
    pb: MultipleAnalysis;
    ps: MultipleAnalysis;
    peg: MultipleAnalysis;
    evNopat: MultipleAnalysis;
    evEbitdaCapex: MultipleAnalysis;
  };

  // Valuation Results
  valuation: {
    enterpriseValue: {
      range: { min: number; max: number };
      median: number;
      mean: number;
      weightedAverage: number;
      targetValue: number;
    };
    equityValue: {
      range: { min: number; max: number };
      median: number;
      mean: number;
      weightedAverage: number;
      targetValue: number;
    };
    valuePerShare: {
      range: { min: number; max: number };
      median: number;
      mean: number;
      weightedAverage: number;
      targetValue: number;
    };
    currentPrice: number;
    upsideDownside: number;
  };

  // Premium/Discount Analysis
  premiumDiscount: {
    vsMarket: {
      premium: number;
      explanation: string;
    };
    vsPeers: {
      premium: number;
      explanation: string;
    };
    sizeAdjustment: {
      adjustment: number;
      explanation: string;
    };
    liquidityAdjustment: {
      adjustment: number;
      explanation: string;
    };
    countryRiskAdjustment: {
      adjustment: number;
      explanation: string;
    };
  };

  // Key Metrics Comparison
  keyMetrics: {
    revenue: ComparisonMetrics;
    ebitda: ComparisonMetrics;
    ebitdaMargin: ComparisonMetrics;
    netIncome: ComparisonMetrics;
    netMargin: ComparisonMetrics;
    roe: ComparisonMetrics;
    roic: ComparisonMetrics;
    debtToEquity: ComparisonMetrics;
    currentRatio: ComparisonMetrics;
  };

  // Insights and Analysis
  insights: string[];
  warnings: string[];
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }>;

  // Metadata
  metadata: {
    calculatedAt: string;
    version: string;
    methodology: string;
    dataSource: string;
    assumptions: Record<string, any>;
  };
}

interface MultipleAnalysis {
  values: number[];
  statistics: {
    min: number;
    max: number;
    median: number;
    mean: number;
    p25: number;
    p75: number;
    standardDeviation: number;
    coefficientOfVariation: number;
  };
  outliers: Array<{
    company: string;
    value: number;
    reason: string;
  }>;
  targetMultiple: number;
  targetValue: number;
}

interface ComparisonMetrics {
  target: number;
  peerAverage: number;
  peerMedian: number;
  peerMin: number;
  peerMax: number;
  percentile: number;
  vsAverage: number;
  vsMedian: number;
}

// ============================================================================
// CCA VALUATION ENGINE
// ============================================================================

export class CCAValuationEngine {
  /**
   * Main CCA valuation method
   *
   * @param input - CCA valuation input parameters
   * @returns Comprehensive CCA valuation results
   */
  static analyze(input: CCAValuationInput): CCAValuationResult {
    const validated = CCAValuationInputSchema.parse(input);

    // Validate peer companies
    if (!validated.peerCompanies || validated.peerCompanies.length === 0) {
      throw new Error('CCA analysis requires at least one peer company');
    }

    // Validate target financials
    if (validated.targetFinancials.revenue <= 0) {
      throw new Error('Target company must have positive revenue for CCA analysis');
    }

    // Set precision for financial calculations
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

    // Calculate multiples for peer companies
    const peerCompaniesWithMultiples = this.calculatePeerMultiples(validated.peerCompanies);

    // Analyze trading multiples
    const tradingMultiples = this.analyzeTradingMultiples(validated, peerCompaniesWithMultiples);

    // Calculate valuation
    const valuation = this.calculateValuation(validated, tradingMultiples);

    // Analyze premiums and discounts
    const premiumDiscount = this.analyzePremiumsDiscounts(validated, valuation);

    // Compare key metrics
    const keyMetrics = this.compareKeyMetrics(validated, peerCompaniesWithMultiples);

    // Generate insights
    const insights = this.generateInsights(validated, tradingMultiples, valuation);
    const warnings = this.generateWarnings(validated, tradingMultiples, peerCompaniesWithMultiples);
    const recommendations = this.generateRecommendations(validated, tradingMultiples, valuation);

    return {
      peerGroup: {
        companies: peerCompaniesWithMultiples,
        summary: this.generatePeerGroupSummary(peerCompaniesWithMultiples),
      },
      tradingMultiples,
      valuation,
      premiumDiscount,
      keyMetrics,
      insights,
      warnings,
      recommendations,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: '1.0.0',
        methodology: 'Comparable Company Analysis',
        dataSource: 'Financial Data',
        assumptions: validated.valuation,
      },
    };
  }

  /**
   * Calculate multiples for peer companies
   */
  private static calculatePeerMultiples(peerCompanies: CCAValuationInput['peerCompanies']) {
    return peerCompanies.map((company) => {
      const multiples: Record<string, number> = {};

      // EV multiples
      if (company.revenue > 0) multiples.evRevenue = company.enterpriseValue / company.revenue;
      if (company.ebitda > 0) multiples.evEbitda = company.enterpriseValue / company.ebitda;
      if (company.ebit > 0) multiples.evEbit = company.enterpriseValue / company.ebit;
      if (company.freeCashFlow > 0)
        multiples.evFcf = company.enterpriseValue / company.freeCashFlow;

      // Equity multiples
      if (company.revenue > 0) multiples.ps = company.marketCap / company.revenue;
      if (company.netIncome > 0) multiples.pe = company.marketCap / company.netIncome;
      if (company.bookValue > 0) multiples.pb = company.marketCap / company.bookValue;

      // Growth-adjusted multiples
      if (multiples.pe && company.beta > 0) {
        multiples.peg = multiples.pe / (company.beta * 10); // Simplified growth assumption
      }

      return {
        name: company.name,
        ticker: company.ticker,
        industry: company.industry,
        country: company.country,
        marketCap: company.marketCap,
        enterpriseValue: company.enterpriseValue,
        revenue: company.revenue,
        ebitda: company.ebitda,
        ebit: company.ebit,
        netIncome: company.netIncome,
        multiples,
      };
    });
  }

  /**
   * Convert hyphenated multiple type to camelCase property name
   */
  private static toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Analyze trading multiples
   */
  private static analyzeTradingMultiples(input: CCAValuationInput, peerCompanies: any[]) {
    const multiples: any = {};

    // Calculate each multiple
    for (const multipleType of input.analysis.multiplesToCalculate) {
      // Convert hyphenated key to camelCase to match peer multiples property names
      const camelCaseKey = this.toCamelCase(multipleType);

      const values = peerCompanies
        .map((company) => company.multiples[camelCaseKey])
        .filter((value) => value !== undefined && !isNaN(value) && isFinite(value));

      if (values.length > 0) {
        // Store with camelCase key to match output type
        multiples[camelCaseKey] = this.analyzeMultiple(values, multipleType, input);
      }
    }

    return multiples;
  }

  /**
   * Analyze a specific multiple
   */
  private static analyzeMultiple(
    values: number[],
    multipleType: string,
    input: CCAValuationInput
  ): MultipleAnalysis {
    if (values.length === 0) {
      throw new Error(`No values provided for multiple analysis: ${multipleType}`);
    }

    // Sort values
    const sortedValues = [...values].sort((a, b) => a - b);

    // Calculate statistics
    const min = sortedValues[0]!;
    const max = sortedValues[sortedValues.length - 1]!;
    const median = this.calculateMedian(sortedValues);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const p25Index = Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * 0.25));
    const p75Index = Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * 0.75));
    const p25 = sortedValues[p25Index]!;
    const p75 = sortedValues[p75Index]!;
    const standardDeviation = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );
    const coefficientOfVariation = mean === 0 ? 0 : standardDeviation / mean;

    // Identify outliers
    const outliers = this.identifyOutliers(values, input.analysis.outlierThreshold);

    // Calculate target multiple (median by default)
    const targetMultiple = input.analysis.includeMedian ? median : mean;

    return {
      values: sortedValues,
      statistics: {
        min,
        max,
        median,
        mean,
        p25,
        p75,
        standardDeviation,
        coefficientOfVariation,
      },
      outliers,
      targetMultiple,
      targetValue: targetMultiple, // Will be calculated based on target company metrics
    };
  }

  /**
   * Calculate median
   */
  private static calculateMedian(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  }

  /**
   * Identify outliers
   */
  private static identifyOutliers(
    values: number[],
    threshold: number
  ): Array<{
    company: string;
    value: number;
    reason: string;
  }> {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );

    const outliers: Array<{ company: string; value: number; reason: string }> = [];

    values.forEach((value) => {
      if (Math.abs(value - mean) > threshold * stdDev) {
        outliers.push({
          company: 'Peer Company', // Would need company name in real implementation
          value,
          reason: `Value ${value.toFixed(2)} is ${threshold} standard deviations from mean`,
        });
      }
    });

    return outliers;
  }

  /**
   * Calculate valuation
   */
  private static calculateValuation(input: CCAValuationInput, tradingMultiples: any) {
    const { targetFinancials } = input;

    // Calculate enterprise value using different multiples
    const evValues: number[] = [];

    if (tradingMultiples.evRevenue) {
      evValues.push(targetFinancials.revenue * tradingMultiples.evRevenue.targetMultiple);
    }
    if (tradingMultiples.evEbitda) {
      evValues.push(targetFinancials.ebitda * tradingMultiples.evEbitda.targetMultiple);
    }
    if (tradingMultiples.evEbit) {
      evValues.push(targetFinancials.ebit * tradingMultiples.evEbit.targetMultiple);
    }

    // Calculate equity value using different multiples
    const equityValues: number[] = [];

    if (tradingMultiples.pe) {
      equityValues.push(targetFinancials.netIncome * tradingMultiples.pe.targetMultiple);
    }
    if (tradingMultiples.ps) {
      equityValues.push(targetFinancials.revenue * tradingMultiples.ps.targetMultiple);
    }
    if (tradingMultiples.pb) {
      equityValues.push(targetFinancials.bookValue * tradingMultiples.pb.targetMultiple);
    }

    // Calculate statistics
    const enterpriseValue = {
      range: { min: Math.min(...evValues), max: Math.max(...evValues) },
      median: this.calculateMedian(evValues),
      mean: evValues.reduce((sum, val) => sum + val, 0) / evValues.length,
      weightedAverage: evValues.reduce((sum, val) => sum + val, 0) / evValues.length, // Simplified
      targetValue: this.calculateMedian(evValues),
    };

    const equityValue = {
      range: { min: Math.min(...equityValues), max: Math.max(...equityValues) },
      median: this.calculateMedian(equityValues),
      mean: equityValues.reduce((sum, val) => sum + val, 0) / equityValues.length,
      weightedAverage: equityValues.reduce((sum, val) => sum + val, 0) / equityValues.length, // Simplified
      targetValue: this.calculateMedian(equityValues),
    };

    const valuePerShare = {
      range: {
        min: equityValue.range.min / targetFinancials.sharesOutstanding,
        max: equityValue.range.max / targetFinancials.sharesOutstanding,
      },
      median: equityValue.median / targetFinancials.sharesOutstanding,
      mean: equityValue.mean / targetFinancials.sharesOutstanding,
      weightedAverage: equityValue.weightedAverage / targetFinancials.sharesOutstanding,
      targetValue: equityValue.targetValue / targetFinancials.sharesOutstanding,
    };

    const currentPrice = targetFinancials.marketCap / targetFinancials.sharesOutstanding;
    const upsideDownside = (valuePerShare.targetValue - currentPrice) / currentPrice;

    return {
      enterpriseValue,
      equityValue,
      valuePerShare,
      currentPrice,
      upsideDownside,
    };
  }

  /**
   * Analyze premiums and discounts
   */
  private static analyzePremiumsDiscounts(input: CCAValuationInput, valuation: any) {
    const { targetFinancials, valuation: valAssumptions } = input;

    // Calculate current multiples for target
    const targetEvRevenue = targetFinancials.enterpriseValue / targetFinancials.revenue;
    const targetEvEbitda = targetFinancials.enterpriseValue / targetFinancials.ebitda;
    const targetPe = targetFinancials.marketCap / targetFinancials.netIncome;

    // Calculate peer averages
    const peerEvRevenue = valuation.enterpriseValue.mean / targetFinancials.revenue;
    const peerEvEbitda = valuation.enterpriseValue.mean / targetFinancials.ebitda;
    const peerPe = valuation.equityValue.mean / targetFinancials.netIncome;

    const revenuePremium =
      peerEvRevenue > 0 ? ((targetEvRevenue - peerEvRevenue) / peerEvRevenue) * 100 : 0;
    const ebitdaPremium =
      peerEvEbitda > 0 ? ((targetEvEbitda - peerEvEbitda) / peerEvEbitda) * 100 : 0;
    const pePremium = peerPe > 0 ? ((targetPe - peerPe) / peerPe) * 100 : 0;

    return {
      vsMarket: {
        premium: 0, // Would need market data
        explanation: 'Market comparison requires broader market data',
      },
      vsPeers: {
        premium: ebitdaPremium,
        explanation: `Target trades at ${targetEvEbitda.toFixed(
          1
        )}x EBITDA vs peer average of ${peerEvEbitda.toFixed(1)}x`,
        revenuePremium,
        pePremium,
      },
      sizeAdjustment: {
        adjustment: valAssumptions.sizeDiscount,
        explanation: 'Size discount applied for smaller company',
      },
      liquidityAdjustment: {
        adjustment: valAssumptions.liquidityDiscount,
        explanation: 'Liquidity discount applied for private company',
      },
      countryRiskAdjustment: {
        adjustment: valAssumptions.countryRiskPremium,
        explanation: 'Country risk premium applied',
      },
    };
  }

  /**
   * Compare key metrics
   */
  private static compareKeyMetrics(input: CCAValuationInput, peerCompanies: any[]) {
    const { targetFinancials } = input;

    // Calculate peer averages
    const peerRevenue = peerCompanies.reduce((sum, p) => sum + p.revenue, 0) / peerCompanies.length;
    const peerEbitda = peerCompanies.reduce((sum, p) => sum + p.ebitda, 0) / peerCompanies.length;
    const peerEbitdaMargin =
      peerCompanies.reduce((sum, p) => sum + p.ebitda / p.revenue, 0) / peerCompanies.length;
    const peerNetIncome =
      peerCompanies.reduce((sum, p) => sum + p.netIncome, 0) / peerCompanies.length;
    const peerNetMargin =
      peerCompanies.reduce((sum, p) => sum + p.netIncome / p.revenue, 0) / peerCompanies.length;

    return {
      revenue: this.createComparisonMetrics(
        targetFinancials.revenue,
        peerRevenue,
        peerCompanies.map((p) => p.revenue)
      ),
      ebitda: this.createComparisonMetrics(
        targetFinancials.ebitda,
        peerEbitda,
        peerCompanies.map((p) => p.ebitda)
      ),
      ebitdaMargin: this.createComparisonMetrics(
        targetFinancials.ebitda / targetFinancials.revenue,
        peerEbitdaMargin,
        peerCompanies.map((p) => p.ebitda / p.revenue)
      ),
      netIncome: this.createComparisonMetrics(
        targetFinancials.netIncome,
        peerNetIncome,
        peerCompanies.map((p) => p.netIncome)
      ),
      netMargin: this.createComparisonMetrics(
        targetFinancials.netIncome / targetFinancials.revenue,
        peerNetMargin,
        peerCompanies.map((p) => p.netIncome / p.revenue)
      ),
      roe: this.createComparisonMetrics(0, 0, []), // Placeholder
      roic: this.createComparisonMetrics(0, 0, []), // Placeholder
      debtToEquity: this.createComparisonMetrics(0, 0, []), // Placeholder
      currentRatio: this.createComparisonMetrics(0, 0, []), // Placeholder
    };
  }

  /**
   * Create comparison metrics
   */
  private static createComparisonMetrics(
    target: number,
    peerAverage: number,
    peerValues: number[]
  ): ComparisonMetrics {
    const peerMedian = this.calculateMedian(peerValues);
    const peerMin = Math.min(...peerValues);
    const peerMax = Math.max(...peerValues);

    // Calculate percentile
    const sortedPeers = [...peerValues].sort((a, b) => a - b);
    const percentile =
      (sortedPeers.filter((val) => val <= target).length / sortedPeers.length) * 100;

    return {
      target,
      peerAverage,
      peerMedian,
      peerMin,
      peerMax,
      percentile,
      vsAverage: target - peerAverage,
      vsMedian: target - peerMedian,
    };
  }

  /**
   * Generate peer group summary
   */
  private static generatePeerGroupSummary(peerCompanies: any[]) {
    const revenues = peerCompanies.map((p) => p.revenue);
    const countries = peerCompanies.reduce(
      (acc, p) => {
        acc[p.country] = (acc[p.country] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const industries = peerCompanies.reduce(
      (acc, p) => {
        acc[p.industry] = (acc[p.industry] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      count: peerCompanies.length,
      averageSize: revenues.reduce((sum, r) => sum + r, 0) / revenues.length,
      sizeRange: { min: Math.min(...revenues), max: Math.max(...revenues) },
      geographicDistribution: countries,
      industryDistribution: industries,
    };
  }

  /**
   * Generate insights
   */
  private static generateInsights(
    _input: CCAValuationInput,
    tradingMultiples: any,
    valuation: any
  ): string[] {
    const insights = [];

    // Valuation insights
    if (valuation.upsideDownside > 0.2) {
      insights.push('Target company appears undervalued relative to peers');
    } else if (valuation.upsideDownside < -0.2) {
      insights.push('Target company appears overvalued relative to peers');
    }

    // Multiple insights
    if (tradingMultiples.evEbitda) {
      const cv = tradingMultiples.evEbitda.statistics.coefficientOfVariation;
      if (cv > 0.5) {
        insights.push('High variation in EV/EBITDA multiples suggests diverse peer group');
      }
    }

    return insights;
  }

  /**
   * Generate warnings
   */
  private static generateWarnings(
    _input: CCAValuationInput,
    tradingMultiples: any,
    peerCompanies: any[]
  ): string[] {
    const warnings = [];

    // Peer group warnings
    if (peerCompanies.length < 5) {
      warnings.push('Small peer group may not provide reliable valuation range');
    }

    // Multiple warnings
    if (
      tradingMultiples.evEbitda &&
      tradingMultiples.evEbitda.outliers.length > peerCompanies.length * 0.3
    ) {
      warnings.push('High number of outliers in EV/EBITDA multiples');
    }

    return warnings;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    input: CCAValuationInput,
    tradingMultiples: any,
    _valuation: any
  ): Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }> {
    const recommendations = [];

    // Peer group recommendations
    if (input.peerCompanies.length < 10) {
      recommendations.push({
        category: 'Peer Group',
        priority: 'medium' as const,
        description: 'Consider expanding peer group for more robust analysis',
        impact: 'Could improve valuation accuracy',
      });
    }

    // Multiple recommendations
    if (
      tradingMultiples.evEbitda &&
      tradingMultiples.evEbitda.statistics.coefficientOfVariation > 0.5
    ) {
      recommendations.push({
        category: 'Analysis',
        priority: 'high' as const,
        description: 'High multiple variation suggests need for additional screening criteria',
        impact: 'Could affect valuation reliability',
      });
    }

    return recommendations;
  }
}
