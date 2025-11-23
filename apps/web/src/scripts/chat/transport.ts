import type { ChatRequestPayload, ChatResponsePayload } from './types';

export type ChatTransportConfig = {
  endpoint: string;
  timeoutMs: number;
  maxAttempts: number;
  backoffMs: number;
};

export type ChatTransport = {
  send(payload: ChatRequestPayload): Promise<ChatResponsePayload>;
  stream(payload: ChatRequestPayload, onChunk: (chunk: string) => void): Promise<void>;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export function createChatTransport(config: ChatTransportConfig): ChatTransport {
  const { endpoint, timeoutMs, maxAttempts, backoffMs } = config;

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
    onChunk: (chunk: string) => void,
    attempt = 1
  ): Promise<void> => {
    try {
      const response = await fetch('/v1/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

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

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      if (attempt < maxAttempts) {
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
