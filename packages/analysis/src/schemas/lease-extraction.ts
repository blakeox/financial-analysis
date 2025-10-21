import { z } from 'zod';

// Document types we can process
export const SupportedDocumentTypeSchema = z.enum(['pdf', 'docx', 'txt']);

// Extracted lease data structure
export const ExtractedLeaseDataSchema = z.object({
  // Basic lease information
  leaseType: z.string().optional().describe('Type of lease (office-gross, warehouse-nnn, retail-percentage, etc.)'),
  leaseTerm: z.number().optional().describe('Lease term in months'),
  startDate: z.string().optional().describe('Lease start date (ISO format)'),
  
  // Financial terms
  baseRent: z.number().optional().describe('Base rent amount per month'),
  escalationType: z.string().optional().describe('Rent escalation type (fixed, percentage, cpi)'),
  escalationRate: z.number().optional().describe('Annual escalation rate (as decimal, e.g., 0.03 for 3%)'),
  escalationFrequency: z.string().optional().describe('How often escalations occur (annually, monthly)'),
  
  // Security and deposits
  securityDeposit: z.number().optional().describe('Security deposit amount'),
  prepaidRent: z.number().optional().describe('Prepaid rent amount'),
  
  // Additional costs (matching AdditionalCosts schema field names)
  cam: z.number().optional().describe('Common Area Maintenance charges'),
  taxes: z.number().optional().describe('Property taxes'),
  insurance: z.number().optional().describe('Insurance costs'),
  utilities: z.number().optional().describe('Utility costs'),
  maintenance: z.number().optional().describe('General maintenance costs'),
  managementFee: z.number().optional().describe('Property management fees'),
  parking: z.number().optional().describe('Parking fees'),
  security: z.number().optional().describe('Security service fees'),
  cleaning: z.number().optional().describe('Cleaning service fees'),
  technology: z.number().optional().describe('Technology/internet fees'),
  elevatorMaintenance: z.number().optional().describe('Elevator maintenance costs'),
  hvacMaintenance: z.number().optional().describe('HVAC maintenance costs'),
  landscaping: z.number().optional().describe('Landscaping costs'),
  wasteManagement: z.number().optional().describe('Waste management fees'),
  
  // Property details
  squareFootage: z.number().optional().describe('Leased square footage'),
  address: z.string().optional().describe('Property address'),
  buildingType: z.string().optional().describe('Type of building (office, warehouse, retail, etc.)'),
  floor: z.string().optional().describe('Floor number or description'),
  
  // Building-specific details
  loadFactor: z.number().optional().describe('Load factor for office spaces'),
  parkingSpaces: z.number().optional().describe('Number of parking spaces included'),
  
  // Options and special terms
  renewalOptions: z.array(z.object({
    termMonths: z.number(),
    rate: z.number().optional(),
  })).optional().describe('Renewal option terms'),
  
  // Confidence scores for extracted data
  confidence: z.object({
    overall: z.number().min(0).max(1).describe('Overall confidence in extraction'),
    financial: z.number().min(0).max(1).describe('Confidence in financial terms'),
    property: z.number().min(0).max(1).describe('Confidence in property details'),
  }).optional(),
  
  // Raw extracted text sections for review
  extractedSections: z.object({
    financialTerms: z.string().optional(),
    propertyDescription: z.string().optional(),
    additionalCosts: z.string().optional(),
    specialProvisions: z.string().optional(),
  }).optional(),
});

// Request schema for document extraction
export const LeaseExtractionRequestSchema = z.object({
  documentKey: z.string().describe('R2 storage key for the uploaded document'),
  documentType: SupportedDocumentTypeSchema.describe('Type of document to process'),
  extractionOptions: z.object({
    includeRawText: z.boolean().default(false).describe('Include raw extracted text sections'),
    confidenceThreshold: z.number().min(0).max(1).default(0.5).describe('Minimum confidence threshold'),
    preferredLeaseType: z.string().optional().describe('Hint for expected lease type'),
  }).optional(),
});

// Response schema for extraction results
export const LeaseExtractionResponseSchema = z.object({
  success: z.boolean(),
  extractedData: ExtractedLeaseDataSchema.optional(),
  processingTime: z.number().describe('Processing time in milliseconds'),
  warnings: z.array(z.string()).optional().describe('Processing warnings'),
  errors: z.array(z.string()).optional().describe('Processing errors'),
  suggestions: z.array(z.string()).optional().describe('Suggestions for form completion'),
});

// Type exports
export type SupportedDocumentType = z.infer<typeof SupportedDocumentTypeSchema>;
export type ExtractedLeaseData = z.infer<typeof ExtractedLeaseDataSchema>;
export type LeaseExtractionRequest = z.infer<typeof LeaseExtractionRequestSchema>;
export type LeaseExtractionResponse = z.infer<typeof LeaseExtractionResponseSchema>;