import { describe, it, expect } from 'vitest';
import {
  FinancialJourneyAnalysisEngine,
  FinancialJourneyInputSchema,
  type FinancialJourneyInput,
} from '../financial-journey.js';

describe('FinancialJourneyAnalysisEngine', () => {
  const createBasicInput = (
    overrides: Partial<FinancialJourneyInput> = {}
  ): FinancialJourneyInput => ({
    personalInfo: {
      age: 30,
      maritalStatus: 'single',
      dependents: 0,
      employmentStatus: 'employed',
      annualIncome: 75000,
      monthlyExpenses: 4000,
    },
    currentFinancials: {
      totalAssets: 50000,
      totalDebts: 25000,
      emergencyFund: 10000,
      monthlySavings: 1000,
      creditScore: 720,
    },
    financialGoals: {
      shortTermGoals: [
        {
          id: 'goal-1',
          name: 'Emergency Fund',
          targetAmount: 24000,
          targetDate: '2025-12-31',
          priority: 'high',
          category: 'emergency',
        },
      ],
      mediumTermGoals: [
        {
          id: 'goal-2',
          name: 'Down Payment',
          targetAmount: 60000,
          targetDate: '2028-12-31',
          priority: 'high',
          category: 'home',
        },
      ],
      longTermGoals: [
        {
          id: 'goal-3',
          name: 'Retirement',
          targetAmount: 1500000,
          targetDate: '2060-01-01',
          priority: 'high',
          category: 'retirement',
        },
      ],
    },
    journeyStage: 'getting-started',
    analysis: {
      includeCrossModelAnalysis: true,
      includeProgressTracking: true,
      includeMilestoneAnalysis: true,
      includeActionPlan: true,
      includeRiskAssessment: true,
      timeHorizon: 20,
    },
    riskTolerance: {
      investmentRisk: 'moderate',
      debtTolerance: 'medium',
      emergencyTolerance: 'medium',
    },
    ...overrides,
  });

  describe('analyze()', () => {
    it('should perform comprehensive financial journey analysis', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
      expect(result.journeyOverview).toBeDefined();
      expect(result.stageAnalysis).toBeDefined();
      expect(result.actionPlan).toBeDefined();
      expect(result.journeyRoadmap).toBeDefined();
    });

    it('should validate input with Zod schema', () => {
      const input = createBasicInput();
      expect(() => FinancialJourneyInputSchema.parse(input)).not.toThrow();
    });
  });

  describe('journey overview', () => {
    it('should calculate financial health score', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.journeyOverview.overallFinancialHealth).toBeGreaterThanOrEqual(0);
      expect(result.journeyOverview.overallFinancialHealth).toBeLessThanOrEqual(100);
    });

    it('should identify current stage', () => {
      const input = createBasicInput({ journeyStage: 'debt-management' });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.journeyOverview.currentStage).toBe('debt-management');
    });

    it('should determine next stage', () => {
      const input = createBasicInput({ journeyStage: 'debt-management' });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.journeyOverview.nextStage).toBe('emergency-funding');
    });

    it('should calculate progress percentage', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.journeyOverview.progressPercentage).toBeGreaterThanOrEqual(0);
      expect(result.journeyOverview.progressPercentage).toBeLessThanOrEqual(100);
    });

    it('should estimate time to next stage', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.journeyOverview.estimatedTimeToNextStage).toBeDefined();
    });
  });

  describe('stage analysis', () => {
    it('should analyze current stage', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.stageAnalysis.currentStageAnalysis).toBeDefined();
      expect(result.stageAnalysis.currentStageAnalysis.keyMetrics).toBeDefined();
      expect(result.stageAnalysis.currentStageAnalysis.strengths).toBeDefined();
      expect(result.stageAnalysis.currentStageAnalysis.weaknesses).toBeDefined();
    });

    it('should prepare for next stage', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.stageAnalysis.nextStagePreparation).toBeDefined();
      expect(result.stageAnalysis.nextStagePreparation.requirements).toBeDefined();
      expect(result.stageAnalysis.nextStagePreparation.prerequisites).toBeDefined();
    });

    it('should identify opportunities', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.stageAnalysis.currentStageAnalysis.opportunities).toBeDefined();
    });

    it('should identify threats', () => {
      const input = createBasicInput({
        currentFinancials: {
          totalAssets: 20000,
          totalDebts: 50000, // High debt
          emergencyFund: 2000, // Low emergency fund
          monthlySavings: 200,
        },
      });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.stageAnalysis.currentStageAnalysis.threats.length).toBeGreaterThan(0);
    });
  });

  describe('cross-model analysis', () => {
    it('should include cross-model analysis when requested', () => {
      const input = createBasicInput({
        analysis: {
          includeCrossModelAnalysis: true,
          includeProgressTracking: false,
          includeMilestoneAnalysis: false,
          includeActionPlan: true,
          includeRiskAssessment: false,
          timeHorizon: 20,
        },
      });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.crossModelAnalysis).toBeDefined();
      expect(result.crossModelAnalysis!.debtAnalysis).toBeDefined();
      expect(result.crossModelAnalysis!.emergencyFundAnalysis).toBeDefined();
      expect(result.crossModelAnalysis!.investmentAnalysis).toBeDefined();
      expect(result.crossModelAnalysis!.retirementAnalysis).toBeDefined();
    });

    it('should calculate debt-to-income ratio', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.crossModelAnalysis!.debtAnalysis.debtToIncomeRatio).toBeDefined();
      expect(result.crossModelAnalysis!.debtAnalysis.debtToIncomeRatio).toBeGreaterThanOrEqual(0);
    });

    it('should analyze emergency fund adequacy', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.crossModelAnalysis!.emergencyFundAnalysis.recommendedAmount).toBeDefined();
      expect(result.crossModelAnalysis!.emergencyFundAnalysis.priority).toBeDefined();
    });

    it('should recommend investment allocation', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.crossModelAnalysis!.investmentAnalysis.recommendedAllocation).toBeDefined();
    });
  });

  describe('progress tracking', () => {
    it('should include progress tracking when requested', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.progressTracking).toBeDefined();
      expect(result.progressTracking!.milestones).toBeDefined();
      expect(result.progressTracking!.goalProgress).toBeDefined();
    });

    it('should generate milestones', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.progressTracking!.milestones.length).toBeGreaterThan(0);

      const milestone = result.progressTracking!.milestones[0];
      expect(milestone).toHaveProperty('id');
      expect(milestone).toHaveProperty('name');
      expect(milestone).toHaveProperty('progress');
      expect(milestone).toHaveProperty('status');
    });

    it('should track goal progress', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.progressTracking!.goalProgress).toBeDefined();
    });
  });

  describe('action plan', () => {
    it('should generate immediate actions', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.actionPlan.immediateActions).toBeDefined();
    });

    it('should generate short-term actions', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.actionPlan.shortTermActions).toBeDefined();
    });

    it('should generate long-term actions', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.actionPlan.longTermActions).toBeDefined();
    });

    it('should prioritize high-priority actions', () => {
      const input = createBasicInput({
        currentFinancials: {
          totalAssets: 10000,
          totalDebts: 40000,
          emergencyFund: 1000, // Low emergency fund
          monthlySavings: 500,
        },
      });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      const highPriorityActions = result.actionPlan.immediateActions.filter(
        (a) => a.priority === 'high'
      );
      expect(highPriorityActions.length).toBeGreaterThan(0);
    });
  });

  describe('risk assessment', () => {
    it('should include risk assessment when requested', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.riskAssessment).toBeDefined();
      expect(result.riskAssessment!.financialRisks).toBeDefined();
      expect(result.riskAssessment!.opportunityRisks).toBeDefined();
    });

    it('should identify financial risks', () => {
      const input = createBasicInput({
        currentFinancials: {
          totalAssets: 10000,
          totalDebts: 50000, // High debt
          emergencyFund: 500, // Very low emergency fund
          monthlySavings: 100,
        },
      });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.riskAssessment!.financialRisks.length).toBeGreaterThan(0);
    });

    it('should identify opportunities', () => {
      const input = createBasicInput({
        personalInfo: {
          age: 25, // Young age
          maritalStatus: 'single',
          dependents: 0,
          employmentStatus: 'employed',
          annualIncome: 80000,
          monthlyExpenses: 3000,
        },
      });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.riskAssessment!.opportunityRisks.length).toBeGreaterThan(0);
    });
  });

  describe('journey roadmap', () => {
    it('should generate journey roadmap', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.journeyRoadmap).toBeDefined();
      expect(result.journeyRoadmap.stages).toBeDefined();
      expect(result.journeyRoadmap.totalStages).toBeGreaterThan(0);
    });

    it('should include all stages', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.journeyRoadmap.stages.length).toBe(8);
    });

    it('should identify current stage index', () => {
      const input = createBasicInput({ journeyStage: 'debt-management' });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.journeyRoadmap.currentStageIndex).toBe(1);
    });

    it('should provide stage details', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      const stage = result.journeyRoadmap.stages[0];
      expect(stage).toHaveProperty('stage');
      expect(stage).toHaveProperty('description');
      expect(stage).toHaveProperty('keyActions');
      expect(stage).toHaveProperty('successMetrics');
    });
  });

  describe('recommendations and insights', () => {
    it('should generate recommendations', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.recommendations).toBeDefined();
    });

    it('should generate insights', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
    });
  });

  describe('journey stages', () => {
    it('should handle getting-started stage', () => {
      const input = createBasicInput({ journeyStage: 'getting-started' });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.journeyOverview.currentStage).toBe('getting-started');
      expect(result.journeyOverview.nextStage).toBe('debt-management');
    });

    it('should handle retirement-planning stage', () => {
      const input = createBasicInput({ journeyStage: 'retirement-planning' });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.journeyOverview.currentStage).toBe('retirement-planning');
      expect(result.journeyOverview.nextStage).toBe('wealth-preservation');
    });

    it('should handle legacy-planning stage (final stage)', () => {
      const input = createBasicInput({ journeyStage: 'legacy-planning' });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.journeyOverview.currentStage).toBe('legacy-planning');
      expect(result.journeyOverview.nextStage).toBe('completed');
    });
  });

  describe('risk tolerance variations', () => {
    it('should handle conservative risk tolerance', () => {
      const input = createBasicInput({
        riskTolerance: {
          investmentRisk: 'conservative',
          debtTolerance: 'low',
          emergencyTolerance: 'low',
        },
      });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
    });

    it('should handle aggressive risk tolerance', () => {
      const input = createBasicInput({
        riskTolerance: {
          investmentRisk: 'aggressive',
          debtTolerance: 'high',
          emergencyTolerance: 'high',
        },
      });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
    });
  });

  describe('metadata', () => {
    it('should include metadata', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.calculatedAt).toBeDefined();
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.metadata.methodology).toBe('Financial Journey Analysis');
    });

    it('should include assumptions', () => {
      const input = createBasicInput();
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result.metadata.assumptions).toBeDefined();
      expect(result.metadata.assumptions.timeHorizon).toBe(20);
    });
  });

  describe('edge cases', () => {
    it('should handle high-income user', () => {
      const input = createBasicInput({
        personalInfo: {
          age: 45,
          maritalStatus: 'married',
          dependents: 2,
          employmentStatus: 'employed',
          annualIncome: 500000,
          monthlyExpenses: 15000,
        },
      });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
    });

    it('should handle young user', () => {
      const input = createBasicInput({
        personalInfo: {
          age: 18,
          maritalStatus: 'single',
          dependents: 0,
          employmentStatus: 'employed',
          annualIncome: 30000,
          monthlyExpenses: 1500,
        },
      });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
    });

    it('should handle near-retirement user', () => {
      const input = createBasicInput({
        personalInfo: {
          age: 60,
          maritalStatus: 'married',
          dependents: 0,
          employmentStatus: 'employed',
          annualIncome: 150000,
          monthlyExpenses: 8000,
        },
        journeyStage: 'wealth-preservation',
      });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
    });

    it('should handle user with no savings', () => {
      const input = createBasicInput({
        currentFinancials: {
          totalAssets: 0,
          totalDebts: 10000,
          emergencyFund: 0,
          monthlySavings: 0,
        },
      });
      const result = FinancialJourneyAnalysisEngine.analyze(input);

      expect(result).toBeDefined();
      expect(result.journeyOverview.overallFinancialHealth).toBeLessThan(50);
    });
  });
});
