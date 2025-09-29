import {
  AmortizationAnalyzer,
  AmortizationInputSchema,
  EbitdaForecaster,
  FinancialInputSchema,
  LeaseAnalyzer,
  ScenarioInputSchema,
} from '@financial-analysis/analysis';
import { handleMCPRequest } from '@financial-analysis/tools';
import { Router } from 'itty-router';
import { z } from 'zod';
import { getOpenApiDocument } from './openapi';
import type { Env } from './types';
// Lib barrel export consolidates helpers in one place for tidy imports
import {
  adjustApproxBytes,
  attachRateLimitHeaders,
  buildDefaultHeaders,
  checkRateLimit,
  getAnalysisCacheTtl,
  getApproxBytes,
  getCorsHeaders,
  getDefaultCache,
  getMaxJsonBytes,
  getSecurityHeaders,
  getThresholds,
  isQuotaLocked,
  reconcileBucketUsage,
  setQuotaLocked,
  sha256Hex,
  stableStringify,
  type RateLimitInfo,
} from './lib';
import { registerHealthRoute } from './routes/health';

// Helper: get Cloudflare Workers default Cache if available
const router = Router();

// ---- Headers helpers ----

// ---- Chat types (minimal, OpenAI-compatible-ish) ----
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ChatRequest = {
  messages: ChatMessage[];
  model?: string;
  tools?: Array<{ name: string; description?: string; input_schema?: unknown }>;
  // Optional server-side MCP tool invocation (bypasses model)
  tool_call?: { name: string; arguments: unknown };
  stream?: boolean;
};

type ThinkingStep = {
  step: number;
  thought: string;
  action?: string;
  parameters?: Record<string, unknown>;
};

type ModelChange = {
  type: 'lease' | 'amortization' | 'ebitda';
  parameters: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: number;
};

type ChatResponse = {
  role: 'assistant';
  content: string;
  model?: string;
  thinking?: ThinkingStep[];
  model_changes?: ModelChange[];
};

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

// Quota helpers moved to ./lib/quota

// ---- Error handling wrapper ----
type RouteHandler = (request: Request, env: Env) => Response | Promise<Response>;

