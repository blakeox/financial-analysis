/**
 * Depreciation Calculator
 * Calculate depreciation using multiple methods with tax impact analysis
 */

import type { DepreciationInput } from '../../schemas/depreciation.js';

export class DepreciationCalculator {
  /**
   * Calculate depreciation schedule
   */
  static analyze(input: DepreciationInput): unknown {
    const assetInfo = input.assetInfo;
    const depreciationMethod = input.depreciationMethod;
    const taxInfo = input.taxInfo;
    const disposal = input.disposal;
    const analysis = input.analysis;

    // Calculate depreciation schedule
    const depreciationSchedule = analysis.includeSchedule
      ? this.calculateDepreciationSchedule(input)
      : undefined;

    // Tax savings
    const taxSavings = analysis.includeTaxSavings
      ? this.calculateTaxSavings(depreciationSchedule, input)
      : undefined;

    // Method comparison
    const methodComparison = analysis.includeMethodComparison
      ? this.compareMethods(input)
      : undefined;

    // Disposal analysis
    const disposalAnalysis = disposal && disposal.includeDisposalAnalysis
      ? this.analyzeDisposal(assetInfo, disposal, depreciationSchedule, taxInfo)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      depreciationSchedule,
      taxSavings,
      methodComparison,
      depreciationMethod
    );

