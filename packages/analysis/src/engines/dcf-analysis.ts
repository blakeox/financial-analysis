/**
 * Discounted Cash Flow (DCF) Valuation Engine
 * Professional-grade DCF modeling for enterprise valuation
 *
 * Implements industry-standard DCF methodology including:
 * - Weighted Average Cost of Capital (WACC) calculation
 * - Free Cash Flow projections
 * - Terminal value estimation (Gordon Growth & Exit Multiple methods)
 * - Sensitivity analysis and scenario modeling
 * - Monte Carlo simulation for probabilistic valuation
 */

import { Decimal } from 'decimal.js';
import { z } from 'zod';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const DCFValuationInputSchema = z.object({
  // Company Information
  companyData: z.object({
    name: z.string(),
    industry: z.string(),
    size: z.enum(['small', 'medium', 'large', 'enterprise']),
    country: z.string().default('US'),
    currency: z.string().default('USD'),
  }),

  // Historical Financial Data (3-5 years)
  historicalFinancials: z.object({
    revenue: z.array(
      z.object({
        year: z.number(),
        amount: z.number().min(0),
        growthRate: z.number(),
      })
    ),
    ebitda: z.array(
      z.object({
        year: z.number(),
        amount: z.number(),
        margin: z.number().min(0).max(1),
      })
    ),
    ebit: z.array(
      z.object({
        year: z.number(),
        amount: z.number(),
        margin: z.number().min(0).max(1),
      })
    ),
    netIncome: z.array(
      z.object({
        year: z.number(),
        amount: z.number(),
        margin: z.number().min(0).max(1),
      })
    ),
    capex: z.array(
      z.object({
        year: z.number(),
        amount: z.number(),
        asPercentOfRevenue: z.number().min(0).max(1),
      })
    ),
    workingCapital: z.array(
      z.object({
        year: z.number(),
        amount: z.number(),
        asPercentOfRevenue: z.number(),
      })
    ),
    depreciation: z.array(
      z.object({
        year: z.number(),
        amount: z.number(),
      })
    ),
    taxRate: z.array(
      z.object({
        year: z.number(),
        rate: z.number().min(0).max(1),
      })
    ),
  }),

  // Forecast Assumptions
  forecastAssumptions: z.object({
    forecastPeriod: z.number().min(1).max(10).default(5),
    revenueGrowth: z.object({
      year1: z.number(),
      year2: z.number(),
      year3: z.number(),
      year4: z.number(),
      year5: z.number(),
      terminalGrowth: z.number().min(0).max(0.1).default(0.025),
    }),
    ebitdaMargin: z.object({
      year1: z.number().min(0).max(1),
      year2: z.number().min(0).max(1),
      year3: z.number().min(0).max(1),
      year4: z.number().min(0).max(1),
      year5: z.number().min(0).max(1),
      terminalMargin: z.number().min(0).max(1),
    }),
    capexAsPercentOfRevenue: z.object({
      year1: z.number().min(0).max(1),
      year2: z.number().min(0).max(1),
      year3: z.number().min(0).max(1),
      year4: z.number().min(0).max(1),
      year5: z.number().min(0).max(1),
      terminalPercent: z.number().min(0).max(1),
    }),
    workingCapitalAsPercentOfRevenue: z.object({
      year1: z.number(),
      year2: z.number(),
      year3: z.number(),
      year4: z.number(),
      year5: z.number(),
      terminalPercent: z.number(),
    }),
    depreciationAsPercentOfRevenue: z.object({
      year1: z.number().min(0).max(1),
      year2: z.number().min(0).max(1),
      year3: z.number().min(0).max(1),
      year4: z.number().min(0).max(1),
      year5: z.number().min(0).max(1),
      terminalPercent: z.number().min(0).max(1),
    }),
    taxRate: z.number().min(0).max(1).default(0.25),
  }),

  // WACC Calculation
  waccInput: z.object({
    riskFreeRate: z.number().min(0).max(1).default(0.03),
    marketRiskPremium: z.number().min(0).max(1).default(0.06),
    beta: z.number().min(0).max(3).default(1.0),
    costOfDebt: z.number().min(0).max(1).default(0.05),
    debtToEquityRatio: z.number().min(0).max(5).default(0.3),
    taxRate: z.number().min(0).max(1).default(0.25),
  }),

  // Terminal Value Assumptions
  terminalValue: z.object({
    method: z.enum(['gordon-growth', 'exit-multiple']).default('gordon-growth'),
    exitMultiple: z.number().min(0).max(50).optional(),
    terminalGrowthRate: z.number().min(0).max(0.1).default(0.025),
  }),

  // Analysis Options
  analysis: z.object({
    includeSensitivity: z.boolean().default(true),
    includeScenarios: z.boolean().default(true),
    includeMonteCarlo: z.boolean().default(false),
    monteCarloSimulations: z.number().min(1000).max(100000).default(10000),
    sensitivityVariables: z.array(z.string()).default(['revenueGrowth', 'ebitdaMargin', 'wacc']),
  }),
});

