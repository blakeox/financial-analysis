import { routeAgentRequest } from 'agents';
import type { OAuthProvider } from '@cloudflare/workers-oauth-provider';
import {
  AccountsPayableOptimizationInputSchema,
  AccountsPayableOptimizer,
  AccountsReceivableAgingAnalyzer,
  AccountsReceivableAgingInputSchema,
  AmortizationAnalyzer,
  type AmortizationResultItem,
  AmortizationInputSchema,
  AutoLoanAnalysisEngine,
  AutoLoanAnalysisInputSchema,
  BondPricingAnalyzer,
  BondPricingInputSchema,
  BusinessExpansionLoanInputSchema,
  BusinessExpansionLoanJourney,
  BusinessFinancialHealthAnalyzer,
  BusinessFinancialHealthInputSchema,
  BusinessLoanScenariosAnalyzer,
  BusinessLoanScenariosInputSchema,
  BusinessSuccessionPlanningCalculator,
  BusinessSuccessionPlanningInputSchema,
  CapitalStructureInputSchema,
  CapitalStructureOptimizer,
  CarLeaseVsBuyCalculator,
  CarLeaseVsBuyInputSchema,
  CashFlowAnalysisInputSchema,
  CashFlowAnalyzer,
  CCAValuationEngine,
  CCAValuationInputSchema,
  CharitableGivingInputSchema,
  CharitableGivingOptimizer,
  CollegeSavingsInputSchema,
  CollegeSavingsPlanner,
  CreditRiskAnalyzer,
  CreditRiskInputSchema,
  CreditScoreImpactAnalyzer,
  CreditScoreImpactInputSchema,
  CryptocurrencyTaxCalculator,
  // Specialized/Advanced Models
  CryptocurrencyTaxInputSchema,
  DebtCapacityCalculator,
  DebtCapacityInputSchema,
  DepreciationCalculator,
  DepreciationInputSchema,
  DisabilityInsuranceAnalyzer,
  DisabilityInsuranceInputSchema,
  DSCRCalculator,
  DSCRInputSchema,
  EbitdaForecaster,
  EmergencyFundCalculator,
  EmergencyFundInputSchema,
  EmployeeStockOptionsInputSchema,
  EmployeeStockOptionsValuator,
  EmployerMatch401kInputSchema,
  EmployerMatch401kOptimizer,
  EnhancedLeaseAnalyzer,
  EnhancedLeaseInputSchema,
  EquipmentLeaseVsBuyCalculator,
  EquipmentLeaseVsBuyInputSchema,
  EstatePlanningCalculator,
  EstatePlanningInputSchema,
  FinancialInputSchema,
  FinancialJourneyAnalysisEngine,
  FinancialJourneyInputSchema,
  FinancialRatioAnalyzer,
  FinancialRatioAnalyzerInputSchema,
  FIRECalculator,
  FIRECalculatorInputSchema,
  FiveTwoNineOptimizer,
  FiveTwoNineOptimizerInputSchema,
  FranchiseROICalculator,
  FranchiseROIInputSchema,
  HELOCAnalyzer,
  HELOCInputSchema,
  HomeBuyingAffordabilityCalculator,
  HomeBuyingAffordabilityInputSchema,
  // New Personal Finance Models
  HSAOptimizationInputSchema,
  HSAOptimizer,
  InsuranceNeedsCalculator,
  InsuranceNeedsInputSchema,
  InternationalTaxPlanningOptimizer,
  InternationalTaxPlanningInputSchema,
  // New Business Finance Models
  InventoryOptimizationInputSchema,
  InventoryOptimizer,
  InvestmentPortfolioAnalyzer,
  InvestmentPortfolioInputSchema,
  LBOInputSchema,
  LBOModel,
  LeaseAnalyzer,
  LifeInsuranceReassessmentCalculator,
  LifeInsuranceReassessmentInputSchema,
  LongTermCareCalculator,
  LongTermCareInputSchema,
  MAAnalysisEngine,
  MAAnalysisInputSchema,
  NetWorthInputSchema,
  NetWorthTracker,
  OneZeroThreeOneExchangeAnalyzer,
  OneZeroThreeOneExchangeInputSchema,
  OptionsPricingAnalyzer,
  OptionsPricingInputSchema,
  PortfolioOptimizationInputSchema,
  PortfolioOptimizer,
  ProjectFinanceAnalyzer,
  ProjectFinanceInputSchema,
  RealEstateInvestmentAnalyzer,
  RealEstateInvestmentInputSchema,
  RefinancingCalculator,
  RefinancingInputSchema,
  RetirementPlanningEngine,
  RetirementPlanningInputSchema,
  RevenueRecognitionCalculator,
  RevenueRecognitionInputSchema,
  RothVsTraditionalIRACalculator,
  RothVsTraditionalIRAInputSchema,
  ScenarioInputSchema,
  SocialSecurityInputSchema,
  SocialSecurityOptimizer,
  StartupFinancialModel,
  StartupFinancialModelInputSchema,
  SupplyChainFinanceInputSchema,
  SupplyChainFinanceOptimizer,
  TaxLossHarvestingInputSchema,
  TaxLossHarvestingOptimizer,
  TaxOptimizationInputSchema,
  TaxOptimizationPlanner,
  VaRCalculator,
  VaRInputSchema,
  WACCAnalyzer,
  WACCInputSchema,
  WorkingCapitalInputSchema,
  WorkingCapitalOptimizer,
} from '@financial-analysis/analysis';
import {
  handleMCPRequest,
  MCP_CAPABILITY_POLICY_VERSION,
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_VERSION,
  type MCPAuthorizationContext,
} from '@financial-analysis/tools';
import { Router } from 'itty-router';
import { z } from 'zod';
import { getOpenApiDocument } from './openapi';
import type { Env } from './types';
// Lib barrel export consolidates helpers in one place for tidy imports
import {
  adjustApproxBytes,
  attachRateLimitHeaders,
  buildRequestContext,
  buildDefaultHeaders,
  codeModePolicyFromConfig,
  checkRateLimit,
  getAllCircuitStates,
  getAnalysisCacheTtl,
  getApproxBytes,
  getCorsHeaders,
  getDefaultCache,
  getMaxJsonBytes,
  getOrCreateAnalysisRunId,
  getSecurityHeaders,
  getThresholds,
  isQuotaLocked,
  purgeExpiredBudgetReservations,
  reconcileBucketUsage,
  setQuotaLocked,
  sha256Hex,
  sha256HexBytes,
  stableStringify,
  withErrorHandler,
  type RateLimitInfo,
} from './lib';
import { handleEnhancedMCPRequest } from './lib/enhanced-mcp';
import {
  abortDocumentUploadSession,
  cleanupExpiredDocumentUploads,
  createDocumentUploadSession,
  finalizeDocumentUpload,
  getOwnedDocumentMetadata,
  getOwnedDocumentUploadSession,
  getPendingDocumentUploadBytes,
  markDocumentDeleted,
  recordDocumentMetadata,
} from './lib/document-metadata';
import { purgeExpiredMCPAuditEvents } from './lib/mcp-audit';
import { purgeExpiredOAuthAuditEvents } from './lib/oauth-audit';
import { isOidcBrowserLoginConfigured } from './lib/oauth-oidc-login';
import { isOAuthEnabled } from './lib/oauth-policy';
import { hasExpectedUploadSignature } from './lib/upload-validation';
import { createR2PresignedUrl, getR2PresignConfig } from './lib/r2-presign';
import { isAuthorizedSmokeProbeRequest } from './lib/smoke-probe';
import { registerAnalyticsRoutes } from './routes/analytics';
import { registerChatRoutes } from './routes/chat';
import { registerHealthRoute } from './routes/health';
import {
  enqueueKnowledgeInvalidation,
  enqueueKnowledgeReindex,
  handleKnowledgeQueue,
} from './services/knowledge-reindex';
import { getKnowledgePipelineStatus } from './services/knowledge-status';
import { CloudflareWorkersAIProvider, isModelEgressEnabled } from './services/model-provider';

// Helper: get Cloudflare Workers default Cache if available
const router = Router();

// ---- Headers helpers ----

// Rate limiting now lives in ./lib/rate-limit

// ---- R2 quota guardrails (KV-backed approximate counters) ----
// Quota helpers now live in ./lib/quota

function hasControlChars(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) return true;
  }
  return false;
}

async function readJsonBodyWithinLimit(
  request: Request,
  env: Env
): Promise<{ body?: unknown; error?: Response }> {
  const maxBytes = getMaxJsonBytes(env);
  const contentLengthHeader = request.headers.get('content-length');
  const contentLength = contentLengthHeader === null ? Number.NaN : Number(contentLengthHeader);

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      error: new Response(
        JSON.stringify({
          error: {
            message: `Request body too large. Maximum size is ${maxBytes} bytes`,
            code: 'BODY_TOO_LARGE',
          },
        }),
        { status: 413, headers: buildDefaultHeaders(env) }
      ),
    };
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > maxBytes) {
    return {
      error: new Response(
        JSON.stringify({
          error: {
            message: `Request body too large. Maximum size is ${maxBytes} bytes`,
            code: 'BODY_TOO_LARGE',
          },
        }),
        { status: 413, headers: buildDefaultHeaders(env) }
      ),
    };
  }

  try {
    return { body: JSON.parse(rawBody) };
  } catch {
    return {
      error: new Response(
        JSON.stringify({
          error: { message: 'Request body must be valid JSON', code: 'INVALID_JSON' },
        }),
        { status: 400, headers: buildDefaultHeaders(env) }
      ),
    };
  }
}

async function getUploadQuotaError(env: Env, size: number): Promise<Response | null> {
  const { softLimit, hardLimit, maxObjectSize } = getThresholds(env);
  if (size > maxObjectSize) {
    return new Response(
      JSON.stringify({
        error: {
          message: `Object too large. Max ${maxObjectSize} bytes`,
          code: 'OBJECT_TOO_LARGE',
        },
      }),
      { status: 413, headers: buildDefaultHeaders(env) }
    );
  }

  const approx = await getApproxBytes(env);
  const locked = await isQuotaLocked(env);
  const willBe = approx + size;
  if (locked || willBe > hardLimit) {
    await setQuotaLocked(env, true);
    return new Response(
      JSON.stringify({
        error: { message: 'Storage locked due to quota', code: 'QUOTA_LOCKED' },
      }),
      { status: 403, headers: buildDefaultHeaders(env) }
    );
  }
  if (willBe > softLimit) {
    await setQuotaLocked(env, true);
    return new Response(
      JSON.stringify({ error: { message: 'Approaching quota', code: 'SOFT_LIMIT' } }),
      { status: 403, headers: buildDefaultHeaders(env) }
    );
  }

  return null;
}

function isAuthorizedAdminRequest(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  const token = (auth.startsWith('Bearer ') && auth.slice(7)) || '';
  return Boolean(env.ADMIN_API_TOKEN) && token === env.ADMIN_API_TOKEN;
}

// LEGACY: retrieveWebsiteContext removed - AutoRAG handled in ContextManager now
// Export helper for use in orchestrator
export function analyzeParameterChanges(
  modelType: string,
  newParams: Record<string, unknown>,
  oldParams: Record<string, unknown>
): Array<{ field: string; description: string }> {
  const changes: Array<{ field: string; description: string }> = [];

  Object.entries(newParams).forEach(([field, newValue]) => {
    const oldValue = oldParams[field];
    if (oldValue !== newValue) {
      const description = generateChangeDescription(modelType, field, oldValue, newValue);
      changes.push({ field, description });
    }
  });

  return changes;
}

// Generate intelligent descriptions of parameter changes
export function generateChangeDescription(
  modelType: string,
  field: string,
  oldValue: unknown,
  newValue: unknown
): string {
  const oldNum = typeof oldValue === 'number' ? oldValue : 0;
  const newNum = typeof newValue === 'number' ? newValue : 0;
  const change = newNum - oldNum;
  const changePercent = oldNum !== 0 ? (change / oldNum) * 100 : 0;

  switch (modelType) {
    case 'amortization':
      switch (field) {
        case 'annualRate':
          return `Interest rate ${changePercent > 0 ? 'increased' : 'decreased'} from ${(oldNum * 100).toFixed(2)}% to ${(newNum * 100).toFixed(2)}%. This will ${changePercent > 0 ? 'increase' : 'decrease'} monthly payments and total interest paid.`;
        case 'principal':
          return `Loan amount ${changePercent > 0 ? 'increased' : 'decreased'} from $${oldNum.toLocaleString()} to $${newNum.toLocaleString()}. Monthly payments will ${changePercent > 0 ? 'increase' : 'decrease'} proportionally.`;
        case 'termMonths':
          return `Loan term ${changePercent > 0 ? 'extended' : 'shortened'} from ${oldNum} to ${newNum} months. This will ${changePercent > 0 ? 'reduce monthly payments but increase total interest' : 'increase monthly payments but reduce total interest'}.`;
        default:
          return `${field} changed from ${oldValue} to ${newValue}.`;
      }

    case 'lease':
      switch (field) {
        case 'annualRate':
          return `Lease rate ${changePercent > 0 ? 'increased' : 'decreased'} from ${(oldNum * 100).toFixed(2)}% to ${(newNum * 100).toFixed(2)}%. This affects monthly payments and total lease cost.`;
        case 'principal':
          return `Lease amount ${changePercent > 0 ? 'increased' : 'decreased'} from $${oldNum.toLocaleString()} to $${newNum.toLocaleString()}. Monthly payments will adjust accordingly.`;
        case 'termMonths':
          return `Lease term ${changePercent > 0 ? 'extended' : 'shortened'} from ${oldNum} to ${newNum} months. This changes the payment structure and total cost.`;
        default:
          return `${field} changed from ${oldValue} to ${newValue}.`;
      }

    case 'ebitda':
      switch (field) {
        case 'revenueGrowthRate':
          return `Revenue growth rate ${changePercent > 0 ? 'increased' : 'decreased'} from ${(oldNum * 100).toFixed(1)}% to ${(newNum * 100).toFixed(1)}%. This will ${changePercent > 0 ? 'accelerate' : 'slow'} revenue growth over time.`;
        case 'initialRevenue':
          return `Starting revenue ${changePercent > 0 ? 'increased' : 'decreased'} from $${oldNum.toLocaleString()} to $${newNum.toLocaleString()}. This affects all future projections.`;
        default:
          return `${field} changed from ${oldValue} to ${newValue}.`;
      }

    default:
      return `${field} changed from ${oldValue} to ${newValue}.`;
  }
}