function withErrorHandler(handler: RouteHandler) {
  return async (request: Request, env: Env): Promise<Response> => {
    try {
      return await handler(request, env);
    } catch (error) {
      console.error('API Error:', error);

      const isDevelopment = env.ENVIRONMENT === 'development';

      // Handle Zod validation errors with 400 status
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Validation error',
              code: 'VALIDATION_ERROR',
              ...(isDevelopment && { details: error }),
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      // Handle generic errors and explicit Error instances
      if (error instanceof Error) {
        // Check for specific error messages that should return 400
        if (error.message.includes('Content-Type must be application/json')) {
          return new Response(
            JSON.stringify({
              error: {
                message: error.message,
                code: 'INVALID_CONTENT_TYPE',
              },
            }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }

        // Check for JSON parsing errors
        if (
          error.message.includes('Unexpected token') ||
          error.message.includes('is not valid JSON')
        ) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'Invalid JSON format',
                code: 'INVALID_JSON',
              },
            }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }
      }

      return new Response(
        JSON.stringify({
          error: {
            message:
              isDevelopment && error instanceof Error ? error.message : 'Internal server error',
            code: 'INTERNAL_ERROR',
            ...(isDevelopment && error instanceof Error && { stack: error.stack }),
          },
        }),
        { status: 500, headers: buildDefaultHeaders(env) }
      );
    }
  };
}

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
router.post(
  '/v1/chat/enhanced',
  withErrorHandler(async (request: Request, env: Env) => {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: { message: 'Content-Type must be application/json', code: 'INVALID_CONTENT_TYPE' },
        }),
        { status: 415, headers: buildDefaultHeaders(env) }
      );
    }

    const body = (await request.json().catch(() => null)) as ChatRequest | null;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({ error: { message: 'messages[] required', code: 'BAD_REQUEST' } }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }

    const userMessage = body.messages[body.messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      return new Response(
        JSON.stringify({ error: { message: 'Last message must be from user', code: 'BAD_REQUEST' } }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }

    const thinking: ThinkingStep[] = [];
    const modelChanges: ModelChange[] = [];
    let responseContent = '';

    // Step 1: Analyze the user request
    thinking.push({
      step: 1,
      thought: `Analyzing user request: "${userMessage.content}"`,
      action: 'Parsing financial modeling request'
    });

    const content = userMessage.content.toLowerCase();
    let detectedAnalysis: 'lease' | 'amortization' | 'ebitda' | null = null;

    // Step 2: Detect analysis type
    if (content.includes('lease')) {
      detectedAnalysis = 'lease';
      thinking.push({
        step: 2,
        thought: 'Detected lease analysis request - user wants equipment/asset lease calculations',
        action: 'Preparing lease analysis parameters'
      });
    } else if (content.includes('mortgage') || content.includes('loan') || content.includes('amortization')) {
      detectedAnalysis = 'amortization';
      thinking.push({
        step: 2,
        thought: 'Detected loan/mortgage request - user wants amortization schedule',
        action: 'Preparing amortization parameters'
      });
    } else if (content.includes('ebitda') || content.includes('forecast') || content.includes('business')) {
      detectedAnalysis = 'ebitda';
      thinking.push({
        step: 2,
        thought: 'Detected business forecasting request - user wants EBITDA analysis',
        action: 'Preparing EBITDA forecast parameters'
      });
    } else {
      thinking.push({
        step: 2,
        thought: 'Could not detect specific financial analysis type',
        action: 'Providing general guidance'
      });
      responseContent = `🤖 I can help you with financial modeling! I specialize in:

🏗️ **Lease Analysis** - Equipment and asset lease calculations
🏦 **Loan/Mortgage Analysis** - Amortization schedules and payment calculations  
📈 **EBITDA Forecasting** - Business performance and cash flow modeling

Try asking something like:
• "Analyze a $100,000 equipment lease"
• "Calculate mortgage payments for $300,000"
• "Forecast EBITDA with 10% growth"

What would you like to analyze?`;
    }

    if (detectedAnalysis) {
      // Step 3: Extract parameters and perform analysis
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parameters: any;
      
      if (detectedAnalysis === 'lease') {
        // Extract amount from message
        const amountMatch = userMessage.content.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)[k]?/i);
        const principal = amountMatch ? 
          parseInt(amountMatch[1].replace(/,/g, '')) * (amountMatch[0].toLowerCase().includes('k') ? 1000 : 1) : 
          100000;
        
        parameters = {
          principal,
          annualRate: 0.05, // 5% default
          termMonths: 36 // 3 years default
        };

        thinking.push({
          step: 3,
          thought: `Extracted lease parameters - Principal: $${principal.toLocaleString()}, Rate: 5%, Term: 36 months`,
          action: 'Executing lease analysis calculation',
          parameters
        });

        try {
          const parseResult = FinancialInputSchema.safeParse(parameters);
          if (parseResult.success) {
            const result = LeaseAnalyzer.analyze(parseResult.data);
            
            modelChanges.push({
              type: 'lease',
              parameters,
              result,
              timestamp: Date.now()
            });

            thinking.push({
              step: 4,
              thought: 'Successfully calculated lease analysis with monthly payments and total costs',
              action: 'Formatting results for user'
            });

            responseContent = `✅ **Lease Analysis Complete!**

🏗️ **Equipment Lease Results:**
💰 **Monthly Payment:** $${result.monthlyPayment.toLocaleString()}
📊 **Total Cost:** $${result.totalCost.toLocaleString()}
💸 **Total Interest:** $${result.totalInterest.toLocaleString()}

📋 **Analysis Summary:**
• Principal Amount: $${parameters.principal.toLocaleString()}
• Annual Interest Rate: ${(parameters.annualRate * 100).toFixed(1)}%
• Lease Term: ${parameters.termMonths} months (${Math.round(parameters.termMonths / 12)} years)

The model has been updated in the live dashboard! 🚀`;
          } else {
            throw new Error('Invalid lease parameters');
          }
        } catch (error) {
          thinking.push({
            step: 4,
            thought: `Error in lease calculation: ${error}`,
            action: 'Handling error gracefully'
          });
          responseContent = `❌ Error calculating lease analysis: ${error}`;
        }

      } else if (detectedAnalysis === 'amortization') {
        // Extract amount from message
        const amountMatch = userMessage.content.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)[k]?/i);
        const principal = amountMatch ? 
          parseInt(amountMatch[1].replace(/,/g, '')) * (amountMatch[0].toLowerCase().includes('k') ? 1000 : 1) : 
          300000;
        
        // Detect if it's a mortgage (longer term) or regular loan
        const isMortgage = content.includes('mortgage') || content.includes('home') || content.includes('house');
        
        parameters = {
          principal,
          annualRate: isMortgage ? 0.065 : 0.08, // 6.5% for mortgage, 8% for loan
          termMonths: isMortgage ? 360 : 60 // 30 years vs 5 years
        };

        thinking.push({
          step: 3,
          thought: `Extracted ${isMortgage ? 'mortgage' : 'loan'} parameters - Principal: $${principal.toLocaleString()}, Rate: ${(parameters.annualRate * 100).toFixed(1)}%, Term: ${parameters.termMonths} months`,
          action: 'Executing amortization calculation',
          parameters
        });

        try {
          const parseResult = AmortizationInputSchema.safeParse(parameters);
          if (parseResult.success) {
            const result = AmortizationAnalyzer.analyze(parseResult.data);
            
            modelChanges.push({
              type: 'amortization',
              parameters,
              result,
              timestamp: Date.now()
            });

            thinking.push({
              step: 4,
              thought: 'Successfully calculated amortization schedule with payment breakdown',
              action: 'Formatting results for user'
            });

            responseContent = `✅ **${isMortgage ? 'Mortgage' : 'Loan'} Analysis Complete!**

🏦 **Amortization Results:**
💰 **Monthly Payment:** $${result.monthlyPayment.toLocaleString()}
💸 **Total Interest:** $${result.totalInterest.toLocaleString()}
📊 **Total Amount Paid:** $${(result.monthlyPayment * parameters.termMonths).toLocaleString()}

📋 **Analysis Summary:**
• Principal Amount: $${parameters.principal.toLocaleString()}
• Annual Interest Rate: ${(parameters.annualRate * 100).toFixed(1)}%
• Loan Term: ${parameters.termMonths} months (${Math.round(parameters.termMonths / 12)} years)
• Interest-to-Principal Ratio: ${((result.totalInterest / parameters.principal) * 100).toFixed(1)}%

The amortization schedule has been loaded in the dashboard! 📈`;
          } else {
            throw new Error('Invalid amortization parameters');
          }
        } catch (error) {
          thinking.push({
            step: 4,
            thought: `Error in amortization calculation: ${error}`,
            action: 'Handling error gracefully'
          });
          responseContent = `❌ Error calculating amortization: ${error}`;
        }

      } else if (detectedAnalysis === 'ebitda') {
        // Extract growth rate if mentioned
        const growthMatch = userMessage.content.match(/(\d+(?:\.\d+)?)%?\s*growth/i);
        const revenueGrowthRate = growthMatch && growthMatch[1] ? parseFloat(growthMatch[1]) / 100 : 0.02; // Default 2%

        parameters = {
          name: 'AI Generated Business Forecast',
          description: `Generated from user request: "${userMessage.content}"`,
          forecastPeriodMonths: 12,
          currentMonthlyFinancials: [{
            month: 12,
            year: 2024,
            revenue: 100000,
            costOfGoodsSold: 30000,
            operatingExpenses: 40000,
            depreciation: 2000,
            amortization: 500,
            interestExpense: 1000,
            taxes: 5000
          }],
          currentEmployees: [{
            id: 'manager',
            name: 'Business Manager',
            role: 'Manager',
            department: 'Operations',
            billableHoursPerMonth: 160,
            hourlyRate: 50,
            salary: 80000,
            benefits: 16000,
            startDate: '2024-01-01T00:00:00.000Z',
            isActive: true
          }],
          newEmployees: [],
          revenueGrowthRate,
          billableHoursGrowthRate: 0.01,
          additionalExpenses: [],
          operatingExpenseGrowthRate: 0.01,
          inflationRate: 0.003,
          economicFactors: {
            marketGrowth: 0.02,
            competitionFactor: 0.95,
            seasonalityFactors: [1.0, 1.05, 1.1, 1.15, 1.2, 1.1, 1.0, 0.95, 1.0, 1.05, 1.1, 1.0]
          }
        };

        thinking.push({
          step: 3,
          thought: `Setting up EBITDA forecast with ${(revenueGrowthRate * 100).toFixed(1)}% monthly revenue growth`,
          action: 'Executing business performance forecast',
          parameters: { revenueGrowthRate, forecastMonths: 12, startingRevenue: 100000 }
        });

        try {
          const parseResult = ScenarioInputSchema.safeParse(parameters);
          if (parseResult.success) {
            const result = EbitdaForecaster.forecast(parseResult.data);
            
            modelChanges.push({
              type: 'ebitda',
              parameters: { revenueGrowthRate, forecastMonths: 12 },
              result,
              timestamp: Date.now()
            });

            thinking.push({
              step: 4,
              thought: 'Successfully generated 12-month EBITDA forecast with growth projections',
              action: 'Formatting business insights for user'
            });

            const avgMonthlyEbitda = result.summary.totalEbitda / result.forecast.length;
            const revenueGrowth = ((result.summary.revenueGrowth || 0) * 100).toFixed(1);

            responseContent = `✅ **EBITDA Forecast Complete!**

📈 **Business Performance Results:**
💰 **Total EBITDA (12 months):** $${result.summary.totalEbitda.toLocaleString()}
📊 **Average Monthly EBITDA:** $${avgMonthlyEbitda.toLocaleString()}
🚀 **Revenue Growth:** ${revenueGrowth}%

📋 **Forecast Summary:**
• Starting Monthly Revenue: $100,000
• Monthly Growth Rate: ${(revenueGrowthRate * 100).toFixed(1)}%
• Forecast Period: 12 months
• Employee Count: 1 manager
• Market Competition Factor: 95% (competitive market)

💡 **Business Insights:**
${avgMonthlyEbitda > 0 ? '✅ Positive cash flow projected' : '⚠️ Negative cash flow - consider cost optimization'}
${parseFloat(revenueGrowth) > 10 ? '🚀 Strong growth trajectory' : '📈 Steady growth expected'}

The forecast model is now live in your dashboard! 📊`;
          } else {
            throw new Error('Invalid EBITDA parameters');
          }
        } catch (error) {
          thinking.push({
            step: 4,
            thought: `Error in EBITDA calculation: ${error}`,
            action: 'Handling error gracefully'
          });
          responseContent = `❌ Error calculating EBITDA forecast: ${error}`;
        }
      }
    }

    const reply: ChatResponse = {
      role: 'assistant',
      content: responseContent,
      thinking,
      model_changes: modelChanges
    };

    return new Response(JSON.stringify(reply), {
      status: 200,
      headers: buildDefaultHeaders(env),
    });
  })
);

