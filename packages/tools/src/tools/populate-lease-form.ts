import { z } from 'zod';

// MCP tool to populate lease form fields from extracted data or natural language input
const PopulateLeaseFormInputSchema = z.object({
  // Basic lease fields that can be populated
  leaseType: z.enum([
    'equipment',
    'office-gross',
    'office-nnn',
    'office-modified',
    'warehouse-gross',
    'warehouse-nnn',
    'retail-base',
    'retail-percentage',
    'medical-gross',
    'medical-nnn',
    'mixed-use',
    'commercial-gross',
    'commercial-nnn',
    'commercial-modified',
  ]).optional(),
  
  baseRent: z.number().positive().optional(),
  principal: z.number().positive().optional(),
  annualRate: z.number().min(0).max(1).optional(),
  termMonths: z.number().int().positive().optional(),
  residualValue: z.number().min(0).optional(),
  securityDeposit: z.number().min(0).optional(),
  
  // Additional costs
  camCharges: z.number().min(0).optional(),
  propertyTaxes: z.number().min(0).optional(),
  insurance: z.number().min(0).optional(),
  utilities: z.number().min(0).optional(),
  maintenance: z.number().min(0).optional(),
  parking: z.number().min(0).optional(),
  
  // Escalation
  escalationType: z.enum(['none', 'fixed', 'cpi', 'market', 'stepped']).optional(),
  escalationRate: z.number().min(0).optional(),
  
  // Square footage
  squareFeet: z.number().min(0).optional(),
  pricePerSquareFoot: z.number().min(0).optional(),
  
  // Natural language input for AI to parse
  naturalLanguageInput: z.string().optional(),
});

export class PopulateLeaseFormTool {
  static readonly toolName = 'populate_lease_form';
  static readonly description =
    'Populate lease analysis form fields based on extracted data or natural language input. Returns the values that should be set in the form.';
  
  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      leaseType: {
        type: 'string',
        enum: [
          'equipment',
          'office-gross',
          'office-nnn',
          'office-modified',
          'warehouse-gross',
          'warehouse-nnn',
          'retail-base',
          'retail-percentage',
          'medical-gross',
          'medical-nnn',
          'mixed-use',
          'commercial-gross',
          'commercial-nnn',
          'commercial-modified',
        ],
        description: 'Type of lease',
      },
      baseRent: {
        type: 'number',
        description: 'Monthly base rent amount',
      },
      principal: {
        type: 'number',
        description: 'Asset or equipment cost',
      },
      annualRate: {
        type: 'number',
        description: 'Annual interest rate as decimal (e.g., 0.05 for 5%)',
      },
      termMonths: {
        type: 'number',
        description: 'Lease term in months',
      },
      residualValue: {
        type: 'number',
        description: 'Residual value at end of lease',
      },
      securityDeposit: {
        type: 'number',
        description: 'Security deposit amount',
      },
      camCharges: {
        type: 'number',
        description: 'Common Area Maintenance charges per month',
      },
      propertyTaxes: {
        type: 'number',
        description: 'Property taxes per month',
      },
      insurance: {
        type: 'number',
        description: 'Insurance cost per month',
      },
      utilities: {
        type: 'number',
        description: 'Utilities cost per month',
      },
      maintenance: {
        type: 'number',
        description: 'Maintenance cost per month',
      },
      parking: {
        type: 'number',
        description: 'Parking cost per month',
      },
      escalationType: {
        type: 'string',
        enum: ['none', 'fixed', 'cpi', 'market', 'stepped'],
        description: 'Type of rent escalation',
      },
      escalationRate: {
        type: 'number',
        description: 'Annual escalation rate as decimal (e.g., 0.03 for 3%)',
      },
      squareFeet: {
        type: 'number',
        description: 'Square footage of leased space',
      },
      pricePerSquareFoot: {
        type: 'number',
        description: 'Price per square foot (annual)',
      },
      naturalLanguageInput: {
        type: 'string',
        description: 'Natural language description of lease terms to extract and populate',
      },
    },
  };
  
  static execute(input: unknown): Promise<{ values: Record<string, unknown>; message: string }> {
    try {
      const validated = PopulateLeaseFormInputSchema.parse(input);
      
      // Extract values to populate
      const values: Record<string, unknown> = {};
      
      if (validated.leaseType) values.leaseType = validated.leaseType;
      if (validated.baseRent !== undefined) values.baseRent = validated.baseRent;
      if (validated.principal !== undefined) values.principal = validated.principal;
      if (validated.annualRate !== undefined) values.annualRate = validated.annualRate;
      if (validated.termMonths !== undefined) values.termMonths = validated.termMonths;
      if (validated.residualValue !== undefined) values.residualValue = validated.residualValue;
      if (validated.securityDeposit !== undefined) values.securityDeposit = validated.securityDeposit;
      
      if (validated.camCharges !== undefined) values.camCharges = validated.camCharges;
      if (validated.propertyTaxes !== undefined) values.propertyTaxes = validated.propertyTaxes;
      if (validated.insurance !== undefined) values.insurance = validated.insurance;
      if (validated.utilities !== undefined) values.utilities = validated.utilities;
      if (validated.maintenance !== undefined) values.maintenance = validated.maintenance;
      if (validated.parking !== undefined) values.parking = validated.parking;
      
      if (validated.escalationType) values.escalationType = validated.escalationType;
      if (validated.escalationRate !== undefined) values.escalationRate = validated.escalationRate;
      
      if (validated.squareFeet !== undefined) values.squareFeet = validated.squareFeet;
      if (validated.pricePerSquareFoot !== undefined) values.pricePerSquareFoot = validated.pricePerSquareFoot;
      
      // Build message
      const populatedFields = Object.keys(values);
      const message = populatedFields.length > 0
        ? `I've populated ${populatedFields.length} field(s) in your lease form: ${populatedFields.join(', ')}.`
        : 'No fields were populated.';
      
      return Promise.resolve({ values, message });
    } catch (error) {
      return Promise.reject(new Error(`Failed to populate lease form: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
}