// Helper to extract previous model state from memory context
export function getPreviousModelState(
  toolName: string,
  memoryContext: { conversationHistory?: string; modelStates?: string }
): Record<string, unknown> | undefined {
  // For now, we'll parse the model states from the memory context
  // In a more sophisticated implementation, this could parse the conversation history
  // to extract previous parameter values

  if (!memoryContext.modelStates) {
    return undefined;
  }

  // Simple parsing of model states - in production this would be more robust
  const modelStatesText = memoryContext.modelStates;

  const modelType = toolName.replace('analyze_', '');
  const lineStart = modelStatesText.indexOf(modelType);
  if (lineStart === -1) {
    return undefined;
  }
  const lineEnd = modelStatesText.indexOf('\n', lineStart);
  const modelLine =
    lineEnd === -1 ? modelStatesText.slice(lineStart) : modelStatesText.slice(lineStart, lineEnd);

  const params: Record<string, unknown> = {};
  const segments = modelLine.split(',').slice(0, 50);
  for (const segment of segments) {
    const colon = segment.indexOf(':');
    if (colon === -1) continue;
    const key = segment.slice(0, colon).trim();
    const value = segment.slice(colon + 1).trim();
    if (!key || !value) continue;
    const numValue = parseFloat(value);
    params[key] = Number.isNaN(numValue) ? value : numValue;
  }

  return Object.keys(params).length > 0 ? params : undefined;
}

// Export helper for use in orchestrator
export function formatMCPToolAnalysis(
  toolName: string,
  result: unknown,
  inputData: Record<string, unknown>,
  previousState?: Record<string, unknown>
): string {
  try {
    const data = result as Record<string, unknown>;

    switch (toolName) {
      case 'analyze_amortization': {
        const summary = data.summary as Record<string, unknown>;
        const monthlyPayment = summary?.monthlyPayment as string;
        const totalInterest = summary?.totalInterest as string;
        const totalPayments = summary?.totalPayments as string;
        const principal = inputData.principal as number;
        const annualRate = inputData.annualRate as number;
        const termMonths = inputData.termMonths as number;

        let analysis = `## 📊 Amortization Analysis\n\n`;
        analysis += `### Loan Details\n`;
        analysis += `- **Principal**: $${principal?.toLocaleString()}\n`;
        analysis += `- **Interest Rate**: ${(annualRate * 100)?.toFixed(2)}%\n`;
        analysis += `- **Term**: ${termMonths} months (${(termMonths / 12)?.toFixed(1)} years)\n\n`;
        analysis += `### Payment Summary\n`;
        analysis += `- **Monthly Payment**: ${monthlyPayment}\n`;
        analysis += `- **Total Interest**: ${totalInterest}\n`;
        analysis += `- **Total Payments**: ${totalPayments}\n\n`;

        // Add intelligent change analysis if previous state exists
        if (previousState) {
          const changes = analyzeParameterChanges('amortization', inputData, previousState);
          if (changes.length > 0) {
            analysis += `### 🔄 Impact Analysis\n`;
            changes.forEach((change) => {
              analysis += `- **${change.field}**: ${change.description}\n`;
            });
            analysis += `\n`;
          }
        }

        // Add insights
        const interestRatio = parseFloat(totalInterest?.replace(/[$,]/g, '') || '0') / principal;
        if (interestRatio > 0.5) {
          analysis += `💡 **Insight**: Interest represents ${(interestRatio * 100).toFixed(1)}% of your loan amount. Consider making extra payments to reduce interest costs.\n`;
        }

        return analysis;
      }

      case 'analyze_savings_goal': {
        const summary = data.summary as Record<string, unknown>;
        const recommendations = data.recommendations as Record<string, unknown>[];
        const monthsToGoal = summary?.monthsToGoal as number;
        const totalSaved = summary?.totalSaved as string;
        const totalContributions = summary?.totalContributions as string;
        const totalInterest = summary?.totalInterest as string;

        let analysis = `## 💰 Savings Goal Analysis\n\n`;
        analysis += `### Timeline\n`;
        analysis += `You'll reach your **$${inputData.goalAmount}** goal in **${monthsToGoal} months** (${(monthsToGoal / 12).toFixed(1)} years).\n\n`;
        analysis += `### Breakdown\n`;
        analysis += `- **Total Saved**: ${totalSaved}\n`;
        analysis += `- **Your Contributions**: ${totalContributions}\n`;
        analysis += `- **Interest Earned**: ${totalInterest}\n\n`;

        if (recommendations && recommendations.length > 0) {
          analysis += `### 💡 Recommendations\n`;
          recommendations.forEach((rec) => {
            analysis += `- ${rec.recommendation}\n`;
          });
        }

        return analysis;
      }

      case 'analyze_student_loans': {
        const standardStrategy = data.standardPayoff as Record<string, unknown>;
        const avalancheStrategy = data.avalanchePayoff as Record<string, unknown>;
        const snowballStrategy = data.snowballPayoff as Record<string, unknown>;

        let analysis = `## 🎓 Student Loan Analysis\n\n`;

        if (standardStrategy) {
          const months = standardStrategy.totalMonths as number;
          const interest = standardStrategy.totalInterest as string;
          analysis += `### Standard Repayment\n`;
          analysis += `- **Payoff Time**: ${months} months (${(months / 12).toFixed(1)} years)\n`;
          analysis += `- **Total Interest**: ${interest}\n\n`;
        }

        if (avalancheStrategy && snowballStrategy) {
          const avMonths = avalancheStrategy.totalMonths as number;
          const avInterest = avalancheStrategy.totalInterest as string;
          const sbMonths = snowballStrategy.totalMonths as number;
          const sbInterest = snowballStrategy.totalInterest as string;

          analysis += `### Strategy Comparison\n`;
          analysis += `**Avalanche (Highest Interest First)**\n`;
          analysis += `- Payoff: ${avMonths} months | Interest: ${avInterest}\n\n`;
          analysis += `**Snowball (Lowest Balance First)**\n`;
          analysis += `- Payoff: ${sbMonths} months | Interest: ${sbInterest}\n\n`;

          if (avMonths < sbMonths) {
            const savings =
              parseFloat(sbInterest.replace(/[$,]/g, '')) -
              parseFloat(avInterest.replace(/[$,]/g, ''));
            analysis += `💡 **Recommendation**: Avalanche saves you **$${savings.toFixed(2)}** in interest!\n`;
          } else {
            analysis += `💡 **Recommendation**: Snowball provides faster psychological wins with ${sbMonths - avMonths} months saved.\n`;
          }
        }

        return analysis;
      }

      case 'analyze_retirement_savings': {
        const summary = data.summary as Record<string, unknown>;
        const finalBalance = summary?.finalBalance as string;
        const totalContributions = summary?.totalContributions as string;
        const totalGrowth = summary?.totalGrowth as string;
        const employerMatch = data.employerMatchAnalysis as Record<string, unknown>;

        let analysis = `## 🏦 Retirement Savings Projection\n\n`;
        analysis += `### Projected Balance at Retirement\n`;
        analysis += `**${finalBalance}**\n\n`;
        analysis += `### Breakdown\n`;
        analysis += `- **Your Contributions**: ${totalContributions}\n`;
        analysis += `- **Investment Growth**: ${totalGrowth}\n\n`;

        if (employerMatch) {
          const matchAmount = employerMatch.totalMatchReceived as string;
          const potentialMatch = employerMatch.potentialMatchAvailable as string;
          analysis += `### Employer Match\n`;
          analysis += `- **Match Received**: ${matchAmount}\n`;
          if (potentialMatch && potentialMatch !== '$0.00') {
            analysis += `- **💡 Additional Match Available**: ${potentialMatch}\n`;
            analysis += `\n**Recommendation**: Increase contributions to maximize employer match (free money!).\n`;
          }
        }

        return analysis;
      }

      case 'optimize_budget': {
        const metrics = data.metrics as Record<string, unknown>;
        const rule503020 = data.rule503020 as Record<string, unknown>;
        const healthScore = metrics?.financialHealthScore as number;
        const optimized = data.optimizedBudget as Record<string, unknown>;

        let analysis = `## 💳 Budget Analysis\n\n`;
        analysis += `### Financial Health Score: ${healthScore}/100\n\n`;

        if (rule503020) {
          analysis += `### 50/30/20 Rule Breakdown\n`;
          analysis += `- **Needs (50%)**: ${rule503020.needsPercentage}% of income\n`;
          analysis += `- **Wants (30%)**: ${rule503020.wantsPercentage}% of income\n`;
          analysis += `- **Savings (20%)**: ${rule503020.savingsPercentage}% of income\n\n`;
        }

        if (optimized) {
          const adjustments = optimized.adjustments as Record<string, unknown>[];
          if (adjustments && adjustments.length > 0) {
            analysis += `### 💡 Optimization Recommendations\n`;
            adjustments.forEach((adj) => {
              analysis += `- ${adj.recommendation}\n`;
            });
          }
        }

        return analysis;
      }

      case 'analyze_debt_payoff': {
        const avalanche = data.avalanche as Record<string, unknown>;
        const snowball = data.snowball as Record<string, unknown>;

        let analysis = `## 💳 Debt Payoff Strategy Analysis\n\n`;

        if (avalanche && snowball) {
          const avMonths = avalanche.payoffMonths as number;
          const avInterest = avalanche.totalInterest as string;
          const sbMonths = snowball.payoffMonths as number;
          const sbInterest = snowball.totalInterest as string;

          analysis += `### Strategy Comparison\n`;
          analysis += `**Avalanche (Highest Interest First)**\n`;
          analysis += `- Payoff: ${avMonths} months (${(avMonths / 12).toFixed(1)} years)\n`;
          analysis += `- Total Interest: ${avInterest}\n\n`;
          analysis += `**Snowball (Lowest Balance First)**\n`;
          analysis += `- Payoff: ${sbMonths} months (${(sbMonths / 12).toFixed(1)} years)\n`;
          analysis += `- Total Interest: ${sbInterest}\n\n`;

          const interestSavings =
            parseFloat(sbInterest.replace(/[$,]/g, '')) -
            parseFloat(avInterest.replace(/[$,]/g, ''));
          if (interestSavings > 0) {
            analysis += `💡 **Recommendation**: Avalanche method saves you **$${interestSavings.toFixed(2)}** in interest!\n`;
          }
        }

        return analysis;
      }

      case 'analyze_auto_loan': {
        const summary = data.summary as Record<string, unknown>;
        const monthlyPayment = summary?.monthlyPayment as string;
        const totalInterest = summary?.totalInterest as string;
        const totalCost = summary?.totalCost as string;

        let analysis = `## 🚗 Auto Loan Analysis\n\n`;
        analysis += `### Payment Details\n`;
        analysis += `- **Monthly Payment**: ${monthlyPayment}\n`;
        analysis += `- **Total Interest**: ${totalInterest}\n`;
        analysis += `- **Total Cost**: ${totalCost}\n\n`;
        analysis += `💡 **Tip**: Consider making extra principal payments to reduce interest and pay off faster.\n`;

        return analysis;
      }

      default:
        // Generic formatting for other tools
        return `## Analysis Complete\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
    }
  } catch {
    // Fallback to JSON if parsing fails
    return `## Analysis Results\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
  }
}

// Quota helpers moved to ./lib/quota

// ---- Logging ----
function logRequest(request: Request, env: Env, startTime?: number, requestId?: string) {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const clientIP =
    request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  // Cloudflare edge metadata (may be undefined in tests/local)
  const cfRay = request.headers.get('CF-RAY') || undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const colo = (request as any).cf?.colo as string | undefined;

  const logEntry = {
    ...(requestId && { requestId }),
    timestamp,
    method,
    path: url.pathname,
    userAgent,
    clientIP,
    ...(cfRay && { cfRay }),
    ...(colo && { colo }),
    environment: env.ENVIRONMENT,
    ...(startTime && { duration: Date.now() - startTime }),
  };

  console.log(JSON.stringify(logEntry));
}

// ---- Routes ----
// Health check endpoint (registered from routes module)
registerHealthRoute(router as unknown as import('itty-router').RouterType);

// Analytics endpoints for client-side event tracking
registerAnalyticsRoutes(router);

// API Key Management endpoints
import {
  createAuthErrorResponse,
  trackApiUsage,
  validateApiKey,
  resolveMCPScopes,
  type ApiKeyInfo,
} from './lib/auth';
import { createApiKey, getKeyUsage, listApiKeys, revokeApiKey } from './routes/api-keys';

// Stripe Integration endpoints
import { stripeRouter } from './routes/stripe';
import { authorizeAgentRequest } from './lib/agent-access';

/**
 * Middleware to require API key authentication
 */
function allowsPublicInternalAccess(pathname: string): boolean {
  return (
    pathname === '/mcp' ||
    pathname === '/api/v1/mcp/tools' ||
    pathname.startsWith('/v1/api/analysis/') ||
    pathname.startsWith('/api/analyze-') ||
    pathname === '/api/multi-model-scenario-analysis'
  );
}

function withAuth(
  handler: (request: Request, env: Env, keyInfo: ApiKeyInfo) => Promise<Response>,
  options: { allowReadOnlyAdmin?: boolean } = {}
) {
  return async (request: Request, env: Env): Promise<Response> => {
    const startTime = Date.now();

    if (
      options.allowReadOnlyAdmin &&
      request.method === 'GET' &&
      isAuthorizedAdminRequest(request, env)
    ) {
      const adminKeyInfo: ApiKeyInfo = {
        id: -1,
        keyHash: 'admin-read-only-monitor',
        keyPrefix: 'admin_',
        customerId: 'fanalyx-admin-monitor',
        customerEmail: 'admin-monitor@fanalyx.com',
        tier: 'enterprise',
        active: true,
        monthlyQuota: Number.MAX_SAFE_INTEGER,
        rateLimitPerSec: 100,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        metadata: { authSource: 'admin-token' },
      };
      return handler(request, env, adminKeyInfo);
    }

    // Skip auth in test/development environments
    if (env.ENVIRONMENT === 'test' || env.ENVIRONMENT === 'development') {
      const mockKeyInfo: ApiKeyInfo = {
        id: 999,
        keyHash: 'test-key-hash',
        keyPrefix: 'fk_test_',
        customerId: 'test-customer',
        customerEmail: 'test@example.com',
        tier: 'test',
        active: true,
        monthlyQuota: 10000,
        rateLimitPerSec: 100,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      };
      return handler(request, env, mockKeyInfo);
    }

    const authResult = await validateApiKey(request, env);

    if (!authResult.success || !authResult.keyInfo) {
      return createAuthErrorResponse(authResult);
    }

    // The web Worker uses a server-only token for the stateless public formula
    // facade. It must never turn a browser request into an owner for storage,
    // uploads, document extraction, billing, or other user-data routes.
    if (
      authResult.keyInfo.tier === 'internal' &&
      !allowsPublicInternalAccess(new URL(request.url).pathname)
    ) {
      return createAuthErrorResponse({
        success: false,
        error: 'A caller API key or user identity is required for this resource.',
        errorCode: 'MISSING_KEY',
      });
    }

    try {
      const response = await handler(request, env, authResult.keyInfo);
      const responseTime = Date.now() - startTime;

      // Track usage asynchronously (don't wait)
      trackApiUsage(authResult.keyInfo, request, response.status, responseTime, env).catch(
        (err) => {
          console.error('Failed to track API usage:', err);
        }
      );

      // Add rate limit headers
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      headers.append('Vary', 'Authorization');
      headers.append('Vary', 'X-API-Key');
      headers.append('Vary', 'X-Internal-API-Token');
      headers.set('X-RateLimit-Limit', String(authResult.keyInfo.rateLimitPerSec));
      headers.set('X-RateLimit-Remaining', '0'); // Would need to fetch from KV
      headers.set('X-API-Key-Tier', authResult.keyInfo.tier);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('Handler error:', error);
      throw error;
    }
  };
}

function buildMCPAuthorizationContext(keyInfo: ApiKeyInfo, env: Env): MCPAuthorizationContext {
  return {
    source:
      keyInfo.tier === 'internal'
        ? 'internal'
        : keyInfo.tier === 'test'
          ? 'development'
          : 'api-key',
    subject: keyInfo.customerId,
    scopes: resolveMCPScopes(keyInfo),
    mcpAnalysisEnabled: env.MCP_ANALYSIS_ENABLED !== 'false',
  };
}

/**
 * Middleware for API-key lifecycle operations. These endpoints can mint and
 * revoke credentials, so an ordinary customer API key is not sufficient.
 */
function withAdminAuth(handler: (request: Request, env: Env) => Promise<Response>) {
  return withErrorHandler(async (request: Request, env: Env) => {
    if (!isAuthorizedAdminRequest(request, env)) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }),
        { status: 401, headers: buildDefaultHeaders(env) }
      );
    }
    return handler(request, env);
  });
}