// ---- Workers AI Chat endpoint ----
router.post(
  '/v1/chat',
  withErrorHandler(async (request: Request, env: Env) => {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: { message: 'Content-Type must be application/json', code: 'INVALID_CONTENT_TYPE' },
        }),
        { status: 415, headers: buildDefaultHeaders(env) }
      );
    }

    const body = (await request.json().catch(() => null)) as ChatRequest | null;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({ error: { message: 'messages[] required', code: 'BAD_REQUEST' } }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }

    // Optional: server-side tool call through MCP, no AI required.
    if (body.tool_call && typeof body.tool_call.name === 'string') {
      try {
        const result = await handleMCPRequest('tools/call', {
          name: body.tool_call.name,
          arguments: body.tool_call.arguments,
        });
        const reply: ChatResponse = {
          role: 'assistant',
          content: typeof result === 'string' ? result : JSON.stringify(result),
        };
        return new Response(JSON.stringify(reply), {
          status: 200,
          headers: buildDefaultHeaders(env),
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: {
              message: err instanceof Error ? err.message : 'Tool call failed',
              code: 'TOOL_CALL_FAILED',
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }
    }

    // Optional tool: basic deterministic analysis call (amortization) when user asks for amortization and provides JSON payload.
    // This keeps costs at zero and demonstrates tool-use without requiring AI.
    const last = body.messages[body.messages.length - 1];
    if (last && last.role === 'user' && /amortization/i.test(last.content)) {
      try {
        // Look for any JSON object in the content, supporting nested structures
        const jsonMatch = last.content.match(/\{.*\}/);
        if (jsonMatch) {
          const apiInput = JSON.parse(jsonMatch[0]);

          // Support both old format (interestRate, termInYears) and new format (annualRate, termMonths)
          let analysisInput: { principal: number; annualRate: number; termMonths: number } | null =
            null;

          // New format: annualRate (decimal), termMonths (number)
          if (
            typeof apiInput.principal === 'number' &&
            typeof apiInput.annualRate === 'number' &&
            typeof apiInput.termMonths === 'number' &&
            apiInput.principal > 0 &&
            apiInput.annualRate >= 0 &&
            apiInput.termMonths > 0
          ) {
            analysisInput = {
              principal: apiInput.principal,
              annualRate: apiInput.annualRate,
              termMonths: apiInput.termMonths,
            };
          }
          // Old format: interestRate (percentage), termInYears (number)
          else if (
            typeof apiInput.principal === 'number' &&
            typeof apiInput.interestRate === 'number' &&
            typeof apiInput.termInYears === 'number' &&
            apiInput.principal > 0 &&
            apiInput.interestRate >= 0 &&
            apiInput.termInYears > 0
          ) {
            analysisInput = {
              principal: apiInput.principal,
              annualRate: apiInput.interestRate / 100, // Convert percentage to decimal
              termMonths: Math.round(apiInput.termInYears * 12), // Convert years to months
            };
          }

          if (analysisInput) {
            const parseResult = AmortizationInputSchema.safeParse(analysisInput);
            if (parseResult.success) {
              const result = AmortizationAnalyzer.analyze(parseResult.data);
              const reply: ChatResponse = {
                role: 'assistant',
                content: `Computed amortization. Monthly payment: ${result.monthlyPayment.toFixed(2)}; total interest: ${result.totalInterest.toFixed(2)}.`,
              };
              return new Response(JSON.stringify(reply), {
                status: 200,
                headers: buildDefaultHeaders(env),
              });
            }
          }
        }
      } catch {
        // fall through to model reply or canned response
      }
    }

    // If AI binding is absent, provide a lightweight deterministic response.
    if (!env.AI) {
      const reply: ChatResponse = {
        role: 'assistant',
        content:
          'AI model is not configured in this environment. You can still call analysis endpoints directly (e.g., POST /v1/api/analysis/amortization).',
      };
      return new Response(JSON.stringify(reply), {
        status: 200,
        headers: buildDefaultHeaders(env),
      });
    }

    const model = body.model || env.WORKERS_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';

    // Compose a prompt from messages
    const system = body.messages.find((m) => m.role === 'system');
    const userParts = body.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');
    const prompt = `${system ? system.content + '\n\n' : ''}${userParts}`.slice(0, 10000);

    // Call Workers AI text generation endpoint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = env.AI as any;
    const aiRes = await ai.run(model, { prompt });
    const text: string = aiRes?.response || aiRes?.text || JSON.stringify(aiRes);
    const reply: ChatResponse = {
      role: 'assistant',
      content: String(text || '').slice(0, 12000),
      model,
    };
    return new Response(JSON.stringify(reply), { status: 200, headers: buildDefaultHeaders(env) });
  })
);

