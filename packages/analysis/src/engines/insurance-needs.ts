/**
 * Insurance Needs Calculator
 * Professional-grade insurance analysis and planning
 *
 * Implements comprehensive insurance needs analysis including:
 * - Life insurance needs calculation
 * - Disability insurance analysis
 * - Long-term care insurance planning
 * - Coverage gap analysis
 * - Premium optimization
 * - Risk assessment and recommendations
 */

import { z } from 'zod';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const InsuranceNeedsInputSchema = z.object({
  // Personal Information
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    dependents: z.number().min(0).max(10).default(0),
    employmentStatus: z.enum(['employed', 'self-employed', 'unemployed', 'retired']),
    healthStatus: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
    occupation: z.string().optional(),
    annualIncome: z.number().min(0),
    monthlyExpenses: z.number().min(0),
  }),

  // Current Insurance Coverage
  currentInsurance: z.object({
    lifeInsurance: z.object({
      termLife: z.object({
        coverage: z.number().min(0).default(0),
        termYears: z.number().min(0).default(0),
        monthlyPremium: z.number().min(0).default(0),
        beneficiary: z.string().optional(),
      }),
      wholeLife: z.object({
        coverage: z.number().min(0).default(0),
        cashValue: z.number().min(0).default(0),
        monthlyPremium: z.number().min(0).default(0),
        beneficiary: z.string().optional(),
      }),
    }),
    disabilityInsurance: z.object({
      shortTerm: z.object({
        coverage: z.number().min(0).default(0),
        waitingPeriod: z.number().min(0).default(0),
        benefitPeriod: z.number().min(0).default(0),
        monthlyPremium: z.number().min(0).default(0),
      }),
      longTerm: z.object({
        coverage: z.number().min(0).default(0),
        waitingPeriod: z.number().min(0).default(0),
        benefitPeriod: z.number().min(0).default(0),
        monthlyPremium: z.number().min(0).default(0),
      }),
    }),
    longTermCare: z.object({
      coverage: z.number().min(0).default(0),
      dailyBenefit: z.number().min(0).default(0),
      benefitPeriod: z.number().min(0).default(0),
      eliminationPeriod: z.number().min(0).default(0),
      monthlyPremium: z.number().min(0).default(0),
    }),
    healthInsurance: z.object({
      coverage: z.string().optional(),
      monthlyPremium: z.number().min(0).default(0),
      deductible: z.number().min(0).default(0),
      outOfPocketMax: z.number().min(0).default(0),
    }),
  }),

  // Financial Situation
  financialSituation: z.object({
    totalAssets: z.number().min(0),
    totalDebts: z.number().min(0),
    emergencyFund: z.number().min(0).default(0),
    retirementSavings: z.number().min(0).default(0),
    otherIncome: z.number().min(0).default(0),
    socialSecurityBenefit: z.number().min(0).default(0),
  }),

  // Goals and Preferences
  goals: z.object({
    incomeReplacementRatio: z.number().min(0).max(1).default(0.7), // 70% income replacement
    debtPayoffGoal: z.boolean().default(true),
    educationFunding: z.number().min(0).default(0),
    retirementGoal: z.number().min(0).default(0),
    legacyGoal: z.number().min(0).default(0),
  }),

  // Analysis Parameters
  analysis: z.object({
    includeLifeInsurance: z.boolean().default(true),
    includeDisabilityInsurance: z.boolean().default(true),
    includeLongTermCare: z.boolean().default(true),
    includeHealthInsurance: z.boolean().default(false),
    inflationRate: z.number().min(0).max(0.1).default(0.03),
    discountRate: z.number().min(0).max(0.1).default(0.05),
    lifeExpectancy: z.number().min(70).max(100).default(85),
  }),
});

