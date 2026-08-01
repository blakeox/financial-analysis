import { describe, expect, it } from 'vitest';
import { renderTheAnswer } from '../_shared/answer-html';
import { renderAssumptionChip, renderAssumptionChips } from '../_shared/assumption-chip-html';
import { bindCompareToggle, renderComparePair, renderCompareToggle } from '../_shared/compare-html';

describe('answer-html', () => {
  it('renders The Answer with value, meaning, and tabular class', () => {
    const html = renderTheAnswer({
      label: 'Monthly payment',
      value: '$1,842',
      meaning: 'What you pay each month.',
      reveal: true,
    });

    expect(html).toContain('fa-answer');
    expect(html).toContain('fa-answer-reveal');
    expect(html).toContain('fa-tabular-nums');
    expect(html).toContain('$1,842');
    expect(html).toContain('What you pay each month.');
  });

  it('embeds assumption chips when provided', () => {
    const html = renderTheAnswer({
      value: '$100',
      meaning: 'Test',
      assumptions: [{ label: '30y', fieldName: 'termMonths' }],
      reveal: false,
    });

    expect(html).toContain('fa-assumption-chip');
    expect(html).toContain('data-assumption-field="termMonths"');
    expect(html).not.toContain('fa-answer-reveal');
  });
});

describe('assumption-chip-html', () => {
  it('renders static and focusable chips', () => {
    expect(renderAssumptionChip({ label: 'taxes on' })).toContain('fa-assumption-chip-static');
    expect(renderAssumptionChips([{ label: '6.5%', fieldName: 'annualRate' }])).toContain(
      'data-assumption-field="annualRate"'
    );
  });
});

describe('compare-html', () => {
  it('renders segmented toggle and dual columns', () => {
    const toggle = renderCompareToggle([
      { id: 'a', label: 'A', active: true },
      { id: 'b', label: 'B' },
    ]);
    expect(toggle).toContain('fa-segmented-control');
    expect(toggle).toContain('aria-pressed="true"');

    const pair = renderComparePair({
      a: { title: 'Buy', bodyHtml: '<p>buy</p>' },
      b: { title: 'Rent', bodyHtml: '<p>rent</p>' },
      group: 'compare',
    });
    expect(pair).toContain('fa-compare-col-a');
    expect(pair).toContain('fa-compare-col-b');
    expect(pair).toContain('data-compare-panel="a"');
    expect(pair).toContain('data-compare-root="compare"');
    expect(pair).toContain('Buy');
    expect(pair).toContain('Rent');
  });

  it('bindCompareToggle updates pressed state and panel visibility', () => {
    document.body.innerHTML = `
      ${renderCompareToggle([
        { id: 'both', label: 'Both', active: true },
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ])}
      ${renderComparePair({
        a: { title: 'Buy', bodyHtml: '<p>buy</p>' },
        b: { title: 'Rent', bodyHtml: '<p>rent</p>' },
        group: 'compare',
      })}
    `;

    bindCompareToggle(document.body, { group: 'compare' });

    const buyPanel = document.querySelector<HTMLElement>('[data-compare-panel="a"]');
    const rentPanel = document.querySelector<HTMLElement>('[data-compare-panel="b"]');
    expect(buyPanel?.hidden).toBe(false);
    expect(rentPanel?.hidden).toBe(false);

    document.querySelector<HTMLButtonElement>('[data-compare-option="a"]')?.click();
    expect(buyPanel?.hidden).toBe(false);
    expect(rentPanel?.hidden).toBe(true);
    expect(document.querySelector('[data-compare-option="a"]')?.getAttribute('aria-pressed')).toBe(
      'true'
    );
  });
});
