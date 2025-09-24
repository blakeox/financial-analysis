import type { AmortizationAnalysisResult } from '@financial-analysis/analysis';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { AmortizationResults } from './AmortizationResults';

describe('AmortizationResults', () => {
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

  it('renders summary metrics and schedule table', () => {
    render(<AmortizationResults result={sampleResult} />);

    expect(
      screen.getByRole('heading', { name: /amortization schedule/i, level: 3 })
    ).toBeInTheDocument();

    const monthlyPaymentCard = screen.getByText(/monthly payment/i).closest('div');
    expect(monthlyPaymentCard).not.toBeNull();
    expect(within(monthlyPaymentCard as HTMLDivElement).getByText('$856.07')).toBeInTheDocument();
    expect(screen.getByText('$272.84')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(5);
    expect(screen.getByRole('button', { name: /loan payoff/i })).toBeInTheDocument();
  });

  it('can hide chart and table when requested', () => {
    render(<AmortizationResults result={sampleResult} showChart={false} showTable={false} />);

    expect(
      screen.queryByRole('img', { name: /amortization schedule chart/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: /amortization schedule table/i })
    ).not.toBeInTheDocument();
  });
});
