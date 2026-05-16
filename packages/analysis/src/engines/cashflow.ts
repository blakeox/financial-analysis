import { Decimal } from 'decimal.js';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface CashFlowItem {
  period: number; // Period number (0 = initial, 1 = first period, etc.)
  date?: string | undefined; // ISO date string
  cashFlow: number; // Cash flow amount (positive = inflow, negative = outflow)
  description?: string | undefined;
  category?: CashFlowCategory | undefined;
  taxRate?: number | undefined; // Tax rate applied to this cash flow
  inflationAdjusted?: boolean | undefined;
  probabilistic?:
    | {
        bestCase: number;
        worstCase: number;
        probability: number; // Probability of occurrence (0-1)
      }
    | undefined;
}

export type CashFlowCategory =
  | 'revenue'
  | 'operating-expense'
  | 'capital-expenditure'
  | 'tax'
  | 'depreciation'
  | 'working-capital'
  | 'financing'
  | 'terminal-value'
  | 'other';

export interface DiscountingParameters {
  discountRate: number; // Required rate of return (WACC)
  riskFreeRate: number; // Risk-free rate for CAPM calculations
  marketRiskPremium: number; // Market risk premium
  beta?: number; // Beta for equity cost calculation
  terminalGrowthRate: number; // Perpetual growth rate for terminal value
  taxRate: number; // Corporate tax rate
}

export interface SensitivityAnalysis {
  parameter: string;
  baseValue: number;
  scenarios: Array<{
    label: string;
    value: number;
    npv: number;
    irr: number;
    paybackPeriod: number;
  }>;
  tornadoChart: Array<{
    parameter: string;
    impact: number; // NPV impact from -10% to +10% change
    lowValue: number;
    highValue: number;
  }>;
}

export interface DCFValuationResult {
  // Core DCF Results
  npv: number; // Net Present Value
  irr: number; // Internal Rate of Return
  mirr: number; // Modified Internal Rate of Return
  paybackPeriod: number; // Simple payback period in years
  discountedPaybackPeriod: number; // Discounted payback period
  profitabilityIndex: number; // PI = PV of cash flows / Initial investment

  // Advanced Metrics
  equivalentAnnuity: number; // Equivalent annual annuity
  capitalRecoveryFactor: number;
  presentValueRatio: number;
  futureValue: number; // Terminal value of all cash flows

  // Detailed Analysis
  cashFlowSummary: {
    totalInflows: number;
    totalOutflows: number;
    netCashFlow: number;
    peakCumulativeCashFlow: number;
    worstCumulativeCashFlow: number;
  };

  // Period-by-period breakdown
  detailedCashFlows: Array<{
    period: number;
    date?: string | undefined;
    originalCashFlow: number;
    presentValue: number;
    cumulativePV: number;
    discountFactor: number;
    inflationAdjustedCF?: number | undefined;
  }>;

  // Risk Analysis
  sensitivity: SensitivityAnalysis[];
  scenarios: Array<{
    name: string;
    probability: number;
    npv: number;
    irr: number;
    description: string;
  }>;

  // Terminal Value Analysis
  terminalValue: {
    method: 'perpetual-growth' | 'exit-multiple' | 'explicit';
    value: number;
    presentValue: number;
    growthRate?: number | undefined;
    multiple?: number | undefined;
  };
}

export interface ProjectComparison {
  projects: Array<{
    name: string;
    npv: number;
    irr: number;
    paybackPeriod: number;
    profitabilityIndex: number;
    capitalRequired: number;
    ranking: number;
  }>;

  mutuallyExclusive: {
    recommended: string;
    reason: string;
    npvDifference?: number | undefined;
    incrementalIRR?: number | undefined;
  };

  capitalRationing: {
    budgetConstraint: number;
    optimalPortfolio: string[];
    totalNPV: number;
    totalCapitalUsed: number;
    efficiencyRatio: number;
  };
}

