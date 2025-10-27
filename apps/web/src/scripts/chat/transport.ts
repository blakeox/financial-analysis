import type { ChatRequestPayload, ChatResponsePayload } from './types';

export type ChatTransportConfig = {
  endpoint: string;
  timeoutMs: number;
  maxAttempts: number;
  backoffMs: number;
};

export type ChatTransport = {
  send(payload: ChatRequestPayload): Promise<ChatResponsePayload>;
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

  return {
    send(payload) {
      return fetchWithRetry(payload);
    },
  };
}
