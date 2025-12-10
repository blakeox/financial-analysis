import type { SerializedContext } from '@financial-analysis/tools';
import type { CalculatorContextKey } from './calculator-contexts';

export type ContextKey = CalculatorContextKey;

export type ToolSummary = { name: string; description: string };

export type ModelChanges = Record<string, unknown>;

export type ChatMetadata = {
  intent?: string;
  latency?: number;
  attempt?: number;
};

export type ToolingMetadata = {
  availableTools: string[];
  toolOutputsIncluded: number;
  contextKey: ContextKey;
  hasWebsiteContent?: boolean;
  hasConversationHistory?: boolean;
  cacheKey?: string;
};

export type ChatRequestPayload = {
  message: string;
  context: ContextKey;
  currentModel: SerializedContext;
  availableTools: ToolSummary[];
  toolOutputs: SerializedContext | null;
  contextLabel?: string | null;
  contextData?: SerializedContext | null;
  memoryContext?: {
    conversationHistory?: string;
    modelStates?: string;
  };
  negative_constraints?: string[];
  /** Enable function calling for LLM tool execution */
  enableFunctionCalling?: boolean;
};

export type FunctionCallingResults = {
  toolsExecuted: Array<{
    toolName: string;
    arguments: Record<string, unknown>;
    result: unknown;
  }>;
  modelChanges?: ModelChanges;
};

export type ChatResponsePayload = {
  response: string;
  modelChanges?: ModelChanges;
  toolUsed?: string;
  context?: ContextKey;
  fromCache?: boolean;
  requestId?: string;
  thinking?: string[];
  metadata?: ChatMetadata;
  tooling?: ToolingMetadata;
  /** Results from LLM function calling tool executions */
  functionCallingResults?: FunctionCallingResults;
};
