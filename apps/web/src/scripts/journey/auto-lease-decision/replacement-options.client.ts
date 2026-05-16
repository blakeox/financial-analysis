export {};

const STORAGE_KEY = 'fanalyx-journey-state-auto-lease-decision';

type PersistedSection = Record<string, string>;
type JourneyState = {
  collectedData?: Record<string, PersistedSection>;
};

const labelMap = {
  lease: 'New lease',
  finance: 'Finance a new car',
  cash: 'Buy with cash',
};

type ComparisonOption = {
  total: number;
  costPerMile: number;
  totalIncentives: number;
  npvTotal: number;
  gapInsuranceCost: number;
};

type ReplacementResults = {
  lease: ComparisonOption;
  finance: ComparisonOption;
  cash: ComparisonOption | null;
};

type OptionInputs = {
  monthly: number;
  upfront: number;
  insurance: number;
  maintenance: number;
  fuel: number;
  fees?: number;
  resale?: number;
  horizonMonths: number;
  annualMiles: number;
  subtractResale?: boolean;
  incentives?: number;
  gapInsurance?: number;
  discountRate?: number;
};

const readJourneyState = (): JourneyState => {
  const rawState = localStorage.getItem(STORAGE_KEY);
  if (!rawState) return {};

  try {
    const parsed: unknown = JSON.parse(rawState);
    return parsed && typeof parsed === 'object' ? (parsed as JourneyState) : {};
  } catch {
    return {};
  }
};

const debounce = <TArgs extends unknown[]>(fn: (...args: TArgs) => void, waitMs: number) => {
  let timeoutId: number | null = null;
  return (...args: TArgs) => {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), waitMs);
  };
};

const parseNumber = (value: FormDataEntryValue | string | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? Number(value) : Number(value.valueOf?.() ?? value);
  return Number.isFinite(num) ? num : 0;
};

const formatCurrency = (value: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      })
    : '$0';

const formatPerMile = (value: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 3,
      })
    : '$0';

const computeOption = (inputs: OptionInputs): ComparisonOption => {
  const {
    monthly,
    upfront,
    insurance,
    maintenance,
    fuel,
    fees = 0,
    resale = 0,
    horizonMonths,
    annualMiles,
    subtractResale = false,
    incentives = 0,
    gapInsurance = 0,
    discountRate = 0,
  } = inputs;

  const horizon = horizonMonths || 36;
  const miles = annualMiles || 12000;
  const base =
    monthly * horizon +
    upfront +
    insurance * horizon +
    maintenance * horizon +
    fuel * horizon +
    fees +
    gapInsurance;
  const afterIncentives = base - incentives;
  const total = subtractResale ? afterIncentives - resale : afterIncentives;

  let npvTotal = upfront + fees + gapInsurance - incentives;
  const monthlyRate = discountRate > 0 ? discountRate / 100 / 12 : 0;
  const monthlyCost = monthly + insurance + maintenance + fuel;

  if (monthlyRate > 0) {
    const pvFactor = (1 - Math.pow(1 + monthlyRate, -horizon)) / monthlyRate;
    npvTotal += monthlyCost * pvFactor;
    if (subtractResale && resale > 0) {
      npvTotal -= resale / Math.pow(1 + monthlyRate, horizon);
    }
  } else {
    npvTotal = total;
  }

  const milesDriven = (miles / 12) * horizon || 1;
  const costPerMile = total / milesDriven;

  return {
    total,
    costPerMile,
    totalIncentives: incentives,
    npvTotal,
    gapInsuranceCost: gapInsurance,
  };
};

const computeLoanPayment = (principal: number, aprPercent: number, termMonths: number) => {
  if (!Number.isFinite(principal) || principal <= 0) return 0;
  if (!Number.isFinite(termMonths) || termMonths <= 0) return 0;
  const r = Number.isFinite(aprPercent) && aprPercent > 0 ? aprPercent / 100 / 12 : 0;
  if (r === 0) return principal / termMonths;
  const pow = Math.pow(1 + r, -termMonths);
  return (principal * r) / (1 - pow);
};

