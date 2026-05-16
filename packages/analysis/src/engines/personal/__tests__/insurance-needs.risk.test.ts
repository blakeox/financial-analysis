import { describe, expect, it } from 'vitest';
import {
  InsuranceNeedsCalculator,
  InsuranceNeedsInput,
  InsuranceNeedsResult,
} from '../insurance-needs';
import { createBaseInsuranceInput } from './fixtures/insurance-needs';

describe('InsuranceNeedsCalculator risk assessment', () => {
  const baseInput: InsuranceNeedsInput = createBaseInsuranceInput();

  describe('risk assessment branches', () => {
    it('identifies age risk for users over 50', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 55,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const ageRisk = result.riskAssessment.riskFactors.find((rf) => rf.factor === 'Age');
      expect(ageRisk).toBeDefined();
      expect(ageRisk?.riskLevel).toBe('medium');
    });

    it('identifies health risk for poor health status', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          healthStatus: 'poor',
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const healthRisk = result.riskAssessment.riskFactors.find(
        (rf) => rf.factor === 'Health Status'
      );
      expect(healthRisk).toBeDefined();
      expect(healthRisk?.riskLevel).toBe('high');
    });

    it('identifies occupation risk for high-risk jobs', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          occupation: 'Construction Worker',
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const occupationRisk = result.riskAssessment.riskFactors.find(
        (rf) => rf.factor === 'Occupation'
      );
      expect(occupationRisk).toBeDefined();
      expect(occupationRisk?.riskLevel).toBe('high');
    });

    it('identifies dependents risk', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          dependents: 3,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const dependentsRisk = result.riskAssessment.riskFactors.find(
        (rf) => rf.factor === 'Dependents'
      );
      expect(dependentsRisk).toBeDefined();
      expect(dependentsRisk?.riskLevel).toBe('medium');
    });

    it('returns high overall risk level when high risk factors present', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          healthStatus: 'poor',
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.riskAssessment.overallRiskLevel).toBe('high');
    });

    it('returns medium overall risk level with multiple medium risk factors', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 55,
          dependents: 2,
          healthStatus: 'good',
          occupation: 'Engineer',
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.riskAssessment.overallRiskLevel).toBe('medium');
    });

    it('returns low overall risk level with no risk factors', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 30,
          dependents: 0,
          healthStatus: 'excellent',
          occupation: 'Software Developer',
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.riskAssessment.overallRiskLevel).toBe('low');
    });
  });

  describe('risk assessment helper', () => {
    it('surfaces each factor and escalates to high risk with recommendations', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        performRiskAssessment: (
          input: InsuranceNeedsInput
        ) => InsuranceNeedsResult['riskAssessment'];
      };

      const riskyInput: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 58,
          dependents: 3,
          healthStatus: 'poor',
          occupation: 'Firefighter',
        },
      };

      const assessment = helpers.performRiskAssessment.call(InsuranceNeedsCalculator, riskyInput);

      expect(assessment.overallRiskLevel).toBe('high');
      expect(assessment.riskFactors.some((rf) => rf.factor === 'Age')).toBe(true);
      expect(assessment.riskFactors.some((rf) => rf.factor === 'Health Status')).toBe(true);
      expect(assessment.riskFactors.some((rf) => rf.factor === 'Occupation')).toBe(true);
      expect(assessment.recommendations).toEqual(
        expect.arrayContaining([
          'Consider purchasing insurance while younger and healthier',
          'Focus on improving health habits to reduce insurance costs',
          'Consider occupational-specific disability insurance',
        ])
      );
    });

    it('returns low risk with empty guidance when no factors trigger', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        performRiskAssessment: (
          input: InsuranceNeedsInput
        ) => InsuranceNeedsResult['riskAssessment'];
      };

      const lowRiskInput: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 30,
          dependents: 0,
          healthStatus: 'excellent',
          occupation: 'Accountant',
        },
      };

      const assessment = helpers.performRiskAssessment.call(InsuranceNeedsCalculator, lowRiskInput);

      expect(assessment.overallRiskLevel).toBe('low');
      expect(assessment.riskFactors).toHaveLength(0);
      expect(assessment.recommendations).toHaveLength(0);
    });

    it('produces only the dependents risk factor without escalating the overall score', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        performRiskAssessment: (
          input: InsuranceNeedsInput
        ) => InsuranceNeedsResult['riskAssessment'];
      };

      const dependentsOnlyInput: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 45,
          dependents: 2,
          healthStatus: 'good',
          occupation: 'Accountant',
        },
      };

      const assessment = helpers.performRiskAssessment.call(
        InsuranceNeedsCalculator,
        dependentsOnlyInput
      );

      expect(assessment.overallRiskLevel).toBe('low');
      expect(assessment.riskFactors).toHaveLength(1);
      expect(assessment.riskFactors[0]).toMatchObject({
        factor: 'Dependents',
        riskLevel: 'medium',
      });
    });
  });

  describe('risk recommendation helper', () => {
    it('returns targeted guidance for each high-risk factor', () => {
      const generateRiskRecommendations = (
        InsuranceNeedsCalculator as unknown as {
          generateRiskRecommendations: (
            riskFactors: InsuranceNeedsResult['riskAssessment']['riskFactors']
          ) => string[];
        }
      ).generateRiskRecommendations;

      const recommendations = generateRiskRecommendations([
        {
          factor: 'Age',
          riskLevel: 'medium',
          impact: 'Older age increases insurance costs',
          mitigation: 'Act quickly',
        },
        {
          factor: 'Health Status',
          riskLevel: 'high',
          impact: 'Poor health raises premiums',
          mitigation: 'Improve wellness',
        },
        {
          factor: 'Occupation',
          riskLevel: 'high',
          impact: 'High-risk job',
          mitigation: 'Specialized coverage',
        },
      ]);

      expect(recommendations).toContain(
        'Consider purchasing insurance while younger and healthier'
      );
      expect(recommendations).toContain(
        'Focus on improving health habits to reduce insurance costs'
      );
      expect(recommendations).toContain('Consider occupational-specific disability insurance');
    });
  });

  describe('high-risk occupations', () => {
    const highRiskJobs = [
      'construction worker',
      'firefighter',
      'police officer',
      'pilot',
      'truck driver',
      'roofer',
      'electrician',
      'plumber',
    ];

    highRiskJobs.forEach((occupation) => {
      it(`identifies ${occupation} as high risk`, () => {
        const input: InsuranceNeedsInput = {
          ...baseInput,
          personalInfo: {
            ...baseInput.personalInfo,
            occupation,
          },
        };

        const result = InsuranceNeedsCalculator.analyze(input);
        const occupationRisk = result.riskAssessment.riskFactors.find(
          (rf) => rf.factor === 'Occupation'
        );
        expect(occupationRisk).toBeDefined();
        expect(occupationRisk?.riskLevel).toBe('high');
      });
    });

    it('does not identify safe occupation as high risk', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          occupation: 'Accountant',
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const occupationRisk = result.riskAssessment.riskFactors.find(
        (rf) => rf.factor === 'Occupation'
      );
      expect(occupationRisk).toBeUndefined();
    });

    it('exposes helper for case-insensitive occupation matching', () => {
      const isHighRiskOccupation = (
        InsuranceNeedsCalculator as unknown as {
          isHighRiskOccupation: (occupation: string) => boolean;
        }
      ).isHighRiskOccupation;

      expect(isHighRiskOccupation('FireFighter')).toBe(true);
      expect(isHighRiskOccupation('Lead Roofer Foreman')).toBe(true);
      expect(isHighRiskOccupation('Accountant')).toBe(false);
    });
  });
});
