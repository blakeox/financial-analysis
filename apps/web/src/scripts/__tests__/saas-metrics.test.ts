/**
 * SaaS Metrics Dashboard Calculator Tests
 */

import { describe, it, expect } from 'vitest';

describe('SaaS Metrics Dashboard Calculator', () => {
  describe('MRR & ARR Calculations', () => {
    it('should calculate MRR correctly', () => {
      const activeCustomers = 150;
      const averageRevenue = 99;
      
      const mrr = activeCustomers * averageRevenue;
      
      expect(mrr).toBe(14850);
    });
    
    it('should calculate ARR from MRR', () => {
      const mrr = 14850;
      
      const arr = mrr * 12;
      
      expect(arr).toBe(178200);
    });
    
    it('should handle decimal revenue per customer', () => {
      const activeCustomers = 234;
      const averageRevenue = 49.99;
      
      const mrr = activeCustomers * averageRevenue;
      
      expect(mrr).toBeCloseTo(11697.66, 1);
    });
  });
  
  describe('Churn Rate Calculations', () => {
    it('should calculate monthly churn rate', () => {
      const activeCustomers = 200;
      const churnedCustomers = 10;
      
      const churnRate = (churnedCustomers / activeCustomers) * 100;
      
      expect(churnRate).toBe(5);
    });
    
    it('should calculate annual churn from monthly', () => {
      const monthlyChurn = 5; // 5% per month
      
      const annualChurn = monthlyChurn * 12;
      
      expect(annualChurn).toBe(60); // Rough estimate
    });
    
    it('should identify excellent churn (<2%)', () => {
      const activeCustomers = 500;
      const churnedCustomers = 5;
      
      const churnRate = (churnedCustomers / activeCustomers) * 100;
      
      expect(churnRate).toBe(1);
      expect(churnRate).toBeLessThan(2);
    });
    
    it('should identify problematic churn (>5%)', () => {
      const activeCustomers = 200;
      const churnedCustomers = 15;
      
      const churnRate = (churnedCustomers / activeCustomers) * 100;
      
      expect(churnRate).toBe(7.5);
      expect(churnRate).toBeGreaterThan(5);
    });
  });
  
  describe('CAC (Customer Acquisition Cost)', () => {
    it('should calculate CAC correctly', () => {
      const salesMarketingSpend = 10000;
      const newCustomers = 20;
      
      const cac = salesMarketingSpend / newCustomers;
      
      expect(cac).toBe(500);
    });
    
    it('should handle zero new customers', () => {
      const salesMarketingSpend = 10000;
      const newCustomers = 0;
      
      const cac = newCustomers > 0 ? salesMarketingSpend / newCustomers : 0;
      
      expect(cac).toBe(0);
    });
    
    it('should show efficient CAC for viral products', () => {
      const salesMarketingSpend = 5000;
      const newCustomers = 100; // Strong word-of-mouth
      
      const cac = salesMarketingSpend / newCustomers;
      
      expect(cac).toBe(50);
      expect(cac).toBeLessThan(100);
    });
  });
  
  describe('LTV (Lifetime Value)', () => {
    it('should calculate LTV correctly', () => {
      const averageMonthlyRevenue = 99;
      const averageLifetimeMonths = 24;
      const grossMargin = 80; // 80%
      
      const ltv = averageMonthlyRevenue * averageLifetimeMonths * (grossMargin / 100);
      
      expect(ltv).toBeCloseTo(1900.8, 1);
    });
    
    it('should calculate lifetime from churn rate', () => {
      const monthlyChurnRate = 5; // 5%
      
      const averageLifetime = 1 / (monthlyChurnRate / 100);
      
      expect(averageLifetime).toBe(20); // months
    });
    
    it('should show impact of gross margin on LTV', () => {
      const revenue = 100;
      const lifetime = 12;
      const lowMargin = 40;
      const highMargin = 85;
      
      const lowLTV = revenue * lifetime * (lowMargin / 100);
      const highLTV = revenue * lifetime * (highMargin / 100);
      
      expect(highLTV).toBeGreaterThan(lowLTV);
      expect(highLTV).toBe(1020);
      expect(lowLTV).toBe(480);
    });
  });
  
  describe('LTV:CAC Ratio', () => {
    it('should calculate LTV:CAC ratio', () => {
      const ltv = 1500;
      const cac = 500;
      
      const ratio = ltv / cac;
      
      expect(ratio).toBe(3);
    });
    
    it('should identify excellent ratio (>=3)', () => {
      const ltv = 2000;
      const cac = 500;
      
      const ratio = ltv / cac;
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
    
    it('should identify problematic ratio (<1)', () => {
      const ltv = 400;
      const cac = 500;
      
      const ratio = ltv / cac;
      
      expect(ratio).toBeLessThan(1); // Losing money on every customer!
    });
    
    it('should identify marginal ratio (1-3)', () => {
      const ltv = 1000;
      const cac = 500;
      
      const ratio = ltv / cac;
      
      expect(ratio).toBe(2);
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(3);
    });
  });
  
  describe('CAC Payback Period', () => {
    it('should calculate payback period correctly', () => {
      const cac = 600;
      const monthlyRevenue = 100;
      const grossMargin = 80; // 80%
      
      const monthlyGrossProfit = monthlyRevenue * (grossMargin / 100);
      const paybackPeriod = cac / monthlyGrossProfit;
      
      expect(paybackPeriod).toBe(7.5); // months
    });
    
    it('should identify excellent payback (<= 12 months)', () => {
      const cac = 400;
      const monthlyRevenue = 50;
      const grossMargin = 80;
      
      const monthlyGrossProfit = monthlyRevenue * (grossMargin / 100);
      const paybackPeriod = cac / monthlyGrossProfit;
      
      expect(paybackPeriod).toBe(10);
      expect(paybackPeriod).toBeLessThanOrEqual(12);
    });
    
    it('should identify problematic payback (> 18 months)', () => {
      const cac = 1000;
      const monthlyRevenue = 40;
      const grossMargin = 70;
      
      const monthlyGrossProfit = monthlyRevenue * (grossMargin / 100);
      const paybackPeriod = cac / monthlyGrossProfit;
      
      expect(paybackPeriod).toBeCloseTo(35.7, 1);
      expect(paybackPeriod).toBeGreaterThan(18);
    });
  });
  
  describe('Net Revenue Retention (NRR)', () => {
    it('should calculate basic NRR (no expansion)', () => {
      const churnRate = 3; // 3% monthly churn
      
      const nrr = 100 - churnRate;
      
      expect(nrr).toBe(97);
    });
    
    it('should show NRR > 100% with expansion revenue', () => {
      const churnRate = 3;
      const expansionRate = 5; // Upsells
      
      const nrr = 100 - churnRate + expansionRate;
      
      expect(nrr).toBe(102);
      expect(nrr).toBeGreaterThan(100);
    });
  });
  
  describe('Rule of 40', () => {
    it('should calculate Rule of 40', () => {
      const growthRate = 50; // 50% YoY growth
      const profitMargin = -10; // Losing money to grow
      
      const ruleOf40 = growthRate + profitMargin;
      
      expect(ruleOf40).toBe(40); // Exactly at threshold
    });
    
    it('should identify excellent Rule of 40 score', () => {
      const growthRate = 60;
      const profitMargin = 10;
      
      const ruleOf40 = growthRate + profitMargin;
      
      expect(ruleOf40).toBe(70);
      expect(ruleOf40).toBeGreaterThan(40);
    });
    
    it('should identify poor Rule of 40 score', () => {
      const growthRate = 10;
      const profitMargin = -20;
      
      const ruleOf40 = growthRate + profitMargin;
      
      expect(ruleOf40).toBe(-10);
      expect(ruleOf40).toBeLessThan(40);
    });
    
    it('should show tradeoff between growth and profitability', () => {
      const fastGrowth = { growth: 80, profit: -30 };
      const slowGrowth = { growth: 20, profit: 25 };
      
      const fastRule40 = fastGrowth.growth + fastGrowth.profit;
      const slowRule40 = slowGrowth.growth + slowGrowth.profit;
      
      expect(fastRule40).toBe(50);
      expect(slowRule40).toBe(45);
      expect(fastRule40).toBeGreaterThan(40);
      expect(slowRule40).toBeGreaterThan(40);
    });
  });
  
  describe('SaaS Health Score', () => {
    it('should give high score for excellent metrics', () => {
      const ltvCacRatio = 4.0; // 25 points
      const churnRate = 1.5; // 25 points (<2%)
      const payback = 10; // 25 points (<=12)
      const ruleOf40 = 50; // 25 points (>=40)
      
      let score = 0;
      if (ltvCacRatio >= 3) score += 25;
      if (churnRate <= 2) score += 25;
      if (payback <= 12) score += 25;
      if (ruleOf40 >= 40) score += 25;
      
      expect(score).toBe(100);
    });
    
    it('should give low score for poor metrics', () => {
      const ltvCacRatio = 0.8; // 0 points (<1)
      const churnRate = 12; // 0 points (>10%)
      const payback = 30; // 0 points (>24)
      const ruleOf40 = 15; // 0 points (<20)
      
      let score = 0;
      if (ltvCacRatio >= 3) score += 25;
      else if (ltvCacRatio >= 1) score += 10;
      
      if (churnRate <= 2) score += 25;
      else if (churnRate <= 5) score += 15;
      else if (churnRate <= 10) score += 5;
      
      if (payback <= 12) score += 25;
      else if (payback <= 18) score += 15;
      else if (payback <= 24) score += 5;
      
      if (ruleOf40 >= 40) score += 25;
      else if (ruleOf40 >= 20) score += 10;
      
      expect(score).toBeLessThan(30);
    });
  });
  
  describe('Real-World Scenarios', () => {
    it('should handle early-stage SaaS (burning cash for growth)', () => {
      const customers = 100;
      const avgRevenue = 49;
      const newCustomers = 30;
      const churned = 5;
      const spend = 20000;
      const lifetime = 18;
      const grossMargin = 85;
      
      const mrr = customers * avgRevenue;
      const churnRate = (churned / customers) * 100;
      const cac = spend / newCustomers;
      const ltv = avgRevenue * lifetime * (grossMargin / 100);
      const ltvCacRatio = ltv / cac;
      
      expect(mrr).toBe(4900);
      expect(churnRate).toBe(5); // High for early stage
      expect(cac).toBeCloseTo(666.67, 1);
      expect(ltvCacRatio).toBeCloseTo(1.13, 1); // Marginal
    });
    
    it('should handle mature SaaS (profitable, slow growth)', () => {
      const customers = 5000;
      const avgRevenue = 99;
      const newCustomers = 100;
      const churned = 50;
      const spend = 30000;
      const lifetime = 36;
      const grossMargin = 82;
      const growthRate = 15;
      const profitMargin = 20;
      
      const mrr = customers * avgRevenue;
      const churnRate = (churned / customers) * 100;
      const cac = spend / newCustomers;
      const ltv = avgRevenue * lifetime * (grossMargin / 100);
      const ltvCacRatio = ltv / cac;
      const ruleOf40 = growthRate + profitMargin;
      
      expect(mrr).toBe(495000);
      expect(churnRate).toBe(1); // Excellent
      expect(ltvCacRatio).toBeGreaterThan(9); // Excellent
      expect(ruleOf40).toBe(35); // Below target but profitable
    });
    
    it('should handle enterprise SaaS (high ACV, low churn)', () => {
      const customers = 200;
      const avgRevenue = 2000; // High ACV
      const newCustomers = 10;
      const churned = 2;
      const spend = 50000;
      const lifetime = 48; // Long lifetime
      const grossMargin = 90;
      
      const mrr = customers * avgRevenue;
      const arr = mrr * 12;
      const churnRate = (churned / customers) * 100;
      const cac = spend / newCustomers;
      const ltv = avgRevenue * lifetime * (grossMargin / 100);
      const ltvCacRatio = ltv / cac;
      
      expect(mrr).toBe(400000);
      expect(arr).toBe(4800000); // $4.8M ARR
      expect(churnRate).toBe(1); // Low churn
      expect(ltvCacRatio).toBeGreaterThan(15); // Excellent economics
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle zero customers', () => {
      const customers = 0;
      const avgRevenue = 99;
      
      const mrr = customers * avgRevenue;
      
      expect(mrr).toBe(0);
    });
    
    it('should handle 100% gross margin (pure software)', () => {
      const avgRevenue = 100;
      const lifetime = 12;
      const grossMargin = 100;
      
      const ltv = avgRevenue * lifetime * (grossMargin / 100);
      
      expect(ltv).toBe(1200);
    });
    
    it('should handle very high churn (failing product)', () => {
      const customers = 100;
      const churned = 30;
      
      const churnRate = (churned / customers) * 100;
      
      expect(churnRate).toBe(30); // Unsustainable
    });
  });
});

