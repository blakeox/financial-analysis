/**
 * Mergers & Acquisitions (M&A) Analysis Engine
 * Professional-grade M&A deal modeling and valuation
 *
 * Implements industry-standard M&A methodology including:
 * - Synergy analysis (cost, revenue, and tax synergies)
 * - Accretion/dilution analysis
 * - Integration planning and risk assessment
 * - Value creation analysis
 * - Sensitivity analysis and scenario modeling
 */

import { Decimal } from 'decimal.js';
import { z } from 'zod';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const MAAnalysisInputSchema = z.object({
  // Transaction Information
  transaction: z.object({
    type: z.enum(['merger', 'acquisition', 'divestiture', 'spin-off', 'joint-venture']),
    structure: z.enum(['cash', 'stock', 'mixed', 'asset-purchase', 'stock-purchase']),
    announcementDate: z.string(),
    expectedClosingDate: z.string(),
    status: z.enum(['announced', 'pending', 'completed', 'terminated']),
  }),

  // Acquirer Information
  acquirer: z.object({
    name: z.string(),
    ticker: z.string(),
    marketCap: z.number().min(0),
    enterpriseValue: z.number().min(0),
    sharesOutstanding: z.number().min(0),
    currentPrice: z.number().min(0),
    revenue: z.number().min(0),
    ebitda: z.number(),
    netIncome: z.number(),
    totalDebt: z.number().min(0),
    cashAndEquivalents: z.number().min(0),
    beta: z.number().min(0).max(3).default(1.0),
    creditRating: z.string().optional(),
  }),

  // Target Information
  target: z.object({
    name: z.string(),
    ticker: z.string().optional(),
    marketCap: z.number().min(0),
    enterpriseValue: z.number().min(0),
    sharesOutstanding: z.number().min(0),
    currentPrice: z.number().min(0),
    revenue: z.number().min(0),
    ebitda: z.number(),
    netIncome: z.number(),
    totalDebt: z.number().min(0),
    cashAndEquivalents: z.number().min(0),
    beta: z.number().min(0).max(3).default(1.0),
    creditRating: z.string().optional(),
  }),

  // Transaction Terms
  transactionTerms: z.object({
    purchasePrice: z.number().min(0),
    cashConsideration: z.number().min(0),
    stockConsideration: z.number().min(0),
    exchangeRatio: z.number().min(0).optional(),
    premium: z.number().min(0).max(2).optional(), // Premium as multiple of current price
    financing: z.object({
      newDebt: z.number().min(0),
      cashOnHand: z.number().min(0),
      equityIssuance: z.number().min(0),
      otherSources: z.number().min(0),
    }),
  }),

  // Synergy Analysis
  synergies: z.object({
    costSynergies: z.object({
      annualAmount: z.number().min(0),
      realizationPeriod: z.number().min(1).max(5).default(3),
      probability: z.number().min(0).max(1).default(0.8),
      categories: z.array(
        z.object({
          name: z.string(),
          amount: z.number().min(0),
          timing: z.number().min(1).max(5),
        })
      ),
    }),
    revenueSynergies: z.object({
      annualAmount: z.number().min(0),
      realizationPeriod: z.number().min(1).max(5).default(3),
      probability: z.number().min(0).max(1).default(0.6),
      categories: z.array(
        z.object({
          name: z.string(),
          amount: z.number().min(0),
          timing: z.number().min(1).max(5),
        })
      ),
    }),
    taxSynergies: z.object({
      annualAmount: z.number().min(0),
      realizationPeriod: z.number().min(1).max(5).default(2),
      probability: z.number().min(0).max(1).default(0.7),
    }),
  }),

  // Integration Planning
  integration: z.object({
    timeline: z.number().min(1).max(10).default(2), // Years
    costs: z.object({
      oneTimeCosts: z.number().min(0),
      annualCosts: z.number().min(0),
      duration: z.number().min(1).max(5).default(2),
    }),
    risks: z.array(
      z.object({
        category: z.string(),
        description: z.string(),
        probability: z.number().min(0).max(1),
        impact: z.enum(['low', 'medium', 'high']),
        mitigation: z.string(),
      })
    ),
  }),

  // Analysis Parameters
  analysis: z.object({
    discountRate: z.number().min(0).max(1).default(0.1),
    taxRate: z.number().min(0).max(1).default(0.25),
    terminalGrowthRate: z.number().min(0).max(0.1).default(0.025),
    includeAccretionDilution: z.boolean().default(true),
    includeSensitivity: z.boolean().default(true),
    includeScenarios: z.boolean().default(true),
    forecastPeriod: z.number().min(3).max(10).default(5),
  }),
});

