/**
 * Comprehensive Analysis System for Calculator Pages
 * 
 * This module handles the dynamic population and display of comprehensive
 * analysis data for calculator results, including tabs, insights, recommendations,
 * risk assessments, and optimization opportunities.
 */

import {
  generateInsights,
  generateRecommendations,
  generateRiskAssessment,
  generateOptimizationOpportunities,
} from './analysis-content-generators.client';
import type { AnalysisContentData, AnalysisSummaryData } from './analysis-content-generators.client';
import {
  formatCurrency,
  formatPercent as formatPercentDecimal,
  formatMonths,
} from '../utils/calculator-utilities';

type AnalysisTimelineEntry = {
  label: string;
  value?: string;
  description?: string;
};

type AnalysisChatContext = {
  summary?: string;
  highlights?: string[];
  [key: string]: unknown;
};

interface ComprehensiveAnalysisData extends AnalysisContentData {
  chatHighlights?: string[];
  chatSummary?: string;
  timeline?: AnalysisTimelineEntry[];
  chatContext?: AnalysisChatContext;
  rawResult?: unknown;
}

type AnalysisResultEventDetail = {
  result?: ComprehensiveAnalysisData;
};

type AnalysisElements = {
  tabs: NodeListOf<HTMLElement>;
  tabContents: NodeListOf<HTMLElement>;
  emptyState: HTMLElement | null;
  dataContainer: HTMLElement | null;
  mobileSelector: HTMLSelectElement | null;
};

// Initialize a placeholder function immediately to ensure it exists
if (typeof window !== 'undefined') {
  window.populateAnalysisData =
    window.populateAnalysisData ||
    ((_data: AnalysisContentData) => {
      console.warn('populateAnalysisData placeholder called - real function not yet loaded');
    });
}

/**
 * Get fresh references to analysis UI elements
 */
function getAnalysisElements(): AnalysisElements {
  return {
    tabs: document.querySelectorAll<HTMLElement>('.analysis-tab'),
    tabContents: document.querySelectorAll<HTMLElement>('.analysis-tab-content'),
    emptyState: document.getElementById('analysis-empty-state'),
    dataContainer: document.getElementById('analysis-data'),
    mobileSelector: document.getElementById('mobile-tab-selector') as HTMLSelectElement | null,
  };
}

/**
 * Initialize comprehensive analysis system
 */
export function initComprehensiveAnalysis() {
  if (typeof document === 'undefined') return;

  const elements = getAnalysisElements();
  let analysisTabs = elements.tabs;
  let analysisTabContents = elements.tabContents;
  let mobileTabSelector = elements.mobileSelector;

  // Initialize: Hide all tab contents initially
  analysisTabContents.forEach((content) => {
    if (content) content.classList.add('hidden');
  });

  // Refresh element references to catch dynamic changes
  function refreshElementReferences() {
    const fresh = getAnalysisElements();
    analysisTabs = fresh.tabs;
    analysisTabContents = fresh.tabContents;
    mobileTabSelector = fresh.mobileSelector;
  }

  /**
   * Switch between analysis tabs
   */
  function switchTab(targetTab: string) {
    refreshElementReferences();

    console.log(`switchTab called with: ${targetTab}`);
    console.log(`Found ${analysisTabs.length} tabs, ${analysisTabContents.length} tab contents`);

    // Update active tab styling
    analysisTabs.forEach((t) => {
      t.classList.remove('active', 'bg-blue-500', 'text-white');
      t.classList.add('text-gray-600', 'dark:text-gray-400');
    });

    // Find and activate the correct tab
    const activeTab = document.querySelector(`[data-tab="${targetTab}"]`);
    if (activeTab) {
      activeTab.classList.add('active', 'bg-blue-500', 'text-white');
      activeTab.classList.remove('text-gray-600', 'dark:text-gray-400');
      console.log(`Activated tab: ${targetTab}`);
    } else {
      console.warn(`Tab with data-tab="${targetTab}" not found`);
    }

    // Show corresponding content - use fresh querySelector for reliability
    const targetContent = document.getElementById(`${targetTab}-content`);
    analysisTabContents.forEach((content) => {
      if (content) {
        content.classList.add('hidden');
        if (content.id === `${targetTab}-content`) {
          content.classList.remove('hidden');
          console.log(`Shown content: ${content.id}`);
        }
      }
    });

    // Double-check: if targetContent exists but wasn't shown, show it manually
    if (targetContent && targetContent.classList.contains('hidden')) {
      targetContent.classList.remove('hidden');
      console.log(`Manually shown ${targetContent.id}`);
    }
  }

  // Desktop tab switching functionality
  analysisTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      if (targetTab) switchTab(targetTab);
    });
  });

  // Mobile dropdown functionality
  if (mobileTabSelector) {
    mobileTabSelector.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      switchTab(target.value);
    });
  }

  return { switchTab, refreshElementReferences };
}

