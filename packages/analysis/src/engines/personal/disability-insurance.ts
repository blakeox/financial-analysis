import { Decimal } from 'decimal.js';

import type { DisabilityInsuranceInput } from '../../schemas/disability-insurance.js';

export interface DisabilityInsuranceResult {
  recommendedCoverage: number;
  monthlyPremium: number;
  benefitAmount: number;
  eliminationPeriod: number;
  benefitPeriod: string;
  totalCost: number;
  costBenefitRatio: number;
  recommendations: string[];
  risks: string[];
}

export class DisabilityInsuranceAnalyzer {
  static analyze(input: DisabilityInsuranceInput): DisabilityInsuranceResult {
    // Basic calculation for disability insurance needs
    const incomeReplacementRatio = 0.6; // 60% of income
    const recommendedCoverage = new Decimal(input.personalInfo.annualIncome)
      .times(incomeReplacementRatio)
      .toNumber();

    // Rough premium calculation based on age and occupation
    const baseRate = 0.002; // 0.2% of income per month
    const ageMultiplier = input.personalInfo.age < 30 ? 1 : input.personalInfo.age < 40 ? 1.2 : 1.5;
    const occupationMultiplier = input.personalInfo.occupationClass === 'high-risk' ? 2 : 1;

    const monthlyPremium = new Decimal(recommendedCoverage)
      .times(baseRate)
      .times(ageMultiplier)
      .times(occupationMultiplier)
      .toNumber();

    return {
      recommendedCoverage,
      monthlyPremium,
      benefitAmount: recommendedCoverage,
      eliminationPeriod: 90, // 90 days
      benefitPeriod: 'To age 65',
      totalCost: monthlyPremium * 12,
      costBenefitRatio: recommendedCoverage / (monthlyPremium * 12),
      recommendations: [
        'Consider short elimination period for better coverage',
        'Review policy riders for cost of living adjustments',
        'Compare multiple insurers for best rates',
      ],
      risks: [
        'Inflation may reduce benefit purchasing power',
        'Policy may have exclusions for pre-existing conditions',
        'Employer-provided coverage may be insufficient',
      ],
    };
  }
}
