/**
 * Simplified M&A Analysis Calculator Client Script
 *
 * This is a simplified version that works with the generic IndividualCalculatorPage.astro structure
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import { registerChatButton } from '../chat/chat-actions';
import {
  formatCurrencyWhole as formatCurrency,
  formatPercentSimple as formatPercent,
} from '../../utils/calculator-utilities';

interface MAInputs {
  acquirerRevenue: number;
  acquirerEBITDA: number;
  acquirerShares: number;
  acquirerSharePrice: number;
  targetRevenue: number;
  targetEBITDA: number;
  targetShares: number;
  targetSharePrice: number;
  offerPrice: number;
  cashPercentage: number;
  revenueSynergies: number;
  costSynergies: number;
}

interface MAResults {
  transactionValue: number;
  enterpriseValue: number;
  premium: number;
  premiumPercentage: number;
  epsAccretion: number;
  epsAccretionPercentage: number;
  totalSynergies: number;
  combinedRevenue: number;
  combinedEBITDA: number;
  leverageRatio: number;
}

class SimpleMACalculator {
  calculate(inputs: MAInputs): MAResults {
    const {
      acquirerRevenue,
      acquirerEBITDA,
      acquirerShares,
      acquirerSharePrice,
      targetRevenue,
      targetEBITDA,
      targetShares,
      targetSharePrice,
      offerPrice,
      cashPercentage,
      revenueSynergies,
      costSynergies,
    } = inputs;

    // Calculate transaction metrics
    const transactionValue = offerPrice * targetShares;
    const enterpriseValue = transactionValue; // Simplified - assuming no debt/cash adjustments
    const premium = offerPrice - targetSharePrice;
    const premiumPercentage = (premium / targetSharePrice) * 100;

    // Calculate accretion/dilution
    const acquirerEPS = (acquirerEBITDA * 0.7) / acquirerShares; // Assume 30% tax rate

    const cashRequired = transactionValue * (cashPercentage / 100);
    const sharesIssued = (transactionValue - cashRequired) / acquirerSharePrice;
    const newShares = acquirerShares + sharesIssued;

    const combinedEBITDA = acquirerEBITDA + targetEBITDA + costSynergies;
    const newEPS = (combinedEBITDA * 0.7) / newShares;
    const epsAccretion = newEPS - acquirerEPS;
    const epsAccretionPercentage = (epsAccretion / acquirerEPS) * 100;

    // Calculate synergies and combined metrics
    const totalSynergies = revenueSynergies + costSynergies;
    const combinedRevenue = acquirerRevenue + targetRevenue + revenueSynergies;
    const leverageRatio = 2.5; // Simplified - assume 2.5x leverage

    return {
      transactionValue,
      enterpriseValue,
      premium,
      premiumPercentage,
      epsAccretion,
      epsAccretionPercentage,
      totalSynergies,
      combinedRevenue,
      combinedEBITDA,
      leverageRatio,
    };
  }
}

const displayResults = (result: MAResults): void => {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for M&A results');
    return;
  }

  const accretionClass =
    result.epsAccretionPercentage >= 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-rose-600 dark:text-rose-400';
  const accretionIcon = result.epsAccretionPercentage >= 0 ? '↗' : '↘';

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Transaction Value',
      value: formatCurrency(result.transactionValue),
      tone: 'violet',
    },
    {
      title: 'Premium',
      value: formatPercent(result.premiumPercentage),
      tone: 'emerald',
    },
    {
      title: 'EPS Accretion',
      value: `${accretionIcon} ${formatPercent(result.epsAccretionPercentage)}`,
      tone: result.epsAccretionPercentage >= 0 ? 'emerald' : 'amber',
    },
    {
      title: 'Total Synergies',
      value: formatCurrency(result.totalSynergies),
      tone: 'orange',
    },
  ]);

  // Render detailed breakdown
  resultsContainer.innerHTML = `
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-6">Transaction Analysis</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label">Transaction Value</span>
            <p class="fa-script-copy-subtle">Total consideration paid</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(result.transactionValue)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label">Enterprise Value</span>
            <p class="fa-script-copy-subtle">Total business value</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(result.enterpriseValue)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label">Premium Paid</span>
            <p class="fa-script-copy-subtle">Above current market price</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${formatPercent(result.premiumPercentage)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label">EPS Impact</span>
            <p class="fa-script-copy-subtle">Earnings per share change</p>
          </div>
          <div class="text-right">
            <span class="font-semibold ${accretionClass}">${accretionIcon} ${formatPercent(result.epsAccretionPercentage)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-6">Synergy Analysis</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label">Total Synergies</span>
            <p class="fa-script-copy-subtle">Revenue + Cost synergies</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(result.totalSynergies)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label">Combined Revenue</span>
            <p class="fa-script-copy-subtle">Post-merger revenue</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(result.combinedRevenue)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label">Combined EBITDA</span>
            <p class="fa-script-copy-subtle">Post-merger EBITDA</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(result.combinedEBITDA)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label">Leverage Ratio</span>
            <p class="fa-script-copy-subtle">Debt to EBITDA ratio</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${result.leverageRatio.toFixed(1)}x</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-6">Key Insights</h3>
      
      <div class="space-y-4">
        <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-violet-900 dark:text-violet-100 mb-2">Transaction Assessment</h4>
          <p class="text-violet-800 dark:text-violet-200">The ${formatPercent(result.premiumPercentage)} premium suggests ${result.premiumPercentage > 20 ? 'aggressive' : 'reasonable'} pricing for the target company.</p>
        </div>
        
        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">EPS Impact</h4>
          <p class="text-emerald-800 dark:text-emerald-200">The transaction is ${result.epsAccretionPercentage >= 0 ? 'accretive' : 'dilutive'} to earnings, with a ${formatPercent(Math.abs(result.epsAccretionPercentage))} impact on EPS.</p>
        </div>
        
        <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-violet-900 dark:text-violet-100 mb-2">Synergy Value</h4>
          <p class="text-violet-800 dark:text-violet-200">Total synergies of ${formatCurrency(result.totalSynergies)} represent ${formatPercent((result.totalSynergies / result.transactionValue) * 100)} of the transaction value.</p>
        </div>
      </div>
    </div>
  `;
};

const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

const initMAPage = (): void => {
  registerChatButton('#ma-chat-button', 'M&A Analysis Calculator', { tool: 'analyze_ma' });

  const form = document.getElementById('calculator-form');

  if (!(form instanceof HTMLFormElement)) {
    console.error('M&A form not found');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Show loading state
    const calculateBtn = document.querySelector<HTMLButtonElement>('#calculate-btn');
    if (calculateBtn) {
      calculateBtn.disabled = true;
      calculateBtn.textContent = 'Calculating...';
    }

    // Hide previous results
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');
    const summaryCards = document.getElementById('summary-cards');
    resultsSection?.classList.add('hidden');
    resultsContainer?.classList.add('hidden');
    summaryCards?.classList.add('hidden');

    try {
      const formData = new FormData(form);

      // Parse form data
      const acquirerRevenue = parseNumber(formData.get('acquirerRevenue'));
      const acquirerEBITDA = parseNumber(formData.get('acquirerEBITDA'));
      const acquirerShares = parseNumber(formData.get('acquirerShares'));
      const acquirerSharePrice = parseNumber(formData.get('acquirerSharePrice'));
      const targetRevenue = parseNumber(formData.get('targetRevenue'));
      const targetEBITDA = parseNumber(formData.get('targetEBITDA'));
      const targetShares = parseNumber(formData.get('targetShares'));
      const targetSharePrice = parseNumber(formData.get('targetSharePrice'));
      const offerPrice = parseNumber(formData.get('offerPrice'));
      const cashPercentage = parseNumber(formData.get('cashPercentage'));
      const revenueSynergies = parseNumber(formData.get('revenueSynergies'));
      const costSynergies = parseNumber(formData.get('costSynergies'));

      // Validate required fields
      if (Number.isNaN(acquirerRevenue) || acquirerRevenue <= 0) {
        throw new Error('Please enter a valid acquirer revenue');
      }
      if (Number.isNaN(acquirerEBITDA) || acquirerEBITDA <= 0) {
        throw new Error('Please enter a valid acquirer EBITDA');
      }
      if (Number.isNaN(acquirerShares) || acquirerShares <= 0) {
        throw new Error('Please enter a valid acquirer shares outstanding');
      }
      if (Number.isNaN(acquirerSharePrice) || acquirerSharePrice <= 0) {
        throw new Error('Please enter a valid acquirer share price');
      }
      if (Number.isNaN(targetRevenue) || targetRevenue <= 0) {
        throw new Error('Please enter a valid target revenue');
      }
      if (Number.isNaN(targetEBITDA) || targetEBITDA <= 0) {
        throw new Error('Please enter a valid target EBITDA');
      }
      if (Number.isNaN(targetShares) || targetShares <= 0) {
        throw new Error('Please enter a valid target shares outstanding');
      }
      if (Number.isNaN(targetSharePrice) || targetSharePrice <= 0) {
        throw new Error('Please enter a valid target share price');
      }
      if (Number.isNaN(offerPrice) || offerPrice <= 0) {
        throw new Error('Please enter a valid offer price');
      }
      if (Number.isNaN(cashPercentage) || cashPercentage < 0 || cashPercentage > 100) {
        throw new Error('Please enter a valid cash percentage (0-100%)');
      }

      const inputs: MAInputs = {
        acquirerRevenue,
        acquirerEBITDA,
        acquirerShares,
        acquirerSharePrice,
        targetRevenue,
        targetEBITDA,
        targetShares,
        targetSharePrice,
        offerPrice,
        cashPercentage,
        revenueSynergies: Number.isNaN(revenueSynergies) ? 0 : revenueSynergies,
        costSynergies: Number.isNaN(costSynergies) ? 0 : costSynergies,
      };

      const calculator = new SimpleMACalculator();
      const result = calculator.calculate(inputs);

      // Store result for chatbot integration
      storeAnalysisResult('analyze_ma', result);

      // Display results
      displayResults(result);

      // Show results
      resultsSection?.classList.remove('hidden');
      resultsContainer?.classList.remove('hidden');
      summaryCards?.classList.remove('hidden');

      // Dispatch calculator completion event for journey integration
      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: {
            calculatorId: 'ma-analysis',
            result: result,
            formData: inputs,
          },
        })
      );
    } catch (error) {
      console.error('M&A calculation error:', error);
      alert(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      // Reset button state
      if (calculateBtn) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate';
      }
    }
  });

  // Add reset handler
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      const resultsSection = document.getElementById('results-section');
      const resultsContainer = document.getElementById('results-container');
      const summaryCards = document.getElementById('summary-cards');
      resultsSection?.classList.add('hidden');
      resultsContainer?.classList.add('hidden');
      summaryCards?.classList.add('hidden');
    });
  }
};

initMAPage();
