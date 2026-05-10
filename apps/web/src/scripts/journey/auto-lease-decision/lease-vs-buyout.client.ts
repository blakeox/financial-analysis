export {};

const STORAGE_KEY = 'fanalyx-journey-state-auto-lease-decision';

type PersistedSection = Record<string, string>;
type JourneyState = {
  collectedData?: Record<string, PersistedSection>;
};

type ComparisonResults = {
  leaseCost: number;
  buyoutPayment: number;
  buyoutTotal: number;
  buyoutOutOfPocketToLeaseEnd: number;
  remainingBalanceAtLeaseEnd: number;
  equityNow: number;
  equityFuture: number;
  monthsRemaining: number;
  gapInsuranceCost: number;
  tradeInValue: number;
  privateSaleValue: number;
  instantOfferValue: number;
  bestExitOption: string;
  bestExitValue: number;
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

const normalizeSection = (value: unknown): PersistedSection | null => {
  if (!value || typeof value !== 'object') return null;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
      key,
      entryValue === undefined || entryValue === null ? '' : String(entryValue),
    ])
  );
};

const parseNumber = (value: FormDataEntryValue | string | number | null | undefined) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
};

const formatCurrency = (value: FormDataEntryValue | string | number | null | undefined) => {
  const num = parseNumber(value);
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
};

const formatPerMonth = (value: FormDataEntryValue | string | number | null | undefined) => {
  const num = parseNumber(value);
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
};

const calculatePayment = (principal: number, apr: number, months: number) => {
  const monthlyRate = apr / 100 / 12;
  if (!months || months <= 0) return 0;
  if (monthlyRate === 0) return principal / months;
  const pow = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * pow) / (pow - 1);
};

const calculateRemainingBalance = (
  principal: number,
  apr: number,
  termMonths: number,
  paymentsMade: number,
  paymentPerMonth: number
) => {
  if (!principal || principal <= 0) return 0;
  if (!termMonths || termMonths <= 0) return 0;
  const k = Math.max(0, Math.min(termMonths, paymentsMade || 0));
  if (k === 0) return principal;
  const r = apr > 0 ? apr / 100 / 12 : 0;
  if (r === 0) {
    return Math.max(0, principal - (paymentPerMonth || 0) * k);
  }
  const pow = Math.pow(1 + r, k);
  const balance = principal * pow - (paymentPerMonth || 0) * ((pow - 1) / r);
  return Number.isFinite(balance) ? Math.max(0, balance) : 0;
};

