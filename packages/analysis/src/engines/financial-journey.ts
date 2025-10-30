/**
 * Financial Journey Analysis Engine
 * Multi-stage financial planning and analysis system
 *
 * Implements comprehensive financial journey analysis including:
 * - Multi-stage financial planning workflows
 * - Journey-based recommendations
 * - Cross-model analysis integration
 * - Progress tracking and milestones
 * - Personalized action plans
 * - Goal achievement optimization
 */

import { Decimal } from 'decimal.js';
import { z } from 'zod';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const FinancialJourneyInputSchema = z.object({
  // Personal Information
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    dependents: z.number().min(0).max(10).default(0),
    employmentStatus: z.enum(['employed', 'self-employed', 'unemployed', 'retired']),
    annualIncome: z.number().min(0),
    monthlyExpenses: z.number().min(0),
  }),

  // Current Financial Situation
  currentFinancials: z.object({
    totalAssets: z.number().min(0),
    totalDebts: z.number().min(0),
    emergencyFund: z.number().min(0).default(0),
    monthlySavings: z.number().min(0).default(0),
    creditScore: z.number().min(300).max(850).optional(),
  }),

  // Financial Goals
  financialGoals: z.object({
    shortTermGoals: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          targetAmount: z.number().min(0),
          targetDate: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
          category: z.enum(['emergency', 'debt', 'savings', 'purchase', 'other']),
        })
      )
      .default([]),
    mediumTermGoals: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          targetAmount: z.number().min(0),
          targetDate: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
          category: z.enum(['home', 'education', 'vehicle', 'business', 'other']),
        })
      )
      .default([]),
    longTermGoals: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          targetAmount: z.number().min(0),
          targetDate: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
          category: z.enum(['retirement', 'legacy', 'financial-independence', 'other']),
        })
      )
      .default([]),
  }),

  // Journey Stage
  journeyStage: z
    .enum([
      'getting-started',
      'debt-management',
      'emergency-funding',
      'home-buying',
      'investment-building',
      'retirement-planning',
      'wealth-preservation',
      'legacy-planning',
    ])
    .default('getting-started'),

  // Analysis Parameters
  analysis: z.object({
    includeCrossModelAnalysis: z.boolean().default(true),
    includeProgressTracking: z.boolean().default(true),
    includeMilestoneAnalysis: z.boolean().default(true),
    includeActionPlan: z.boolean().default(true),
    includeRiskAssessment: z.boolean().default(true),
    timeHorizon: z.number().min(1).max(50).default(20), // years
  }),

  // Risk Tolerance
  riskTolerance: z.object({
    investmentRisk: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
    debtTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
    emergencyTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
});

export type FinancialJourneyInput = z.infer<typeof FinancialJourneyInputSchema>;

const formatISODate = (date: Date): string => date.toISOString().slice(0, 10);

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface FinancialJourneyResult {
  // Journey Overview
  journeyOverview: {
    currentStage: string;
    stageDescription: string;
    nextStage: string;
    progressPercentage: number;
    estimatedTimeToNextStage: string;
    overallFinancialHealth: number; // 0-100 score
  };

  // Stage-Specific Analysis
  stageAnalysis: {
    currentStageAnalysis: {
      keyMetrics: Record<string, number>;
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    nextStagePreparation: {
      requirements: string[];
      prerequisites: string[];
      estimatedCost: number;
      timeline: string;
    };
  };

  // Cross-Model Analysis
  crossModelAnalysis?: {
    debtAnalysis: {
      totalDebt: number;
      debtToIncomeRatio: number;
      recommendedStrategy: string;
      estimatedPayoffTime: string;
    };
    emergencyFundAnalysis: {
      currentAmount: number;
      recommendedAmount: number;
      monthsToComplete: number;
      priority: 'high' | 'medium' | 'low';
    };
    investmentAnalysis: {
      currentAllocation: Record<string, number>;
      recommendedAllocation: Record<string, number>;
      riskLevel: string;
    };
    retirementAnalysis: {
      currentSavings: number;
      projectedRetirementIncome: number;
      retirementReadiness: number;
    };
  };

  // Progress Tracking
  progressTracking?: {
    milestones: Array<{
      id: string;
      name: string;
      description: string;
      targetDate: string;
      progress: number; // 0-100
      status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
      nextAction: string;
    }>;
    goalProgress: Array<{
      goalId: string;
      goalName: string;
      currentProgress: number;
      targetProgress: number;
      onTrack: boolean;
      estimatedCompletion: string;
    }>;
  };

  // Action Plan
  actionPlan: {
    immediateActions: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      impact: string;
      timeline: string;
      estimatedCost: number;
      category: string;
    }>;
    shortTermActions: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      impact: string;
      timeline: string;
      estimatedCost: number;
      category: string;
    }>;
    longTermActions: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      impact: string;
      timeline: string;
      estimatedCost: number;
      category: string;
    }>;
  };

  // Risk Assessment
  riskAssessment?: {
    financialRisks: Array<{
      risk: string;
      probability: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
    opportunityRisks: Array<{
      opportunity: string;
      riskLevel: 'low' | 'medium' | 'high';
      potentialReturn: number;
      recommendation: string;
    }>;
  };

  // Journey Roadmap
  journeyRoadmap: {
    stages: Array<{
      stage: string;
      description: string;
      estimatedDuration: string;
      keyActions: string[];
      successMetrics: string[];
      prerequisites: string[];
    }>;
    currentStageIndex: number;
    totalStages: number;
  };

  // Recommendations
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    action: string;
    timeline: string;
    estimatedCost: number;
  }>;

  // Insights
  insights: string[];

  // Metadata
  metadata: {
    calculatedAt: string;
    version: string;
    methodology: string;
    assumptions: Record<string, any>;
  };
}