// ---- Storage endpoints (R2) ----
// Note: This implementation is conservative and designed for free-tier safety.
// It requires a Content-Length header for uploads and enforces soft/hard quotas.

router.get(
  '/v1/storage/status',
  withErrorHandler(async (_request: Request, env: Env) => {
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
  })
);

router.get(
  '/v1/storage/usage',
  withErrorHandler(async (_request: Request, env: Env) => {
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
);

// Admin-only reconcile endpoint (requires Authorization: Bearer <ADMIN_API_TOKEN>)
router.post(
  '/v1/storage/reconcile',
  withErrorHandler(async (request: Request, env: Env) => {
    const auth = request.headers.get('authorization') || '';
    const token = (auth.startsWith('Bearer ') && auth.slice(7)) || '';
    if (!env.ADMIN_API_TOKEN || token !== env.ADMIN_API_TOKEN) {
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
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: buildDefaultHeaders(env) }
    );
  })
);

router.put(
  '/v1/storage/object/:key',
  withErrorHandler(async (request: Request, env: Env) => {
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
        JSON.stringify({ error: { message: 'Content-Length required', code: 'LENGTH_REQUIRED' } }),
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
        JSON.stringify({ error: { message: 'Storage locked due to quota', code: 'QUOTA_LOCKED' } }),
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
    const prevSize = existingHead && typeof existingHead.size === 'number' ? existingHead.size : 0;
    await adjustApproxBytes(env, contentLength - prevSize);
    return new Response(JSON.stringify({ key, etag: putRes?.etag ?? null, size: contentLength }), {
      status: 201,
      headers: buildDefaultHeaders(env),
    });
  })
);

router.delete(
  '/v1/storage/object/:key',
  withErrorHandler(async (request: Request, env: Env) => {
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
    if (head && typeof head.size === 'number') {
      await adjustApproxBytes(env, -head.size);
    }
    return new Response(JSON.stringify({ key, deleted: true }), {
      status: 200,
      headers: buildDefaultHeaders(env),
    });
  })
);

// MCP server endpoint for LLM integration
router.post(
  '/mcp',
  withErrorHandler(async (request: Request, env: Env) => {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    const body = await request.json();

    // Enhanced MCP protocol validation
    const mcpRequestSchema = z.object({
      jsonrpc: z.literal('2.0'),
      id: z.union([z.string(), z.number()]),
      method: z.enum(['initialize', 'tools/list', 'tools/call']),
      params: z.any().optional(),
    });

    const mcpRequest = mcpRequestSchema.parse(body);

    // Use the MCP tools handler
    const result = await handleMCPRequest(mcpRequest.method, mcpRequest.params, env);

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: mcpRequest.id,
        result,
      }),
      {
        headers: buildDefaultHeaders(env),
      }
    );
  })
);

