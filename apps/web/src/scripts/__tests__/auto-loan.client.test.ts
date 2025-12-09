import { describe, expect, it, beforeEach } from 'vitest';
import { AutoLoanEngine } from '@financial-analysis/analysis';
import { parseAutoLoanInput, renderAutoLoanResults } from '../calculators/auto-loan.client';

describe('auto-loan.client', () => {
  const buildFormData = (overrides: Record<string, string> = {}) => {
    const defaults: Record<string, string> = {
      vehiclePrice: '32000',
      downPayment: '2000',
      tradeInValue: '3500',
      tradeInOwed: '1000',
      salesTaxRate: '8.5',
      registrationFees: '400',
      dealerFees: '600',
      interestRate: '5.4',
      loanTerm: '60', // Changed from loanTermMonths to loanTerm
      manufacturerRebate: '1000',
      gapInsuranceCost: '700',
      extendedWarrantyCost: '1800',
    };

    const formData = new FormData();
    Object.entries({ ...defaults, ...overrides }).forEach(([key, value]) => {
      formData.set(key, value);
    });
    formData.set('includeGapInsurance', 'on');
    formData.set('includeExtendedWarranty', 'on');
    return formData;
  };

  describe('parseAutoLoanInput', () => {
    it('parses numeric values and toggles correctly', () => {
      const formData = buildFormData();
      const parsed = parseAutoLoanInput(formData);

      expect(parsed.vehiclePrice).toBe(32000);
      expect(parsed.downPayment).toBe(2000);
      expect(parsed.tradeInValue).toBe(3500);
      expect(parsed.tradeInOwed).toBe(1000);
      expect(parsed.salesTaxRate).toBeCloseTo(0.085);
      expect(parsed.registrationFees).toBe(400);
      expect(parsed.dealerFees).toBe(600);
      expect(parsed.interestRate).toBeCloseTo(0.054);
      expect(parsed.loanTermMonths).toBe(60);
      expect(parsed.manufacturerRebate).toBe(1000);
      expect(parsed.includeGapInsurance).toBe(true);
      expect(parsed.gapInsuranceCost).toBe(700);
      expect(parsed.includeExtendedWarranty).toBe(true);
      expect(parsed.extendedWarrantyCost).toBe(1800);
    });

    it('throws for invalid primary inputs', () => {
      const missingPrice = buildFormData({ vehiclePrice: '0' });
      expect(() => parseAutoLoanInput(missingPrice)).toThrow('Please enter a valid vehicle price.');

      const badTax = buildFormData({ salesTaxRate: '200' });
      expect(() => parseAutoLoanInput(badTax)).toThrow('Sales tax rate must be between 0 and 100.');

      const badInterest = buildFormData({ interestRate: '-1' });
      expect(() => parseAutoLoanInput(badInterest)).toThrow('Interest rate must be between 0 and 100.');

      const badTerm = buildFormData({ loanTerm: '0' });
      expect(() => parseAutoLoanInput(badTerm)).toThrow('Please enter a valid loan term.');
    });
  });

  describe('renderAutoLoanResults', () => {
    const mountResultDom = () => {
      document.body.innerHTML = `
        <div id="results-container"></div>
        <div id="summary-cards"></div>
      `;
    };

    beforeEach(() => {
      mountResultDom();
    });

    it('writes computed values into the DOM', () => {
      const formData = buildFormData();
      const input = parseAutoLoanInput(formData);
      const result = AutoLoanEngine.analyze(input);

      renderAutoLoanResults(result, input.loanTermMonths);

      // Verify summary cards were populated
      const summaryCards = document.getElementById('summary-cards');
      expect(summaryCards).toBeTruthy();
      expect(summaryCards?.innerHTML).toContain('$'); // Contains currency values
      expect(summaryCards?.innerHTML).toContain('Monthly Payment');
    });

    it('handles zero trade-in values', () => {
      const formData = buildFormData({ tradeInValue: '0', tradeInOwed: '0' });
      const input = parseAutoLoanInput(formData);
      const result = AutoLoanEngine.analyze(input);

      renderAutoLoanResults(result, input.loanTermMonths);

      // Verify results are displayed
      const summaryCards = document.getElementById('summary-cards');
      expect(summaryCards?.innerHTML).toContain('$');
    });
  });
});