// Input Schemas
export const CashFlowItemSchema = z.object({
  period: z.number().int().min(0),
  date: z.string().optional(),
  cashFlow: z.number(),
  description: z.string().optional(),
  category: z
    .enum([
      'revenue',
      'operating-expense',
      'capital-expenditure',
      'tax',
      'depreciation',
      'working-capital',
      'financing',
      'terminal-value',
      'other',
    ])
    .optional(),
  taxRate: z.number().min(0).max(1).optional(),
  inflationAdjusted: z.boolean().optional().default(false),
  probabilistic: z
    .object({
      bestCase: z.number(),
      worstCase: z.number(),
      probability: z.number().min(0).max(1),
    })
    .optional(),
});

export const DiscountingParametersSchema = z.object({
  discountRate: z.number().min(0).max(1),
  riskFreeRate: z.number().min(0).max(1).default(0.03),
  marketRiskPremium: z.number().min(0).max(1).default(0.08),
  beta: z.number().min(0).max(5).optional(),
  terminalGrowthRate: z.number().min(0).max(0.1).default(0.03),
  taxRate: z.number().min(0).max(1).default(0.25),
});

export const CashFlowInputSchema = z.object({
  cashFlows: z.array(CashFlowItemSchema).min(1),
  discounting: DiscountingParametersSchema,
  analysis: z
    .object({
      includeTerminalValue: z.boolean().default(true),
      terminalValueMethod: z
        .enum(['perpetual-growth', 'exit-multiple', 'explicit'])
        .default('perpetual-growth'),
      exitMultiple: z.number().positive().optional(),
      inflationRate: z.number().min(0).max(0.2).default(0.03),
      includeSensitivity: z.boolean().default(true),
      sensitivityParameters: z
        .array(z.string())
        .default(['discountRate', 'terminalGrowthRate', 'cashFlows']),
      includeScenarios: z.boolean().default(true),
      reinvestmentRate: z.number().min(0).max(1).optional(), // For MIRR calculation
    })
    .default({
      includeTerminalValue: true,
      terminalValueMethod: 'perpetual-growth',
      inflationRate: 0.03,
      includeSensitivity: true,
      sensitivityParameters: ['discountRate', 'terminalGrowthRate', 'cashFlows'],
      includeScenarios: true,
    }),
  project: z
    .object({
      name: z.string().default('Investment Project'),
      description: z.string().optional(),
      startDate: z.string().optional(),
      currency: z.string().default('USD'),
    })
    .optional()
    .default({ name: 'Investment Project', currency: 'USD' }),
});

export type CashFlowInput = z.infer<typeof CashFlowInputSchema>;

// ============================================================================
// CASH FLOW ANALYZER CLASS
// ============================================================================

