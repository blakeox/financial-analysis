import { describe, expect, it } from 'vitest';
import { renderInsightCard } from '../_shared/insight-card-html';
import { renderResultPanel, renderResultRow } from '../_shared/result-panel-html';

describe('insight-card-html', () => {
  it('renders an info highlight card by default', () => {
    const html = renderInsightCard({ content: 'Plain-English insight copy.' });

    expect(html).toContain('fa-highlight-card');
    expect(html).toContain('Plain-English insight copy.');
  });

  it('renders warning callout tone', () => {
    const html = renderInsightCard({ content: 'Caution copy.', tone: 'warning' });

    expect(html).toContain('fa-callout-warning');
  });

  it('renders titled HTML insight blocks', () => {
    const html = renderInsightCard({
      title: 'Buying Advantages',
      html: true,
      content: '<ul><li>One</li></ul>',
    });

    expect(html).toContain('Buying Advantages');
    expect(html).toContain('<ul>');
  });
});

describe('result-panel-html', () => {
  it('wraps body content in fa-card', () => {
    const html = renderResultPanel({
      title: 'Cost Breakdown',
      bodyHtml: renderResultRow('Vehicle Price', '$30,000'),
    });

    expect(html).toContain('fa-card');
    expect(html).toContain('Cost Breakdown');
    expect(html).toContain('Vehicle Price');
  });
});
