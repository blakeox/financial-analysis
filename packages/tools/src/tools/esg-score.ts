import { ESGScoreInputSchema, ESGScoringCalculator } from '@financial-analysis/analysis';

export class ESGScoreTool {
  static readonly toolName = 'calculate_esg_score';
  static readonly description = 'Compute a basic ESG score with optional weighting and rating';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      environmentalScore: { type: 'number', minimum: 0, maximum: 100 },
      socialScore: { type: 'number', minimum: 0, maximum: 100 },
      governanceScore: { type: 'number', minimum: 0, maximum: 100 },
      weights: {
        type: 'object',
        properties: {
          environmental: { type: 'number', minimum: 0 },
          social: { type: 'number', minimum: 0 },
          governance: { type: 'number', minimum: 0 },
        },
      },
    },
    required: ['environmentalScore', 'socialScore', 'governanceScore'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = ESGScoreInputSchema.parse(args);
    return ESGScoringCalculator.analyze(validated);
  }
}