export class CashFlowAnalyzer {
  /**
   * Main DCF analysis method
   */
  static analyze(input: CashFlowInput): DCFValuationResult {
    const parsed = CashFlowInputSchema.parse(input);
    const { cashFlows, discounting, analysis } = parsed;

    // Sort cash flows by period
    const sortedCashFlows = [...cashFlows].sort((a, b) => a.period - b.period);

    // Apply inflation adjustments if needed
    const adjustedCashFlows = this.applyInflationAdjustments(
      sortedCashFlows,
      analysis.inflationRate
    );

    // Add terminal value if specified
    const cashFlowsWithTerminal = analysis.includeTerminalValue
      ? this.addTerminalValue(adjustedCashFlows, discounting, analysis)
      : adjustedCashFlows;

    // Calculate core DCF metrics
    const npv = this.calculateNPV(cashFlowsWithTerminal, discounting.discountRate);
    const irr = this.calculateIRR(cashFlowsWithTerminal);
    const mirr = this.calculateMIRR(
      cashFlowsWithTerminal,
      discounting.discountRate,
      analysis.reinvestmentRate ?? discounting.discountRate
    );

    // Calculate payback periods
    const paybackPeriod = this.calculatePaybackPeriod(cashFlowsWithTerminal);
    const discountedPaybackPeriod = this.calculateDiscountedPaybackPeriod(
      cashFlowsWithTerminal,
      discounting.discountRate
    );

    // Calculate additional metrics
    const profitabilityIndex = this.calculateProfitabilityIndex(
      cashFlowsWithTerminal,
      discounting.discountRate
    );
    const equivalentAnnuity = this.calculateEquivalentAnnuity(
      npv,
      discounting.discountRate,
      cashFlowsWithTerminal.length
    );
    const futureValue = this.calculateFutureValue(cashFlowsWithTerminal, discounting.discountRate);

    // Generate detailed cash flow breakdown
    const detailedCashFlows = this.generateDetailedCashFlows(
      cashFlowsWithTerminal,
      discounting.discountRate
    );

    // Calculate cash flow summary
    const cashFlowSummary = this.calculateCashFlowSummary(cashFlowsWithTerminal);

    // Perform sensitivity analysis
    const sensitivity = analysis.includeSensitivity
      ? this.performSensitivityAnalysis(
          cashFlowsWithTerminal,
          discounting,
          analysis.sensitivityParameters
        )
      : [];

    // Generate scenarios
    const scenarios = analysis.includeScenarios
      ? this.generateScenarios(cashFlowsWithTerminal, discounting)
      : [];

    // Terminal value analysis
    const terminalValue = this.analyzeTerminalValue(cashFlowsWithTerminal, discounting, analysis);

    return {
      npv: Number(new Decimal(npv).toDecimalPlaces(2)),
      irr: Number(new Decimal(irr).toDecimalPlaces(4)),
      mirr: Number(new Decimal(mirr).toDecimalPlaces(4)),
      paybackPeriod: Number(new Decimal(paybackPeriod).toDecimalPlaces(2)),
      discountedPaybackPeriod: Number(new Decimal(discountedPaybackPeriod).toDecimalPlaces(2)),
      profitabilityIndex: Number(new Decimal(profitabilityIndex).toDecimalPlaces(4)),
      equivalentAnnuity: Number(new Decimal(equivalentAnnuity).toDecimalPlaces(2)),
      capitalRecoveryFactor: Number(
        new Decimal(
          this.calculateCRF(discounting.discountRate, cashFlowsWithTerminal.length)
        ).toDecimalPlaces(6)
      ),
      presentValueRatio: npv / Math.abs(cashFlowsWithTerminal[0]?.cashFlow ?? 1),
      futureValue: Number(new Decimal(futureValue).toDecimalPlaces(2)),
      cashFlowSummary,
      detailedCashFlows,
      sensitivity,
      scenarios,
      terminalValue,
    };
  }

  /**
   * Apply inflation adjustments to cash flows
   */
  private static applyInflationAdjustments(
    cashFlows: CashFlowItem[],
    inflationRate: number
  ): CashFlowItem[] {
    return cashFlows.map((cf) => {
      if (cf.inflationAdjusted === false || cf.period === 0) {
        return cf; // No adjustment for period 0 or explicitly non-adjusted flows
      }

      const inflationFactor = Math.pow(1 + inflationRate, cf.period);
      return {
        ...cf,
        cashFlow: cf.cashFlow * inflationFactor,
      };
    });
  }

  /**
   * Add terminal value to cash flows
   */
  private static addTerminalValue(
    cashFlows: CashFlowItem[],
    discounting: z.infer<typeof DiscountingParametersSchema>,
    analysis: NonNullable<CashFlowInput['analysis']>
  ): CashFlowItem[] {
    const lastPeriod = Math.max(...cashFlows.map((cf) => cf.period));
    let terminalValue = 0;

    switch (analysis.terminalValueMethod) {
      case 'perpetual-growth': {
        // Gordon Growth Model: CF * (1 + g) / (r - g)
        const lastOperatingCF = this.getLastOperatingCashFlow(cashFlows);
        if (lastOperatingCF > 0 && discounting.discountRate > discounting.terminalGrowthRate) {
          terminalValue =
            (lastOperatingCF * (1 + discounting.terminalGrowthRate)) /
            (discounting.discountRate - discounting.terminalGrowthRate);
        }
        break;
      }

      case 'exit-multiple': {
        if (analysis.exitMultiple) {
          const lastRevenue = this.getLastRevenueFlow(cashFlows);
          terminalValue = lastRevenue * analysis.exitMultiple;
        }
        break;
      }

      case 'explicit':
        // Terminal value already included in explicit cash flows
        return cashFlows;
    }

    if (terminalValue > 0) {
      return [
        ...cashFlows,
        {
          period: lastPeriod + 1,
          cashFlow: terminalValue,
          description: 'Terminal Value',
          category: 'terminal-value',
        },
      ];
    }

    return cashFlows;
  }

