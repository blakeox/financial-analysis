import type { ChatRequestPayload, ChatResponsePayload } from './types';

type StreamChunk = string | Pick<ChatResponsePayload, 'functionCallingResults'>;

export type ChatTransportConfig = {
  endpoint: string;
  streamEndpoint?: string;
  timeoutMs: number;
  maxAttempts: number;
  backoffMs: number;
};

export type ChatTransport = {
  send(payload: ChatRequestPayload): Promise<ChatResponsePayload>;
  stream(payload: ChatRequestPayload, onChunk: (chunk: StreamChunk) => void): Promise<void>;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export function createChatTransport(config: ChatTransportConfig): ChatTransport {
  const { endpoint, streamEndpoint, timeoutMs, maxAttempts, backoffMs } = config;

  const fetchWithRetry = async (
    payload: ChatRequestPayload,
    attempt = 1
  ): Promise<ChatResponsePayload> => {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId =
        controller && timeoutMs > 0
          ? setTimeout(() => controller.abort(), timeoutMs)
          : undefined;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller?.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        if (response.status === 429 && attempt < maxAttempts) {
          const backoffTime = backoffMs * Math.pow(2, attempt - 1);
          await delay(backoffTime);
          return fetchWithRetry(payload, attempt + 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as ChatResponsePayload;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }

      if (attempt < maxAttempts && error instanceof TypeError) {
        const backoffTime = backoffMs * Math.pow(2, attempt - 1);
        await delay(backoffTime);
        return fetchWithRetry(payload, attempt + 1);
      }

      throw error;
    }
  };

  const streamWithRetry = async (
    payload: ChatRequestPayload,
    onChunk: (chunk: StreamChunk) => void,
    attempt = 1
  ): Promise<void> => {
    try {
      const targetEndpoint = streamEndpoint || endpoint;
      console.log('[ChatTransport] Starting stream request to:', targetEndpoint);
      
      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[ChatTransport] Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 429 && attempt < maxAttempts) {
          const backoffTime = backoffMs * Math.pow(2, attempt - 1);
          await delay(backoffTime);
          return streamWithRetry(payload, onChunk, attempt + 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.error('[ChatTransport] No response body reader available');
        throw new Error('No response body');
      }
      
      console.log('[ChatTransport] Got reader, starting to read chunks...');

      let buffer = '';
      let chunkCount = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[ChatTransport] Stream done, total chunks read:', chunkCount);
          break;
        }
        
        chunkCount++;
        const decoded = decoder.decode(value, { stream: true });
        console.log('[ChatTransport] Chunk', chunkCount, 'received, length:', decoded.length, 'preview:', decoded.substring(0, 100));

        buffer += decoded;
        const lines = buffer.split('\n');
        
        // Keep the last line in the buffer if it's incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                onChunk(parsed.token);
              } else if (parsed.functionCallingResults) {
                onChunk(parsed);
              }
            } catch (e) {
              console.warn('Failed to parse SSE message:', e);
            }
          }
        }
      }
      
      // Process any remaining buffer
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                onChunk(parsed.token);
              } else if (parsed.functionCallingResults) {
                onChunk(parsed);
              }
            } catch (e) {
              console.warn('Failed to parse SSE message:', e);
            }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }

      if (attempt < maxAttempts && error instanceof TypeError) {
        const backoffTime = backoffMs * Math.pow(2, attempt - 1);
        await delay(backoffTime);
        return streamWithRetry(payload, onChunk, attempt + 1);
      }

      throw error;
    }
  };

  return {
    send(payload) {
      return fetchWithRetry(payload);
    },
    stream(payload, onChunk) {
      return streamWithRetry(payload, onChunk);
    },
  };
}