export type DCFValuationInput = z.infer<typeof DCFValuationInputSchema>;

type CashFlowProjection = {
  year: number;
  revenue: number;
  ebitda: number;
  ebit: number;
  ebitdaMargin: number;
  depreciation: number;
  capex: number;
  workingCapitalChange: number;
  freeCashFlow: number;
  presentValue: number;
};

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface DCFValuationResult {
  // Core Valuation Results
  valuation: {
    enterpriseValue: number;
    equityValue: number;
    valuePerShare: number;
    sharesOutstanding: number;
    currentPrice: number;
    upsideDownside: number;
  };

  // DCF Components
  dcfComponents: {
    presentValueOfCashFlows: number;
    terminalValue: number;
    presentValueOfTerminalValue: number;
    netDebt: number;
    minorityInterests: number;
    cashAndEquivalents: number;
  };

  // WACC Calculation
  wacc: {
    costOfEquity: number;
    costOfDebt: number;
    afterTaxCostOfDebt: number;
    wacc: number;
    debtWeight: number;
    equityWeight: number;
  };

  // Cash Flow Projections
  cashFlowProjections: Array<{
    year: number;
    revenue: number;
    ebitda: number;
    ebit: number;
    ebitdaMargin: number;
    depreciation: number;
    capex: number;
    workingCapitalChange: number;
    freeCashFlow: number;
    presentValue: number;
  }>;

  // Terminal Value Analysis
  terminalValue: {
    method: string;
    terminalValue: number;
    presentValueOfTerminalValue: number;
    terminalGrowthRate: number;
    exitMultiple?: number;
  };

  // Sensitivity Analysis
  sensitivity?: {
    revenueGrowth: Array<{ rate: number; valuation: number }>;
    ebitdaMargin: Array<{ margin: number; valuation: number }>;
    wacc: Array<{ wacc: number; valuation: number }>;
    terminalGrowth: Array<{ rate: number; valuation: number }>;
  };

  // Scenario Analysis
  scenarios?: {
    baseCase: number;
    bullCase: number;
    bearCase: number;
    probabilityWeighted: number;
  };

  // Monte Carlo Results
  monteCarlo?: {
    meanValuation: number;
    medianValuation: number;
    standardDeviation: number;
    confidenceIntervals: {
      p10: number;
      p25: number;
      p75: number;
      p90: number;
    };
    probabilityOfUpside: number;
  };

  // Key Metrics
  keyMetrics: {
    revenueCAGR: number;
    ebitdaCAGR: number;
    averageEbitdaMargin: number;
    averageROIC: number;
    averageROE: number;
  };

  // Insights and Recommendations
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
    assumptions: Record<string, any>;
  };
}

// ============================================================================
// DCF VALUATION ENGINE
// ============================================================================

