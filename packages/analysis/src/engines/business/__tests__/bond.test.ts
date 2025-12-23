import { describe, it, expect } from 'vitest';
import { BondSchema } from '../bond.js';

describe('Bond Schema', () => {
  it('should validate valid bond input', () => {
    const validBond = {
      faceValue: 1000,
      couponRate: 0.05,
      maturity: 10,
      frequency: 2,
      bondType: 'corporate',
    };
    expect(() => BondSchema.parse(validBond)).not.toThrow();
  });

  it('should reject invalid bond input', () => {
    const invalidBond = {
      faceValue: -1000,
      couponRate: 0.05,
      maturity: 10,
      frequency: 2,
      bondType: 'corporate',
    };
    expect(() => BondSchema.parse(invalidBond)).toThrow();
  });
});