// API routes for financial analysis (v1)
router.get(
  '/v1/api/analysis',
  withErrorHandler(async (request: Request, env: Env) => {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    // Basic validation for analysis type
    const validTypes = ['lease', 'amortization', 'cashflow', 'ebitda-forecast'];
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

// Lease analysis endpoint
router.post(
  '/v1/api/analysis/lease',
  withErrorHandler(async (request: Request, env: Env) => {
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
      const keyStr = await sha256Hex(stableStringify({ route: 'lease', input: parseResult.data }));
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
);

// EBITDA forecast analysis endpoint
router.post(
  '/v1/api/analysis/ebitda-forecast',
  withErrorHandler(async (request: Request, env: Env) => {
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
      const result = EbitdaForecaster.forecast(parseResult.data);
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

    const result = EbitdaForecaster.forecast(parseResult.data);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...buildDefaultHeaders(env), 'X-Cache': 'BYPASS' },
    });
  })
);

// Amortization analysis endpoint
router.post(
  '/v1/api/analysis/amortization',
  withErrorHandler(async (request: Request, env: Env) => {
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

    // Debug: Log raw input
    console.log('Raw API input:', {
      body: body,
      apiInput: apiInput,
      interestRate: apiInput.interestRate,
      termInYears: apiInput.termInYears,
      principal: apiInput.principal,
    });

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

    // Debug: Log the conversion
    console.log('Amortization input conversion:', {
      original: apiInput,
      converted: analysisInput,
    });

    const parseResult = AmortizationInputSchema.safeParse(analysisInput);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i: z.ZodIssue) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      }));
      // Debug: Log validation failure details
      console.error('Amortization validation failed:', {
        input: analysisInput,
        issues: issues,
      });
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
        totalAmount: analysisResult.totalPayments,
        schedule: analysisResult.schedule.map((payment) => ({
          month: payment.month,
          payment: payment.payment,
          principal: payment.principal,
          interest: payment.interest,
          balance: payment.balance,
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
      totalAmount: analysisResult.totalPayments,
      schedule: analysisResult.schedule.map((payment) => ({
        month: payment.month,
        payment: payment.payment,
        principal: payment.principal,
        interest: payment.interest,
        balance: payment.balance,
      })),
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...buildDefaultHeaders(env), 'X-Cache': 'BYPASS' },
    });
  })
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
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const doc = getOpenApiDocument(baseUrl);
    const json = JSON.stringify(doc, null, 2);
    const etagHex = await sha256Hex(json);
    const etag = `"${etagHex}"`;
    const inm = request.headers.get('if-none-match');
    if (inm && inm.replace(/^W\//, '') === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...getCorsHeaders(env),
          ...getSecurityHeaders(env),
          ETag: etag,
          'Cache-Control': 'public, max-age=300',
          'Content-Type': 'application/json',
        },
      });
    }
    return new Response(json, {
      headers: {
        ...buildDefaultHeaders(env),
        'Content-Type': 'application/json',
        ETag: etag,
        'Cache-Control': 'public, max-age=300',
      },
    });
  })
);

