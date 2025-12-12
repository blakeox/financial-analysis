/**
 * Disability Insurance MCP Tool
 */

import { DisabilityInsuranceCalculator, DisabilityInsuranceInputSchema } from '@financial-analysis/analysis';

export class DisabilityInsuranceTool {
  static readonly toolName = 'analyze_disability_insurance';
  static readonly description =
    'Analyze disability insurance needs, assess coverage gaps, compare own-occupation vs any-occupation definitions, and optimize policy selection';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 65, description: 'Current age' },
          occupation: { type: 'string', description: 'Occupation' },
          occupationClass: {
            type: 'string',
            enum: ['professional', 'white-collar', 'blue-collar', 'high-risk'],
            default: 'professional',
            description: 'Occupation class',
          },
          annualIncome: { type: 'number', minimum: 0, description: 'Annual income' },
          monthlyExpenses: { type: 'number', minimum: 0, description: 'Monthly expenses' },
        },
        required: ['age', 'occupation', 'annualIncome', 'monthlyExpenses'],
      },
      currentCoverage: {
        type: 'object',
        properties: {
          hasGroupCoverage: { type: 'boolean', default: false, description: 'Has group coverage' },
          groupCoverageAmount: { type: 'number', minimum: 0, default: 0, description: 'Group coverage amount' },
          hasIndividualPolicy: { type: 'boolean', default: false, description: 'Has individual policy' },
        },
      },
      needsAnalysis: {
        type: 'object',
        properties: {
          targetReplacementIncome: { type: 'number', minimum: 0, maximum: 1, default: 0.6, description: 'Target replacement income percentage' },
          includeSocialSecurity: { type: 'boolean', default: true, description: 'Include Social Security' },
          expectedSSDIBenefit: { type: 'number', minimum: 0, default: 0, description: 'Expected SSDI benefit' },
        },
      },
      policyOptions: {
        type: 'object',
        properties: {
          benefitAmount: { type: 'number', minimum: 0, description: 'Benefit amount' },
          benefitPeriod: {
            type: 'string',
            enum: ['2-years', '5-years', '10-years', 'to-age-65', 'lifetime'],
            default: 'to-age-65',
            description: 'Benefit period',
          },
          eliminationPeriod: { type: 'number', minimum: 30, maximum: 365, default: 90, description: 'Elimination period (days)' },
          definitionOfDisability: {
            type: 'string',
            enum: ['own-occupation', 'any-occupation', 'modified'],
            default: 'own-occupation',
            description: 'Definition of disability',
          },
          estimatedAnnualPremium: { type: 'number', minimum: 0, description: 'Estimated annual premium' },
        },
        required: ['benefitAmount', 'estimatedAnnualPremium'],
      },
      analysis: {
        type: 'object',
        properties: {
          includeCoverageGapAnalysis: { type: 'boolean', default: true, description: 'Include coverage gap analysis' },
          includeCostBenefitAnalysis: { type: 'boolean', default: true, description: 'Include cost-benefit analysis' },
          includeProbabilityAnalysis: { type: 'boolean', default: true, description: 'Include probability analysis' },
        },
      },
    },
    required: ['personalInfo', 'needsAnalysis'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = DisabilityInsuranceInputSchema.parse(args);
    return DisabilityInsuranceCalculator.analyze(validated);
  }
}

