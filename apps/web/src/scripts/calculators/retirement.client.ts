import { registerChatButton } from '../chat/chat-actions';
import { storeAnalysisResult } from '../analysis/analysis-results';
import { RetirementEngine } from '@financial-analysis/analysis';
import type { RetirementInput, RetirementResult } from '@financial-analysis/analysis';

type RetirementAccount = RetirementInput['accounts'][number];

type SubmitContext = {
  form: HTMLFormElement;
  accountsContainer: HTMLElement;
  loading: HTMLElement | null;
  error: HTMLElement | null;
  errorMessage: HTMLElement | null;
  results: HTMLElement | null;
};

export const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numeric = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
};

const ACCOUNT_TYPES: readonly RetirementAccount['accountType'][] = [
  '401k',
  'roth_401k',
  'traditional_ira',
  'roth_ira',
  'sep_ira',
];

const isValidAccountType = (value: string): value is RetirementAccount['accountType'] =>
  ACCOUNT_TYPES.includes(value as RetirementAccount['accountType']);

const buildAccountMarkup = (index: number): string => `
  <div class="account-item rounded-lg border border-slate-200 p-4 dark:border-slate-800">
    <div class="grid grid-cols-2 gap-3">
      <div class="col-span-2">
        <label for="account-type-${index}" class="fa-field-label mb-1 text-xs uppercase tracking-wide">Account Type</label>
        <select id="account-type-${index}" name="account-type-${index}" class="fa-input-surface w-full text-sm">
          <option value="401k">401(k)</option>
          <option value="roth_401k">Roth 401(k)</option>
          <option value="traditional_ira">Traditional IRA</option>
          <option value="roth_ira">Roth IRA</option>
          <option value="sep_ira">SEP IRA</option>
        </select>
      </div>
      <div>
        <label for="account-balance-${index}" class="fa-field-label mb-1 text-xs uppercase tracking-wide">Current Balance ($)</label>
        <input id="account-balance-${index}" type="number" name="account-balance-${index}" placeholder="Current balance" min="0" step="1000" class="fa-input-surface w-full text-sm" />
      </div>
      <div>
        <label for="account-contribution-${index}" class="fa-field-label mb-1 text-xs uppercase tracking-wide">Annual Contribution ($)</label>
        <input id="account-contribution-${index}" type="number" name="account-contribution-${index}" placeholder="Annual contribution" min="0" step="500" class="fa-input-surface w-full text-sm" />
      </div>
      <div>
        <label for="account-match-${index}" class="fa-field-label mb-1 text-xs uppercase tracking-wide">Employer Match (%)</label>
        <input id="account-match-${index}" type="number" name="account-match-${index}" placeholder="Employer match %" min="0" max="100" step="0.5" class="fa-input-surface w-full text-sm" />
      </div>
      <div>
        <label for="account-match-limit-${index}" class="fa-field-label mb-1 text-xs uppercase tracking-wide">Match Limit (%)</label>
        <input id="account-match-limit-${index}" type="number" name="account-match-limit-${index}" placeholder="Match limit %" min="0" max="100" step="0.5" class="fa-input-surface w-full text-sm" />
      </div>
    </div>
  </div>
`;

const appendAccountInputs = (container: HTMLElement, index: number): void => {
  container.insertAdjacentHTML('beforeend', buildAccountMarkup(index));
};

export const collectAccounts = (formData: FormData, count: number): RetirementAccount[] => {
  const accounts: RetirementAccount[] = [];

  for (let index = 0; index < count; index += 1) {
    const accountType = formData.get(`account-type-${index}`);
    const balance = parseNumber(formData.get(`account-balance-${index}`));
    const contribution = parseNumber(formData.get(`account-contribution-${index}`));
    const match = parseNumber(formData.get(`account-match-${index}`));
    const matchLimit = parseNumber(formData.get(`account-match-limit-${index}`));

    if (
      typeof accountType === 'string' &&
      accountType.trim().length > 0 &&
      !Number.isNaN(balance) &&
      !Number.isNaN(contribution)
    ) {
      const trimmedType = accountType.trim();
      if (!isValidAccountType(trimmedType)) continue;

      accounts.push({
        accountType: trimmedType,
        currentBalance: balance,
        annualContribution: contribution,
        employerMatch: Number.isNaN(match) ? 0 : match / 100,
        employerMatchLimit: Number.isNaN(matchLimit) ? 0.06 : matchLimit / 100,
      });
    }
  }

  return accounts;
};

export const formatAnnualIncome = (monthlyIncome: string | undefined): string | null => {
  if (!monthlyIncome) return null;
  const numericValue = parseFloat(monthlyIncome.replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(numericValue)) return monthlyIncome;

  const annualValue = numericValue * 12;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(annualValue);
};

