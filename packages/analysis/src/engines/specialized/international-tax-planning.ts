import type { InternationalTaxPlanningInput } from '../../schemas/international-tax-planning.js';

export interface InternationalTaxPlanningResult {
  taxLiability: {
    usFederalTax: number;
    foreignTax: number;
    totalTax: number;
    foreignTaxCredit: number;
    netTaxOwed: number;
  };
  treatyBenefits: string[];
  recommendedStructures: string[];
  complianceRequirements: string[];
  projectedSavings: number;
  recommendations: string[];
  risks: string[];
}

export class InternationalTaxPlanningOptimizer {
  static analyze(input: InternationalTaxPlanningInput): InternationalTaxPlanningResult {
    // Basic international tax calculation
    const worldwideIncome =
      input.foreignIncome.foreignEarnedIncome + input.foreignIncome.foreignUnearnedIncome;
    const usTaxableIncome = worldwideIncome; // Simplified - US taxes worldwide income

    // Rough US tax calculation
    const usFederalTax = this.calculateUSTax(usTaxableIncome, input.personalInfo.filingStatus);

    // Foreign tax calculation (simplified)
    const foreignTax = input.foreignIncome.countries.reduce(
      (sum: number, country) => sum + country.taxPaid,
      0
    );

    // Foreign tax credit calculation
    const foreignTaxCredit = Math.min(foreignTax, usFederalTax * 0.8); // 80% limit
    const netTaxOwed = usFederalTax - foreignTaxCredit;

    return {
      taxLiability: {
        usFederalTax,
        foreignTax,
        totalTax: usFederalTax + foreignTax,
        foreignTaxCredit,
        netTaxOwed,
      },
      treatyBenefits: [
        'Reduced withholding rates on dividends and interest',
        'Elimination of double taxation on certain income types',
      ],
      recommendedStructures: [
        'Foreign holding company for passive income',
        'Check-the-box election for disregarded entities',
        'Foreign sales corporation for export income',
      ],
      complianceRequirements: [
        'File Form 1116 for foreign tax credit',
        'Report foreign accounts on FBAR if over $10,000',
        'Consider CFC rules for controlled foreign corporations',
      ],
      projectedSavings: foreignTaxCredit,
      recommendations: [
        'Review tax treaties between US and income source countries',
        'Consider foreign earned income exclusion if qualifying',
        'Structure investments to maximize foreign tax credits',
      ],
      risks: [
        'Changes in tax treaties or laws',
        'Increased IRS scrutiny of international structures',
        'Potential double taxation if not properly planned',
      ],
    };
  }

  private static calculateUSTax(income: number, filingStatus: string): number {
    // Simplified progressive tax calculation
    const brackets =
      filingStatus === 'single'
        ? [0, 11000, 44725, 95375, 182100, 231250, 578125]
        : [0, 22000, 89450, 190750, 364200, 462500, 693750];

    const rates = [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];

    let tax = 0;
    let remainingIncome = income;

    for (let i = 1; i < brackets.length; i++) {
      if (remainingIncome > brackets[i - 1]!) {
        const bracketIncome = Math.min(
          remainingIncome - brackets[i - 1]!,
          brackets[i]! - brackets[i - 1]!
        );
        tax += bracketIncome * rates[i - 1]!;
      }
    }

    // Top bracket
    if (remainingIncome > brackets[brackets.length - 1]!) {
      tax += (remainingIncome - brackets[brackets.length - 1]!) * rates[rates.length - 1]!;
    }

    return tax;
  }
}