// API docs viewer (RapiDoc)
router.get(
  '/docs',
  withErrorHandler(async (request: Request, env: Env) => {
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
    const inm = request.headers.get('if-none-match');
    if (inm && inm.replace(/^W\//, '') === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...getCorsHeaders(env),
          ...getSecurityHeaders(env),
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': docsCsp,
          ETag: etag,
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    return new Response(html, {
      headers: {
        ...getCorsHeaders(env),
        ...getSecurityHeaders(env),
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': docsCsp,
        ETag: etag,
        'Cache-Control': 'public, max-age=300',
      },
    });
  })
);

// Simple contextual chat endpoint for VS Code-style chat panel
router.post('/api/v1/chat/enhanced', withErrorHandler(async (request: Request, env: Env) => {
  const requestId = crypto.randomUUID();
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message: 'Contextual chat request received', requestId }));
  
  try {
    const body = await request.json() as { message: string; context?: string; currentModel?: any };
    const { message, context = 'general', currentModel = {} } = body;
    
    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: buildDefaultHeaders(env)
      });
    }

    // Context-aware response based on current model page
    let contextualResponse = '';
    let modelChanges = {};
    let explanation = '';
    
    // Detect intent and extract parameters from user message
    const lowerMessage = message.toLowerCase();
    
    if (context === 'lease') {
      // Handle lease analysis modifications
      if (lowerMessage.includes('interest') || lowerMessage.includes('rate')) {
        const rateMatch = message.match(/(\d+(?:\.\d+)?)%?/);
        if (rateMatch) {
          const newRate = parseFloat(rateMatch[1]);
          modelChanges = { ...currentModel, interestRate: newRate };
          contextualResponse = `I've updated the interest rate to ${newRate}%. This will affect your monthly payments and total interest paid over the lease term.`;
          explanation = `**Analysis**: Changing the interest rate from ${currentModel.interestRate || 'current'}% to ${newRate}% will:\n• ${newRate > (currentModel.interestRate || 0) ? 'Increase' : 'Decrease'} monthly payments\n• ${newRate > (currentModel.interestRate || 0) ? 'Increase' : 'Decrease'} total cost of the lease\n• Impact your cash flow projections`;
        }
      } else if (lowerMessage.includes('amount') || lowerMessage.includes('principal')) {
        const amountMatch = message.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)/);
        if (amountMatch) {
          const newAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
          modelChanges = { ...currentModel, leasePrincipal: newAmount };
          contextualResponse = `I've updated the lease amount to $${newAmount.toLocaleString()}. Let me recalculate the payment schedule for you.`;
          explanation = `**Analysis**: Increasing the lease principal will proportionally increase your monthly payments while keeping the same interest rate and term length.`;
        }
      } else if (lowerMessage.includes('term') || lowerMessage.includes('month') || lowerMessage.includes('year')) {
        const termMatch = message.match(/(\d+)\s*(month|year)/);
        if (termMatch) {
          const termValue = parseInt(termMatch[1]);
          const termUnit = termMatch[2];
          const termInMonths = termUnit === 'year' ? termValue * 12 : termValue;
          modelChanges = { ...currentModel, leaseTerm: termInMonths };
          contextualResponse = `I've updated the lease term to ${termValue} ${termUnit}${termValue > 1 ? 's' : ''}. This changes your payment structure significantly.`;
          explanation = `**Analysis**: ${termInMonths > (currentModel.leaseTerm || 0) ? 'Extending' : 'Shortening'} the lease term will ${termInMonths > (currentModel.leaseTerm || 0) ? 'reduce monthly payments but increase total interest' : 'increase monthly payments but reduce total interest'}.`;
        }
      }
    } else if (context === 'ebitda') {
      // Handle EBITDA forecasting modifications
      if (lowerMessage.includes('revenue') || lowerMessage.includes('sales')) {
        const revenueMatch = message.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)/);
        if (revenueMatch) {
          const newRevenue = parseFloat(revenueMatch[1].replace(/,/g, ''));
          modelChanges = { ...currentModel, initialRevenue: newRevenue };
          contextualResponse = `I've updated the initial revenue to $${newRevenue.toLocaleString()}. This will impact your EBITDA projections across all forecast periods.`;
          explanation = `**Analysis**: Revenue changes directly impact EBITDA calculations. Higher revenue typically leads to better margins if costs scale appropriately.`;
        }
      } else if (lowerMessage.includes('growth') || lowerMessage.includes('rate')) {
        const growthMatch = message.match(/(\d+(?:\.\d+)?)%?/);
        if (growthMatch) {
          const newGrowth = parseFloat(growthMatch[1]);
          modelChanges = { ...currentModel, revenueGrowthRate: newGrowth };
          contextualResponse = `I've updated the revenue growth rate to ${newGrowth}% annually. This will compound over your forecast period.`;
          explanation = `**Analysis**: A ${newGrowth}% growth rate will ${newGrowth > (currentModel.revenueGrowthRate || 0) ? 'accelerate' : 'decelerate'} your revenue trajectory and impact long-term EBITDA.`;
        }
      }
    } else if (context === 'amortization') {
      // Handle amortization modifications
      if (lowerMessage.includes('interest') || lowerMessage.includes('rate')) {
        const rateMatch = message.match(/(\d+(?:\.\d+)?)%?/);
        if (rateMatch) {
          const newRate = parseFloat(rateMatch[1]);
          modelChanges = { ...currentModel, interestRate: newRate };
          contextualResponse = `I've updated the interest rate to ${newRate}%. This affects the interest portion of each payment in your amortization schedule.`;
          explanation = `**Analysis**: Rate changes impact the interest/principal split in each payment. ${newRate > (currentModel.interestRate || 0) ? 'Higher rates mean more interest, less principal early on' : 'Lower rates mean less interest, more principal goes toward the balance'}.`;
        }
      } else if (lowerMessage.includes('amount') || lowerMessage.includes('principal') || lowerMessage.includes('loan')) {
        const amountMatch = message.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)/);
        if (amountMatch) {
          const newAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
          modelChanges = { ...currentModel, loanAmount: newAmount };
          contextualResponse = `I've updated the loan amount to $${newAmount.toLocaleString()}. This will recalculate your entire amortization schedule.`;
          explanation = `**Analysis**: Loan amount changes proportionally affect monthly payments while maintaining the same interest rate and term structure.`;
        }
      }
    }
    
    // If no specific changes detected, provide general assistance
    if (Object.keys(modelChanges).length === 0) {
      contextualResponse = `I understand you want to modify the ${context} model. Could you be more specific about what parameter you'd like to change? For example:\n\n• "Change interest rate to 5.5%"\n• "Increase loan amount to $250,000"\n• "Set term to 15 years"`;
      explanation = `**Available Parameters**: I can help you modify interest rates, loan amounts, terms, growth rates, and other key financial variables. Just specify the value you'd like to use.`;
    }
    
    const response = {
      response: `${contextualResponse}\n\n${explanation}`,
      modelChanges,
      context,
      thinking: [
        `Analyzing ${context} model context...`,
        `Extracting parameters from: "${message}"`,
        `Identified changes: ${Object.keys(modelChanges).join(', ') || 'none detected'}`,
        `Preparing response with actionable modifications...`
      ]
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...buildDefaultHeaders(env),
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Contextual chat error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      response: 'I apologize, but I encountered an error processing your request. Please try again.'
    }), {
      status: 500,
      headers: buildDefaultHeaders(env)
    });
  }
}));

// 404 handler
router.all(
  '*',
  (_req: Request, env: Env) =>
    new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: buildDefaultHeaders(env),
    })
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    logRequest(request, env, undefined, requestId);

    let rateInfo: RateLimitInfo | undefined;
    if (
      request.url.includes('/api/') ||
      request.url.includes('/mcp') ||
      request.url.includes('/v1/chat')
    ) {
      rateInfo = await checkRateLimit(request, env);
      if (!rateInfo.allowed) {
        logRequest(request, env, startTime, requestId);
        const headers = new Headers({
          ...buildDefaultHeaders(env),
          'Retry-After': String(Math.ceil((rateInfo.resetTime - Date.now()) / 1000)),
        });
        headers.set('X-Request-ID', requestId);
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

    let response = await router.handle(request, env, ctx);

    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Request-ID', requestId);
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
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // In production, run reconciliation asynchronously; in tests, await so assertions see updates.
    const promise = reconcileBucketUsage(env);
    ctx.waitUntil(promise);
    if (env.ENVIRONMENT === 'test') {
      await promise;
    }
  },
};