export const describeIncomeReplacement = (result: RetirementResult): string | null => {
  const annualIncome = formatAnnualIncome(result.withdrawalAnalysis?.projectedMonthlyIncome);
  const replacementRatio = result.summary?.replacementRatio;

  if (!annualIncome && !replacementRatio) {
    return null;
  }

  const parts = ['<p class="fa-help-copy">Projected Annual Retirement Income:</p>'];

  if (annualIncome) {
    parts.push(`<p class="text-xl font-semibold text-emerald-600">${annualIncome}</p>`);
  }

  if (replacementRatio) {
    parts.push(`<p class="text-sm fa-meta-copy mt-2">${replacementRatio} of final salary</p>`);
  }

  return parts.join('');
};

export const displayResults = (result: RetirementResult, yearsToRetirement: number): void => {
  const yearsEl = document.getElementById('years-to-retirement');
  if (yearsEl) yearsEl.textContent = `${yearsToRetirement} years`;

  const totalSavings = document.getElementById('total-savings');
  if (totalSavings) {
    const value = result.summary?.projectedBalanceAtRetirement ?? 'N/A';
    totalSavings.textContent = String(value);
  }

  const totalContributions = document.getElementById('total-contributions');
  if (totalContributions) {
    const value = result.summary?.totalContributions ?? 'N/A';
    totalContributions.textContent = String(value);
  }

  const investmentGrowth = document.getElementById('investment-growth');
  if (investmentGrowth) {
    const value = result.summary?.totalGrowth ?? 'N/A';
    investmentGrowth.textContent = String(value);
  }

  const employerMatch = document.getElementById('employer-match');
  if (employerMatch) {
    const value = result.summary?.totalEmployerMatch ?? 'N/A';
    employerMatch.textContent = String(value);
  }

  const incomeReplacement = document.getElementById('income-replacement');
  if (incomeReplacement) {
    const markup = describeIncomeReplacement(result);
    incomeReplacement.innerHTML = markup ?? '';
  }

  document.getElementById('results')?.classList.remove('hidden');
};

const handleError = (message: string, context: SubmitContext): void => {
  if (context.errorMessage) context.errorMessage.textContent = message;
  context.error?.classList.remove('hidden');
};

const hideFeedbackStates = ({ loading, error, results }: SubmitContext): void => {
  loading?.classList.add('hidden');
  error?.classList.add('hidden');
  results?.classList.add('hidden');
};

const initRetirementPage = (): void => {
  registerChatButton('#retirement-chat-button', 'Retirement Calculator', {
    tool: 'analyze_retirement',
  });

  const form = document.getElementById('retirement-form');
  const addAccountBtn = document.getElementById('add-account-btn');
  const accountsContainer = document.getElementById('accounts-container');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const errorMessage = document.getElementById('error-message');
  const results = document.getElementById('results');

  if (!(form instanceof HTMLFormElement) || !(accountsContainer instanceof HTMLElement)) {
    return;
  }

  const context: SubmitContext = {
    form,
    accountsContainer,
    loading,
    error,
    errorMessage,
    results,
  };

  let accountCount = accountsContainer.querySelectorAll('.account-item').length || 0;

  addAccountBtn?.addEventListener('click', () => {
    appendAccountInputs(accountsContainer, accountCount);
    accountCount += 1;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    results?.classList.add('hidden');
    error?.classList.add('hidden');
    loading?.classList.remove('hidden');

    try {
      const formData = new FormData(form);
      const currentAge = parseInt(String(formData.get('currentAge') ?? ''), 10);
      const retirementAge = parseInt(String(formData.get('retirementAge') ?? ''), 10);
      const currentIncome = parseNumber(formData.get('currentIncome'));
      const expectedAnnualReturn = parseNumber(formData.get('expectedAnnualReturn')) / 100;
      const inflationRate = parseNumber(formData.get('inflationRate')) / 100;
      const incomeIncreaseRate = parseNumber(formData.get('incomeIncreaseRate')) / 100;

      if (!Number.isFinite(currentAge) || !Number.isFinite(retirementAge)) {
        throw new Error('Please provide valid ages');
      }

      const yearsToRetirement = retirementAge - currentAge;
      if (yearsToRetirement <= 0) {
        throw new Error('Retirement age must be greater than current age');
      }

      if (!Number.isFinite(currentIncome)) {
        throw new Error('Please provide a valid annual income');
      }

      const accounts = collectAccounts(formData, accountCount);
      if (accounts.length === 0) {
        throw new Error('Please add at least one retirement account');
      }

      if (
        Number.isNaN(expectedAnnualReturn) ||
        Number.isNaN(inflationRate) ||
        Number.isNaN(incomeIncreaseRate)
      ) {
        throw new Error('Please provide valid rate assumptions');
      }

      const input: RetirementInput = {
        currentAge,
        retirementAge,
        currentIncome,
        accounts,
        expectedAnnualReturn,
        inflationRate,
        incomeIncreaseRate,
        withdrawalStrategy: '4_percent_rule',
      };

      const result = RetirementEngine.analyze(input);
      storeAnalysisResult('analyze_retirement', result);
      displayResults(result, yearsToRetirement);
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : 'An error occurred';
      handleError(message, context);
    } finally {
      loading?.classList.add('hidden');
    }
  });

  document.getElementById('reset-btn')?.addEventListener('click', () => {
    form.reset();
    hideFeedbackStates(context);
  });
};

initRetirementPage();

export {};
