/**
 * Accounts Receivable Aging Analysis
 * Optimize collection periods and reduce bad debt
 */

import type { AccountsReceivableAgingInput } from '../schemas/accounts-receivable-aging.js';

export class AccountsReceivableAgingAnalyzer {
  /**
   * Analyze accounts receivable aging
   */
  static analyze(input: AccountsReceivableAgingInput): unknown {
    const receivables = input.receivables;
    const creditPolicy = input.creditPolicy;
    const historicalData = input.historicalData;
    const analysis = input.analysis;

    // Calculate DSO
    const dsoAnalysis = analysis.includeDSO
      ? this.calculateDSO(receivables, historicalData, creditPolicy)
      : undefined;

    // Aging analysis
    const agingAnalysis = analysis.includeAgingAnalysis
      ? this.performAgingAnalysis(receivables)
      : undefined;

    // Bad debt forecast
    const badDebtForecast = analysis.includeBadDebtForecast
      ? this.forecastBadDebt(agingAnalysis, historicalData)
      : undefined;

    // Collection recommendations
    const collectionRecommendations = analysis.includeCollectionRecommendations
      ? this.generateCollectionRecommendations(agingAnalysis, creditPolicy)
      : undefined;

    // Credit policy optimization
    const creditPolicyOptimization = analysis.includeCreditPolicyOptimization
      ? this.optimizeCreditPolicy(creditPolicy, historicalData, receivables)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      dsoAnalysis,
      agingAnalysis,
      badDebtForecast,
      collectionRecommendations
    );

