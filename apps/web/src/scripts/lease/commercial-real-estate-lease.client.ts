import { mountLeaseAnalysisDashboard } from './lease-analysis-dashboard-host.client';

mountLeaseAnalysisDashboard({
  containerId: 'commercial-real-estate-lease-container',
  hideAnalyzeButton: true,
  hideScenarioCard: true,
  hideAnalysisHistory: true,
});

export {};