export type MAAnalysisInput = z.infer<typeof MAAnalysisInputSchema>;

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface MAAnalysisResult {
  // Transaction Summary
  transactionSummary: {
    acquirer: string;
    target: string;
    transactionType: string;
    purchasePrice: number;
    premium: number;
    enterpriseValue: number;
    dealSize: string; // Small, Medium, Large, Mega
    strategicRationale: string;
  };

  // Valuation Analysis
  valuation: {
    targetStandaloneValue: number;
    targetWithSynergies: number;
    acquirerValue: number;
    combinedValue: number;
    valueCreation: number;
    valueCreationPercent: number;
  };

  // Accretion/Dilution Analysis
  accretionDilution?: {
    epsAccretion: Array<{
      year: number;
      standaloneEps: number;
      proFormaEps: number;
      accretion: number;
      accretionPercent: number;
    }>;
    summary: {
      year1Accretion: number;
      year3Accretion: number;
      year5Accretion: number;
      averageAccretion: number;
    };
  };

  // Synergy Analysis
  synergyAnalysis: {
    totalSynergies: {
      presentValue: number;
      annualRunRate: number;
      realizationTimeline: number;
    };
    costSynergies: {
      presentValue: number;
      annualAmount: number;
      probability: number;
      categories: Array<{
        name: string;
        amount: number;
        presentValue: number;
      }>;
    };
    revenueSynergies: {
      presentValue: number;
      annualAmount: number;
      probability: number;
      categories: Array<{
        name: string;
        amount: number;
        presentValue: number;
      }>;
    };
    taxSynergies: {
      presentValue: number;
      annualAmount: number;
      probability: number;
    };
  };

  // Financial Impact
  financialImpact: {
    combinedRevenue: number;
    combinedEbitda: number;
    combinedNetIncome: number;
    combinedDebt: number;
    combinedCash: number;
    leverageRatio: number;
    creditImpact: string;
  };

  // Integration Analysis
  integrationAnalysis: {
    timeline: number;
    totalCosts: number;
    netSynergies: number;
    paybackPeriod: number;
    riskAssessment: {
      overallRisk: 'low' | 'medium' | 'high';
      keyRisks: Array<{
        category: string;
        description: string;
        probability: number;
        impact: string;
        mitigation: string;
      }>;
    };
  };

  // Sensitivity Analysis
  sensitivity?: {
    purchasePrice: Array<{ price: number; valueCreation: number }>;
    synergies: Array<{ amount: number; valueCreation: number }>;
    discountRate: Array<{ rate: number; valueCreation: number }>;
  };

  // Scenario Analysis
  scenarios?: {
    baseCase: number;
    optimisticCase: number;
    pessimisticCase: number;
    probabilityWeighted: number;
  };

  // Key Metrics
  keyMetrics: {
    evRevenue: number;
    evEbitda: number;
    pe: number;
    roe: number;
    roic: number;
    debtToEquity: number;
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
// M&A ANALYSIS ENGINE
// ============================================================================

export class MAAnalysisEngine {
  /**
   * Main M&A analysis method
   *
   * @param input - M&A analysis input parameters
   * @returns Comprehensive M&A analysis results
   */
  static analyze(input: MAAnalysisInput): MAAnalysisResult {
    const validated = MAAnalysisInputSchema.parse(input);

    // Set precision for financial calculations
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

    // Calculate transaction summary
    const transactionSummary = this.calculateTransactionSummary(validated);

    // Calculate valuation
    const valuation = this.calculateValuation(validated);

    // Calculate accretion/dilution if requested
    const accretionDilution = validated.analysis.includeAccretionDilution
      ? this.calculateAccretionDilution(validated)
      : undefined;

    // Analyze synergies
    const synergyAnalysis = this.analyzeSynergies(validated);

    // Calculate financial impact
    const financialImpact = this.calculateFinancialImpact(validated);

    // Analyze integration
    const integrationAnalysis = this.analyzeIntegration(validated, synergyAnalysis);

    // Perform sensitivity analysis if requested
    const sensitivity = validated.analysis.includeSensitivity
      ? this.performSensitivityAnalysis(validated)
      : undefined;

    // Perform scenario analysis if requested
    const scenarios = validated.analysis.includeScenarios
      ? this.performScenarioAnalysis(validated)
      : undefined;

    // Calculate key metrics
    const keyMetrics = this.calculateKeyMetrics(validated);

    // Generate insights
    const insights = this.generateInsights(validated, valuation, synergyAnalysis);
    const warnings = this.generateWarnings(validated, valuation, synergyAnalysis);
    const recommendations = this.generateRecommendations(validated, valuation, synergyAnalysis);

    return {
      transactionSummary,
      valuation,
      ...(accretionDilution && { accretionDilution }),
      synergyAnalysis,
      financialImpact,
      integrationAnalysis,
      ...(sensitivity && { sensitivity }),
      ...(scenarios && { scenarios }),
      keyMetrics,
      insights,
      warnings,
      recommendations,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: '1.0.0',
        methodology: 'M&A Analysis',
        assumptions: validated.analysis,
      },
    };
  }

  /**
   * Calculate transaction summary
   */
  private static calculateTransactionSummary(input: MAAnalysisInput) {
    const { acquirer, target, transactionTerms } = input;

    const premium =
      transactionTerms.premium || transactionTerms.purchasePrice / target.currentPrice - 1;

    const enterpriseValue =
      transactionTerms.purchasePrice + target.totalDebt - target.cashAndEquivalents;

    // Determine deal size
    let dealSize = 'Small';
    if (transactionTerms.purchasePrice > 10000000000) dealSize = 'Mega';
    else if (transactionTerms.purchasePrice > 1000000000) dealSize = 'Large';
    else if (transactionTerms.purchasePrice > 100000000) dealSize = 'Medium';

    return {
      acquirer: acquirer.name,
      target: target.name,
      transactionType: input.transaction.type,
      purchasePrice: transactionTerms.purchasePrice,
      premium: premium,
      enterpriseValue: enterpriseValue,
      dealSize: dealSize,
      strategicRationale: this.generateStrategicRationale(input),
    };
  }

  /**
   * Calculate valuation
   */
  private static calculateValuation(input: MAAnalysisInput) {
    const { acquirer, target, synergies, analysis } = input;

    // Target standalone value (simplified)
    const targetStandaloneValue = target.marketCap;

    // Calculate synergy value
    const synergyValue = this.calculateSynergyValue(synergies, analysis.discountRate);

    // Target value with synergies
    const targetWithSynergies = targetStandaloneValue + synergyValue;

    // Acquirer value
    const acquirerValue = acquirer.marketCap;

    // Combined value
    const combinedValue = acquirerValue + targetWithSynergies;

    // Value creation
    const valueCreation = combinedValue - (acquirerValue + targetStandaloneValue);
    const valueCreationPercent = valueCreation / (acquirerValue + targetStandaloneValue);

    return {
      targetStandaloneValue,
      targetWithSynergies,
      acquirerValue,
      combinedValue,
      valueCreation,
      valueCreationPercent,
    };
  }

  /**
   * Calculate accretion/dilution
   */
  private static calculateAccretionDilution(input: MAAnalysisInput) {
    const { acquirer, target, transactionTerms, synergies, analysis } = input;

    const epsAccretion = [];

    for (let year = 1; year <= analysis.forecastPeriod; year++) {
      // Standalone EPS
      const standaloneEps = acquirer.netIncome / acquirer.sharesOutstanding;

      // Pro forma EPS (simplified calculation)
      const combinedNetIncome =
        acquirer.netIncome + target.netIncome + this.calculateSynergyBenefit(synergies, year);
      const proFormaShares =
        acquirer.sharesOutstanding + transactionTerms.stockConsideration / acquirer.currentPrice;
      const proFormaEps = combinedNetIncome / proFormaShares;

      // Accretion
      const accretion = proFormaEps - standaloneEps;
      const accretionPercent = accretion / standaloneEps;

      epsAccretion.push({
        year: new Date().getFullYear() + year,
        standaloneEps,
        proFormaEps,
        accretion,
        accretionPercent,
      });
    }

    return {
      epsAccretion,
      summary: {
        year1Accretion: epsAccretion[0]?.accretionPercent || 0,
        year3Accretion: epsAccretion[2]?.accretionPercent || 0,
        year5Accretion: epsAccretion[4]?.accretionPercent || 0,
        averageAccretion:
          epsAccretion.reduce((sum, e) => sum + e.accretionPercent, 0) / epsAccretion.length,
      },
    };
  }

  /**
   * Analyze synergies
   */
  private static analyzeSynergies(input: MAAnalysisInput) {
    const { synergies, analysis } = input;

    // Calculate present value of synergies
    const costSynergiesPV = this.calculateSynergyPresentValue(
      synergies.costSynergies.annualAmount,
      synergies.costSynergies.realizationPeriod,
      analysis.discountRate,
      synergies.costSynergies.probability
    );

    const revenueSynergiesPV = this.calculateSynergyPresentValue(
      synergies.revenueSynergies.annualAmount,
      synergies.revenueSynergies.realizationPeriod,
      analysis.discountRate,
      synergies.revenueSynergies.probability
    );

    const taxSynergiesPV = this.calculateSynergyPresentValue(
      synergies.taxSynergies.annualAmount,
      synergies.taxSynergies.realizationPeriod,
      analysis.discountRate,
      synergies.taxSynergies.probability
    );

    const totalSynergiesPV = costSynergiesPV + revenueSynergiesPV + taxSynergiesPV;
    const totalAnnualRunRate =
      synergies.costSynergies.annualAmount +
      synergies.revenueSynergies.annualAmount +
      synergies.taxSynergies.annualAmount;

    return {
      totalSynergies: {
        presentValue: totalSynergiesPV,
        annualRunRate: totalAnnualRunRate,
        realizationTimeline: Math.max(
          synergies.costSynergies.realizationPeriod,
          synergies.revenueSynergies.realizationPeriod,
          synergies.taxSynergies.realizationPeriod
        ),
      },
      costSynergies: {
        presentValue: costSynergiesPV,
        annualAmount: synergies.costSynergies.annualAmount,
        probability: synergies.costSynergies.probability,
        categories: synergies.costSynergies.categories.map((cat) => ({
          name: cat.name,
          amount: cat.amount,
          presentValue: this.calculateSynergyPresentValue(
            cat.amount,
            cat.timing,
            analysis.discountRate,
            synergies.costSynergies.probability
          ),
        })),
      },
      revenueSynergies: {
        presentValue: revenueSynergiesPV,
        annualAmount: synergies.revenueSynergies.annualAmount,
        probability: synergies.revenueSynergies.probability,
        categories: synergies.revenueSynergies.categories.map((cat) => ({
          name: cat.name,
          amount: cat.amount,
          presentValue: this.calculateSynergyPresentValue(
            cat.amount,
            cat.timing,
            analysis.discountRate,
            synergies.revenueSynergies.probability
          ),
        })),
      },
      taxSynergies: {
        presentValue: taxSynergiesPV,
        annualAmount: synergies.taxSynergies.annualAmount,
        probability: synergies.taxSynergies.probability,
      },
    };
  }

  /**
   * Calculate synergy present value
   */
  private static calculateSynergyPresentValue(
    annualAmount: number,
    realizationPeriod: number,
    discountRate: number,
    probability: number
  ): number {
    let pv = 0;
    for (let year = 1; year <= realizationPeriod; year++) {
      pv += (annualAmount * probability) / Math.pow(1 + discountRate, year);
    }
    return pv;
  }

  /**
   * Calculate synergy benefit for a specific year
   */
  private static calculateSynergyBenefit(
    synergies: MAAnalysisInput['synergies'],
    year: number
  ): number {
    let benefit = 0;

    if (year <= synergies.costSynergies.realizationPeriod) {
      benefit += synergies.costSynergies.annualAmount * synergies.costSynergies.probability;
    }

    if (year <= synergies.revenueSynergies.realizationPeriod) {
      benefit += synergies.revenueSynergies.annualAmount * synergies.revenueSynergies.probability;
    }

    if (year <= synergies.taxSynergies.realizationPeriod) {
      benefit += synergies.taxSynergies.annualAmount * synergies.taxSynergies.probability;
    }

    return benefit;
  }

  /**
   * Calculate financial impact
   */
  private static calculateFinancialImpact(input: MAAnalysisInput) {
    const { acquirer, target, transactionTerms, synergies } = input;

    const combinedRevenue = acquirer.revenue + target.revenue;
    const combinedEbitda =
      acquirer.ebitda +
      target.ebitda +
      synergies.costSynergies.annualAmount +
      synergies.revenueSynergies.annualAmount;
    const combinedNetIncome =
      acquirer.netIncome + target.netIncome + this.calculateSynergyBenefit(synergies, 1);

    const combinedDebt = acquirer.totalDebt + target.totalDebt + transactionTerms.financing.newDebt;
    const combinedCash =
      acquirer.cashAndEquivalents +
      target.cashAndEquivalents -
      transactionTerms.financing.cashOnHand;

    const leverageRatio = combinedDebt / combinedEbitda;

    // Determine credit impact
    let creditImpact = 'Neutral';
    if (leverageRatio > 3) creditImpact = 'Negative';
    else if (leverageRatio < 1) creditImpact = 'Positive';

    return {
      combinedRevenue,
      combinedEbitda,
      combinedNetIncome,
      combinedDebt,
      combinedCash,
      leverageRatio,
      creditImpact,
    };
  }

  /**
   * Analyze integration
   */
  private static analyzeIntegration(input: MAAnalysisInput, synergyAnalysis: any) {
    const { integration } = input;

    const totalCosts =
      integration.costs.oneTimeCosts + integration.costs.annualCosts * integration.costs.duration;

    const netSynergies = synergyAnalysis.totalSynergies.presentValue - totalCosts;
    const paybackPeriod = totalCosts / synergyAnalysis.totalSynergies.annualRunRate;

    // Assess overall risk
    const highRiskCount = integration.risks.filter((r) => r.impact === 'high').length;
    const overallRisk =
      highRiskCount > 2
        ? ('high' as const)
        : highRiskCount > 0
          ? ('medium' as const)
          : ('low' as const);

    return {
      timeline: integration.timeline,
      totalCosts,
      netSynergies,
      paybackPeriod,
      riskAssessment: {
        overallRisk,
        keyRisks: integration.risks,
      },
    };
  }

  /**
   * Calculate key metrics
   */
  private static calculateKeyMetrics(input: MAAnalysisInput) {
    const { acquirer, target } = input;

    return {
      evRevenue:
        (acquirer.enterpriseValue + target.enterpriseValue) / (acquirer.revenue + target.revenue),
      evEbitda:
        (acquirer.enterpriseValue + target.enterpriseValue) / (acquirer.ebitda + target.ebitda),
      pe: (acquirer.marketCap + target.marketCap) / (acquirer.netIncome + target.netIncome),
      roe: 0, // Placeholder
      roic: 0, // Placeholder
      debtToEquity:
        (acquirer.totalDebt + target.totalDebt) / (acquirer.marketCap + target.marketCap),
    };
  }

  /**
   * Generate strategic rationale
   */
  private static generateStrategicRationale(input: MAAnalysisInput): string {
    const { transaction, acquirer } = input;

    if (transaction.type === 'acquisition') {
      return `Strategic acquisition to expand ${acquirer.name}'s market presence and capabilities`;
    } else if (transaction.type === 'merger') {
      return `Merger to create synergies and enhance competitive position`;
    }

    return 'Strategic transaction to enhance shareholder value';
  }

  /**
   * Calculate synergy value
   */
  private static calculateSynergyValue(
    synergies: MAAnalysisInput['synergies'],
    discountRate: number
  ): number {
    return (
      this.calculateSynergyPresentValue(
        synergies.costSynergies.annualAmount,
        synergies.costSynergies.realizationPeriod,
        discountRate,
        synergies.costSynergies.probability
      ) +
      this.calculateSynergyPresentValue(
        synergies.revenueSynergies.annualAmount,
        synergies.revenueSynergies.realizationPeriod,
        discountRate,
        synergies.revenueSynergies.probability
      ) +
      this.calculateSynergyPresentValue(
        synergies.taxSynergies.annualAmount,
        synergies.taxSynergies.realizationPeriod,
        discountRate,
        synergies.taxSynergies.probability
      )
    );
  }

  /**
   * Perform sensitivity analysis
   */
  private static performSensitivityAnalysis(input: MAAnalysisInput) {
    // Store original values to use in loop bounds (avoid mutation issues)
    const basePurchasePrice = input.transactionTerms.purchasePrice;
    const baseCostSynergies = input.synergies.costSynergies.annualAmount;
    const baseRevenueSynergies = input.synergies.revenueSynergies.annualAmount;
    const baseSynergyAmount = baseCostSynergies + baseRevenueSynergies;

    const sensitivity = {
      purchasePrice: [] as Array<{ price: number; valueCreation: number }>,
      synergies: [] as Array<{ amount: number; valueCreation: number }>,
      discountRate: [] as Array<{ rate: number; valueCreation: number }>,
    };

    // Purchase price sensitivity - use deep clone to avoid mutating original
    for (
      let price = basePurchasePrice * 0.8;
      price <= basePurchasePrice * 1.2;
      price += basePurchasePrice * 0.05
    ) {
      const modifiedInput: MAAnalysisInput = {
        ...input,
        transactionTerms: {
          ...input.transactionTerms,
          purchasePrice: price,
        },
      };
      const valuation = this.calculateValuation(modifiedInput);

      sensitivity.purchasePrice.push({
        price,
        valueCreation: valuation.valueCreation,
      });
    }

    // Synergy sensitivity - use deep clone to avoid mutating original
    for (
      let amount = baseSynergyAmount * 0.5;
      amount <= baseSynergyAmount * 1.5;
      amount += baseSynergyAmount * 0.1
    ) {
      const modifiedInput: MAAnalysisInput = {
        ...input,
        synergies: {
          ...input.synergies,
          costSynergies: {
            ...input.synergies.costSynergies,
            annualAmount: amount * 0.6,
          },
          revenueSynergies: {
            ...input.synergies.revenueSynergies,
            annualAmount: amount * 0.4,
          },
        },
      };
      const valuation = this.calculateValuation(modifiedInput);

      sensitivity.synergies.push({
        amount,
        valueCreation: valuation.valueCreation,
      });
    }

    return sensitivity;
  }

  /**
   * Perform scenario analysis
   */
  private static performScenarioAnalysis(input: MAAnalysisInput) {
    // Base case
    const baseValuation = this.calculateValuation(input);
    const baseCase = baseValuation.valueCreation;

    // Optimistic case (higher synergies, lower costs) - use deep clone
    const optimisticInput: MAAnalysisInput = {
      ...input,
      synergies: {
        ...input.synergies,
        costSynergies: {
          ...input.synergies.costSynergies,
          annualAmount: input.synergies.costSynergies.annualAmount * 1.2,
        },
        revenueSynergies: {
          ...input.synergies.revenueSynergies,
          annualAmount: input.synergies.revenueSynergies.annualAmount * 1.2,
        },
      },
      integration: {
        ...input.integration,
        costs: {
          ...input.integration.costs,
          oneTimeCosts: input.integration.costs.oneTimeCosts * 0.8,
        },
      },
    };

    const optimisticValuation = this.calculateValuation(optimisticInput);
    const optimisticCase = optimisticValuation.valueCreation;

    // Pessimistic case (lower synergies, higher costs) - use deep clone
    const pessimisticInput: MAAnalysisInput = {
      ...input,
      synergies: {
        ...input.synergies,
        costSynergies: {
          ...input.synergies.costSynergies,
          annualAmount: input.synergies.costSynergies.annualAmount * 0.8,
        },
        revenueSynergies: {
          ...input.synergies.revenueSynergies,
          annualAmount: input.synergies.revenueSynergies.annualAmount * 0.8,
        },
      },
      integration: {
        ...input.integration,
        costs: {
          ...input.integration.costs,
          oneTimeCosts: input.integration.costs.oneTimeCosts * 1.2,
        },
      },
    };

    const pessimisticValuation = this.calculateValuation(pessimisticInput);
    const pessimisticCase = pessimisticValuation.valueCreation;

    return {
      baseCase,
      optimisticCase,
      pessimisticCase,
      probabilityWeighted: baseCase * 0.5 + optimisticCase * 0.25 + pessimisticCase * 0.25,
    };
  }

  /**
   * Generate insights
   */
  private static generateInsights(
    input: MAAnalysisInput,
    valuation: any,
    synergyAnalysis: any
  ): string[] {
    const insights = [];

    // Value creation insights
    if (valuation.valueCreationPercent > 0.1) {
      insights.push('Transaction creates significant value for shareholders');
    } else if (valuation.valueCreationPercent < -0.05) {
      insights.push('Transaction may destroy value based on current assumptions');
    }

    // Synergy insights
    if (synergyAnalysis.totalSynergies.annualRunRate > input.target.revenue * 0.1) {
      insights.push('High synergy targets require careful execution planning');
    }

    return insights;
  }

  /**
   * Generate warnings
   */
  private static generateWarnings(
    input: MAAnalysisInput,
    _valuation: any,
    synergyAnalysis: any
  ): string[] {
    const warnings = [];

    // Premium warnings
    if (input.transactionTerms.premium && input.transactionTerms.premium > 0.5) {
      warnings.push('High premium may be difficult to justify');
    }

    // Synergy warnings
    if (synergyAnalysis.totalSynergies.probability < 0.7) {
      warnings.push('Low synergy probability suggests execution risk');
    }

    return warnings;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    input: MAAnalysisInput,
    _valuation: any,
    synergyAnalysis: any
  ): Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }> {
    const recommendations = [];

    // Integration recommendations
    if (input.integration.risks.filter((r) => r.impact === 'high').length > 2) {
      recommendations.push({
        category: 'Integration',
        priority: 'high' as const,
        description: 'High integration risks require detailed mitigation planning',
        impact: 'Could affect synergy realization',
      });
    }

    // Synergy recommendations
    if (synergyAnalysis.totalSynergies.annualRunRate > input.target.revenue * 0.15) {
      recommendations.push({
        category: 'Synergies',
        priority: 'medium' as const,
        description: 'High synergy targets should be stress-tested',
        impact: 'Could affect transaction value',
      });
    }

    return recommendations;
  }
}
