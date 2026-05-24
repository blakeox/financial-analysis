/**
 * CCA Analysis Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import {
  formatCurrency,
  hideError,
  hideLoading,
  showError,
  showLoading,
} from '../../utils/calculator-utilities';

function parseMillions(value: FormDataEntryValue | null): number {
  const parsed = Number.parseFloat(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed * 1_000_000 : 0;
}

function buildPeer(
  name: FormDataEntryValue | null,
  ticker: string,
  industry: string,
  marketCapM: FormDataEntryValue | null,
  evM: FormDataEntryValue | null,
  revM: FormDataEntryValue | null,
  ebitdaM: FormDataEntryValue | null,
  niM: FormDataEntryValue | null,
  price = 50
) {
  const revenue = parseMillions(revM);
  const ebitda = parseMillions(ebitdaM);
  return {
    name: String(name),
    ticker,
    industry,
    country: 'US',
    marketCap: parseMillions(marketCapM),
    enterpriseValue: parseMillions(evM) || parseMillions(marketCapM) * 1.2,
    revenue,
    ebitda,
    ebit: ebitda * 0.85,
    netIncome: parseMillions(niM),
    totalDebt: parseMillions(evM) * 0.3,
    cashAndEquivalents: parseMillions(marketCapM) * 0.1,
    sharesOutstanding: Math.max(1, parseMillions(marketCapM) / price),
    bookValue: parseMillions(marketCapM) * 0.5,
    freeCashFlow: ebitda * 0.6,
    capex: revenue * 0.05,
    depreciation: revenue * 0.03,
    currentPrice: price,
    beta: 1,
  };
}

function buildInput(formData: FormData): Record<string, unknown> {
  const industry =
    (formData.get('targetIndustry') as string) ||
    (formData.get('industry') as string) ||
    'Technology';
  const targetName = (formData.get('targetName') as string) || 'Target Co';

  const peerCompanies: Array<Record<string, unknown>> = [];
  const peerNames = formData.getAll('peerName');
  const peerMarketCaps = formData.getAll('peerMarketCap');
  const peerEnterpriseValues = formData.getAll('peerEnterpriseValue');
  const peerRevenues = formData.getAll('peerRevenue');
  const peerEbitdas = formData.getAll('peerEbitda');
  const peerNetIncomes = formData.getAll('peerNetIncome');

  for (let i = 0; i < peerNames.length; i++) {
    if (peerNames[i] && peerMarketCaps[i]) {
      peerCompanies.push(
        buildPeer(
          peerNames[i],
          `PEER${i + 1}`,
          industry,
          peerMarketCaps[i],
          peerEnterpriseValues[i],
          peerRevenues[i],
          peerEbitdas[i],
          peerNetIncomes[i]
        )
      );
    }
  }

  if (peerCompanies.length === 0) {
    peerCompanies.push(
      buildPeer('Peer A', 'PEER1', industry, '100', '120', '50', '10', '5'),
      buildPeer('Peer B', 'PEER2', industry, '80', '95', '40', '8', '4')
    );
  }

  const revenue = parseMillions(formData.get('targetRevenue')) || 25_000_000;
  const ebitda = parseMillions(formData.get('targetEbitda')) || revenue * 0.2;
  const marketCap = parseMillions(formData.get('targetMarketCap')) || revenue * 3;

  return {
    targetCompany: {
      name: targetName,
      industry,
      size: 'medium',
      country: 'US',
      currency: 'USD',
    },
    targetFinancials: {
      marketCap,
      enterpriseValue: parseMillions(formData.get('targetEnterpriseValue')) || marketCap * 1.15,
      revenue,
      ebitda,
      ebit: ebitda * 0.85,
      netIncome: parseMillions(formData.get('targetNetIncome')) || ebitda * 0.6,
      totalDebt: marketCap * 0.25,
      cashAndEquivalents: marketCap * 0.08,
      sharesOutstanding: Math.max(1, marketCap / 50),
      bookValue: marketCap * 0.45,
      freeCashFlow: ebitda * 0.55,
      capex: revenue * 0.04,
      depreciation: revenue * 0.03,
    },
    peerGroupCriteria: {
      industry: [industry],
      sizeRange: { minRevenue: revenue * 0.5, maxRevenue: revenue * 2 },
      geography: ['US'],
    },
    peerCompanies,
    analysis: {
      multiplesToCalculate: ['ev-revenue', 'ev-ebitda', 'pe'],
      excludeOutliers: true,
      outlierThreshold: 2,
    },
    valuation: {
      applyPremiumsDiscounts: true,
      controlPremium: 0.2,
      liquidityDiscount: 0.15,
      sizeDiscount: 0.05,
    },
  };
}

function displayResults(result: unknown): void {
  const resultsDiv = document.getElementById('cca-results');
  const contentDiv = document.getElementById('cca-results-content');
  if (!resultsDiv || !contentDiv) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const valuation =
    record.valuation && typeof record.valuation === 'object'
      ? (record.valuation as Record<string, unknown>)
      : {};
  const equity =
    valuation.equityValue && typeof valuation.equityValue === 'object'
      ? (valuation.equityValue as Record<string, unknown>)
      : {};
  const perShare =
    valuation.valuePerShare && typeof valuation.valuePerShare === 'object'
      ? (valuation.valuePerShare as Record<string, unknown>)
      : {};

  contentDiv.innerHTML = renderMetricCards([
    {
      title: 'Equity Value (median)',
      value: formatCurrency(Number(equity.median) || 0),
      tone: 'violet',
    },
    {
      title: 'Value / Share',
      value: formatCurrency(Number(perShare.median) || 0),
      tone: 'emerald',
    },
    {
      title: 'Upside / Downside',
      value: `${(Number(valuation.upsideDownside) || 0).toFixed(1)}%`,
      tone: Number(valuation.upsideDownside) >= 0 ? 'emerald' : 'orange',
    },
    {
      title: 'Peers',
      value: String(
        record.peerGroup &&
          typeof record.peerGroup === 'object' &&
          Array.isArray((record.peerGroup as Record<string, unknown>).companies)
          ? (record.peerGroup as { companies: unknown[] }).companies.length
          : '—'
      ),
      meta: 'in comp set',
      tone: 'amber',
    },
  ]);

  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initCcaAnalysisCalculator(): void {
  const form = document.getElementById('cca-analysis-form') as HTMLFormElement | null;
  if (!form) return;

  const addButton = document.getElementById('add-peer-company');
  addButton?.addEventListener('click', () => {
    const peersContainer = document.getElementById('peer-companies');
    if (!peersContainer) return;
    const newPeer = document.createElement('div');
    newPeer.className =
      'grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60/50 rounded-lg';
    newPeer.innerHTML = `
      <div><label class="fa-field-label mb-2">Name</label><input type="text" name="peerName" class="fa-input-surface w-full" /></div>
      <div><label class="fa-field-label mb-2">Market Cap ($M)</label><input type="number" name="peerMarketCap" min="0" class="fa-input-surface w-full" /></div>
      <div><label class="fa-field-label mb-2">EV ($M)</label><input type="number" name="peerEnterpriseValue" min="0" class="fa-input-surface w-full" /></div>
      <div><label class="fa-field-label mb-2">Revenue ($M)</label><input type="number" name="peerRevenue" min="0" class="fa-input-surface w-full" /></div>
      <div><label class="fa-field-label mb-2">EBITDA ($M)</label><input type="number" name="peerEbitda" class="fa-input-surface w-full" /></div>
      <div><label class="fa-field-label mb-2">Net Income ($M)</label><input type="number" name="peerNetIncome" class="fa-input-surface w-full" /></div>
    `;
    peersContainer.appendChild(newPeer);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const response = await fetch('/api/analyze-cca-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput(new FormData(form))),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to analyze CCA');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_cca_valuation', result);
    } catch (error) {
      console.error('CCA analysis error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze CCA');
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCcaAnalysisCalculator);
} else {
  initCcaAnalysisCalculator();
}
