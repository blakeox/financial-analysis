import type { EnhancedLeaseAnalysisResult } from '@financial-analysis/analysis';
import { storeAnalysisResult } from '../analysis/analysis-results';

/** Maps enhanced lease output to fields the lease impact-summary engine expects. */
export function toLeaseAnalysisStorePayload(
  result: EnhancedLeaseAnalysisResult
): Record<string, unknown> {
  const residual =
    result.purchaseOption?.residualValue ?? result.purchaseOption?.fairMarketValueEstimate ?? 0;
  const principal =
    result.leaseVsBuy?.buyOption?.purchasePrice ??
    result.insights.totalCommitment ??
    result.metrics.presentValue ??
    0;

  return {
    ...result,
    principal,
    annualRate: result.metrics.effectiveAnnualRate,
    termMonths: result.termMonths,
    residualValue: residual,
    monthlyPayment: result.metrics.averageMonthlyPayment,
    totalCost: result.metrics.totalCost,
  };
}

export function persistLeaseAnalysisResult(result: EnhancedLeaseAnalysisResult): void {
  storeAnalysisResult('analyze_lease', toLeaseAnalysisStorePayload(result));
}