export class DCFValuationEngine {
  /**
   * Main DCF valuation method
   *
   * @param input - DCF valuation input parameters
   * @returns Comprehensive DCF valuation results
   */
  static analyze(input: DCFValuationInput): DCFValuationResult {
    const validated = DCFValuationInputSchema.parse(input);

    // Set precision for financial calculations
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

    // Calculate WACC
    const wacc = this.calculateWACC(validated.waccInput);

    // Generate cash flow projections
    const cashFlowProjections = this.generateCashFlowProjections(validated, wacc.wacc);

    // Calculate terminal value
    const terminalValue = this.calculateTerminalValue(validated, cashFlowProjections, wacc.wacc);

    // Calculate enterprise value
    const enterpriseValue = this.calculateEnterpriseValue(cashFlowProjections, terminalValue);

    // Calculate equity value
    const equityValue = this.calculateEquityValue(enterpriseValue, validated);

    // Calculate key metrics
    const keyMetrics = this.calculateKeyMetrics(validated, cashFlowProjections);

    // Generate insights
    const insights = this.generateInsights(validated, wacc, cashFlowProjections, terminalValue);
    const warnings = this.generateWarnings(validated, wacc, cashFlowProjections);
    const recommendations = this.generateRecommendations(validated, wacc, cashFlowProjections);

    // Perform sensitivity analysis if requested
    const sensitivity = validated.analysis.includeSensitivity
      ? this.performSensitivityAnalysis(validated, wacc.wacc)
      : undefined;

    // Perform scenario analysis if requested
    const scenarios = validated.analysis.includeScenarios
      ? this.performScenarioAnalysis(validated, wacc.wacc)
      : undefined;

    // Perform Monte Carlo analysis if requested
    const monteCarlo = validated.analysis.includeMonteCarlo
      ? this.performMonteCarloAnalysis(
          validated,
          wacc.wacc,
          validated.analysis.monteCarloSimulations
        )
      : undefined;

    const result: DCFValuationResult = {
      valuation: {
        enterpriseValue: enterpriseValue.toNumber(),
        equityValue: equityValue.toNumber(),
        valuePerShare:
          equityValue.toNumber() /
          (validated.companyData.name === 'Sample Company' ? 1000000 : 1000000), // Placeholder
        sharesOutstanding: 1000000, // Placeholder
        currentPrice: 0, // Placeholder
        upsideDownside: 0, // Placeholder
      },
      dcfComponents: {
        presentValueOfCashFlows: cashFlowProjections.reduce((sum, cf) => sum + cf.presentValue, 0),
        terminalValue: terminalValue.terminalValue,
        presentValueOfTerminalValue: terminalValue.presentValueOfTerminalValue,
        netDebt: 0, // Placeholder
        minorityInterests: 0, // Placeholder
        cashAndEquivalents: 0, // Placeholder
      },
      wacc,
      cashFlowProjections,
      terminalValue,
      keyMetrics,
      insights,
      warnings,
      recommendations,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: '1.0.0',
        methodology: 'Discounted Cash Flow Analysis',
        assumptions: validated.forecastAssumptions,
      },
    };

    if (sensitivity) {
      result.sensitivity = sensitivity;
    }
    if (scenarios) {
      result.scenarios = scenarios;
    }
    if (monteCarlo) {
      result.monteCarlo = monteCarlo;
    }

