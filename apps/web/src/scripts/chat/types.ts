import type { SerializedContext } from '@financial-analysis/tools';

export type ContextKey = 'lease' | 'ebitda' | 'amortization' | 'general' | 'models' | 'startup-planning';

export type ToolSummary = { name: string; description: string };

export type ModelChanges = Record<string, string | number>;

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
};

export type ChatResponsePayload = {
  response: string;
  modelChanges?: ModelChanges;
  toolUsed?: string;
  context?: string;
};