const renderResults = ({
  leaseCost,
  buyoutPayment,
  buyoutTotal,
  buyoutOutOfPocketToLeaseEnd,
  remainingBalanceAtLeaseEnd,
  equityNow,
  equityFuture,
  monthsRemaining,
  gapInsuranceCost,
  tradeInValue,
  privateSaleValue,
  instantOfferValue,
  bestExitOption,
  bestExitValue,
}: ComparisonResults) => {
  const leaseCostSummary = document.getElementById('leaseCostSummary');
  const buyoutSummary = document.getElementById('buyoutSummary');
  const equitySummary = document.getElementById('equitySummary');
  const recommendation = document.getElementById('recommendation');
  const resultsWrapper = document.getElementById('lease-buyout-results');

  if (!leaseCostSummary || !buyoutSummary || !equitySummary || !recommendation || !resultsWrapper) return;

  const totalBuyoutWithGap = buyoutTotal + gapInsuranceCost;
  leaseCostSummary.textContent = `${formatCurrency(leaseCost)} total (${monthsRemaining} months)`;
  const outOfPocketToLeaseEndText = monthsRemaining
    ? ` | ${formatCurrency(buyoutOutOfPocketToLeaseEnd)} paid through lease-end`
    : '';
  const remainingBalanceText = monthsRemaining
    ? ` | ${formatCurrency(remainingBalanceAtLeaseEnd)} balance at lease-end`
    : '';
  buyoutSummary.textContent = `${formatPerMonth(buyoutPayment)}/mo, ${formatCurrency(totalBuyoutWithGap)} total${gapInsuranceCost > 0 ? ` (incl. ${formatCurrency(gapInsuranceCost)} gap ins.)` : ''}${outOfPocketToLeaseEndText}${remainingBalanceText}`;

  const exitOptions = [];
  if (tradeInValue > 0) exitOptions.push(`trade-in: ${formatCurrency(tradeInValue)}`);
  if (privateSaleValue > 0) exitOptions.push(`private sale: ${formatCurrency(privateSaleValue)}`);
  if (instantOfferValue > 0) exitOptions.push(`instant offer: ${formatCurrency(instantOfferValue)}`);

  let exitInfo = '';
  if (exitOptions.length > 0) {
    exitInfo = ` | Exit values: ${exitOptions.join(', ')}`;
    if (bestExitValue > 0 && exitOptions.length > 1) {
      exitInfo += ` → Best: ${bestExitOption}`;
    }
  }
  equitySummary.textContent = `Equity now: ${formatCurrency(equityNow)} | At lease-end: ${formatCurrency(equityFuture)}${exitInfo}`;

  let leaning = '';
  if (equityNow > 0 && bestExitValue > equityNow) {
    leaning = `Strong buyout case: ${formatCurrency(equityNow)} equity now, and ${bestExitOption} offers ${formatCurrency(bestExitValue)}.`;
  } else if (equityNow > 0) {
    leaning = 'Buyout is compelling because you have positive equity now.';
  } else if (equityFuture > 0) {
    leaning = 'Running the lease to the end then buying keeps equity positive.';
  } else {
    leaning = 'Watch total cost and negative equity risk—shop other options in the next step.';
  }

  recommendation.textContent = leaning;
  resultsWrapper.classList.remove('hidden');
};

const persistLeaseBuyout = (form: HTMLFormElement, options?: { showStatus?: boolean }) => {
  const formData = new FormData(form);
  const details: PersistedSection = Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value ?? '')])
  );

  const journeyState = readJourneyState();
  if (!journeyState.collectedData || typeof journeyState.collectedData !== 'object') {
    journeyState.collectedData = {};
  }
  journeyState.collectedData['lease-vs-buyout'] = details;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journeyState));

  if (options?.showStatus) {
    const statusEl = document.getElementById('lease-buyout-status');
    if (statusEl) {
      statusEl.textContent = 'Saved ✓';
      statusEl.className = 'text-sm text-emerald-700 dark:text-emerald-300';
    }
  }
};

const scheduleAutosave = (() => {
  let timeoutId: number | null = null;
  return (form: HTMLFormElement) => {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      persistLeaseBuyout(form);
    }, 150);
  };
})();

const hydrateForm = () => {
  const collectedData = readJourneyState().collectedData ?? {};

  const leaseProfile = normalizeSection(collectedData['lease-profile']);
  if (leaseProfile) {
    const mappings: Record<string, string> = {
      monthsRemaining: 'monthsRemaining',
      residualValue: 'buyoutAmount',
      dispositionFee: 'dispositionFee',
      monthlyPayment: '_monthlyPayment',
    };

    const monthlyPayment = parseNumber(leaseProfile.monthlyPayment);
    const monthsRemaining = parseNumber(leaseProfile.monthsRemaining);
    if (monthlyPayment > 0 && monthsRemaining > 0) {
      const remainingInput = document.querySelector<HTMLInputElement>('[name="remainingPayments"]');
      if (remainingInput && !remainingInput.value) {
        remainingInput.value = String(monthlyPayment * monthsRemaining);
      }
    }

    Object.entries(mappings).forEach(([fromKey, toKey]) => {
      if (toKey.startsWith('_')) return;
      const value = leaseProfile[fromKey];
      if (value === undefined || value === null || value === '') return;
      const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[name="${toKey}"]`
      );
      if (input && !input.value) {
        input.value = String(value);
      }
    });
  }

  const details = normalizeSection(collectedData['lease-vs-buyout']);
  if (details) {
    Object.entries(details).forEach(([key, value]) => {
      const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[name="${key}"]`
      );
      if (input) {
        input.value = String(value ?? '');
      }
    });
  }

  const statusEl = document.getElementById('lease-buyout-status');
  if (statusEl) {
    statusEl.textContent = details ? 'Loaded from last session' : (leaseProfile ? 'Pre-filled from lease profile' : '');
  }
};

