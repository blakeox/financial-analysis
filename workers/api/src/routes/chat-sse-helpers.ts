/**
 * Chat SSE (Server-Sent Events) Stream Helpers
 * Modular utilities for creating SSE streams for chat responses
 */

/**
 * Create SSE-formatted data message
 */
export function createSSEMessage(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * Create SSE stream completion marker
 */
export function createSSEDone(): string {
  return 'data: [DONE]\n\n';
}

/**
 * Build SSE stream from structured response with function calling results
 * Used when enableFunctionCalling=true and we have a complete response object
 */
export function createStructuredSSEStream(
  encoder: TextEncoder,
  response: string,
  functionCallingResults?: unknown
): ReadableStream {
  return new ReadableStream({
    start(controller) {
      try {
        // Stream response text as tokens for progressive rendering
        if (response) {
          const tokens = response.split(/(?<=\s)/);
          for (const token of tokens) {
            if (token) {
              controller.enqueue(encoder.encode(createSSEMessage({ token })));
            }
          }
        }

        // Include function calling results for structured updates (e.g., modelChanges)
        if (functionCallingResults) {
          controller.enqueue(encoder.encode(createSSEMessage({ functionCallingResults })));
        }

        controller.enqueue(encoder.encode(createSSEDone()));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/**
 * Build SSE stream from async generator (streaming mode)
 * Used when enableFunctionCalling=false for real-time token streaming
 */
export function createStreamingSSEStream(
  encoder: TextEncoder,
  stream: AsyncIterable<string>,
  fallbackConfig?: {
    availableTools: Array<{ name: string; description: string }>;
    message: string;
    formatToolList: (tools: Array<{ name: string; description: string }>) => string;
    onChunk?: (chunk: string) => void;
    onComplete?: () => Promise<void> | void;
    onError?: (error: unknown) => Promise<void> | void;
  }
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          fallbackConfig?.onChunk?.(chunk);
          controller.enqueue(encoder.encode(createSSEMessage({ token: chunk })));
        }
        await fallbackConfig?.onComplete?.();
        controller.enqueue(encoder.encode(createSSEDone()));
        controller.close();
      } catch (err) {
        await fallbackConfig?.onError?.(err);
        // Fallback: If AI fails (e.g. local dev) but user asks for tools
        if (
          fallbackConfig &&
          fallbackConfig.availableTools.length > 0 &&
          /tools|help|capabilities|what can you do/i.test(fallbackConfig.message)
        ) {
          const toolList = fallbackConfig.formatToolList(fallbackConfig.availableTools);
          const errorMessage = err instanceof Error ? err.message : String(err);
          const fallbackResponse = `I'm currently running in offline mode (Error: ${errorMessage}), but I can still help you with the following tools:\n\n${toolList}\n\nPlease try asking specifically about one of these topics.`;

          controller.enqueue(encoder.encode(createSSEMessage({ token: fallbackResponse })));
          controller.enqueue(encoder.encode(createSSEDone()));
          controller.close();
          return;
        }
        controller.error(err);
      }
    },
  });
}

/**
 * Build SSE response headers
 */
export function buildSSEHeaders(baseHeaders: Record<string, string>): Record<string, string> {
  return {
    ...baseHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };
}
