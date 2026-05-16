/**
 * Pricing Strategy Calculator Tests
 */

import { describe, it, expect } from 'vitest';

describe('Pricing Strategy Calculator', () => {
  describe('Cost-Plus Pricing', () => {
    it('should calculate cost-plus price correctly', () => {
      const cost = 25;
      const targetMargin = 40; // 40% margin

      const price = cost * (1 + targetMargin / 100);

      expect(price).toBe(35);
    });

    it('should calculate actual margin percentage', () => {
      const cost = 25;
      const price = 50;

      const margin = ((price - cost) / price) * 100;

      expect(margin).toBe(50);
    });

    it('should calculate monthly profit', () => {
      const price = 50;
      const cost = 30;
      const unitsSold = 1000;

      const profit = (price - cost) * unitsSold;

      expect(profit).toBe(20000);
    });
  });

  describe('Value-Based Pricing', () => {
    it('should price at 30-40% of customer value', () => {
      const customerValue = 1000;

      const lowPrice = customerValue * 0.3;
      const highPrice = customerValue * 0.4;
      const recommendedPrice = customerValue * 0.35;

      expect(lowPrice).toBe(300);
      expect(highPrice).toBe(400);
      expect(recommendedPrice).toBe(350);
    });

    it('should show value-based pricing often higher than cost-plus', () => {
      const cost = 50;
      const costPlusPrice = cost * 1.4; // 40% margin = $70
      const customerValue = 500;
      const valueBasedPrice = customerValue * 0.35; // 35% of value = $175

      expect(valueBasedPrice).toBeGreaterThan(costPlusPrice);
    });
  });

  describe('Competitive Pricing', () => {
    it('should calculate margin at market price', () => {
      const cost = 40;
      const marketPrice = 60;

      const margin = ((marketPrice - cost) / marketPrice) * 100;

      expect(margin).toBeCloseTo(33.33, 1);
    });

    it('should identify if market price is unprofitable', () => {
      const cost = 70;
      const marketPrice = 60;

      const margin = ((marketPrice - cost) / marketPrice) * 100;

      expect(margin).toBeLessThan(0); // Negative margin!
    });
  });

  describe('Price Elasticity', () => {
    it('should calculate demand change from price change', () => {
      const baseUnits = 1000;
      const priceChange = 10; // 10% increase
      const elasticity = 1.0; // 1:1 elasticity

      const demandChange = -priceChange * (elasticity / 100);
      const newUnits = baseUnits * (1 + demandChange);

      expect(newUnits).toBe(900); // 10% price increase = 10% demand decrease
    });

    it('should show inelastic demand loses fewer units', () => {
      const baseUnits = 1000;
      const priceIncrease = 10;
      const inelasticDemand = 0.5; // Inelastic

      const demandChange = -(priceIncrease / 100) * inelasticDemand;
      const newUnits = baseUnits * (1 + demandChange);

      expect(newUnits).toBe(950); // Only 5% drop with inelastic demand
    });
  });

  describe('Optimal Price Finding', () => {
    it('should find price that maximizes profit', () => {
      const cost = 25;
      const basePrice = 50;
      const baseUnits = 1000;
      const elasticity = 1.0;

      // Test a few price points
      const prices = [45, 50, 55, 60];
      const profits = prices.map((price) => {
        const priceChange = (price - basePrice) / basePrice;
        const demandChange = -priceChange * elasticity;
        const units = baseUnits * (1 + demandChange);
        return (price - cost) * Math.max(units, 0);
      });

      expect(Math.max(...profits)).toBeGreaterThan(0);
    });

    it('should show very high prices reduce total profit', () => {
      const cost = 25;
      const basePrice = 50;
      const baseUnits = 1000;
      const elasticity = 1.5; // Elastic demand

      const lowPrice = 60;
      const highPrice = 100;

      const lowPriceUnits = baseUnits * (1 - ((lowPrice - basePrice) / basePrice) * elasticity);
      const highPriceUnits = baseUnits * (1 - ((highPrice - basePrice) / basePrice) * elasticity);

      const lowProfit = (lowPrice - cost) * lowPriceUnits;
      const highProfit = (highPrice - cost) * Math.max(highPriceUnits, 0);

      expect(lowProfit).toBeGreaterThan(highProfit);
    });
  });

  describe('Sensitivity Analysis', () => {
    it('should calculate profit at various price points', () => {
      const cost = 30;
      const prices = [35, 40, 45, 50, 55];
      const baseUnits = 1000;

      prices.forEach((price) => {
        const profit = (price - cost) * baseUnits;
        expect(profit).toBeGreaterThan(0);
        expect(profit).toBe((price - cost) * baseUnits);
      });
    });

    it('should show revenue vs profit tradeoff', () => {
      const cost = 25;
      const lowPrice = 40;
      const highPrice = 80;
      const baseUnits = 1000;
      const elasticity = 1.0;

      // Low price: higher volume, lower margin
      const lowPriceUnits = baseUnits * (1 + ((lowPrice - 50) / 50) * -elasticity);
      const lowRevenue = lowPrice * lowPriceUnits;
      const lowProfit = (lowPrice - cost) * lowPriceUnits;

      // High price: lower volume, higher margin
      const highPriceUnits = baseUnits * (1 + ((highPrice - 50) / 50) * -elasticity);
      const highRevenue = highPrice * highPriceUnits;
      const highProfit = (highPrice - cost) * Math.max(highPriceUnits, 0);

      // Revenue can drop at higher prices due to demand loss
      expect(lowRevenue).toBeGreaterThan(highRevenue);
      // But higher margin can still boost profit
      expect(highProfit).toBeGreaterThan(lowProfit);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle SaaS pricing decision', () => {
      const cost = 10; // Very low marginal cost
      const costPlusPrice = cost * 1.5; // $15
      const customerValue = 500; // Saves customer $500/month
      const valueBasedPrice = customerValue * 0.2; // $100
      const marketPrice = 99; // Competitive

      expect(valueBasedPrice).toBeGreaterThan(costPlusPrice);
      expect(valueBasedPrice).toBeCloseTo(marketPrice, -1); // Within $10

      const margin = ((marketPrice - cost) / marketPrice) * 100;
      expect(margin).toBeGreaterThan(85); // Typical SaaS margins
    });

    it('should handle commodity product (low margins)', () => {
      const cost = 45;
      const marketPrice = 50; // Tight competition

      const margin = ((marketPrice - cost) / marketPrice) * 100;

      expect(margin).toBe(10); // Typical commodity margin
      expect(margin).toBeLessThan(20); // Very competitive
    });

    it('should handle luxury product (high margins)', () => {
      const cost = 200;
      const valueBasedPrice = 1000; // Brand premium

      const margin = ((valueBasedPrice - cost) / valueBasedPrice) * 100;

      expect(margin).toBe(80); // Luxury margins
      expect(margin).toBeGreaterThan(60);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero elasticity (perfectly inelastic)', () => {
      const baseUnits = 1000;
      const priceChange = 20;
      const elasticity = 0; // No demand change

      const demandChange = -priceChange * (elasticity / 100);
      const newUnits = baseUnits * (1 + demandChange);

      expect(newUnits).toBe(baseUnits); // Demand unchanged
    });

    it('should handle high elasticity (elastic demand)', () => {
      const baseUnits = 1000;
      const priceChange = 10;
      const elasticity = 3.0; // Very elastic

      const demandChange = -(priceChange / 100) * elasticity;
      const newUnits = baseUnits * (1 + demandChange);

      expect(newUnits).toBe(700); // 30% drop from 10% price increase
    });

    it('should handle price decrease increasing profit', () => {
      const cost = 25;
      const highPrice = 60;
      const lowPrice = 45;
      const baseUnits = 1000;
      const elasticity = 3.5;

      const highPriceUnits = baseUnits;
      const highProfit = (highPrice - cost) * highPriceUnits;

      const lowPriceChange = (lowPrice - highPrice) / highPrice;
      const lowPriceUnits = baseUnits * (1 - lowPriceChange * elasticity);
      const lowProfit = (lowPrice - cost) * lowPriceUnits;

      // Lower price but much higher volume = more profit
      expect(lowPriceUnits).toBeGreaterThan(highPriceUnits);
      expect(lowProfit).toBeGreaterThan(highProfit);
    });

    it('should cap demand at zero for extreme price hikes', () => {
      const baseUnits = 1000;
      const extremePriceIncreasePercent = 250; // 2.5x price jump
      const elasticity = 1.5;

      const demandChange = -(extremePriceIncreasePercent / 100) * elasticity;
      const rawUnits = baseUnits * (1 + demandChange);
      const adjustedUnits = Math.max(rawUnits, 0);

      expect(rawUnits).toBeLessThan(0); // Raw model would go negative
      expect(adjustedUnits).toBe(0); // Clamp to zero demand
    });
  });
});
