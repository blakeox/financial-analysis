import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { LeaseAnalysisDashboard } from '@financial-analysis/ui';

const container = document.getElementById('commercial-real-estate-lease-container');

if (container) {
  const root = createRoot(container);
  root.render(
    createElement(LeaseAnalysisDashboard, {
      onAnalyze: (result: unknown) => {
        console.log('Commercial real estate lease analysis result:', result);
      },
      hideAnalyzeButton: true,
      hideScenarioCard: true,
      hideAnalysisHistory: true,
    })
  );
}

export {};
