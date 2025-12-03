import { describe, expect, it } from 'vitest';
import { EnhancedLeaseTool } from '../tools/enhanced-lease';

describe('EnhancedLeaseTool', () => {
  // Valid input matching EnhancedLeaseToolInputSchema defined in the tool
  const validEquipmentLeaseInput = {
    leaseType: 'equipment' as const,
    principal: 100000,
    annualRate: 0.06,
    termMonths: 36,
    residualValue: 10000,
    discountRate: 0.08,
  };

  const validOfficeLeaseInput = {
    leaseType: 'office-gross' as const,
    baseRent: 5000,
    termMonths: 60,
    discountRate: 0.08,
    escalation: {
      type: 'fixed' as const,
      rate: 0.03,
      schedule: [],
      cpiBase: 0,
    },
    additionalCosts: {
      camCharges: 500,
      propertyTaxes: 300,
      insurance: 200,
      utilities: 400,
      maintenance: 0,
      managementFee: 0,
      parking: 100,
      security: 0,
      cleaning: 0,
      technology: 0,
      elevatorMaintenance: 0,
      hvacMaintenance: 0,
      landscaping: 0,
      wasteManagement: 0,
    },
    buildingSpace: {
      squareFeet: 2000,
      usableSquareFeet: 1800,
      loadFactor: 0.1,
      pricePerSquareFoot: 30,
      floors: ['2'],
      parkingSpaces: 4,
      exclusiveAreas: [],
      permittedUses: [],
    },
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(EnhancedLeaseTool.toolName).toBe('analyze_enhanced_lease');
    });

    it('has a description', () => {
      expect(EnhancedLeaseTool.description).toBeTruthy();
      expect(EnhancedLeaseTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = EnhancedLeaseTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('termMonths');
    });

    it('has valid leaseType enum values', () => {
      const leaseTypeEnum = EnhancedLeaseTool.inputSchema.properties.leaseType.enum;
      expect(leaseTypeEnum).toContain('equipment');
      expect(leaseTypeEnum).toContain('office-gross');
      expect(leaseTypeEnum).toContain('office-nnn');
      expect(leaseTypeEnum).toContain('retail-base');
      expect(leaseTypeEnum).toContain('retail-percentage');
      expect(leaseTypeEnum).toContain('warehouse-gross');
      expect(leaseTypeEnum).toContain('medical-gross');
    });
  });

  describe('execute', () => {
    it('performs equipment lease analysis with valid input', async () => {
      const result = await EnhancedLeaseTool.execute(validEquipmentLeaseInput);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('metrics');
      expect(result.metrics).toHaveProperty('totalCost');
    });

    it('performs office lease analysis with valid input', async () => {
      const result = await EnhancedLeaseTool.execute(validOfficeLeaseInput);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('leaseType');
      expect(result.leaseType).toBe('office-gross');
    });

    it('returns enhanced lease analysis result', async () => {
      const result = await EnhancedLeaseTool.execute(validEquipmentLeaseInput);
      expect(result).toBeDefined();
      // Check for expected properties
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('schedule');
      expect(result).toHaveProperty('riskAnalysis');
    });

    it('throws ZodError for invalid input', async () => {
      const invalidInput = {
        leaseType: 'equipment',
        // Missing required termMonths
      };

      // Execute throws ZodError for invalid input
      await expect(EnhancedLeaseTool.execute(invalidInput)).rejects.toThrow();
    });

    it('throws ZodError for empty input', async () => {
      // Execute throws ZodError for empty input
      await expect(EnhancedLeaseTool.execute({})).rejects.toThrow();
    });

    it('handles lease with escalation', async () => {
      const inputWithEscalation = {
        ...validEquipmentLeaseInput,
        escalation: {
          type: 'fixed' as const,
          rate: 0.03,
          schedule: [],
          cpiBase: 0,
        },
      };
      const result = await EnhancedLeaseTool.execute(inputWithEscalation);
      expect(result).toBeDefined();
    });
  });
});
