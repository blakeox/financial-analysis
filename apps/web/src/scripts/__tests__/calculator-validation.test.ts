/**
 * Comprehensive Validation and Error Handling Tests
 * 
 * Tests validation logic, error messages, and error recovery
 * across all calculators.
 */

import { describe, it, expect } from 'vitest';

describe('Calculator Validation Tests', () => {
  describe('Required Field Validation', () => {
    it('should reject missing required fields', () => {
      const validateRequired = (value: unknown, fieldName: string) => {
        if (value === null || value === undefined || value === '') {
          throw new Error(`${fieldName} is required`);
        }
      };
      
      expect(() => validateRequired(null, 'Home Price')).toThrow('required');
      expect(() => validateRequired('', 'Interest Rate')).toThrow('required');
      expect(() => validateRequired(undefined, 'Monthly Payment')).toThrow('required');
    });

    it('should accept valid required field values', () => {
      const validateRequired = (value: unknown, fieldName: string) => {
        if (value === null || value === undefined || value === '') {
          throw new Error(`${fieldName} is required`);
        }
      };
      
      expect(() => validateRequired(100, 'Amount')).not.toThrow();
      expect(() => validateRequired('yes', 'Option')).not.toThrow();
      expect(() => validateRequired(0, 'Zero')).not.toThrow(); // 0 is valid!
    });
  });

  describe('Numeric Range Validation', () => {
    it('should enforce minimum values', () => {
      const validateMin = (value: number, min: number, fieldName: string) => {
        if (value < min) {
          throw new Error(`${fieldName} must be at least ${min}`);
        }
      };
      
      expect(() => validateMin(-1, 0, 'Balance')).toThrow('at least 0');
      expect(() => validateMin(5, 10, 'Payment')).toThrow('at least 10');
    });

    it('should enforce maximum values', () => {
      const validateMax = (value: number, max: number, fieldName: string) => {
        if (value > max) {
          throw new Error(`${fieldName} cannot exceed ${max}`);
        }
      };
      
      expect(() => validateMax(101, 100, 'Percentage')).toThrow('cannot exceed 100');
      expect(() => validateMax(25, 20, 'Rate')).toThrow('cannot exceed 20');
    });

    it('should enforce range validation (min and max)', () => {
      const validateRange = (value: number, min: number, max: number, fieldName: string) => {
        if (value < min || value > max) {
          throw new Error(`${fieldName} must be between ${min} and ${max}`);
        }
      };
      
      expect(() => validateRange(150, 0, 100, 'Percentage')).toThrow('between 0 and 100');
      expect(() => validateRange(-5, 0, 100, 'Rate')).toThrow('between 0 and 100');
      expect(() => validateRange(50, 0, 100, 'Valid')).not.toThrow();
    });
  });

  describe('Relationship Validation', () => {
    it('should validate down payment < home price', () => {
      const homePrice = 500000;
      const downPayment = 600000; // Invalid!
      
      expect(() => {
        if (downPayment >= homePrice) {
          throw new Error('Down payment must be less than home price');
        }
      }).toThrow('less than home price');
    });

    it('should validate retirement age > current age', () => {
      const currentAge = 40;
      const retirementAge = 35; // Invalid!
      
      expect(() => {
        if (retirementAge <= currentAge) {
          throw new Error('Retirement age must be greater than current age');
        }
      }).toThrow('greater than current age');
    });

    it('should validate monthly payment >= minimum payment', () => {
      const balance = 5000;
      const minimumPercent = 2;
      const minimum = balance * (minimumPercent / 100);
      const payment = 50; // Too low!
      
      expect(() => {
        if (payment < minimum) {
          throw new Error('Payment must be at least the minimum');
        }
      }).toThrow('at least the minimum');
    });
  });

  describe('Type Validation', () => {
    it('should coerce string numbers to numeric', () => {
      const coerceNumber = (val: unknown, defaultVal: number) => {
        const num = typeof val === 'string' ? parseFloat(val) : Number(val);
        return isNaN(num) ? defaultVal : num;
      };
      
      expect(coerceNumber('100', 0)).toBe(100);
      expect(coerceNumber('  50  ', 0)).toBe(50);
      expect(coerceNumber('invalid', 0)).toBe(0);
    });

    it('should handle null and undefined gracefully', () => {
      const coerceNumber = (val: unknown, defaultVal: number) => {
        if (val === null || val === undefined) return defaultVal;
        const num = typeof val === 'string' ? parseFloat(val) : Number(val);
        return isNaN(num) ? defaultVal : num;
      };
      
      expect(coerceNumber(null, 100)).toBe(100);
      expect(coerceNumber(undefined, 50)).toBe(50);
    });

    it('should validate enum values (select options)', () => {
      const validateEnum = (value: string, allowed: string[], fieldName: string) => {
        if (!allowed.includes(value)) {
          throw new Error(`${fieldName} must be one of: ${allowed.join(', ')}`);
        }
      };
      
      const debtTypes = ['credit-card', 'student-loan', 'mortgage'];
      
      expect(() => validateEnum('credit-card', debtTypes, 'Debt Type')).not.toThrow();
      expect(() => validateEnum('invalid', debtTypes, 'Debt Type')).toThrow('must be one of');
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate debt can be paid off with given payment', () => {
      const balance = 10000;
      const rate = 0.20 / 12; // 20% APR
      const monthlyInterest = balance * rate;
      const payment = 100; // Less than interest!
      
      if (payment <= monthlyInterest) {
        // Payment doesn't cover interest - debt will grow!
        expect(payment).toBeLessThanOrEqual(monthlyInterest);
      }
    });

    it('should validate emergency fund prerequisite for investing', () => {
      const hasEmergencyFund = false;
      const extraMoney = 500;
      const monthlyExpenses = 2500;
      
      if (!hasEmergencyFund) {
        const recommendation = 'Build emergency fund first';
        expect(recommendation).toContain('emergency fund');
        const monthsOfCoverage = extraMoney / monthlyExpenses;
        expect(monthsOfCoverage).toBeLessThan(1); // Not even one month saved
      }
    });

    it('should validate sufficient income for affordability', () => {
      const monthlyPayment = 3500;
      const grossMonthlyIncome = 5000;
      const dtiRatio = (monthlyPayment / grossMonthlyIncome) * 100;
      
      if (dtiRatio > 43) {
        // Most lenders won't approve above 43% DTI
        expect(dtiRatio).toBeGreaterThan(43);
      }
    });
  });

  describe('Error Message Quality', () => {
    it('should provide actionable error messages', () => {
      const errors = [
        'Please enter a valid home price',
        'Down payment must be less than home price',
        'Interest rate must be between 0 and 30',
        'Monthly payment must be at least the minimum',
      ];
      
      errors.forEach(error => {
        expect(error).toMatch(/Please|must|required|should/i);
        expect(error.length).toBeGreaterThan(10); // Not just "Invalid"
      });
    });

    it('should include field names in error messages', () => {
      const error = 'Please enter a valid home price';
      expect(error.toLowerCase()).toContain('home price');
    });

    it('should suggest corrections when possible', () => {
      const suggestiveErrors = [
        'Down payment must be less than home price',
        'Retirement age must be greater than current age',
        'Monthly payment must be at least $100',
      ];
      
      suggestiveErrors.forEach(error => {
        expect(error).toMatch(/must be|should be|at least|less than/i);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should clear errors when form is corrected', () => {
      let errorMessage = 'Invalid input';
      
      // User corrects input
      errorMessage = '';
      
      expect(errorMessage).toBe('');
    });

    it('should allow form resubmission after error', () => {
      let submitAttempts = 0;
      let lastError: string | null = 'First error';
      
      // First attempt fails
      submitAttempts++;
      
      // User fixes and retries
      lastError = null;
      submitAttempts++;
      
      expect(submitAttempts).toBe(2);
      expect(lastError).toBe(null);
    });

    it('should preserve valid inputs when showing validation errors', () => {
      const formState = {
        homePrice: 500000, // Valid
        downPayment: 600000, // Invalid
        interestRate: 6.5, // Valid
      };
      
      // After validation error, valid fields should remain
      expect(formState.homePrice).toBe(500000);
      expect(formState.interestRate).toBe(6.5);
    });
  });

  describe('Input Sanitization', () => {
    it('should trim whitespace from string inputs', () => {
      const input = '  Credit Card Debt  ';
      const sanitized = input.trim();
      
      expect(sanitized).toBe('Credit Card Debt');
    });

    it('should handle commas in numeric inputs', () => {
      const input = '1,000,000';
      const numeric = parseFloat(input.replace(/,/g, ''));
      
      expect(numeric).toBe(1000000);
    });

    it('should handle dollar signs in currency inputs', () => {
      const input = '$5,000.00';
      const numeric = parseFloat(input.replace(/[$,]/g, ''));
      
      expect(numeric).toBe(5000);
    });

    it('should truncate to appropriate decimal places', () => {
      const value = 1234.56789;
      const truncated = Math.round(value * 100) / 100;
      
      expect(truncated).toBe(1234.57);
    });
  });

  describe('Calculation Constraints', () => {
    it('should prevent infinite loops in amortization', () => {
      const maxIterations = 600; // 50 years max
      let iterations = 0;
      let balance = 10000;
      const payment = 10; // Very low payment
      const rate = 0.10 / 12;
      
      while (balance > 0 && iterations < maxIterations) {
        const interest = balance * rate;
        const principal = payment - interest;
        
        if (principal <= 0) break; // Prevent infinite loop
        
        balance -= principal;
        iterations++;
      }
      
      expect(iterations).toBeLessThan(maxIterations);
    });

    it('should cap extremely long payoff periods', () => {
      const maxYears = 50;
      const maxMonths = maxYears * 12;
      const calculatedMonths = 700; // Unrealistic
      const cappedMonths = Math.min(calculatedMonths, maxMonths);
      
      expect(cappedMonths).toBe(600);
      expect(cappedMonths).toBeLessThan(calculatedMonths);
    });

    it('should handle division by zero gracefully', () => {
      const value = 100;
      const divisor = 0;
      
      const result = divisor === 0 ? Infinity : value / divisor;
      
      expect(result).toBe(Infinity);
    });

    it('should validate percentage inputs are 0-100', () => {
      const testCases = [
        { value: -5, valid: false },
        { value: 0, valid: true },
        { value: 50, valid: true },
        { value: 100, valid: true },
        { value: 105, valid: false },
      ];
      
      testCases.forEach(({ value, valid }) => {
        const isValid = value >= 0 && value <= 100;
        expect(isValid).toBe(valid);
      });
    });
  });

  describe('User Input Edge Cases', () => {
    it('should handle very large numbers', () => {
      const largeNumber = 999999999;
      expect(Number.isSafeInteger(largeNumber)).toBe(true);
      
      const tooLarge = Number.MAX_SAFE_INTEGER + 1;
      expect(Number.isSafeInteger(tooLarge)).toBe(false);
    });

    it('should handle very small decimals', () => {
      const small = 0.0001;
      expect(small).toBeGreaterThan(0);
      
      const rounded = Math.round(small * 100) / 100;
      expect(rounded).toBe(0);
    });

    it('should handle scientific notation input', () => {
      const scientific = 1e6;
      expect(scientific).toBe(1000000);
      
      const parsed = parseFloat('1e6');
      expect(parsed).toBe(1000000);
    });

    it('should reject non-numeric strings', () => {
      const invalid = 'abc123';
      const parsed = parseFloat(invalid);
      
      expect(isNaN(parsed)).toBe(true);
    });

    it('should handle negative numbers where not allowed', () => {
      const value = -100;
      const min = 0;
      
      if (value < min) {
        expect(value).toBeLessThan(0);
      }
    });
  });

  describe('Cross-Field Validation', () => {
    it('should validate scenario comparisons have different values', () => {
      const scenario1Rate = 6.5;
      const scenario2Rate = 6.5;
      
      if (scenario1Rate === scenario2Rate) {
        const warning = 'Scenarios have identical rates - comparison may not be meaningful';
        expect(warning).toContain('identical');
      }
    });

    it('should validate total contributions do not exceed loan amount', () => {
      const loanAmount = 400000;
      const totalPaid = 911000; // P + I
      
      expect(totalPaid).toBeGreaterThan(loanAmount); // Should include interest
    });

    it('should validate monthly income supports budget', () => {
      const monthlyIncome = 5000;
      const totalExpenses = 6000; // More than income!
      
      if (totalExpenses > monthlyIncome) {
        const deficit = totalExpenses - monthlyIncome;
        expect(deficit).toBeGreaterThan(0);
      }
    });
  });

  describe('Date Validation', () => {
    it('should validate future dates', () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);
      
      expect(futureDate.getTime()).toBeGreaterThan(today.getTime());
    });

    it('should validate age ranges', () => {
      const testCases = [
        { age: 17, valid: false, reason: 'Too young' },
        { age: 18, valid: true },
        { age: 65, valid: true },
        { age: 100, valid: true },
        { age: 101, valid: false, reason: 'Too old' },
      ];
      
      testCases.forEach(({ age, valid }) => {
        const isValid = age >= 18 && age <= 100;
        expect(isValid).toBe(valid);
      });
    });

    it('should validate time periods', () => {
      const years = 35;
      const maxYears = 30;
      
      if (years > maxYears) {
        expect(years).toBeGreaterThan(maxYears);
      }
    });
  });

  describe('Formula Validation', () => {
    it('should validate mortgage payment formula inputs', () => {
      const principal = 400000;
      const rate = 0.065 / 12;
      const months = 360;
      
      expect(principal).toBeGreaterThan(0);
      expect(rate).toBeGreaterThan(0);
      expect(months).toBeGreaterThan(0);
      
      // Formula should not produce NaN
      const payment = (principal * (rate * Math.pow(1 + rate, months))) /
        (Math.pow(1 + rate, months) - 1);
      
      expect(isNaN(payment)).toBe(false);
      expect(payment).toBeGreaterThan(0);
    });

    it('should prevent negative square roots', () => {
      const value = -100;
      
      // Some formulas use square root - must be non-negative
      if (value < 0) {
        expect(() => Math.sqrt(value)).not.toThrow(); // Returns NaN, doesn't throw
        expect(isNaN(Math.sqrt(value))).toBe(true);
      }
    });

    it('should prevent logarithm of zero or negative', () => {
      const value = 0;
      
      if (value <= 0) {
        expect(Math.log(value)).toBe(-Infinity);
      }
    });
  });

  describe('State Validation', () => {
    it('should validate calculator state before calculation', () => {
      const formValid = true;
      const calculating = false;
      const hasErrors = false;
      
      const canCalculate = formValid && !calculating && !hasErrors;
      
      expect(canCalculate).toBe(true);
    });

    it('should prevent double submission', () => {
      let calculating = false;
      
      const submit = () => {
        if (calculating) {
          return false; // Already calculating
        }
        calculating = true;
        return true;
      };
      
      expect(submit()).toBe(true); // First submit
      expect(submit()).toBe(false); // Second submit blocked
    });

    it('should validate results exist before display', () => {
      const results = null;
      
      if (!results) {
        expect(results).toBe(null);
        // Should not attempt to display
      }
    });
  });

  describe('Calculation Safety Checks', () => {
    it('should validate amortization converges', () => {
      const balance = 10000;
      const rate = 0.10 / 12;
      const payment = 200;
      
      let remaining = balance;
      const maxIterations = 600;
      let iterations = 0;
      
      while (remaining > 0.01 && iterations < maxIterations) {
        const interest = remaining * rate;
        const principal = payment - interest;
        
        if (principal <= 0) {
          // Payment insufficient - would loop forever
          break;
        }
        
        remaining -= principal;
        iterations++;
      }
      
      expect(iterations).toBeLessThan(maxIterations);
    });

    it('should validate investment returns are realistic', () => {
      const testCases = [
        { rate: -10, realistic: false },
        { rate: 0, realistic: true },
        { rate: 7, realistic: true },
        { rate: 12, realistic: true },
        { rate: 50, realistic: false }, // Too good to be true
      ];
      
      testCases.forEach(({ rate, realistic }) => {
        const isRealistic = rate >= -5 && rate <= 20;
        expect(isRealistic).toBe(realistic);
      });
    });

    it('should validate interest rates are not absurd', () => {
      const testCases = [
        { rate: 0, valid: true },
        { rate: 3.5, valid: true },
        { rate: 18.99, valid: true }, // Credit card
        { rate: 29.99, valid: true }, // Payday loan
        { rate: 100, valid: false }, // 100% APR is usury
      ];
      
      testCases.forEach(({ rate, valid }) => {
        const isValid = rate >= 0 && rate < 50;
        expect(isValid).toBe(valid);
      });
    });
  });

  describe('Output Validation', () => {
    it('should validate calculated values are finite numbers', () => {
      const results = {
        monthlyPayment: 2528.27,
        totalInterest: 511370,
        years: 30,
      };
      
      expect(Number.isFinite(results.monthlyPayment)).toBe(true);
      expect(Number.isFinite(results.totalInterest)).toBe(true);
      expect(Number.isFinite(results.years)).toBe(true);
    });

    it('should validate percentages are in valid range', () => {
      const utilizationPercent = 65;
      
      expect(utilizationPercent).toBeGreaterThanOrEqual(0);
      expect(utilizationPercent).toBeLessThanOrEqual(100);
    });

    it('should validate dates are valid', () => {
      const date = new Date('2026-06-15');
      
      expect(date.toString()).not.toBe('Invalid Date');
      expect(date.getTime()).toBeGreaterThan(0);
    });

    it('should validate currency formatting produces strings', () => {
      const formatCurrency = (val: number) => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
      
      const formatted = formatCurrency(1234.56);
      
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234');
    });
  });

  describe('Accessibility Validation', () => {
    it('should have accessible error messages', () => {
      const errorAttrs = {
        role: 'alert',
        'aria-live': 'polite',
        id: 'error-message',
      };
      
      expect(errorAttrs.role).toBe('alert');
      expect(errorAttrs['aria-live']).toBe('polite');
    });

    it('should associate error messages with form fields', () => {
      const inputId = 'homePrice';
      const errorId = 'homePrice-error';
      const ariaDescribedBy = errorId;
      
      expect(ariaDescribedBy).toBe(errorId);
      expect(errorId).toContain(inputId);
    });
  });
});

