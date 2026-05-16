import React from 'react';
import type {
  AmortizationAnalysisResult,
  AmortizationMilestone,
} from '@financial-analysis/analysis';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AmortizationChart } from './AmortizationChart';

describe('AmortizationChart', () => {
  const sampleResult: AmortizationAnalysisResult = {
    monthlyPayment: 856.07,
    totalPayments: 10272.84,
    totalInterest: 272.84,
    schedule: [
      { month: 1, payment: 856.07, principal: 800, interest: 56.07, balance: 9200 },
      { month: 2, payment: 856.07, principal: 804.67, interest: 51.4, balance: 8395.33 },
      { month: 3, payment: 856.07, principal: 809.39, interest: 46.68, balance: 7585.94 },
      { month: 4, payment: 856.07, principal: 814.14, interest: 41.93, balance: 6771.8 },
      { month: 5, payment: 856.07, principal: 818.94, interest: 37.13, balance: 5952.86 },
      { month: 6, payment: 856.07, principal: 823.78, interest: 32.29, balance: 5129.08 },
      { month: 7, payment: 856.07, principal: 828.66, interest: 27.41, balance: 4300.42 },
      { month: 8, payment: 856.07, principal: 833.58, interest: 22.49, balance: 3466.84 },
      { month: 9, payment: 856.07, principal: 838.54, interest: 17.53, balance: 2628.3 },
      { month: 10, payment: 856.07, principal: 843.54, interest: 12.53, balance: 1784.76 },
      { month: 11, payment: 856.07, principal: 848.59, interest: 7.48, balance: 936.17 },
      { month: 12, payment: 856.07, principal: 856.07, interest: 0, balance: 0 },
    ],
  };

  const sampleMilestones: AmortizationMilestone[] = [
    {
      id: 'halfway-balance',
      month: 6,
      label: 'Half Balance',
      description: 'Halfway through balance',
    },
    {
      id: 'principal-takeover',
      month: 8,
      label: 'Principal Takeover',
      description: 'Principal exceeds interest',
    },
  ];

  it('renders chart with basic structure', () => {
    render(<AmortizationChart schedule={sampleResult.schedule} milestones={sampleMilestones} />);

    // Heading and chart are rendered
    expect(screen.getByRole('heading', { name: /amortization schedule/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /amortization schedule chart/i })).toBeInTheDocument();
    // Slider control is present
    expect(screen.getByRole('slider', { name: /highlight month/i })).toBeInTheDocument();
  });

  it('displays milestone buttons', () => {
    render(<AmortizationChart schedule={sampleResult.schedule} milestones={sampleMilestones} />);

    expect(screen.getByRole('button', { name: /half repaid/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /principal overtakes/i })).toBeInTheDocument();
  });

  it('handles milestone button clicks', async () => {
    const user = userEvent.setup();
    render(<AmortizationChart schedule={sampleResult.schedule} milestones={sampleMilestones} />);

    const halfBalanceButton = screen.getByRole('button', { name: /half repaid/i });
    await user.click(halfBalanceButton);

    // Chart should highlight the milestone month
    expect(halfBalanceButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports keyboard navigation on slider', async () => {
    const user = userEvent.setup();
    render(<AmortizationChart schedule={sampleResult.schedule} milestones={sampleMilestones} />);

    const slider = screen.getByRole('slider', { name: /highlight month/i });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '11');

    // Test arrow key navigation
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveValue('1');

    await user.keyboard('{ArrowLeft}');
    expect(slider).toHaveValue('0');
  });

  it('updates highlight month via slider', async () => {
    const user = userEvent.setup();
    render(<AmortizationChart schedule={sampleResult.schedule} milestones={sampleMilestones} />);

    const slider = screen.getByRole('slider', { name: /highlight month/i });
    await user.click(slider);

    // Change slider value
    fireEvent.change(slider, { target: { value: '6' } });
    await waitFor(() => expect(slider).toHaveValue('6'));
  });

  it('displays payment breakdown when month is highlighted', () => {
    render(
      <AmortizationChart
        schedule={sampleResult.schedule}
        milestones={sampleMilestones}
        highlightMonth={6}
      />
    );

    // Should show breakdown for month 6
    expect(screen.getByText('$823.78')).toBeInTheDocument(); // Principal for month 6
    expect(screen.getByText('$32.29')).toBeInTheDocument(); // Interest for month 6
  });

  it('handles empty milestones gracefully', () => {
    render(<AmortizationChart schedule={sampleResult.schedule} milestones={[]} />);

    expect(screen.getByRole('img', { name: /amortization schedule chart/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /milestone/i })).not.toBeInTheDocument();
  });

  it('shows a currency scale that covers the highest payment', () => {
    render(<AmortizationChart schedule={sampleResult.schedule} milestones={sampleMilestones} />);

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    expect(screen.getAllByText(formatCurrency(1000))).not.toHaveLength(0);
    expect(screen.getAllByText(formatCurrency(200))).not.toHaveLength(0);
  });

  it('maintains accessibility with proper ARIA labels', () => {
    render(<AmortizationChart schedule={sampleResult.schedule} milestones={sampleMilestones} />);

    const chart = screen.getByRole('img', { name: /amortization schedule chart/i });
    expect(chart).toHaveAttribute('aria-label');

    const slider = screen.getByRole('slider', { name: /highlight month/i });
    expect(slider).toBeInTheDocument();

    // Check milestone buttons have aria-pressed attributes
    const milestone1 = screen.getByRole('button', { name: /half repaid/i });
    const milestone2 = screen.getByRole('button', { name: /principal overtakes/i });
    expect(milestone1).toHaveAttribute('aria-pressed');
    expect(milestone2).toHaveAttribute('aria-pressed');
  });
});