// ============================================================================
// FINANCIAL JOURNEY ANALYSIS ENGINE
// ============================================================================

export class FinancialJourneyAnalysisEngine {
  /**
   * Main financial journey analysis method
   *
   * @param input - Financial journey analysis input parameters
   * @returns Comprehensive financial journey analysis results
   */
  static analyze(input: FinancialJourneyInput): FinancialJourneyResult {
    const validated = FinancialJourneyInputSchema.parse(input);

    // Set precision for financial calculations
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

    // Calculate journey overview
    const journeyOverview = this.calculateJourneyOverview(validated);

    // Calculate stage-specific analysis
    const stageAnalysis = this.calculateStageAnalysis(validated);

    // Perform cross-model analysis if requested
    const crossModelAnalysis = validated.analysis.includeCrossModelAnalysis
      ? this.performCrossModelAnalysis(validated)
      : undefined;

    // Calculate progress tracking if requested
    const progressTracking = validated.analysis.includeProgressTracking
      ? this.calculateProgressTracking(validated)
      : undefined;

    // Generate action plan
    const actionPlan = this.generateActionPlan(validated, stageAnalysis);

    // Calculate risk assessment if requested
    const riskAssessment = validated.analysis.includeRiskAssessment
      ? this.calculateRiskAssessment(validated)
      : undefined;

    // Generate journey roadmap
    const journeyRoadmap = this.generateJourneyRoadmap(validated);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      validated,
      stageAnalysis,
      crossModelAnalysis
    );

    // Generate insights
    const insights = this.generateInsights(validated, journeyOverview, stageAnalysis);