const computeRemainingLoanBalance = (
  principal: number,
  aprPercent: number,
  termMonths: number,
  paymentsMade: number,
  paymentPerMonth: number
) => {
  if (!Number.isFinite(principal) || principal <= 0) return 0;
  if (!Number.isFinite(termMonths) || termMonths <= 0) return 0;
  const k = Math.max(0, Math.min(termMonths, Math.floor(paymentsMade || 0)));
  if (k === 0) return principal;
  const r = Number.isFinite(aprPercent) && aprPercent > 0 ? aprPercent / 100 / 12 : 0;
  if (r === 0) return Math.max(0, principal - paymentPerMonth * k);
  const pow = Math.pow(1 + r, k);
  const balance = principal * pow - paymentPerMonth * ((pow - 1) / r);
  return Number.isFinite(balance) ? Math.max(0, balance) : 0;
};

const getStringEntriesFromForm = (form: HTMLFormElement): PersistedSection => {
  const details: PersistedSection = {};
  const formData = new FormData(form);

  formData.forEach((value, key) => {
    details[key] = typeof value === 'string' ? value : value.name;
  });

  const cashNotOptionEl = document.getElementById('cashNotOption');
  if (cashNotOptionEl instanceof HTMLInputElement && cashNotOptionEl.type === 'checkbox') {
    details.cashNotOption = cashNotOptionEl.checked ? 'on' : '';
  }

  if (details.leaseUpfront && !details.leaseDownPayment)
    details.leaseDownPayment = details.leaseUpfront;
  if (details.financeUpfront && !details.financeDownPayment)
    details.financeDownPayment = details.financeUpfront;
  if (details.financeResale && !details.financeResaleValue)
    details.financeResaleValue = details.financeResale;

  return details;
};

const persistForm = (form: HTMLFormElement, opts?: { showStatus?: boolean }) => {
  const details = getStringEntriesFromForm(form);
  const journeyState = readJourneyState();
  journeyState.collectedData = journeyState.collectedData || {};
  journeyState.collectedData['replacement-options'] = details;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journeyState));

  if (opts?.showStatus) {
    const statusEl = document.getElementById('replacement-status');
    if (statusEl) {
      statusEl.textContent = 'Saved ✓';
      statusEl.className = 'text-sm text-emerald-700 dark:text-emerald-300';
    }
  }
};

const toggleCashFields = () => {
  const cashToggle = document.getElementById('cashNotOption');
  const disabled = cashToggle instanceof HTMLInputElement ? cashToggle.checked : false;
  document.querySelectorAll('.cash-input').forEach((el) => {
    if (el instanceof HTMLInputElement) {
      el.disabled = disabled;
    }
  });
};