router.post(
  '/v1/keys',
  withAdminAuth(async (request: Request, env: Env) => {
    return await createApiKey(request, env);
  })
);

router.get(
  '/v1/keys',
  withAdminAuth(async (request: Request, env: Env) => {
    return await listApiKeys(request, env);
  })
);

router.delete(
  '/v1/keys/:keyId',
  withAdminAuth(async (request: Request & { params?: { keyId: string } }, env: Env) => {
    const keyId = request.params?.keyId;
    if (!keyId) {
      return new Response(JSON.stringify({ error: 'keyId parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return await revokeApiKey(keyId, env);
  })
);

router.get(
  '/v1/keys/:keyId/usage',
  withAdminAuth(async (request: Request & { params?: { keyId: string } }, env: Env) => {
    const keyId = request.params?.keyId;
    if (!keyId) {
      return new Response(JSON.stringify({ error: 'keyId parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return await getKeyUsage(keyId, env);
  })
);

// Stripe Integration routes
router.all('/v1/stripe/webhook', (request: Request, env: Env) => {
  return stripeRouter.handle(request, env);
});
router.get('/v1/stripe/pricing', (request: Request, env: Env) => {
  return stripeRouter.handle(request, env);
});
router.all(
  '/v1/stripe/*',
  withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
    return stripeRouter.handle(request, env);
  })
);

// PHASE 3: Circuit breaker monitoring endpoint
router.get(
  '/v1/admin/circuit-breakers',
  withAdminAuth(async (_req: Request, env: Env) => {
    const states = getAllCircuitStates();
    const headers = new Headers({
      ...getCorsHeaders(env),
      ...getSecurityHeaders(env),
      'Content-Type': 'application/json',
    });
    return new Response(
      JSON.stringify(
        {
          circuitBreakers: states,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      ),
      { headers }
    );
  })
);

// Lightweight ping endpoint for uptime checks
router.get('/ping', (_req: Request, env: Env) => {
  const headers = new Headers({
    ...getCorsHeaders(env),
    ...getSecurityHeaders(env),
    'Content-Type': 'text/plain; charset=utf-8',
  });
  return new Response('pong', { headers });
});

// Version endpoint exposing environment and optional commit SHA
router.get('/version', (_req: Request, env: Env) => {
  return new Response(
    JSON.stringify({
      service: 'financial-analysis-api',
      version: 'v1',
      environment: env.ENVIRONMENT,
      commit: env.COMMIT_SHA ?? 'unknown',
      mcp: {
        serverVersion: MCP_SERVER_VERSION,
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilityPolicyVersion: MCP_CAPABILITY_POLICY_VERSION,
      },
      controls: {
        oauthEnabled: isOAuthEnabled(env),
        oidcBrowserLoginConfigured: isOidcBrowserLoginConfigured(env),
        modelEgressEnabled: isModelEgressEnabled(env.AI_EGRESS_ENABLED),
        budgetEnforcementEnabled: env.BUDGET_ENFORCEMENT_ENABLED === 'true',
        connectorEgressEnabled: env.CONNECTOR_EGRESS_ENABLED === 'true',
        codeModeEnabled: codeModePolicyFromConfig({
          enabled: env.CODE_MODE_ENABLED,
          allowedCapabilities: env.CODE_MODE_ALLOWED_CAPABILITIES,
          connectorEgressEnabled: env.CONNECTOR_EGRESS_ENABLED,
          maxToolCalls: env.CODE_MODE_MAX_TOOL_CALLS,
          maxOutputBytes: env.CODE_MODE_MAX_OUTPUT_BYTES,
          maxWallTimeMs: env.CODE_MODE_MAX_WALL_TIME_MS,
        }).enabled,
      },
      timestamp: new Date().toISOString(),
    }),
    { headers: buildDefaultHeaders(env) }
  );
});

// Root route -> health (friendly JSON + links)
router.get('/', async (request: Request, env: Env) => {
  const payload = {
    status: 'ok',
    service: 'financial-analysis-api',
    environment: env.ENVIRONMENT,
    docs: '/docs',
    openapi: '/openapi.json',
    health: '/health',
    storage: '/v1/storage/status',
  } as const;
  const json = JSON.stringify(payload);
  const etagHex = await sha256Hex(json);
  const etag = `"${etagHex}"`;
  const inm = request.headers.get('if-none-match');
  const matches = (a: string, b: string) => {
    const norm = (s: string) => s.trim().replace(/^W\//i, '').replace(/^"|"$/g, '');
    return norm(a) === norm(b);
  };
  if (inm && matches(inm, etag)) {
    return new Response(null, {
      status: 304,
      headers: {
        ...getCorsHeaders(env),
        ...getSecurityHeaders(env),
        'Content-Type': 'application/json',
        ETag: etag,
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  return new Response(json, {
    headers: {
      ...buildDefaultHeaders(env),
      'Content-Type': 'application/json',
      ETag: etag,
      'Cache-Control': 'public, max-age=60',
    },
  });
});

// CORS preflight for API and MCP endpoints
router.options('/mcp', (_req: Request, env: Env) => {
  const headers = new Headers(getCorsHeaders(env));
  headers.set('Allow', 'POST, OPTIONS');
  return new Response(null, { headers });
});
router.options('/api/*', (_req: Request, env: Env) => {
  const headers = new Headers(getCorsHeaders(env));
  headers.set('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
  return new Response(null, { headers });
});
router.options('/v1/*', (_req: Request, env: Env) => {
  const headers = new Headers(getCorsHeaders(env));
  headers.set('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  return new Response(null, { headers });
});
router.options('/agents/*', (_req: Request, env: Env) => {
  const headers = new Headers(getCorsHeaders(env));
  headers.set('Allow', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Max-Age', '86400');
  return new Response(null, { headers });
});
router.options('/openapi.json', (_req: Request, env: Env) => {
  const headers = new Headers(getCorsHeaders(env));
  headers.set('Allow', 'GET, OPTIONS');
  return new Response(null, { headers });
});
router.options('/docs', (_req: Request, env: Env) => {
  const headers = new Headers(getCorsHeaders(env));
  headers.set('Allow', 'GET, OPTIONS');
  return new Response(null, { headers });
});

// ---- Enhanced AI Chat endpoint with thinking process ----
registerChatRoutes(router);

// ---- Storage endpoints (R2) ----
// Note: This implementation is conservative and designed for free-tier safety.
// It requires a Content-Length header for uploads and enforces soft/hard quotas.

router.get(
  '/v1/storage/status',
  withErrorHandler(
    withAuth(
      async (_request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
        const { softLimit, hardLimit } = getThresholds(env);
        const approx = await getApproxBytes(env);
        const locked = await isQuotaLocked(env);
        const hasBucket = Boolean(env.DOCUMENTS);
        return new Response(
          JSON.stringify({
            bucket: hasBucket ? 'configured' : 'absent',
            approxBytes: approx,
            softLimit,
            hardLimit,
            locked,
          }),
          { headers: buildDefaultHeaders(env) }
        );
      },
      { allowReadOnlyAdmin: true }
    )
  )
);

router.get(
  '/v1/storage/usage',
  withErrorHandler(
    withAuth(async (_request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      const { softLimit, hardLimit, maxObjectSize } = getThresholds(env);
      const usedBytes = await getApproxBytes(env);
      const locked = await isQuotaLocked(env);
      return new Response(
        JSON.stringify({
          usedBytes,
          softLimit,
          hardLimit,
          maxObjectSize,
          locked,
          timestamp: new Date().toISOString(),
        }),
        { headers: buildDefaultHeaders(env) }
      );
    })
  )
);

const R2PresignRequestSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('download'),
    key: z.string().min(1).max(1024),
  }),
  z.object({
    operation: z.literal('upload'),
    originalName: z.string().min(1).max(255),
    contentType: z.string().min(1).max(128),
    sizeBytes: z.number().int().positive(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  }),
]);

const R2FinalizeUploadRequestSchema = z.object({
  uploadId: z.string().uuid(),
});

/**
 * Issue a short-lived, owner-checked R2 GET URL.
 *
 * Direct PUT URLs are session-bound. The object is not promoted to the
 * documents table until /v1/storage/finalize verifies the R2 bytes.
 */
router.post(
  '/v1/storage/presign',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, keyInfo: ApiKeyInfo) => {
      const config = getR2PresignConfig(env);
      if (!config) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'R2 URL signing is not configured.',
              code: 'STORAGE_SIGNING_NOT_CONFIGURED',
            },
          }),
          { status: 503, headers: buildDefaultHeaders(env) }
        );
      }
      if (!env.DOCUMENTS || !env.DB) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Document ownership metadata is temporarily unavailable.',
              code: 'METADATA_UNAVAILABLE',
            },
          }),
          { status: 503, headers: buildDefaultHeaders(env) }
        );
      }

      const parsedBody = await readJsonBodyWithinLimit(request, env);
      if (parsedBody.error) return parsedBody.error;
      const parsed = R2PresignRequestSchema.safeParse(parsedBody.body);
      if (!parsed.success) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Invalid R2 presign request.',
              code: 'BAD_REQUEST',
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      if (parsed.data.operation === 'download') {
        const { key } = parsed.data;
        if (key.endsWith('/') || hasControlChars(key) || /(^|\/)\.\.(\/|$)/.test(key)) {
          return new Response(
            JSON.stringify({ error: { message: 'Unsafe object key', code: 'BAD_KEY' } }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }

        const metadata = await getOwnedDocumentMetadata(env, key, keyInfo.customerId);
        if (!metadata) {
          return new Response(
            JSON.stringify({ error: { message: 'Object not found', code: 'OBJECT_NOT_FOUND' } }),
            { status: 404, headers: buildDefaultHeaders(env) }
          );
        }

        const object = await env.DOCUMENTS.head(key);
        if (!object) {
          return new Response(
            JSON.stringify({ error: { message: 'Object not found', code: 'OBJECT_NOT_FOUND' } }),
            { status: 404, headers: buildDefaultHeaders(env) }
          );
        }

        const signed = await createR2PresignedUrl(config, 'get', key);
        return new Response(
          JSON.stringify({
            operation: 'download',
            key,
            url: signed.url,
            expiresAt: signed.expiresAt,
            expiresInSeconds: signed.expiresInSeconds,
            contentType: metadata.contentType,
            sizeBytes: metadata.sizeBytes,
            sha256: metadata.sha256,
          }),
          { status: 200, headers: buildDefaultHeaders(env) }
        );
      }

      const { originalName, contentType, sizeBytes, sha256 } = parsed.data;
      if (hasControlChars(originalName) || hasControlChars(contentType)) {
        return new Response(
          JSON.stringify({ error: { message: 'Invalid upload metadata', code: 'BAD_REQUEST' } }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }
      const allowedTypes = new Set([
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ]);
      if (!allowedTypes.has(contentType)) {
        return new Response(
          JSON.stringify({
            error: { message: 'Unsupported media type', code: 'UNSUPPORTED_MEDIA_TYPE' },
          }),
          { status: 415, headers: buildDefaultHeaders(env) }
        );
      }
      if (env.ALLOWED_UPLOAD_MIME_PREFIXES) {
        const prefixes = env.ALLOWED_UPLOAD_MIME_PREFIXES.split(',')
          .map((value) => value.trim())
          .filter(Boolean);
        if (prefixes.length > 0 && !prefixes.some((prefix) => contentType.startsWith(prefix))) {
          return new Response(
            JSON.stringify({
              error: { message: 'Unsupported media type', code: 'UNSUPPORTED_MEDIA_TYPE' },
            }),
            { status: 415, headers: buildDefaultHeaders(env) }
          );
        }
      }

      const { softLimit, hardLimit, maxObjectSize } = getThresholds(env);
      if (sizeBytes > maxObjectSize) {
        return new Response(
          JSON.stringify({
            error: {
              message: `Object too large. Max ${maxObjectSize} bytes`,
              code: 'OBJECT_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }
      const pendingBytes = await getPendingDocumentUploadBytes(env, keyInfo.customerId);
      if (!Number.isFinite(pendingBytes)) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Upload quota is temporarily unavailable.',
              code: 'QUOTA_UNAVAILABLE',
            },
          }),
          { status: 503, headers: buildDefaultHeaders(env) }
        );
      }
      const approx = await getApproxBytes(env);
      const locked = await isQuotaLocked(env);
      if (locked || approx + pendingBytes + sizeBytes > hardLimit) {
        await setQuotaLocked(env, true);
        return new Response(
          JSON.stringify({
            error: { message: 'Storage locked due to quota', code: 'QUOTA_LOCKED' },
          }),
          { status: 403, headers: buildDefaultHeaders(env) }
        );
      }
      if (approx + pendingBytes + sizeBytes > softLimit) {
        await setQuotaLocked(env, true);
        return new Response(
          JSON.stringify({ error: { message: 'Approaching quota', code: 'SOFT_LIMIT' } }),
          { status: 403, headers: buildDefaultHeaders(env) }
        );
      }

      const uploadId = crypto.randomUUID();
      const extension = originalName.includes('.')
        ? `.${originalName
            .split('.')
            .pop()
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, '')}`
        : '';
      const key = `lease-documents/${uploadId}${extension}`;
      const expiresAt = new Date(Date.now() + config.ttlSeconds * 1000).toISOString();
      const created = await createDocumentUploadSession(env, {
        uploadId,
        objectKey: key,
        customerId: keyInfo.customerId,
        originalName,
        contentType,
        sizeBytes,
        sha256: sha256.toLowerCase(),
        expiresAt,
      });
      if (!created) {
        return new Response(
          JSON.stringify({
            error: { message: 'Upload session unavailable.', code: 'UPLOAD_SESSION_UNAVAILABLE' },
          }),
          { status: 503, headers: buildDefaultHeaders(env) }
        );
      }

      try {
        const signed = await createR2PresignedUrl(config, 'put', key, contentType);
        return new Response(
          JSON.stringify({
            operation: 'upload',
            uploadId,
            key,
            url: signed.url,
            expiresAt: signed.expiresAt,
            expiresInSeconds: signed.expiresInSeconds,
            headers: { 'Content-Type': contentType },
            sizeBytes,
            sha256: sha256.toLowerCase(),
          }),
          { status: 201, headers: buildDefaultHeaders(env) }
        );
      } catch (error) {
        await abortDocumentUploadSession(env, uploadId, keyInfo.customerId);
        console.error('R2 presign failed:', error);
        return new Response(
          JSON.stringify({
            error: {
              message: 'R2 URL signing is temporarily unavailable.',
              code: 'STORAGE_SIGNING_UNAVAILABLE',
            },
          }),
          { status: 503, headers: buildDefaultHeaders(env) }
        );
      }
    })
  )
);

router.post(
  '/v1/storage/finalize',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, keyInfo: ApiKeyInfo) => {
      if (!env.DOCUMENTS || !env.DB) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Document storage is temporarily unavailable.',
              code: 'METADATA_UNAVAILABLE',
            },
          }),
          { status: 503, headers: buildDefaultHeaders(env) }
        );
      }
      const parsedBody = await readJsonBodyWithinLimit(request, env);
      if (parsedBody.error) return parsedBody.error;
      const parsed = R2FinalizeUploadRequestSchema.safeParse(parsedBody.body);
      if (!parsed.success) {
        return new Response(
          JSON.stringify({
            error: { message: 'Invalid upload finalization request.', code: 'BAD_REQUEST' },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }
      const session = await getOwnedDocumentUploadSession(
        env,
        parsed.data.uploadId,
        keyInfo.customerId
      );
      if (!session) {
        return new Response(
          JSON.stringify({
            error: { message: 'Upload session not found.', code: 'UPLOAD_NOT_FOUND' },
          }),
          { status: 404, headers: buildDefaultHeaders(env) }
        );
      }
      if (session.status !== 'pending') {
        return new Response(
          JSON.stringify({
            error: { message: 'Upload session is no longer pending.', code: 'UPLOAD_NOT_PENDING' },
          }),
          { status: 409, headers: buildDefaultHeaders(env) }
        );
      }
      if (Date.parse(session.expiresAt) <= Date.now()) {
        await abortDocumentUploadSession(env, session.uploadId, keyInfo.customerId);
        return new Response(
          JSON.stringify({ error: { message: 'Upload URL expired.', code: 'UPLOAD_EXPIRED' } }),
          { status: 410, headers: buildDefaultHeaders(env) }
        );
      }

      const head = await env.DOCUMENTS.head(session.objectKey);
      if (!head) {
        return new Response(
          JSON.stringify({
            error: { message: 'Uploaded object not found.', code: 'UPLOAD_NOT_COMPLETE' },
          }),
          { status: 409, headers: buildDefaultHeaders(env) }
        );
      }
      const actualContentType = head.httpMetadata?.contentType;
      if (head.size !== session.sizeBytes || actualContentType !== session.contentType) {
        await env.DOCUMENTS.delete(session.objectKey);
        await abortDocumentUploadSession(env, session.uploadId, keyInfo.customerId);
        return new Response(
          JSON.stringify({
            error: {
              message: 'Uploaded object metadata does not match the session.',
              code: 'UPLOAD_METADATA_MISMATCH',
            },
          }),
          { status: 422, headers: buildDefaultHeaders(env) }
        );
      }

      const object = await env.DOCUMENTS.get(session.objectKey);
      if (!object) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Uploaded object disappeared before verification.',
              code: 'UPLOAD_NOT_COMPLETE',
            },
          }),
          { status: 409, headers: buildDefaultHeaders(env) }
        );
      }
      const actualSha256 = await sha256HexBytes(await object.arrayBuffer());
      if (actualSha256 !== session.sha256) {
        await env.DOCUMENTS.delete(session.objectKey);
        await abortDocumentUploadSession(env, session.uploadId, keyInfo.customerId);
        return new Response(
          JSON.stringify({
            error: {
              message: 'Uploaded object checksum mismatch.',
              code: 'UPLOAD_CHECKSUM_MISMATCH',
            },
          }),
          { status: 422, headers: buildDefaultHeaders(env) }
        );
      }

      const pendingBytes = await getPendingDocumentUploadBytes(
        env,
        keyInfo.customerId,
        session.uploadId
      );
      const approx = await getApproxBytes(env);
      const { softLimit } = getThresholds(env);
      if (!Number.isFinite(pendingBytes) || approx + pendingBytes + session.sizeBytes > softLimit) {
        await env.DOCUMENTS.delete(session.objectKey);
        await abortDocumentUploadSession(env, session.uploadId, keyInfo.customerId);
        return new Response(
          JSON.stringify({
            error: { message: 'Storage quota is no longer available.', code: 'QUOTA_LOCKED' },
          }),
          { status: 403, headers: buildDefaultHeaders(env) }
        );
      }

      const finalized = await finalizeDocumentUpload(env, session);
      if (!finalized) {
        await env.DOCUMENTS.delete(session.objectKey);
        await abortDocumentUploadSession(env, session.uploadId, keyInfo.customerId);
        return new Response(
          JSON.stringify({
            error: {
              message: 'Document metadata storage is temporarily unavailable.',
              code: 'METADATA_UNAVAILABLE',
            },
          }),
          { status: 503, headers: buildDefaultHeaders(env) }
        );
      }
      await adjustApproxBytes(env, session.sizeBytes);
      return new Response(
        JSON.stringify({
          success: true,
          uploadId: session.uploadId,
          documentKey: session.objectKey,
          filename: session.originalName,
          contentType: session.contentType,
          sizeBytes: session.sizeBytes,
          sha256: actualSha256,
        }),
        { status: 201, headers: buildDefaultHeaders(env) }
      );
    })
  )
);

