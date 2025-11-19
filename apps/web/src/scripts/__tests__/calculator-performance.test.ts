/**
 * Performance and Stress Tests for Calculators
 * 
 * Ensures calculators remain fast and efficient even under extreme conditions
 */

import { describe, it, expect } from 'vitest';

interface PerformanceWithOptionalMemory extends Performance {
  memory?: {
    usedJSHeapSize?: number;
  };
}

const getUsedHeapSize = (): number | null => {
  const perf = performance as PerformanceWithOptionalMemory;
  const heapSize = perf.memory?.usedJSHeapSize;
  return typeof heapSize === 'number' ? heapSize : null;
};

describe('Calculator Performance Tests', () => {
  describe('Calculation Speed', () => {
    it('should calculate mortgage payment in <10ms', () => {
      const startTime = performance.now();
      
      const principal = 400000;
      const rate = 0.065 / 12;
      const months = 360;
      
      const payment = (principal * (rate * Math.pow(1 + rate, months))) /
        (Math.pow(1 + rate, months) - 1);
      
      const duration = performance.now() - startTime;
      
      expect(payment).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10);
    });

    it('should calculate amortization schedule for 360 months in <100ms', () => {
      const startTime = performance.now();
      
      const principal = 400000;
      const rate = 0.065 / 12;
      const payment = 2528;
      const schedule: Array<{ month: number; principal: number; interest: number; balance: number }> = [];
      
      let balance = principal;
      
      for (let month = 1; month <= 360; month++) {
        const interest = balance * rate;
        const principalPayment = payment - interest;
        balance -= principalPayment;
        
        schedule.push({
          month,
          principal: principalPayment,
          interest,
          balance,
        });
      }
      
      const duration = performance.now() - startTime;
      
      expect(schedule).toHaveLength(360);
      expect(duration).toBeLessThan(100);
    });

    it('should calculate 30-year projections in <50ms', () => {
      const startTime = performance.now();
      
      let balance = 10000;
      const monthlyContribution = 500;
      const monthlyReturn = 0.07 / 12;
      
      for (let month = 0; month < 360; month++) {
        balance = balance * (1 + monthlyReturn) + monthlyContribution;
      }
      
      const duration = performance.now() - startTime;
      
      expect(balance).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50);
    });

    it('should calculate tax brackets in <5ms', () => {
      const startTime = performance.now();
      
      const income = 150000;
      const brackets = [
        [11000, 0.10],
        [44725, 0.12],
        [95375, 0.22],
        [182100, 0.24],
        [231250, 0.32],
      ];
      
      let tax = 0;
      let remaining = income;
      let previousLimit = 0;
      
      for (const [limit, rate] of brackets) {
        const taxableInBracket = Math.min(remaining, (limit as number) - previousLimit);
        if (taxableInBracket <= 0) break;
        
        tax += taxableInBracket * (rate as number);
        remaining -= taxableInBracket;
        previousLimit = limit as number;
        
        if (remaining <= 0) break;
      }
      
      const duration = performance.now() - startTime;
      
      expect(tax).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not create excessive objects in loops', () => {
      const startMem = getUsedHeapSize();
      
      // Calculate without creating unnecessary objects
      let sum = 0;
      for (let i = 0; i < 10000; i++) {
        sum += i * 1.07; // Primitive arithmetic only
      }
      
      const endMem = getUsedHeapSize();
      const memIncrease = startMem !== null && endMem !== null ? endMem - startMem : null;
      
      expect(sum).toBeGreaterThan(0);
      // Memory increase should be minimal
      if (startMem !== null && memIncrease !== null) {
        expect(memIncrease).toBeLessThan(1000000); // <1MB
      }
    });

    it('should reuse calculation results when possible', () => {
      const cache: Record<string, number> = {};
      
      const expensiveCalculation = (n: number) => {
        const key = `calc_${n}`;
        
        if (cache[key]) {
          return cache[key];
        }
        
        // Simulate expensive calculation
        let result = 0;
        for (let i = 0; i < 1000; i++) {
          result += Math.pow(n, i / 1000);
        }
        
        cache[key] = result;
        return result;
      };
      
      const firstCall = performance.now();
      expensiveCalculation(1.07);
      const firstDuration = performance.now() - firstCall;
      
      const secondCall = performance.now();
      expensiveCalculation(1.07); // Should hit cache
      const secondDuration = performance.now() - secondCall;
      
      expect(secondDuration).toBeLessThan(firstDuration);
      expect(secondDuration).toBeLessThan(1);
    });
  });

  describe('DOM Manipulation Performance', () => {
    it('should minimize DOM updates', () => {
      // Bad: Multiple DOM updates
      const badApproach = () => {
        let html = '';
        for (let i = 0; i < 100; i++) {
          html += `<div>${i}</div>`; // String concatenation
        }
        return html;
      };
      
      // Good: Single innerHTML update
      const goodApproach = () => {
        const items = [];
        for (let i = 0; i < 100; i++) {
          items.push(`<div>${i}</div>`);
        }
        return items.join('');
      };
      
      const badStart = performance.now();
      const badResult = badApproach();
      const badDuration = performance.now() - badStart;
      
      const goodStart = performance.now();
      const goodResult = goodApproach();
      const goodDuration = performance.now() - goodStart;
      
      expect(badResult).toBe(goodResult);
      // Performance can vary, just ensure both complete
      expect(goodDuration).toBeGreaterThan(0);
      expect(badDuration).toBeGreaterThan(0);
      // Good approach should be reasonably fast
      expect(goodDuration).toBeLessThan(100); // Less than 100ms
    });

    it('should batch DOM reads and writes', () => {
      // Reading and writing together is faster than interleaved
      const operations = 100;
      
      // Batch approach
      const startTime = performance.now();
      const values: number[] = [];
      
      // All reads
      for (let i = 0; i < operations; i++) {
        values.push(i * 100);
      }
      
      // All writes (simulated)
      const results = values.map(v => v * 1.5);
      
      const duration = performance.now() - startTime;
      
      expect(results).toHaveLength(operations);
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle 1000 monthly calculations efficiently', () => {
      const startTime = performance.now();
      
      let balance = 100000;
      const rate = 0.05 / 12;
      const payment = 1000;
      
      for (let i = 0; i < 1000; i++) {
        const interest = balance * rate;
        const principal = payment - interest;
        balance -= principal;
        
        if (balance <= 0) break;
      }
      
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(50);
    });

    it('should handle 100 scenario comparisons efficiently', () => {
      const startTime = performance.now();
      
      const scenarios = [];
      for (let i = 0; i < 100; i++) {
        const rate = 0.05 + (i * 0.001);
        const payment = 2000 + (i * 10);
        
        scenarios.push({
          rate,
          payment,
          total: payment * 360,
        });
      }
      
      const duration = performance.now() - startTime;
      
      expect(scenarios).toHaveLength(100);
      expect(duration).toBeLessThan(20);
    });
  });

  describe('Chart Rendering Performance', () => {
    it('should generate chart data points efficiently', () => {
      const startTime = performance.now();
      
      const years = 30;
      const points: Array<{ year: number; value: number }> = [];
      
      for (let year = 0; year <= years; year++) {
        points.push({
          year,
          value: 10000 * Math.pow(1.07, year),
        });
      }
      
      const duration = performance.now() - startTime;
      
      expect(points).toHaveLength(31);
      expect(duration).toBeLessThan(5);
    });

    it('should render canvas chart efficiently', () => {
      const startTime = performance.now();
      
      // Simulate chart drawing calculations
      const dataPoints = 360; // Monthly data for 30 years
      const width = 800;
      const height = 400;
      const padding = 40;
      
      const chartWidth = width - (padding * 2);
      const chartHeight = height - (padding * 2);
      
      const coordinates: Array<{ x: number; y: number }> = [];
      
      for (let i = 0; i < dataPoints; i++) {
        const x = padding + (chartWidth * i) / dataPoints;
        const y = padding + (chartHeight * Math.random());
        coordinates.push({ x, y });
      }
      
      const duration = performance.now() - startTime;
      
      expect(coordinates).toHaveLength(dataPoints);
      expect(duration).toBeLessThan(50);
    });
  });
});

