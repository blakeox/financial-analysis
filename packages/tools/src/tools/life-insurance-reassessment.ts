/**
 * Life Insurance Reassessment MCP Tool
 */

import { LifeInsuranceReassessmentCalculator, LifeInsuranceReassessmentInputSchema } from '@financial-analysis/analysis';

export class LifeInsuranceReassessmentTool {
  static readonly toolName = 'analyze_life_insurance_reassessment';
  static readonly description =
    'Reassess life insurance coverage needs, analyze coverage gaps, optimize policies, and compare term vs permanent insurance';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 100, description: 'Current age' },
          healthStatus: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'], description: 'Health status' },
          smoker: { type: 'boolean', default: false, description: 'Smoker status' },
          gender: { type: 'string', enum: ['male', 'female'], description: 'Gender' },
        },
        required: ['age', 'healthStatus', 'gender'],
      },
      currentPolicies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            policyType: { type: 'string', enum: ['term', 'whole-life', 'universal-life', 'variable-life'], description: 'Policy type' },
            faceAmount: { type: 'number', minimum: 0, description: 'Face amount' },
            annualPremium: { type: 'number', minimum: 0, description: 'Annual premium' },
            cashValue: { type: 'number', minimum: 0, default: 0, description: 'Cash value' },
          },
          required: ['policyType', 'faceAmount', 'annualPremium'],
        },
      },
      financialSituation: {
        type: 'object',
        properties: {
          annualIncome: { type: 'number', minimum: 0, description: 'Annual income' },
          totalAssets: { type: 'number', minimum: 0, description: 'Total assets' },
          totalDebt: { type: 'number', minimum: 0, description: 'Total debt' },
          monthlyExpenses: { type: 'number', minimum: 0, description: 'Monthly expenses' },
          dependents: { type: 'number', minimum: 0, default: 0, description: 'Number of dependents' },
        },
        required: ['annualIncome', 'totalAssets', 'totalDebt', 'monthlyExpenses'],
      },
      needsAnalysis: {
        type: 'object',
        properties: {
          incomeReplacement: {
            type: 'object',
            properties: {
              yearsOfIncome: { type: 'number', minimum: 0, default: 10, description: 'Years of income to replace' },
              replacementPercentage: { type: 'number', minimum: 0, maximum: 1, default: 0.7, description: 'Replacement percentage' },
            },
          },
          debtPayoff: {
            type: 'object',
            properties: {
              mortgageBalance: { type: 'number', minimum: 0, default: 0, description: 'Mortgage balance' },
              otherDebt: { type: 'number', minimum: 0, default: 0, description: 'Other debt' },
            },
          },
          educationFunding: {
            type: 'object',
            properties: {
              childrenCount: { type: 'number', minimum: 0, default: 0, description: 'Number of children' },
              educationCostPerChild: { type: 'number', minimum: 0, default: 0, description: 'Education cost per child' },
            },
          },
          finalExpenses: { type: 'number', minimum: 0, default: 10000, description: 'Final expenses' },
          estateTaxes: { type: 'number', minimum: 0, default: 0, description: 'Estate taxes' },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeCoverageGapAnalysis: { type: 'boolean', default: true, description: 'Include coverage gap analysis' },
          includePolicyOptimization: { type: 'boolean', default: true, description: 'Include policy optimization' },
          includeConversionAnalysis: { type: 'boolean', default: true, description: 'Include conversion analysis' },
          includeTermVsPermanent: { type: 'boolean', default: true, description: 'Include term vs permanent comparison' },
        },
      },
    },
    required: ['personalInfo', 'financialSituation', 'needsAnalysis'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = LifeInsuranceReassessmentInputSchema.parse(args);
    return LifeInsuranceReassessmentCalculator.analyze(validated);
  }
}