  /**
   * Get last operating cash flow for terminal value calculation
   */
  private static getLastOperatingCashFlow(cashFlows: CashFlowItem[]): number {
    const operatingFlows = cashFlows
      .filter((cf) => cf.category === 'revenue' || cf.category === 'operating-expense')
      .sort((a, b) => b.period - a.period);

    return operatingFlows.reduce((net, cf) => net + cf.cashFlow, 0);
  }

  /**
   * Get last revenue flow for exit multiple calculation
   */
  private static getLastRevenueFlow(cashFlows: CashFlowItem[]): number {
    const revenueFlows = cashFlows
      .filter((cf) => cf.category === 'revenue')
      .sort((a, b) => b.period - a.period);

    return revenueFlows[0]?.cashFlow ?? 0;
  }

  /**
   * Calculate Net Present Value
   */
  private static calculateNPV(cashFlows: CashFlowItem[], discountRate: number): number {
    return cashFlows.reduce((npv, cf) => {
      const pv = cf.cashFlow / Math.pow(1 + discountRate, cf.period);
      return npv + pv;
    }, 0);
  }

  /**
   * Calculate Internal Rate of Return using Newton-Raphson method
   */
  private static calculateIRR(cashFlows: CashFlowItem[]): number {
    // Initial guess
    let irr = 0.1;
    const tolerance = 1e-6;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      const npv = this.calculateNPV(cashFlows, irr);
      const npvDerivative = this.calculateNPVDerivative(cashFlows, irr);

      if (Math.abs(npv) < tolerance) {
        return irr;
      }

      if (Math.abs(npvDerivative) < tolerance) {
        break; // Derivative too small, avoid division by zero
      }

      const newIrr = irr - npv / npvDerivative;

      if (Math.abs(newIrr - irr) < tolerance) {
        return newIrr;
      }

      irr = newIrr;
    }

