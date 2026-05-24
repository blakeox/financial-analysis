/**
 * M&A Analysis Client Script
 * Handles M&A deal analysis and form interactions
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import {
  CURRENCY_WHOLE_FORMATTER,
  DOM_IDS,
  formatCurrencyWhole,
  formatPercentDecimal,
  hideError,
  hideLoading,
  hideResults,
  setupResetButton,
  showError,
  showLoading,
  showResults,
} from '../../utils/calculator-utilities';

type ImpactLevel = 'low' | 'medium' | 'high';

type MAResult = {
  transactionSummary?: {
    purchasePrice?: number;
    premium?: number;
    enterpriseValue?: number;
    dealSize?: string;
  };
  valuation?: {
    valueCreation?: number;
    valueCreationPercent?: number;
  };
  synergyAnalysis?: {
    totalSynergies?: {
      presentValue?: number;
    };
  };
  accretionDilution?: {
    summary?: {
      year1Accretion?: number;
      year3Accretion?: number;
      averageAccretion?: number;
    };
  };
  insights?: string[];
  warnings?: string[];
  recommendations?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function getFieldValue(form: HTMLFormElement, fieldName: string): string {
  const element = form.elements.namedItem(fieldName);
  if (!element) return '';

  if (element instanceof RadioNodeList) {
    return (element.value || '').toString();
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.value || '';
  }

  return '';
}

function parseNumberField(form: HTMLFormElement, fieldName: string, fallback = 0): number {
  const raw = getFieldValue(form, fieldName);
  if (!raw) return fallback;
  const sanitized = raw
    .replace(/[$,%\s]/g, '')
    .replace(/,/g, '')
    .trim();
  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumberField(form: HTMLFormElement, fieldName: string): number | undefined {
  const raw = getFieldValue(form, fieldName);
  if (!raw) return undefined;
  const sanitized = raw
    .replace(/[$,%\s]/g, '')
    .replace(/,/g, '')
    .trim();
  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSynergyCategories(
  raw: string
): Array<{ name: string; amount: number; timing: number }> {
  const text = raw.trim();
  if (!text) return [];

  const entries = text
    .split(/[;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const categories: Array<{ name: string; amount: number; timing: number }> = [];

  for (const entry of entries) {
    // Format: Name:Amount@TimingYears
    const [namePart, rest] = entry.split(':');
    if (!namePart || !rest) continue;
    const name = namePart.trim();
    if (!name) continue;

    const [amountPart, timingPart] = rest.split('@');
    const amount = Number.parseFloat((amountPart || '').replace(/[$,%\s]/g, '').replace(/,/g, ''));
    const timing = Number.parseInt((timingPart || '').trim(), 10);

    if (!Number.isFinite(amount) || amount < 0) continue;
    if (!Number.isFinite(timing) || timing < 1) continue;

    categories.push({ name, amount, timing });
  }

  return categories;
}

function parseIntegrationRisks(raw: string): Array<{
  category: string;
  description: string;
  probability: number;
  impact: ImpactLevel;
  mitigation: string;
}> {
  const text = raw.trim();
  if (!text) return [];

  const lines = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const risks: Array<{
    category: string;
    description: string;
    probability: number;
    impact: ImpactLevel;
    mitigation: string;
  }> = [];

  for (const line of lines) {
    // Format: Category|Description|Probability(0-1)|Impact(low/medium/high)|Mitigation
    const [category, description, probabilityRaw, impactRaw, mitigation] = line
      .split('|')
      .map((s) => (s ?? '').trim());

    if (!category || !description) continue;
    const probabilityParsed = Number.parseFloat((probabilityRaw || '').replace(/,/g, ''));
    const probability = Number.isFinite(probabilityParsed)
      ? clampNumber(probabilityParsed, 0, 1)
      : 0.5;

    const normalizedImpact = (impactRaw || 'medium').toLowerCase();
    const impact: ImpactLevel =
      normalizedImpact === 'low' || normalizedImpact === 'high' || normalizedImpact === 'medium'
        ? (normalizedImpact as ImpactLevel)
        : 'medium';

    risks.push({
      category,
      description,
      probability,
      impact,
      mitigation: mitigation || '',
    });
  }

  return risks;
}

function buildMAInput(form: HTMLFormElement): Record<string, unknown> {
  const today = new Date();
  const announcementDate = getFieldValue(form, 'announcementDate') || formatDateYYYYMMDD(today);
  const expectedClosingDate =
    getFieldValue(form, 'expectedClosingDate') || formatDateYYYYMMDD(addDays(today, 90));

  const transactionType = (getFieldValue(form, 'transactionType') || 'acquisition') as
    | 'merger'
    | 'acquisition'
    | 'divestiture'
    | 'spin-off'
    | 'joint-venture';

  const transactionStructure = (getFieldValue(form, 'transactionStructure') || 'mixed') as
    | 'cash'
    | 'stock'
    | 'mixed'
    | 'asset-purchase'
    | 'stock-purchase';

  const transactionStatus = (getFieldValue(form, 'transactionStatus') || 'announced') as
    | 'announced'
    | 'pending'
    | 'completed'
    | 'terminated';

  const acquirerSharesOutstanding = parseNumberField(form, 'acquirerSharesOutstanding', 0);
  const acquirerCurrentPrice = parseNumberField(form, 'acquirerCurrentPrice', 0);
  const acquirerTotalDebt = parseNumberField(form, 'acquirerTotalDebt', 0);
  const acquirerCashAndEquivalents = parseNumberField(form, 'acquirerCashAndEquivalents', 0);
  const acquirerMarketCap = acquirerSharesOutstanding * acquirerCurrentPrice;
  const acquirerEnterpriseValue =
    acquirerMarketCap + acquirerTotalDebt - acquirerCashAndEquivalents;

  const targetSharesOutstanding = parseNumberField(form, 'targetSharesOutstanding', 0);
  const targetCurrentPrice = parseNumberField(form, 'targetCurrentPrice', 0);
  const targetTotalDebt = parseNumberField(form, 'targetTotalDebt', 0);
  const targetCashAndEquivalents = parseNumberField(form, 'targetCashAndEquivalents', 0);
  const targetMarketCap = targetSharesOutstanding * targetCurrentPrice;
  const targetEnterpriseValue = targetMarketCap + targetTotalDebt - targetCashAndEquivalents;

  const purchasePrice = parseNumberField(form, 'purchasePrice', 0);
  const cashPercentage = clampNumber(parseNumberField(form, 'cashPercentage', 0), 0, 100);
  const cashConsideration = purchasePrice * (cashPercentage / 100);
  const stockConsideration = Math.max(0, purchasePrice - cashConsideration);

  const offerPerShare = targetSharesOutstanding > 0 ? purchasePrice / targetSharesOutstanding : 0;
  const derivedPremium =
    targetCurrentPrice > 0 ? offerPerShare / targetCurrentPrice - 1 : undefined;
  const premiumPercent = parseOptionalNumberField(form, 'premiumPercent');
  const premium = premiumPercent !== undefined ? premiumPercent / 100 : derivedPremium;

  const exchangeRatioRaw = parseOptionalNumberField(form, 'exchangeRatio');
  const exchangeRatio =
    exchangeRatioRaw !== undefined && exchangeRatioRaw > 0 ? exchangeRatioRaw : undefined;

  const financingNewDebt = parseNumberField(form, 'financingNewDebt', 0);
  const financingCashOnHand = parseNumberField(form, 'financingCashOnHand', 0);
  const financingEquityIssuance = parseNumberField(form, 'financingEquityIssuance', 0);
  const financingOtherSources = parseNumberField(form, 'financingOtherSources', 0);
  const totalFinancing =
    financingNewDebt + financingCashOnHand + financingEquityIssuance + financingOtherSources;

  const resolvedFinancing =
    totalFinancing > 0
      ? {
          newDebt: financingNewDebt,
          cashOnHand: financingCashOnHand,
          equityIssuance: financingEquityIssuance,
          otherSources: financingOtherSources,
        }
      : {
          newDebt: 0,
          cashOnHand: cashConsideration,
          equityIssuance: stockConsideration,
          otherSources: 0,
        };

  const annualCostSynergies = parseNumberField(form, 'annualCostSynergies', 0);
  const annualRevenueSynergies = parseNumberField(form, 'annualRevenueSynergies', 0);
  const annualTaxSynergies = parseNumberField(form, 'annualTaxSynergies', 0);

  const costSynergyRealizationPeriod = parseOptionalNumberField(
    form,
    'costSynergyRealizationPeriod'
  );
  const costSynergyProbability = parseOptionalNumberField(form, 'costSynergyProbability');
  const revenueSynergyRealizationPeriod = parseOptionalNumberField(
    form,
    'revenueSynergyRealizationPeriod'
  );
  const revenueSynergyProbability = parseOptionalNumberField(form, 'revenueSynergyProbability');
  const taxSynergyRealizationPeriod = parseOptionalNumberField(form, 'taxSynergyRealizationPeriod');
  const taxSynergyProbability = parseOptionalNumberField(form, 'taxSynergyProbability');

  const costSynergyCategories = parseSynergyCategories(
    getFieldValue(form, 'costSynergyCategories')
  );
  const revenueSynergyCategories = parseSynergyCategories(
    getFieldValue(form, 'revenueSynergyCategories')
  );

  const integrationTimeline = parseOptionalNumberField(form, 'integrationTimeline');
  const integrationOneTimeCosts = parseNumberField(form, 'integrationOneTimeCosts', 0);
  const integrationAnnualCosts = parseNumberField(form, 'integrationAnnualCosts', 0);
  const integrationCostDuration = parseOptionalNumberField(form, 'integrationCostDuration');
  const integrationRisks = parseIntegrationRisks(getFieldValue(form, 'integrationRisks'));

  const discountRatePercent = parseOptionalNumberField(form, 'discountRatePercent');
  const taxRatePercent = parseOptionalNumberField(form, 'taxRatePercent');
  const terminalGrowthRatePercent = parseOptionalNumberField(form, 'terminalGrowthRatePercent');
  const forecastPeriodYears = parseOptionalNumberField(form, 'forecastPeriodYears');

  return {
    transaction: {
      type: transactionType,
      structure: transactionStructure,
      announcementDate,
      expectedClosingDate,
      status: transactionStatus,
    },
    acquirer: {
      name: getFieldValue(form, 'acquirerName'),
      ticker: getFieldValue(form, 'acquirerTicker') || '',
      marketCap: Math.max(0, acquirerMarketCap),
      enterpriseValue: Math.max(0, acquirerEnterpriseValue),
      sharesOutstanding: Math.max(0, acquirerSharesOutstanding),
      currentPrice: Math.max(0, acquirerCurrentPrice),
      revenue: Math.max(0, parseNumberField(form, 'acquirerRevenue', 0)),
      ebitda: parseNumberField(form, 'acquirerEbitda', 0),
      netIncome: parseNumberField(form, 'acquirerNetIncome', 0),
      totalDebt: Math.max(0, acquirerTotalDebt),
      cashAndEquivalents: Math.max(0, acquirerCashAndEquivalents),
      beta: parseOptionalNumberField(form, 'acquirerBeta'),
      creditRating: getFieldValue(form, 'acquirerCreditRating') || undefined,
    },
    target: {
      name: getFieldValue(form, 'targetName'),
      ticker: getFieldValue(form, 'targetTicker') || undefined,
      marketCap: Math.max(0, targetMarketCap),
      enterpriseValue: Math.max(0, targetEnterpriseValue),
      sharesOutstanding: Math.max(0, targetSharesOutstanding),
      currentPrice: Math.max(0, targetCurrentPrice),
      revenue: Math.max(0, parseNumberField(form, 'targetRevenue', 0)),
      ebitda: parseNumberField(form, 'targetEbitda', 0),
      netIncome: parseNumberField(form, 'targetNetIncome', 0),
      totalDebt: Math.max(0, targetTotalDebt),
      cashAndEquivalents: Math.max(0, targetCashAndEquivalents),
      beta: parseOptionalNumberField(form, 'targetBeta'),
      creditRating: getFieldValue(form, 'targetCreditRating') || undefined,
    },
    transactionTerms: {
      purchasePrice: Math.max(0, purchasePrice),
      cashConsideration: Math.max(0, cashConsideration),
      stockConsideration: Math.max(0, stockConsideration),
      exchangeRatio,
      premium,
      financing: resolvedFinancing,
    },
    synergies: {
      costSynergies: {
        annualAmount: Math.max(0, annualCostSynergies),
        realizationPeriod: costSynergyRealizationPeriod,
        probability: costSynergyProbability,
        categories: costSynergyCategories,
      },
      revenueSynergies: {
        annualAmount: Math.max(0, annualRevenueSynergies),
        realizationPeriod: revenueSynergyRealizationPeriod,
        probability: revenueSynergyProbability,
        categories: revenueSynergyCategories,
      },
      taxSynergies: {
        annualAmount: Math.max(0, annualTaxSynergies),
        realizationPeriod: taxSynergyRealizationPeriod,
        probability: taxSynergyProbability,
      },
    },
    integration: {
      timeline: integrationTimeline,
      costs: {
        oneTimeCosts: Math.max(0, integrationOneTimeCosts),
        annualCosts: Math.max(0, integrationAnnualCosts),
        duration: integrationCostDuration,
      },
      risks: integrationRisks,
    },
    analysis: {
      discountRate: discountRatePercent !== undefined ? discountRatePercent / 100 : undefined,
      taxRate: taxRatePercent !== undefined ? taxRatePercent / 100 : undefined,
      terminalGrowthRate:
        terminalGrowthRatePercent !== undefined ? terminalGrowthRatePercent / 100 : undefined,
      includeAccretionDilution: true,
      includeSensitivity: true,
      includeScenarios: true,
      forecastPeriod: forecastPeriodYears,
    },
  };
}

function displayResults(result: unknown): void {
  const summaryCards = document.getElementById(DOM_IDS.SUMMARY_CARDS);
  const resultsContainer = document.getElementById(DOM_IDS.RESULTS_CONTAINER);
  const resultsSection = document.getElementById(DOM_IDS.RESULTS_SECTION);

  if (!summaryCards || !resultsContainer) return;

  const r = result as MAResult;

  const purchasePrice = r?.transactionSummary?.purchasePrice;
  const valueCreation = r?.valuation?.valueCreation;
  const valueCreationPercent = r?.valuation?.valueCreationPercent;
  const synergyPV = r?.synergyAnalysis?.totalSynergies?.presentValue;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Purchase Price',
      value: formatCurrencyWhole(purchasePrice),
      tone: 'violet',
    },
    {
      title: 'Value Creation',
      value: formatCurrencyWhole(valueCreation),
      meta: formatPercentDecimal(valueCreationPercent),
      tone: 'emerald',
    },
    {
      title: 'Synergy PV',
      value: formatCurrencyWhole(synergyPV),
      tone: 'violet',
    },
  ]);

  const accretionSummary = r?.accretionDilution?.summary;
  const premium = r?.transactionSummary?.premium;
  const enterpriseValue = r?.transactionSummary?.enterpriseValue;

  const insights: unknown = r?.insights;
  const warnings: unknown = r?.warnings;
  const recommendations: unknown = r?.recommendations;

  const renderStringList = (items: unknown): string => {
    if (!Array.isArray(items)) return '';
    const safe = items.filter((x) => typeof x === 'string') as string[];
    if (safe.length === 0) return '';
    return `<ul class="list-disc pl-5 space-y-1">${safe.map((s) => `<li>${s}</li>`).join('')}</ul>`;
  };

  const premiumText =
    typeof premium === 'number' && Number.isFinite(premium) ? formatPercentDecimal(premium) : 'N/A';

  const evText =
    typeof enterpriseValue === 'number' && Number.isFinite(enterpriseValue)
      ? CURRENCY_WHOLE_FORMATTER.format(enterpriseValue)
      : 'N/A';

  const accretionBlock =
    accretionSummary &&
    typeof accretionSummary.year1Accretion === 'number' &&
    typeof accretionSummary.averageAccretion === 'number'
      ? `
        <div class="mt-4">
          <h3 class="text-lg font-semibold mb-2">Accretion / Dilution (Summary)</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <div class="fa-script-copy-muted font-medium">Year 1</div>
              <div class="text-xl font-bold text-slate-900 dark:text-white">${formatPercentDecimal(
                accretionSummary.year1Accretion
              )}</div>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <div class="fa-script-copy-muted font-medium">Year 3</div>
              <div class="text-xl font-bold text-slate-900 dark:text-white">${formatPercentDecimal(
                accretionSummary.year3Accretion
              )}</div>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <div class="fa-script-copy-muted font-medium">Average</div>
              <div class="text-xl font-bold text-slate-900 dark:text-white">${formatPercentDecimal(
                accretionSummary.averageAccretion
              )}</div>
            </div>
          </div>
        </div>
      `
      : '';

  const insightsBlock = renderStringList(insights);
  const warningsBlock = renderStringList(warnings);
  const recommendationsBlock = renderStringList(recommendations);

  resultsContainer.innerHTML = `
    <div class="space-y-6">
      <div>
        <h3 class="text-lg font-semibold mb-2">Deal Overview</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div class="fa-script-copy-muted font-medium">Deal Size</div>
            <div class="text-xl font-bold text-slate-900 dark:text-white">${(r?.transactionSummary?.dealSize || 'N/A').toString()}</div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div class="fa-script-copy-muted font-medium">Premium</div>
            <div class="text-xl font-bold text-slate-900 dark:text-white">${premiumText}</div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div class="fa-script-copy-muted font-medium">Enterprise Value</div>
            <div class="text-xl font-bold text-slate-900 dark:text-white">${evText}</div>
          </div>
        </div>
      </div>

      ${accretionBlock}

      ${warningsBlock ? `<div><h3 class="text-lg font-semibold mb-2">Warnings</h3>${warningsBlock}</div>` : ''}
      ${insightsBlock ? `<div><h3 class="text-lg font-semibold mb-2">Insights</h3>${insightsBlock}</div>` : ''}
      ${recommendationsBlock ? `<div><h3 class="text-lg font-semibold mb-2">Recommendations</h3>${recommendationsBlock}</div>` : ''}
    </div>
  `;

  showResults();
  resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function analyzeMADeal(input: unknown): Promise<unknown> {
  const response = await fetch('/api/analyze-ma-deal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = `Failed to analyze M&A deal (${response.status})`;
    try {
      const payload = (await response.json()) as unknown;
      if (isRecord(payload) && typeof payload.message === 'string') {
        message = payload.message;
      }
    } catch {
      // ignore non-JSON
    }
    throw new Error(message);
  }

  return response.json();
}

function initializeMAAnalysisCalculator(): void {
  const form = document.getElementById(DOM_IDS.FORM);
  const calculateBtn = document.getElementById(DOM_IDS.CALCULATE_BUTTON);

  if (!(form instanceof HTMLFormElement)) {
    console.warn('[ma-analysis] Calculator form not found');
    return;
  }

  const button = calculateBtn instanceof HTMLButtonElement ? calculateBtn : null;
  const originalButtonLabel = button?.innerHTML;

  setupResetButton(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError();

    try {
      showLoading();
      hideResults();

      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
      }

      const input = buildMAInput(form);
      const result = await analyzeMADeal(input);

      displayResults(result);
      storeAnalysisResult('analyze_ma', result);

      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: { calculatorId: 'ma-analysis', result, formData: input },
        })
      );
    } catch (error) {
      console.error('M&A analysis error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze M&A deal');
    } finally {
      hideLoading();
      if (button) {
        button.disabled = false;
        button.setAttribute('aria-busy', 'false');
        if (originalButtonLabel !== undefined) {
          button.innerHTML = originalButtonLabel;
        }
      }
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMAAnalysisCalculator);
  } else {
    initializeMAAnalysisCalculator();
  }
}