    return {
      summary: {
        assetCost: assetInfo.purchaseCost,
        totalDepreciation: depreciationSchedule?.totalDepreciation || 0,
        totalTaxSavings: taxSavings?.totalSavings || 0,
        bookValue: assetInfo.purchaseCost - (depreciationSchedule?.totalDepreciation || 0),
      },
      depreciationSchedule,
      taxSavings,
      methodComparison,
      disposalAnalysis,
      recommendations,
    };
  }

  private static calculateDepreciationSchedule(
    input: DepreciationInput
  ): {
    schedule: Array<{ year: number; depreciation: number; accumulatedDepreciation: number; bookValue: number }>;
    totalDepreciation: number;
  } {
    const schedule: Array<{ year: number; depreciation: number; accumulatedDepreciation: number; bookValue: number }> = [];
    let accumulatedDepreciation = 0;
    const asset = input.assetInfo;
    const method = input.depreciationMethod;
    const taxInfo = input.taxInfo;
    const years = input.analysis.projectionYears;
    const depreciableBase = asset.purchaseCost - asset.salvageValue;

    for (let year = 1; year <= Math.min(years, asset.usefulLife); year++) {
      let depreciation = 0;

      switch (method) {
        case 'straight-line':
          depreciation = depreciableBase / asset.usefulLife;
          break;
        case 'declining-balance':
        case 'double-declining-balance': {
          const rate = method === 'double-declining-balance' ? 2 / asset.usefulLife : 1.5 / asset.usefulLife;
          const bookValue = asset.purchaseCost - accumulatedDepreciation;
          depreciation = Math.min(bookValue * rate, depreciableBase - accumulatedDepreciation);
          break;
        }
        case 'sum-of-years-digits': {
          const sumOfYears = (asset.usefulLife * (asset.usefulLife + 1)) / 2;
          const remainingYears = asset.usefulLife - year + 1;
          depreciation = (depreciableBase * remainingYears) / sumOfYears;
          break;
        }
        case 'macrs':
          depreciation = this.calculateMACRS(input, year);
          break;
        case 'section-179':
          depreciation = year === 1 ? Math.min(asset.purchaseCost, taxInfo.section179Limit) : 0;
          break;
        case 'bonus-depreciation':
          depreciation = year === 1 ? asset.purchaseCost * taxInfo.bonusDepreciationPercentage : 0;
          break;
      }

      accumulatedDepreciation += depreciation;
      const bookValue = asset.purchaseCost - accumulatedDepreciation;

      schedule.push({
        year,
        depreciation,
        accumulatedDepreciation,
        bookValue: Math.max(asset.salvageValue, bookValue),
      });
    }

    return {
      schedule,
      totalDepreciation: accumulatedDepreciation,
    };
  }

  private static calculateMACRS(input: DepreciationInput, year: number): number {
    if (!input.macrsDetails) {
      return 0;
    }

    const { assetInfo: asset } = input;

    // Simplified MACRS calculation - in reality uses specific tables
    const propertyClass = input.macrsDetails.propertyClass;
    const classYears: Record<string, number> = {
      '3-year': 3,
      '5-year': 5,
      '7-year': 7,
      '10-year': 10,
      '15-year': 15,
      '20-year': 20,
      '27.5-year': 27.5,
      '39-year': 39,
    };

    const usefulLife = classYears[propertyClass] || 5;
    const depreciableBase = asset.purchaseCost - asset.salvageValue;

    // Simplified: use double-declining balance for MACRS
    if (year === 1 && input.macrsDetails.convention === 'half-year') {
      return (depreciableBase * (2 / usefulLife)) / 2;
    }

    const bookValue = asset.purchaseCost - (depreciableBase * (2 / usefulLife) * (year - 1));
    return Math.min(bookValue * (2 / usefulLife), depreciableBase * (1 - Math.pow(1 - 2 / usefulLife, year)));
  }

  private static calculateTaxSavings(
    schedule: { schedule: Array<{ year: number; depreciation: number; accumulatedDepreciation: number; bookValue: number }>; totalDepreciation: number } | undefined,
    input: DepreciationInput
  ): {
    annualSavings: Array<{ year: number; taxSavings: number }>;
    totalSavings: number;
  } {
    if (!schedule) {
      return {
        annualSavings: [],
        totalSavings: 0,
      };
    }

    const { taxInfo, assetInfo: asset } = input;
    const taxRate = taxInfo.federalTaxRate + taxInfo.stateTaxRate;
    const annualSavings = schedule.schedule.map((entry) => ({
      year: entry.year,
      taxSavings: entry.depreciation * taxRate * asset.businessUsePercentage,
    }));

    const totalSavings = annualSavings.reduce((sum, entry) => sum + entry.taxSavings, 0);

    return {
      annualSavings,
      totalSavings,
    };
  }

  private static compareMethods(
    input: DepreciationInput
  ): {
    methods: Array<{ method: string; totalDepreciation: number; totalTaxSavings: number }>;
    bestMethod: string;
  } {
    const { taxInfo, assetInfo: asset } = input;

    const methods = ['straight-line', 'double-declining-balance', 'macrs'].map((method) => {
      const tempInput = { ...input, depreciationMethod: method as DepreciationInput['depreciationMethod'] };
      const schedule = this.calculateDepreciationSchedule(tempInput);
      const taxRate = taxInfo.federalTaxRate + taxInfo.stateTaxRate;
      const totalTaxSavings = schedule.totalDepreciation * taxRate * asset.businessUsePercentage;

      return {
        method,
        totalDepreciation: schedule.totalDepreciation,
        totalTaxSavings,
      };
    });

    const bestMethod = methods.reduce((best, current) =>
      current.totalTaxSavings > best.totalTaxSavings ? current : best
    ).method;

    return { methods, bestMethod };
  }

  private static analyzeDisposal(
    asset: DepreciationInput['assetInfo'],
    disposal: NonNullable<DepreciationInput['disposal']>,
    schedule: { totalDepreciation: number } | undefined,
    taxInfo: DepreciationInput['taxInfo']
  ): {
    bookValue: number;
    gainOrLoss: number;
    depreciationRecapture: number;
    taxOnDisposal: number;
    netProceeds: number;
  } {
    if (!schedule) {
      return {
        bookValue: asset.purchaseCost,
        gainOrLoss: 0,
        depreciationRecapture: 0,
        taxOnDisposal: 0,
        netProceeds: disposal.disposalProceeds,
      };
    }

    const bookValue = asset.purchaseCost - schedule.totalDepreciation;
    const gainOrLoss = disposal.disposalProceeds - bookValue;
    const depreciationRecapture = Math.min(gainOrLoss, schedule.totalDepreciation);
    const taxOnDisposal = gainOrLoss > 0
      ? gainOrLoss * taxInfo.federalTaxRate
      : 0;
    const netProceeds = disposal.disposalProceeds - taxOnDisposal;

    return {
      bookValue,
      gainOrLoss,
      depreciationRecapture,
      taxOnDisposal,
      netProceeds,
    };
  }

  private static generateRecommendations(
    schedule: { totalDepreciation: number } | undefined,
    taxSavings: { totalSavings: number } | undefined,
    comparison: { bestMethod: string } | undefined,
    method: DepreciationInput['depreciationMethod']
  ): string[] {
    const recommendations: string[] = [];

    if (schedule) {
      recommendations.push(`Total depreciation: $${schedule.totalDepreciation.toFixed(0)}`);
    }

    if (taxSavings) {
      recommendations.push(`Total tax savings: $${taxSavings.totalSavings.toFixed(0)}`);
    }

    if (comparison && comparison.bestMethod !== method) {
      recommendations.push(`Consider ${comparison.bestMethod} method for better tax benefits`);
    }

    if (method === 'section-179' || method === 'bonus-depreciation') {
      recommendations.push('Section 179 and bonus depreciation provide immediate tax benefits');
    }

    return recommendations;
  }
}