    const result: FinancialJourneyResult = {
      journeyOverview,
      stageAnalysis,
      actionPlan,
      journeyRoadmap,
      recommendations,
      insights,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: '1.0.0',
        methodology: 'Financial Journey Analysis',
        assumptions: {
          timeHorizon: validated.analysis.timeHorizon,
          riskTolerance: validated.riskTolerance,
        },
      },
    };

    if (crossModelAnalysis) {
      result.crossModelAnalysis = crossModelAnalysis;
    }
    if (progressTracking) {
      result.progressTracking = progressTracking;
    }
    if (riskAssessment) {
      result.riskAssessment = riskAssessment;
    }

    return result;
  }

  /**
   * Calculate journey overview
   */
  private static calculateJourneyOverview(input: FinancialJourneyInput) {
    const currentStage = input.journeyStage;
    const stageInfo = this.getStageInfo(currentStage);
    const nextStage = this.getNextStage(currentStage);
    const progressPercentage = this.calculateProgressPercentage(input);
    const estimatedTimeToNextStage = this.estimateTimeToNextStage(input, currentStage);
    const overallFinancialHealth = this.calculateFinancialHealthScore(input);

    return {
      currentStage,
      stageDescription: stageInfo.description,
      nextStage,
      progressPercentage,
      estimatedTimeToNextStage,
      overallFinancialHealth,
    };
  }

  /**
   * Calculate stage-specific analysis
   */
  private static calculateStageAnalysis(input: FinancialJourneyInput) {
    const currentStageAnalysis = this.analyzeCurrentStage(input);
    const nextStagePreparation = this.prepareNextStage(input);

    return {
      currentStageAnalysis,
      nextStagePreparation,
    };
  }

  /**
   * Perform cross-model analysis
   */
  private static performCrossModelAnalysis(input: FinancialJourneyInput) {
    // Debt analysis
    const debtAnalysis = {
      totalDebt: input.currentFinancials.totalDebts,
      debtToIncomeRatio: input.currentFinancials.totalDebts / input.personalInfo.annualIncome,
      recommendedStrategy: this.getDebtStrategy(input),
      estimatedPayoffTime: this.estimateDebtPayoffTime(input),
    };

    // Emergency fund analysis
    const emergencyFundAnalysis = {
      currentAmount: input.currentFinancials.emergencyFund,
      recommendedAmount: input.personalInfo.monthlyExpenses * 6, // 6 months expenses
      monthsToComplete: this.calculateMonthsToEmergencyFund(input),
      priority: this.getEmergencyFundPriority(input),
    };

    // Investment analysis
    const investmentAnalysis = {
      currentAllocation: this.getCurrentInvestmentAllocation(input),
      recommendedAllocation: this.getRecommendedInvestmentAllocation(input),
      riskLevel: input.riskTolerance.investmentRisk,
    };

    // Retirement analysis
    const retirementAnalysis = {
      currentSavings: this.getCurrentRetirementSavings(input),
      projectedRetirementIncome: this.projectRetirementIncome(input),
      retirementReadiness: this.calculateRetirementReadiness(input),
    };

    return {
      debtAnalysis,
      emergencyFundAnalysis,
      investmentAnalysis,
      retirementAnalysis,
    };
  }

  /**
   * Calculate progress tracking
   */
  private static calculateProgressTracking(input: FinancialJourneyInput) {
    const milestones = this.generateMilestones(input);
    const goalProgress = this.calculateGoalProgress(input);

    return {
      milestones,
      goalProgress,
    };
  }

  /**
   * Generate action plan
   */
  private static generateActionPlan(input: FinancialJourneyInput, stageAnalysis: any) {
    const immediateActions = this.generateImmediateActions(input, stageAnalysis);
    const shortTermActions = this.generateShortTermActions(input, stageAnalysis);
    const longTermActions = this.generateLongTermActions(input, stageAnalysis);

    return {
      immediateActions,
      shortTermActions,
      longTermActions,
    };
  }

  /**
   * Calculate risk assessment
   */
  private static calculateRiskAssessment(input: FinancialJourneyInput) {
    const financialRisks = this.identifyFinancialRisks(input);
    const opportunityRisks = this.identifyOpportunityRisks(input);

    return {
      financialRisks,
      opportunityRisks,
    };
  }

  /**
   * Generate journey roadmap
   */
  private static generateJourneyRoadmap(input: FinancialJourneyInput) {
    const stages = this.getAllStages();
    const currentStageIndex = stages.findIndex((stage) => stage.stage === input.journeyStage);

    return {
      stages,
      currentStageIndex,
      totalStages: stages.length,
    };
  }

  /**
   * Get stage information
   */
  private static getStageInfo(stage: string) {
    const stageMap: Record<string, { description: string }> = {
      'getting-started': {
        description: 'Building financial foundation and establishing good habits',
      },
      'debt-management': {
        description: 'Eliminating high-interest debt and improving credit',
      },
      'emergency-funding': {
        description: 'Building emergency fund for financial security',
      },
      'home-buying': {
        description: 'Saving for down payment and preparing for homeownership',
      },
      'investment-building': {
        description: 'Building wealth through strategic investing',
      },
      'retirement-planning': {
        description: 'Maximizing retirement savings and planning for future',
      },
      'wealth-preservation': {
        description: 'Protecting and growing accumulated wealth',
      },
      'legacy-planning': {
        description: 'Planning for wealth transfer and legacy goals',
      },
    };

    return stageMap[stage] || { description: 'Unknown stage' };
  }

  /**
   * Get next stage
   */
  private static getNextStage(currentStage: string): string {
    const stageOrder = [
      'getting-started',
      'debt-management',
      'emergency-funding',
      'home-buying',
      'investment-building',
      'retirement-planning',
      'wealth-preservation',
      'legacy-planning',
    ];

    const currentIndex = stageOrder.indexOf(currentStage);
    return currentIndex < stageOrder.length - 1 && currentIndex >= 0
      ? stageOrder[currentIndex + 1]!
      : 'completed';
  }

  /**
   * Calculate progress percentage
   */
  private static calculateProgressPercentage(input: FinancialJourneyInput): number {
    const stageMetrics = this.getStageMetrics(input.journeyStage, input);
    const totalMetrics = Object.keys(stageMetrics).length;
    const completedMetrics = Object.values(stageMetrics).filter((metric) => metric >= 0.8).length;

    return Math.round((completedMetrics / totalMetrics) * 100);
  }

  /**
   * Estimate time to next stage
   */
  private static estimateTimeToNextStage(
    input: FinancialJourneyInput,
    currentStage: string
  ): string {
    const stageMetrics = this.getStageMetrics(currentStage, input);
    const avgProgress =
      Object.values(stageMetrics).reduce((sum, metric) => sum + metric, 0) /
      Object.values(stageMetrics).length;

    if (avgProgress >= 0.8) {
      return '3-6 months';
    } else if (avgProgress >= 0.6) {
      return '6-12 months';
    } else if (avgProgress >= 0.4) {
      return '1-2 years';
    } else {
      return '2-3 years';
    }
  }

  /**
   * Calculate financial health score
   */
  private static calculateFinancialHealthScore(input: FinancialJourneyInput): number {
    let score = 0;

    // Emergency fund score (25%)
    const emergencyFundRatio =
      input.currentFinancials.emergencyFund / (input.personalInfo.monthlyExpenses * 6);
    score += Math.min(25, emergencyFundRatio * 25);

    // Debt-to-income ratio score (25%)
    const debtToIncomeRatio = input.currentFinancials.totalDebts / input.personalInfo.annualIncome;
    score += Math.max(0, 25 - debtToIncomeRatio * 100);

    // Savings rate score (25%)
    const savingsRate = input.currentFinancials.monthlySavings / input.personalInfo.monthlyExpenses;
    score += Math.min(25, savingsRate * 25);

    // Net worth score (25%)
    const netWorth = input.currentFinancials.totalAssets - input.currentFinancials.totalDebts;
    const netWorthRatio = netWorth / input.personalInfo.annualIncome;
    score += Math.min(25, Math.max(0, netWorthRatio * 10));

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Get stage metrics
   */
  private static getStageMetrics(
    stage: string,
    input: FinancialJourneyInput
  ): Record<string, number> {
    const metrics: Record<string, Record<string, number>> = {
      'getting-started': {
        budgetTracking: input.currentFinancials.monthlySavings > 0 ? 1 : 0,
        expenseControl:
          input.personalInfo.monthlyExpenses < (input.personalInfo.annualIncome / 12) * 0.8
            ? 1
            : 0.5,
        financialEducation: 0.7, // Placeholder
      },
      'debt-management': {
        debtReduction:
          input.currentFinancials.totalDebts < input.personalInfo.annualIncome * 0.3 ? 1 : 0.5,
        paymentConsistency: 0.8, // Placeholder
        creditImprovement:
          input.currentFinancials.creditScore && input.currentFinancials.creditScore > 700
            ? 1
            : 0.6,
      },
      'emergency-funding': {
        fundAmount:
          input.currentFinancials.emergencyFund / (input.personalInfo.monthlyExpenses * 6),
        fundGrowth: input.currentFinancials.monthlySavings > 0 ? 1 : 0,
        fundAccessibility: 1, // Placeholder
      },
      'home-buying': {
        downPaymentSavings: 0.6, // Placeholder
        creditScore:
          input.currentFinancials.creditScore && input.currentFinancials.creditScore > 720
            ? 1
            : 0.7,
        debtToIncome:
          input.currentFinancials.totalDebts / input.personalInfo.annualIncome < 0.36 ? 1 : 0.5,
      },
      'investment-building': {
        investmentAllocation: 0.7, // Placeholder
        riskTolerance: 0.8, // Placeholder
        diversification: 0.6, // Placeholder
      },
      'retirement-planning': {
        retirementSavings: 0.5, // Placeholder
        contributionRate: 0.6, // Placeholder
        accountDiversification: 0.7, // Placeholder
      },
      'wealth-preservation': {
        assetProtection: 0.8, // Placeholder
        taxOptimization: 0.6, // Placeholder
        estatePlanning: 0.4, // Placeholder
      },
      'legacy-planning': {
        estatePlanning: 0.7, // Placeholder
        wealthTransfer: 0.5, // Placeholder
        charitableGiving: 0.6, // Placeholder
      },
    };

    return metrics[stage] || {};
  }

  /**
   * Analyze current stage
   */
  private static analyzeCurrentStage(input: FinancialJourneyInput) {
    const stageMetrics = this.getStageMetrics(input.journeyStage, input);

    const keyMetrics = stageMetrics;

    const strengths = this.identifyStrengths(stageMetrics);
    const weaknesses = this.identifyWeaknesses(stageMetrics);
    const opportunities = this.identifyOpportunities(input);
    const threats = this.identifyThreats(input);

    return {
      keyMetrics,
      strengths,
      weaknesses,
      opportunities,
      threats,
    };
  }

  /**
   * Prepare next stage
   */
  private static prepareNextStage(input: FinancialJourneyInput) {
    const nextStage = this.getNextStage(input.journeyStage);
    const requirements = this.getStageRequirements(nextStage);
    const prerequisites = this.getStagePrerequisites(nextStage);
    const estimatedCost = this.estimateStageCost(nextStage, input);
    const timeline = this.estimateStageTimeline(nextStage, input);

    return {
      requirements,
      prerequisites,
      estimatedCost,
      timeline,
    };
  }

  /**
   * Get stage requirements
   */
  private static getStageRequirements(stage: string): string[] {
    const requirements: Record<string, string[]> = {
      'debt-management': [
        'Create comprehensive debt inventory',
        'Establish debt payoff strategy',
        'Improve credit score',
      ],
      'emergency-funding': [
        'Build 3-6 months of expenses',
        'Establish high-yield savings account',
        'Create emergency fund strategy',
      ],
      'home-buying': [
        'Save 20% down payment',
        'Improve credit score to 720+',
        'Reduce debt-to-income ratio',
      ],
      'investment-building': [
        'Establish investment accounts',
        'Determine asset allocation',
        'Set up automatic investing',
      ],
      'retirement-planning': [
        'Maximize employer 401(k) match',
        'Open IRA accounts',
        'Calculate retirement needs',
      ],
      'wealth-preservation': [
        'Implement tax strategies',
        'Consider insurance needs',
        'Estate planning basics',
      ],
      'legacy-planning': [
        'Create comprehensive estate plan',
        'Consider charitable giving',
        'Plan wealth transfer',
      ],
    };

    return requirements[stage] || [];
  }

  /**
   * Get stage prerequisites
   */
  private static getStagePrerequisites(stage: string): string[] {
    const prerequisites: Record<string, string[]> = {
      'debt-management': ['Basic budgeting skills', 'Understanding of debt types'],
      'emergency-funding': ['Debt under control', 'Stable income'],
      'home-buying': ['Emergency fund established', 'Debt-to-income ratio < 36%'],
      'investment-building': ['Emergency fund complete', 'High-interest debt eliminated'],
      'retirement-planning': ['Emergency fund established', 'Basic investing knowledge'],
      'wealth-preservation': ['Significant assets accumulated', 'Basic estate planning'],
      'legacy-planning': ['Substantial wealth', 'Estate planning in place'],
    };

    return prerequisites[stage] || [];
  }

  /**
   * Estimate stage cost
   */
  private static estimateStageCost(stage: string, input: FinancialJourneyInput): number {
    const costEstimates: Record<string, number> = {
      'debt-management': input.currentFinancials.totalDebts * 0.1, // 10% of debt
      'emergency-funding':
        input.personalInfo.monthlyExpenses * 6 - input.currentFinancials.emergencyFund,
      'home-buying': input.personalInfo.annualIncome * 0.2, // 20% down payment
      'investment-building': input.personalInfo.annualIncome * 0.1, // 10% investment
      'retirement-planning': input.personalInfo.annualIncome * 0.15, // 15% retirement
      'wealth-preservation': input.personalInfo.annualIncome * 0.05, // 5% for planning
      'legacy-planning': input.personalInfo.annualIncome * 0.1, // 10% for planning
    };

    return Math.max(0, costEstimates[stage] || 0);
  }

  /**
   * Estimate stage timeline
   */
  private static estimateStageTimeline(stage: string, _input: FinancialJourneyInput): string {
    const timelines: Record<string, string> = {
      'debt-management': '1-3 years',
      'emergency-funding': '6-18 months',
      'home-buying': '2-5 years',
      'investment-building': 'Ongoing',
      'retirement-planning': 'Ongoing',
      'wealth-preservation': 'Ongoing',
      'legacy-planning': 'Ongoing',
    };

    return timelines[stage] || 'Unknown';
  }

  /**
   * Identify strengths
   */
  private static identifyStrengths(metrics: Record<string, number>): string[] {
    const strengths: string[] = [];

    Object.entries(metrics).forEach(([metric, value]) => {
      if (value >= 0.8) {
        strengths.push(`Strong performance in ${metric.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    });

    return strengths;
  }

  /**
   * Identify weaknesses
   */
  private static identifyWeaknesses(metrics: Record<string, number>): string[] {
    const weaknesses: string[] = [];

    Object.entries(metrics).forEach(([metric, value]) => {
      if (value < 0.5) {
        weaknesses.push(`Needs improvement in ${metric.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    });

    return weaknesses;
  }

  /**
   * Identify opportunities
   */
  private static identifyOpportunities(input: FinancialJourneyInput): string[] {
    const opportunities: string[] = [];

    if (input.currentFinancials.monthlySavings > 0) {
      opportunities.push('Increase savings rate for faster goal achievement');
    }

    if (input.currentFinancials.creditScore && input.currentFinancials.creditScore > 700) {
      opportunities.push('Take advantage of good credit for better rates');
    }

    if (input.personalInfo.age < 30) {
      opportunities.push('Leverage time for compound growth');
    }

    return opportunities;
  }

  /**
   * Identify threats
   */
  private static identifyThreats(input: FinancialJourneyInput): string[] {
    const threats: string[] = [];

    if (input.currentFinancials.totalDebts > input.personalInfo.annualIncome * 0.4) {
      threats.push('High debt levels limiting financial flexibility');
    }

    if (input.currentFinancials.emergencyFund < input.personalInfo.monthlyExpenses * 3) {
      threats.push('Insufficient emergency fund creating vulnerability');
    }

    if (input.personalInfo.monthlyExpenses > (input.personalInfo.annualIncome / 12) * 0.8) {
      threats.push('High expense ratio limiting savings capacity');
    }

    return threats;
  }

  /**
   * Get debt strategy
   */
  private static getDebtStrategy(input: FinancialJourneyInput): string {
    const debtToIncomeRatio = input.currentFinancials.totalDebts / input.personalInfo.annualIncome;

    if (debtToIncomeRatio > 0.4) {
      return 'Debt avalanche method - focus on highest interest rates first';
    } else if (debtToIncomeRatio > 0.2) {
      return 'Debt snowball method - focus on smallest balances first';
    } else {
      return 'Accelerated payoff - increase payments on all debts';
    }
  }

  /**
   * Estimate debt payoff time
   */
  private static estimateDebtPayoffTime(input: FinancialJourneyInput): string {
    const debtToIncomeRatio = input.currentFinancials.totalDebts / input.personalInfo.annualIncome;

    if (debtToIncomeRatio > 0.5) {
      return '3-5 years';
    } else if (debtToIncomeRatio > 0.3) {
      return '2-3 years';
    } else {
      return '1-2 years';
    }
  }

  /**
   * Calculate months to emergency fund
   */
  private static calculateMonthsToEmergencyFund(input: FinancialJourneyInput): number {
    const targetAmount = input.personalInfo.monthlyExpenses * 6;
    const currentAmount = input.currentFinancials.emergencyFund;
    const monthlyContribution = input.currentFinancials.monthlySavings;

    if (monthlyContribution <= 0) return Infinity;

    return Math.ceil((targetAmount - currentAmount) / monthlyContribution);
  }

  /**
   * Get emergency fund priority
   */
  private static getEmergencyFundPriority(input: FinancialJourneyInput): 'high' | 'medium' | 'low' {
    const currentMonths =
      input.currentFinancials.emergencyFund / input.personalInfo.monthlyExpenses;

    if (currentMonths < 1) return 'high';
    if (currentMonths < 3) return 'medium';
    return 'low';
  }

  /**
   * Get current investment allocation
   */
  private static getCurrentInvestmentAllocation(
    _input: FinancialJourneyInput
  ): Record<string, number> {
    // Simplified - in practice would analyze actual holdings
    return {
      stocks: 0.6,
      bonds: 0.3,
      cash: 0.1,
    };
  }

  /**
   * Get recommended investment allocation
   */
  private static getRecommendedInvestmentAllocation(
    input: FinancialJourneyInput
  ): Record<string, number> {
    const age = input.personalInfo.age;
    const riskTolerance = input.riskTolerance.investmentRisk;

    let stockAllocation = 100 - age;

    if (riskTolerance === 'conservative') {
      stockAllocation -= 10;
    } else if (riskTolerance === 'aggressive') {
      stockAllocation += 10;
    }

    return {
      stocks: Math.max(0, Math.min(1, stockAllocation / 100)),
      bonds: Math.max(0, Math.min(1, (100 - stockAllocation) / 100)),
      cash: 0.05,
    };
  }

  /**
   * Get current retirement savings
   */
  private static getCurrentRetirementSavings(input: FinancialJourneyInput): number {
    // Simplified - in practice would analyze retirement accounts
    return input.currentFinancials.totalAssets * 0.3; // Assume 30% in retirement accounts
  }

  /**
   * Project retirement income
   */
  private static projectRetirementIncome(input: FinancialJourneyInput): number {
    const currentSavings = this.getCurrentRetirementSavings(input);
    const yearsToRetirement = 65 - input.personalInfo.age;
    const annualReturn = 0.07;

    const futureValue = currentSavings * Math.pow(1 + annualReturn, yearsToRetirement);
    const annualWithdrawal = futureValue * 0.04; // 4% rule

    return annualWithdrawal;
  }

  /**
   * Calculate retirement readiness
   */
  private static calculateRetirementReadiness(input: FinancialJourneyInput): number {
    const projectedIncome = this.projectRetirementIncome(input);
    const targetIncome = input.personalInfo.annualIncome * 0.8; // 80% replacement ratio

    return Math.min(100, (projectedIncome / targetIncome) * 100);
  }

  /**
   * Generate milestones
   */
  private static generateMilestones(input: FinancialJourneyInput): Array<{
    id: string;
    name: string;
    description: string;
    targetDate: string;
    progress: number;
    status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
    nextAction: string;
  }> {
    const milestones = [];

    // Emergency fund milestone
    const emergencyFundTarget = input.personalInfo.monthlyExpenses * 6;
    const emergencyFundProgress =
      (input.currentFinancials.emergencyFund / emergencyFundTarget) * 100;

    milestones.push({
      id: 'emergency-fund',
      name: 'Emergency Fund Complete',
      description: 'Build 6 months of expenses in emergency fund',
      targetDate: formatISODate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 year
      progress: Math.min(100, emergencyFundProgress),
      status: (emergencyFundProgress >= 100
        ? 'completed'
        : emergencyFundProgress > 0
          ? 'in-progress'
          : 'not-started') as 'not-started' | 'in-progress' | 'completed' | 'overdue',
      nextAction: emergencyFundProgress >= 100 ? 'Move to next stage' : 'Increase monthly savings',
    });

    // Debt milestone
    const debtProgress = Math.max(
      0,
      100 - (input.currentFinancials.totalDebts / input.personalInfo.annualIncome) * 100
    );

    milestones.push({
      id: 'debt-free',
      name: 'Debt Free',
      description: 'Eliminate all high-interest debt',
      targetDate: formatISODate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2)), // 2 years
      progress: Math.min(100, debtProgress),
      status: (debtProgress >= 100
        ? 'completed'
        : debtProgress > 0
          ? 'in-progress'
          : 'not-started') as 'not-started' | 'in-progress' | 'completed' | 'overdue',
      nextAction: debtProgress >= 100 ? 'Focus on investments' : 'Increase debt payments',
    });

    return milestones;
  }

  /**
   * Calculate goal progress
   */
  private static calculateGoalProgress(input: FinancialJourneyInput): Array<{
    goalId: string;
    goalName: string;
    currentProgress: number;
    targetProgress: number;
    onTrack: boolean;
    estimatedCompletion: string;
  }> {
    const goalProgress: Array<{
      goalId: string;
      goalName: string;
      currentProgress: number;
      targetProgress: number;
      onTrack: boolean;
      estimatedCompletion: string;
    }> = [];

    // Process short-term goals
    input.financialGoals.shortTermGoals.forEach((goal) => {
      const currentProgress = 0; // Simplified - would calculate based on savings
      const targetProgress = 100;
      const onTrack = currentProgress >= targetProgress * 0.8;

      goalProgress.push({
        goalId: goal.id,
        goalName: goal.name,
        currentProgress,
        targetProgress,
        onTrack,
        estimatedCompletion: goal.targetDate,
      });
    });

    return goalProgress;
  }

  /**
   * Generate immediate actions
   */
  private static generateImmediateActions(
    input: FinancialJourneyInput,
    _stageAnalysis: any
  ): Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
    timeline: string;
    estimatedCost: number;
    category: string;
  }> {
    const actions = [];

    // Emergency fund action
    if (input.currentFinancials.emergencyFund < input.personalInfo.monthlyExpenses * 3) {
      actions.push({
        action: 'Build emergency fund to 3 months of expenses',
        priority: 'high' as const,
        impact: 'Financial security and peace of mind',
        timeline: 'Next 6 months',
        estimatedCost:
          input.personalInfo.monthlyExpenses * 3 - input.currentFinancials.emergencyFund,
        category: 'Emergency Fund',
      });
    }

    // Debt action
    if (input.currentFinancials.totalDebts > input.personalInfo.annualIncome * 0.3) {
      actions.push({
        action: 'Create debt payoff plan',
        priority: 'high' as const,
        impact: 'Reduce financial stress and improve credit',
        timeline: 'Next 30 days',
        estimatedCost: 0,
        category: 'Debt Management',
      });
    }

    return actions;
  }

  /**
   * Generate short-term actions
   */
  private static generateShortTermActions(
    input: FinancialJourneyInput,
    _stageAnalysis: any
  ): Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
    timeline: string;
    estimatedCost: number;
    category: string;
  }> {
    const actions = [];

    actions.push({
      action: 'Increase monthly savings rate',
      priority: 'medium' as const,
      impact: 'Accelerate goal achievement',
      timeline: 'Next 3 months',
      estimatedCost: input.personalInfo.annualIncome * 0.05, // 5% of income
      category: 'Savings',
    });

    return actions;
  }

  /**
   * Generate long-term actions
   */
  private static generateLongTermActions(
    input: FinancialJourneyInput,
    _stageAnalysis: any
  ): Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
    timeline: string;
    estimatedCost: number;
    category: string;
  }> {
    const actions = [];

    actions.push({
      action: 'Maximize retirement contributions',
      priority: 'high' as const,
      impact: 'Secure retirement future',
      timeline: 'Next 12 months',
      estimatedCost: input.personalInfo.annualIncome * 0.15, // 15% of income
      category: 'Retirement',
    });

    return actions;
  }

  /**
   * Identify financial risks
   */
  private static identifyFinancialRisks(input: FinancialJourneyInput): Array<{
    risk: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }> {
    const risks: Array<{
      risk: string;
      probability: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }> = [];

    if (input.currentFinancials.emergencyFund < input.personalInfo.monthlyExpenses * 3) {
      risks.push({
        risk: 'Insufficient emergency fund',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Build emergency fund to 6 months of expenses',
      });
    }

    if (input.currentFinancials.totalDebts > input.personalInfo.annualIncome * 0.4) {
      risks.push({
        risk: 'High debt levels',
        probability: 'high',
        impact: 'high',
        mitigation: 'Implement debt payoff strategy',
      });
    }

    return risks;
  }

  /**
   * Identify opportunity risks
   */
  private static identifyOpportunityRisks(input: FinancialJourneyInput): Array<{
    opportunity: string;
    riskLevel: 'low' | 'medium' | 'high';
    potentialReturn: number;
    recommendation: string;
  }> {
    const opportunities: Array<{
      opportunity: string;
      riskLevel: 'low' | 'medium' | 'high';
      potentialReturn: number;
      recommendation: string;
    }> = [];

    if (input.personalInfo.age < 35) {
      opportunities.push({
        opportunity: 'Aggressive investment strategy',
        riskLevel: 'medium',
        potentialReturn: 0.08,
        recommendation: 'Consider higher stock allocation for long-term growth',
      });
    }

    return opportunities;
  }

  /**
   * Get all stages
   */
  private static getAllStages(): Array<{
    stage: string;
    description: string;
    estimatedDuration: string;
    keyActions: string[];
    successMetrics: string[];
    prerequisites: string[];
  }> {
    return [
      {
        stage: 'getting-started',
        description: 'Building financial foundation and establishing good habits',
        estimatedDuration: '6-12 months',
        keyActions: ['Create budget', 'Track expenses', 'Build basic savings'],
        successMetrics: ['Positive cash flow', 'Expense tracking', 'Basic savings'],
        prerequisites: ['Income stability', 'Basic financial literacy'],
      },
      {
        stage: 'debt-management',
        description: 'Eliminating high-interest debt and improving credit',
        estimatedDuration: '1-3 years',
        keyActions: ['Debt inventory', 'Payoff strategy', 'Credit improvement'],
        successMetrics: ['Debt reduction', 'Credit score improvement', 'Payment consistency'],
        prerequisites: ['Basic budgeting', 'Understanding of debt types'],
      },
      {
        stage: 'emergency-funding',
        description: 'Building emergency fund for financial security',
        estimatedDuration: '6-18 months',
        keyActions: ['Emergency fund goal', 'High-yield savings', 'Fund strategy'],
        successMetrics: ['Fund amount', 'Fund growth', 'Fund accessibility'],
        prerequisites: ['Debt under control', 'Stable income'],
      },
      {
        stage: 'home-buying',
        description: 'Saving for down payment and preparing for homeownership',
        estimatedDuration: '2-5 years',
        keyActions: ['Down payment savings', 'Credit improvement', 'Debt reduction'],
        successMetrics: ['Down payment amount', 'Credit score', 'Debt-to-income ratio'],
        prerequisites: ['Emergency fund established', 'Debt-to-income ratio < 36%'],
      },
      {
        stage: 'investment-building',
        description: 'Building wealth through strategic investing',
        estimatedDuration: 'Ongoing',
        keyActions: ['Investment accounts', 'Asset allocation', 'Automatic investing'],
        successMetrics: ['Investment allocation', 'Risk tolerance', 'Diversification'],
        prerequisites: ['Emergency fund complete', 'High-interest debt eliminated'],
      },
      {
        stage: 'retirement-planning',
        description: 'Maximizing retirement savings and planning for future',
        estimatedDuration: 'Ongoing',
        keyActions: ['401(k) maximization', 'IRA accounts', 'Retirement calculation'],
        successMetrics: ['Retirement savings', 'Contribution rate', 'Account diversification'],
        prerequisites: ['Emergency fund established', 'Basic investing knowledge'],
      },
      {
        stage: 'wealth-preservation',
        description: 'Protecting and growing accumulated wealth',
        estimatedDuration: 'Ongoing',
        keyActions: ['Tax strategies', 'Insurance review', 'Estate planning'],
        successMetrics: ['Asset protection', 'Tax optimization', 'Estate planning'],
        prerequisites: ['Significant assets accumulated', 'Basic estate planning'],
      },
      {
        stage: 'legacy-planning',
        description: 'Planning for wealth transfer and legacy goals',
        estimatedDuration: 'Ongoing',
        keyActions: ['Estate plan', 'Charitable giving', 'Wealth transfer'],
        successMetrics: ['Estate planning', 'Wealth transfer', 'Charitable giving'],
        prerequisites: ['Substantial wealth', 'Estate planning in place'],
      },
    ];
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    input: FinancialJourneyInput,
    _stageAnalysis: any,
    _crossModelAnalysis: any
  ): Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    action: string;
    timeline: string;
    estimatedCost: number;
  }> {
    const recommendations: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact: string;
      action: string;
      timeline: string;
      estimatedCost: number;
    }> = [];

    // Stage-specific recommendations
    if (input.journeyStage === 'getting-started') {
      recommendations.push({
        category: 'Foundation',
        priority: 'high',
        description: 'Establish emergency fund',
        impact: 'Financial security and peace of mind',
        action: 'Set up automatic savings to emergency fund',
        timeline: 'Next 6 months',
        estimatedCost: input.personalInfo.monthlyExpenses * 3,
      });
    }

    if (input.journeyStage === 'debt-management') {
      recommendations.push({
        category: 'Debt',
        priority: 'high',
        description: 'Implement debt payoff strategy',
        impact: 'Reduce financial stress and improve credit',
        action: 'Choose avalanche or snowball method',
        timeline: 'Next 30 days',
        estimatedCost: 0,
      });
    }

    return recommendations;
  }

  /**
   * Generate insights
   */
  private static generateInsights(
    input: FinancialJourneyInput,
    journeyOverview: any,
    _stageAnalysis: any
  ): string[] {
    const insights = [];

    if (journeyOverview.overallFinancialHealth > 80) {
      insights.push('Excellent financial health - you are well-positioned for future goals');
    } else if (journeyOverview.overallFinancialHealth > 60) {
      insights.push('Good financial health with room for improvement');
    } else {
      insights.push('Financial health needs attention - focus on foundational elements');
    }

    if (input.personalInfo.age < 30) {
      insights.push('Starting early gives you a significant advantage due to compound growth');
    }

    if (input.currentFinancials.monthlySavings > input.personalInfo.monthlyExpenses * 0.2) {
      insights.push('Strong savings rate - you are building wealth effectively');
    }

    return insights;
  }
}
