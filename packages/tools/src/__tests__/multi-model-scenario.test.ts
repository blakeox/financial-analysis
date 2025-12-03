import { describe, expect, it } from 'vitest';
import { MultiModelScenarioTool } from '../tools/multi-model-scenario';

describe('MultiModelScenarioTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(MultiModelScenarioTool.toolName).toBe('multi_model_scenario_analysis');
    });

    it('has a description', () => {
      expect(MultiModelScenarioTool.description).toBeTruthy();
      expect(MultiModelScenarioTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = MultiModelScenarioTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('scenarioId');
      expect(schema.required).toContain('analysisType');
    });

    it('supports expected scenario IDs', () => {
      const scenarioIds = MultiModelScenarioTool.inputSchema.properties.scenarioId.enum;
      expect(scenarioIds).toContain('young-professional');
      expect(scenarioIds).toContain('family-planning');
      expect(scenarioIds).toContain('home-buying');
      expect(scenarioIds).toContain('debt-elimination');
      expect(scenarioIds).toContain('investment-portfolio');
      expect(scenarioIds).toContain('pre-retirement');
    });

    it('supports expected analysis types', () => {
      const analysisTypes = MultiModelScenarioTool.inputSchema.properties.analysisType.enum;
      expect(analysisTypes).toContain('overview');
      expect(analysisTypes).toContain('next-steps');
      expect(analysisTypes).toContain('optimization');
      expect(analysisTypes).toContain('comparison');
      expect(analysisTypes).toContain('risk-assessment');
    });
  });

  describe('execute', () => {
    describe('overview analysis', () => {
      it('generates overview for young professional scenario', async () => {
        const result = await MultiModelScenarioTool.execute({
          scenarioId: 'young-professional',
          analysisType: 'overview',
        }) as Record<string, unknown>;

        expect(result).toBeDefined();
        expect(result.scenario).toBeDefined();
        expect(result.analysis).toBeDefined();
      });

      it('generates overview with user profile', async () => {
        const result = await MultiModelScenarioTool.execute({
          scenarioId: 'young-professional',
          analysisType: 'overview',
          userProfile: {
            age: 25,
            income: 65000,
            maritalStatus: 'single',
            dependents: 0,
            riskTolerance: 'moderate',
          },
        }) as Record<string, unknown>;

        expect(result).toBeDefined();
        expect(result.scenario).toBeDefined();
      });

      it('generates overview with progress tracking', async () => {
        const result = await MultiModelScenarioTool.execute({
          scenarioId: 'young-professional',
          analysisType: 'overview',
          currentProgress: {
            completedModels: ['student-loan', 'budget'],
            currentModel: 'retirement-planning',
            overallProgress: 50,
          },
        }) as Record<string, unknown>;

        expect(result).toBeDefined();
      });
    });

    describe('next-steps analysis', () => {
      it('generates next steps for family planning scenario', async () => {
        const result = await MultiModelScenarioTool.execute({
          scenarioId: 'family-planning',
          analysisType: 'next-steps',
        }) as Record<string, unknown>;

        expect(result).toBeDefined();
        expect(result.analysis).toBeDefined();
        const analysis = result.analysis as Record<string, unknown>;
        expect(analysis.type).toBe('next-steps');
      });

      it('generates next steps with partial progress', async () => {
        const result = await MultiModelScenarioTool.execute({
          scenarioId: 'family-planning',
          analysisType: 'next-steps',
          currentProgress: {
            completedModels: ['home-buying-affordability'],
            currentModel: 'college-savings',
            overallProgress: 25,
          },
        }) as Record<string, unknown>;

        expect(result).toBeDefined();
      });
    });

    describe('optimization analysis', () => {
      it('generates optimization for home-buying scenario', async () => {
        const result = await MultiModelScenarioTool.execute({
          scenarioId: 'home-buying',
          analysisType: 'optimization',
        }) as Record<string, unknown>;

        expect(result).toBeDefined();
        expect(result.analysis).toBeDefined();
        const analysis = result.analysis as Record<string, unknown>;
        expect(analysis.type).toBe('optimization');
      });

      it('generates optimization with user profile', async () => {
        const result = await MultiModelScenarioTool.execute({
          scenarioId: 'home-buying',
          analysisType: 'optimization',
          userProfile: {
            age: 35,
            income: 120000,
            maritalStatus: 'married',
            dependents: 1,
            riskTolerance: 'conservative',
          },
        }) as Record<string, unknown>;

        expect(result).toBeDefined();
      });
    });

    describe('comparison analysis', () => {
      it('generates comparison for debt-elimination scenario', async () => {
        const result = await MultiModelScenarioTool.execute({
          scenarioId: 'debt-elimination',
          analysisType: 'comparison',
        }) as Record<string, unknown>;

        expect(result).toBeDefined();
        expect(result.analysis).toBeDefined();
        const analysis = result.analysis as Record<string, unknown>;
        expect(analysis.type).toBe('comparison');
      });
    });

    describe('risk-assessment analysis', () => {
      it('generates risk assessment for investment-portfolio scenario', async () => {
        const result = await MultiModelScenarioTool.execute({
          scenarioId: 'investment-portfolio',
          analysisType: 'risk-assessment',
        }) as Record<string, unknown>;

        expect(result).toBeDefined();
        expect(result.analysis).toBeDefined();
        const analysis = result.analysis as Record<string, unknown>;
        expect(analysis.type).toBe('risk-assessment');
      });

      it('generates risk assessment for pre-retirement scenario', async () => {
        const result = await MultiModelScenarioTool.execute({
          scenarioId: 'pre-retirement',
          analysisType: 'risk-assessment',
          userProfile: {
            age: 55,
            income: 150000,
            riskTolerance: 'conservative',
          },
        }) as Record<string, unknown>;

        expect(result).toBeDefined();
      });
    });

    describe('all scenarios', () => {
      const scenarios = [
        'young-professional',
        'family-planning',
        'home-buying',
        'debt-elimination',
        'investment-portfolio',
        'pre-retirement',
      ] as const;

      scenarios.forEach((scenarioId) => {
        it(`handles ${scenarioId} scenario overview`, async () => {
          const result = await MultiModelScenarioTool.execute({
            scenarioId,
            analysisType: 'overview',
          }) as Record<string, unknown>;

          expect(result).toBeDefined();
          expect(result.scenario).toBeDefined();
        });
      });
    });

    describe('error handling', () => {
      it('returns error for invalid scenario ID', async () => {
        await expect(
          MultiModelScenarioTool.execute({
            scenarioId: 'invalid-scenario',
            analysisType: 'overview',
          })
        ).rejects.toThrow();
      });

      it('returns error for invalid analysis type', async () => {
        await expect(
          MultiModelScenarioTool.execute({
            scenarioId: 'young-professional',
            analysisType: 'invalid-type',
          })
        ).rejects.toThrow();
      });
    });
  });
});
