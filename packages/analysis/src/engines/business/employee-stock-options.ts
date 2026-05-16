/**
 * Employee Stock Option Valuator
 * Value employee stock options with tax optimization
 */

import type { EmployeeStockOptionsInput } from '../../schemas/employee-stock-options.js';

export class EmployeeStockOptionsValuator {
  /**
   * Analyze employee stock options
   */
  static analyze(input: EmployeeStockOptionsInput): unknown {
    const personalInfo = input.personalInfo;
    const options = input.options;
    const taxInfo = input.taxInfo;
    const exerciseStrategy = input.exerciseStrategy;
    const analysis = input.analysis;

    // Value options
    const optionValuation = analysis.includeValuation ? this.valueOptions(options) : undefined;

    // Tax analysis
    const taxAnalysis = analysis.includeTaxAnalysis
      ? this.analyzeTaxImplications(options, taxInfo, exerciseStrategy)
      : undefined;

    // Exercise scenarios
    const exerciseScenarios = analysis.includeExerciseScenarios
      ? this.analyzeExerciseScenarios(options, taxInfo, exerciseStrategy, personalInfo)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      optionValuation,
      taxAnalysis,
      exerciseScenarios,
      exerciseStrategy
    );

    return {
      summary: {
        totalOptions: options.reduce((sum, opt) => sum + opt.numberOfOptions, 0),
        totalIntrinsicValue: optionValuation?.totalIntrinsicValue || 0,
        totalBlackScholesValue: optionValuation?.totalBlackScholesValue || 0,
        estimatedTaxOnExercise: taxAnalysis?.totalTaxOnExercise || 0,
      },
      optionValuation,
      taxAnalysis,
      exerciseScenarios,
      recommendations,
    };
  }

  private static valueOptions(options: EmployeeStockOptionsInput['options']): {
    options: Array<{
      grantId: string | undefined;
      intrinsicValue: number;
      blackScholesValue: number;
      timeValue: number;
    }>;
    totalIntrinsicValue: number;
    totalBlackScholesValue: number;
  } {
    const optionValues = options.map((option) => {
      const intrinsicValue = Math.max(
        0,
        (option.currentStockPrice - option.grantPrice) * option.numberOfOptions
      );
      const blackScholesValue = this.calculateBlackScholes(option);
      const timeValue = blackScholesValue - intrinsicValue;

      return {
        grantId: option.grantId,
        intrinsicValue,
        blackScholesValue,
        timeValue,
      };
    });

    const totalIntrinsicValue = optionValues.reduce((sum, opt) => sum + opt.intrinsicValue, 0);
    const totalBlackScholesValue = optionValues.reduce(
      (sum, opt) => sum + opt.blackScholesValue,
      0
    );

    return {
      options: optionValues,
      totalIntrinsicValue,
      totalBlackScholesValue,
    };
  }

  private static calculateBlackScholes(option: EmployeeStockOptionsInput['options'][0]): number {
    // Simplified Black-Scholes for employee stock options
    const S = option.currentStockPrice;
    const K = option.grantPrice;
    const T = this.yearsUntilExpiration(option.expirationDate);
    const r = option.riskFreeRate;
    const sigma = option.expectedVolatility;

    if (T <= 0) return Math.max(0, S - K) * option.numberOfOptions;

    const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const N1 = this.normalCDF(d1);
    const N2 = this.normalCDF(d2);

    const callValue = S * N1 - K * Math.exp(-r * T) * N2;
    return callValue * option.numberOfOptions;
  }

  private static normalCDF(x: number): number {
    // Approximation of cumulative normal distribution
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private static yearsUntilExpiration(expirationDate: string): number {
    const expiration = new Date(expirationDate);
    const now = new Date();
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, diffDays / 365);
  }

  private static analyzeTaxImplications(
    options: EmployeeStockOptionsInput['options'],
    taxInfo: EmployeeStockOptionsInput['taxInfo'],
    _strategy: EmployeeStockOptionsInput['exerciseStrategy']
  ): {
    options: Array<{
      grantId: string | undefined;
      exerciseTax: number;
      saleTax: number;
      totalTax: number;
      afterTaxValue: number;
    }>;
    totalTaxOnExercise: number;
    totalTaxOnSale: number;
  } {
    const taxAnalysis = options.map((option) => {
      const intrinsicValue = Math.max(
        0,
        (option.currentStockPrice - option.grantPrice) * option.numberOfOptions
      );

      // Exercise tax depends on option type
      let exerciseTax = 0;
      if (option.optionType === 'nso') {
        exerciseTax = intrinsicValue * (taxInfo.federalTaxRate.ordinary + taxInfo.stateTaxRate);
      } else if (option.optionType === 'iso') {
        // ISO: no tax on exercise, but may trigger AMT
        if (taxInfo.includeAMT && taxInfo.federalTaxRate.amt) {
          exerciseTax = intrinsicValue * 0.26; // AMT rate
        }
      }

      // Sale tax (assuming immediate sale)
      const saleProceeds = option.currentStockPrice * option.numberOfOptions;
      const saleTax =
        (saleProceeds - option.grantPrice * option.numberOfOptions) *
        taxInfo.federalTaxRate.capitalGains;
      const totalTax = exerciseTax + saleTax;
      const afterTaxValue = saleProceeds - totalTax;

      return {
        grantId: option.grantId,
        exerciseTax,
        saleTax,
        totalTax,
        afterTaxValue,
      };
    });

    const totalTaxOnExercise = taxAnalysis.reduce((sum, opt) => sum + opt.exerciseTax, 0);
    const totalTaxOnSale = taxAnalysis.reduce((sum, opt) => sum + opt.saleTax, 0);

    return {
      options: taxAnalysis,
      totalTaxOnExercise,
      totalTaxOnSale,
    };
  }

  private static analyzeExerciseScenarios(
    options: EmployeeStockOptionsInput['options'],
    taxInfo: EmployeeStockOptionsInput['taxInfo'],
    strategy: EmployeeStockOptionsInput['exerciseStrategy'],
    _personalInfo: EmployeeStockOptionsInput['personalInfo']
  ): {
    scenarios: Array<{
      scenario: string;
      exerciseAmount: number;
      taxCost: number;
      netValue: number;
      recommendation: string;
    }>;
  } {
    const scenarios = [
      {
        scenario: 'Exercise Now',
        exerciseAmount: strategy.exerciseAmount || 0,
        taxCost:
          (strategy.exerciseAmount || 0) * (taxInfo.federalTaxRate.ordinary + taxInfo.stateTaxRate),
        netValue: (strategy.exerciseAmount || 0) * 0.6, // Simplified
        recommendation: 'Consider tax implications before exercising',
      },
      {
        scenario: 'Exercise at Vest',
        exerciseAmount: options.reduce(
          (sum, opt) => sum + opt.numberOfOptions * opt.currentStockPrice,
          0
        ),
        taxCost: 0, // Simplified
        netValue: options.reduce(
          (sum, opt) => sum + opt.numberOfOptions * opt.currentStockPrice,
          0
        ),
        recommendation: 'Exercise at vesting to start capital gains clock',
      },
      {
        scenario: 'Hold to Expiration',
        exerciseAmount: 0,
        taxCost: 0,
        netValue: options.reduce((sum, opt) => {
          const intrinsic = Math.max(
            0,
            (opt.currentStockPrice - opt.grantPrice) * opt.numberOfOptions
          );
          return sum + intrinsic;
        }, 0),
        recommendation: 'Hold if expecting stock price appreciation',
      },
    ];

    return { scenarios };
  }

  private static generateRecommendations(
    valuation: { totalIntrinsicValue: number } | undefined,
    tax: { totalTaxOnExercise: number } | undefined,
    scenarios: { scenarios: Array<{ scenario: string; recommendation: string }> } | undefined,
    strategy: EmployeeStockOptionsInput['exerciseStrategy']
  ): string[] {
    const recommendations: string[] = [];

    if (valuation) {
      recommendations.push(`Total intrinsic value: $${valuation.totalIntrinsicValue.toFixed(0)}`);
    }

    if (tax) {
      recommendations.push(`Estimated tax on exercise: $${tax.totalTaxOnExercise.toFixed(0)}`);
    }

    if (strategy.includeTaxOptimization) {
      recommendations.push('Consider exercising in low-income years to minimize tax impact');
    }

    if (scenarios) {
      scenarios.scenarios.forEach((scenario) => {
        recommendations.push(`${scenario.scenario}: ${scenario.recommendation}`);
      });
    }

    return recommendations;
  }
}