    return {
      summary: {
        totalReceivables: receivables.totalReceivables,
        daysSalesOutstanding: dsoAnalysis?.dso || 0,
        overdueAmount: agingAnalysis?.overdueAmount || 0,
        estimatedBadDebt: badDebtForecast?.estimatedBadDebt || 0,
      },
      dsoAnalysis: dsoAnalysis ? {
        ...dsoAnalysis,
        daysSalesOutstanding: dsoAnalysis.dso,
      } : undefined,
      agingAnalysis: agingAnalysis ? {
        ...agingAnalysis,
        agingBuckets: agingAnalysis.buckets,
      } : undefined,
      badDebtForecast,
      collectionRecommendations: collectionRecommendations?.recommendations,
      creditPolicyOptimization,
      recommendations,
    };
  }

  private static calculateDSO(
    receivables: AccountsReceivableAgingInput['receivables'],
    historical: AccountsReceivableAgingInput['historicalData'],
    creditPolicy: AccountsReceivableAgingInput['creditPolicy']
  ): {
    dso: number;
    targetDSO: number;
    dsoVariance: number;
    interpretation: string;
  } {
    const dso = historical.annualCreditSales > 0
      ? (receivables.totalReceivables / historical.annualCreditSales) * 365
      : 0;
    const targetDSO = creditPolicy.paymentTerms || 30;
    const dsoVariance = dso - targetDSO;

    let interpretation = 'DSO is within target range';
    if (dsoVariance > 10) {
      interpretation = 'DSO is significantly above target - improve collections';
    } else if (dsoVariance < -5) {
      interpretation = 'DSO is below target - excellent collection performance';
    }

    return {
      dso,
      targetDSO,
      dsoVariance,
      interpretation,
    };
  }

  private static performAgingAnalysis(
    receivables: AccountsReceivableAgingInput['receivables']
  ): {
    buckets: Array<{
      bucket: string;
      amount: number;
      percentage: number;
      invoiceCount: number;
    }>;
    overdueAmount: number;
    currentAmount: number;
  } {
    const buckets = ['current', '1-30', '31-60', '61-90', 'over-90'].map((bucket) => {
      const bucketInvoices = receivables.invoices.filter((inv) => inv.agingBucket === bucket);
      const amount = bucketInvoices.reduce((sum, inv) => sum + inv.amountOutstanding, 0);
      const percentage = receivables.totalReceivables > 0 ? (amount / receivables.totalReceivables) * 100 : 0;

      return {
        bucket,
        amount,
        percentage,
        invoiceCount: bucketInvoices.length,
      };
    });

    const overdueAmount = buckets
      .filter((b) => b.bucket !== 'current')
      .reduce((sum, b) => sum + b.amount, 0);
    const currentAmount = buckets.find((b) => b.bucket === 'current')?.amount || 0;

    return {
      buckets,
      overdueAmount,
      currentAmount,
    };
  }

  private static forecastBadDebt(
    aging: { buckets: Array<{ bucket: string; amount: number }> } | undefined,
    historical: AccountsReceivableAgingInput['historicalData']
  ): {
    estimatedBadDebt: number;
    badDebtPercentage: number;
    byBucket: Array<{ bucket: string; estimatedBadDebt: number }>;
  } {
    if (!aging) {
      return {
        estimatedBadDebt: 0,
        badDebtPercentage: 0,
        byBucket: [],
      };
    }

    // Bad debt probabilities by aging bucket
    const badDebtRates: Record<string, number> = {
      'current': 0.01,
      '1-30': 0.05,
      '31-60': 0.15,
      '61-90': 0.30,
      'over-90': 0.50,
    };

    const byBucket = aging.buckets.map((bucket) => ({
      bucket: bucket.bucket,
      estimatedBadDebt: bucket.amount * (badDebtRates[bucket.bucket] || historical.badDebtPercentage),
    }));

    const estimatedBadDebt = byBucket.reduce((sum, b) => sum + b.estimatedBadDebt, 0);
    const badDebtPercentage = (estimatedBadDebt / historical.annualCreditSales) * 100;

    return {
      estimatedBadDebt,
      badDebtPercentage,
      byBucket,
    };
  }

  private static generateCollectionRecommendations(
    aging: { buckets: Array<{ bucket: string; amount: number }> } | undefined,
    _policy: AccountsReceivableAgingInput['creditPolicy']
  ): {
    recommendations: Array<{ bucket: string; action: string; priority: number }>;
  } {
    if (!aging) {
      return { recommendations: [] };
    }

    const recommendations: Array<{ bucket: string; action: string; priority: number }> = [];

    aging.buckets.forEach((bucket) => {
      if (bucket.bucket === 'over-90' && bucket.amount > 0) {
        recommendations.push({
          bucket: bucket.bucket,
          action: 'Immediate collection action required - consider collection agency',
          priority: 1,
        });
      } else if (bucket.bucket === '61-90' && bucket.amount > 0) {
        recommendations.push({
          bucket: bucket.bucket,
          action: 'Send final notice and consider payment plan',
          priority: 2,
        });
      } else if (bucket.bucket === '31-60' && bucket.amount > 0) {
        recommendations.push({
          bucket: bucket.bucket,
          action: 'Follow up with customer - send reminder',
          priority: 3,
        });
      }
    });

    return {
      recommendations: recommendations.sort((a, b) => a.priority - b.priority),
    };
  }

  private static optimizeCreditPolicy(
    _policy: AccountsReceivableAgingInput['creditPolicy'],
    historical: AccountsReceivableAgingInput['historicalData'],
    receivables: AccountsReceivableAgingInput['receivables']
  ): {
    recommendedTerms: number;
    recommendedCreditLimit: number;
    expectedDSO: number;
  } {
    // Optimize payment terms based on industry and DSO
    const recommendedTerms = historical.averageCollectionPeriod > 45 ? 30 : _policy.paymentTerms;
    const recommendedCreditLimit = _policy.creditLimit > 0 ? _policy.creditLimit : receivables.totalReceivables * 1.5;
    const expectedDSO = recommendedTerms;

    return {
      recommendedTerms,
      recommendedCreditLimit,
      expectedDSO,
    };
  }

  private static generateRecommendations(
    dso: { dso: number; interpretation: string } | undefined,
    aging: { overdueAmount: number } | undefined,
    badDebt: { estimatedBadDebt: number } | undefined,
    collection: { recommendations: Array<{ action: string }> } | undefined
  ): string[] {
    const recommendations: string[] = [];

    if (dso) {
      recommendations.push(`Days Sales Outstanding: ${dso.dso.toFixed(0)} days`);
      recommendations.push(dso.interpretation);
    }

    if (aging && aging.overdueAmount > 0) {
      recommendations.push(`Overdue receivables: $${aging.overdueAmount.toFixed(0)}`);
    }

    if (badDebt) {
      recommendations.push(`Estimated bad debt: $${badDebt.estimatedBadDebt.toFixed(0)}`);
    }

    if (collection) {
      collection.recommendations.forEach((rec) => {
        recommendations.push(rec.action);
      });
    }

    return recommendations;
  }
}



