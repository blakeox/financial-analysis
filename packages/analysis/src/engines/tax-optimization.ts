/**
 * Tax Optimization Planner
 * Professional-grade tax planning and optimization
 *
 * Implements comprehensive tax optimization including:
 * - Tax-loss harvesting strategies
 * - Roth vs Traditional IRA analysis
 * - Capital gains optimization
 * - Charitable giving strategies
 * - Estimated tax planning
 * - Tax bracket optimization
 */

import { z } from 'zod';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const TaxOptimizationInputSchema = z.object({
  // Personal Information
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    maritalStatus: z.enum([
      'single',
      'married-filing-jointly',
      'married-filing-separately',
      'head-of-household',
      'qualifying-widow',
    ]),
    dependents: z.number().min(0).max(10).default(0),
    state: z.string().optional(),
    filingStatus: z.enum([
      'single',
      'married-joint',
      'married-separate',
      'head-of-household',
      'widow',
    ]),
  }),

  // Current Tax Situation
  currentTaxSituation: z.object({
    annualIncome: z.number().min(0),
    adjustedGrossIncome: z.number().min(0),
    taxableIncome: z.number().min(0),
    federalTaxOwed: z.number().min(0),
    stateTaxOwed: z.number().min(0).default(0),
    effectiveTaxRate: z.number().min(0).max(1),
    marginalTaxRate: z.number().min(0).max(1),
    totalTaxOwed: z.number().min(0),
  }),

  // Investment Holdings
  investmentHoldings: z.array(
    z.object({
      symbol: z.string(),
      name: z.string(),
      shares: z.number().min(0),
      currentPrice: z.number().min(0),
      costBasis: z.number().min(0),
      purchaseDate: z.string(),
      accountType: z.enum(['taxable', 'traditional-ira', 'roth-ira', '401k', 'hsa', '529']),
      holdingPeriod: z.enum(['short-term', 'long-term']),
      unrealizedGainLoss: z.number(),
    })
  ),

  // Retirement Accounts
  retirementAccounts: z.object({
    traditional401k: z.object({
      balance: z.number().min(0).default(0),
      annualContribution: z.number().min(0).default(0),
      employerMatch: z.number().min(0).default(0),
    }),
    roth401k: z.object({
      balance: z.number().min(0).default(0),
      annualContribution: z.number().min(0).default(0),
    }),
    traditionalIRA: z.object({
      balance: z.number().min(0).default(0),
      annualContribution: z.number().min(0).default(0),
      deductibleContribution: z.number().min(0).default(0),
    }),
    rothIRA: z.object({
      balance: z.number().min(0).default(0),
      annualContribution: z.number().min(0).default(0),
    }),
    hsa: z.object({
      balance: z.number().min(0).default(0),
      annualContribution: z.number().min(0).default(0),
      employerContribution: z.number().min(0).default(0),
    }),
  }),

  // Deductions and Credits
  deductionsCredits: z.object({
    standardDeduction: z.number().min(0),
    itemizedDeductions: z.object({
      mortgageInterest: z.number().min(0).default(0),
      propertyTaxes: z.number().min(0).default(0),
      stateIncomeTax: z.number().min(0).default(0),
      charitableContributions: z.number().min(0).default(0),
      medicalExpenses: z.number().min(0).default(0),
      otherDeductions: z.number().min(0).default(0),
    }),
    taxCredits: z.object({
      childTaxCredit: z.number().min(0).default(0),
      earnedIncomeCredit: z.number().min(0).default(0),
      educationCredits: z.number().min(0).default(0),
      otherCredits: z.number().min(0).default(0),
    }),
  }),

  // Goals and Preferences
  goals: z.object({
    retirementAge: z.number().min(50).max(80).default(65),
    expectedRetirementTaxRate: z.number().min(0).max(1).default(0.15),
    charitableGivingGoal: z.number().min(0).default(0),
    taxLossHarvestingGoal: z.number().min(0).default(3000), // $3,000 annual limit
    capitalGainsGoal: z.number().min(0).default(0),
  }),

  // Analysis Parameters
  analysis: z.object({
    includeTaxLossHarvesting: z.boolean().default(true),
    includeRothConversion: z.boolean().default(true),
    includeCharitableGiving: z.boolean().default(true),
    includeCapitalGainsOptimization: z.boolean().default(true),
    includeEstimatedTaxPlanning: z.boolean().default(true),
    includeBracketOptimization: z.boolean().default(true),
    inflationRate: z.number().min(0).max(0.1).default(0.03),
    discountRate: z.number().min(0).max(0.1).default(0.05),
  }),
});

