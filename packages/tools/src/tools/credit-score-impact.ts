/**
 * Credit Score Impact MCP Tool
 */

import { CreditScoreImpactAnalyzer, CreditScoreImpactInputSchema } from '@financial-analysis/analysis';

export class CreditScoreImpactTool {
  static readonly toolName = 'analyze_credit_score_impact';
  static readonly description =
    'Analyze credit score impact of actions, project score changes, optimize credit utilization, and provide improvement recommendations';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      currentCredit: {
        type: 'object',
        properties: {
          currentScore: { type: 'number', minimum: 300, maximum: 850, description: 'Current credit score' },
          creditBureau: {
            type: 'string',
            enum: ['fico-8', 'fico-9', 'vantagescore-3', 'vantagescore-4'],
            default: 'fico-8',
            description: 'Credit bureau model',
          },
        },
        required: ['currentScore'],
      },
      creditUtilization: {
        type: 'object',
        properties: {
          totalCreditLimit: { type: 'number', minimum: 0, description: 'Total credit limit' },
          totalCreditUsed: { type: 'number', minimum: 0, description: 'Total credit used' },
          utilizationPercentage: { type: 'number', minimum: 0, maximum: 1, default: 0, description: 'Utilization percentage' },
        },
        required: ['totalCreditLimit', 'totalCreditUsed'],
      },
      paymentHistory: {
        type: 'object',
        properties: {
          onTimePayments: { type: 'number', minimum: 0, maximum: 100, default: 100, description: 'On-time payment percentage' },
          latePayments30Days: { type: 'number', minimum: 0, default: 0, description: '30-day late payments' },
          latePayments60Days: { type: 'number', minimum: 0, default: 0, description: '60-day late payments' },
          latePayments90Days: { type: 'number', minimum: 0, default: 0, description: '90-day late payments' },
        },
      },
      plannedActions: {
        type: 'object',
        properties: {
          payDownDebt: {
            type: 'object',
            properties: {
              amount: { type: 'number', minimum: 0, default: 0, description: 'Amount to pay down' },
              targetUtilization: { type: 'number', minimum: 0, maximum: 1, default: 0.3, description: 'Target utilization' },
            },
          },
          openNewAccount: { type: 'boolean', default: false, description: 'Open new account' },
          requestCreditLimitIncrease: { type: 'boolean', default: false, description: 'Request credit limit increase' },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeScoreProjection: { type: 'boolean', default: true, description: 'Include score projection' },
          includeActionRecommendations: { type: 'boolean', default: true, description: 'Include action recommendations' },
          includeTimelineAnalysis: { type: 'boolean', default: true, description: 'Include timeline analysis' },
          projectionMonths: { type: 'number', minimum: 1, maximum: 24, default: 12, description: 'Projection months' },
        },
      },
    },
    required: ['currentCredit', 'creditUtilization'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = CreditScoreImpactInputSchema.parse(args);
    return CreditScoreImpactAnalyzer.analyze(validated);
  }
}

