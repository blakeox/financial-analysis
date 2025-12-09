import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { LeaseAnalysisDashboard } from '@financial-analysis/ui';

const container = document.getElementById('enhanced-lease-container');

if (container) {
  const root = createRoot(container);
  root.render(
    createElement(LeaseAnalysisDashboard, {
      onAnalyze: (result: unknown) => {
        console.log('Enhanced lease analysis result:', result);
      },
    })
  );
}

export {};