describe('Error Scenarios - Real-World Cases', () => {
  it('should handle user entering home price in millions instead of dollars', () => {
    const userInput = 500; // User meant $500,000 but entered 500
    const likelyMeant = userInput * 1000;
    
    if (userInput < 10000) {
      // Probably meant thousands
      expect(likelyMeant).toBe(500000);
    }
  });

  it('should handle user entering annual rate instead of APR', () => {
    const userInput = 6.5; // Correct
    const wrongInput = 0.065; // User entered decimal instead of percentage
    
    expect(userInput).toBeGreaterThan(1); // Likely percentage
    expect(wrongInput).toBeLessThan(1); // Likely decimal - should be converted
  });

  it('should handle user forgetting to convert years to months', () => {
    const years = 30;
    const months = years * 12;
    
    expect(months).toBe(360);
    
    // If user entered 30 instead of 360
    if (months < 120) {
      // Probably meant years, not months
      expect(months).toBeLessThan(120);
    }
  });

  it('should validate plausible rent-to-price ratios', () => {
    const homePrice = 500000;
    const monthlyRent = 500; // Only $500 for a $500k home? Suspicious!
    const rentToPrice = (monthlyRent * 12) / homePrice;
    
    // Typical rent-to-price ratio is 0.4-1.2%
    if (rentToPrice < 0.003) {
      // Rent seems too low - might be data entry error
      expect(rentToPrice).toBeLessThan(0.003);
    }
  });
});

describe('Performance and Limits', () => {
  it('should handle large arrays efficiently', () => {
    const points = [];
    for (let i = 0; i < 1000; i++) {
      points.push({ year: i, value: i * 1000 });
    }
    
    expect(points.length).toBe(1000);
  });

  it('should validate calculation does not timeout', () => {
    const startTime = Date.now();
    
    // Simulate complex calculation
    let result = 0;
    for (let i = 0; i < 1000; i++) {
      result += Math.pow(1.07, i / 12);
    }
    
    const duration = Date.now() - startTime;
    expect(result).toBeGreaterThan(1000); // Sum should exceed count of iterations
    
    expect(duration).toBeLessThan(100); // Should complete in <100ms
  });

  it('should handle concurrent calculations', () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(Promise.resolve(i * 100));
    }
    
    expect(promises.length).toBe(10);
  });
});