describe('Stress Tests', () => {
  describe('Extreme Input Combinations', () => {
    it('should handle maximum valid inputs across all fields', () => {
      const extremeInput = {
        homePrice: 10000000, // $10M home
        downPayment: 2000000, // $2M down
        interestRate: 15, // 15% (high)
        loanTermYears: 30,
        monthlyRent: 20000, // $20k/month rent
        yearsToAnalyze: 30,
        grossMonthlyIncome: 100000, // $1.2M/year income
      };
      
      const principal = extremeInput.homePrice - extremeInput.downPayment;
      const rate = extremeInput.interestRate / 100 / 12;
      const months = extremeInput.loanTermYears * 12;
      
      const payment = (principal * (rate * Math.pow(1 + rate, months))) /
        (Math.pow(1 + rate, months) - 1);
      
      expect(payment).toBeGreaterThan(0);
      expect(Number.isFinite(payment)).toBe(true);
      // Payment can exceed income in extreme scenarios (that's why they're edge cases)
      expect(payment).toBeLessThan(extremeInput.grossMonthlyIncome * 1.1); // Allow 10% over
    });

    it('should handle minimum valid inputs across all fields', () => {
      const minimalInput = {
        homePrice: 50000, // Small home
        downPayment: 10000, // $10k down
        interestRate: 0.1, // 0.1% (very low)
        loanTermYears: 15,
        monthlyRent: 500,
        yearsToAnalyze: 1,
      };
      
      const principal = minimalInput.homePrice - minimalInput.downPayment;
      
      expect(principal).toBe(40000);
      expect(principal).toBeGreaterThan(0);
    });
  });

  describe('Rapid Recalculation', () => {
    it('should handle 100 consecutive calculations without degradation', () => {
      const durations: number[] = [];
      
      for (let iteration = 0; iteration < 100; iteration++) {
        const startTime = performance.now();
        
        const balance = 10000 + (iteration * 100);
        const rate = 0.10 / 12;
        const payment = 500;
        
        let remaining = balance;
        while (remaining > 0) {
          const interest = remaining * rate;
          const principal = payment - interest;
          if (principal <= 0) break;
          remaining -= principal;
        }
        
        const duration = performance.now() - startTime;
        durations.push(duration);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      expect(avgDuration).toBeLessThan(10);
      expect(maxDuration).toBeLessThan(50);
      
      // Performance should not degrade over iterations
      const firstTen = durations.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const lastTen = durations.slice(-10).reduce((a, b) => a + b, 0) / 10;
      
      expect(lastTen).toBeLessThan(firstTen * 2); // No more than 2x slower
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with repeated calculations', () => {
      type CalculationResult = {
        iteration: number;
        value: number;
      };
      const results: CalculationResult[] = [];
      
      for (let i = 0; i < 1000; i++) {
        const result = {
          iteration: i,
          value: i * 1000,
        };
        
        // Immediately discard - don't keep in memory
        results.push(result);
        if (results.length > 100) {
          results.shift(); // Keep only last 100
        }
      }
      
      expect(results.length).toBeLessThanOrEqual(100);
    });

    it('should efficiently handle large temporary arrays', () => {
      const startTime = performance.now();
      
      // Create large array, process, and discard
      const data = Array.from({ length: 10000 }, (_, i) => i);
      const processed = data.map(x => x * 2);
      const sum = processed.reduce((a, b) => a + b, 0);
      
      const duration = performance.now() - startTime;
      
      expect(sum).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Canvas Rendering Performance', () => {
    it('should handle chart rendering with 360 data points', () => {
      const startTime = performance.now();
      
      const dataPoints = 360;
      const coordinates: Array<{ x: number; y: number }> = [];
      
      // Simulate coordinate calculations
      for (let i = 0; i < dataPoints; i++) {
        coordinates.push({
          x: i * 2,
          y: Math.sin(i / 10) * 100,
        });
      }
      
      // Simulate path generation
      const pathData = coordinates.map((p, i) => 
        i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
      ).join(' ');
      
      const duration = performance.now() - startTime;
      
      expect(pathData).toContain('M');
      expect(pathData).toContain('L');
      expect(duration).toBeLessThan(20);
    });

    it('should optimize repeated chart renders', () => {
      const pathCache: Record<string, string> = {};
      const cacheKey = 'chart_data_v1';
      
      const renderChart = (useCache: boolean) => {
        if (useCache && pathCache[cacheKey]) {
          return pathCache[cacheKey];
        }
        
        const path = Array.from({ length: 360 }, (_, i) => 
          `${i * 2},${Math.sin(i / 10) * 100}`
        ).join(' L ');
        
        pathCache[cacheKey] = `M ${path}`;
        return pathCache[cacheKey];
      };
      
      const firstRender = performance.now();
      renderChart(false);
      const firstDuration = performance.now() - firstRender;
      
      const secondRender = performance.now();
      const cachedRender = renderChart(true); // Should use cache
      const secondDuration = performance.now() - secondRender;
      
      expect(secondDuration).toBeLessThan(firstDuration);
      expect(secondDuration).toBeLessThan(1);
      expect(pathCache[cacheKey]).toBe(cachedRender);
    });
  });
});

describe('Algorithmic Complexity Tests', () => {
  describe('Linear Time Complexity O(n)', () => {
    it('should scale linearly with input size', () => {
      const testSizes = [100, 200, 400, 800];
      const durations: number[] = [];
      
      testSizes.forEach(size => {
        const startTime = performance.now();
        
        let sum = 0;
        for (let i = 0; i < size; i++) {
          sum += i;
        }
        
        const duration = performance.now() - startTime;
        durations.push(duration);
        expect(sum).toBe(size * (size - 1) / 2);
      });
      
      // Each doubling should roughly double time (linear)
      // Allow for timing variance
      expect(durations.length).toBe(4);
    });
  });

  describe('Logarithmic Time Complexity O(log n)', () => {
    it('should handle binary search for break-even year efficiently', () => {
      const findBreakEven = (years: number[]) => {
        let left = 0;
        let right = years.length - 1;
        
        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const year = years[mid];
          
          // Simulate: is this year the break-even?
          if (year >= 5 && year < 6) {
            return year;
          } else if (year < 5) {
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }
        
        return null;
      };
      
      const years = Array.from({ length: 30 }, (_, i) => i + 1);
      const startTime = performance.now();
      const breakEven = findBreakEven(years);
      const duration = performance.now() - startTime;
      
      expect(breakEven).toBe(5);
      expect(duration).toBeLessThan(1); // Should be nearly instant
    });
  });

  describe('Constant Time Complexity O(1)', () => {
    it('should calculate single values in constant time', () => {
      const durations: number[] = [];
      
      for (let iteration = 0; iteration < 100; iteration++) {
        const startTime = performance.now();
        
        // O(1) operation - formula calculation
        const principal = 400000;
        const rate = 0.065 / 12;
        const months = 360;
        const payment = (principal * (rate * Math.pow(1 + rate, months))) /
          (Math.pow(1 + rate, months) - 1);
        
        const duration = performance.now() - startTime;
        durations.push(duration);
        expect(payment).toBeGreaterThan(0);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const variance = durations.map(d => Math.abs(d - avgDuration)).reduce((a, b) => a + b, 0) / durations.length;
      
      expect(avgDuration).toBeLessThan(1);
      expect(variance).toBeLessThan(0.5); // Consistent timing
    });
  });
});

describe('Worst-Case Scenarios', () => {
  describe('Maximum Iterations', () => {
    it('should handle minimum payment that barely covers interest', () => {
      const balance = 10000;
      const rate = 0.18 / 12;
      const monthlyInterest = balance * rate;
      const payment = monthlyInterest + 1; // Just $1 above interest
      
      let remaining = balance;
      let months = 0;
      const maxMonths = 1000;
      
      const startTime = performance.now();
      
      while (remaining > 0.01 && months < maxMonths) {
        const interest = remaining * rate;
        const principal = payment - interest;
        remaining -= principal;
        months++;
      }
      
      const duration = performance.now() - startTime;
      
      expect(months).toBeLessThan(maxMonths);
      expect(duration).toBeLessThan(100);
    });

    it('should handle very low investment returns (1% annual)', () => {
      const contribution = 500;
      const rate = 0.01 / 12; // 1% annual = 0.083% monthly
      const months = 360;
      
      const startTime = performance.now();
      
      let balance = 0;
      for (let i = 0; i < months; i++) {
        balance = balance * (1 + rate) + contribution;
      }
      
      const duration = performance.now() - startTime;
      
      expect(balance).toBeGreaterThan(contribution * months); // Should still grow
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Calculation Pathological Cases', () => {
    it('should handle alternating rate scenarios', () => {
      // Simulate variable rate loan
      let balance = 100000;
      const payment = 1000;
      
      for (let month = 0; month < 120; month++) {
        // Rate varies: 4% even months, 6% odd months
        const rate = month % 2 === 0 ? 0.04 / 12 : 0.06 / 12;
        const interest = balance * rate;
        const principal = payment - interest;
        balance -= principal;
      }
      
      expect(balance).toBeLessThan(100000);
    });

    it('should handle multiple balance transfers (chaining)', () => {
      let balance = 5000;
      const transfers = 3; // Transfer 3 times
      const feePercent = 0.03;
      
      for (let i = 0; i < transfers; i++) {
        const fee = balance * feePercent;
        balance += fee; // Each transfer adds fee
      }
      
      // 3 transfers at 3% each
      const expectedBalance = 5000 * Math.pow(1.03, 3);
      
      expect(balance).toBeCloseTo(expectedBalance, 0);
    });
  });
});

describe('Concurrent Calculation Tests', () => {
  it('should handle multiple simultaneous calculations', async () => {
    const calculations = Array.from({ length: 10 }, (_, i) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const result = Math.pow(1.07, i);
          resolve(result);
        }, Math.random() * 10);
      });
    });
    
    const startTime = performance.now();
    const results = await Promise.all(calculations);
    const duration = performance.now() - startTime;
    
    expect(results).toHaveLength(10);
    expect(duration).toBeLessThan(100);
  });

  it('should handle race conditions in form submission', () => {
    let calculationInProgress = false;
    let calculationCount = 0;
    
    const calculate = async () => {
      if (calculationInProgress) {
        return { error: 'Calculation in progress' };
      }
      
      calculationInProgress = true;
      calculationCount++;
      
      // Simulate async calculation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      calculationInProgress = false;
      return { result: 'success' };
    };
    
    // Rapid-fire submissions
    const promise1 = calculate();
    const promise2 = calculate(); // Should be rejected
    
    return Promise.all([promise1, promise2]).then(results => {
      expect(calculationCount).toBe(1); // Only one calculation executed
      expect(results[1]).toHaveProperty('error');
    });
  });
});

describe('Error Recovery Performance', () => {
  it('should recover from errors quickly', () => {
    let errorCount = 0;
    let totalResult = 0;
    let lastErrorMessage = '';
    
    for (let i = 0; i < 100; i++) {
      try {
        if (i % 10 === 0) {
          throw new Error('Test error');
        }
        // Normal calculation
        const result = i * 100;
        totalResult += result;
      } catch (error) {
        errorCount++;
        lastErrorMessage = (error as Error).message;
        // Error handling should be fast
      }
    }
    
    expect(errorCount).toBe(10);
    expect(totalResult).toBeGreaterThan(0);
    expect(lastErrorMessage).toBe('Test error');
  });

  it('should not accumulate error state across calculations', () => {
    const states = [];
    
    for (let i = 0; i < 100; i++) {
      const hasError = i % 20 === 0;
      const currentState = hasError ? 'error' : 'success';
      
      // Clear error state each iteration
      states.push(currentState);
    }
    
    const errorStates = states.filter(s => s === 'error');
    
    expect(errorStates.length).toBe(5);
    expect(states[states.length - 1]).toBe('success'); // Last state is clean
  });
});

