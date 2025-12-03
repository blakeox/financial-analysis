import { describe, expect, it } from 'vitest';
import { PopulateLeaseFormTool } from '../tools/populate-lease-form';

describe('PopulateLeaseFormTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(PopulateLeaseFormTool.toolName).toBe('populate_lease_form');
    });

    it('has a description', () => {
      expect(PopulateLeaseFormTool.description).toBeTruthy();
      expect(PopulateLeaseFormTool.description.length).toBeGreaterThan(50);
    });

    it('has input schema fields', () => {
      const schema = PopulateLeaseFormTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.properties.leaseType).toBeDefined();
      expect(schema.properties.baseRent).toBeDefined();
      expect(schema.properties.principal).toBeDefined();
      expect(schema.properties.annualRate).toBeDefined();
      expect(schema.properties.termMonths).toBeDefined();
    });

    it('supports expected lease types', () => {
      const leaseTypes = PopulateLeaseFormTool.inputSchema.properties.leaseType.enum;
      expect(leaseTypes).toContain('equipment');
      expect(leaseTypes).toContain('office-gross');
      expect(leaseTypes).toContain('office-nnn');
      expect(leaseTypes).toContain('retail-base');
      expect(leaseTypes).toContain('warehouse-gross');
    });

    it('supports expected escalation types', () => {
      const escalationTypes = PopulateLeaseFormTool.inputSchema.properties.escalationType.enum;
      expect(escalationTypes).toContain('none');
      expect(escalationTypes).toContain('fixed');
      expect(escalationTypes).toContain('cpi');
      expect(escalationTypes).toContain('market');
      expect(escalationTypes).toContain('stepped');
    });
  });

  describe('execute', () => {
    it('populates basic lease fields', async () => {
      const result = await PopulateLeaseFormTool.execute({
        leaseType: 'equipment',
        principal: 100000,
        annualRate: 0.08,
        termMonths: 60,
      });

      expect(result).toBeDefined();
      expect(result.values).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.values.leaseType).toBe('equipment');
      expect(result.values.principal).toBe(100000);
      expect(result.values.annualRate).toBe(0.08);
      expect(result.values.termMonths).toBe(60);
    });

    it('populates office lease fields', async () => {
      const result = await PopulateLeaseFormTool.execute({
        leaseType: 'office-nnn',
        baseRent: 5000,
        termMonths: 36,
        squareFeet: 2000,
        pricePerSquareFoot: 30,
      });

      expect(result.values.leaseType).toBe('office-nnn');
      expect(result.values.baseRent).toBe(5000);
      expect(result.values.squareFeet).toBe(2000);
      expect(result.values.pricePerSquareFoot).toBe(30);
    });

    it('populates additional costs', async () => {
      const result = await PopulateLeaseFormTool.execute({
        leaseType: 'commercial-nnn',
        baseRent: 8000,
        termMonths: 60,
        camCharges: 500,
        propertyTaxes: 300,
        insurance: 200,
        utilities: 400,
        maintenance: 150,
        parking: 100,
      });

      expect(result.values.camCharges).toBe(500);
      expect(result.values.propertyTaxes).toBe(300);
      expect(result.values.insurance).toBe(200);
      expect(result.values.utilities).toBe(400);
      expect(result.values.maintenance).toBe(150);
      expect(result.values.parking).toBe(100);
    });

    it('populates escalation fields', async () => {
      const result = await PopulateLeaseFormTool.execute({
        leaseType: 'office-gross',
        baseRent: 6000,
        termMonths: 120,
        escalationType: 'fixed',
        escalationRate: 0.03,
      });

      expect(result.values.escalationType).toBe('fixed');
      expect(result.values.escalationRate).toBe(0.03);
    });

    it('populates residual value and security deposit', async () => {
      const result = await PopulateLeaseFormTool.execute({
        leaseType: 'equipment',
        principal: 75000,
        annualRate: 0.06,
        termMonths: 48,
        residualValue: 15000,
        securityDeposit: 7500,
      });

      expect(result.values.residualValue).toBe(15000);
      expect(result.values.securityDeposit).toBe(7500);
    });

    it('handles retail lease configuration', async () => {
      const result = await PopulateLeaseFormTool.execute({
        leaseType: 'retail-percentage',
        baseRent: 4000,
        termMonths: 60,
        squareFeet: 1500,
        pricePerSquareFoot: 32,
        camCharges: 600,
        escalationType: 'cpi',
        escalationRate: 0.025,
      });

      expect(result.values.leaseType).toBe('retail-percentage');
      expect(result.values.escalationType).toBe('cpi');
    });

    it('handles medical lease configuration', async () => {
      const result = await PopulateLeaseFormTool.execute({
        leaseType: 'medical-nnn',
        baseRent: 7500,
        termMonths: 84,
        squareFeet: 2500,
        camCharges: 800,
        propertyTaxes: 500,
        insurance: 400,
      });

      expect(result.values.leaseType).toBe('medical-nnn');
    });

    it('handles warehouse lease configuration', async () => {
      const result = await PopulateLeaseFormTool.execute({
        leaseType: 'warehouse-gross',
        baseRent: 12000,
        termMonths: 60,
        squareFeet: 10000,
        pricePerSquareFoot: 14.4,
      });

      expect(result.values.leaseType).toBe('warehouse-gross');
      expect(result.values.squareFeet).toBe(10000);
    });

    it('returns empty values for empty input', async () => {
      const result = await PopulateLeaseFormTool.execute({});

      expect(result.values).toEqual({});
      expect(result.message).toBe('No fields were populated.');
    });

    it('handles partial input', async () => {
      const result = await PopulateLeaseFormTool.execute({
        baseRent: 5000,
      });

      expect(result.values.baseRent).toBe(5000);
      expect(Object.keys(result.values).length).toBe(1);
      expect(result.message).toContain('1 field(s)');
    });

    it('generates appropriate message with field count', async () => {
      const result = await PopulateLeaseFormTool.execute({
        leaseType: 'office-gross',
        baseRent: 5000,
        termMonths: 36,
      });

      expect(result.message).toContain('3 field(s)');
      expect(result.message).toContain('leaseType');
      expect(result.message).toContain('baseRent');
      expect(result.message).toContain('termMonths');
    });

    it('rejects invalid annual rate', async () => {
      await expect(
        PopulateLeaseFormTool.execute({
          annualRate: 1.5, // > 1 is invalid
        })
      ).rejects.toThrow();
    });

    it('rejects negative principal', async () => {
      await expect(
        PopulateLeaseFormTool.execute({
          principal: -1000,
        })
      ).rejects.toThrow();
    });
  });
});