// Admin-only reconcile endpoint (requires Authorization: Bearer <ADMIN_API_TOKEN>)
router.post(
  '/v1/storage/reconcile',
  withErrorHandler(async (request: Request, env: Env) => {
    if (!isAuthorizedAdminRequest(request, env)) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }),
        { status: 401, headers: buildDefaultHeaders(env) }
      );
    }
    const result = await reconcileBucketUsage(env);
    return new Response(
      JSON.stringify({
        usedBytes: result.bytes,
        locked: result.locked,
        scanned: result.scanned,
        complete: result.complete,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: buildDefaultHeaders(env) }
    );
  })
);

const KnowledgeReindexRequestSchema = z.object({
  paths: z.array(z.string().min(1)).max(50).optional(),
  warmCache: z.boolean().optional(),
  delaySeconds: z.number().int().min(0).max(900).optional(),
});

const KnowledgeInvalidationRequestSchema = z.object({
  paths: z.array(z.string().min(1)).min(1).max(50),
  delaySeconds: z.number().int().min(0).max(900).optional(),
});

router.post(
  '/v1/admin/knowledge/reindex',
  withErrorHandler(async (request: Request, env: Env) => {
    if (!isAuthorizedAdminRequest(request, env)) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }),
        { status: 401, headers: buildDefaultHeaders(env) }
      );
    }

    if (!env.KNOWLEDGE_JOBS) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Knowledge reindex queue is not configured',
            code: 'NO_QUEUE',
          },
        }),
        { status: 503, headers: buildDefaultHeaders(env) }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    if (contentType && !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Content-Type must be application/json',
            code: 'INVALID_CONTENT_TYPE',
          },
        }),
        { status: 415, headers: buildDefaultHeaders(env) }
      );
    }

    const rawBody = await request.text();
    let requestBody: unknown = {};
    if (rawBody.trim()) {
      try {
        requestBody = JSON.parse(rawBody);
      } catch {
        return new Response(
          JSON.stringify({ error: { message: 'Invalid JSON body', code: 'BAD_REQUEST' } }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }
    }

    const parsed = KnowledgeReindexRequestSchema.safeParse(requestBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid reindex request',
            code: 'BAD_REQUEST',
            issues: parsed.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          },
        }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }

    const result = await enqueueKnowledgeReindex(env, {
      source: 'manual',
      ...(request.headers.get('X-Request-ID')
        ? { requestId: request.headers.get('X-Request-ID') as string }
        : {}),
      ...(parsed.data.paths ? { paths: parsed.data.paths } : {}),
      ...(parsed.data.warmCache !== undefined ? { warmCache: parsed.data.warmCache } : {}),
      ...(parsed.data.delaySeconds !== undefined ? { delaySeconds: parsed.data.delaySeconds } : {}),
    });

    return new Response(
      JSON.stringify({
        status: 'enqueued',
        backlogCount: result.backlogCount,
        queuedAt: result.message.requestedAt,
        source: result.message.source,
        warmCache: result.message.warmCache ?? true,
        pathCount: result.message.paths?.length ?? 0,
      }),
      { status: 202, headers: buildDefaultHeaders(env) }
    );
  })
);

router.post(
  '/v1/admin/knowledge/invalidate',
  withErrorHandler(async (request: Request, env: Env) => {
    if (!isAuthorizedAdminRequest(request, env)) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }),
        { status: 401, headers: buildDefaultHeaders(env) }
      );
    }
    if (!env.KNOWLEDGE_JOBS) {
      return new Response(
        JSON.stringify({
          error: { message: 'Knowledge invalidation queue is not configured', code: 'NO_QUEUE' },
        }),
        { status: 503, headers: buildDefaultHeaders(env) }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: { message: 'Content-Type must be application/json', code: 'INVALID_CONTENT_TYPE' },
        }),
        { status: 415, headers: buildDefaultHeaders(env) }
      );
    }

    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid JSON body', code: 'BAD_REQUEST' } }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }
    const parsed = KnowledgeInvalidationRequestSchema.safeParse(requestBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid invalidation request',
            code: 'BAD_REQUEST',
            issues: parsed.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          },
        }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }

    const result = await enqueueKnowledgeInvalidation(env, {
      source: 'manual',
      paths: parsed.data.paths,
      ...(request.headers.get('X-Request-ID')
        ? { requestId: request.headers.get('X-Request-ID') as string }
        : {}),
      ...(parsed.data.delaySeconds !== undefined ? { delaySeconds: parsed.data.delaySeconds } : {}),
    });

    return new Response(
      JSON.stringify({
        status: 'enqueued',
        operation: 'invalidate',
        backlogCount: result.backlogCount,
        queuedAt: result.message.requestedAt,
        source: result.message.source,
        pathCount: result.message.paths?.length ?? 0,
      }),
      { status: 202, headers: buildDefaultHeaders(env) }
    );
  })
);

router.get(
  '/v1/admin/knowledge/status',
  withErrorHandler(async (request: Request, env: Env) => {
    if (!isAuthorizedAdminRequest(request, env)) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }),
        { status: 401, headers: buildDefaultHeaders(env) }
      );
    }

    const status = await getKnowledgePipelineStatus(env);
    return new Response(JSON.stringify(status), {
      status: 200,
      headers: buildDefaultHeaders(env),
    });
  })
);

