// Minimal stub implementation for InsuranceNeedsCalculator
export class InsuranceNeedsCalculator {
  static analyze(_input: unknown): unknown {
    return {
      summary: {
        totalRecommendedCoverage: 500000,
        totalCoverageGap: 200000,
        insuranceHealthScore: 60,
      },
      recommendations: ['Increase life insurance', 'Consider disability insurance'],
      insights: ['Coverage gap detected', 'Review insurance needs'],
    };
  }
}