const renderResults = (results: ReplacementResults, cashNotOption: boolean, showNpv = false) => {
  const leaseResult = document.getElementById('leaseResult');
  const financeResult = document.getElementById('financeResult');
  const cashResult = document.getElementById('cashResult');
  const recommendation = document.getElementById('optionsRecommendation');
  const wrapper = document.getElementById('replacement-results');
  if (!leaseResult || !financeResult || !cashResult || !recommendation || !wrapper) return;

  const leaseIncentiveInfo =
    results.lease.totalIncentives > 0
      ? ` (incl. ${formatCurrency(results.lease.totalIncentives)} incentives)`
      : '';
  const financeIncentiveInfo =
    results.finance.totalIncentives > 0
      ? ` (incl. ${formatCurrency(results.finance.totalIncentives)} incentives)`
      : '';

  if (showNpv) {
    leaseResult.textContent = `${formatCurrency(results.lease.total)} total, NPV: ${formatCurrency(results.lease.npvTotal)} (${formatPerMile(results.lease.costPerMile)}/mi)${leaseIncentiveInfo}`;
    financeResult.textContent = `${formatCurrency(results.finance.total)} total, NPV: ${formatCurrency(results.finance.npvTotal)} (${formatPerMile(results.finance.costPerMile)}/mi)${financeIncentiveInfo}`;
  } else {
    leaseResult.textContent = `${formatCurrency(results.lease.total)} total (${formatPerMile(results.lease.costPerMile)}/mile)${leaseIncentiveInfo}`;
    financeResult.textContent = `${formatCurrency(results.finance.total)} total (${formatPerMile(results.finance.costPerMile)}/mile)${financeIncentiveInfo}`;
  }

  if (cashNotOption || !results.cash) {
    cashResult.textContent = cashNotOption
      ? 'Skipped — marked not an option'
      : 'Enter purchase price to compare';
  } else {
    const cashIncentiveInfo =
      results.cash.totalIncentives > 0
        ? ` (incl. ${formatCurrency(results.cash.totalIncentives)} incentives)`
        : '';
    if (showNpv) {
      cashResult.textContent = `${formatCurrency(results.cash.total)} total, NPV: ${formatCurrency(results.cash.npvTotal)} (${formatPerMile(results.cash.costPerMile)}/mi)${cashIncentiveInfo}`;
    } else {
      cashResult.textContent = `${formatCurrency(results.cash.total)} total (${formatPerMile(results.cash.costPerMile)}/mile)${cashIncentiveInfo}`;
    }
  }

  const comparisons: Array<[keyof typeof labelMap, ComparisonOption]> = [
    ['lease', results.lease],
    ['finance', results.finance],
  ];
  if (!cashNotOption && results.cash) {
    comparisons.push(['cash', results.cash]);
  }

  const sortKey: keyof ComparisonOption = showNpv ? 'npvTotal' : 'total';
  const cheapest = comparisons.sort((a, b) => a[1][sortKey] - b[1][sortKey])[0];

  let recText = `${labelMap[cheapest[0]]} is currently the lowest ${showNpv ? 'NPV' : 'total'} cost.`;
  if (showNpv) {
    recText += ' NPV accounts for the time value of money.';
  }
  recText += cashNotOption
    ? ' Cash path skipped due to limited savings.'
    : ' Check maintenance/insurance swings that could change the ranking.';

  recommendation.textContent = recText;
  wrapper.classList.remove('hidden');
};

const hydrateForm = () => {
  const details = readJourneyState().collectedData?.['replacement-options'];
  if (!details) return;

  const normalized = { ...details };
  if (normalized.leaseUpfront && !normalized.leaseDownPayment)
    normalized.leaseDownPayment = normalized.leaseUpfront;
  if (normalized.financeUpfront && !normalized.financeDownPayment)
    normalized.financeDownPayment = normalized.financeUpfront;
  if (normalized.financeResale && !normalized.financeResaleValue)
    normalized.financeResaleValue = normalized.financeResale;

  Object.entries(normalized).forEach(([key, value]) => {
    const input = document.querySelector(`[name="${key}"]`);
    if (input instanceof HTMLInputElement && input.type === 'checkbox') {
      input.checked = value === 'on' || value === 'true';
    } else if (
      input instanceof HTMLInputElement ||
      input instanceof HTMLTextAreaElement ||
      input instanceof HTMLSelectElement
    ) {
      input.value = value;
    }
  });
  toggleCashFields();
  const statusEl = document.getElementById('replacement-status');
  if (statusEl) statusEl.textContent = 'Loaded from last session';
};