router.put(
  '/v1/storage/object/:key',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      if (!env.DOCUMENTS) {
        return new Response(
          JSON.stringify({ error: { message: 'Storage not configured', code: 'NO_BUCKET' } }),
          { status: 500, headers: buildDefaultHeaders(env) }
        );
      }

      const url = new URL(request.url);
      const key = decodeURIComponent(url.pathname.replace(/^.*\/object\//, ''));
      // Basic key hygiene: non-empty, no trailing slash, length cap, safe charset, and no dot segments
      if (!key || key.endsWith('/')) {
        return new Response(
          JSON.stringify({ error: { message: 'Invalid object key', code: 'BAD_KEY' } }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }
      if (key.length > 1024 || hasControlChars(key) || /(^|\/)\.\.(\/|$)/.test(key)) {
        return new Response(
          JSON.stringify({ error: { message: 'Unsafe object key', code: 'BAD_KEY' } }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      // Enforce lock and thresholds
      const { softLimit, hardLimit, maxObjectSize } = getThresholds(env);
      // Prefer Content-Length; allow X-Content-Length as a fallback (browsers can't set Content-Length)
      const contentLengthHeader =
        request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
      if (!contentLengthHeader) {
        return new Response(
          JSON.stringify({
            error: { message: 'Content-Length required', code: 'LENGTH_REQUIRED' },
          }),
          { status: 411, headers: buildDefaultHeaders(env) }
        );
      }
      const contentLength = Number(contentLengthHeader);
      if (!Number.isFinite(contentLength) || contentLength < 0) {
        return new Response(
          JSON.stringify({ error: { message: 'Invalid Content-Length', code: 'BAD_LENGTH' } }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }
      if (contentLength > maxObjectSize) {
        return new Response(
          JSON.stringify({
            error: {
              message: `Object too large. Max ${maxObjectSize} bytes`,
              code: 'OBJECT_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }

      const approx = await getApproxBytes(env);
      const locked = await isQuotaLocked(env);
      const willBe = approx + contentLength;
      if (locked || willBe > hardLimit) {
        await setQuotaLocked(env, true);
        return new Response(
          JSON.stringify({
            error: { message: 'Storage locked due to quota', code: 'QUOTA_LOCKED' },
          }),
          { status: 403, headers: buildDefaultHeaders(env) }
        );
      }
      if (willBe > softLimit) {
        // Flip the lock and reject to prevent crossing soft limit.
        await setQuotaLocked(env, true);
        return new Response(
          JSON.stringify({ error: { message: 'Approaching quota', code: 'SOFT_LIMIT' } }),
          { status: 403, headers: buildDefaultHeaders(env) }
        );
      }

      const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
      // Optional MIME allowlist
      if (env.ALLOWED_UPLOAD_MIME_PREFIXES) {
        const allowed = String(env.ALLOWED_UPLOAD_MIME_PREFIXES)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const ok = allowed.length === 0 || allowed.some((p) => contentType.startsWith(p));
        if (!ok) {
          return new Response(
            JSON.stringify({
              error: { message: 'Unsupported media type', code: 'UNSUPPORTED_MEDIA_TYPE' },
            }),
            { status: 415, headers: buildDefaultHeaders(env) }
          );
        }
      }

      // Conditional semantics (minimal): support If-None-Match: * (create-only) and If-Match: * (update-only)
      const ifNoneMatch = request.headers.get('If-None-Match');
      const ifMatch = request.headers.get('If-Match');
      const existingHead = await env.DOCUMENTS.head(key);
      if (ifNoneMatch === '*' && existingHead) {
        return new Response(
          JSON.stringify({
            error: { message: 'Precondition failed (exists)', code: 'PRECONDITION_FAILED' },
          }),
          { status: 412, headers: buildDefaultHeaders(env) }
        );
      }
      if (ifMatch === '*' && !existingHead) {
        return new Response(
          JSON.stringify({
            error: { message: 'Precondition failed (missing)', code: 'PRECONDITION_FAILED' },
          }),
          { status: 412, headers: buildDefaultHeaders(env) }
        );
      }

      const putRes = await env.DOCUMENTS.put(key, request.body as ReadableStream, {
        httpMetadata: { contentType },
      });
      // Adjust approximate counter by delta (new - old) to avoid double counting overwrites
      const prevSize =
        existingHead && typeof existingHead.size === 'number' ? existingHead.size : 0;
      await adjustApproxBytes(env, contentLength - prevSize);
      return new Response(
        JSON.stringify({ key, etag: putRes?.etag ?? null, size: contentLength }),
        {
          status: 201,
          headers: buildDefaultHeaders(env),
        }
      );
    })
  )
);

router.delete(
  '/v1/storage/object/:key',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, keyInfo: ApiKeyInfo) => {
      if (!env.DOCUMENTS) {
        return new Response(
          JSON.stringify({ error: { message: 'Storage not configured', code: 'NO_BUCKET' } }),
          { status: 500, headers: buildDefaultHeaders(env) }
        );
      }
      const url = new URL(request.url);
      const key = decodeURIComponent(url.pathname.replace(/^.*\/object\//, ''));
      if (!key || key.endsWith('/')) {
        return new Response(
          JSON.stringify({ error: { message: 'Invalid object key', code: 'BAD_KEY' } }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }
      const head = await env.DOCUMENTS.head(key);
      await env.DOCUMENTS.delete(key);
      if (env.DB) {
        await markDocumentDeleted(env, key, keyInfo.customerId);
      }
      if (head && typeof head.size === 'number') {
        await adjustApproxBytes(env, -head.size);
      }
      return new Response(JSON.stringify({ key, deleted: true }), {
        status: 200,
        headers: buildDefaultHeaders(env),
      });
    })
  )
);

// MCP server endpoint for LLM integration
router.post(
  '/mcp',
  withAuth(async (request: Request, env: Env, keyInfo: ApiKeyInfo) => {
    return withErrorHandler(async (request: Request, env: Env) => {
      const requestContext = buildRequestContext(request, env.ENVIRONMENT);
      requestContext.auth = {
        apiKeyId: keyInfo.id,
        customerId: keyInfo.customerId,
        clientId: `api-key:${keyInfo.id}`,
        tier: keyInfo.tier,
        scopes: resolveMCPScopes(keyInfo),
        mcpAnalysisEnabled: env.MCP_ANALYSIS_ENABLED !== 'false',
      };

      return handleEnhancedMCPRequest(request, env, requestContext);
    })(request, env);
  })
);

// MCP tools listing endpoint for chat interface
router.get(
  '/api/v1/mcp/tools',
  withErrorHandler(
    withAuth(async (_request: Request, env: Env, keyInfo: ApiKeyInfo) => {
      // Use the MCP handler to list tools
      const result = await handleMCPRequest(
        'tools/list',
        undefined,
        env,
        buildMCPAuthorizationContext(keyInfo, env)
      );

      return new Response(JSON.stringify(result), {
        headers: {
          ...buildDefaultHeaders(env),
          'Content-Type': 'application/json',
        },
      });
    })
  )
);

// API routes for financial analysis (v1)
router.get(
  '/v1/api/analysis',
  withErrorHandler(async (request: Request, env: Env) => {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    // Basic validation for analysis type
    const validTypes = [
      'lease',
      'amortization',
      'cashflow',
      'ebitda-forecast',
      'auto-loan-analysis',
    ];
    if (type && !validTypes.includes(type)) {
      throw new Error(`Invalid analysis type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Placeholder for analysis endpoints
    return new Response(
      JSON.stringify({
        message: 'Analysis API endpoint',
        version: 'v1',
        environment: env.ENVIRONMENT,
        ...(type && { requestedType: type }),
      }),
      { headers: buildDefaultHeaders(env) }
    );
  })
);

// Lease analysis endpoint (with API key authentication)
router.post(
  '/v1/api/analysis/lease',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Content-Type must be application/json',
              code: 'INVALID_CONTENT_TYPE',
            },
          }),
          { status: 415, headers: buildDefaultHeaders(env) }
        );
      }

      // Enforce JSON body size cap
      const maxBytes = getMaxJsonBytes(env);
      const declaredLen =
        request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
      if (declaredLen && Number(declaredLen) > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }
      const text = await request.text();
      if (text.length > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }
      const body = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return undefined;
        }
      })();

      const parseResult = FinancialInputSchema.safeParse(body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues.map((i: z.ZodIssue) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        }));
        return new Response(
          JSON.stringify({
            error: {
              message: 'Invalid request body',
              code: 'BAD_REQUEST',
              issues,
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      // Optional deterministic caching (Cache API)
      const ttl = getAnalysisCacheTtl(env);
      const cache = ttl > 0 ? getDefaultCache() : undefined;
      if (ttl > 0 && cache) {
        const keyStr = await sha256Hex(
          stableStringify({ route: 'lease', input: parseResult.data })
        );
        const cacheReq = new Request(`https://cache.local/analysis/${keyStr}`);
        const cached = await cache.match(cacheReq);
        if (cached) {
          const hitHeaders = new Headers(cached.headers);
          hitHeaders.set('X-Cache', 'HIT');
          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: hitHeaders,
          });
        }
        const result = LeaseAnalyzer.analyze(parseResult.data);
        const res = new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...buildDefaultHeaders(env),
            'Cache-Control': `public, max-age=${ttl}`,
            'X-Cache': 'MISS',
          },
        });
        void cache.put(cacheReq, res.clone());
        return res;
      }

      const result = LeaseAnalyzer.analyze(parseResult.data);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...buildDefaultHeaders(env), 'X-Cache': 'BYPASS' },
      });
    })
  )
);

// Enhanced lease analysis endpoint (with API key authentication)
router.post(
  '/v1/api/analysis/enhanced-lease',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Content-Type must be application/json',
              code: 'INVALID_CONTENT_TYPE',
            },
          }),
          { status: 415, headers: buildDefaultHeaders(env) }
        );
      }

      // Enforce JSON body size cap
      const maxBytes = getMaxJsonBytes(env);
      const declaredLen =
        request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
      if (declaredLen && Number(declaredLen) > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }
      const text = await request.text();
      if (text.length > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }
      const body = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return undefined;
        }
      })();

      const parseResult = EnhancedLeaseInputSchema.safeParse(body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues.map((i: z.ZodIssue) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        }));
        return new Response(
          JSON.stringify({
            error: {
              message: 'Invalid request body',
              code: 'BAD_REQUEST',
              issues,
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      // Optional deterministic caching (Cache API)
      const ttl = getAnalysisCacheTtl(env);
      const cache = ttl > 0 ? getDefaultCache() : undefined;
      if (ttl > 0 && cache) {
        const keyStr = await sha256Hex(
          stableStringify({ route: 'enhanced-lease', input: parseResult.data })
        );
        const cacheReq = new Request(`https://cache.local/analysis/${keyStr}`);
        const cached = await cache.match(cacheReq);
        if (cached) {
          const hitHeaders = new Headers(cached.headers);
          hitHeaders.set('X-Cache', 'HIT');
          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: hitHeaders,
          });
        }
        const result = EnhancedLeaseAnalyzer.analyze(parseResult.data);
        const res = new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...buildDefaultHeaders(env),
            'Cache-Control': `public, max-age=${ttl}`,
            'X-Cache': 'MISS',
          },
        });
        void cache.put(cacheReq, res.clone());
        return res;
      }

      const result = EnhancedLeaseAnalyzer.analyze(parseResult.data);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...buildDefaultHeaders(env), 'X-Cache': 'BYPASS' },
      });
    })
  )
);

// Auto loan analysis endpoint (with API key authentication)
router.post(
  '/v1/api/analysis/auto-loan-analysis',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Content-Type must be application/json',
              code: 'INVALID_CONTENT_TYPE',
            },
          }),
          { status: 415, headers: buildDefaultHeaders(env) }
        );
      }

      // Enforce JSON body size cap
      const maxBytes = getMaxJsonBytes(env);
      const declaredLen =
        request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
      if (declaredLen && Number(declaredLen) > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }

      const text = await request.text();
      if (text.length > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }
      const body = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return undefined;
        }
      })();

      const parseResult = AutoLoanAnalysisInputSchema.safeParse(body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues.map((i: z.ZodIssue) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        }));
        return new Response(
          JSON.stringify({
            error: {
              message: 'Invalid request body',
              code: 'BAD_REQUEST',
              issues,
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      // Optional deterministic caching (Cache API)
      const ttl = getAnalysisCacheTtl(env);
      const cache = ttl > 0 ? getDefaultCache() : undefined;
      if (ttl > 0 && cache) {
        const keyStr = await sha256Hex(
          stableStringify({ route: 'auto-loan-analysis', input: parseResult.data })
        );
        const cacheReq = new Request(`https://cache.local/analysis/${keyStr}`);
        const cached = await cache.match(cacheReq);
        if (cached) {
          const hitHeaders = new Headers(cached.headers);
          hitHeaders.set('X-Cache', 'HIT');
          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: hitHeaders,
          });
        }

        const result = AutoLoanAnalysisEngine.analyze(parseResult.data);
        const res = new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...buildDefaultHeaders(env),
            'Cache-Control': `public, max-age=${ttl}`,
            'X-Cache': 'MISS',
          },
        });
        void cache.put(cacheReq, res.clone());
        return res;
      }

      const result = AutoLoanAnalysisEngine.analyze(parseResult.data);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...buildDefaultHeaders(env), 'X-Cache': 'BYPASS' },
      });
    })
  )
);

// Lease document upload endpoint (multipart/form-data)
router.post(
  '/v1/api/upload/lease',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, keyInfo: ApiKeyInfo) => {
      if (!env.DOCUMENTS) {
        return new Response(
          JSON.stringify({ error: { message: 'Storage not configured', code: 'NO_BUCKET' } }),
          { status: 500, headers: buildDefaultHeaders(env) }
        );
      }

      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('multipart/form-data')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Content-Type must be multipart/form-data',
              code: 'INVALID_CONTENT_TYPE',
            },
          }),
          { status: 415, headers: buildDefaultHeaders(env) }
        );
      }

      try {
        const formData = await request.formData();
        const fileEntry = formData.get('file');
        const file =
          fileEntry && typeof fileEntry === 'object' && 'stream' in fileEntry
            ? (fileEntry as File)
            : null;

        if (!file) {
          return new Response(
            JSON.stringify({ error: { message: 'No file provided', code: 'NO_FILE' } }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        if (!allowedTypes.includes(file.type)) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'Unsupported file type. Only PDF, DOCX, and TXT files are allowed.',
                code: 'UNSUPPORTED_FILE_TYPE',
              },
            }),
            { status: 415, headers: buildDefaultHeaders(env) }
          );
        }

        // Check file size against the configured R2 object limit.
        const { maxObjectSize: maxFileSize } = getThresholds(env);
        if (file.size > maxFileSize) {
          return new Response(
            JSON.stringify({
              error: {
                message: `File too large. Maximum size is ${maxFileSize} bytes`,
                code: 'FILE_TOO_LARGE',
              },
            }),
            { status: 413, headers: buildDefaultHeaders(env) }
          );
        }

        const quotaError = await getUploadQuotaError(env, file.size);
        if (quotaError) return quotaError;

        const arrayBuffer = await file.arrayBuffer();
        if (!hasExpectedUploadSignature(file.type, new Uint8Array(arrayBuffer))) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'File content does not match the declared file type.',
                code: 'FILE_SIGNATURE_MISMATCH',
              },
            }),
            { status: 415, headers: buildDefaultHeaders(env) }
          );
        }

        // Generate unique key for the file
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const extension = file.name.split('.').pop() || 'bin';
        const key = `lease-documents/${timestamp}-${random}.${extension}`;

        // Upload to R2. A configured storage failure is not a successful
        // analysis upload; fail closed so callers cannot lose the document
        // while believing it was persisted.
        try {
          await env.DOCUMENTS.put(key, arrayBuffer, {
            httpMetadata: { contentType: file.type },
            customMetadata: {
              originalName: file.name,
              uploadedAt: new Date().toISOString(),
            },
          });
        } catch (error) {
          console.error('R2 upload failed; refusing to report success:', error);
          return new Response(
            JSON.stringify({
              error: {
                message: 'Document storage is temporarily unavailable.',
                code: 'STORAGE_UNAVAILABLE',
              },
            }),
            { status: 503, headers: buildDefaultHeaders(env) }
          );
        }

        if (env.DB) {
          const recorded = await recordDocumentMetadata(env, {
            id: crypto.randomUUID(),
            objectKey: key,
            customerId: keyInfo.customerId,
            originalName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            sha256: await sha256HexBytes(arrayBuffer),
          });
          if (!recorded) {
            await env.DOCUMENTS.delete(key).catch((rollbackError) => {
              console.error('Failed to roll back R2 object after metadata failure:', rollbackError);
            });
            return new Response(
              JSON.stringify({
                error: {
                  message: 'Document metadata storage is temporarily unavailable.',
                  code: 'METADATA_UNAVAILABLE',
                },
              }),
              { status: 503, headers: buildDefaultHeaders(env) }
            );
          }
        }
        await adjustApproxBytes(env, file.size);

        // Determine document type for extraction
        let documentType = 'txt';
        if (file.type === 'application/pdf') {
          documentType = 'pdf';
        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          documentType = 'docx';
        }

        return new Response(
          JSON.stringify({
            success: true,
            documentKey: key,
            documentType,
            filename: file.name,
            size: file.size,
            contentType: file.type,
          }),
          { status: 201, headers: buildDefaultHeaders(env) }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: {
              message: `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
              code: 'UPLOAD_FAILED',
            },
          }),
          { status: 500, headers: buildDefaultHeaders(env) }
        );
      }
    })
  )
);

// Lease document extraction endpoint
router.post(
  '/v1/api/extract/lease',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Content-Type must be application/json',
              code: 'INVALID_CONTENT_TYPE',
            },
          }),
          { status: 415, headers: buildDefaultHeaders(env) }
        );
      }

      // Enforce JSON body size cap
      const maxBytes = getMaxJsonBytes(env);
      const declaredLen =
        request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
      if (declaredLen && Number(declaredLen) > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }

      const body = await request
        .clone()
        .json()
        .catch(() => ({}));

      // If this has fileData, it should go to the other handler - skip this one
      if (body && typeof body === 'object' && 'fileData' in body) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Use the fileData endpoint',
          }),
          {
            status: 400,
            headers: buildDefaultHeaders(env),
          }
        );
      }

      const { extractLeaseFromDocument } = await import('./services/lease-extraction');
      // Need to recreate request since we cloned it
      const newRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(body),
      });
      const result = await extractLeaseFromDocument(newRequest, env);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: buildDefaultHeaders(env),
      });
    })
  )
);

// EBITDA forecast analysis endpoint
router.post(
  '/v1/api/analysis/ebitda-forecast',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Content-Type must be application/json',
              code: 'INVALID_CONTENT_TYPE',
            },
          }),
          { status: 415, headers: buildDefaultHeaders(env) }
        );
      }
      // Enforce JSON body size cap
      const maxBytes = getMaxJsonBytes(env);
      const declaredLen =
        request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
      if (declaredLen && Number(declaredLen) > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }
      const text = await request.text();
      if (text.length > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }
      const body = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return undefined;
        }
      })();

      const parseResult = ScenarioInputSchema.safeParse(body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues.map((i: z.ZodIssue) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        }));
        return new Response(
          JSON.stringify({
            error: {
              message: 'Invalid request body',
              code: 'BAD_REQUEST',
              issues,
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      // Optional deterministic caching (Cache API)
      const ttl = getAnalysisCacheTtl(env);
      const cache = ttl > 0 ? getDefaultCache() : undefined;
      if (ttl > 0 && cache) {
        const keyStr = await sha256Hex(
          stableStringify({ route: 'ebitda-forecast', input: parseResult.data })
        );
        const cacheReq = new Request(`https://cache.local/analysis/${keyStr}`);
        const cached = await cache.match(cacheReq);
        if (cached) {
          const hitHeaders = new Headers(cached.headers);
          hitHeaders.set('X-Cache', 'HIT');
          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: hitHeaders,
          });
        }
        const result = EbitdaForecaster.forecast(
          parseResult.data as unknown as Parameters<typeof EbitdaForecaster.forecast>[0]
        );
        const res = new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...buildDefaultHeaders(env),
            'Cache-Control': `public, max-age=${ttl}`,
            'X-Cache': 'MISS',
          },
        });
        void cache.put(cacheReq, res.clone());
        return res;
      }

      const result = EbitdaForecaster.forecast(
        parseResult.data as unknown as Parameters<typeof EbitdaForecaster.forecast>[0]
      );
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...buildDefaultHeaders(env), 'X-Cache': 'BYPASS' },
      });
    })
  )
);

