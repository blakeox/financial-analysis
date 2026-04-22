import { Think, type Session } from '@cloudflare/think';
import {
  AmortizationAnalyzer,
  AmortizationInputSchema,
  type AmortizationAnalysisResult,
  type AmortizationResultItem,
  FinancialInputSchema,
  LeaseAnalyzer,
  type LeaseAnalysisResult,
} from '@financial-analysis/analysis';
import { tool } from 'ai';
import { createWorkersAI } from 'workers-ai-provider';
import { z } from 'zod';
import { DocumentCache } from '../services/document-cache';
import type { Env } from '../types';

type ScheduleEntry = AmortizationResultItem | LeaseAnalysisResult['schedule'][number];

const DEFAULT_AGENT_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

const FINANCIAL_CAPABILITIES = [
  {
    slug: 'amortization',
    label: 'Amortization analysis',
    route: '/calculator/amortization',
    api: '/v1/api/analysis/amortization',
    usesTool: 'analyzeAmortization',
  },
  {
    slug: 'lease-analysis',
    label: 'Lease analysis',
    route: '/lease-analysis',
    api: '/v1/api/analysis/lease',
    usesTool: 'analyzeLease',
  },
  {
    slug: 'developers',
    label: 'Developer API docs',
    route: '/developers',
    api: '/openapi.json',
    usesTool: 'searchFanalyxKnowledge',
  },
] as const;

const PRODUCT_CONTEXT = `
Fanalyx is a Cloudflare-based financial analysis app with deterministic engines for core calculations.

Current high-confidence workflows for this agent:
- Amortization analysis via deterministic math tools
- Lease analysis via deterministic math tools
- Guidance about app routes, API endpoints, and site knowledge via AI Search

When users ask for calculations, prefer the deterministic tools instead of mental math.
When users ask about docs, product capabilities, or site content, search the managed knowledge tool before guessing.
When users ask for other calculators, explain what is available today and point them to the relevant route or API surface.
`.trim();

const AGENT_SYSTEM_PROMPT = `
You are the Fanalyx agent built on Cloudflare Project Think.

Rules:
- Use the deterministic financial tools for calculations whenever they apply.
- Keep explanations concise and practical.
- Do not claim to provide legal, tax, or investment advice.
- If a request is outside the available tools, say that plainly and point the user to the closest supported workflow.
- When summarizing tool output, lead with the key financial takeaway and then mention the most important numbers.
`.trim();

interface SchedulePreview<TEntry> {
  periods: number;
  firstEntries: TEntry[];
  lastEntry: TEntry | null;
}

function summarizeSchedule<TEntry>(schedule: readonly TEntry[]): SchedulePreview<TEntry> {
  return {
    periods: schedule.length,
    firstEntries: schedule.slice(0, 3),
    lastEntry: schedule.length > 0 ? (schedule[schedule.length - 1] ?? null) : null,
  };
}

function compactAmortizationResult(result: AmortizationAnalysisResult) {
  const { schedule, ...summary } = result;
  return {
    ...summary,
    schedulePreview: summarizeSchedule(schedule),
  };
}

function compactLeaseResult(result: LeaseAnalysisResult) {
  const { schedule, ...summary } = result;
  return {
    ...summary,
    schedulePreview: summarizeSchedule<ScheduleEntry>(schedule),
  };
}

export class FinancialAnalysisAgent extends Think<Env> {
  override maxSteps = 5;

  override getModel() {
    if (!this.env.AI) {
      throw new Error('Workers AI binding is required for FinancialAnalysisAgent.');
    }

    const workersAI = createWorkersAI({ binding: this.env.AI });
    return workersAI(this.env.WORKERS_AI_MODEL || DEFAULT_AGENT_MODEL, {
      sessionAffinity: this.sessionAffinity,
    });
  }

  override getSystemPrompt() {
    return AGENT_SYSTEM_PROMPT;
  }

  override configureSession(session: Session) {
    return session
      .withContext('product', {
        provider: {
          get: async () => PRODUCT_CONTEXT,
        },
      })
      .withContext('memory', {
        description:
          'Remember stable user preferences like preferred answer style, recurring assumptions, or ongoing financial scenarios.',
        maxTokens: 1200,
      })
      .withCachedPrompt();
  }

  override getTools() {
    return {
      listFanalyxCapabilities: tool({
        description:
          'List the supported Fanalyx workflows, routes, and API endpoints available to this agent.',
        inputSchema: z.object({}),
        execute: async () => ({
          capabilities: FINANCIAL_CAPABILITIES,
          notes: [
            'Deterministic tools are currently wired for amortization and lease analysis.',
            'The legacy enhanced chat and MCP routes still exist alongside this new Project Think agent.',
          ],
        }),
      }),
      searchFanalyxKnowledge: tool({
        description:
          'Search Fanalyx docs and site content. Prefer this for developer docs, product capability questions, and route discovery.',
        inputSchema: z.object({
          query: z.string().min(2),
          limit: z.number().int().min(1).max(5).default(3),
        }),
        execute: async ({ query, limit }) => {
          const cache = new DocumentCache({
            ...(this.env.AI ? { ai: this.env.AI } : {}),
            ...(this.env.KV ? { kv: this.env.KV } : {}),
            ...(this.env.DOCUMENTS ? { r2Bucket: this.env.DOCUMENTS } : {}),
            ...(this.env.VECTORIZE ? { vectorize: this.env.VECTORIZE } : {}),
            ...(this.env.BROWSER ? { browser: this.env.BROWSER } : {}),
            ...(this.env.BROWSER_RENDERING_ENABLED === 'true'
              ? { browserRenderingEnabled: true }
              : {}),
            ...(this.env.BROWSER_RENDERING_PATH_PREFIXES
              ? {
                  browserRenderingPathPrefixes: this.env.BROWSER_RENDERING_PATH_PREFIXES
                    .split(',')
                    .map((prefix) => prefix.trim())
                    .filter(Boolean),
                }
              : {}),
            ...(this.env.AI_SEARCH ? { aiSearchNamespace: this.env.AI_SEARCH } : {}),
            ...(this.env.AI_SEARCH_INSTANCE_NAME
              ? { aiSearchInstanceName: this.env.AI_SEARCH_INSTANCE_NAME }
              : {}),
            ...(this.env.AI_SEARCH_SOURCE_DOMAIN
              ? { aiSearchSourceDomain: this.env.AI_SEARCH_SOURCE_DOMAIN }
              : {}),
          });
          const { documents, source } = await cache.searchWithSource(query, limit);
          return {
            source,
            results: documents.map((doc) => ({
              title: doc.metadata?.title || 'Fanalyx content',
              url: doc.url,
              preview: doc.content.slice(0, 400),
            })),
          };
        },
      }),
      analyzeAmortization: tool({
        description:
          'Run a deterministic amortization analysis. Use this for payment schedules, total interest, and payoff structure.',
        inputSchema: AmortizationInputSchema,
        execute: async (input) => compactAmortizationResult(AmortizationAnalyzer.analyze(input)),
      }),
      analyzeLease: tool({
        description:
          'Run a deterministic lease analysis. Use this for lease payment structure, total payments, and schedule summary.',
        inputSchema: FinancialInputSchema,
        execute: async (input) => compactLeaseResult(LeaseAnalyzer.analyze(input)),
      }),
    };
  }
}
