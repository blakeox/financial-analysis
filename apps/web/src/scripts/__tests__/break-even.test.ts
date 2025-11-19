/**
 * Break-Even Analysis Calculator Tests
 * Comprehensive test suite for break-even calculations
 */

import { describe, it, expect } from 'vitest';

// Mock types based on the calculator implementation
interface BreakEvenInput {
  fixedCosts: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  currentSalesUnits?: number;
  targetProfit?: number;
}

interface BreakEvenResult {
  breakEven: {
    units: number;
    revenue: number;
    contributionMargin: number;
    contributionMarginRatio: number;
  };
  marginOfSafety: {
    units: number;
    percentage: number;
    revenue: number;
  };
  targetProfit?: {
    unitsNeeded: number;
    revenueNeeded: number;
    additionalUnits: number;
  };
  sensitivity: {
    price10PercentIncrease: { units: number; revenue: number; improvement: string };
    price10PercentDecrease: { units: number; revenue: number; impact: string };
    costs10PercentIncrease: { units: number; revenue: number; impact: string };
  };
  recommendations: string[];
}

// Calculator logic extracted for testing
function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  const { fixedCosts, variableCostPerUnit, sellingPricePerUnit, currentSalesUnits, targetProfit } = input;
  
  // Contribution margin per unit
  const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
  
  // Contribution margin ratio
  const contributionMarginRatio = (contributionMargin / sellingPricePerUnit) * 100;
  
  // Break-even point in units
  const breakEvenUnits = Math.ceil(fixedCosts / contributionMargin);
  
  // Break-even revenue
  const breakEvenRevenue = breakEvenUnits * sellingPricePerUnit;
  
  // Margin of safety
  let marginOfSafety = {
    units: 0,
    percentage: 0,
    revenue: 0,
  };
  
  if (currentSalesUnits && currentSalesUnits > 0) {
    marginOfSafety.units = currentSalesUnits - breakEvenUnits;
    marginOfSafety.percentage = ((currentSalesUnits - breakEvenUnits) / currentSalesUnits) * 100;
    marginOfSafety.revenue = marginOfSafety.units * sellingPricePerUnit;
  }
  
  // Target profit analysis
  let targetProfitAnalysis;
  if (targetProfit && targetProfit > 0) {
    const unitsNeeded = Math.ceil((fixedCosts + targetProfit) / contributionMargin);
    const revenueNeeded = unitsNeeded * sellingPricePerUnit;
    const additionalUnits = unitsNeeded - breakEvenUnits;
    
    targetProfitAnalysis = {
      unitsNeeded,
      revenueNeeded,
      additionalUnits,
    };
  }
  
  // Sensitivity analysis
  const sensitivity = {
    price10PercentIncrease: {
      units: Math.ceil(fixedCosts / (contributionMargin * 1.1)),
      revenue: 0,
      improvement: '',
    },
    price10PercentDecrease: {
      units: Math.ceil(fixedCosts / (contributionMargin * 0.9)),
      revenue: 0,
      impact: '',
    },
    costs10PercentIncrease: {
      units: Math.ceil((fixedCosts * 1.1) / contributionMargin),
      revenue: 0,
      impact: '',
    },
  };
  
  sensitivity.price10PercentIncrease.revenue = sensitivity.price10PercentIncrease.units * (sellingPricePerUnit * 1.1);
  sensitivity.price10PercentDecrease.revenue = sensitivity.price10PercentDecrease.units * (sellingPricePerUnit * 0.9);
  sensitivity.costs10PercentIncrease.revenue = sensitivity.costs10PercentIncrease.units * sellingPricePerUnit;
  
  const unitsReduction = breakEvenUnits - sensitivity.price10PercentIncrease.units;
  sensitivity.price10PercentIncrease.improvement = `${unitsReduction} fewer units needed`;
  
  const unitsIncrease = sensitivity.price10PercentDecrease.units - breakEvenUnits;
  sensitivity.price10PercentDecrease.impact = `${unitsIncrease} more units needed`;
  
  const costsUnitsIncrease = sensitivity.costs10PercentIncrease.units - breakEvenUnits;
  sensitivity.costs10PercentIncrease.impact = `${costsUnitsIncrease} more units needed`;
  
  const recommendations: string[] = [];
  
  if (contributionMarginRatio < 30) {
    recommendations.push('⚠️ Low contribution margin (<30%)');
  }
  
  if (currentSalesUnits && marginOfSafety.percentage < 20) {
    recommendations.push('⚠️ Low margin of safety (<20%)');
  }
  
  return {
    breakEven: {
      units: breakEvenUnits,
      revenue: breakEvenRevenue,
      contributionMargin,
      contributionMarginRatio,
    },
    marginOfSafety,
    targetProfit: targetProfitAnalysis,
    sensitivity,
    recommendations,
  };
}