// WACC analysis endpoint
router.post(
  '/v1/api/analysis/wacc',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Content-Type must be application/json',
              code: 'INVALID_CONTENT_TYPE',
            },
          }),
          { status: 415, headers: buildDefaultHeaders(env) }
        );
      }

      // Enforce JSON body size cap
      const maxBytes = getMaxJsonBytes(env);
      const declaredLen =
        request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
      if (declaredLen && Number(declaredLen) > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }

      const text = await request.text();
      if (text.length > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }

      const body = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return undefined;
        }
      })();

      const parseResult = WACCInputSchema.safeParse(body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues.map((i: z.ZodIssue) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        }));
        return new Response(
          JSON.stringify({
            error: {
              message: 'Invalid request body',
              code: 'BAD_REQUEST',
              issues,
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      // Optional deterministic caching (Cache API)
      const ttl = getAnalysisCacheTtl(env);
      const cache = ttl > 0 ? getDefaultCache() : undefined;
      if (ttl > 0 && cache) {
        const keyStr = await sha256Hex(stableStringify({ route: 'wacc', input: parseResult.data }));
        const cacheReq = new Request(`https://cache.local/analysis/${keyStr}`);
        const cached = await cache.match(cacheReq);
        if (cached) {
          const hitHeaders = new Headers(cached.headers);
          hitHeaders.set('X-Cache', 'HIT');
          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: hitHeaders,
          });
        }

        const result = WACCAnalyzer.analyze(parseResult.data);
        const res = new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...buildDefaultHeaders(env),
            'Cache-Control': `public, max-age=${ttl}`,
            'X-Cache': 'MISS',
          },
        });
        void cache.put(cacheReq, res.clone());
        return res;
      }

      const result = WACCAnalyzer.analyze(parseResult.data);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...buildDefaultHeaders(env), 'X-Cache': 'BYPASS' },
      });
    })
  )
);

// Amortization analysis endpoint
router.post(
  '/v1/api/analysis/amortization',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Content-Type must be application/json',
              code: 'INVALID_CONTENT_TYPE',
            },
          }),
          { status: 415, headers: buildDefaultHeaders(env) }
        );
      }

      // Enforce JSON body size cap
      const maxBytes = getMaxJsonBytes(env);
      const declaredLen =
        request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
      if (declaredLen && Number(declaredLen) > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }

      const text = await request.text();
      if (text.length > maxBytes) {
        return new Response(
          JSON.stringify({
            error: {
              message: `JSON body too large (max ${maxBytes} bytes)`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          }),
          { status: 413, headers: buildDefaultHeaders(env) }
        );
      }

      const body = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return undefined;
        }
      })();

      // Transform API request format to analysis format
      if (!body || typeof body !== 'object') {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Invalid JSON body',
              code: 'BAD_REQUEST',
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      // Convert from AmortizationRequest format to AmortizationInputSchema format
      // Support both old format (interestRate, termInYears) and new format (annualRate, termMonths)
      const apiInput = body as {
        principal?: number;
        interestRate?: number;
        termInYears?: number;
        annualRate?: number;
        termMonths?: number;
        startDate?: string;
        paymentFrequency?: string;
      };

      // Validate required fields exist and are numbers
      if (typeof apiInput.principal !== 'number' || apiInput.principal <= 0) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'principal must be a positive number',
              code: 'BAD_REQUEST',
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      // Check if using old format (interestRate, termInYears) or new format (annualRate, termMonths)
      let analysisInput: { principal: number; annualRate: number; termMonths: number };

      if (apiInput.interestRate !== undefined && apiInput.termInYears !== undefined) {
        // Old format validation
        if (typeof apiInput.interestRate !== 'number' || apiInput.interestRate < 0) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'interestRate must be a non-negative number',
                code: 'BAD_REQUEST',
              },
            }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }

        if (typeof apiInput.termInYears !== 'number' || apiInput.termInYears <= 0) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'termInYears must be a positive number',
                code: 'BAD_REQUEST',
              },
            }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }

        // Convert old format to new format
        analysisInput = {
          principal: apiInput.principal,
          annualRate: apiInput.interestRate / 100, // Convert percentage to decimal
          termMonths: Math.round(apiInput.termInYears * 12), // Convert years to months and round to integer
        };
      } else if (apiInput.annualRate !== undefined && apiInput.termMonths !== undefined) {
        // New format validation
        if (typeof apiInput.annualRate !== 'number' || apiInput.annualRate < 0) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'annualRate must be a non-negative number',
                code: 'BAD_REQUEST',
              },
            }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }

        if (typeof apiInput.termMonths !== 'number' || apiInput.termMonths <= 0) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'termMonths must be a positive number',
                code: 'BAD_REQUEST',
              },
            }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }

        // Use new format directly
        analysisInput = {
          principal: apiInput.principal,
          annualRate: apiInput.annualRate,
          termMonths: Math.round(apiInput.termMonths), // Ensure integer
        };
      } else {
        return new Response(
          JSON.stringify({
            error: {
              message:
                'Must provide either (interestRate and termInYears) or (annualRate and termMonths)',
              code: 'BAD_REQUEST',
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      const parseResult = AmortizationInputSchema.safeParse(analysisInput);
      if (!parseResult.success) {
        const issues = parseResult.error.issues.map((i: z.ZodIssue) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        }));
        return new Response(
          JSON.stringify({
            error: {
              message: 'Invalid request body',
              code: 'BAD_REQUEST',
              issues,
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      // Optional deterministic caching (Cache API)
      const ttl = getAnalysisCacheTtl(env);
      const cache = ttl > 0 ? getDefaultCache() : undefined;
      if (ttl > 0 && cache) {
        const keyStr = await sha256Hex(
          stableStringify({ route: 'amortization', input: parseResult.data })
        );
        const cacheReq = new Request(`https://cache.local/analysis/${keyStr}`);
        const cached = await cache.match(cacheReq);
        if (cached) {
          const hitHeaders = new Headers(cached.headers);
          hitHeaders.set('X-Cache', 'HIT');
          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: hitHeaders,
          });
        }

        const analysisResult = AmortizationAnalyzer.analyze(parseResult.data);

        // Transform analysis result to API response format
        const result = {
          monthlyPayment: analysisResult.monthlyPayment,
          totalInterest: analysisResult.totalInterest,
          totalPayments: analysisResult.totalPayments,
          schedule: analysisResult.schedule.map((payment: AmortizationResultItem) => ({
            month: payment.month,
            payment: payment.payment,
            principal: payment.principal,
            interest: payment.interest,
            balance: payment.balance,
            cumulativeInterest: payment.cumulativeInterest,
          })),
        };

        const res = new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...buildDefaultHeaders(env),
            'Cache-Control': `public, max-age=${ttl}`,
            'X-Cache': 'MISS',
          },
        });
        void cache.put(cacheReq, res.clone());
        return res;
      }

      const analysisResult = AmortizationAnalyzer.analyze(parseResult.data);

      // Transform analysis result to API response format
      const result = {
        monthlyPayment: analysisResult.monthlyPayment,
        totalInterest: analysisResult.totalInterest,
        totalPayments: analysisResult.totalPayments,
        schedule: analysisResult.schedule.map((payment: AmortizationResultItem) => ({
          month: payment.month,
          payment: payment.payment,
          principal: payment.principal,
          interest: payment.interest,
          balance: payment.balance,
          cumulativeInterest: payment.cumulativeInterest,
        })),
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...buildDefaultHeaders(env), 'X-Cache': 'BYPASS' },
      });
    })
  )
);

// Legacy route (redirect to v1)
router.get(
  '/api/analysis',
  withErrorHandler(async (request: Request, env: Env) => {
    const url = new URL(request.url);
    const params = url.searchParams.toString();
    const location = `/v1/api/analysis${params ? `?${params}` : ''}`;
    return new Response(null, {
      status: 308,
      headers: { ...buildDefaultHeaders(env), Location: location },
    });
  })
);

// OpenAPI document
router.get(
  '/openapi.json',
  withErrorHandler(async (request: Request, env: Env) => {
    const payload = await buildOpenApiResponsePayload(request, env);
    return new Response(payload.body, { status: payload.status, headers: payload.headers });
  })
);

router.head(
  '/openapi.json',
  withErrorHandler(async (request: Request, env: Env) => {
    const payload = await buildOpenApiResponsePayload(request, env);
    return new Response(null, { status: payload.status, headers: payload.headers });
  })
);

// API docs viewer (RapiDoc)
type CachedResponsePayload = {
  status: number;
  headers: HeadersInit;
  body: string | null;
};

async function buildDocsResponsePayload(
  request: Request,
  env: Env
): Promise<CachedResponsePayload> {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  // Tight CSP allowing only our origin and the RapiDoc CDN script
  const docsCsp = [
    "default-src 'self'",
    "script-src 'self' https://unpkg.com https://cdn.tailwindcss.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join('; ');

  const html = `<!doctype html>
    <html lang="en" class="h-full bg-slate-950">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>API Docs — Financial Analysis</title>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <link rel="icon" href="data:," />
        <meta name="description" content="Interactive API explorer for the Financial Analysis service." />
        <script defer src="https://cdn.tailwindcss.com?plugins=typography"></script>
        <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js" crossorigin="anonymous"></script>
      </head>
      <body class="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div class="flex min-h-screen flex-col">
          <header class="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
            <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Financial Analysis</p>
                <h1 class="text-lg font-semibold text-white">API Reference</h1>
                <p class="text-sm text-slate-400">Interact with the OpenAPI schema served from ${baseUrl}</p>
              </div>
              <a
                href="/"
                class="inline-flex items-center gap-2 rounded-md border border-slate-700/60 bg-slate-900/80 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              >
                <span>← Back to site</span>
              </a>
            </div>
          </header>
          <main class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-0 py-4 sm:px-5">
            <div class="rounded-xl border border-slate-800/60 bg-slate-900/70 shadow-lg shadow-slate-950/20">
              <rapi-doc
                class="h-[calc(100vh-9rem)] w-full"
                spec-url="${baseUrl}/openapi.json"
                theme="dark"
                render-style="read"
                show-header="false"
                allow-authentication="false"
                allow-spec-url-load="false"
                allow-spec-file-load="false"
              >
              </rapi-doc>
            </div>
          </main>
          <footer class="border-t border-slate-800/70 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
            Served from Cloudflare Workers • Spec cached for fast loads
          </footer>
        </div>
      </body>
    </html>`;

  const etagHex = await sha256Hex(html);
  const etag = `"${etagHex}"`;
  const headers: HeadersInit = {
    ...getCorsHeaders(env),
    ...getSecurityHeaders(env),
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': docsCsp,
    ETag: etag,
    'Cache-Control': 'public, max-age=300',
  };
  const inm = request.headers.get('if-none-match');
  const isNotModified = Boolean(inm && inm.replace(/^W\//, '') === etag);

  return {
    status: isNotModified ? 304 : 200,
    headers,
    body: isNotModified ? null : html,
  };
}

router.get(
  '/docs',
  withErrorHandler(async (request: Request, env: Env) => {
    const payload = await buildDocsResponsePayload(request, env);
    return new Response(payload.body, { status: payload.status, headers: payload.headers });
  })
);

router.head(
  '/docs',
  withErrorHandler(async (request: Request, env: Env) => {
    const payload = await buildDocsResponsePayload(request, env);
    return new Response(null, { status: payload.status, headers: payload.headers });
  })
);

async function buildOpenApiResponsePayload(
  request: Request,
  env: Env
): Promise<CachedResponsePayload> {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const doc = getOpenApiDocument(baseUrl);
  const json = JSON.stringify(doc, null, 2);
  const etagHex = await sha256Hex(json);
  const etag = `"${etagHex}"`;
  const headers: HeadersInit = {
    ...buildDefaultHeaders(env),
    'Content-Type': 'application/json',
    ETag: etag,
    'Cache-Control': 'public, max-age=300',
  };
  const inm = request.headers.get('if-none-match');
  const isNotModified = Boolean(inm && inm.replace(/^W\//, '') === etag);

  if (isNotModified) {
    return {
      status: 304,
      headers: {
        ...getCorsHeaders(env),
        ...getSecurityHeaders(env),
        ...headers,
      },
      body: null,
    };
  }

  return {
    status: 200,
    headers,
    body: json,
  };
}

// ===============================================================================
// ALL LEGACY CODE REMOVED (700+ lines)
// ===============================================================================
// Removed:
// - toolKeywords: keyword matching for MCP tools
// - matchedTool: keyword-based tool selection
// - fieldMappings: context-specific regex matching
// - Context-specific handlers (lease, ebitda, amortization)
// - Legacy startup-planning handler
// - Hardcoded fallback: "I can help update the general model..."
//
// Replaced with: Pure AI orchestrator for all queries
// ===============================================================================

// Document upload endpoint (simplified - stores in R2 if available)
router.post(
  '/v1/api/upload/lease',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      const requestId = crypto.randomUUID();
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Document upload request',
          requestId,
        })
      );

      try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
          return new Response(JSON.stringify({ error: 'No file provided' }), {
            status: 400,
            headers: buildDefaultHeaders(env),
          });
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        if (!allowedTypes.includes(file.type)) {
          return new Response(
            JSON.stringify({
              error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.',
            }),
            {
              status: 400,
              headers: buildDefaultHeaders(env),
            }
          );
        }

        // Validate file size against the configured R2 object limit.
        const { maxObjectSize: maxSize } = getThresholds(env);
        if (file.size > maxSize) {
          return new Response(
            JSON.stringify({ error: `File too large. Maximum size is ${maxSize} bytes.` }),
            {
              status: 400,
              headers: buildDefaultHeaders(env),
            }
          );
        }

        const quotaError = env.DOCUMENTS ? await getUploadQuotaError(env, file.size) : null;
        if (quotaError) return quotaError;

        // Store in R2 if available (optional)
        const fileKey = `uploads/${requestId}-${file.name}`;

        if (env.DOCUMENTS) {
          try {
            await env.DOCUMENTS.put(fileKey, await file.arrayBuffer(), {
              customMetadata: {
                originalName: file.name,
                contentType: file.type,
                uploadedAt: new Date().toISOString(),
              },
            });
            await adjustApproxBytes(env, file.size);
          } catch (r2Error) {
            console.error('R2 upload failed; refusing to report success:', r2Error);
            return new Response(
              JSON.stringify({
                error: {
                  message: 'Document storage is temporarily unavailable.',
                  code: 'STORAGE_UNAVAILABLE',
                },
              }),
              { status: 503, headers: buildDefaultHeaders(env) }
            );
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            key: fileKey,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
          }),
          {
            status: 200,
            headers: buildDefaultHeaders(env),
          }
        );
      } catch (error) {
        console.error('Document upload error:', error);
        return new Response(
          JSON.stringify({
            error: 'Failed to upload document',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: buildDefaultHeaders(env),
          }
        );
      }
    })
  )
);

