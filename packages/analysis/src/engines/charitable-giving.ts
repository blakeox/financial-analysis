import { Decimal } from 'decimal.js';

import type { CharitableGivingInput } from '../schemas/charitable-giving.js';

export interface CharitableGivingResult {
  totalTaxSavings: number;
  optimalGivingStrategy: string;
  recommendedCharities: string[];
  methodComparison?: Array<{
    method: CharitableGivingInput['givingDetails']['givingMethod'];
    estimatedTaxSavings: number;
    summary: string;
  }>;
  projectedImpact: {
    immediateTaxBenefit: number;
    longTermPhilanthropicImpact: number;
    estateTaxReduction: number;
  };
  recommendations: string[];
  risks: string[];
}

export class CharitableGivingOptimizer {
  static analyze(input: CharitableGivingInput): CharitableGivingResult {
    // Basic implementation - calculate tax savings from charitable deductions
    const itemizedDeductions = input.givingDetails.annualGivingAmount;

    const taxSavings = new Decimal(itemizedDeductions)
      .times(input.taxInfo.federalTaxRate)
      .toNumber();
    const methodComparison = input.analysis.compareMethods
      ? this.buildMethodComparison(input)
      : undefined;

    return {
      totalTaxSavings: taxSavings,
      optimalGivingStrategy: 'Maximize itemized deductions while maintaining tax efficiency',
      recommendedCharities: [
        'Local community organizations',
        'Educational institutions',
        'Healthcare foundations',
      ],
      ...(methodComparison ? { methodComparison } : {}),
      projectedImpact: {
        immediateTaxBenefit: taxSavings,
        longTermPhilanthropicImpact: input.givingDetails.annualGivingAmount * 5, // Rough multiplier
        estateTaxReduction: input.givingDetails.annualGivingAmount * 0.1, // Rough estimate
      },
      recommendations: [
        'Consider bunching donations to exceed standard deduction',
        'Explore donor-advised funds for tax planning',
        'Consider qualified charitable distributions from IRAs if over 70½',
      ],
      risks: [
        'Changes in tax laws could affect deductions',
        'Over-donation may impact personal financial goals',
      ],
    };
  }

  private static buildMethodComparison(
    input: CharitableGivingInput
  ): NonNullable<CharitableGivingResult['methodComparison']> {
    const donationAmount = new Decimal(input.givingDetails.annualGivingAmount);
    const combinedRate = new Decimal(input.taxInfo.federalTaxRate).plus(
      input.taxInfo.stateTaxRate ?? 0
    );

    const methods: Array<{
      method: CharitableGivingInput['givingDetails']['givingMethod'];
      multiplier: Decimal;
      summary: string;
    }> = [
      {
        method: 'cash',
        multiplier: combinedRate,
        summary: 'Direct deduction based on combined marginal tax rate',
      },
      {
        method: 'appreciated-securities',
        multiplier: combinedRate.plus(0.05),
        summary: 'Adds avoided capital gains drag on appreciated assets',
      },
      {
        method: 'donor-advised-fund',
        multiplier: combinedRate.plus(0.02),
        summary: 'Preserves current-year deduction with future grant flexibility',
      },
      {
        method: 'qcd',
        multiplier: new Decimal(
          input.personalInfo.age >= 70.5
            ? input.taxInfo.federalTaxRate
            : input.taxInfo.federalTaxRate * 0.5
        ),
        summary: 'Best when IRA distributions can be excluded from taxable income',
      },
      {
        method: 'trust',
        multiplier: combinedRate.plus(0.01),
        summary: 'Estate-planning vehicle with added complexity costs',
      },
    ];

    return methods.map(({ method, multiplier, summary }) => ({
      method,
      estimatedTaxSavings: Number(donationAmount.times(multiplier).toDecimalPlaces(2).toString()),
      summary,
    }));
  }
}