describe('Break-Even Analysis Calculator', () => {
  describe('Basic Break-Even Calculations', () => {
    it('should calculate break-even units correctly', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.units).toBe(2000); // 50000 / (50 - 25) = 2000
    });
    
    it('should calculate break-even revenue correctly', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.revenue).toBe(100000); // 2000 * 50
    });
    
    it('should round up break-even units to nearest integer', () => {
      const input: BreakEvenInput = {
        fixedCosts: 10000,
        variableCostPerUnit: 10,
        sellingPricePerUnit: 33,
      };
      
      const result = calculateBreakEven(input);
      
      // 10000 / (33 - 10) = 434.78... should round up to 435
      expect(result.breakEven.units).toBe(435);
    });
  });
  
  describe('Contribution Margin', () => {
    it('should calculate contribution margin per unit', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 30,
        sellingPricePerUnit: 100,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.contributionMargin).toBe(70); // 100 - 30
    });
    
    it('should calculate contribution margin ratio', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 30,
        sellingPricePerUnit: 100,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.contributionMarginRatio).toBe(70); // (70 / 100) * 100
    });
    
    it('should handle low contribution margin', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 90,
        sellingPricePerUnit: 100,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.contributionMarginRatio).toBe(10); // Very low
      expect(result.recommendations).toContain('⚠️ Low contribution margin (<30%)');
    });
  });
  
  describe('Margin of Safety', () => {
    it('should calculate margin of safety when current sales provided', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
        currentSalesUnits: 3000,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.marginOfSafety.units).toBe(1000); // 3000 - 2000
      expect(result.marginOfSafety.percentage).toBeCloseTo(33.33, 1); // (1000 / 3000) * 100
      expect(result.marginOfSafety.revenue).toBe(50000); // 1000 * 50
    });
    
    it('should return zero margin of safety without current sales', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.marginOfSafety.units).toBe(0);
      expect(result.marginOfSafety.percentage).toBe(0);
      expect(result.marginOfSafety.revenue).toBe(0);
    });
    
    it('should warn about low margin of safety', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
        currentSalesUnits: 2100, // Only 100 units above break-even
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.marginOfSafety.percentage).toBeCloseTo(4.76, 1); // Less than 20%
      expect(result.recommendations).toContain('⚠️ Low margin of safety (<20%)');
    });
  });
  
  describe('Target Profit Analysis', () => {
    it('should calculate units needed for target profit', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
        targetProfit: 25000,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.targetProfit?.unitsNeeded).toBe(3000); // (50000 + 25000) / 25
    });
    
    it('should calculate revenue needed for target profit', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
        targetProfit: 25000,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.targetProfit?.revenueNeeded).toBe(150000); // 3000 * 50
    });
    
    it('should calculate additional units beyond break-even', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
        targetProfit: 25000,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.targetProfit?.additionalUnits).toBe(1000); // 3000 - 2000
    });
    
    it('should not calculate target profit when not provided', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.targetProfit).toBeUndefined();
    });
  });
  
  describe('Sensitivity Analysis', () => {
    it('should calculate impact of 10% price increase', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
      };
      
      const result = calculateBreakEven(input);
      
      // With 10% price increase: contribution margin = 50*1.1 - 25 = 30
      // Break-even = 50000 / 30 = 1667 (rounded up)
      expect(result.sensitivity.price10PercentIncrease.units).toBeLessThan(result.breakEven.units);
    });
    
    it('should calculate impact of 10% price decrease', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.sensitivity.price10PercentDecrease.units).toBeGreaterThan(result.breakEven.units);
    });
    
    it('should calculate impact of 10% cost increase', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
      };
      
      const result = calculateBreakEven(input);
      
      // Fixed costs increase to 55000
      expect(result.sensitivity.costs10PercentIncrease.units).toBeGreaterThan(result.breakEven.units);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle very low variable costs (high margin)', () => {
      const input: BreakEvenInput = {
        fixedCosts: 100000,
        variableCostPerUnit: 5,
        sellingPricePerUnit: 100,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.contributionMarginRatio).toBe(95);
      expect(result.breakEven.units).toBe(1053); // 100000 / 95 = 1052.63...
    });
    
    it('should handle very high variable costs (low margin)', () => {
      const input: BreakEvenInput = {
        fixedCosts: 100000,
        variableCostPerUnit: 95,
        sellingPricePerUnit: 100,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.contributionMarginRatio).toBe(5);
      expect(result.breakEven.units).toBe(20000); // Need many units!
    });
    
    it('should handle zero fixed costs', () => {
      const input: BreakEvenInput = {
        fixedCosts: 0,
        variableCostPerUnit: 25,
        sellingPricePerUnit: 50,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.units).toBe(0);
      expect(result.breakEven.revenue).toBe(0);
    });
    
    it('should handle large numbers', () => {
      const input: BreakEvenInput = {
        fixedCosts: 10000000,
        variableCostPerUnit: 50,
        sellingPricePerUnit: 150,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.units).toBe(100000);
      expect(result.breakEven.revenue).toBe(15000000);
    });
  });
  
  describe('Real-World Scenarios', () => {
    it('should handle restaurant scenario', () => {
      const input: BreakEvenInput = {
        fixedCosts: 30000, // Rent, salaries, utilities
        variableCostPerUnit: 8, // Food cost per meal
        sellingPricePerUnit: 20, // Average meal price
        currentSalesUnits: 3500, // Meals per month
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.units).toBe(2500);
      expect(result.breakEven.contributionMarginRatio).toBe(60); // Good for restaurants
      expect(result.marginOfSafety.percentage).toBeCloseTo(28.57, 1); // Healthy margin
    });
    
    it('should handle SaaS product scenario', () => {
      const input: BreakEvenInput = {
        fixedCosts: 50000, // Salaries, infrastructure
        variableCostPerUnit: 5, // Very low per-customer cost
        sellingPricePerUnit: 99, // Monthly subscription
        currentSalesUnits: 800, // Customers
        targetProfit: 50000, // Target monthly profit
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.units).toBe(532); // Low break-even for SaaS
      expect(result.breakEven.contributionMarginRatio).toBeCloseTo(94.95, 1); // Excellent margins
      expect(result.targetProfit?.unitsNeeded).toBe(1064); // Units for $50k profit
    });
    
    it('should handle manufacturing scenario', () => {
      const input: BreakEvenInput = {
        fixedCosts: 200000, // Factory overhead, equipment
        variableCostPerUnit: 45, // Materials, direct labor
        sellingPricePerUnit: 75, // Wholesale price
        currentSalesUnits: 8000,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.units).toBe(6667);
      expect(result.breakEven.contributionMarginRatio).toBe(40); // Typical for manufacturing
      expect(result.marginOfSafety.percentage).toBeCloseTo(16.66, 1);
    });
  });
  
  describe('Input Validation Scenarios', () => {
    it('should handle decimal inputs correctly', () => {
      const input: BreakEvenInput = {
        fixedCosts: 12345.67,
        variableCostPerUnit: 23.45,
        sellingPricePerUnit: 45.99,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.contributionMargin).toBeCloseTo(22.54, 2);
      expect(result.breakEven.units).toBeGreaterThan(0);
    });
    
    it('should calculate correctly with minimal margin', () => {
      const input: BreakEvenInput = {
        fixedCosts: 10000,
        variableCostPerUnit: 99,
        sellingPricePerUnit: 100,
      };
      
      const result = calculateBreakEven(input);
      
      expect(result.breakEven.units).toBe(10000); // Need 10,000 units with $1 margin!
      expect(result.recommendations).toContain('⚠️ Low contribution margin (<30%)');
    });
  });
});

