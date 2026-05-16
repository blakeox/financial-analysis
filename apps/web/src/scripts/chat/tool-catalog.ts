import {
  appEventBus,
  type ChatToolsUpdateEvent,
  type SerializedContext,
} from '@financial-analysis/tools';

type ToolSummary = { name: string; description: string };

export type ToolCatalogSnapshot = {
  tools: ToolSummary[];
  outputs: SerializedContext | null;
  fetchedAt: number;
};

type LoadOptions = {
  forceRefresh?: boolean;
  source?: ChatToolsUpdateEvent['source'];
  captureOutputs?: () => SerializedContext | null;
};

const MCP_TOOLS_ENDPOINT = '/api/v1/mcp/tools';

const normalizeTools = (tools: unknown): ToolSummary[] => {
  if (!Array.isArray(tools)) {
    return [];
  }
  return tools
    .filter((tool): tool is ToolSummary => {
      if (!tool || typeof tool !== 'object') {
        return false;
      }
      const candidate = tool as ToolSummary;
      return typeof candidate.name === 'string' && typeof candidate.description === 'string';
    })
    .map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));
};

const normalizeOutputs = (outputs: unknown): SerializedContext | null => {
  if (!outputs || typeof outputs !== 'object') {
    return null;
  }
  return outputs as SerializedContext;
};

class ToolCatalog {
  private snapshot: ToolCatalogSnapshot | null = null;
  private inflight: Promise<ToolCatalogSnapshot> | null = null;

  public getSnapshot(): ToolCatalogSnapshot | null {
    return this.snapshot;
  }

  public subscribe(listener: (event: ChatToolsUpdateEvent) => void): () => void {
    return appEventBus.on('chat:tools:update', listener);
  }

  public async load(options: LoadOptions = {}): Promise<ToolCatalogSnapshot> {
    const { forceRefresh = false, source, captureOutputs } = options;

    if (!forceRefresh && this.snapshot) {
      return this.snapshot;
    }

    if (this.inflight) {
      return this.inflight;
    }

    const request = this.fetchTools(
      source ?? (this.snapshot ? 'refresh' : 'initial'),
      captureOutputs
    );
    this.inflight = request;

    try {
      const snapshot = await request;
      this.snapshot = snapshot;
      return snapshot;
    } finally {
      this.inflight = null;
    }
  }

  private async fetchTools(
    source: ChatToolsUpdateEvent['source'],
    captureOutputs?: () => SerializedContext | null
  ): Promise<ToolCatalogSnapshot> {
    const response = await fetch(MCP_TOOLS_ENDPOINT, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch MCP tools: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const tools = normalizeTools(data?.tools);
    const outputsFromAPI = normalizeOutputs(data?.outputs);
    const outputsFromPage = captureOutputs ? captureOutputs() : null;

    const combinedOutputs =
      outputsFromPage && outputsFromAPI
        ? { ...outputsFromAPI, ...outputsFromPage }
        : (outputsFromPage ?? outputsFromAPI ?? null);

    const snapshot: ToolCatalogSnapshot = {
      tools,
      outputs: combinedOutputs,
      fetchedAt: Date.now(),
    };

    appEventBus.emit('chat:tools:update', {
      tools,
      outputs: combinedOutputs,
      source,
    });

    return snapshot;
  }
}

export const toolCatalog = new ToolCatalog();
