import type { EnhancedLeaseAnalysisResult } from '@financial-analysis/analysis';
import { LeaseAnalysisDashboard } from '@financial-analysis/ui';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { persistLeaseAnalysisResult } from './persist-lease-analysis-result';

export type LeaseDashboardHostOptions = {
  containerId: string;
  hideAnalyzeButton?: boolean;
  hideScenarioCard?: boolean;
  hideAnalysisHistory?: boolean;
  onAnalyze?: (result: EnhancedLeaseAnalysisResult) => void;
};

export function mountLeaseAnalysisDashboard({
  containerId,
  hideAnalyzeButton,
  hideScenarioCard,
  hideAnalysisHistory,
  onAnalyze,
}: LeaseDashboardHostOptions): void {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  const root = createRoot(container);
  root.render(
    createElement(LeaseAnalysisDashboard, {
      hideAnalyzeButton,
      hideScenarioCard,
      hideAnalysisHistory,
      onAnalyze: (result) => {
        persistLeaseAnalysisResult(result);
        onAnalyze?.(result);
      },
    })
  );
}
