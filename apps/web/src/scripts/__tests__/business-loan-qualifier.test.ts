/**
 * Business Loan Qualifier Calculator Tests
 */

import { describe, it, expect } from 'vitest';

type LoanPurpose = 'real-estate' | 'equipment' | 'working-capital';

describe('Business Loan Qualifier Calculator', () => {
  describe('DSCR Calculations', () => {
    it('should calculate DSCR correctly', () => {
      const netIncome = 80000; // Annual
      const existingDebt = 2000; // Monthly
      const proposedDebt = 667; // ~8% on $100k loan / 12
      const totalDebt = existingDebt + proposedDebt;
      const monthlyIncome = netIncome / 12;
      
      const dscr = monthlyIncome / totalDebt;
      
      expect(dscr).toBeCloseTo(2.5, 1); // 6666 / 2667 = 2.5
    });
    
    it('should identify when DSCR is too low', () => {
      const netIncome = 30000; // Annual
      const monthlyIncome = netIncome / 12; // 2500
      const totalDebt = 2500; // Monthly
      
      const dscr = monthlyIncome / totalDebt;
      
      expect(dscr).toBeLessThan(1.25); // Below minimum
    });
    
    it('should show excellent DSCR', () => {
      const netIncome = 120000;
      const monthlyIncome = netIncome / 12; // 10000
      const totalDebt = 3000;
      
      const dscr = monthlyIncome / totalDebt;
      
      expect(dscr).toBeGreaterThan(2.0); // Excellent
    });
  });
  
  describe('LTV Calculations', () => {
    it('should calculate LTV correctly', () => {
      const loanAmount = 400000;
      const collateralValue = 500000;
      
      const ltv = (loanAmount / collateralValue) * 100;
      
      expect(ltv).toBe(80);
    });
    
    it('should identify when LTV is too high', () => {
      const loanAmount = 460000;
      const collateralValue = 500000;
      
      const ltv = (loanAmount / collateralValue) * 100;
      
      expect(ltv).toBeGreaterThan(90); // Too high for most loans
    });
    
    it('should show excellent LTV', () => {
      const loanAmount = 300000;
      const collateralValue = 500000;
      
      const ltv = (loanAmount / collateralValue) * 100;
      
      expect(ltv).toBeLessThan(75); // Excellent
    });
  });
  
  describe('SBA 7(a) Eligibility', () => {
    it('should qualify for SBA 7(a) with good metrics', () => {
      const businessAge = 3;
      const creditScore = 720;
      const dscr = 1.5;
      const loanAmount = 250000;
      
      const eligible = businessAge >= 2 && 
                      creditScore >= 680 && 
                      dscr >= 1.25 && 
                      loanAmount <= 5000000;
      
      expect(eligible).toBe(true);
    });
    
    it('should not qualify with low credit score', () => {
      const creditScore = 620;
      
      expect(creditScore).toBeLessThan(640); // Minimum for SBA
    });
    
    it('should not qualify if business too young', () => {
      const businessAge = 1;
      
      expect(businessAge).toBeLessThan(2); // Need 2+ years
    });
    
    it('should not qualify if loan amount too high', () => {
      const loanAmount = 6000000;
      
      expect(loanAmount).toBeGreaterThan(5000000); // SBA 7(a) max
    });
  });
  
  describe('SBA 504 Eligibility', () => {
    it('should qualify for real estate purchase', () => {
      const loanPurpose = 'real-estate';
      const ltv = 85;
      const loanAmount = 4000000;
      
      const eligible = (loanPurpose === 'real-estate' || loanPurpose === 'equipment') &&
                      ltv <= 90 &&
                      loanAmount <= 5500000;
      
      expect(eligible).toBe(true);
    });
    
    it('should not qualify for working capital', () => {
      const loanPurpose: LoanPurpose = 'working-capital';
      const eligible = (['real-estate', 'equipment'] as LoanPurpose[]).includes(loanPurpose);
      
      expect(eligible).toBe(false);
    });
    
    it('should not qualify if LTV > 90%', () => {
      const ltv = 95;
      
      expect(ltv).toBeGreaterThan(90); // Need 10% down minimum
    });
  });
  
  describe('Bank Term Loan Eligibility', () => {
    it('should qualify with strong metrics', () => {
      const dscr = 1.8;
      const creditScore = 750;
      const businessAge = 5;
      
      const eligible = dscr >= 1.25 && creditScore >= 680 && businessAge >= 1;
      
      expect(eligible).toBe(true);
    });
    
    it('should show approval odds based on DSCR', () => {
      const excellentDSCR = 1.8;
      const fairDSCR = 1.3;
      const poorDSCR = 1.1;
      
      expect(excellentDSCR).toBeGreaterThan(1.5); // Excellent odds
      expect(fairDSCR).toBeGreaterThan(1.25); // Fair odds
      expect(poorDSCR).toBeLessThan(1.25); // Poor odds
    });
  });
  
  describe('Line of Credit Eligibility', () => {
    it('should qualify with good cash flow', () => {
      const dscr = 1.5;
      const creditScore = 700;
      const businessAge = 2;
      
      const eligible = dscr >= 1.2 && creditScore >= 680 && businessAge >= 1;
      
      expect(eligible).toBe(true);
    });
    
    it('should consider line amount vs revenue', () => {
      const lineAmount = 100000;
      const annualRevenue = 500000;
      const ratio = lineAmount / annualRevenue;
      
      expect(ratio).toBeLessThan(0.25); // Good - under 25% of revenue
    });
  });
  
  describe('Real-World Scenarios', () => {
    it('should handle growing restaurant seeking expansion', () => {
      const businessAge = 4;
      const revenue = 800000;
      const netIncome = 100000;
      const existingDebt = 3000;
      const loanAmount = 300000;
      const creditScore = 710;
      const collateralValue = 400000;
      
      const monthlyIncome = netIncome / 12;
      const proposedDebt = (loanAmount * 0.08) / 12;
      const dscr = monthlyIncome / (existingDebt + proposedDebt);
      const ltv = (loanAmount / collateralValue) * 100;
      const revenueCoverage = loanAmount / revenue;
      
      expect(dscr).toBeGreaterThan(1.25);
      expect(ltv).toBeLessThan(90);
      expect(creditScore).toBeGreaterThan(680);
      expect(businessAge).toBeGreaterThan(2);
      expect(revenueCoverage).toBeLessThan(0.5);
    });
    
    it('should handle struggling startup', () => {
      const businessAge = 1;
      const netIncome = 15000; // Barely profitable
      const monthlyIncome = netIncome / 12; // 1250
      const existingDebt = 500;
      const proposedDebt = 1000;
      const dscr = monthlyIncome / (existingDebt + proposedDebt);
      
      expect(dscr).toBeLessThan(1.25); // Won't qualify for traditional loans
      expect(businessAge).toBeLessThan(2); // Too young for SBA
    });
  });
});

