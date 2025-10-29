/**
 * Calculator Comparison System
 *
 * This system allows users to compare multiple calculators side by side
 * and provides recommendations based on their financial situation.
 */

import type { CalculatorConfig } from './CalculatorTemplate';
import { CALCULATOR_CONFIGS } from './CalculatorTemplate';

export interface CalculatorComparison {
  calculators: CalculatorConfig[];
  comparisonCriteria: string[];
  recommendations: ComparisonRecommendation[];
}

export interface ComparisonRecommendation {
  calculatorId: string;
  score: number;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UserProfile {
  age: number;
  income: number;
  debtAmount: number;
  savingsAmount: number;
  financialGoals: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

// Calculator recommendation engine
export function getCalculatorRecommendations(profile: UserProfile): ComparisonRecommendation[] {
  const recommendations: ComparisonRecommendation[] = [];

  // Analyze user profile and recommend calculators
  Object.values(CALCULATOR_CONFIGS).forEach((calculator) => {
    let score = 0;
    let reasoning = '';

    switch (calculator.id) {
      case 'budget':
        if (profile.income > 0) {
          score = 90;
          reasoning = 'Essential for managing your income and expenses';
        }
        break;

      case 'debt-payoff':
        if (profile.debtAmount > 0) {
          score = 85;
          reasoning = 'Critical for eliminating debt and improving financial health';
        }
        break;

      case 'retirement':
        if (profile.age < 50) {
          score = 80;
          reasoning = 'Early retirement planning maximizes compound growth';
        } else if (profile.age >= 50) {
          score = 95;
          reasoning = 'Catch-up contributions and retirement readiness assessment';
        }
        break;

      case 'savings-goal':
        if (profile.savingsAmount < profile.income * 3) {
          score = 75;
          reasoning = 'Build emergency fund and achieve financial goals';
        }
        break;

      case 'amortization':
        if (profile.financialGoals.includes('home-buying')) {
          score = 85;
          reasoning = 'Essential for mortgage planning and home buying';
        }
        break;

      case 'auto-loan':
        if (profile.financialGoals.includes('vehicle-purchase')) {
          score = 70;
          reasoning = 'Optimize vehicle financing and loan terms';
        }
        break;

      case 'student-loans':
        if (profile.debtAmount > 0 && profile.age < 40) {
          score = 80;
          reasoning = 'Optimize student loan repayment strategy';
        }
        break;
    }

    if (score > 0) {
      const priority: 'high' | 'medium' | 'low' =
        score >= 85 ? 'high' : score >= 70 ? 'medium' : 'low';

      recommendations.push({
        calculatorId: calculator.id,
        score,
        reasoning,
        priority,
      });
    }
  });

  // Sort by score (highest first)
  return recommendations.sort((a, b) => b.score - a.score);
}

// Generate comparison matrix
export function generateComparisonMatrix(calculatorIds: string[]): CalculatorComparison {
  const calculators = calculatorIds.map((id) => CALCULATOR_CONFIGS[id]).filter(Boolean);

  const comparisonCriteria = [
    'Ease of Use',
    'Accuracy',
    'Features',
    'Speed',
    'Mobile Friendly',
    'Educational Value',
  ];

  // Generate recommendations based on calculator selection
  const recommendations: ComparisonRecommendation[] = calculators.map((calc) => ({
    calculatorId: calc.id,
    score: Math.floor(Math.random() * 20) + 80, // Mock scores
    reasoning: `Excellent ${calc.title} with comprehensive features`,
    priority: 'high' as const,
  }));

  return {
    calculators,
    comparisonCriteria,
    recommendations,
  };
}

// Calculator usage analytics
export function trackCalculatorUsage(calculatorId: string, userProfile?: UserProfile): void {
  // In a real implementation, this would send analytics data
  console.log(`Calculator used: ${calculatorId}`, userProfile);
}

// Generate calculator insights
export function generateCalculatorInsights(calculatorId: string): string[] {
  const insights: Record<string, string[]> = {
    amortization: [
      'Extra payments early in the loan save the most interest',
      'Biweekly payments can reduce loan term by 4-6 years',
      'Refinancing makes sense if you can reduce rate by 0.5% or more',
    ],
    retirement: [
      'Start early - compound interest is your greatest ally',
      "Maximize employer matching - it's free money",
      'Consider Roth vs Traditional based on current vs future tax rates',
    ],
    'debt-payoff': [
      'Avalanche method saves more money in interest',
      'Snowball method provides psychological motivation',
      'Consider debt consolidation for high-interest debts',
    ],
    'savings-goal': [
      'Automate savings to build consistent habits',
      'High-yield savings accounts offer better returns',
      'Consider inflation when setting long-term goals',
    ],
    budget: [
      'Follow the 50/30/20 rule for balanced budgeting',
      'Track expenses for at least 3 months for accuracy',
      'Build emergency fund before other savings goals',
    ],
    'auto-loan': [
      'Shop around for the best interest rates',
      'Consider total cost of ownership, not just monthly payment',
      'Shorter loan terms save money despite higher payments',
    ],
    'student-loans': [
      'Income-driven repayment plans offer payment flexibility',
      'Consider loan forgiveness programs if eligible',
      'Refinancing federal loans loses important protections',
    ],
  };

  return insights[calculatorId] || ['Use this calculator regularly to track your progress'];
}
