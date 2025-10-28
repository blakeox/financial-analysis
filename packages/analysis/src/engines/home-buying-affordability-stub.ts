// Minimal stub implementation for HomeBuyingAffordabilityCalculator
export class HomeBuyingAffordabilityCalculator {
  static analyze(_input: unknown): unknown {
    return {
      summary: {
        maxAffordablePrice: 400000,
        recommendedDownPayment: 80000,
        monthlyPayment: 2000,
        affordabilityScore: 75,
      },
      recommendations: ['Save for down payment', 'Improve credit score'],
      insights: ['Good affordability', 'Consider timing'],
    };
  }
}
