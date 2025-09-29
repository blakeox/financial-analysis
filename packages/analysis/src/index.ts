export { LeaseAnalyzer } from "./engines/lease.js";
export { AmortizationAnalyzer } from "./engines/amortization.js"; 
export { EbitdaForecaster } from "./engines/ebitda-forecasting.js";

// Export amortization functions and types
export { computeAmortizationInsights } from "./engines/amortization.js";
export type { AmortizationInsights } from "./engines/amortization.js";

// Export zod from our dependency for API usage
export { z } from "zod";

// Export schemas and types for API usage
export { FinancialInputSchema, AmortizationInputSchema, ScenarioInputSchema } from "./schemas.js";
export type { FinancialInput, AmortizationInput, ScenarioInput } from "./schemas.js";
export type { LeaseAnalysisResult } from "./engines/lease.js";
export type { AmortizationAnalysisResult } from "./engines/amortization.js";
export type { EbitdaForecastResult } from "./engines/ebitda-forecasting.js";
