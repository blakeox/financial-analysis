declare global {
  interface Window {
    handleSubscribe?: (tier: string) => Promise<void>;
  }
}

const API_BASE = 'https://fanalyx-api-production.blakeoxford.workers.dev' as const;

type PricingTier = {
  tier: string;
  name: string;
  monthlyPrice: number;
  monthlyQuota: number;
  rateLimitPerSec: number;
  overagePerRequest: number;
};

type PricingResponse = {
  success: boolean;
  pricing?: PricingTier[];
};

const getPricingContainer = () => document.getElementById('pricing-tiers');

const renderPricingCards = (pricing: PricingTier[]) => {
  const container = getPricingContainer();
  if (!container) return;

  const html = pricing
    .map((tier) => {
      const safeTier = tier.tier ?? 'unknown';
      const name = tier.name ?? safeTier;
      const monthlyPrice = Number.isFinite(tier.monthlyPrice) ? tier.monthlyPrice : 0;
      const price = monthlyPrice / 100;
      const monthlyQuota = Number.isFinite(tier.monthlyQuota) ? tier.monthlyQuota : 0;
      const rateLimitPerSec = Number.isFinite(tier.rateLimitPerSec) ? tier.rateLimitPerSec : 0;
      const overagePerRequest = Number.isFinite(tier.overagePerRequest) ? tier.overagePerRequest : 0;
      const isPopular = safeTier === 'pro';
      const supportLevel = safeTier === 'free' ? 'Community' : safeTier === 'pro' ? 'Email' : 'Priority';

      const badge = isPopular
        ? '<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"><span class="fa-chip fa-chip-accent">Most Popular</span></div>'
        : '';

      const buttonLabel = safeTier === 'free' ? 'Current Plan' : 'Subscribe Now';
      const disabledAttrs = safeTier === 'free' ? 'disabled' : '';
      const buttonClasses = [
        isPopular ? 'fa-button-primary' : 'fa-button-secondary',
        'mt-8 w-full justify-center',
        safeTier === 'free' ? 'opacity-50 cursor-not-allowed' : '',
      ]
        .filter(Boolean)
        .join(' ');

      const overageMarkup = overagePerRequest > 0
        ? `<p class="mt-4 text-center text-sm text-slate-500">Overage: $${overagePerRequest}/request</p>`
        : '';

      return `
        <div class="fa-card relative h-full ${isPopular ? 'ring-2 ring-violet-500 -translate-y-1' : ''}">
          ${badge}
          <div class="p-8">
            <h3 class="text-2xl font-bold capitalize text-slate-900">${name}</h3>
            <div class="mt-4 flex items-baseline">
              <span class="text-5xl font-extrabold text-slate-900">$${price}</span>
              ${price > 0 ? '<span class="ml-2 text-slate-500">/month</span>' : '<span class="ml-2 text-slate-500">Forever</span>'}
            </div>
            <ul class="mt-8 space-y-4">
              <li class="flex items-start">
                <svg class="mr-3 h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-slate-700">${monthlyQuota.toLocaleString()} requests/month</span>
              </li>
              <li class="flex items-start">
                <svg class="mr-3 h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-slate-700">${rateLimitPerSec} requests/second</span>
              </li>
              <li class="flex items-start">
                <svg class="mr-3 h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-slate-700">All analysis endpoints</span>
              </li>
              <li class="flex items-start">
                <svg class="mr-3 h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-slate-700">${supportLevel} support</span>
              </li>
              ${safeTier === 'enterprise'
                ? '<li class="flex items-start"><svg class="mr-3 h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg><span class="text-slate-700">99.9% SLA</span></li>'
                : ''}
            </ul>
            <button onclick="handleSubscribe('${safeTier}')" class="${buttonClasses}" ${disabledAttrs}>
              ${buttonLabel}
            </button>
            ${overageMarkup}
          </div>
        </div>
      `;
    })
    .join('');

  container.innerHTML = html;
};

const renderDefaultPricing = () => {
  const container = getPricingContainer();
  if (!container) return;
  container.innerHTML = `
    <div class="fa-card col-span-3 py-12 text-center">
      <p class="text-slate-600">Unable to load pricing. Please try again later.</p>
    </div>
  `;
};

const loadPricing = async () => {
  try {
    const response = await fetch(`${API_BASE}/v1/stripe/pricing`);
    if (!response.ok) {
      throw new Error(`Failed to load pricing: ${response.status}`);
    }

    const data = (await response.json()) as PricingResponse;
    if (data.success && Array.isArray(data.pricing)) {
      renderPricingCards(data.pricing);
    } else {
      renderDefaultPricing();
    }
  } catch (error) {
    console.error('Failed to load pricing:', error);
    renderDefaultPricing();
  }
};

const handleSubscribe = async (tier: string) => {
  if (tier === 'free') return;

  let customerId = localStorage.getItem('customerId');
  let customerEmail = localStorage.getItem('customerEmail');

  if (!customerId || !customerEmail) {
    customerEmail = window.prompt('Enter your email address to continue:') ?? '';
    if (!customerEmail) return;

    customerId = `cus_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('customerId', customerId);
    localStorage.setItem('customerEmail', customerEmail);
  }

  try {
    const response = await fetch(`${API_BASE}/v1/stripe/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, customerId, customerEmail }),
    });

    if (!response.ok) {
      throw new Error(`Checkout failed: ${response.status}`);
    }

    const data = (await response.json()) as { success?: boolean; url?: string };

    if (data.success && typeof data.url === 'string') {
      window.location.href = data.url;
    } else {
      window.alert('Failed to create checkout session. Please try again.');
    }
  } catch (error) {
    console.error('Subscription error:', error);
    window.alert('An error occurred. Please try again.');
  }
};

export const initializePricing = async () => {
  window.handleSubscribe = handleSubscribe;
  await loadPricing();
};