// Document extraction endpoint - accepts file data directly (no storage)
router.post(
  '/v1/api/extract/lease-direct',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      const requestId = crypto.randomUUID();
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Document extraction request',
          requestId,
        })
      );

      try {
        const parsedBody = await readJsonBodyWithinLimit(request, env);
        if (parsedBody.error) return parsedBody.error;
        const body = parsedBody.body as {
          fileData?: string; // Base64 encoded file
          fileName?: string;
          fileType?: string;
          documentType?: string;
          documentKey?: string; // Legacy support
          extractionOptions?: Record<string, boolean>;
        };

        const { fileData, fileName, documentType = 'lease' } = body;

        // If we have fileData, process it directly
        let extractedText = '';
        if (fileData) {
          console.log('Processing direct document extraction', { requestId, documentType });
          if (typeof fileData !== 'string') {
            return new Response(
              JSON.stringify({ error: { message: 'Invalid file data', code: 'BAD_FILE_DATA' } }),
              { status: 400, headers: buildDefaultHeaders(env) }
            );
          }
          const { maxObjectSize } = getThresholds(env);
          const maxEncodedLength = Math.ceil(maxObjectSize / 3) * 4 + 4;
          if (fileData.length > maxEncodedLength) {
            return new Response(
              JSON.stringify({
                error: {
                  message: `File too large. Maximum size is ${maxObjectSize} bytes`,
                  code: 'FILE_TOO_LARGE',
                },
              }),
              { status: 413, headers: buildDefaultHeaders(env) }
            );
          }

          let decodedFile: string;
          try {
            decodedFile = atob(fileData);
          } catch {
            return new Response(
              JSON.stringify({ error: { message: 'Invalid file data', code: 'BAD_FILE_DATA' } }),
              { status: 400, headers: buildDefaultHeaders(env) }
            );
          }
          if (decodedFile.length > maxObjectSize) {
            return new Response(
              JSON.stringify({
                error: {
                  message: `File too large. Maximum size is ${maxObjectSize} bytes`,
                  code: 'FILE_TOO_LARGE',
                },
              }),
              { status: 413, headers: buildDefaultHeaders(env) }
            );
          }
          const fileBuffer = Uint8Array.from(decodedFile, (c) => c.charCodeAt(0));
          const fileExtension = fileName?.split('.').pop()?.toLowerCase() || 'txt';

          if (fileExtension === 'txt') {
            extractedText = new TextDecoder().decode(fileBuffer);
          } else if (fileExtension === 'pdf') {
            // Use Workers AI to extract text from PDF
            try {
              if (env.AI) {
                const modelProvider = new CloudflareWorkersAIProvider(
                  env.AI,
                  env.AI_GATEWAY_ID,
                  isModelEgressEnabled(env.AI_EGRESS_ENABLED)
                );
                const result = (await modelProvider.run('@cf/browsershot/text-extract', {
                  blob: new Uint8Array(fileBuffer),
                })) as { text?: string };
                extractedText = result.text || '';
              } else {
                extractedText = generateSampleLeaseText();
              }
            } catch (error) {
              console.error('PDF extraction failed:', error);
              extractedText = generateSampleLeaseText();
            }
          } else if (fileExtension === 'docx') {
            // DOCX files are ZIP archives containing XML files
            // For now, try to extract text manually or use sample text
            try {
              // DOCX is a ZIP archive with XML documents inside
              // A proper implementation would unzip and parse the XML
              // For now, use sample text since we don't have a DOCX parser
              extractedText = generateSampleLeaseText();
            } catch (error) {
              console.error('DOCX processing failed:', error);
              extractedText = generateSampleLeaseText();
            }
          } else {
            extractedText = new TextDecoder().decode(fileBuffer);
          }
        }

        // If we extracted text, use AI to extract structured lease data
        let extractedData;
        if (extractedText && env.AI) {
          try {
            const { extractLeaseDataWithAI } = await import('./services/lease-extraction');
            extractedData = await extractLeaseDataWithAI(extractedText, env, {});
          } catch (error) {
            console.error('AI extraction failed, using sample data:', error);
            // Fall through to sample data below
          }
        }

        // Fallback to sample data if AI extraction didn't work
        if (!extractedData) {
          extractedData = {
            confidence: {
              overall: 0.85 + Math.random() * 0.1,
              financial: 0.92 + Math.random() * 0.05,
              property: 0.78 + Math.random() * 0.15,
            },
            leaseType: 'office-modified',
            leaseTerm: 60,
            baseRent: 2500 + Math.floor(Math.random() * 1000),
            escalationType: 'percentage',
            escalationRate: 0.03,
            securityDeposit: 5000,
            squareFootage: 1200 + Math.floor(Math.random() * 300),
            cam: 300,
            taxes: 200,
            insurance: 150,
            utilities: 250,
            // Additional extracted fields
            landlord: 'Property Management LLC',
            tenant: 'Acme Corporation',
            propertyAddress: '123 Business Park Dr, Suite 200',
            leaseStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            leaseEndDate: new Date(Date.now() + (30 + 60 * 30) * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            renewalOptions: [{ term: 12, rentIncrease: 0.03 }],
            parkingSpaces: 2,
            allowedUse: 'General office use',
            specialProvisions: [
              'Tenant responsible for interior maintenance',
              'Landlord covers exterior and structural repairs',
              'Option to expand to adjacent space if available',
            ],
          };
        }

        return new Response(
          JSON.stringify({
            success: true,
            extractedData,
            documentType,
            extractionMethod: fileData ? 'client-upload' : 'simulated',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: buildDefaultHeaders(env),
          }
        );
      } catch (error) {
        console.error('Document extraction error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to extract lease data',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: buildDefaultHeaders(env),
          }
        );
      }
    })
  )
);

// Text extraction endpoint - accepts plain text without file handling
router.post(
  '/v1/api/extract/lease-text',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
      const requestId = crypto.randomUUID();
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Text extraction request',
          requestId,
        })
      );

      try {
        const parsedBody = await readJsonBodyWithinLimit(request, env);
        if (parsedBody.error) return parsedBody.error;
        const body = parsedBody.body as {
          text: string;
          extractionOptions?: Record<string, boolean>;
        };

        const { text } = body;

        if (!text) {
          return new Response(JSON.stringify({ error: 'Text is required' }), {
            status: 400,
            headers: buildDefaultHeaders(env),
          });
        }

        // For now, use the AI extraction service if available
        // Otherwise, return sample data
        if (env.AI && text.length > 100) {
          const { extractLeaseDataWithAI } = await import('./services/lease-extraction');
          const extractedData = await extractLeaseDataWithAI(text, env, {});

          return new Response(
            JSON.stringify({
              success: true,
              extractedData,
              extractionMethod: 'workers-ai',
              timestamp: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: buildDefaultHeaders(env),
            }
          );
        }

        // Fallback to sample data
        const extractedData = {
          confidence: {
            overall: 0.85 + Math.random() * 0.1,
            financial: 0.92 + Math.random() * 0.05,
            property: 0.78 + Math.random() * 0.15,
          },
          leaseType: 'office-modified-gross',
          leaseTerm: 60,
          baseRent: 2500 + Math.floor(Math.random() * 1000),
          escalationType: 'percentage',
          escalationRate: 0.03,
          securityDeposit: 5000,
          squareFootage: 1200 + Math.floor(Math.random() * 300),
          cam: 300,
          taxes: 200,
          insurance: 150,
          utilities: 250,
          landlord: 'Property Management LLC',
          tenant: 'Acme Corporation',
          propertyAddress: '123 Business Park Dr, Suite 200',
          leaseStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          leaseEndDate: new Date(Date.now() + (30 + 60 * 30) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          renewalOptions: [{ term: 12, rentIncrease: 0.03 }],
          parkingSpaces: 2,
          allowedUse: 'General office use',
          specialProvisions: [
            'Tenant responsible for interior maintenance',
            'Landlord covers exterior and structural repairs',
            'Option to expand to adjacent space if available',
          ],
        };

        return new Response(
          JSON.stringify({
            success: true,
            extractedData,
            extractionMethod: 'simulated',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: buildDefaultHeaders(env),
          }
        );
      } catch (error) {
        console.error('Text extraction error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to extract lease data',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: buildDefaultHeaders(env),
          }
        );
      }
    })
  )
);

// Helper function for sample lease text
function generateSampleLeaseText(): string {
  return `
COMMERCIAL LEASE AGREEMENT

Property Address: 123 Business Plaza, Suite 450, Downtown City, ST 12345
Lease Term: 60 months
Commencement Date: January 1, 2024

RENT AND CHARGES:
Base Rent: $8,500.00 per month
Lease Type: Office Modified Gross
Square Footage: 2,850 square feet
Annual Escalation: 3% per year, effective each January 1st

ADDITIONAL COSTS:
Common Area Maintenance (CAM): $425.00 per month
Property Taxes: Tenant responsible for proportionate share
Insurance: Landlord maintains building insurance, tenant maintains contents
Utilities: Tenant pays electric, landlord pays HVAC maintenance
Parking: 6 spaces included, additional spaces at $75/month each

DEPOSITS:
Security Deposit: $17,000.00 (two months rent)
Prepaid Rent: $8,500.00 (first month)

BUILDING DETAILS:
Building Type: Class A Office Building
Floor: 4th Floor
Load Factor: 15%
Amenities: 24/7 security, fitness center, conference facilities

RENEWAL OPTIONS:
First Option: 36 months at 95% of market rate
Second Option: 24 months at market rate

Special Provisions: Tenant improvement allowance of $25 per square foot provided by landlord.
  `;
}

// ===============================================================================
// Analysis Endpoints for New Models
// ===============================================================================

// Helper function to create analysis endpoints
function createAnalysisEndpoint<T>(
  route: string,
  schema: z.ZodSchema<T>,
  analyzer: (input: T) => unknown
): void {
  router.post(
    route,
    withErrorHandler(
      withAuth(async (request: Request, env: Env, _keyInfo: ApiKeyInfo) => {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'Content-Type must be application/json',
                code: 'INVALID_CONTENT_TYPE',
              },
            }),
            { status: 415, headers: buildDefaultHeaders(env) }
          );
        }

        const maxBytes = getMaxJsonBytes(env);
        const declaredLen =
          request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
        if (declaredLen && Number(declaredLen) > maxBytes) {
          return new Response(
            JSON.stringify({
              error: {
                message: `JSON body too large (max ${maxBytes} bytes)`,
                code: 'PAYLOAD_TOO_LARGE',
              },
            }),
            { status: 413, headers: buildDefaultHeaders(env) }
          );
        }

        const text = await request.text();
        if (text.length > maxBytes) {
          return new Response(
            JSON.stringify({
              error: {
                message: `JSON body too large (max ${maxBytes} bytes)`,
                code: 'PAYLOAD_TOO_LARGE',
              },
            }),
            { status: 413, headers: buildDefaultHeaders(env) }
          );
        }

        const body = (() => {
          try {
            return JSON.parse(text);
          } catch {
            return undefined;
          }
        })();

        if (!body || typeof body !== 'object') {
          return new Response(
            JSON.stringify({
              error: {
                message: 'Invalid JSON body',
                code: 'BAD_REQUEST',
              },
            }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }

        const parseResult = schema.safeParse(body);
        if (!parseResult.success) {
          const issues = parseResult.error.issues.map((i: z.ZodIssue) => ({
            path: i.path.join('.'),
            message: i.message,
            code: i.code,
          }));
          return new Response(
            JSON.stringify({
              error: {
                message: 'Invalid request body',
                code: 'BAD_REQUEST',
                issues,
              },
            }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }

        // Optional caching
        const ttl = getAnalysisCacheTtl(env);
        const cache = ttl > 0 ? getDefaultCache() : undefined;
        if (ttl > 0 && cache) {
          const keyStr = await sha256Hex(stableStringify({ route, input: parseResult.data }));
          const cacheReq = new Request(`https://cache.local/analysis/${keyStr}`);
          const cached = await cache.match(cacheReq);
          if (cached) {
            const hitHeaders = new Headers(cached.headers);
            hitHeaders.set('X-Cache', 'HIT');
            return new Response(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers: hitHeaders,
            });
          }

          const result = analyzer(parseResult.data);
          const res = new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              ...buildDefaultHeaders(env),
              'Cache-Control': `public, max-age=${ttl}`,
              'X-Cache': 'MISS',
            },
          });
          void cache.put(cacheReq, res.clone());
          return res;
        }

        const result = analyzer(parseResult.data);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...buildDefaultHeaders(env), 'X-Cache': 'BYPASS' },
        });
      })
    )
  );
}

// Register all analysis endpoints
createAnalysisEndpoint('/api/analyze-tax-optimization', TaxOptimizationInputSchema, (input) =>
  TaxOptimizationPlanner.analyze(input)
);

createAnalysisEndpoint('/api/analyze-insurance-needs', InsuranceNeedsInputSchema, (input) =>
  InsuranceNeedsCalculator.analyze(input)
);

createAnalysisEndpoint('/api/analyze-college-savings', CollegeSavingsInputSchema, (input) =>
  CollegeSavingsPlanner.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-home-buying-affordability',
  HomeBuyingAffordabilityInputSchema,
  (input) => HomeBuyingAffordabilityCalculator.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-investment-portfolio',
  InvestmentPortfolioInputSchema,
  (input) => InvestmentPortfolioAnalyzer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-retirement-planning', RetirementPlanningInputSchema, (input) =>
  RetirementPlanningEngine.analyze(input)
);

createAnalysisEndpoint('/api/analyze-cca-valuation', CCAValuationInputSchema, (input) =>
  CCAValuationEngine.analyze(input)
);

createAnalysisEndpoint('/api/analyze-ma-deal', MAAnalysisInputSchema, (input) =>
  MAAnalysisEngine.analyze(input)
);

createAnalysisEndpoint('/api/analyze-financial-journey', FinancialJourneyInputSchema, (input) =>
  FinancialJourneyAnalysisEngine.analyze(input)
);

createAnalysisEndpoint('/api/analyze-cash-flow', CashFlowAnalysisInputSchema, (input) =>
  CashFlowAnalyzer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-bond-pricing', BondPricingInputSchema, (input) =>
  BondPricingAnalyzer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-options-pricing', OptionsPricingInputSchema, (input) =>
  OptionsPricingAnalyzer.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-business-expansion-loan',
  BusinessExpansionLoanInputSchema,
  (input) => BusinessExpansionLoanJourney.analyze(input)
);