export type InsuranceNeedsInput = z.infer<typeof InsuranceNeedsInputSchema>;

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface InsuranceNeedsResult {
  // Life Insurance Analysis
  lifeInsuranceAnalysis: {
    humanLifeValue: number;
    incomeReplacementNeeds: number;
    debtCoverageNeeds: number;
    educationFundingNeeds: number;
    finalExpenseNeeds: number;
    totalRecommendedCoverage: number;
    currentCoverage: number;
    coverageGap: number;
    coverageAdequacy: 'adequate' | 'underinsured' | 'overinsured';
    recommendedTermYears: number;
    estimatedMonthlyPremium: number;
  };

  // Disability Insurance Analysis
  disabilityInsuranceAnalysis: {
    incomeReplacementNeeds: number;
    currentCoverage: number;
    coverageGap: number;
    recommendedCoverage: number;
    shortTermNeeds: {
      recommendedCoverage: number;
      waitingPeriod: number;
      benefitPeriod: number;
    };
    longTermNeeds: {
      recommendedCoverage: number;
      waitingPeriod: number;
      benefitPeriod: number;
    };
    estimatedMonthlyPremium: number;
  };

  // Long-Term Care Analysis
  longTermCareAnalysis: {
    projectedCosts: {
      currentAnnualCost: number;
      projectedCostAtAge65: number;
      projectedCostAtAge75: number;
      projectedCostAtAge85: number;
    };
    recommendedCoverage: {
      dailyBenefit: number;
      benefitPeriod: number;
      eliminationPeriod: number;
      totalCoverage: number;
    };
    currentCoverage: number;
    coverageGap: number;
    estimatedMonthlyPremium: number;
    selfInsuranceFeasibility: boolean;
  };

  // Overall Insurance Summary
  insuranceSummary: {
    totalRecommendedCoverage: number;
    totalCurrentCoverage: number;
    totalCoverageGap: number;
    totalMonthlyPremiums: number;
    insuranceHealthScore: number; // 0-100
    priorityRecommendations: Array<{
      type: 'life' | 'disability' | 'long-term-care' | 'health';
      priority: 'high' | 'medium' | 'low';
      reason: string;
      estimatedCost: number;
      impact: string;
    }>;
  };

  // Risk Assessment
  riskAssessment: {
    overallRiskLevel: 'low' | 'medium' | 'high';
    riskFactors: Array<{
      factor: string;
      riskLevel: 'low' | 'medium' | 'high';
      impact: string;
      mitigation: string;
    }>;
    recommendations: string[];
  };

  // Cost Analysis
  costAnalysis: {
    currentMonthlyPremiums: number;
    recommendedMonthlyPremiums: number;
    premiumIncrease: number;
    costBenefitAnalysis: {
      totalProtectionValue: number;
      totalPremiumCost: number;
      protectionRatio: number;
    };
    affordabilityAssessment: 'affordable' | 'stretch' | 'unaffordable';
  };

  // Insights and Recommendations
  insights: string[];
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// INSURANCE NEEDS CALCULATOR
// ============================================================================

export class InsuranceNeedsCalculator {
  /**
   * Main insurance needs analysis method
   *
   * @param input - Insurance needs analysis input parameters
   * @returns Comprehensive insurance needs analysis results
   */
  static analyze(input: InsuranceNeedsInput): InsuranceNeedsResult {
    // Validate input
    const validated = InsuranceNeedsInputSchema.parse(input);

    // Calculate life insurance needs
    const lifeInsuranceAnalysis = this.calculateLifeInsuranceNeeds(validated);

    // Calculate disability insurance needs
    const disabilityInsuranceAnalysis = this.calculateDisabilityInsuranceNeeds(validated);

    // Calculate long-term care needs
    const longTermCareAnalysis = this.calculateLongTermCareNeeds(validated);

    // Calculate overall insurance summary
    const insuranceSummary = this.calculateInsuranceSummary(
      validated,
      lifeInsuranceAnalysis,
      disabilityInsuranceAnalysis,
      longTermCareAnalysis
    );

    // Perform risk assessment
    const riskAssessment = this.performRiskAssessment(validated);

    // Calculate cost analysis
    const costAnalysis = this.calculateCostAnalysis(
      validated,
      lifeInsuranceAnalysis,
      disabilityInsuranceAnalysis,
      longTermCareAnalysis
    );

    // Generate insights and recommendations
    const insights = this.generateInsights(validated, insuranceSummary, riskAssessment);
    const warnings = this.generateWarnings(validated, insuranceSummary, riskAssessment);
    const recommendations = this.generateRecommendations(validated, insuranceSummary, costAnalysis);

    return {
      lifeInsuranceAnalysis,
      disabilityInsuranceAnalysis,
      longTermCareAnalysis,
      insuranceSummary,
      riskAssessment,
      costAnalysis,
      insights,
      warnings: warnings.length > 0 ? warnings : [],
      recommendations,
    };
  }

  /**
   * Calculate life insurance needs
   */
  private static calculateLifeInsuranceNeeds(input: InsuranceNeedsInput) {
    const { personalInfo, financialSituation, goals, currentInsurance } = input;

    // Calculate human life value
    const humanLifeValue = this.calculateHumanLifeValue(personalInfo);

    // Calculate income replacement needs
    const incomeReplacementNeeds = this.calculateIncomeReplacementNeeds(
      personalInfo,
      goals,
      input.analysis
    );

    // Calculate debt coverage needs
    const debtCoverageNeeds = goals.debtPayoffGoal ? financialSituation.totalDebts : 0;

    // Calculate education funding needs
    const educationFundingNeeds = goals.educationFunding;

    // Calculate final expense needs
    const finalExpenseNeeds = personalInfo.annualIncome * 0.1; // 10% of annual income

    // Calculate total recommended coverage
    const totalRecommendedCoverage =
      incomeReplacementNeeds + debtCoverageNeeds + educationFundingNeeds + finalExpenseNeeds;

    // Calculate current coverage
    const currentCoverage =
      currentInsurance.lifeInsurance.termLife.coverage +
      currentInsurance.lifeInsurance.wholeLife.coverage;

    // Calculate coverage gap
    const coverageGap = Math.max(0, totalRecommendedCoverage - currentCoverage);

    // Determine coverage adequacy
    let coverageAdequacy: 'adequate' | 'underinsured' | 'overinsured';
    if (currentCoverage >= totalRecommendedCoverage * 0.9) {
      coverageAdequacy = 'adequate';
    } else if (currentCoverage < totalRecommendedCoverage * 0.7) {
      coverageAdequacy = 'underinsured';
    } else {
      coverageAdequacy = 'overinsured';
    }

    // Calculate recommended term years
    const recommendedTermYears = this.calculateRecommendedTermYears(personalInfo);

    // Estimate monthly premium
    const estimatedMonthlyPremium = this.estimateLifeInsurancePremium(
      totalRecommendedCoverage,
      personalInfo.age,
      personalInfo.healthStatus,
      recommendedTermYears
    );

    return {
      humanLifeValue,
      incomeReplacementNeeds,
      debtCoverageNeeds,
      educationFundingNeeds,
      finalExpenseNeeds,
      totalRecommendedCoverage,
      currentCoverage,
      coverageGap,
      coverageAdequacy,
      recommendedTermYears,
      estimatedMonthlyPremium,
    };
  }

  /**
   * Calculate disability insurance needs
   */
  private static calculateDisabilityInsuranceNeeds(input: InsuranceNeedsInput) {
    const { personalInfo, currentInsurance, goals } = input;

    // Calculate income replacement needs
    const incomeReplacementNeeds = personalInfo.annualIncome * goals.incomeReplacementRatio;

    // Calculate current coverage
    const currentCoverage =
      currentInsurance.disabilityInsurance.shortTerm.coverage +
      currentInsurance.disabilityInsurance.longTerm.coverage;

    // Calculate coverage gap
    const coverageGap = Math.max(0, incomeReplacementNeeds - currentCoverage);

    // Calculate recommended coverage
    const recommendedCoverage = incomeReplacementNeeds;

    // Calculate short-term needs
    const shortTermNeeds = {
      recommendedCoverage: personalInfo.monthlyExpenses * 3, // 3 months expenses
      waitingPeriod: 0, // Immediate
      benefitPeriod: 6, // 6 months
    };

    // Calculate long-term needs
    const longTermNeeds = {
      recommendedCoverage: incomeReplacementNeeds * 0.6, // 60% of income
      waitingPeriod: 90, // 90 days
      benefitPeriod: Math.min(65 - personalInfo.age, 20), // Until age 65 or 20 years
    };

    // Estimate monthly premium
    const estimatedMonthlyPremium = this.estimateDisabilityInsurancePremium(
      recommendedCoverage,
      personalInfo.age,
      personalInfo.occupation,
      personalInfo.healthStatus
    );

    return {
      incomeReplacementNeeds,
      currentCoverage,
      coverageGap,
      recommendedCoverage,
      shortTermNeeds,
      longTermNeeds,
      estimatedMonthlyPremium,
    };
  }

  /**
   * Calculate long-term care needs
   */
  private static calculateLongTermCareNeeds(input: InsuranceNeedsInput) {
    const { personalInfo, currentInsurance, analysis } = input;

    // Calculate projected costs
    const currentAnnualCost = 100000; // Average annual LTC cost
    const projectedCostAtAge65 = this.calculateProjectedCost(
      currentAnnualCost,
      personalInfo.age,
      65,
      analysis.inflationRate
    );
    const projectedCostAtAge75 = this.calculateProjectedCost(
      currentAnnualCost,
      personalInfo.age,
      75,
      analysis.inflationRate
    );
    const projectedCostAtAge85 = this.calculateProjectedCost(
      currentAnnualCost,
      personalInfo.age,
      85,
      analysis.inflationRate
    );

    // Calculate recommended coverage
    const recommendedCoverage = {
      dailyBenefit: 300, // $300 per day
      benefitPeriod: 3, // 3 years
      eliminationPeriod: 90, // 90 days
      totalCoverage: 300 * 365 * 3, // Total coverage amount
    };

    // Calculate current coverage
    const currentCoverage = currentInsurance.longTermCare.coverage;

    // Calculate coverage gap
    const coverageGap = Math.max(0, recommendedCoverage.totalCoverage - currentCoverage);

    // Estimate monthly premium
    const estimatedMonthlyPremium = this.estimateLongTermCarePremium(
      recommendedCoverage.dailyBenefit,
      recommendedCoverage.benefitPeriod,
      personalInfo.age,
      personalInfo.healthStatus
    );

    // Assess self-insurance feasibility
    const selfInsuranceFeasibility = this.assessSelfInsuranceFeasibility(
      input.financialSituation,
      recommendedCoverage.totalCoverage
    );

    return {
      projectedCosts: {
        currentAnnualCost,
        projectedCostAtAge65,
        projectedCostAtAge75,
        projectedCostAtAge85,
      },
      recommendedCoverage,
      currentCoverage,
      coverageGap,
      estimatedMonthlyPremium,
      selfInsuranceFeasibility,
    };
  }

  /**
   * Calculate insurance summary
   */
  private static calculateInsuranceSummary(
    input: InsuranceNeedsInput,
    lifeInsuranceAnalysis: InsuranceNeedsResult['lifeInsuranceAnalysis'],
    disabilityInsuranceAnalysis: InsuranceNeedsResult['disabilityInsuranceAnalysis'],
    longTermCareAnalysis: InsuranceNeedsResult['longTermCareAnalysis']
  ) {
    const totalRecommendedCoverage =
      lifeInsuranceAnalysis.totalRecommendedCoverage +
      disabilityInsuranceAnalysis.recommendedCoverage +
      longTermCareAnalysis.recommendedCoverage.totalCoverage;

    const totalCurrentCoverage =
      lifeInsuranceAnalysis.currentCoverage +
      disabilityInsuranceAnalysis.currentCoverage +
      longTermCareAnalysis.currentCoverage;

    const totalCoverageGap = Math.max(0, totalRecommendedCoverage - totalCurrentCoverage);

    const totalMonthlyPremiums =
      lifeInsuranceAnalysis.estimatedMonthlyPremium +
      disabilityInsuranceAnalysis.estimatedMonthlyPremium +
      longTermCareAnalysis.estimatedMonthlyPremium;

    // Calculate insurance health score
    const insuranceHealthScore = this.calculateInsuranceHealthScore(
      lifeInsuranceAnalysis,
      disabilityInsuranceAnalysis,
      longTermCareAnalysis
    );

    // Generate priority recommendations
    const priorityRecommendations = this.generatePriorityRecommendations(
      input,
      lifeInsuranceAnalysis,
      disabilityInsuranceAnalysis,
      longTermCareAnalysis
    );

    return {
      totalRecommendedCoverage,
      totalCurrentCoverage,
      totalCoverageGap,
      totalMonthlyPremiums,
      insuranceHealthScore,
      priorityRecommendations,
    };
  }

  /**
   * Perform risk assessment
   */
  private static performRiskAssessment(input: InsuranceNeedsInput) {
    const riskFactors = [];

    // Age risk
    if (input.personalInfo.age > 50) {
      riskFactors.push({
        factor: 'Age',
        riskLevel: 'medium' as const,
        impact: 'Higher insurance costs and potential health issues',
        mitigation: 'Consider purchasing insurance sooner rather than later',
      });
    }

    // Health risk
    if (input.personalInfo.healthStatus === 'poor') {
      riskFactors.push({
        factor: 'Health Status',
        riskLevel: 'high' as const,
        impact: 'Higher premiums and potential coverage denials',
        mitigation: 'Improve health habits and consider guaranteed issue policies',
      });
    }

    // Occupation risk
    if (input.personalInfo.occupation && this.isHighRiskOccupation(input.personalInfo.occupation)) {
      riskFactors.push({
        factor: 'Occupation',
        riskLevel: 'high' as const,
        impact: 'Higher disability insurance costs',
        mitigation: 'Consider occupational-specific disability insurance',
      });
    }

    // Dependents risk
    if (input.personalInfo.dependents > 0) {
      riskFactors.push({
        factor: 'Dependents',
        riskLevel: 'medium' as const,
        impact: 'Higher life insurance needs',
        mitigation: 'Ensure adequate life insurance coverage',
      });
    }

    // Calculate overall risk level
    const highRiskCount = riskFactors.filter((rf) => rf.riskLevel === 'high').length;
    const mediumRiskCount = riskFactors.filter((rf) => rf.riskLevel === 'medium').length;

    let overallRiskLevel: 'low' | 'medium' | 'high';
    if (highRiskCount > 0) {
      overallRiskLevel = 'high';
    } else if (mediumRiskCount > 1) {
      overallRiskLevel = 'medium';
    } else {
      overallRiskLevel = 'low';
    }

    // Generate recommendations
    const recommendations = this.generateRiskRecommendations(riskFactors);

    return {
      overallRiskLevel,
      riskFactors,
      recommendations,
    };
  }

  /**
   * Calculate cost analysis
   */
  private static calculateCostAnalysis(
    input: InsuranceNeedsInput,
    lifeInsuranceAnalysis: InsuranceNeedsResult['lifeInsuranceAnalysis'],
    disabilityInsuranceAnalysis: InsuranceNeedsResult['disabilityInsuranceAnalysis'],
    longTermCareAnalysis: InsuranceNeedsResult['longTermCareAnalysis']
  ) {
    const currentMonthlyPremiums =
      input.currentInsurance.lifeInsurance.termLife.monthlyPremium +
      input.currentInsurance.lifeInsurance.wholeLife.monthlyPremium +
      input.currentInsurance.disabilityInsurance.shortTerm.monthlyPremium +
      input.currentInsurance.disabilityInsurance.longTerm.monthlyPremium +
      input.currentInsurance.longTermCare.monthlyPremium;

    const recommendedMonthlyPremiums =
      lifeInsuranceAnalysis.estimatedMonthlyPremium +
      disabilityInsuranceAnalysis.estimatedMonthlyPremium +
      longTermCareAnalysis.estimatedMonthlyPremium;

    const premiumIncrease = recommendedMonthlyPremiums - currentMonthlyPremiums;

    const totalProtectionValue =
      lifeInsuranceAnalysis.totalRecommendedCoverage +
      disabilityInsuranceAnalysis.recommendedCoverage +
      longTermCareAnalysis.recommendedCoverage.totalCoverage;

    const totalPremiumCost = recommendedMonthlyPremiums * 12;

    const protectionRatio = totalProtectionValue / totalPremiumCost;

    // Assess affordability
    const affordabilityAssessment = this.assessAffordability(
      recommendedMonthlyPremiums,
      input.personalInfo.annualIncome
    );

    return {
      currentMonthlyPremiums,
      recommendedMonthlyPremiums,
      premiumIncrease,
      costBenefitAnalysis: {
        totalProtectionValue,
        totalPremiumCost,
        protectionRatio,
      },
      affordabilityAssessment,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate human life value
   */
  private static calculateHumanLifeValue(personalInfo: any): number {
    const yearsToRetirement = Math.max(0, 65 - personalInfo.age);
    const presentValue = this.calculatePresentValue(
      personalInfo.annualIncome,
      yearsToRetirement,
      0.05 // 5% discount rate
    );
    return presentValue;
  }

  /**
   * Calculate income replacement needs
   */
  private static calculateIncomeReplacementNeeds(
    personalInfo: any,
    goals: any,
    analysis: any
  ): number {
    const yearsToRetirement = Math.max(0, 65 - personalInfo.age);
    const annualReplacementIncome = personalInfo.annualIncome * goals.incomeReplacementRatio;
    return this.calculatePresentValue(
      annualReplacementIncome,
      yearsToRetirement,
      analysis.discountRate
    );
  }

  /**
   * Calculate recommended term years
   */
  private static calculateRecommendedTermYears(personalInfo: any): number {
    const yearsToRetirement = Math.max(0, 65 - personalInfo.age);
    const yearsUntilChildrenIndependent = Math.max(0, 25 - personalInfo.age);
    return Math.min(yearsToRetirement, yearsUntilChildrenIndependent, 30);
  }

  /**
   * Calculate projected cost
   */
  private static calculateProjectedCost(
    currentCost: number,
    currentAge: number,
    targetAge: number,
    inflationRate: number
  ): number {
    const years = targetAge - currentAge;
    return currentCost * Math.pow(1 + inflationRate, years);
  }

  /**
   * Calculate present value
   */
  private static calculatePresentValue(
    annualAmount: number,
    years: number,
    discountRate: number
  ): number {
    if (discountRate === 0) {
      return annualAmount * years;
    }
    return (annualAmount * (1 - Math.pow(1 + discountRate, -years))) / discountRate;
  }

  /**
   * Calculate insurance health score
   */
  private static calculateInsuranceHealthScore(
    lifeInsuranceAnalysis: any,
    disabilityInsuranceAnalysis: any,
    longTermCareAnalysis: any
  ): number {
    const lifeScore =
      lifeInsuranceAnalysis.coverageAdequacy === 'adequate'
        ? 100
        : lifeInsuranceAnalysis.coverageAdequacy === 'underinsured'
          ? 50
          : 75;

    const disabilityScore =
      disabilityInsuranceAnalysis.coverageGap === 0
        ? 100
        : disabilityInsuranceAnalysis.coverageGap <
            disabilityInsuranceAnalysis.recommendedCoverage * 0.3
          ? 75
          : 50;

    const ltCareScore =
      longTermCareAnalysis.coverageGap === 0
        ? 100
        : longTermCareAnalysis.coverageGap <
            longTermCareAnalysis.recommendedCoverage.totalCoverage * 0.3
          ? 75
          : 50;

    return Math.round((lifeScore + disabilityScore + ltCareScore) / 3);
  }

  /**
   * Generate priority recommendations
   */
  private static generatePriorityRecommendations(
    _input: InsuranceNeedsInput,
    lifeInsuranceAnalysis: InsuranceNeedsResult['lifeInsuranceAnalysis'],
    disabilityInsuranceAnalysis: InsuranceNeedsResult['disabilityInsuranceAnalysis'],
    longTermCareAnalysis: InsuranceNeedsResult['longTermCareAnalysis']
  ) {
    const recommendations = [];

    // Life insurance priority
    if (lifeInsuranceAnalysis.coverageGap > 0) {
      recommendations.push({
        type: 'life' as const,
        priority:
          lifeInsuranceAnalysis.coverageGap > lifeInsuranceAnalysis.totalRecommendedCoverage * 0.5
            ? ('high' as const)
            : ('medium' as const),
        reason: `Life insurance coverage gap of $${lifeInsuranceAnalysis.coverageGap.toLocaleString()}`,
        estimatedCost: lifeInsuranceAnalysis.estimatedMonthlyPremium,
        impact: 'Protects family from financial hardship',
      });
    }

    // Disability insurance priority
    if (disabilityInsuranceAnalysis.coverageGap > 0) {
      recommendations.push({
        type: 'disability' as const,
        priority:
          disabilityInsuranceAnalysis.coverageGap >
          disabilityInsuranceAnalysis.recommendedCoverage * 0.5
            ? ('high' as const)
            : ('medium' as const),
        reason: `Disability insurance coverage gap of $${disabilityInsuranceAnalysis.coverageGap.toLocaleString()}`,
        estimatedCost: disabilityInsuranceAnalysis.estimatedMonthlyPremium,
        impact: 'Protects income during disability',
      });
    }

    // Long-term care priority
    if (longTermCareAnalysis.coverageGap > 0) {
      recommendations.push({
        type: 'long-term-care' as const,
        priority: _input.personalInfo.age > 50 ? ('high' as const) : ('medium' as const),
        reason: `Long-term care coverage gap of $${longTermCareAnalysis.coverageGap.toLocaleString()}`,
        estimatedCost: longTermCareAnalysis.estimatedMonthlyPremium,
        impact: 'Protects assets from long-term care costs',
      });
    }

    return recommendations;
  }

  /**
   * Assess self-insurance feasibility
   */
  private static assessSelfInsuranceFeasibility(
    financialSituation: InsuranceNeedsInput['financialSituation'],
    recommendedCoverage: number
  ): boolean {
    const liquidAssets = financialSituation.totalAssets - financialSituation.retirementSavings;
    return liquidAssets >= recommendedCoverage * 2; // Need 2x coverage in liquid assets
  }

  /**
   * Assess affordability
   */
  private static assessAffordability(
    monthlyPremiums: number,
    annualIncome: number
  ): 'affordable' | 'stretch' | 'unaffordable' {
    const premiumRatio = (monthlyPremiums * 12) / annualIncome;

    if (premiumRatio <= 0.05) return 'affordable';
    if (premiumRatio <= 0.1) return 'stretch';
    return 'unaffordable';
  }

  /**
   * Check if occupation is high risk
   */
  private static isHighRiskOccupation(occupation: string): boolean {
    const highRiskOccupations = [
      'construction worker',
      'firefighter',
      'police officer',
      'pilot',
      'truck driver',
      'roofer',
      'electrician',
      'plumber',
    ];
    return highRiskOccupations.some((risk) => occupation.toLowerCase().includes(risk));
  }

  /**
   * Generate risk recommendations
   */
  private static generateRiskRecommendations(
    riskFactors: InsuranceNeedsResult['riskAssessment']['riskFactors']
  ): string[] {
    const recommendations = [];

    if (riskFactors.some((rf) => rf.factor === 'Age')) {
      recommendations.push('Consider purchasing insurance while younger and healthier');
    }

    if (riskFactors.some((rf) => rf.factor === 'Health Status')) {
      recommendations.push('Focus on improving health habits to reduce insurance costs');
    }

    if (riskFactors.some((rf) => rf.factor === 'Occupation')) {
      recommendations.push('Consider occupational-specific disability insurance');
    }

    return recommendations;
  }

  /**
   * Estimate life insurance premium
   */
  private static estimateLifeInsurancePremium(
    coverage: number,
    age: number,
    healthStatus: string,
    termYears: number
  ): number {
    let baseRate = 0.0005; // Base rate per $1000 coverage

    // Age adjustment
    if (age > 40) baseRate *= 1.5;
    if (age > 50) baseRate *= 2;

    // Health adjustment
    if (healthStatus === 'excellent') baseRate *= 0.8;
    if (healthStatus === 'poor') baseRate *= 2;

    // Term adjustment
    if (termYears > 20) baseRate *= 1.2;

    return (coverage / 1000) * baseRate;
  }

  /**
   * Estimate disability insurance premium
   */
  private static estimateDisabilityInsurancePremium(
    coverage: number,
    age: number,
    occupation: string | undefined,
    healthStatus: string
  ): number {
    let baseRate = 0.002; // Base rate per $1000 coverage

    // Age adjustment
    if (age > 40) baseRate *= 1.3;
    if (age > 50) baseRate *= 1.8;

    // Occupation adjustment
    if (occupation && this.isHighRiskOccupation(occupation)) baseRate *= 2;

    // Health adjustment
    if (healthStatus === 'excellent') baseRate *= 0.8;
    if (healthStatus === 'poor') baseRate *= 1.5;

    return (coverage / 1000) * baseRate;
  }

  /**
   * Estimate long-term care premium
   */
  private static estimateLongTermCarePremium(
    dailyBenefit: number,
    benefitPeriod: number,
    age: number,
    healthStatus: string
  ): number {
    let baseRate = 0.001; // Base rate per $1000 coverage

    // Age adjustment
    if (age > 50) baseRate *= 1.5;
    if (age > 60) baseRate *= 2;

    // Health adjustment
    if (healthStatus === 'excellent') baseRate *= 0.8;
    if (healthStatus === 'poor') baseRate *= 1.5;

    const totalCoverage = dailyBenefit * 365 * benefitPeriod;
    return (totalCoverage / 1000) * baseRate;
  }

  /**
   * Generate insights
   */
  private static generateInsights(
    _input: InsuranceNeedsInput,
    insuranceSummary: InsuranceNeedsResult['insuranceSummary'],
    _riskAssessment: InsuranceNeedsResult['riskAssessment']
  ): string[] {
    const insights = [];

    insights.push(
      `Your total recommended insurance coverage is $${insuranceSummary.totalRecommendedCoverage.toLocaleString()}`
    );

    if (insuranceSummary.totalCoverageGap > 0) {
      insights.push(
        `You have a coverage gap of $${insuranceSummary.totalCoverageGap.toLocaleString()} across all insurance types`
      );
    } else {
      insights.push('Your current insurance coverage appears adequate');
    }

    insights.push(`Your insurance health score is ${insuranceSummary.insuranceHealthScore}/100`);

    if (_riskAssessment.overallRiskLevel === 'high') {
      insights.push('You have several high-risk factors that increase your insurance needs');
    } else if (_riskAssessment.overallRiskLevel === 'low') {
      insights.push('You have a low-risk profile, which should result in lower insurance costs');
    }

    return insights;
  }

  /**
   * Generate warnings
   */
  private static generateWarnings(
    _input: InsuranceNeedsInput,
    insuranceSummary: InsuranceNeedsResult['insuranceSummary'],
    _riskAssessment: InsuranceNeedsResult['riskAssessment']
  ): string[] {
    const warnings = [];

    if (insuranceSummary.totalCoverageGap > 100000) {
      // Large gap threshold
      warnings.push('Large coverage gap detected - consider increasing insurance coverage');
    }

    if (insuranceSummary.insuranceHealthScore < 50) {
      warnings.push('Low insurance health score - consider implementing recommended strategies');
    }

    return warnings;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    input: InsuranceNeedsInput,
    insuranceSummary: InsuranceNeedsResult['insuranceSummary'],
    costAnalysis: InsuranceNeedsResult['costAnalysis']
  ): string[] {
    const recommendations = [];

    // Priority recommendations
    const highPriority = insuranceSummary.priorityRecommendations.filter(
      (r) => r.priority === 'high'
    );
    if (highPriority.length > 0) {
      recommendations.push(
        `Priority: Address ${highPriority.map((r) => r.type).join(', ')} insurance needs`
      );
    }

    // Affordability recommendations
    if (costAnalysis.affordabilityAssessment === 'unaffordable') {
      recommendations.push(
        'Consider reducing coverage amounts or increasing income to afford recommended insurance'
      );
    } else if (costAnalysis.affordabilityAssessment === 'stretch') {
      recommendations.push('Insurance costs are manageable but may require budget adjustments');
    }

    // Age-based recommendations
    if (input.personalInfo.age < 30) {
      recommendations.push('Consider purchasing term life insurance while young and healthy');
    } else if (input.personalInfo.age > 50) {
      recommendations.push('Focus on long-term care insurance and review existing coverage');
    }

    // Health recommendations
    if (input.personalInfo.healthStatus === 'poor') {
      recommendations.push(
        'Improve health habits to reduce insurance costs and improve insurability'
      );
    }

    return recommendations;
  }
}