/**
 * Populate analysis data into the UI
 */
export function populateAnalysisData(rawData: ComprehensiveAnalysisData) {
  console.log('=== populateAnalysisData CALLED ===');
  console.log('Raw data received:', rawData);
  console.log('Data type:', typeof rawData);
  console.log('Is object?', rawData && typeof rawData === 'object');

  if (!rawData || typeof rawData !== 'object') {
    console.error('populateAnalysisData: Invalid data provided', rawData);
    return;
  }

  console.log('Data validation passed, proceeding...');

  const summary: AnalysisSummaryData =
    rawData.summary && typeof rawData.summary === 'object'
      ? rawData.summary
      : {
          principal: rawData.principal ?? 0,
          monthlyPayment: rawData.monthlyPayment ?? 0,
          totalInterest: rawData.totalInterest ?? 0,
          totalPayments: rawData.totalPayments ?? 0,
          annualRate: rawData.annualRate ?? 0,
          termMonths: rawData.termMonths ?? 0,
        };

  // Use shared utilities for formatting (imported above)

  // Show the comprehensive analysis container
  const analysisContainer = document.getElementById('comprehensive-analysis-container');
  if (analysisContainer) {
    console.log('Showing comprehensive analysis container');
    analysisContainer.classList.remove('hidden');
  } else {
    console.error('comprehensive-analysis-container not found in DOM');
  }

  // Hide empty state and show data
  const emptyStateEl = document.getElementById('analysis-empty-state');
  const dataEl = document.getElementById('analysis-data');

  if (emptyStateEl) {
    emptyStateEl.classList.add('hidden');
    console.log('Empty state hidden');
  } else {
    console.error('analysis-empty-state element not found in DOM');
  }

  if (dataEl) {
    dataEl.classList.remove('hidden');
    console.log('Analysis data container shown');
  } else {
    console.error('analysis-data element not found in DOM');
  }

  // Populate summary
  const monthlyPaymentEl = document.getElementById('summary-monthly-payment');
  const totalInterestEl = document.getElementById('summary-total-interest');
  const totalPaymentsEl = document.getElementById('summary-total-payments');
  const interestRateEl = document.getElementById('summary-interest-rate');
  const loanTermEl = document.getElementById('summary-loan-term');
  const takeawaysWrapper = document.getElementById('summary-takeaways');
  const takeawaysList = document.getElementById('analysis-key-takeaways');

  if (monthlyPaymentEl) monthlyPaymentEl.textContent = formatCurrency(summary.monthlyPayment);
  if (totalInterestEl) totalInterestEl.textContent = formatCurrency(summary.totalInterest);
  if (totalPaymentsEl) totalPaymentsEl.textContent = formatCurrency(summary.totalPayments);
  if (interestRateEl) interestRateEl.textContent = formatPercentDecimal(summary.annualRate ?? rawData.annualRate);
  if (loanTermEl) loanTermEl.textContent = formatMonths(summary.termMonths ?? rawData.termMonths);

  if (takeawaysWrapper && takeawaysList) {
    if (Array.isArray(rawData.chatHighlights) && rawData.chatHighlights.length) {
      takeawaysWrapper.classList.remove('hidden');
      takeawaysList.innerHTML = '';
      const fragment = document.createDocumentFragment();
      rawData.chatHighlights.forEach((highlight: string) => {
        const li = document.createElement('li');
        li.textContent = highlight;
        fragment.appendChild(li);
      });
      takeawaysList.appendChild(fragment);
    } else {
      takeawaysWrapper.classList.add('hidden');
      takeawaysList.innerHTML = '';
    }
  }

  // Debug: Log what data we have
  console.log('populateAnalysisData: Data structure check:', {
    hasInsights: Array.isArray(rawData.insights),
    insightsCount: rawData.insights?.length ?? 0,
    hasRecommendations: Array.isArray(rawData.recommendations),
    recommendationsCount: rawData.recommendations?.length ?? 0,
    hasRiskAssessment: !!rawData.riskAssessment,
    hasOptimizationOpportunities: Array.isArray(rawData.optimizationOpportunities),
  });

  // Generate insights, recommendations, risk assessment, and optimization opportunities
  try {
    generateInsights(rawData, summary);
    generateRecommendations(rawData, summary);
    generateRiskAssessment(rawData, summary);
    generateOptimizationOpportunities(rawData, summary);
  } catch (error) {
    console.error('Error generating analysis content:', error);
  }

  // Store data for LLM access
  if (typeof window !== 'undefined') {
    window.amortizationAnalysisData = rawData;
    console.log('Analysis data stored for LLM access:', rawData);
  }

  // Switch to Summary tab
  const { switchTab, refreshElementReferences } = initComprehensiveAnalysis();
  refreshElementReferences();

  console.log('About to call switchTab("summary")...');
  try {
    switchTab('summary');
    console.log('switchTab("summary") called successfully');
  } catch (error) {
    console.error('Error calling switchTab:', error);
    // Fallback: manually show summary content
    const summaryContent = document.getElementById('summary-content');
    if (summaryContent) {
      summaryContent.classList.remove('hidden');
      console.log('Fallback: Manually showing summary-content');
    }
  }

  // Update mobile selector
  refreshElementReferences();
  const mobileSelector = document.getElementById('mobile-tab-selector') as HTMLSelectElement | null;
  if (mobileSelector) {
    mobileSelector.value = 'summary';
    console.log('Mobile selector updated to summary');
  } else {
    console.warn('Mobile tab selector not found');
  }

  // Final verification: ensure summary content is visible
  setTimeout(() => {
    const summaryContent = document.getElementById('summary-content');
    const dataContainer = document.getElementById('analysis-data');
    if (dataContainer && dataContainer.classList.contains('hidden')) {
      console.warn('analysis-data container is still hidden, showing it now');
      dataContainer.classList.remove('hidden');
    }
    if (summaryContent && summaryContent.classList.contains('hidden')) {
      console.warn('summary-content is still hidden, showing it now');
      summaryContent.classList.remove('hidden');
    }
  }, 100);

  console.log('=== populateAnalysisData COMPLETE ===');
}

