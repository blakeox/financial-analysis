/**
 * Business auto-loan-analysis engine
 *
 * This file intentionally re-exports the canonical implementation from
 * `engines/auto-loan-analysis.ts` to avoid duplicated logic while preserving
 * stable import paths.
 */

export {
  AutoLoanAnalysisEngine,
  AutoLoanAnalysisInputSchema,
  AutoLoanInputSchema,
} from '../auto-loan-analysis.js';

export type { AutoLoanResult, AutoLoanInput } from '../auto-loan-analysis.js';