    return result;
  }

  /**
   * Calculate Weighted Average Cost of Capital (WACC)
   *
   * @param waccInput - WACC calculation parameters
   * @returns WACC calculation results
   */
  private static calculateWACC(waccInput: DCFValuationInput['waccInput']) {
    const { riskFreeRate, marketRiskPremium, beta, costOfDebt, debtToEquityRatio, taxRate } =
      waccInput;

    // Cost of Equity (CAPM)
    const costOfEquity = riskFreeRate + beta * marketRiskPremium;

    // After-tax Cost of Debt
    const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);

    // Weights
    const debtWeight = debtToEquityRatio / (1 + debtToEquityRatio);
    const equityWeight = 1 - debtWeight;

    // WACC
    const wacc = equityWeight * costOfEquity + debtWeight * afterTaxCostOfDebt;

    return {
      costOfEquity: costOfEquity,
      costOfDebt: costOfDebt,
      afterTaxCostOfDebt: afterTaxCostOfDebt,
      wacc: wacc,
      debtWeight: debtWeight,
      equityWeight: equityWeight,
    };
  }

  /**
   * Generate Free Cash Flow projections
   *
   * @param input - DCF valuation input
   * @param wacc - Weighted Average Cost of Capital
   * @returns Array of projected cash flows with present values
   */
  private static generateCashFlowProjections(
    input: DCFValuationInput,
    wacc: number
  ): CashFlowProjection[] {
    const projections: CashFlowProjection[] = [];
    const currentYear = new Date().getFullYear();
    const { forecastAssumptions, historicalFinancials } = input;

    if (historicalFinancials.revenue.length === 0) {
      throw new Error('At least one historical revenue data point is required for projections');
    }
    const latestRevenue = historicalFinancials.revenue[historicalFinancials.revenue.length - 1]!;

    for (let year = 1; year <= forecastAssumptions.forecastPeriod; year++) {
      const yearNumber = currentYear + year;

      // Revenue projection
      const revenueGrowth =
        forecastAssumptions.revenueGrowth[
          `year${year}` as keyof typeof forecastAssumptions.revenueGrowth
        ];
      const revenue = latestRevenue.amount * Math.pow(1 + revenueGrowth, year);

      // EBITDA projection
      const ebitdaMargin =
        forecastAssumptions.ebitdaMargin[
          `year${year}` as keyof typeof forecastAssumptions.ebitdaMargin
        ];
      const ebitda = revenue * ebitdaMargin;

      // Depreciation projection
      const depreciationPercent =
        forecastAssumptions.depreciationAsPercentOfRevenue[
          `year${year}` as keyof typeof forecastAssumptions.depreciationAsPercentOfRevenue
        ];
      const depreciation = revenue * depreciationPercent;

      // EBIT projection
      const ebit = ebitda - depreciation;

      // CapEx projection
      const capexPercent =
        forecastAssumptions.capexAsPercentOfRevenue[
          `year${year}` as keyof typeof forecastAssumptions.capexAsPercentOfRevenue
        ];
      const capex = revenue * capexPercent;

      // Working Capital Change
      const wcPercent =
        forecastAssumptions.workingCapitalAsPercentOfRevenue[
          `year${year}` as keyof typeof forecastAssumptions.workingCapitalAsPercentOfRevenue
        ];
      const previousRevenue = year === 1 ? latestRevenue.amount : projections[year - 2]!.revenue;
      const workingCapitalChange = revenue * wcPercent - previousRevenue * wcPercent;

      // Free Cash Flow
      const freeCashFlow =
        ebit * (1 - forecastAssumptions.taxRate) + depreciation - capex - workingCapitalChange;

      // Present Value
      const presentValue = freeCashFlow / Math.pow(1 + wacc, year);

      projections.push({
        year: yearNumber,
        revenue: revenue,
        ebitda: ebitda,
        ebit: ebit,
        ebitdaMargin: ebitdaMargin,
        depreciation: depreciation,
        capex: capex,
        workingCapitalChange: workingCapitalChange,
        freeCashFlow: freeCashFlow,
        presentValue: presentValue,
      });
    }

    return projections;
  }

  /**
   * Calculate terminal value
   */
  private static calculateTerminalValue(
    input: DCFValuationInput,
    projections: any[],
    wacc: number
  ) {
    const { terminalValue: tvInput, forecastAssumptions } = input;
    const lastProjection = projections[projections.length - 1];
    if (!lastProjection) {
      throw new Error('At least one projection is required to compute terminal value');
    }

    let terminalValue = 0;
    let method = '';

    if (tvInput.method === 'gordon-growth') {
      // Gordon Growth Model
      const terminalGrowthRate = tvInput.terminalGrowthRate;
      const terminalFCF = lastProjection.freeCashFlow * (1 + terminalGrowthRate);
      terminalValue = terminalFCF / (wacc - terminalGrowthRate);
      method = 'Gordon Growth Model';
    } else if (tvInput.method === 'exit-multiple' && tvInput.exitMultiple) {
      // Exit Multiple Method
      const terminalEBITDA = lastProjection.ebitda;
      terminalValue = terminalEBITDA * tvInput.exitMultiple;
      method = 'Exit Multiple Method';
    }

    const presentValueOfTerminalValue =
      terminalValue / Math.pow(1 + wacc, forecastAssumptions.forecastPeriod);

    return {
      method,
      terminalValue,
      presentValueOfTerminalValue,
      terminalGrowthRate: tvInput.terminalGrowthRate ?? 0,
      ...(tvInput.exitMultiple ? { exitMultiple: tvInput.exitMultiple } : {}),
    };
  }

  /**
   * Calculate enterprise value
   */
  private static calculateEnterpriseValue(projections: any[], terminalValue: any) {
    const presentValueOfCashFlows = projections.reduce((sum, cf) => sum + cf.presentValue, 0);
    return new Decimal(presentValueOfCashFlows + terminalValue.presentValueOfTerminalValue);
  }

  /**
   * Calculate equity value
   */
  private static calculateEquityValue(enterpriseValue: Decimal, _input: DCFValuationInput) {
    // Simplified calculation - in practice, would subtract net debt, add cash, etc.
    return enterpriseValue;
  }

  /**
   * Calculate key metrics
   */
  private static calculateKeyMetrics(input: DCFValuationInput, _projections: any[]) {
    const { historicalFinancials } = input;

    // Revenue CAGR
    const revenueHistory = historicalFinancials.revenue;
    let revenueCAGR = 0;
    if (revenueHistory.length >= 2) {
      const firstRevenue = revenueHistory[0]!.amount;
      const lastRevenue = revenueHistory[revenueHistory.length - 1]!.amount;
      if (firstRevenue > 0) {
        revenueCAGR = Math.pow(lastRevenue / firstRevenue, 1 / (revenueHistory.length - 1)) - 1;
      }
    }

    // EBITDA CAGR
    const ebitdaHistory = historicalFinancials.ebitda;
    let ebitdaCAGR = 0;
    if (ebitdaHistory.length >= 2) {
      const firstEBITDA = ebitdaHistory[0]!.amount;
      const lastEBITDA = ebitdaHistory[ebitdaHistory.length - 1]!.amount;
      if (firstEBITDA !== 0) {
        ebitdaCAGR = Math.pow(lastEBITDA / firstEBITDA, 1 / (ebitdaHistory.length - 1)) - 1;
      }
    }

    // Average EBITDA Margin
    const averageEbitdaMargin =
      ebitdaHistory.length > 0
        ? ebitdaHistory.reduce((sum, e) => sum + e.margin, 0) / ebitdaHistory.length
        : 0;

    return {
      revenueCAGR,
      ebitdaCAGR,
      averageEbitdaMargin,
      averageROIC: 0, // Placeholder
      averageROE: 0, // Placeholder
    };
  }

  /**
   * Generate insights
   */
  private static generateInsights(
    input: DCFValuationInput,
    wacc: any,
    _projections: any[],
    _terminalValue: any
  ): string[] {
    const insights = [];

    // WACC insights
    if (wacc.wacc < 0.08) {
      insights.push('Low cost of capital suggests strong credit profile and stable cash flows');
    } else if (wacc.wacc > 0.15) {
      insights.push('High cost of capital indicates elevated risk profile');
    }

    // Growth insights
    const avgGrowth =
      Object.values(input.forecastAssumptions.revenueGrowth).reduce((sum, rate) => sum + rate, 0) /
      5;
    if (avgGrowth > 0.1) {
      insights.push(
        'High growth assumptions require careful validation of market size and competitive position'
      );
    }

    // Margin insights
    const avgMargin =
      Object.values(input.forecastAssumptions.ebitdaMargin).reduce(
        (sum, margin) => sum + margin,
        0
      ) / 5;
    if (avgMargin > 0.3) {
      insights.push('High EBITDA margins suggest strong competitive advantages');
    }

    return insights;
  }

  /**
   * Generate warnings
   */
  private static generateWarnings(
    input: DCFValuationInput,
    wacc: any,
    _projections: any[]
  ): string[] {
    const warnings = [];

    // Terminal value warnings
    if (input.terminalValue.terminalGrowthRate > 0.05) {
      warnings.push('High terminal growth rate may be unrealistic for mature companies');
    }

    // WACC warnings
    if (wacc.wacc < input.waccInput.riskFreeRate) {
      warnings.push('WACC below risk-free rate indicates potential calculation error');
    }

    // Growth warnings
    const maxGrowth = Math.max(...Object.values(input.forecastAssumptions.revenueGrowth));
    if (maxGrowth > 0.5) {
      warnings.push('Very high growth assumptions require strong justification');
    }

    return warnings;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    input: DCFValuationInput,
    _wacc: any,
    _projections: any[]
  ): Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }> {
    const recommendations = [];

    // Beta recommendations
    if (input.waccInput.beta < 0.5) {
      recommendations.push({
        category: 'Risk Assessment',
        priority: 'medium' as const,
        description: 'Consider validating low beta assumption with industry peers',
        impact: 'Could affect cost of equity calculation',
      });
    }

    // Growth recommendations
    const avgGrowth =
      Object.values(input.forecastAssumptions.revenueGrowth).reduce((sum, rate) => sum + rate, 0) /
      5;
    if (avgGrowth > 0.2) {
      recommendations.push({
        category: 'Growth Assumptions',
        priority: 'high' as const,
        description: 'High growth assumptions should be stress-tested',
        impact: 'Significant impact on valuation',
      });
    }

    return recommendations;
  }

  /**
   * Perform sensitivity analysis
   */
  private static performSensitivityAnalysis(input: DCFValuationInput, baseWacc: number) {
    const sensitivity = {
      revenueGrowth: [] as Array<{ rate: number; valuation: number }>,
      ebitdaMargin: [] as Array<{ margin: number; valuation: number }>,
      wacc: [] as Array<{ wacc: number; valuation: number }>,
      terminalGrowth: [] as Array<{ rate: number; valuation: number }>,
    };

    // Revenue growth sensitivity
    for (let rate = -0.1; rate <= 0.3; rate += 0.05) {
      const modifiedInput = { ...input };
      Object.keys(modifiedInput.forecastAssumptions.revenueGrowth).forEach((key) => {
        (modifiedInput.forecastAssumptions.revenueGrowth as any)[key] = rate;
      });

      const projections = this.generateCashFlowProjections(modifiedInput, baseWacc);
      const terminalValue = this.calculateTerminalValue(modifiedInput, projections, baseWacc);
      const enterpriseValue = this.calculateEnterpriseValue(projections, terminalValue);

      sensitivity.revenueGrowth.push({
        rate: rate,
        valuation: enterpriseValue.toNumber(),
      });
    }

    // WACC sensitivity
    for (let wacc = baseWacc - 0.02; wacc <= baseWacc + 0.02; wacc += 0.005) {
      const projections = this.generateCashFlowProjections(input, wacc);
      const terminalValue = this.calculateTerminalValue(input, projections, wacc);
      const enterpriseValue = this.calculateEnterpriseValue(projections, terminalValue);

      sensitivity.wacc.push({
        wacc: wacc,
        valuation: enterpriseValue.toNumber(),
      });
    }

    return sensitivity;
  }

  /**
   * Perform scenario analysis
   */
  private static performScenarioAnalysis(input: DCFValuationInput, baseWacc: number) {
    // Base case
    const baseProjections = this.generateCashFlowProjections(input, baseWacc);
    const baseTerminalValue = this.calculateTerminalValue(input, baseProjections, baseWacc);
    const baseCase = this.calculateEnterpriseValue(baseProjections, baseTerminalValue).toNumber();

    // Bull case (higher growth, better margins)
    const bullInput = { ...input };
    Object.keys(bullInput.forecastAssumptions.revenueGrowth).forEach((key) => {
      (bullInput.forecastAssumptions.revenueGrowth as any)[key] *= 1.2;
    });
    Object.keys(bullInput.forecastAssumptions.ebitdaMargin).forEach((key) => {
      (bullInput.forecastAssumptions.ebitdaMargin as any)[key] *= 1.1;
    });

    const bullProjections = this.generateCashFlowProjections(bullInput, baseWacc);
    const bullTerminalValue = this.calculateTerminalValue(bullInput, bullProjections, baseWacc);
    const bullCase = this.calculateEnterpriseValue(bullProjections, bullTerminalValue).toNumber();

    // Bear case (lower growth, worse margins)
    const bearInput = { ...input };
    Object.keys(bearInput.forecastAssumptions.revenueGrowth).forEach((key) => {
      (bearInput.forecastAssumptions.revenueGrowth as any)[key] *= 0.8;
    });
    Object.keys(bearInput.forecastAssumptions.ebitdaMargin).forEach((key) => {
      (bearInput.forecastAssumptions.ebitdaMargin as any)[key] *= 0.9;
    });

    const bearProjections = this.generateCashFlowProjections(bearInput, baseWacc);
    const bearTerminalValue = this.calculateTerminalValue(bearInput, bearProjections, baseWacc);
    const bearCase = this.calculateEnterpriseValue(bearProjections, bearTerminalValue).toNumber();

    return {
      baseCase,
      bullCase,
      bearCase,
      probabilityWeighted: baseCase * 0.5 + bullCase * 0.25 + bearCase * 0.25,
    };
  }

  /**
   * Perform Monte Carlo analysis
   */
  private static performMonteCarloAnalysis(
    input: DCFValuationInput,
    baseWacc: number,
    simulations: number
  ) {
    const valuations: number[] = [];

    for (let i = 0; i < simulations; i++) {
      // Randomize key variables
      const randomInput = { ...input };

      // Randomize revenue growth (±20% of base case)
      Object.keys(randomInput.forecastAssumptions.revenueGrowth).forEach((key) => {
        const baseValue = (randomInput.forecastAssumptions.revenueGrowth as any)[key];
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        (randomInput.forecastAssumptions.revenueGrowth as any)[key] = baseValue * randomFactor;
      });

      // Randomize EBITDA margins (±10% of base case)
      Object.keys(randomInput.forecastAssumptions.ebitdaMargin).forEach((key) => {
        const baseValue = (randomInput.forecastAssumptions.ebitdaMargin as any)[key];
        const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
        (randomInput.forecastAssumptions.ebitdaMargin as any)[key] = baseValue * randomFactor;
      });

      // Randomize WACC (±1% of base case)
      const randomWacc = baseWacc * (0.95 + Math.random() * 0.1); // ±5%

      const projections = this.generateCashFlowProjections(randomInput, randomWacc);
      const terminalValue = this.calculateTerminalValue(randomInput, projections, randomWacc);
      const enterpriseValue = this.calculateEnterpriseValue(projections, terminalValue);

      valuations.push(enterpriseValue.toNumber());
    }

    if (valuations.length === 0) {
      return {
        meanValuation: 0,
        medianValuation: 0,
        standardDeviation: 0,
        confidenceIntervals: { p10: 0, p25: 0, p75: 0, p90: 0 },
        probabilityOfUpside: 0,
      };
    }

    // Calculate statistics
    valuations.sort((a, b) => a - b);
    const mean = valuations.reduce((sum, val) => sum + val, 0) / valuations.length;
    const median = valuations[Math.floor(valuations.length / 2)]!;
    const stdDev = Math.sqrt(
      valuations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / valuations.length
    );
    const pickPercentile = (ratio: number) =>
      valuations[Math.min(valuations.length - 1, Math.floor(valuations.length * ratio))]!;

    return {
      meanValuation: mean,
      medianValuation: median,
      standardDeviation: stdDev,
      confidenceIntervals: {
        p10: pickPercentile(0.1),
        p25: pickPercentile(0.25),
        p75: pickPercentile(0.75),
        p90: pickPercentile(0.9),
      },
      probabilityOfUpside: valuations.filter((val) => val > mean).length / valuations.length,
    };
  }
}
