import { describe, expect, it } from 'vitest';
import { renderMetricCard, renderMetricCards } from '../_shared/metric-card-html';

describe('metric-card-html', () => {
  it('renders a violet metric card with meta copy', () => {
    const html = renderMetricCard({
      title: 'Total Debt',
      value: '$12,000',
      meta: '4 months from now',
      tone: 'violet',
    });

    expect(html).toContain('fa-metric-card-violet');
    expect(html).toContain('fa-metric-card-title');
    expect(html).toContain('$12,000');
    expect(html).toContain('4 months from now');
  });

  it('renders multiple cards', () => {
    const html = renderMetricCards([
      { title: 'Income', value: '$5,000', tone: 'emerald' },
      { title: 'Rate', value: '12%', tone: 'orange' },
    ]);

    expect(html).toContain('fa-metric-card-emerald');
    expect(html).toContain('fa-metric-card-orange');
  });
});
