export { LeaseAnalyzer } from "./engines/lease.js";
export { EnhancedLeaseAnalyzer } from "./engines/enhanced-lease.js";
export { AmortizationAnalyzer } from "./engines/amortization.js"; 
export { EbitdaForecaster } from "./engines/ebitda-forecasting.js";

// Export amortization functions and types
export { computeAmortizationInsights } from "./engines/amortization.js";
export type { AmortizationInsights } from "./engines/amortization.js";

// Export zod from our dependency for API usage
export { z } from "zod";

// Export schemas and types for API usage
export { FinancialInputSchema, AmortizationInputSchema } from "./schemas.js";
export type { FinancialInput, AmortizationInput } from "./schemas.js";

// Enhanced lease schemas and types
export { EnhancedLeaseInputSchema } from "./schemas/enhanced-lease.js";
export type { EnhancedLeaseInput, LeaseType, EscalationType, AdditionalCosts } from "./schemas/enhanced-lease.js";
export type { EnhancedLeaseAnalysisResult } from "./types/enhanced-lease-result.js";

// Lease extraction schemas and types
export { 
  LeaseExtractionRequestSchema, 
  LeaseExtractionResponseSchema, 
  ExtractedLeaseDataSchema,
  SupportedDocumentTypeSchema 
} from "./schemas/lease-extraction.js";
export type { 
  LeaseExtractionRequest, 
  LeaseExtractionResponse, 
  ExtractedLeaseData,
  SupportedDocumentType 
} from "./schemas/lease-extraction.js";

// Align Scenario schema with EBITDA forecaster's contract
export { ScenarioInputSchema } from "./engines/ebitda-forecasting.js";
export type { ScenarioInput } from "./engines/ebitda-forecasting.js";
export type { LeaseAnalysisResult } from "./engines/lease.js";
export type { AmortizationAnalysisResult } from "./engines/amortization.js";
export type { EbitdaForecastResult } from "./engines/ebitda-forecasting.js";
