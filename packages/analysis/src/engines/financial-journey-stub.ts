// Minimal stub implementation for FinancialJourneyAnalyzer
export class FinancialJourneyAnalyzer {
  static analyze(_input: any): any {
    return {
      summary: {
        currentStage: 'getting-started',
        overallFinancialHealth: 75,
        nextMilestone: 'Build emergency fund',
        estimatedTimeToNext: '6 months'
      },
      recommendations: ['Start building emergency fund', 'Create budget'],
      insights: ['Good starting point', 'Focus on basics first']
    };
  }
}