// Expose functions to window
if (typeof window !== 'undefined') {
  window.populateAnalysisData = populateAnalysisData;
  window.initComprehensiveAnalysis = initComprehensiveAnalysis;
  console.log('Comprehensive analysis functions exposed to window');

  // Dispatch ready event
  window.populateAnalysisDataReady = true;
  window.dispatchEvent(new CustomEvent('populateAnalysisData-ready'));

  // Check if data already exists (e.g., from previous calculation)
  const storedAnalysis = window.amortizationAnalysisData;
  if (storedAnalysis) {
    console.log('Found existing amortization analysis data on page load');
    setTimeout(() => {
      populateAnalysisData(storedAnalysis);
    }, 100);
  }

  // Listen for analysis events as a fallback
  const handleAnalysisResultUpdated = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    const detail = event.detail as AnalysisResultEventDetail;
    console.log('Received analysis-result-updated event:', detail);
    if (detail?.result) {
      populateAnalysisData(detail.result);
    }
  };

  const handleAmortizationReady = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    const detail = event.detail as ComprehensiveAnalysisData;
    console.log('Received amortization-analysis-ready event:', detail);
    if (detail) {
      populateAnalysisData(detail);
    }
  };

  document.addEventListener('analysis-result-updated', handleAnalysisResultUpdated);
  window.addEventListener('amortization-analysis-ready', handleAmortizationReady);
}

declare global {
  interface Window {
    populateAnalysisData?: (data: ComprehensiveAnalysisData) => void;
    initComprehensiveAnalysis?: typeof initComprehensiveAnalysis;
    populateAnalysisDataReady?: boolean;
    amortizationAnalysisData?: ComprehensiveAnalysisData;
  }
}

