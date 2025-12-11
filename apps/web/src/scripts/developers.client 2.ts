const slider = document.getElementById('pricing-slider');
const requestCount = document.getElementById('request-count');
const estimatedPrice = document.getElementById('estimated-price');
const recommendedTier = document.getElementById('recommended-tier');

if (
  slider instanceof HTMLInputElement &&
  requestCount instanceof HTMLElement &&
  estimatedPrice instanceof HTMLElement &&
  recommendedTier instanceof HTMLElement
) {
  const updatePricingEstimate = (requests: number) => {
    const safeRequests = Number.isFinite(requests) && requests >= 0 ? requests : 0;
    requestCount.textContent = safeRequests.toLocaleString();

    let price = 0;
    let tier = 'Free Tier';

    if (safeRequests <= 1000) {
      price = 0;
      tier = 'Free Tier';
    } else if (safeRequests <= 50000) {
      price = 49;
      tier = 'Pro Tier';
    } else {
      price = 49 + Math.ceil((safeRequests - 50000) / 10000) * 10;
      tier = 'Enterprise Tier (Custom)';
    }

    estimatedPrice.textContent = `$${price}`;
    recommendedTier.textContent = `Recommended: ${tier}`;
  };

  const handleInput = (event: Event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      updatePricingEstimate(target.valueAsNumber);
    }
  };

  slider.addEventListener('input', handleInput);
  updatePricingEstimate(slider.valueAsNumber || Number.parseInt(slider.value, 10));
}

export {};
