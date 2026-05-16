import { describe, expect, it } from 'vitest';

import { generateHelpResponse } from '../chat/help-interceptor';

describe('help-interceptor', () => {
  it('lists newly-added investment tools under Investment', () => {
    const response = generateHelpResponse(
      'list tools',
      [
        {
          name: 'calculate_capm',
          description:
            'Calculate expected return using CAPM (risk-free rate + beta × market risk premium)',
        },
        {
          name: 'analyze_risk_adjusted_returns',
          description: 'Calculate Sharpe and Sortino ratios from a return series',
        },
      ],
      'general'
    );

    expect(response.shouldIntercept).toBe(true);
    expect(response.response).toContain('📈 Investment');
    expect(response.response).toContain('Calculate Capm');
    expect(response.response).toContain('Risk Adjusted Returns');
  });

  it('classifies break-even/NPV/IRR tools under Business Finance', () => {
    const response = generateHelpResponse(
      'show tools',
      [
        {
          name: 'analyze_break_even',
          description: 'Calculate break-even point in units and revenue',
        },
        {
          name: 'calculate_npv_irr',
          description: 'Calculate NPV, IRR, and payback period with optional sensitivity',
        },
      ],
      'general'
    );

    expect(response.shouldIntercept).toBe(true);
    expect(response.response).toContain('📊 Business Finance');
    expect(response.response).toContain('Break Even');
    expect(response.response).toContain('Calculate Npv Irr');
  });
});
