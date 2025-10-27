import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('developers.client', () => {
  const setupDom = (value = '75000') => {
    document.body.innerHTML = `
      <input id="pricing-slider" type="range" value="${value}" max="200000" />
      <div id="request-count"></div>
      <div id="estimated-price"></div>
      <div id="recommended-tier"></div>
    `;
  };

  beforeEach(() => {
    vi.resetModules();
    setupDom();
  });

  it('initializes pricing estimate based on slider value', async () => {
    await import('../developers.client');

  expect(document.getElementById('request-count')?.textContent).toBe('75,000');
  expect(document.getElementById('estimated-price')?.textContent).toBe('$79');
    expect(document.getElementById('recommended-tier')?.textContent).toContain('Enterprise Tier');
  });

  it('updates estimates when slider emits input', async () => {
    await import('../developers.client');

    const slider = document.getElementById('pricing-slider') as HTMLInputElement;
    slider.value = '1000';
    slider.dispatchEvent(new Event('input'));

    expect(document.getElementById('estimated-price')?.textContent).toBe('$0');
    expect(document.getElementById('recommended-tier')?.textContent).toContain('Free Tier');
  });
});
