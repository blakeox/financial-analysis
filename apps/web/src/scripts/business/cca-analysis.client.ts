/**
 * CCA Analysis Client Script
 * Handles comparable company analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class CCAnalysisCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('cca-analysis-form') as HTMLFormElement;
    if (!this.form) {
      console.error('CCA analysis form not found');
      return;
    }

    this.form.addEventListener('submit', this.handleSubmit.bind(this));

    // Add peer company button
    const addButton = document.getElementById('add-peer-company');
    if (addButton) {
      addButton.addEventListener('click', this.addPeerCompany.bind(this));
    }
  }

  private addPeerCompany(): void {
    const peersContainer = document.getElementById('peer-companies');
    if (!peersContainer) return;

    const newPeer = document.createElement('div');
    newPeer.className =
      'grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg';
    newPeer.innerHTML = `
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
        <input
          type="text"
          name="peerName"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="Peer Co."
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Market Cap ($M)</label>
        <input
          type="number"
          name="peerMarketCap"
          min="0"
          step="1"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="100"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">EV ($M)</label>
        <input
          type="number"
          name="peerEnterpriseValue"
          min="0"
          step="1"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="120"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Revenue ($M)</label>
        <input
          type="number"
          name="peerRevenue"
          min="0"
          step="1"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="50"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">EBITDA ($M)</label>
        <input
          type="number"
          name="peerEbitda"
          step="1"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="10"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Net Income ($M)</label>
        <input
          type="number"
          name="peerNetIncome"
          step="1"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="5"
        />
      </div>
    `;
    peersContainer.appendChild(newPeer);
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.form) return;

    try {
      showLoading();
      hideError();

      const formData = new FormData(this.form);
      const input = this.buildInput(formData);

      // Call API endpoint
      const response = await fetch('/api/analyze-cca-valuation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze CCA');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('CCA analysis error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze CCA');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    // Collect peer companies
    const peerCompanies: Array<Record<string, unknown>> = [];
    const peerNames = formData.getAll('peerName');
    const peerMarketCaps = formData.getAll('peerMarketCap');
    const peerEnterpriseValues = formData.getAll('peerEnterpriseValue');
    const peerRevenues = formData.getAll('peerRevenue');
    const peerEbitdas = formData.getAll('peerEbitda');
    const peerNetIncomes = formData.getAll('peerNetIncome');

    for (let i = 0; i < peerNames.length; i++) {
      if (peerNames[i] && peerMarketCaps[i]) {
        peerCompanies.push({
          name: peerNames[i],
          ticker: `PEER${i + 1}`,
          marketCap: parseFloat((peerMarketCaps[i] as string) || '0') * 1000000,
          enterpriseValue: parseFloat((peerEnterpriseValues[i] as string) || '0') * 1000000,
          revenue: parseFloat((peerRevenues[i] as string) || '0') * 1000000,
          ebitda: parseFloat((peerEbitdas[i] as string) || '0') * 1000000,
          netIncome: parseFloat((peerNetIncomes[i] as string) || '0') * 1000000,
          tradingPrice: 0,
        });
      }
    }

    // Collect multiples
    const multiples = formData.getAll('multiples') as string[];

    return {
      targetCompany: {
        name: formData.get('targetName') || '',
        industry: formData.get('targetIndustry') || '',
        marketCap: parseFloat((formData.get('targetMarketCap') as string) || '0'),
        enterpriseValue: parseFloat((formData.get('targetEnterpriseValue') as string) || '0'),
        revenue: parseFloat((formData.get('targetRevenue') as string) || '0'),
        ebitda: parseFloat((formData.get('targetEbitda') as string) || '0'),
        netIncome: parseFloat((formData.get('targetNetIncome') as string) || '0'),
      },
      peerCompanies:
        peerCompanies.length > 0
          ? peerCompanies
          : [
              {
                name: 'Sample Peer',
                ticker: 'PEER1',
                marketCap: 100000000,
                enterpriseValue: 120000000,
                revenue: 50000000,
                ebitda: 10000000,
                netIncome: 5000000,
                tradingPrice: 50,
              },
            ],
      analysisSettings: {
        multiplesToAnalyze: multiples.length > 0 ? multiples : ['ev-revenue', 'ev-ebitda', 'pe'],
        outlierThreshold: parseFloat((formData.get('outlierThreshold') as string) || '0.2'),
        includeOutliers: false,
      },
      goals: {
        analysisType: 'trading-multiples',
        includeValuationRange: true,
      },
    };
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('cca-results');
    const contentDiv = document.getElementById('cca-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">CCA Analysis Complete</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your comparable company analysis is complete. Use the AI assistant to get detailed recommendations and valuation insights.
          </p>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered CCA analysis and recommendations based on your specific situation.</p>
        </div>
      </div>
    `;

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CCAnalysisCalculator();
  });
} else {
  new CCAnalysisCalculator();
}