const runComparison = () => {
  const formEl = document.getElementById('replacement-form');
  if (!(formEl instanceof HTMLFormElement)) return;
  const formData = new FormData(formEl);
  const horizonMonths = parseNumber(formData.get('horizonMonths')) || 36;
  const annualMiles = parseNumber(formData.get('annualMiles')) || 12000;
  const cashNotOption = formData.get('cashNotOption') === 'on';

  const loyaltyBonus = parseNumber(formData.get('loyaltyBonus'));
  const conquestCash = parseNumber(formData.get('conquestCash'));
  const evFederalCredit = parseNumber(formData.get('evFederalCredit'));
  const evStateCredit = parseNumber(formData.get('evStateCredit'));
  const dealerRebate = parseNumber(formData.get('dealerRebate'));
  const collegeGradRebate = parseNumber(formData.get('collegeGradRebate'));

  const brandIncentive = Math.max(loyaltyBonus, conquestCash);
  const totalIncentives =
    brandIncentive + evFederalCredit + evStateCredit + dealerRebate + collegeGradRebate;
  const discountRate = parseNumber(formData.get('discountRate'));
  const newLeaseGapInsurance = parseNumber(formData.get('newLeaseGapInsurance'));
  const financeGapInsurance = parseNumber(formData.get('financeGapInsurance'));

  const lease = computeOption({
    monthly: parseNumber(formData.get('leaseMonthly')),
    upfront: parseNumber(formData.get('leaseDownPayment')),
    insurance: parseNumber(formData.get('leaseInsurance')),
    maintenance: parseNumber(formData.get('leaseMaintenance')),
    fuel: parseNumber(formData.get('leaseFuel')),
    fees: parseNumber(formData.get('leaseFees')),
    horizonMonths,
    annualMiles,
    subtractResale: false,
    incentives: brandIncentive + dealerRebate + collegeGradRebate,
    gapInsurance: newLeaseGapInsurance,
    discountRate,
  });

  const financePrice = parseNumber(formData.get('financePrice'));
  const financeDownPayment = parseNumber(formData.get('financeDownPayment'));
  const financeApr = parseNumber(formData.get('financeApr'));
  const financeTermMonths = parseNumber(formData.get('financeTermMonths'));
  const financeEffectivePrice = Math.max(0, financePrice - totalIncentives);
  const financePrincipal = Math.max(0, financeEffectivePrice - financeDownPayment);
  const financeMonthlyPayment = computeLoanPayment(financePrincipal, financeApr, financeTermMonths);

  const financeResaleValue = parseNumber(formData.get('financeResaleValue'));
  const financeRemainingBalanceAtHorizon = computeRemainingLoanBalance(
    financePrincipal,
    financeApr,
    financeTermMonths,
    horizonMonths,
    financeMonthlyPayment
  );
  const financeNetResaleAtHorizon = Math.max(
    0,
    financeResaleValue - financeRemainingBalanceAtHorizon
  );

  const finance = computeOption({
    monthly: financeMonthlyPayment,
    upfront: financeDownPayment,
    insurance: parseNumber(formData.get('financeInsurance')),
    maintenance: parseNumber(formData.get('financeMaintenance')),
    fuel: parseNumber(formData.get('financeFuel')),
    resale: financeNetResaleAtHorizon,
    horizonMonths,
    annualMiles,
    subtractResale: true,
    incentives: totalIncentives,
    gapInsurance: financeGapInsurance,
    discountRate,
  });

  const cashPurchase = cashNotOption
    ? null
    : computeOption({
        monthly: 0,
        upfront:
          (parseNumber(formData.get('cashPrice')) || 0) +
          (parseNumber(formData.get('cashTaxesFees')) || 0),
        insurance: parseNumber(formData.get('cashInsurance')),
        maintenance: parseNumber(formData.get('cashMaintenance')),
        fuel: parseNumber(formData.get('cashFuel')),
        resale: parseNumber(formData.get('cashResale')),
        horizonMonths,
        annualMiles,
        subtractResale: true,
        incentives: totalIncentives,
        gapInsurance: 0,
        discountRate,
      });

  renderResults({ lease, finance, cash: cashPurchase }, cashNotOption, discountRate > 0);
};

const calculateButton = document.getElementById('calculate-options');
if (calculateButton) {
  calculateButton.addEventListener('click', () => {
    const formEl = document.getElementById('replacement-form');
    if (formEl instanceof HTMLFormElement) {
      persistForm(formEl, { showStatus: true });
    }
    runComparison();
  });
}

const formEl = document.getElementById('replacement-form');
if (formEl instanceof HTMLFormElement) {
  const scheduleAutosave = debounce(() => persistForm(formEl), 150);
  formEl.addEventListener('input', scheduleAutosave);
  formEl.addEventListener('change', scheduleAutosave);
  formEl.addEventListener('submit', (event) => {
    event.preventDefault();
    persistForm(formEl, { showStatus: true });
    runComparison();
  });

  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (formEl.contains(target)) return;
    persistForm(formEl);
  });
}

const cashToggle = document.getElementById('cashNotOption');
if (cashToggle instanceof HTMLInputElement) {
  cashToggle.addEventListener('change', () => {
    toggleCashFields();
    runComparison();
  });
}
hydrateForm();