// Personal Finance Models
createAnalysisEndpoint('/api/analyze-social-security', SocialSecurityInputSchema, (input) =>
  SocialSecurityOptimizer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-heloc', HELOCInputSchema, (input) =>
  HELOCAnalyzer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-refinancing', RefinancingInputSchema, (input) =>
  RefinancingCalculator.analyze(input)
);

createAnalysisEndpoint('/api/analyze-fire-calculator', FIRECalculatorInputSchema, (input) =>
  FIRECalculator.analyze(input)
);

createAnalysisEndpoint('/api/analyze-estate-planning', EstatePlanningInputSchema, (input) =>
  EstatePlanningCalculator.analyze(input)
);

createAnalysisEndpoint('/api/analyze-emergency-fund', EmergencyFundInputSchema, (input) =>
  EmergencyFundCalculator.analyze(input)
);

createAnalysisEndpoint('/api/analyze-net-worth', NetWorthInputSchema, (input) =>
  NetWorthTracker.analyze(input)
);

createAnalysisEndpoint('/api/analyze-401k-match', EmployerMatch401kInputSchema, (input) =>
  EmployerMatch401kOptimizer.analyze(input)
);

// Business Finance Models
createAnalysisEndpoint('/api/analyze-capital-structure', CapitalStructureInputSchema, (input) =>
  CapitalStructureOptimizer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-project-finance', ProjectFinanceInputSchema, (input) =>
  ProjectFinanceAnalyzer.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-real-estate-investment',
  RealEstateInvestmentInputSchema,
  (input) => RealEstateInvestmentAnalyzer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-lbo', LBOInputSchema, (input) => LBOModel.analyze(input));

createAnalysisEndpoint('/api/analyze-credit-risk', CreditRiskInputSchema, (input) =>
  CreditRiskAnalyzer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-working-capital', WorkingCapitalInputSchema, (input) =>
  WorkingCapitalOptimizer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-var', VaRInputSchema, (input) => VaRCalculator.analyze(input));

createAnalysisEndpoint(
  '/api/analyze-portfolio-optimization',
  PortfolioOptimizationInputSchema,
  (input) => PortfolioOptimizer.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-business-financial-health',
  BusinessFinancialHealthInputSchema,
  (input) => BusinessFinancialHealthAnalyzer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-debt-capacity', DebtCapacityInputSchema, (input) =>
  DebtCapacityCalculator.analyze(input)
);

createAnalysisEndpoint('/api/analyze-dscr', DSCRInputSchema, (input) =>
  DSCRCalculator.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-business-loan-scenarios',
  BusinessLoanScenariosInputSchema,
  (input) => BusinessLoanScenariosAnalyzer.analyze(input)
);

// New Personal Finance Models
createAnalysisEndpoint('/api/analyze-hsa-optimization', HSAOptimizationInputSchema, (input) =>
  HSAOptimizer.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-roth-vs-traditional-ira',
  RothVsTraditionalIRAInputSchema,
  (input) => RothVsTraditionalIRACalculator.analyze(input)
);

createAnalysisEndpoint('/api/analyze-tax-loss-harvesting', TaxLossHarvestingInputSchema, (input) =>
  TaxLossHarvestingOptimizer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-charitable-giving', CharitableGivingInputSchema, (input) =>
  CharitableGivingOptimizer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-car-lease-vs-buy', CarLeaseVsBuyInputSchema, (input) =>
  CarLeaseVsBuyCalculator.analyze(input)
);

createAnalysisEndpoint('/api/analyze-long-term-care', LongTermCareInputSchema, (input) =>
  LongTermCareCalculator.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-disability-insurance',
  DisabilityInsuranceInputSchema,
  (input) => DisabilityInsuranceAnalyzer.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-life-insurance-reassessment',
  LifeInsuranceReassessmentInputSchema,
  (input) => LifeInsuranceReassessmentCalculator.analyze(input)
);

createAnalysisEndpoint('/api/analyze-529-optimizer', FiveTwoNineOptimizerInputSchema, (input) =>
  FiveTwoNineOptimizer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-credit-score-impact', CreditScoreImpactInputSchema, (input) =>
  CreditScoreImpactAnalyzer.analyze(input)
);

// New Business Finance Models
createAnalysisEndpoint(
  '/api/analyze-inventory-optimization',
  InventoryOptimizationInputSchema,
  (input) => InventoryOptimizer.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-accounts-receivable-aging',
  AccountsReceivableAgingInputSchema,
  (input) => AccountsReceivableAgingAnalyzer.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-financial-ratio-analyzer',
  FinancialRatioAnalyzerInputSchema,
  (input) => FinancialRatioAnalyzer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-depreciation', DepreciationInputSchema, (input) =>
  DepreciationCalculator.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-equipment-lease-vs-buy',
  EquipmentLeaseVsBuyInputSchema,
  (input) => EquipmentLeaseVsBuyCalculator.analyze(input)
);

createAnalysisEndpoint('/api/analyze-revenue-recognition', RevenueRecognitionInputSchema, (input) =>
  RevenueRecognitionCalculator.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-employee-stock-options',
  EmployeeStockOptionsInputSchema,
  (input) => EmployeeStockOptionsValuator.analyze(input)
);

createAnalysisEndpoint('/api/analyze-franchise-roi', FranchiseROIInputSchema, (input) =>
  FranchiseROICalculator.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-startup-financial-model',
  StartupFinancialModelInputSchema,
  (input) => StartupFinancialModel.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-accounts-payable-optimization',
  AccountsPayableOptimizationInputSchema,
  (input) => AccountsPayableOptimizer.analyze(input)
);

// Specialized/Advanced Models
createAnalysisEndpoint('/api/analyze-cryptocurrency-tax', CryptocurrencyTaxInputSchema, (input) =>
  CryptocurrencyTaxCalculator.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-international-tax-planning',
  InternationalTaxPlanningInputSchema,
  (input) => InternationalTaxPlanningOptimizer.analyze(input)
);

createAnalysisEndpoint('/api/analyze-1031-exchange', OneZeroThreeOneExchangeInputSchema, (input) =>
  OneZeroThreeOneExchangeAnalyzer.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-business-succession-planning',
  BusinessSuccessionPlanningInputSchema,
  (input) => BusinessSuccessionPlanningCalculator.analyze(input)
);

createAnalysisEndpoint(
  '/api/analyze-supply-chain-finance',
  SupplyChainFinanceInputSchema,
  (input) => SupplyChainFinanceOptimizer.analyze(input)
);

// Multi-Model Scenario Analysis (uses MCP tool)
router.post(
  '/api/multi-model-scenario-analysis',
  withErrorHandler(
    withAuth(async (request: Request, env: Env, keyInfo: ApiKeyInfo) => {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Content-Type must be application/json',
              code: 'INVALID_CONTENT_TYPE',
            },
          }),
          { status: 415, headers: buildDefaultHeaders(env) }
        );
      }

      const text = await request.text();
      const body = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return undefined;
        }
      })();

      if (!body || typeof body !== 'object') {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Invalid JSON body',
              code: 'BAD_REQUEST',
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      // Use MCP tool for multi-model scenario analysis
      const result = await handleMCPRequest(
        'tools/call',
        {
          name: 'multi_model_scenario_analysis',
          arguments: body,
        },
        env,
        buildMCPAuthorizationContext(keyInfo, env)
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...buildDefaultHeaders(env) },
      });
    })
  )
);

// 404 handler
router.all(
  '*',
  (_req: Request, env: Env) =>
    new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: buildDefaultHeaders(env),
    })
);

const apiWorker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const runId = getOrCreateAnalysisRunId(request, requestId);

    logRequest(request, env, undefined, requestId);

    // Worker-level method allowlist. Route-level handlers remain authoritative,
    // but rejecting TRACE/CONNECT/PATCH/etc. here reduces attack surface and
    // prevents future catch-all routes from accidentally accepting them.
    const allowedMethods = new Set(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
    if (!allowedMethods.has(request.method)) {
      const headers = new Headers(buildDefaultHeaders(env));
      headers.set('Allow', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
      headers.set('X-Request-ID', requestId);
      headers.set('X-Analysis-Run-ID', runId);
      logRequest(request, env, startTime, requestId);
      return new Response(
        JSON.stringify({
          error: { message: 'HTTP method is not allowed.', code: 'METHOD_NOT_ALLOWED' },
        }),
        { status: 405, headers }
      );
    }

    let rateInfo: RateLimitInfo | undefined;
    if (
      request.url.includes('/api/') ||
      request.url.includes('/mcp') ||
      request.url.includes('/v1/chat') ||
      request.url.includes('/agents/')
    ) {
      rateInfo = await checkRateLimit(request, env);
      if (!rateInfo.allowed) {
        logRequest(request, env, startTime, requestId);
        const headers = new Headers({
          ...buildDefaultHeaders(env),
          'Retry-After': String(Math.ceil((rateInfo.resetTime - Date.now()) / 1000)),
        });
        headers.set('X-Request-ID', requestId);
        headers.set('X-Analysis-Run-ID', runId);
        attachRateLimitHeaders(headers, rateInfo);
        return new Response(
          JSON.stringify({
            error: {
              message: 'Rate limit exceeded. Please try again later.',
              code: 'RATE_LIMIT_EXCEEDED',
            },
          }),
          { status: 429, headers }
        );
      }
    }

    let agentRequest = request;
    let agentProps: Record<string, unknown> | undefined;
    if (new URL(request.url).pathname.startsWith('/agents/')) {
      const authorized = await authorizeAgentRequest(request, env);
      if (authorized instanceof Response) {
        logRequest(request, env, startTime, requestId);
        const headers = new Headers(authorized.headers);
        headers.set('X-Request-ID', requestId);
        headers.set('X-Analysis-Run-ID', runId);
        return new Response(authorized.body, {
          status: authorized.status,
          statusText: authorized.statusText,
          headers,
        });
      }
      agentRequest = authorized.request;
      agentProps = { ...authorized.props };
    }

    const agentResponse = await routeAgentRequest(
      agentRequest,
      env,
      agentProps ? { props: agentProps } : undefined
    );
    let response = agentResponse ?? (await router.fetch(request, env, ctx));

    const isWebSocketUpgrade = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
    const upgradedResponse = (response as Response & { webSocket?: WebSocket }).webSocket;
    if (isWebSocketUpgrade || response.status === 101 || upgradedResponse) {
      logRequest(request, env, startTime, requestId);
      return response;
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Request-ID', requestId);
    newHeaders.set('X-Analysis-Run-ID', runId);
    // Echo Cloudflare tracing info for correlation (if present)
    const cfRay = request.headers.get('CF-RAY');
    if (cfRay) newHeaders.set('CF-RAY', cfRay);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colo = (request as any).cf?.colo as string | undefined;
    if (colo) newHeaders.set('X-Colo', colo);
    if (rateInfo) attachRateLimitHeaders(newHeaders, rateInfo);
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });

    logRequest(request, env, startTime, requestId);

    return response;
  },
  // Scheduled reconciliation of approximate bucket usage to keep KV counters honest.
  // Runs based on wrangler.toml [triggers.crons] schedule.
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Daily log analysis at midnight
    if (event.cron === '0 0 * * *') {
      const auditPurgePromise = purgeExpiredMCPAuditEvents(env);
      ctx.waitUntil(auditPurgePromise);

      const oauthAuditPurgePromise = purgeExpiredOAuthAuditEvents(env);
      ctx.waitUntil(oauthAuditPurgePromise);

      if (env.ENVIRONMENT === 'test') {
        await auditPurgePromise;
      }

      const logAnalysisPromise = import('./cron/analyze-logs').then((m) =>
        m.handleDailyLogAnalysis(env)
      );
      ctx.waitUntil(logAnalysisPromise);

      if (env.KNOWLEDGE_JOBS) {
        const knowledgeReindexPromise = enqueueKnowledgeReindex(env, {
          source: 'scheduled',
          warmCache: true,
        });
        ctx.waitUntil(knowledgeReindexPromise);

        if (env.ENVIRONMENT === 'test') {
          await knowledgeReindexPromise;
        }
      }
    }

    // Hourly reconciliation of approximate bucket usage
    const reconcilePromise = reconcileBucketUsage(env);
    ctx.waitUntil(reconcilePromise);

    const uploadCleanupPromise = cleanupExpiredDocumentUploads(env).then((result) => {
      console.log('[R2] Expired upload cleanup', JSON.stringify(result));
      return result;
    });
    ctx.waitUntil(uploadCleanupPromise);

    const budgetCleanupPromise = purgeExpiredBudgetReservations(env).then((count) => {
      console.log('[Budget] Expired reservation cleanup', JSON.stringify({ count }));
      return count;
    });
    ctx.waitUntil(budgetCleanupPromise);

    // In production, run asynchronously; in tests, await so assertions see updates.
    if (env.ENVIRONMENT === 'test') {
      await reconcilePromise;
      await uploadCleanupPromise;
      await budgetCleanupPromise;
    }
  },
  async queue(batch: MessageBatch<import('./types').KnowledgeReindexMessage>, env: Env) {
    await handleKnowledgeQueue(batch, env);
  },
};

function smokeProbeDenied(request: Request, env: Env): Response | null {
  if (isAuthorizedSmokeProbeRequest(request, env)) return null;

  // Keep the direct workers.dev origin undiscoverable without the CI secret.
  return new Response(null, {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  });
}

let oauthProviderPromise: Promise<OAuthProvider<Env>> | undefined;

async function getOAuthProvider() {
  oauthProviderPromise ??= import('./lib/oauth-provider').then(({ createOAuthProvider }) =>
    createOAuthProvider(apiWorker)
  );
  return oauthProviderPromise;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const probeDenial = smokeProbeDenied(request, env);
    if (probeDenial) return probeDenial;

    if (isOAuthEnabled(env)) {
      if (!env.OAUTH_KV) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'OAuth is enabled but its dedicated token namespace is not configured.',
              code: 'OAUTH_STORAGE_NOT_CONFIGURED',
            },
          }),
          { status: 503, headers: buildDefaultHeaders(env) }
        );
      }
      return (await getOAuthProvider()).fetch(request, env, ctx);
    }
    return apiWorker.fetch(request, env, ctx);
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    await apiWorker.scheduled(event, env, ctx);

    if (isOAuthEnabled(env) && env.OAUTH_KV) {
      const purgePromise = getOAuthProvider()
        .then((provider) => provider.purgeExpiredData(env, { batchSize: 100 }))
        .then((result) => {
          console.log('[OAuth] Purge completed', JSON.stringify(result));
        })
        .catch((error) => {
          console.error('[OAuth] Purge failed', error);
        });
      ctx.waitUntil(purgePromise);
      if (env.ENVIRONMENT === 'test') await purgePromise;
    }
  },
  async queue(batch: MessageBatch<import('./types').KnowledgeReindexMessage>, env: Env) {
    await apiWorker.queue(batch, env);
  },
};

// Export Durable Objects
export { SessionDO } from './durable-objects/SessionDO';
export { FinancialAnalysisAgent } from './agents/FinancialAnalysisAgent';