export type TaxOptimizationInput = z.infer<typeof TaxOptimizationInputSchema>;

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface TaxOptimizationResult {
  // Tax Loss Harvesting Analysis
  taxLossHarvesting: {
    availableLosses: number;
    recommendedHarvesting: Array<{
      symbol: string;
      shares: number;
      lossAmount: number;
      taxBenefit: number;
      replacementSuggestion: string;
    }>;
    totalTaxBenefit: number;
    washSaleRisk: boolean;
    washSaleRecommendations: string[];
  };

  // Roth vs Traditional Analysis
  rothTraditionalAnalysis: {
    currentYearAnalysis: {
      traditional401kBenefit: number;
      roth401kBenefit: number;
      recommendedContribution: 'traditional' | 'roth' | 'split';
      reasoning: string;
    };
    longTermAnalysis: {
      traditionalFutureValue: number;
      rothFutureValue: number;
      taxAdvantage: number;
      breakEvenAge: number;
    };
    rothConversionAnalysis: {
      recommendedConversionAmount: number;
      taxCost: number;
      longTermBenefit: number;
      conversionTimeline: string;
    };
  };

  // Capital Gains Optimization
  capitalGainsOptimization: {
    currentGains: number;
    recommendedRealization: Array<{
      symbol: string;
      shares: number;
      gainAmount: number;
      taxRate: number;
      taxOwed: number;
      timing: 'immediate' | 'defer' | 'offset';
    }>;
    taxEfficientStrategies: Array<{
      strategy: string;
      description: string;
      taxSavings: number;
      implementation: string;
    }>;
    totalTaxSavings: number;
  };

  // Charitable Giving Strategies
  charitableGiving: {
    currentContributions: number;
    recommendedStrategies: Array<{
      strategy: string;
      description: string;
      taxBenefit: number;
      implementation: string;
    }>;
    donorAdvisedFund: {
      recommended: boolean;
      initialContribution: number;
      annualContribution: number;
      taxBenefit: number;
    };
    appreciatedSecurities: {
      recommendedSecurities: Array<{
        symbol: string;
        shares: number;
        gainAmount: number;
        taxBenefit: number;
      }>;
      totalTaxBenefit: number;
    };
  };

  // Estimated Tax Planning
  estimatedTaxPlanning: {
    projectedIncome: number;
    projectedTaxOwed: number;
    quarterlyPayments: Array<{
      quarter: string;
      dueDate: string;
      amount: number;
    }>;
    safeHarborAmount: number;
    recommendations: string[];
  };

  // Tax Bracket Optimization
  bracketOptimization: {
    currentBracket: string;
    bracketThreshold: number;
    incomeToNextBracket: number;
    optimizationStrategies: Array<{
      strategy: string;
      description: string;
      taxSavings: number;
      implementation: string;
    }>;
    recommendedActions: string[];
  };

  // Overall Tax Summary
  taxSummary: {
    currentYearTaxSavings: number;
    projectedLongTermSavings: number;
    optimizationScore: number; // 0-100
    priorityRecommendations: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      taxSavings: number;
      implementation: string;
    }>;
  };

  // Risk Assessment
  riskAssessment: {
    auditRisk: 'low' | 'medium' | 'high';
    riskFactors: Array<{
      factor: string;
      riskLevel: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
    complianceRecommendations: string[];
  };

  // Insights and Recommendations
  insights: string[];
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// TAX OPTIMIZATION PLANNER
// ============================================================================

export class TaxOptimizationPlanner {
  /**
   * Main tax optimization analysis method
   *
   * @param input - Tax optimization analysis input parameters
   * @returns Comprehensive tax optimization analysis results
   */
  static analyze(input: TaxOptimizationInput): TaxOptimizationResult {
    // Validate input
    const validated = TaxOptimizationInputSchema.parse(input);

    // Calculate tax loss harvesting opportunities
    const taxLossHarvesting = this.calculateTaxLossHarvesting(validated);

    // Analyze Roth vs Traditional strategies
    const rothTraditionalAnalysis = this.analyzeRothTraditional(validated);

    // Optimize capital gains
    const capitalGainsOptimization = this.optimizeCapitalGains(validated);

    // Analyze charitable giving strategies
    const charitableGiving = this.analyzeCharitableGiving(validated);

    // Plan estimated taxes
    const estimatedTaxPlanning = this.planEstimatedTaxes(validated);

    // Optimize tax brackets
    const bracketOptimization = this.optimizeTaxBrackets(validated);

    // Calculate overall tax summary
    const taxSummary = this.calculateTaxSummary(
      validated,
      taxLossHarvesting,
      rothTraditionalAnalysis,
      capitalGainsOptimization,
      charitableGiving
    );

    // Perform risk assessment
    const riskAssessment = this.performRiskAssessment(validated);

    // Generate insights and recommendations
    const insights = this.generateInsights(validated, taxSummary, riskAssessment);
    const warnings = this.generateWarnings(validated, taxSummary, riskAssessment);
    const recommendations = this.generateRecommendations(validated, taxSummary, riskAssessment);

    return {
      taxLossHarvesting,
      rothTraditionalAnalysis,
      capitalGainsOptimization,
      charitableGiving,
      estimatedTaxPlanning,
      bracketOptimization,
      taxSummary,
      riskAssessment,
      insights,
      warnings: warnings.length > 0 ? warnings : [],
      recommendations,
    };
  }

  /**
   * Calculate tax loss harvesting opportunities
   */
  private static calculateTaxLossHarvesting(input: TaxOptimizationInput) {
    const { investmentHoldings, goals, currentTaxSituation } = input;

    // Find positions with losses
    const lossPositions = investmentHoldings.filter(
      (holding) => holding.unrealizedGainLoss < 0 && holding.accountType === 'taxable'
    );

    // Calculate available losses
    const availableLosses = lossPositions.reduce(
      (sum, holding) => sum + Math.abs(holding.unrealizedGainLoss),
      0
    );

    // Generate harvesting recommendations
    const recommendedHarvesting = lossPositions
      .sort((a, b) => Math.abs(a.unrealizedGainLoss) - Math.abs(b.unrealizedGainLoss))
      .slice(0, 5) // Top 5 positions
      .map((holding) => ({
        symbol: holding.symbol,
        shares: holding.shares,
        lossAmount: Math.abs(holding.unrealizedGainLoss),
        taxBenefit: Math.abs(holding.unrealizedGainLoss) * currentTaxSituation.marginalTaxRate,
        replacementSuggestion: this.suggestReplacementSecurity(holding.symbol),
      }));

    // Calculate total tax benefit
    const totalTaxBenefit = recommendedHarvesting.reduce((sum, rec) => sum + rec.taxBenefit, 0);

    // Check for wash sale risk
    const washSaleRisk = this.checkWashSaleRisk(recommendedHarvesting, investmentHoldings);
    const washSaleRecommendations = washSaleRisk
      ? ['Wait 31 days before repurchasing', 'Consider similar but not identical securities']
      : [];

    return {
      availableLosses,
      recommendedHarvesting,
      totalTaxBenefit,
      washSaleRisk,
      washSaleRecommendations,
    };
  }

  /**
   * Analyze Roth vs Traditional strategies
   */
  private static analyzeRothTraditional(input: TaxOptimizationInput) {
    const { personalInfo, currentTaxSituation, retirementAccounts, goals } = input;

    // Current year analysis
    const traditional401kBenefit = this.calculateTraditional401kBenefit(
      currentTaxSituation.marginalTaxRate,
      retirementAccounts.traditional401k.annualContribution
    );

    const roth401kBenefit = this.calculateRoth401kBenefit(
      retirementAccounts.roth401k.annualContribution,
      goals.expectedRetirementTaxRate
    );

    const recommendedContribution = this.recommendContributionType(
      currentTaxSituation.marginalTaxRate,
      goals.expectedRetirementTaxRate,
      personalInfo.age
    );

    // Long-term analysis
    const yearsToRetirement = goals.retirementAge - personalInfo.age;
    const traditionalFutureValue = this.calculateFutureValue(
      retirementAccounts.traditional401k.balance,
      retirementAccounts.traditional401k.annualContribution,
      0.07, // Expected return
      yearsToRetirement
    );

    const rothFutureValue = this.calculateFutureValue(
      retirementAccounts.roth401k.balance,
      retirementAccounts.roth401k.annualContribution,
      0.07,
      yearsToRetirement
    );

    const taxAdvantage =
      rothFutureValue - traditionalFutureValue * (1 - goals.expectedRetirementTaxRate);
    const breakEvenAge = this.calculateBreakEvenAge(
      currentTaxSituation.marginalTaxRate,
      goals.expectedRetirementTaxRate,
      personalInfo.age
    );

    // Roth conversion analysis
    const rothConversionAnalysis = this.analyzeRothConversion(input);

    return {
      currentYearAnalysis: {
        traditional401kBenefit,
        roth401kBenefit,
        recommendedContribution,
        reasoning: this.getContributionReasoning(
          currentTaxSituation.marginalTaxRate,
          goals.expectedRetirementTaxRate,
          personalInfo.age
        ),
      },
      longTermAnalysis: {
        traditionalFutureValue,
        rothFutureValue,
        taxAdvantage,
        breakEvenAge,
      },
      rothConversionAnalysis,
    };
  }

  /**
   * Optimize capital gains
   */
  private static optimizeCapitalGains(input: TaxOptimizationInput) {
    const { investmentHoldings, currentTaxSituation, goals } = input;

    // Find positions with gains
    const gainPositions = investmentHoldings.filter(
      (holding) => holding.unrealizedGainLoss > 0 && holding.accountType === 'taxable'
    );

    const currentGains = gainPositions.reduce(
      (sum, holding) => sum + holding.unrealizedGainLoss,
      0
    );

    // Generate realization recommendations
    const recommendedRealization = gainPositions
      .sort((a, b) => b.unrealizedGainLoss - a.unrealizedGainLoss)
      .slice(0, 5)
      .map((holding) => {
        const taxRate =
          holding.holdingPeriod === 'long-term' ? 0.15 : currentTaxSituation.marginalTaxRate;
        const taxOwed = holding.unrealizedGainLoss * taxRate;

        return {
          symbol: holding.symbol,
          shares: holding.shares,
          gainAmount: holding.unrealizedGainLoss,
          taxRate,
          taxOwed,
          timing: this.recommendRealizationTiming(holding, currentTaxSituation),
        };
      });

    // Generate tax-efficient strategies
    const taxEfficientStrategies = this.generateTaxEfficientStrategies(input);

    const totalTaxSavings = taxEfficientStrategies.reduce(
      (sum, strategy) => sum + strategy.taxSavings,
      0
    );

    return {
      currentGains,
      recommendedRealization,
      taxEfficientStrategies,
      totalTaxSavings,
    };
  }

  /**
   * Analyze charitable giving strategies
   */
  private static analyzeCharitableGiving(input: TaxOptimizationInput) {
    const { deductionsCredits, investmentHoldings, goals } = input;

    const currentContributions = deductionsCredits.itemizedDeductions.charitableContributions;

    // Generate recommended strategies
    const recommendedStrategies = this.generateCharitableStrategies(input);

    // Analyze donor-advised fund
    const donorAdvisedFund = this.analyzeDonorAdvisedFund(input);

    // Analyze appreciated securities
    const appreciatedSecurities = this.analyzeAppreciatedSecurities(input);

    return {
      currentContributions,
      recommendedStrategies,
      donorAdvisedFund,
      appreciatedSecurities,
    };
  }

  /**
   * Plan estimated taxes
   */
  private static planEstimatedTaxes(input: TaxOptimizationInput) {
    const { personalInfo, currentTaxSituation } = input;

    // Project next year's income and taxes
    const projectedIncome = currentTaxSituation.annualIncome * 1.03; // 3% growth
    const projectedTaxOwed = this.calculateProjectedTax(projectedIncome, personalInfo.filingStatus);

    // Calculate quarterly payments
    const quarterlyPayments = this.calculateQuarterlyPayments(projectedTaxOwed);

    // Calculate safe harbor amount
    const safeHarborAmount = this.calculateSafeHarborAmount(currentTaxSituation.totalTaxOwed);

    // Generate recommendations
    const recommendations = this.generateEstimatedTaxRecommendations(
      projectedTaxOwed,
      safeHarborAmount
    );

    return {
      projectedIncome,
      projectedTaxOwed,
      quarterlyPayments,
      safeHarborAmount,
      recommendations,
    };
  }

  /**
   * Optimize tax brackets
   */
  private static optimizeTaxBrackets(input: TaxOptimizationInput) {
    const { currentTaxSituation, personalInfo } = input;

    const currentBracket = this.getCurrentTaxBracket(
      currentTaxSituation.taxableIncome,
      personalInfo.filingStatus
    );

    const bracketThreshold = this.getBracketThreshold(currentBracket, personalInfo.filingStatus);
    const incomeToNextBracket = bracketThreshold - currentTaxSituation.taxableIncome;

    // Generate optimization strategies
    const optimizationStrategies = this.generateBracketOptimizationStrategies(input);

    // Generate recommended actions
    const recommendedActions = this.generateBracketOptimizationActions(input);

    return {
      currentBracket,
      bracketThreshold,
      incomeToNextBracket,
      optimizationStrategies,
      recommendedActions,
    };
  }

  /**
   * Calculate tax summary
   */
  private static calculateTaxSummary(
    _input: TaxOptimizationInput,
    taxLossHarvesting: TaxOptimizationResult['taxLossHarvesting'],
    rothTraditionalAnalysis: TaxOptimizationResult['rothTraditionalAnalysis'],
    capitalGainsOptimization: TaxOptimizationResult['capitalGainsOptimization'],
    charitableGiving: TaxOptimizationResult['charitableGiving']
  ) {
    const currentYearTaxSavings =
      taxLossHarvesting.totalTaxBenefit +
      capitalGainsOptimization.totalTaxSavings +
      charitableGiving.appreciatedSecurities.totalTaxBenefit;

    const projectedLongTermSavings = rothTraditionalAnalysis.longTermAnalysis.taxAdvantage;

    const optimizationScore = this.calculateOptimizationScore(
      input,
      currentYearTaxSavings,
      projectedLongTermSavings
    );

    const priorityRecommendations = this.generatePriorityRecommendations(
      input,
      taxLossHarvesting,
      rothTraditionalAnalysis,
      capitalGainsOptimization,
      charitableGiving
    );

    return {
      currentYearTaxSavings,
      projectedLongTermSavings,
      optimizationScore,
      priorityRecommendations,
    };
  }

  /**
   * Perform risk assessment
   */
  private static performRiskAssessment(input: TaxOptimizationInput) {
    const riskFactors = [];

    // Income risk
    if (input.currentTaxSituation.annualIncome > 200000) {
      riskFactors.push({
        factor: 'High Income',
        riskLevel: 'medium' as const,
        mitigation: 'Consider professional tax planning services',
      });
    }

    // Investment complexity risk
    if (input.investmentHoldings.length > 20) {
      riskFactors.push({
        factor: 'Complex Investment Portfolio',
        riskLevel: 'medium' as const,
        mitigation: 'Maintain detailed records and consider professional management',
      });
    }

    // Charitable giving risk
    if (
      input.deductionsCredits.itemizedDeductions.charitableContributions >
      input.currentTaxSituation.annualIncome * 0.1
    ) {
      riskFactors.push({
        factor: 'High Charitable Contributions',
        riskLevel: 'medium' as const,
        mitigation: 'Ensure proper documentation and qualified organizations',
      });
    }

    // Calculate overall audit risk
    const auditRisk = this.calculateAuditRisk(input, riskFactors);

    // Generate compliance recommendations
    const complianceRecommendations = this.generateComplianceRecommendations(riskFactors);

    return {
      auditRisk,
      riskFactors,
      complianceRecommendations,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Suggest replacement security for tax loss harvesting
   */
  private static suggestReplacementSecurity(symbol: string): string {
    const replacements: Record<string, string> = {
      SPY: 'VTI',
      QQQ: 'VUG',
      AAPL: 'MSFT',
      GOOGL: 'META',
      TSLA: 'NVDA',
    };
    return replacements[symbol] || 'Similar ETF or mutual fund';
  }

  /**
   * Check for wash sale risk
   */
  private static checkWashSaleRisk(
    recommendedHarvesting: any[],
    investmentHoldings: any[]
  ): boolean {
    // Simplified wash sale check
    return recommendedHarvesting.some((rec) =>
      investmentHoldings.some((holding) => holding.symbol === rec.symbol)
    );
  }

  /**
   * Calculate Traditional 401(k) benefit
   */
  private static calculateTraditional401kBenefit(
    marginalTaxRate: number,
    contribution: number
  ): number {
    return contribution * marginalTaxRate;
  }

  /**
   * Calculate Roth 401(k) benefit
   */
  private static calculateRoth401kBenefit(contribution: number, retirementTaxRate: number): number {
    return contribution * retirementTaxRate;
  }

  /**
   * Recommend contribution type
   */
  private static recommendContributionType(
    currentTaxRate: number,
    retirementTaxRate: number,
    age: number
  ): 'traditional' | 'roth' | 'split' {
    if (currentTaxRate > retirementTaxRate + 0.05) return 'traditional';
    if (currentTaxRate < retirementTaxRate - 0.05) return 'roth';
    if (age < 40) return 'roth';
    return 'split';
  }

  /**
   * Calculate future value
   */
  private static calculateFutureValue(
    presentValue: number,
    annualPayment: number,
    rate: number,
    years: number
  ): number {
    const futureValueOfPV = presentValue * Math.pow(1 + rate, years);
    const futureValueOfAnnuity = annualPayment * ((Math.pow(1 + rate, years) - 1) / rate);
    return futureValueOfPV + futureValueOfAnnuity;
  }

  /**
   * Calculate break-even age
   */
  private static calculateBreakEvenAge(
    currentTaxRate: number,
    retirementTaxRate: number,
    currentAge: number
  ): number {
    // Simplified calculation
    return currentAge + Math.round((currentTaxRate - retirementTaxRate) * 20);
  }

  /**
   * Analyze Roth conversion
   */
  private static analyzeRothConversion(input: TaxOptimizationInput) {
    const { personalInfo, currentTaxSituation, goals } = input;

    const recommendedConversionAmount = Math.min(
      50000, // Max conversion amount
      currentTaxSituation.taxableIncome * 0.1 // 10% of taxable income
    );

    const taxCost = recommendedConversionAmount * currentTaxSituation.marginalTaxRate;
    const longTermBenefit =
      recommendedConversionAmount *
      (currentTaxSituation.marginalTaxRate - goals.expectedRetirementTaxRate);

    const conversionTimeline = personalInfo.age < 60 ? 'Next 5 years' : 'Next 2 years';

    return {
      recommendedConversionAmount,
      taxCost,
      longTermBenefit,
      conversionTimeline,
    };
  }

  /**
   * Recommend realization timing
   */
  private static recommendRealizationTiming(
    holding: any,
    currentTaxSituation: any
  ): 'immediate' | 'defer' | 'offset' {
    if (holding.holdingPeriod === 'short-term') return 'defer';
    if (holding.unrealizedGainLoss > 10000) return 'offset';
    return 'immediate';
  }

  /**
   * Generate tax-efficient strategies
   */
  private static generateTaxEfficientStrategies(input: TaxOptimizationInput) {
    const strategies = [];

    // Tax-loss harvesting strategy
    strategies.push({
      strategy: 'Tax-Loss Harvesting',
      description: 'Sell losing positions to offset gains',
      taxSavings: 1000, // Placeholder
      implementation: 'Sell losing positions and replace with similar securities',
    });

    // Asset location strategy
    strategies.push({
      strategy: 'Asset Location Optimization',
      description: 'Place tax-inefficient assets in tax-advantaged accounts',
      taxSavings: 500, // Placeholder
      implementation: 'Move bonds and REITs to tax-advantaged accounts',
    });

    return strategies;
  }

  /**
   * Generate charitable strategies
   */
  private static generateCharitableStrategies(input: TaxOptimizationInput) {
    const strategies = [];

    strategies.push({
      strategy: 'Donor-Advised Fund',
      description: 'Contribute to DAF for immediate tax deduction',
      taxBenefit: 1000, // Placeholder
      implementation: 'Open DAF and contribute appreciated securities',
    });

    strategies.push({
      strategy: 'Appreciated Securities',
      description: 'Donate appreciated securities instead of cash',
      taxBenefit: 500, // Placeholder
      implementation: 'Transfer appreciated securities to charity',
    });

    return strategies;
  }

  /**
   * Analyze donor-advised fund
   */
  private static analyzeDonorAdvisedFund(input: TaxOptimizationInput) {
    const recommended = input.goals.charitableGivingGoal > 5000;
    const initialContribution = recommended ? 10000 : 0;
    const annualContribution = recommended ? 5000 : 0;
    const taxBenefit = initialContribution * input.currentTaxSituation.marginalTaxRate;

    return {
      recommended,
      initialContribution,
      annualContribution,
      taxBenefit,
    };
  }

  /**
   * Analyze appreciated securities
   */
  private static analyzeAppreciatedSecurities(input: TaxOptimizationInput) {
    const appreciatedSecurities = input.investmentHoldings.filter(
      (holding) => holding.unrealizedGainLoss > 0 && holding.accountType === 'taxable'
    );

    const recommendedSecurities = appreciatedSecurities
      .sort((a, b) => b.unrealizedGainLoss - a.unrealizedGainLoss)
      .slice(0, 3)
      .map((holding) => ({
        symbol: holding.symbol,
        shares: Math.min(holding.shares, 100), // Limit shares
        gainAmount: holding.unrealizedGainLoss,
        taxBenefit: holding.unrealizedGainLoss * input.currentTaxSituation.marginalTaxRate,
      }));

    const totalTaxBenefit = recommendedSecurities.reduce((sum, sec) => sum + sec.taxBenefit, 0);

    return {
      recommendedSecurities,
      totalTaxBenefit,
    };
  }

  /**
   * Calculate projected tax
   */
  private static calculateProjectedTax(income: number, filingStatus: string): number {
    // Simplified tax calculation
    const standardDeduction = filingStatus === 'married-joint' ? 25900 : 12950;
    const taxableIncome = Math.max(0, income - standardDeduction);

    if (filingStatus === 'married-joint') {
      if (taxableIncome <= 22000) return taxableIncome * 0.1;
      if (taxableIncome <= 89450) return 2200 + (taxableIncome - 22000) * 0.12;
      if (taxableIncome <= 190750) return 10294 + (taxableIncome - 89450) * 0.22;
      return 30426 + (taxableIncome - 190750) * 0.24;
    } else {
      if (taxableIncome <= 11000) return taxableIncome * 0.1;
      if (taxableIncome <= 44725) return 1100 + (taxableIncome - 11000) * 0.12;
      if (taxableIncome <= 95375) return 5147 + (taxableIncome - 44725) * 0.22;
      return 16290 + (taxableIncome - 95375) * 0.24;
    }
  }

  /**
   * Calculate quarterly payments
   */
  private static calculateQuarterlyPayments(totalTax: number) {
    const quarterlyAmount = totalTax / 4;
    return [
      { quarter: 'Q1', dueDate: 'April 15', amount: quarterlyAmount },
      { quarter: 'Q2', dueDate: 'June 15', amount: quarterlyAmount },
      { quarter: 'Q3', dueDate: 'September 15', amount: quarterlyAmount },
      { quarter: 'Q4', dueDate: 'January 15', amount: quarterlyAmount },
    ];
  }

  /**
   * Calculate safe harbor amount
   */
  private static calculateSafeHarborAmount(lastYearTax: number): number {
    return lastYearTax * 1.1; // 110% of last year's tax
  }

  /**
   * Generate estimated tax recommendations
   */
  private static generateEstimatedTaxRecommendations(
    projectedTax: number,
    safeHarborAmount: number
  ): string[] {
    const recommendations = [];

    if (projectedTax > safeHarborAmount) {
      recommendations.push('Make estimated tax payments to avoid penalties');
    }

    recommendations.push('Consider increasing withholding to avoid estimated payments');
    recommendations.push('Monitor income changes throughout the year');

    return recommendations;
  }

  /**
   * Get current tax bracket
   */
  private static getCurrentTaxBracket(taxableIncome: number, filingStatus: string): string {
    if (filingStatus === 'married-joint') {
      if (taxableIncome <= 22000) return '10%';
      if (taxableIncome <= 89450) return '12%';
      if (taxableIncome <= 190750) return '22%';
      if (taxableIncome <= 364200) return '24%';
      return '32%+';
    } else {
      if (taxableIncome <= 11000) return '10%';
      if (taxableIncome <= 44725) return '12%';
      if (taxableIncome <= 95375) return '22%';
      if (taxableIncome <= 182100) return '24%';
      return '32%+';
    }
  }

  /**
   * Get bracket threshold
   */
  private static getBracketThreshold(bracket: string, filingStatus: string): number {
    const thresholds: Record<string, Record<string, number>> = {
      'married-joint': {
        '10%': 22000,
        '12%': 89450,
        '22%': 190750,
        '24%': 364200,
      },
      single: {
        '10%': 11000,
        '12%': 44725,
        '22%': 95375,
        '24%': 182100,
      },
    };

    return thresholds[filingStatus]?.[bracket] || 0;
  }

  /**
   * Generate bracket optimization strategies
   */
  private static generateBracketOptimizationStrategies(input: TaxOptimizationInput) {
    const strategies = [];

    strategies.push({
      strategy: 'Income Deferral',
      description: 'Defer income to next year to stay in lower bracket',
      taxSavings: 1000, // Placeholder
      implementation: 'Defer bonuses or capital gains to next year',
    });

    strategies.push({
      strategy: 'Tax-Loss Harvesting',
      description: 'Harvest losses to reduce taxable income',
      taxSavings: 500, // Placeholder
      implementation: 'Sell losing positions to offset gains',
    });

    return strategies;
  }

  /**
   * Generate bracket optimization actions
   */
  private static generateBracketOptimizationActions(input: TaxOptimizationInput): string[] {
    const actions = [];

    if (input.currentTaxSituation.taxableIncome > 100000) {
      actions.push('Consider Roth IRA conversion to reduce future tax burden');
    }

    actions.push('Maximize tax-advantaged account contributions');
    actions.push('Consider tax-loss harvesting before year-end');

    return actions;
  }

  /**
   * Calculate optimization score
   */
  private static calculateOptimizationScore(
    input: TaxOptimizationInput,
    currentYearSavings: number,
    _longTermSavings: number
  ): number {
    const maxPossibleSavings = input.currentTaxSituation.totalTaxOwed * 0.2; // 20% max savings
    const currentScore = Math.min(100, (currentYearSavings / maxPossibleSavings) * 100);
    return Math.round(currentScore);
  }

  /**
   * Generate priority recommendations
   */
  private static generatePriorityRecommendations(
    _input: TaxOptimizationInput,
    taxLossHarvesting: TaxOptimizationResult['taxLossHarvesting'],
    rothTraditionalAnalysis: TaxOptimizationResult['rothTraditionalAnalysis'],
    _capitalGainsOptimization: TaxOptimizationResult['capitalGainsOptimization'],
    charitableGiving: TaxOptimizationResult['charitableGiving']
  ) {
    const recommendations = [];

    if (taxLossHarvesting.totalTaxBenefit > 1000) {
      recommendations.push({
        action: 'Tax-Loss Harvesting',
        priority: 'high' as const,
        taxSavings: taxLossHarvesting.totalTaxBenefit,
        implementation: 'Sell losing positions before year-end',
      });
    }

    if (rothTraditionalAnalysis.rothConversionAnalysis.longTermBenefit > 5000) {
      recommendations.push({
        action: 'Roth IRA Conversion',
        priority: 'medium' as const,
        taxSavings: rothTraditionalAnalysis.rothConversionAnalysis.longTermBenefit,
        implementation: 'Convert traditional IRA to Roth IRA',
      });
    }

    if (charitableGiving.appreciatedSecurities.totalTaxBenefit > 500) {
      recommendations.push({
        action: 'Charitable Giving Optimization',
        priority: 'medium' as const,
        taxSavings: charitableGiving.appreciatedSecurities.totalTaxBenefit,
        implementation: 'Donate appreciated securities instead of cash',
      });
    }

    return recommendations;
  }

  /**
   * Calculate audit risk
   */
  private static calculateAuditRisk(
    _input: TaxOptimizationInput,
    riskFactors: TaxOptimizationResult['riskAssessment']['riskFactors']
  ): 'low' | 'medium' | 'high' {
    const highRiskCount = riskFactors.filter((rf) => rf.riskLevel === 'high').length;
    const mediumRiskCount = riskFactors.filter((rf) => rf.riskLevel === 'medium').length;

    if (highRiskCount > 0) return 'high';
    if (mediumRiskCount > 1) return 'medium';
    return 'low';
  }

  /**
   * Generate compliance recommendations
   */
  private static generateComplianceRecommendations(
    _riskFactors: TaxOptimizationResult['riskAssessment']['riskFactors']
  ): string[] {
    const recommendations = [];

    recommendations.push('Maintain detailed records of all transactions');
    recommendations.push('Keep receipts for all deductions and charitable contributions');
    recommendations.push('Consider professional tax preparation for complex situations');

    return recommendations;
  }

  /**
   * Get contribution reasoning
   */
  private static getContributionReasoning(
    currentTaxRate: number,
    retirementTaxRate: number,
    age: number
  ): string {
    if (currentTaxRate > retirementTaxRate + 0.05) {
      return 'Current tax rate is significantly higher than expected retirement rate';
    }
    if (currentTaxRate < retirementTaxRate - 0.05) {
      return 'Current tax rate is lower than expected retirement rate';
    }
    if (age < 40) {
      return 'Young age favors Roth contributions for long-term tax-free growth';
    }
    return 'Similar tax rates suggest a balanced approach';
  }

  /**
   * Generate insights
   */
  private static generateInsights(
    _input: TaxOptimizationInput,
    taxSummary: TaxOptimizationResult['taxSummary'],
    riskAssessment: TaxOptimizationResult['riskAssessment']
  ): string[] {
    const insights = [];

    insights.push(`Your tax optimization score is ${taxSummary.optimizationScore}/100`);
    insights.push(
      `Potential current year tax savings: $${taxSummary.currentYearTaxSavings.toLocaleString()}`
    );
    insights.push(
      `Projected long-term tax savings: $${taxSummary.projectedLongTermSavings.toLocaleString()}`
    );

    if (riskAssessment.auditRisk === 'low') {
      insights.push('Your audit risk is low - continue current strategies');
    } else if (riskAssessment.auditRisk === 'medium') {
      insights.push('Your audit risk is moderate - ensure proper documentation');
    } else {
      insights.push('Your audit risk is high - consider professional tax planning');
    }

    return insights;
  }

  /**
   * Generate warnings
   */
  private static generateWarnings(
    _input: TaxOptimizationInput,
    taxSummary: TaxOptimizationResult['taxSummary'],
    riskAssessment: TaxOptimizationResult['riskAssessment']
  ): string[] {
    const warnings = [];

    if (taxSummary.optimizationScore < 50) {
      warnings.push('Low tax optimization score - consider implementing recommended strategies');
    }

    if (riskAssessment.auditRisk === 'high') {
      warnings.push('High audit risk detected - ensure compliance with all tax rules');
    }

    if (_input.currentTaxSituation.marginalTaxRate > 0.3) {
      warnings.push('High marginal tax rate - focus on tax reduction strategies');
    }

    return warnings;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    input: TaxOptimizationInput,
    taxSummary: TaxOptimizationResult['taxSummary'],
    riskAssessment: TaxOptimizationResult['riskAssessment']
  ): string[] {
    const recommendations = [];

    // Priority recommendations
    const highPriority = taxSummary.priorityRecommendations.filter((r) => r.priority === 'high');
    if (highPriority.length > 0) {
      recommendations.push(
        `Priority: Implement ${highPriority.map((r) => r.action).join(', ')} strategies`
      );
    }

    // Age-based recommendations
    if (input.personalInfo.age < 40) {
      recommendations.push('Focus on Roth contributions for long-term tax-free growth');
    } else if (input.personalInfo.age > 50) {
      recommendations.push('Consider Roth conversions and tax-loss harvesting');
    }

    // Income-based recommendations
    if (input.currentTaxSituation.annualIncome > 150000) {
      recommendations.push('Consider advanced strategies like donor-advised funds');
    }

    // Risk-based recommendations
    if (riskAssessment.auditRisk === 'high') {
      recommendations.push('Consider professional tax planning services');
    }

    return recommendations;
  }
}