    return irr; // Return best estimate if convergence not achieved
  }

  /**
   * Calculate derivative of NPV for IRR calculation
   */
  private static calculateNPVDerivative(cashFlows: CashFlowItem[], rate: number): number {
    return cashFlows.reduce((derivative, cf) => {
      if (cf.period === 0) return derivative;
      const term = (-cf.period * cf.cashFlow) / Math.pow(1 + rate, cf.period + 1);
      return derivative + term;
    }, 0);
  }

  /**
   * Calculate Modified Internal Rate of Return
   */
  private static calculateMIRR(
    cashFlows: CashFlowItem[],
    discountRate: number,
    reinvestmentRate: number
  ): number {
    const positiveFlows = cashFlows.filter((cf) => cf.cashFlow > 0);
    const negativeFlows = cashFlows.filter((cf) => cf.cashFlow < 0);

    if (positiveFlows.length === 0 || negativeFlows.length === 0) {
      return this.calculateIRR(cashFlows); // Fall back to IRR
    }

    const lastPeriod = Math.max(...cashFlows.map((cf) => cf.period));

    // Future value of positive cash flows at reinvestment rate
    const fvPositive = positiveFlows.reduce((fv, cf) => {
      return fv + cf.cashFlow * Math.pow(1 + reinvestmentRate, lastPeriod - cf.period);
    }, 0);

    // Present value of negative cash flows at discount rate
    const pvNegative = Math.abs(
      negativeFlows.reduce((pv, cf) => {
        return pv + cf.cashFlow / Math.pow(1 + discountRate, cf.period);
      }, 0)
    );

    // MIRR = (FV_positive / PV_negative)^(1/n) - 1
    return Math.pow(fvPositive / pvNegative, 1 / lastPeriod) - 1;
  }

  /**
   * Calculate simple payback period
   */
  private static calculatePaybackPeriod(cashFlows: CashFlowItem[]): number {
    let cumulativeCF = 0;
    const sortedFlows = [...cashFlows].sort((a, b) => a.period - b.period);

    for (let i = 0; i < sortedFlows.length; i++) {
      cumulativeCF += sortedFlows[i]!.cashFlow;

      if (cumulativeCF >= 0) {
        // Interpolate within the period for more precision
        const previousCumulative = cumulativeCF - sortedFlows[i]!.cashFlow;
        const periodCashFlow = sortedFlows[i]!.cashFlow;

        if (periodCashFlow !== 0) {
          const fraction = -previousCumulative / periodCashFlow;
          return sortedFlows[i]!.period - 1 + fraction;
        }

        return sortedFlows[i]!.period;
      }
    }

    return Infinity; // Never pays back
  }

  /**
   * Calculate discounted payback period
   */
  private static calculateDiscountedPaybackPeriod(
    cashFlows: CashFlowItem[],
    discountRate: number
  ): number {
    let cumulativePV = 0;
    const sortedFlows = [...cashFlows].sort((a, b) => a.period - b.period);

    for (let i = 0; i < sortedFlows.length; i++) {
      const pv = sortedFlows[i]!.cashFlow / Math.pow(1 + discountRate, sortedFlows[i]!.period);
      cumulativePV += pv;

      if (cumulativePV >= 0) {
        // Interpolate within the period
        const previousCumulative = cumulativePV - pv;

        if (pv !== 0) {
          const fraction = -previousCumulative / pv;
          return sortedFlows[i]!.period - 1 + fraction;
        }

        return sortedFlows[i]!.period;
      }
    }

    return Infinity; // Never pays back
  }

  /**
   * Calculate profitability index
   */
  private static calculateProfitabilityIndex(
    cashFlows: CashFlowItem[],
    discountRate: number
  ): number {
    const initialInvestment = Math.abs(
      cashFlows
        .filter((cf) => cf.period === 0)
        .reduce((sum, cf) => sum + Math.min(0, cf.cashFlow), 0)
    );

    const pvOfInflows = cashFlows
      .filter((cf) => cf.period > 0 && cf.cashFlow > 0)
      .reduce((pv, cf) => {
        return pv + cf.cashFlow / Math.pow(1 + discountRate, cf.period);
      }, 0);

    return initialInvestment > 0 ? pvOfInflows / initialInvestment : 0;
  }

  /**
   * Calculate equivalent annuity
   */
  private static calculateEquivalentAnnuity(
    npv: number,
    discountRate: number,
    periods: number
  ): number {
    if (periods === 0 || discountRate === 0) return 0;

    const crf = this.calculateCRF(discountRate, periods);
    return npv * crf;
  }

  /**
   * Calculate Capital Recovery Factor
   */
  private static calculateCRF(rate: number, periods: number): number {
    if (rate === 0) return 1 / periods;
    return (rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1);
  }

  /**
   * Calculate future value of all cash flows
   */
  private static calculateFutureValue(cashFlows: CashFlowItem[], discountRate: number): number {
    const lastPeriod = Math.max(...cashFlows.map((cf) => cf.period));

    return cashFlows.reduce((fv, cf) => {
      return fv + cf.cashFlow * Math.pow(1 + discountRate, lastPeriod - cf.period);
    }, 0);
  }

  /**
   * Generate detailed cash flow breakdown
   */
  private static generateDetailedCashFlows(cashFlows: CashFlowItem[], discountRate: number) {
    let cumulativePV = 0;

    return cashFlows
      .sort((a, b) => a.period - b.period)
      .map((cf) => {
        const discountFactor = 1 / Math.pow(1 + discountRate, cf.period);
        const presentValue = cf.cashFlow * discountFactor;
        cumulativePV += presentValue;

        return {
          period: cf.period,
          date: cf.date,
          originalCashFlow: Number(new Decimal(cf.cashFlow).toDecimalPlaces(2)),
          presentValue: Number(new Decimal(presentValue).toDecimalPlaces(2)),
          cumulativePV: Number(new Decimal(cumulativePV).toDecimalPlaces(2)),
          discountFactor: Number(new Decimal(discountFactor).toDecimalPlaces(6)),
          inflationAdjustedCF: cf.inflationAdjusted ? cf.cashFlow : undefined,
        };
      });
  }

  /**
   * Calculate cash flow summary statistics
   */
  private static calculateCashFlowSummary(cashFlows: CashFlowItem[]) {
    const inflows = cashFlows.filter((cf) => cf.cashFlow > 0);
    const outflows = cashFlows.filter((cf) => cf.cashFlow < 0);

    const totalInflows = inflows.reduce((sum, cf) => sum + cf.cashFlow, 0);
    const totalOutflows = Math.abs(outflows.reduce((sum, cf) => sum + cf.cashFlow, 0));
    const netCashFlow = totalInflows - totalOutflows;

    // Calculate cumulative cash flows to find peaks
    let cumulativeCF = 0;
    let peakCumulative = 0;
    let worstCumulative = 0;

    const sortedFlows = [...cashFlows].sort((a, b) => a.period - b.period);
    for (const cf of sortedFlows) {
      cumulativeCF += cf.cashFlow;
      peakCumulative = Math.max(peakCumulative, cumulativeCF);
      worstCumulative = Math.min(worstCumulative, cumulativeCF);
    }

    return {
      totalInflows: Number(new Decimal(totalInflows).toDecimalPlaces(2)),
      totalOutflows: Number(new Decimal(totalOutflows).toDecimalPlaces(2)),
      netCashFlow: Number(new Decimal(netCashFlow).toDecimalPlaces(2)),
      peakCumulativeCashFlow: Number(new Decimal(peakCumulative).toDecimalPlaces(2)),
      worstCumulativeCashFlow: Number(new Decimal(worstCumulative).toDecimalPlaces(2)),
    };
  }

  /**
   * Perform sensitivity analysis
   */
  private static performSensitivityAnalysis(
    cashFlows: CashFlowItem[],
    discounting: z.infer<typeof DiscountingParametersSchema>,
    parameters: string[]
  ): SensitivityAnalysis[] {
    const baseNPV = this.calculateNPV(cashFlows, discounting.discountRate);

    const results: SensitivityAnalysis[] = [];

    for (const param of parameters) {
      const scenarios = this.generateParameterScenarios(param, discounting, cashFlows);

      const analysis: SensitivityAnalysis = {
        parameter: param,
        baseValue: this.getParameterValue(param, discounting, cashFlows),
        scenarios: scenarios.map((scenario) => ({
          label: scenario.label,
          value: scenario.value,
          npv: Number(new Decimal(scenario.npv).toDecimalPlaces(2)),
          irr: Number(new Decimal(scenario.irr).toDecimalPlaces(4)),
          paybackPeriod: Number(new Decimal(scenario.payback).toDecimalPlaces(2)),
        })),
        tornadoChart: [
          {
            parameter: param,
            impact: 0, // Will be calculated based on scenario range
            lowValue: scenarios[0]?.value ?? 0,
            highValue: scenarios[scenarios.length - 1]?.value ?? 0,
          },
        ],
      };

      // Calculate tornado impact
      const lowNPV = scenarios[0]?.npv ?? baseNPV;
      const highNPV = scenarios[scenarios.length - 1]?.npv ?? baseNPV;
      analysis.tornadoChart[0]!.impact = Number(new Decimal(highNPV - lowNPV).toDecimalPlaces(2));

      results.push(analysis);
    }

    return results;
  }

  /**
   * Generate parameter scenarios for sensitivity analysis
   */
  private static generateParameterScenarios(
    parameter: string,
    discounting: z.infer<typeof DiscountingParametersSchema>,
    cashFlows: CashFlowItem[]
  ) {
    const variations = [-0.2, -0.1, 0, 0.1, 0.2]; // -20%, -10%, base, +10%, +20%

    return variations.map((variation) => {
      let modifiedDiscounting = { ...discounting };
      let modifiedCashFlows = [...cashFlows];

      switch (parameter) {
        case 'discountRate':
          modifiedDiscounting.discountRate = discounting.discountRate * (1 + variation);
          break;
        case 'terminalGrowthRate':
          modifiedDiscounting.terminalGrowthRate = discounting.terminalGrowthRate * (1 + variation);
          break;
        case 'cashFlows':
          modifiedCashFlows = cashFlows.map((cf) => ({
            ...cf,
            cashFlow: cf.period === 0 ? cf.cashFlow : cf.cashFlow * (1 + variation),
          }));
          break;
      }

      const npv = this.calculateNPV(modifiedCashFlows, modifiedDiscounting.discountRate);
      const irr = this.calculateIRR(modifiedCashFlows);
      const payback = this.calculatePaybackPeriod(modifiedCashFlows);

      return {
        label: `${variation >= 0 ? '+' : ''}${(variation * 100).toFixed(0)}%`,
        value: this.getParameterValue(parameter, modifiedDiscounting, modifiedCashFlows),
        npv,
        irr,
        payback,
      };
    });
  }

  /**
   * Get current value of a parameter
   */
  private static getParameterValue(
    parameter: string,
    discounting: z.infer<typeof DiscountingParametersSchema>,
    cashFlows: CashFlowItem[]
  ): number {
    switch (parameter) {
      case 'discountRate':
        return discounting.discountRate;
      case 'terminalGrowthRate':
        return discounting.terminalGrowthRate;
      case 'cashFlows':
        return cashFlows.reduce((sum, cf) => sum + (cf.period > 0 ? cf.cashFlow : 0), 0);
      default:
        return 0;
    }
  }

  /**
   * Generate scenarios for Monte Carlo-style analysis
   */
  private static generateScenarios(
    cashFlows: CashFlowItem[],
    discounting: z.infer<typeof DiscountingParametersSchema>
  ) {
    const scenarios = [
      {
        name: 'Base Case',
        probability: 0.5,
        description: 'Expected scenario with base assumptions',
        cashFlowMultiplier: 1.0,
        discountRateAdjustment: 0,
      },
      {
        name: 'Optimistic',
        probability: 0.25,
        description: 'Best-case scenario with favorable conditions',
        cashFlowMultiplier: 1.15,
        discountRateAdjustment: -0.01,
      },
      {
        name: 'Pessimistic',
        probability: 0.25,
        description: 'Worst-case scenario with unfavorable conditions',
        cashFlowMultiplier: 0.85,
        discountRateAdjustment: 0.02,
      },
    ];

    return scenarios.map((scenario) => {
      const modifiedCashFlows = cashFlows.map((cf) => ({
        ...cf,
        cashFlow: cf.period === 0 ? cf.cashFlow : cf.cashFlow * scenario.cashFlowMultiplier,
      }));

      const modifiedDiscountRate = discounting.discountRate + scenario.discountRateAdjustment;
      const npv = this.calculateNPV(modifiedCashFlows, modifiedDiscountRate);
      const irr = this.calculateIRR(modifiedCashFlows);

      return {
        name: scenario.name,
        probability: scenario.probability,
        npv: Number(new Decimal(npv).toDecimalPlaces(2)),
        irr: Number(new Decimal(irr).toDecimalPlaces(4)),
        description: scenario.description,
      };
    });
  }

  /**
   * Analyze terminal value contribution
   */
  private static analyzeTerminalValue(
    cashFlows: CashFlowItem[],
    discounting: z.infer<typeof DiscountingParametersSchema>,
    analysis: NonNullable<CashFlowInput['analysis']>
  ) {
    const terminalCashFlow = cashFlows.find((cf) => cf.category === 'terminal-value');

    if (terminalCashFlow) {
      const presentValue =
        terminalCashFlow.cashFlow / Math.pow(1 + discounting.discountRate, terminalCashFlow.period);

      const result: DCFValuationResult['terminalValue'] = {
        method: analysis.terminalValueMethod as 'perpetual-growth' | 'exit-multiple' | 'explicit',
        value: Number(new Decimal(terminalCashFlow.cashFlow).toDecimalPlaces(2)),
        presentValue: Number(new Decimal(presentValue).toDecimalPlaces(2)),
      };

      if (analysis.terminalValueMethod === 'perpetual-growth') {
        result.growthRate = discounting.terminalGrowthRate;
      }

      if (analysis.terminalValueMethod === 'exit-multiple' && analysis.exitMultiple !== undefined) {
        result.multiple = analysis.exitMultiple;
      }

      return result;
    }

    return {
      method: 'explicit' as const,
      value: 0,
      presentValue: 0,
    };
  }

  /**
   * Compare multiple projects for capital allocation decisions
   */
  static compareProjects(
    projects: Array<{ name: string; input: CashFlowInput }>,
    budgetConstraint?: number
  ): ProjectComparison {
    const projectResults = projects.map((project) => {
      const analysis = this.analyze(project.input);
      const initialInvestment = Math.abs(
        project.input.cashFlows
          .filter((cf) => cf.period === 0)
          .reduce((sum, cf) => sum + Math.min(0, cf.cashFlow), 0)
      );

      return {
        name: project.name,
        npv: analysis.npv,
        irr: analysis.irr,
        paybackPeriod: analysis.paybackPeriod,
        profitabilityIndex: analysis.profitabilityIndex,
        capitalRequired: initialInvestment,
        ranking: 0, // Will be calculated
      };
    });

    // Rank projects by NPV (primary criterion)
    const rankedProjects = projectResults
      .sort((a, b) => b.npv - a.npv)
      .map((project, index) => ({ ...project, ranking: index + 1 }));

    // Determine best project for mutually exclusive scenario
    const bestProject = rankedProjects[0];
    const mutuallyExclusive: ProjectComparison['mutuallyExclusive'] = {
      recommended: bestProject?.name ?? '',
      reason: `Highest NPV of $${bestProject?.npv.toLocaleString()}`,
    };

    if (rankedProjects[1] && bestProject) {
      mutuallyExclusive.npvDifference = bestProject.npv - rankedProjects[1].npv;
    }

    // Capital rationing optimization
    let capitalRationing = {
      budgetConstraint: budgetConstraint ?? 0,
      optimalPortfolio: [] as string[],
      totalNPV: 0,
      totalCapitalUsed: 0,
      efficiencyRatio: 0,
    };

    if (budgetConstraint) {
      // Simple greedy algorithm based on profitability index
      const sortedByPI = [...rankedProjects].sort(
        (a, b) => b.profitabilityIndex - a.profitabilityIndex
      );
      let remainingBudget = budgetConstraint;

      for (const project of sortedByPI) {
        if (project.capitalRequired <= remainingBudget) {
          capitalRationing.optimalPortfolio.push(project.name);
          capitalRationing.totalNPV += project.npv;
          capitalRationing.totalCapitalUsed += project.capitalRequired;
          remainingBudget -= project.capitalRequired;
        }
      }

      capitalRationing.efficiencyRatio =
        capitalRationing.totalCapitalUsed > 0
          ? capitalRationing.totalNPV / capitalRationing.totalCapitalUsed
          : 0;
    }

    return {
      projects: rankedProjects,
      mutuallyExclusive,
      capitalRationing,
    };
  }
}
