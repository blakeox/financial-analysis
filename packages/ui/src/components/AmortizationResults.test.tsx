import type { AmortizationAnalysisResult } from '@financial-analysis/analysis';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { AmortizationResults } from './AmortizationResults';

describe('AmortizationResults', () => {
  const basicResult: AmortizationAnalysisResult = {
    monthlyPayment: 856.07,
    totalPayments: 10272.84,
    totalInterest: 272.84,
    schedule: [
      { month: 1, payment: 856.07, principal: 800, interest: 56.07, balance: 9200, cumulativeInterest: 56.07, cumulativePrincipal: 800 },
      { month: 2, payment: 856.07, principal: 804.67, interest: 51.4, balance: 8395.33, cumulativeInterest: 107.47, cumulativePrincipal: 1604.67 },
      { month: 3, payment: 856.07, principal: 809.39, interest: 46.68, balance: 7585.94, cumulativeInterest: 154.15, cumulativePrincipal: 2414.06 },
      { month: 4, payment: 856.07, principal: 814.14, interest: 41.93, balance: 6771.8, cumulativeInterest: 196.08, cumulativePrincipal: 3228.2 },
      { month: 5, payment: 856.07, principal: 818.94, interest: 37.13, balance: 5952.86, cumulativeInterest: 233.21, cumulativePrincipal: 4047.14 },
      { month: 6, payment: 856.07, principal: 823.78, interest: 32.29, balance: 5129.08, cumulativeInterest: 265.5, cumulativePrincipal: 4870.92 },
      { month: 7, payment: 856.07, principal: 828.66, interest: 27.41, balance: 4300.42, cumulativeInterest: 292.91, cumulativePrincipal: 5699.58 },
      { month: 8, payment: 856.07, principal: 833.58, interest: 22.49, balance: 3466.84, cumulativeInterest: 315.4, cumulativePrincipal: 6533.16 },
      { month: 9, payment: 856.07, principal: 838.54, interest: 17.53, balance: 2628.3, cumulativeInterest: 332.93, cumulativePrincipal: 7371.7 },
      { month: 10, payment: 856.07, principal: 843.54, interest: 12.53, balance: 1784.76, cumulativeInterest: 345.46, cumulativePrincipal: 8215.24 },
      { month: 11, payment: 856.07, principal: 848.59, interest: 7.48, balance: 936.17, cumulativeInterest: 352.94, cumulativePrincipal: 9063.83 },
      { month: 12, payment: 856.07, principal: 856.07, interest: 0, balance: 0, cumulativeInterest: 352.94, cumulativePrincipal: 10000 },
    ],
  };

  const resultWithPMI: AmortizationAnalysisResult = {
    monthlyPayment: 856.07,
    totalPayments: 10272.84,
    totalInterest: 272.84,
    totalPMI: 1200,
    pmiDropoffMonth: 60,
    schedule: [
      { month: 1, payment: 856.07, principal: 800, interest: 56.07, balance: 9200, pmi: 100, cumulativeInterest: 56.07, cumulativePrincipal: 800 },
      { month: 2, payment: 856.07, principal: 804.67, interest: 51.4, balance: 8395.33, pmi: 100, cumulativeInterest: 107.47, cumulativePrincipal: 1604.67 },
      { month: 60, payment: 856.07, principal: 823.78, interest: 32.29, balance: 5129.08, cumulativeInterest: 265.5, cumulativePrincipal: 4870.92 },
    ],
  };

  const resultWithExtraPayments: AmortizationAnalysisResult = {
    monthlyPayment: 856.07,
    totalPayments: 9500,
    totalInterest: 200,
    interestSaved: 72.84,
    timeReduced: 2,
    payoffDate: '2024-10-01',
    schedule: [
      { month: 1, payment: 856.07, principal: 800, interest: 56.07, balance: 9200, extraPayment: 200, cumulativeInterest: 56.07, cumulativePrincipal: 1000 },
      { month: 2, payment: 856.07, principal: 804.67, interest: 51.4, balance: 8195.33, extraPayment: 200, cumulativeInterest: 107.47, cumulativePrincipal: 2004.67 },
      { month: 10, payment: 856.07, principal: 843.54, interest: 12.53, balance: 1784.76, cumulativeInterest: 345.46, cumulativePrincipal: 8215.24 },
    ],
  };

  it('renders summary metrics and schedule table', () => {
    render(<AmortizationResults result={basicResult} />);

    expect(
      screen.getByRole('heading', { name: /amortization schedule/i, level: 3 })
    ).toBeInTheDocument();

    // Verify chart is rendered
    expect(screen.getByRole('img', { name: /amortization schedule chart/i })).toBeInTheDocument();

    const monthlyPaymentCard = screen.getByText(/monthly payment/i).closest('div');
    expect(monthlyPaymentCard).not.toBeNull();
    expect(within(monthlyPaymentCard as HTMLDivElement).getByText('$856.07')).toBeInTheDocument();
    expect(screen.getByText('$272.84')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(5);
    expect(screen.getByRole('button', { name: /loan payoff/i })).toBeInTheDocument();
  });

  it('can hide chart and table when requested', () => {
    render(<AmortizationResults result={basicResult} showChart={false} showTable={false} />);

    expect(
      screen.queryByRole('img', { name: /amortization schedule chart/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: /amortization schedule table/i })
    ).not.toBeInTheDocument();
  });

  it('displays PMI information when present', () => {
    render(<AmortizationResults result={resultWithPMI} />);

    expect(screen.getByText('$200.00')).toBeInTheDocument(); // Total PMI
    expect(screen.getByText('Drops off month 60')).toBeInTheDocument();
    expect(screen.getByText('PMI')).toBeInTheDocument(); // PMI column header
  });

  it('displays extra payment benefits when present', () => {
    render(<AmortizationResults result={resultWithExtraPayments} />);

    expect(screen.getByText('$72.84')).toBeInTheDocument(); // Interest saved
    expect(screen.getByText('2')).toBeInTheDocument(); // Months reduced (shown as "0 y 2 m")
    expect(screen.getByText('Sep 30, 2024')).toBeInTheDocument(); // Formatted payoff date
    expect(screen.getByText('$400.00')).toBeInTheDocument(); // Total extra payments
    expect(screen.getByText('Extra')).toBeInTheDocument(); // Extra payment column header
  });

  it('handles results without advanced features gracefully', () => {
    const minimalResult: AmortizationAnalysisResult = {
      monthlyPayment: 500,
      totalPayments: 6000,
      totalInterest: 1000,
      schedule: [
        { month: 1, payment: 500, principal: 400, interest: 100, balance: 9600, cumulativeInterest: 100, cumulativePrincipal: 400 },
        { month: 12, payment: 500, principal: 500, interest: 0, balance: 0, cumulativeInterest: 1000, cumulativePrincipal: 10000 },
      ],
    };

    render(<AmortizationResults result={minimalResult} />);

    // Check monthly payment specifically in the blue card
    const monthlyPaymentCard = screen.getByText(/monthly payment/i).closest('div');
    expect(within(monthlyPaymentCard as HTMLDivElement).getByText('$500.00')).toBeInTheDocument();
    
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.queryByText(/pmi/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/interest saved/i)).not.toBeInTheDocument();
  });
});