const runComparison = () => {
  const form = document.getElementById('lease-buyout-form');
  if (!(form instanceof HTMLFormElement)) return;
  const formData = new FormData(form);

  const monthsRemaining = parseNumber(formData.get('monthsRemaining'));
  const leaseCost =
    parseNumber(formData.get('remainingPayments')) +
    parseNumber(formData.get('dispositionFee')) +
    parseNumber(formData.get('mileagePenalty'));

  const buyoutBase = parseNumber(formData.get('buyoutAmount'));
  const buyoutTax = buyoutBase * (parseNumber(formData.get('salesTaxRate')) / 100);
  const buyoutPrincipal = buyoutBase + buyoutTax + parseNumber(formData.get('fees'));
  const loanTermMonths = parseNumber(formData.get('loanTermMonths'));
  const apr = parseNumber(formData.get('apr'));

  const payment = calculatePayment(buyoutPrincipal, apr, loanTermMonths);
  const buyoutTotal = payment * loanTermMonths;

  const horizonMonths = Math.max(0, Math.min(loanTermMonths || 0, monthsRemaining || 0));
  const remainingBalanceAtLeaseEnd = calculateRemainingBalance(
    buyoutPrincipal,
    apr,
    loanTermMonths,
    horizonMonths,
    payment
  );
  const buyoutOutOfPocketToLeaseEnd = payment * horizonMonths;

  const equityNow = parseNumber(formData.get('expectedValueNow')) - buyoutPrincipal;
  const equityFuture = parseNumber(formData.get('expectedValueFuture')) - remainingBalanceAtLeaseEnd;

  const gapInsuranceCost = parseNumber(formData.get('gapInsurance'));
  const tradeInValue = parseNumber(formData.get('tradeInValue'));
  const privateSaleValue = parseNumber(formData.get('privateSaleValue'));
  const instantOfferValue = parseNumber(formData.get('instantOfferValue'));

  const exitOptions = [
    { name: 'trade-in', value: tradeInValue },
    { name: 'private sale', value: privateSaleValue },
    { name: 'instant offer', value: instantOfferValue },
  ].filter((opt) => opt.value > 0);

  const bestExit = exitOptions.length > 0
    ? exitOptions.reduce((best, curr) => (curr.value > best.value ? curr : best))
    : { name: '', value: 0 };

  renderResults({
    leaseCost,
    buyoutPayment: payment,
    buyoutTotal,
    buyoutOutOfPocketToLeaseEnd,
    remainingBalanceAtLeaseEnd,
    equityNow,
    equityFuture,
    monthsRemaining,
    gapInsuranceCost,
    tradeInValue,
    privateSaleValue,
    instantOfferValue,
    bestExitOption: bestExit.name,
    bestExitValue: bestExit.value - buyoutPrincipal,
  });
};

const saveForm = (event: SubmitEvent) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  persistLeaseBuyout(form, { showStatus: true });

  runComparison();
};

document.getElementById('calculate-lease-buyout')?.addEventListener('click', runComparison);
const leaseBuyoutForm = document.getElementById('lease-buyout-form');
if (leaseBuyoutForm instanceof HTMLFormElement) {
  leaseBuyoutForm.addEventListener('submit', saveForm);
  leaseBuyoutForm.addEventListener('input', () => scheduleAutosave(leaseBuyoutForm));
  leaseBuyoutForm.addEventListener('change', () => scheduleAutosave(leaseBuyoutForm));
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof Node && leaseBuyoutForm.contains(target)) return;
    scheduleAutosave(leaseBuyoutForm);
  });
}
hydrateForm();
