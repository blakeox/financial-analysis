import { describe, expect, it } from 'vitest';
import { renderMetricCard } from '../_shared/metric-card-html';

describe('metric card visual contract', () => {
  it('renderMetricCard emits canonical fa-metric-card structure', () => {
    const html = renderMetricCard({
      title: 'Monthly Payment',
      value: '$1,842',
      meta: '30-year fixed',
      tone: 'violet',
    });

    expect(html).toContain('fa-metric-card');
    expect(html).toContain('fa-metric-card-violet');
    expect(html).toContain('fa-metric-card-title');
    expect(html).toContain('fa-metric-card-value');
    expect(html).toContain('fa-metric-card-meta');
    expect(html).toContain('Monthly Payment');
    expect(html).toContain('$1,842');
  });

  it('supports all documented metric card tones', () => {
    const tones = ['violet', 'emerald', 'amber', 'orange', 'primary', 'surface'] as const;

    for (const tone of tones) {
      const html = renderMetricCard({ title: 'KPI', value: '100', tone });
      expect(html).toMatch(/fa-metric-card/);
    }
  });
});
